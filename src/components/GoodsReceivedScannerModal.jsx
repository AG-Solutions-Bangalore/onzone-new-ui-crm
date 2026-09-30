import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Scan,
  Barcode,
  Search,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Loader2,
  Package,
  Calendar,
  Building2,
  Tag,
  Boxes,
  ExternalLink,
} from "lucide-react";
import BASE_URL from "@/config/BaseUrl";
import ScannerModel from "@/components/ScannerModel";
import moment from "moment";

export function GoodsReceivedScannerModal({ open, onOpenChange }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [inputCode, setInputCode] = useState("");
  const [searchedCode, setSearchedCode] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [matchedBoxInfo, setMatchedBoxInfo] = useState(null);
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | searching | found | not_found
  const [cameraActive, setCameraActive] = useState(false);
  const [orderBoxes, setOrderBoxes] = useState({});
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(false);

  // Fetch Goods Received List
  const { data: workorderrc, isLoading: isListLoading } = useQuery({
    queryKey: ["workorderrc"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-work-order-received-list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data?.workorderrc || [];
    },
    enabled: open,
  });

  // Reset and focus when modal opens
  useEffect(() => {
    if (open) {
      setInputCode("");
      setSearchedCode("");
      setSearchResult(null);
      setMatchedBoxInfo(null);
      setSearchStatus("idle");
      setCameraActive(false);
      setOrderBoxes({});
      setIsLoadingBoxes(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [open]);

  // Parse format like REC/OZ/<work_order_rc_no>, REC/OZ/<work_order_rc_no>/<box>, /6/2, 6/2, etc.
  const parseCodeAndBox = (raw) => {
    let text = (raw || "").trim();
    if (!text) return { rcNo: "", targetBox: null };

    // Strip comments in parentheses, e.g. "/6(Work Order Rc No)/2(box number)" -> "/6/2"
    text = text.replace(/\([^)]*\)/g, "").trim();

    // Check for REC/OZ prefix pattern with any work_order_rc_no and optional box:
    // e.g. "REC/OZ/81", "REC/OZ/81/2", "REC / OZ / 81", "REC/OZ/ 81 / Box 2", "REC-OZ-81-2"
    const recOzPrefixRegex = /^REC\s*[\/\-_]\s*OZ\s*[\/\-_]\s*/i;
    if (recOzPrefixRegex.test(text)) {
      const rest = text.replace(recOzPrefixRegex, "").trim();
      if (rest.includes("/")) {
        const parts = rest.split("/").map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const rawBox = parts[parts.length - 1].replace(/^box[\s-_]?/i, "").trim();
          const rc = parts.slice(0, parts.length - 1).join("/");
          return { rcNo: rc, targetBox: rawBox };
        }
        return { rcNo: parts[0] || rest, targetBox: null };
      }
      if (rest.includes("-")) {
        const parts = rest.split("-").map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2 && !isNaN(parts[parts.length - 1])) {
          return { rcNo: parts.slice(0, -1).join("-"), targetBox: parts[parts.length - 1] };
        }
      }
      return { rcNo: rest, targetBox: null };
    }

    // Remove leading slash if any: "/6/2" -> "6/2"
    if (text.startsWith("/")) {
      text = text.slice(1).trim();
    }

    // Check if format has multiple parts
    if (text.includes("/")) {
      const parts = text.split("/").map((p) => p.trim()).filter(Boolean);
      // e.g. ["REC", "OZ", "81"]
      if (parts.length === 3 && isNaN(parts[0]) && isNaN(parts[1])) {
        return { rcNo: parts[2], targetBox: null };
      }
      // e.g. ["REC", "OZ", "81", "2"]
      if (parts.length >= 4 && isNaN(parts[0]) && isNaN(parts[1])) {
        const rawBox = parts[3].replace(/^box[\s-_]?/i, "").trim();
        return { rcNo: parts[2], targetBox: rawBox };
      }
      // e.g. ["6", "2"]
      if (parts.length >= 2) {
        const rcPart = parts[0];
        const rawBox = parts[parts.length - 1];
        const cleanBox = rawBox.replace(/^box[\s-_]?/i, "").trim();
        return { rcNo: rcPart, targetBox: cleanBox || rawBox };
      }
    }

    // Pattern 2: Hyphen separated e.g. "6-2"
    if (text.includes("-")) {
      const parts = text.split("-").map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { rcNo: parts[0], targetBox: parts[1] };
      }
    }

    // Pattern 3: Simple string (just RC No or order ID)
    return { rcNo: text, targetBox: null };
  };

  const handleOpenOrder = (order, targetBox = null) => {
    onOpenChange(false);
    navigate(
      `/order-received/dc-receipt/${order.id}${targetBox ? `?box=${targetBox}` : ""}`,
      {
        state: {
          orderReceivedStatus: order.work_order_rc_status,
          autoOpenBox: targetBox || null,
          singleBox: targetBox || null,
          workOrderRow: order,
          workOrderRcNo: order.work_order_rc_no,
        },
      }
    );
  };

  // Fetch box details for an order so we can show each box
  const fetchBoxesForOrder = async (orderId, fallbackBoxCount = 1) => {
    try {
      setIsLoadingBoxes(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${BASE_URL}/api/fetch-work-order-received-view-by-id/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const subs = res.data?.workorderrcsub || [];
      const boxMap = {};

      subs.forEach((item) => {
        const box = String(item.work_order_rc_sub_box || "1");
        if (!boxMap[box]) {
          boxMap[box] = {
            boxNumber: box,
            totalPcs: 0,
            allReceived: true,
          };
        }
        if (item.work_order_rc_sub_barcode) {
          const count = item.work_order_rc_sub_barcode
            .split(",")
            .filter((b) => b.trim()).length;
          boxMap[box].totalPcs += count;
        }
        const isRec =
          item.work_order_rc_sub_status?.toLowerCase() === "received" ||
          item.status?.toLowerCase() === "received";
        if (!isRec) {
          boxMap[box].allReceived = false;
        }
      });

      let list = Object.values(boxMap);
      if (list.length === 0) {
        const count = parseInt(fallbackBoxCount) || 1;
        for (let i = 1; i <= count; i++) {
          list.push({ boxNumber: String(i), totalPcs: 0, allReceived: false });
        }
      }

      list.sort((a, b) => Number(a.boxNumber) - Number(b.boxNumber));
      setOrderBoxes((prev) => ({ ...prev, [orderId]: list }));
    } catch (e) {
      console.error("Error fetching order boxes", e);
      const count = parseInt(fallbackBoxCount) || 1;
      const list = [];
      for (let i = 1; i <= count; i++) {
        list.push({ boxNumber: String(i), totalPcs: 0, allReceived: false });
      }
      setOrderBoxes((prev) => ({ ...prev, [orderId]: list }));
    } finally {
      setIsLoadingBoxes(false);
    }
  };

  // Execute Search for entered or scanned barcode
  const handlePerformSearch = async (rawCode) => {
    const code = (rawCode || "").trim();
    if (!code) return;

    setSearchedCode(code);
    setSearchStatus("searching");
    setSearchResult(null);
    setMatchedBoxInfo(null);

    const { rcNo, targetBox } = parseCodeAndBox(code);
    const normalizedRc = (rcNo || "").toLowerCase().trim();
    const token = localStorage.getItem("token");

    const rawNormalized = code.toLowerCase().trim();

    // Priority 1: Exact match on Work Order RC No (e.g. "81" or "REC/OZ/81")
    let matches = (workorderrc || []).filter((order) => {
      const rcNoVal = String(order.work_order_rc_no || "").trim().toLowerCase();
      if (!rcNoVal) return false;
      return (
        rcNoVal === normalizedRc ||
        rcNoVal === rawNormalized ||
        `rec/oz/${rcNoVal}` === rawNormalized ||
        rcNoVal.endsWith(`/${normalizedRc}`) ||
        (!isNaN(rcNoVal) && !isNaN(normalizedRc) && Number(rcNoVal) === Number(normalizedRc))
      );
    });

    // Priority 2: Exact match on DC Number (if not matched by RC No)
    if (matches.length === 0) {
      matches = (workorderrc || []).filter((order) => {
        const dcNoVal = String(order.work_order_rc_dc_no || "").trim().toLowerCase();
        return dcNoVal === normalizedRc || dcNoVal === rawNormalized;
      });
    }

    // Priority 3: Exact match on Order ID (only if not matched by RC No or DC No)
    if (matches.length === 0) {
      matches = (workorderrc || []).filter((order) => {
        const idVal = String(order.id || "").trim().toLowerCase();
        return idVal === normalizedRc;
      });
    }

    // Priority 4: Contains / Partial match as final fallback if nothing exact was found
    if (matches.length === 0) {
      matches = (workorderrc || []).filter((order) => {
        const rcNoVal = String(order.work_order_rc_no || "").trim().toLowerCase();
        const dcNoVal = String(order.work_order_rc_dc_no || "").trim().toLowerCase();
        const refVal = String(order.work_order_rc_w_ref || "").trim().toLowerCase();

        return (
          rcNoVal.includes(normalizedRc) ||
          dcNoVal.includes(normalizedRc) ||
          refVal.includes(normalizedRc)
        );
      });
    }

    if (matches.length > 0) {
      if (targetBox) {
        // If a specific box was provided in the scan (e.g. REC/OZ/80/2), open that box details immediately!
        handleOpenOrder(matches[0], targetBox);
        return;
      }

      // Show this section for REC/OZ/<any_rc_no> with the order details, all box cards, and Open DC button
      setSearchResult(matches);
      setSearchStatus("found");
      matches.forEach((m) => {
        fetchBoxesForOrder(m.id, m.work_order_rc_box);
      });
      return;
    }

    // 2. Deep Search: Check if scanned barcode is inside a Box within recent orders
    try {
      const candidateOrders = (workorderrc || []).slice(0, 15);
      let foundOrder = null;
      let matchedBox = null;

      for (const order of candidateOrders) {
        try {
          const detailRes = await axios.get(
            `${BASE_URL}/api/fetch-work-order-received-view-by-id/${order.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const subs = detailRes.data?.workorderrcsub || [];

          for (const sub of subs) {
            const barcodes = (sub.work_order_rc_sub_barcode || "")
              .split(",")
              .map((b) => b.trim().toLowerCase());

            if (barcodes.includes(normalizedRc)) {
              foundOrder = order;
              matchedBox = sub.work_order_rc_sub_box;
              break;
            }
          }

          if (foundOrder) break;
        } catch {
          // ignore single order detail error
        }
      }

      if (foundOrder) {
        handleOpenOrder(foundOrder, targetBox || matchedBox);
        return;
      }
    } catch (err) {
      console.error("Deep search error:", err);
    }

    // Not found
    setSearchStatus("not_found");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePerformSearch(inputCode);
    }
  };

  const handleCameraScan = (scannedVal) => {
    if (!scannedVal) return;
    setInputCode(scannedVal);
    setCameraActive(false);
    handlePerformSearch(scannedVal);
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase().trim().replace(/[\s_-]+/g, "");
    if (s === "ontheway") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          On the Way
        </span>
      );
    }
    if (s === "packed") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-300">
          Packed
        </span>
      );
    }
    if (s === "received") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
          Received
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
        {status || "Unknown"}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-[#FAF9F6] border-stone-300 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="bg-[#161719] px-6 py-3 text-stone-100 border-b border-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#E5D7C3] flex items-center justify-center text-stone-950 shadow-xs">
                <Scan className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  Goods Received Scanner
                </DialogTitle>
        
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-stone-400 hover:text-white rounded-lg p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Barcode Input Bar */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Scan or type(RC_No/Box_No)..."
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-9 h-11 text-sm bg-white border-stone-300 rounded-xl focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 shadow-2xs text-stone-900 font-medium font-mono"
                />
                {inputCode && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputCode("");
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Button
                type="button"
                onClick={() => handlePerformSearch(inputCode)}
                disabled={!inputCode.trim() || searchStatus === "searching"}
                className="h-11 px-4 bg-[#543D2B] hover:bg-[#3D2C1F] text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {searchStatus === "searching" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>Search</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setCameraActive(!cameraActive)}
                className={`h-11 px-3 rounded-xl border-stone-300 transition-colors shadow-2xs cursor-pointer ${cameraActive
                    ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                    : "bg-white text-stone-700 hover:bg-stone-100"
                  }`}
                title={cameraActive ? "Turn off camera" : "Scan with camera"}
              >
                {cameraActive ? (
                  <CameraOff className="h-4 w-4" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            {/* <p className="text-[11px] text-stone-500 flex items-center justify-between px-1">
              <span>Supports format: <strong className="text-stone-700 font-mono">/RC No/Box No</strong> (e.g. <code className="bg-stone-200/80 px-1 rounded text-stone-800">/6/2</code>)</span>
              <span className="text-[#A27B5C] font-semibold">Auto-opens box</span>
            </p> */}
          </div>

          {/* Camera Scanner Container */}
          {cameraActive && (
            <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 text-center space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between text-xs text-stone-300 px-1">
                <span className="font-semibold flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5 text-[#E5D7C3]" /> Camera Active
                </span>
                <button
                  type="button"
                  onClick={() => setCameraActive(false)}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-white/10 bg-black flex justify-center py-2">
                <ScannerModel barcodeScannerValue={handleCameraScan} />
              </div>
              <p className="text-[11px] text-stone-400">
                Position barcode or QR inside camera view
              </p>
            </div>
          )}

          {/* Status: Searching */}
          {searchStatus === "searching" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 className="h-7 w-7 text-[#A27B5C] animate-spin" />
              <p className="text-xs font-semibold text-stone-700">
                Searching Goods Received orders for &ldquo;{searchedCode}&rdquo;...
              </p>
            </div>
          )}

          {/* Status: Found Order(s) */}
          {searchStatus === "found" && searchResult && searchResult.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-green-700 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {searchResult.length === 1
                    ? "Matching Order Found"
                    : `${searchResult.length} Orders Match "${searchedCode}"`}
                </span>
                {matchedBoxInfo && (
                  <span className="text-[11px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                    Box #{matchedBoxInfo}
                  </span>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
                {searchResult.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 bg-white rounded-xl border border-stone-200 hover:border-[#A27B5C] shadow-2xs transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-stone-900 font-heading">
                            {order.work_order_rc_dc_no || "No DC No"}
                          </span>
                          {getStatusBadge(order.work_order_rc_status)}
                        </div>
                        <p className="text-xs text-stone-500 font-mono mt-0.5">
                          RC: {order.work_order_rc_no || `#${order.id}`}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenOrder(order, null)}
                        className="bg-[#543D2B] hover:bg-[#3D2C1F] text-white text-xs font-bold rounded-lg px-3 py-1.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Open DC</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 text-xs text-stone-600">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase">Factory</span>
                        <span className="font-semibold text-stone-800 truncate block">
                          {order.work_order_rc_factory || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase">Brand</span>
                        <span className="font-semibold text-stone-800 truncate block">
                          {order.work_order_rc_brand || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase">Boxes / Pcs</span>
                        <span className="font-semibold text-stone-800 block">
                          {order.work_order_rc_box || 0} Bx / {order.work_order_rc_pcs || 0} Pcs
                        </span>
                      </div>
                    </div>

                    {/* Boxes in this Work Order */}
                    <div className="pt-2.5 border-t border-stone-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800 flex items-center gap-1.5">
                          <Boxes className="h-3.5 w-3.5 text-[#543D2B]" />
                          Boxes in this Order ({orderBoxes[order.id]?.length || order.work_order_rc_box || 0}):
                        </span>
                        <span className="text-[11px] text-stone-500">
                          Click a box to scan / verify
                        </span>
                      </div>

                      {isLoadingBoxes && !orderBoxes[order.id] ? (
                        <div className="flex items-center justify-center py-3 text-xs text-stone-500 gap-1.5 bg-stone-50 rounded-lg">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A27B5C]" />
                          <span>Loading box details...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {(
                            orderBoxes[order.id] ||
                            Array.from({ length: parseInt(order.work_order_rc_box) || 1 }, (_, i) => ({
                              boxNumber: String(i + 1),
                              totalPcs: 0,
                            }))
                          ).map((b) => (
                            <button
                              key={b.boxNumber}
                              type="button"
                              onClick={() => handleOpenOrder(order, b.boxNumber)}
                              className="p-2.5 rounded-lg border border-stone-200 hover:border-[#A27B5C] bg-[#FDFBF7]/70 hover:bg-[#FDFBF7] transition-all flex flex-col items-center justify-center gap-1 cursor-pointer group shadow-2xs hover:shadow-xs hover:ring-2 hover:ring-[#A27B5C]/20"
                            >
                              <span className="bg-[#E5D7C3] text-[#543D2B] font-bold text-xs px-2 py-0.5 rounded-md border border-[#D8C7B0]/80 group-hover:bg-[#543D2B] group-hover:text-white transition-colors flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                Box #{b.boxNumber}
                              </span>
                              {b.totalPcs > 0 && (
                                <span className="text-[11px] font-semibold text-stone-600">
                                  {b.totalPcs} Pcs
                                </span>
                              )}
                              <span className="text-[10px] text-[#A27B5C] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                Open Box →
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status: Not Found */}
          {searchStatus === "not_found" && (
            <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-800 font-semibold text-xs">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>No Goods Received order found for &ldquo;{searchedCode}&rdquo;</span>
              </div>
              <p className="text-[11px] text-red-600 pl-6">
                Please check the DC number or barcode, or view all orders in the Goods Received list.
              </p>
              <div className="pl-6 pt-1 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setInputCode("");
                    setSearchStatus("idle");
                    inputRef.current?.focus();
                  }}
                  className="h-7 text-xs bg-white border-red-200 text-red-800 hover:bg-red-100/50"
                >
                  Try Again
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/factory-outlet/received");
                  }}
                  className="h-7 text-xs bg-[#543D2B] hover:bg-[#3D2C1F] text-white"
                >
                  View All Orders
                </Button>
              </div>
            </div>
          )}

          {/* Recent Goods Received Quick Links */}
          {searchStatus === "idle" && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold px-0.5">
                <span>Recent Goods Received</span>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/factory-outlet/received");
                  }}
                  className="text-[#A27B5C] hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>View full list</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              {isListLoading ? (
                <div className="py-4 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading orders...
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(workorderrc || []).slice(0, 4).map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleOpenOrder(order)}
                      className="p-2.5 bg-white rounded-xl border border-stone-200/80 hover:border-[#A27B5C] hover:bg-[#FDFBF7] transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-800 truncate font-heading group-hover:text-[#543D2B]">
                            {order.work_order_rc_dc_no || order.work_order_rc_no || `#${order.id}`}
                          </span>
                          {getStatusBadge(order.work_order_rc_status)}
                        </div>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                          {order.work_order_rc_factory} &bull; {order.work_order_rc_brand}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-stone-400 group-hover:text-[#543D2B] transition-colors shrink-0">
                        <span className="text-[11px] font-semibold hidden sm:inline">Open</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GoodsReceivedScannerModal;
