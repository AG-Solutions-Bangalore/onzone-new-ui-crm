import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  X,
  Loader2,
  Package,
  Calendar,
  Building2,
  Boxes,
  Plus,
  PackageCheck,
} from "lucide-react";
import BASE_URL from "@/config/BaseUrl";
import ScannerModel from "@/components/ScannerModel";
import moment from "moment";

export function BoxScannerModal({ open, onOpenChange, onAddBoxItems }) {
  const inputRef = useRef(null);

  const [inputCode, setInputCode] = useState("");
  const [searchedCode, setSearchedCode] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | searching | found | not_found
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderBoxData, setOrderBoxData] = useState([]);
  const [selectedBoxKey, setSelectedBoxKey] = useState("ALL"); // "ALL" or boxNumber like "1"
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch Goods Received Orders list
  const { data: workorderrc = [] } = useQuery({
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
    staleTime: 2 * 60 * 1000,
  });

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setInputCode("");
      setSearchedCode("");
      setSearchStatus("idle");
      setCameraActive(false);
      setSelectedOrder(null);
      setOrderBoxData([]);
      setSelectedBoxKey("ALL");
      setErrorMessage("");

      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [open]);

  // Parse code and optional box number (e.g. REC/OZ/81, REC/OZ/81/1, 81, 81/1)
  const parseCodeAndBox = (raw) => {
    let text = (raw || "").trim();
    if (!text) return { rcNo: "", targetBox: null };

    // Strip comments in parentheses
    text = text.replace(/\([^)]*\)/g, "").trim();

    // Check for REC/OZ prefix pattern
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
      }
      return { rcNo: rest, targetBox: null };
    }

    if (text.includes("/")) {
      const parts = text.split("/").map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const rawBox = parts[parts.length - 1].replace(/^box[\s-_]?/i, "").trim();
        const rc = parts.slice(0, parts.length - 1).join("/");
        return { rcNo: rc, targetBox: rawBox };
      }
    }

    return { rcNo: text, targetBox: null };
  };

  // Perform search when code is entered or scanned
  const handlePerformSearch = async (rawCode) => {
    const code = (rawCode || "").trim();
    if (!code) return;

    setSearchedCode(code);
    setSearchStatus("searching");
    setSelectedOrder(null);
    setOrderBoxData([]);
    setErrorMessage("");

    const { rcNo, targetBox } = parseCodeAndBox(code);
    const normalizedRc = (rcNo || "").toLowerCase().trim();
    const rawNormalized = code.toLowerCase().trim();
    const token = localStorage.getItem("token");

    // Match order from workorderrc
    let matchedOrder = (workorderrc || []).find((order) => {
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

    // Fallback match on DC number
    if (!matchedOrder) {
      matchedOrder = (workorderrc || []).find((order) => {
        const dcNoVal = String(order.work_order_rc_dc_no || "").trim().toLowerCase();
        return dcNoVal === normalizedRc || dcNoVal === rawNormalized;
      });
    }

    // Fallback match on ID
    if (!matchedOrder) {
      matchedOrder = (workorderrc || []).find((order) => {
        const idVal = String(order.id || "").trim().toLowerCase();
        return idVal === normalizedRc;
      });
    }

    if (!matchedOrder) {
      setSearchStatus("not_found");
      setErrorMessage(`No goods received order found matching "${code}". Please check the reference number.`);
      return;
    }

    // Found order! Now fetch order items view
    try {
      const detailRes = await axios.get(
        `${BASE_URL}/api/fetch-work-order-received-view-by-id/${matchedOrder.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const subs = detailRes.data?.workorderrcsub || [];
      if (!subs || subs.length === 0) {
        setSearchStatus("not_found");
        setErrorMessage("Order found, but no box items or garment barcodes were recorded in it.");
        return;
      }

      // Group items by box
      const boxMap = {};

      subs.forEach((item) => {
        const boxNo = String(item.work_order_rc_sub_box || "1").trim();
        if (!boxMap[boxNo]) {
          boxMap[boxNo] = {
            boxNumber: boxNo,
            totalPcs: 0,
            aggregatedItems: {},
            rawBarcodes: [],
          };
        }

        const barcodeStr = String(item.work_order_rc_sub_barcode || "").trim();
        const barcodesList = barcodeStr
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean);

        const size = item.finished_stock_size || item.size || "-";
        const amount =
          item.finished_stock_amount !== undefined &&
          item.finished_stock_amount !== null &&
          item.finished_stock_amount !== ""
            ? item.finished_stock_amount
            : item.amount || item.mrp || "-";

        if (barcodesList.length > 0) {
          barcodesList.forEach((barcode) => {
            boxMap[boxNo].rawBarcodes.push(barcode);
            boxMap[boxNo].totalPcs += 1;

            const aggKey = `${barcode}|${size}|${amount}`;
            if (!boxMap[boxNo].aggregatedItems[aggKey]) {
              boxMap[boxNo].aggregatedItems[aggKey] = {
                barcode,
                size,
                amount,
                quantity: 0,
                barcodes: [],
              };
            }
            boxMap[boxNo].aggregatedItems[aggKey].quantity += 1;
            boxMap[boxNo].aggregatedItems[aggKey].barcodes.push(barcode);
          });
        }
      });

      const parsedBoxes = Object.values(boxMap).map((b) => ({
        boxNumber: b.boxNumber,
        totalPcs: b.totalPcs,
        items: Object.values(b.aggregatedItems),
        rawBarcodes: b.rawBarcodes,
      }));

      parsedBoxes.sort((a, b) => Number(a.boxNumber) - Number(b.boxNumber));

      setSelectedOrder(matchedOrder);
      setOrderBoxData(parsedBoxes);
      setSearchStatus("found");

      if (targetBox && parsedBoxes.some((b) => b.boxNumber === String(targetBox))) {
        setSelectedBoxKey(String(targetBox));
      } else if (parsedBoxes.length === 1) {
        setSelectedBoxKey(parsedBoxes[0].boxNumber);
      } else {
        setSelectedBoxKey("ALL");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setSearchStatus("not_found");
      setErrorMessage("Error retrieving box details from the server.");
    }
  };

  // Determine which items to display & add based on selected box key
  const activeBoxSelection = useMemo(() => {
    if (!orderBoxData || orderBoxData.length === 0) {
      return { totalPcs: 0, items: [], rawBarcodes: [], label: "" };
    }

    if (selectedBoxKey === "ALL") {
      const allBarcodes = [];
      const aggregated = {};
      let totalPcs = 0;

      orderBoxData.forEach((box) => {
        totalPcs += box.totalPcs;
        allBarcodes.push(...box.rawBarcodes);

        box.items.forEach((item) => {
          const key = `${item.barcode}|${item.size}|${item.amount}`;
          if (!aggregated[key]) {
            aggregated[key] = {
              barcode: item.barcode,
              size: item.size,
              amount: item.amount,
              quantity: 0,
            };
          }
          aggregated[key].quantity += item.quantity;
        });
      });

      return {
        totalPcs,
        items: Object.values(aggregated),
        rawBarcodes: allBarcodes,
        label: `All Boxes (${orderBoxData.length} Box${orderBoxData.length > 1 ? "es" : ""})`,
        boxCount: orderBoxData.length,
      };
    }

    const foundBox = orderBoxData.find((b) => b.boxNumber === selectedBoxKey);
    if (foundBox) {
      return {
        totalPcs: foundBox.totalPcs,
        items: foundBox.items,
        rawBarcodes: foundBox.rawBarcodes,
        label: `Box #${foundBox.boxNumber}`,
        boxCount: 1,
      };
    }

    return { totalPcs: 0, items: [], rawBarcodes: [], label: "", boxCount: 0 };
  }, [orderBoxData, selectedBoxKey]);

  // Handle adding box items to the sales packing form
  const handleAddItems = () => {
    if (!activeBoxSelection || activeBoxSelection.rawBarcodes.length === 0) return;

    if (onAddBoxItems) {
      onAddBoxItems({
        barcodes: activeBoxSelection.rawBarcodes,
        boxNumber: selectedBoxKey,
        boxLabel: activeBoxSelection.label,
        boxCount: activeBoxSelection.boxCount || 1,
        totalPcs: activeBoxSelection.totalPcs,
        orderRef: `REC/OZ/${selectedOrder?.work_order_rc_no || selectedOrder?.id}`,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] rounded-2xl p-0 overflow-hidden bg-white border border-stone-200 shadow-2xl">
        {/* Modal Header */}
        <DialogHeader className="p-4 sm:p-5 bg-[#FDFBF7] border-b border-stone-200/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#543D2B] text-white shadow-2xs">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
                Box Barcode Scanner
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 font-medium">
                Scan the master box barcode (e.g. <strong className="text-stone-700">REC/OZ/81</strong>) to load and add all box items instantly.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Scanner Input Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <Input
                ref={inputRef}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePerformSearch(inputCode);
                  }
                }}
                placeholder="Scan or enter box barcode (e.g. REC/OZ/81)..."
                className="h-10 pl-10 pr-3 font-mono text-xs uppercase bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-900 shadow-2xs font-semibold placeholder:font-sans placeholder:normal-case"
              />
            </div>

            <Button
              type="button"
              onClick={() => handlePerformSearch(inputCode)}
              disabled={!inputCode.trim() || searchStatus === "searching"}
              className="h-10 px-4 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              {searchStatus === "searching" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setCameraActive(!cameraActive)}
              className={`h-10 px-3 rounded-xl border text-xs font-semibold transition-all shrink-0 ${
                cameraActive
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-[#F5F2EB]"
              }`}
              title={cameraActive ? "Turn off camera" : "Use device camera"}
            >
              {cameraActive ? (
                <CameraOff className="h-4 w-4" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Live Camera Scanner */}
          {cameraActive && (
            <div className="rounded-xl border border-stone-200 bg-stone-900 p-3 text-center space-y-2">
              <p className="text-[11px] text-stone-300 font-medium">
                Align the box barcode within the camera view
              </p>
              <div className="flex justify-center overflow-hidden rounded-lg">
                <ScannerModel
                  barcodeScannerValue={(val) => {
                    if (val) {
                      setInputCode(val);
                      setCameraActive(false);
                      handlePerformSearch(val);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Not Found Alert */}
          {searchStatus === "not_found" && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Order Not Found</p>
                <p className="text-[11px] text-red-600 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Search Result View */}
          {searchStatus === "found" && selectedOrder && (
            <div className="space-y-4">
              {/* Order Summary Card */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E6DEC9] text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DEC9]/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">
                      REC/OZ/{selectedOrder.work_order_rc_no || selectedOrder.id}
                    </span>
                    {selectedOrder.work_order_rc_dc_no && (
                      <span className="text-stone-500 font-medium">
                        (DC #{selectedOrder.work_order_rc_dc_no})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-600 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-stone-400" />
                    {selectedOrder.work_order_rc_date
                      ? moment(selectedOrder.work_order_rc_date).format("DD-MMM-YYYY")
                      : "-"}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-stone-400 block font-medium">Factory:</span>
                    <span className="font-bold text-stone-800 truncate block">
                      {selectedOrder.work_order_rc_factory || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-medium">Brand:</span>
                    <span className="font-bold text-stone-800 truncate block">
                      {selectedOrder.work_order_rc_brand || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-medium">Total Boxes:</span>
                    <span className="font-bold text-stone-800">
                      {orderBoxData.length} Box{orderBoxData.length > 1 ? "es" : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-medium">Total Pcs:</span>
                    <span className="font-bold text-[#543D2B]">
                      {orderBoxData.reduce((sum, b) => sum + b.totalPcs, 0)} Pcs
                    </span>
                  </div>
                </div>
              </div>

              {/* Box Selector Tabs */}
              {orderBoxData.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                    Select Box to Add:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedBoxKey("ALL")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        selectedBoxKey === "ALL"
                          ? "bg-[#543D2B] text-white border-[#543D2B] shadow-2xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-[#F5F2EB]"
                      }`}
                    >
                      All Boxes ({orderBoxData.reduce((sum, b) => sum + b.totalPcs, 0)} Pcs)
                    </button>

                    {orderBoxData.map((box) => (
                      <button
                        key={box.boxNumber}
                        type="button"
                        onClick={() => setSelectedBoxKey(box.boxNumber)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          selectedBoxKey === box.boxNumber
                            ? "bg-[#543D2B] text-white border-[#543D2B] shadow-2xs"
                            : "bg-white text-stone-700 border-stone-200 hover:bg-[#F5F2EB]"
                        }`}
                      >
                        Box #{box.boxNumber} ({box.totalPcs} Pcs)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Box Item Breakdown Table (Matching Document in Image 2) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-[#A27B5C]" />
                    {activeBoxSelection.label} (Total Pcs: {activeBoxSelection.totalPcs})
                  </h4>
                  <span className="text-[11px] font-semibold text-stone-500">
                    {activeBoxSelection.items.length} Unique Item Code(s)
                  </span>
                </div>

                <div className="rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                  <div className="max-h-[220px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-[#E5D7C3] text-[#543D2B] sticky top-0 z-10 shadow-2xs">
                        <tr>
                          <th className="py-2 px-3 text-left font-bold text-[11px] uppercase tracking-wider">
                            Barcode / T-Code
                          </th>
                          <th className="py-2 px-3 text-center font-bold text-[11px] uppercase tracking-wider">
                            Size
                          </th>
                          <th className="py-2 px-3 text-right font-bold text-[11px] uppercase tracking-wider">
                            Amount (₹)
                          </th>
                          <th className="py-2 px-3 text-center font-bold text-[11px] uppercase tracking-wider">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-stone-100">
                        {activeBoxSelection.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#FDFBF7] transition-colors">
                            <td className="py-2 px-3 font-mono font-bold text-stone-800">
                              {item.barcode}
                            </td>
                            <td className="py-2 px-3 text-center text-stone-700 font-medium">
                              {item.size}
                            </td>
                            <td className="py-2 px-3 text-right text-stone-800 font-mono font-semibold">
                              {item.amount !== "-" ? `₹${item.amount}` : "-"}
                            </td>
                            <td className="py-2 px-3 text-center font-extrabold text-[#543D2B]">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#FDFBF7] border-t border-stone-200/80 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-xl border-stone-200 text-stone-700 hover:bg-[#F5F2EB] text-xs font-semibold"
          >
            Cancel
          </Button>

          {searchStatus === "found" && activeBoxSelection.rawBarcodes.length > 0 && (
            <Button
              type="button"
              onClick={handleAddItems}
              className="h-10 px-6 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <PackageCheck className="h-4 w-4" />
              Add Box Items ({activeBoxSelection.totalPcs} Pcs)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BoxScannerModal;
