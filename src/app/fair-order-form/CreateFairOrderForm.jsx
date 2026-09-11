import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  ChevronLeft,
  Plus,
  Minus,
  Trash2,
  Loader2,
  ScanQrCode,
  Keyboard,
  X,
  Tag,
  Building2,
  FileText,
  Phone,
  Calendar,
  MessageSquare,
  PackageCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Select from "react-select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Page from "@/app/dashboard/page";
import BASE_URL from "@/config/BaseUrl";
import { useToast } from "@/hooks/use-toast";
import { useFetchRetailer } from "@/hooks/useApi";
import ScannerModel from "@/components/ScannerModel";

const ALL_SIZES = [
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "50",
];

const getSizeDisplayLabel = (sz) => {
  const map = {
    "36": "S-36",
    "38": "M-38",
    "40": "L-40",
    "42": "XL-42",
    "44": "2XL-44",
    "46": "3XL-46",
    "48": "4XL-48",
    "50": "5XL-50",
  };
  return map[sz] || sz;
};

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    borderColor: state.isFocused ? "#A27B5C" : "#E7E5E4",
    borderRadius: "0.75rem",
    minHeight: "2.5rem",
    height: "2.5rem",
    fontSize: "0.75rem",
    fontWeight: "500",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(162, 123, 92, 0.15)" : "none",
    "&:hover": {
      borderColor: "#A27B5C",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 0.75rem",
  }),
  input: (provided) => ({
    ...provided,
    margin: "0",
    padding: "0",
    fontSize: "0.75rem",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#A8A29E",
    fontSize: "0.75rem",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#1C1917",
    fontSize: "0.75rem",
    fontWeight: "600",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.75rem",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    border: "1px solid #E7E5E4",
    overflow: "hidden",
    zIndex: 50,
    backgroundColor: "#FFFFFF",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#543D2B"
      : state.isFocused
      ? "#F5F2EB"
      : "transparent",
    color: state.isSelected ? "#FFFFFF" : "#1C1917",
    fontSize: "0.75rem",
    fontWeight: state.isSelected ? "600" : "500",
    cursor: "pointer",
    padding: "0.5rem 0.75rem",
  }),
};

const CreateFairOrderForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const typingBarcodeInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fair_order_retailer: "",
    fair_order_gst_no: "",
    fair_order_retailer_mobile: "",
    fair_order_delivery_date: "",
    fair_order_remarks: "",
  });

  // Entry Mode state: 'typing' or 'scanner'
  const [entryMode, setEntryMode] = useState("typing");

  // Typing Mode State
  const [typingBarcode, setTypingBarcode] = useState("");

  // Size Modal State for Barcode
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [activeVerifiedStock, setActiveVerifiedStock] = useState(null);
  const [selectedSizesGrid, setSelectedSizesGrid] = useState([]);

  // Sub items list
  const [subItems, setSubItems] = useState([]);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Fetch Retailers list
  const { data: retailerData, isFetching: isRetailerLoading } = useFetchRetailer();

  // Fetch Stock list for verification
  const {
    data: stockList = [],
    isLoading: isStockLoading,
    refetch: refetchStock,
  } = useQuery({
    queryKey: ["fairOrderStock"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${BASE_URL}/api/fetch-fair-order-stock-list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data?.fairOrderStock || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const retailerOptions = (retailerData?.customer || []).map((r) => ({
    value: r.customer_name || r.name,
    label: `${r.customer_name || r.name} ${r.customer_mobile ? `(${r.customer_mobile})` : ""}`,
    mobile: r.customer_mobile || "",
    gst: r.customer_gst_no || "",
  }));

  const handleRetailerSelect = (selected) => {
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        fair_order_retailer: selected.value,
        fair_order_retailer_mobile: selected.mobile || prev.fair_order_retailer_mobile,
        fair_order_gst_no: selected.gst || prev.fair_order_gst_no,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        fair_order_retailer: "",
      }));
    }
  };

  // Step 1: Verify Barcode entered in Typing or Scanner Mode
  const handleVerifyBarcodeValue = async (code) => {
    const trimmed = String(code || "").trim();
    if (!trimmed) {
      toast({
        title: "Barcode Required",
        description: "Please enter or scan a barcode number to verify stock",
        variant: "destructive",
      });
      return;
    }

    const { data: freshStock } = await refetchStock();
    const activeStock = Array.isArray(freshStock) ? freshStock : stockList;

    const matchedStock = activeStock.find(
      (item) =>
        String(item.fair_barcode) === trimmed ||
        String(item.fair_barcode_main) === trimmed
    );

    if (!matchedStock) {
      toast({
        title: "Stock Unavailable",
        description: `Barcode "${trimmed}" is not available in fair order stock`,
        variant: "destructive",
      });
      return;
    }

    const availableQty =
      parseInt(matchedStock.stock ?? matchedStock.fair_temp_qnty ?? 0, 10);

    if (availableQty <= 0) {
      toast({
        title: "Out of Stock",
        description: `Stock for barcode "${trimmed}" is 0 or depleted`,
        variant: "destructive",
      });
      return;
    }

    // Barcode verified! Set active stock item & open size grid popup
    setActiveVerifiedStock({
      raw: matchedStock,
      barcode: trimmed,
    });
    setSelectedSizesGrid([]);
    setSizeModalOpen(true);
  };

  // Toggle size pill selection in Grid Modal
  const toggleSizeSelection = (sz) => {
    setSelectedSizesGrid((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  // Step 2: Confirm size selection and add items to order list
  const handleConfirmAddSizes = () => {
    if (!activeVerifiedStock) return;
    if (selectedSizesGrid.length === 0) {
      toast({
        title: "Select Size",
        description: "Please select at least one size to add",
        variant: "destructive",
      });
      return;
    }

    const { raw, barcode } = activeVerifiedStock;
    const availableStock = parseInt(raw.stock ?? raw.fair_temp_qnty ?? 0, 10);

    const existingTotalForBarcode = subItems
      .filter((i) => String(i.fair_order_sub_barcode) === String(barcode))
      .reduce(
        (acc, curr) => acc + (parseInt(curr.fair_order_sub_quantity, 10) || 0),
        0
      );

    const requestedNewQty = selectedSizesGrid.length;
    const totalAfterAddition = existingTotalForBarcode + requestedNewQty;

    if (totalAfterAddition > availableStock) {
      toast({
        title: "Stock Limit Exceeded",
        description: `Barcode "${barcode}" has only ${availableStock} in stock. Total requested quantity would be ${totalAfterAddition}.`,
        variant: "destructive",
      });
      return;
    }

    const newAddedItems = [];

    selectedSizesGrid.forEach((szNum) => {
      const sizeVal = getSizeDisplayLabel(szNum);
      const existingIndex = subItems.findIndex(
        (i) =>
          i.fair_order_sub_barcode === barcode &&
          i.fair_order_sub_dress_size === sizeVal
      );

      if (existingIndex >= 0) {
        setSubItems((prev) =>
          prev.map((item, idx) =>
            idx === existingIndex
              ? {
                  ...item,
                  fair_order_sub_quantity: item.fair_order_sub_quantity + 1,
                }
              : item
          )
        );
      } else {
        newAddedItems.push({
          id: `${Date.now()}-${szNum}`,
          fair_order_sub_barcode_main:
            raw.fair_barcode_main || raw.fair_barcode || barcode,
          fair_order_sub_barcode:
            raw.fair_barcode || raw.fair_barcode_main || barcode,
          fair_order_sub_barcode_type: raw.fair_barcode_type || "S",
          fair_order_sub_dress_type: raw.fair_dress_type || "S",
          fair_order_sub_dress_size: sizeVal,
          fair_order_sub_mrp: raw.fair_mrp || "0",
          fair_order_sub_quantity: 1,
        });
      }
    });

    if (newAddedItems.length > 0) {
      setSubItems((prev) => [...newAddedItems, ...prev]);
    }

    toast({
      title: "Items Added",
      description: `Added ${selectedSizesGrid.length} size(s) for Barcode: ${barcode}`,
    });

    setSizeModalOpen(false);
    setActiveVerifiedStock(null);
    setSelectedSizesGrid([]);
    setTypingBarcode("");

    if (typingBarcodeInputRef.current) {
      typingBarcodeInputRef.current.focus();
    }
  };

  const handleScannerScanResult = (scannedCode) => {
    setShowScannerModal(false);
    if (scannedCode) {
      handleVerifyBarcodeValue(scannedCode);
    }
  };

  const handleQuantityChange = (id, delta) => {
    const targetItem = subItems.find((i) => i.id === id);
    if (!targetItem) return;

    if (delta > 0) {
      const bCode = targetItem.fair_order_sub_barcode;
      const matchedStock = stockList.find(
        (stk) =>
          String(stk.fair_barcode) === String(bCode) ||
          String(stk.fair_barcode_main) === String(bCode)
      );
      const availableStock = matchedStock
        ? parseInt(matchedStock.stock ?? matchedStock.fair_temp_qnty ?? 0, 10)
        : 999;

      const currentTotalForBarcode = subItems
        .filter((i) => String(i.fair_order_sub_barcode) === String(bCode))
        .reduce(
          (acc, curr) => acc + (parseInt(curr.fair_order_sub_quantity, 10) || 0),
          0
        );

      if (currentTotalForBarcode + delta > availableStock) {
        toast({
          title: "Stock Limit Reached",
          description: `Cannot increase quantity. Maximum available stock for barcode "${bCode}" is ${availableStock}.`,
          variant: "destructive",
        });
        return;
      }
    }

    setSubItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.fair_order_sub_quantity + delta;
            return newQty > 0 ? { ...item, fair_order_sub_quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleSizeChange = (id, newSize) => {
    setSubItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, fair_order_sub_dress_size: newSize } : item
      )
    );
  };

  const handleRemoveSubItem = (id) => {
    setSubItems((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Item Removed",
      description: "Item removed from order",
    });
  };

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BASE_URL}/api/faircreateOrderForm`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Order Created",
        description: data?.msg || "Fair Order Form created successfully",
      });
      navigate("/fair-order-form");
    },
    onError: (err) => {
      toast({
        title: "Error Creating Order",
        description:
          err.response?.data?.message || err?.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fair_order_retailer.trim()) {
      toast({
        title: "Validation Error",
        description: "Retailer name is required",
        variant: "destructive",
      });
      return;
    }

    if (subItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one barcode item to the order",
        variant: "destructive",
      });
      return;
    }

    // Re-verify stock quantities against fairOrderStock
    const { data: freshStock } = await refetchStock();
    const activeStock = Array.isArray(freshStock) ? freshStock : stockList;

    const barcodeTotals = {};
    subItems.forEach((item) => {
      const bCode = String(item.fair_order_sub_barcode);
      const qty = parseInt(item.fair_order_sub_quantity, 10) || 0;
      barcodeTotals[bCode] = (barcodeTotals[bCode] || 0) + qty;
    });

    for (const [bCode, totalReqQty] of Object.entries(barcodeTotals)) {
      const matched = activeStock.find(
        (stk) =>
          String(stk.fair_barcode) === bCode ||
          String(stk.fair_barcode_main) === bCode
      );
      if (!matched) {
        toast({
          title: "Stock Verification Failed",
          description: `Barcode "${bCode}" is no longer available in stock.`,
          variant: "destructive",
        });
        return;
      }

      const availStock = parseInt(matched.stock ?? matched.fair_temp_qnty ?? 0, 10);
      if (totalReqQty > availStock) {
        toast({
          title: "Stock Limit Exceeded",
          description: `Barcode "${bCode}" has only ${availStock} available in stock, but order contains ${totalReqQty}. Please decrease quantity.`,
          variant: "destructive",
        });
        return;
      }
    }

    const payload = {
      fair_order_retailer: formData.fair_order_retailer,
      fair_order_gst_no: formData.fair_order_gst_no,
      fair_order_retailer_mobile: formData.fair_order_retailer_mobile,
      fair_order_delivery_date: formData.fair_order_delivery_date,
      fair_order_remarks: formData.fair_order_remarks,
      subs: subItems.map((item) => ({
        fair_order_sub_barcode_main: String(
          item.fair_order_sub_barcode_main || item.fair_order_sub_barcode
        ),
        fair_order_sub_barcode: String(item.fair_order_sub_barcode),
        fair_order_sub_barcode_type: String(
          item.fair_order_sub_barcode_type || "S"
        ),
        fair_order_sub_dress_type: String(
          item.fair_order_sub_dress_type || "S"
        ),
        fair_order_sub_dress_size: String(
          item.fair_order_sub_dress_size || "S-36"
        ),
        fair_order_sub_mrp: String(item.fair_order_sub_mrp || "0"),
        fair_order_sub_quantity: Number(item.fair_order_sub_quantity) || 1,
      })),
    };

    submitMutation.mutate(payload);
  };

  const totalSets = subItems.length;
  const totalItems = subItems.reduce(
    (acc, curr) => acc + (parseInt(curr.fair_order_sub_quantity, 10) || 0),
    0
  );

  return (
    <Page>
      <div className="w-full space-y-4 max-w-7xl mx-auto pt-1">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FDFBF7] border border-stone-200/80 px-5 py-3 rounded-2xl shadow-2xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A27B5C] flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" />
              Order Creation & Booking
            </span>
            <h1 className="font-heading text-lg font-bold text-stone-800 tracking-tight leading-tight mt-0.5">
              Create Order Form
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Search retailer, verify garment stock barcodes, and configure sizes.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-9 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs shadow-2xs font-semibold cursor-pointer"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Orders
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Section 1: Retailer & Order Information */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5F2EB] text-[#A27B5C]">
                <Building2 className="h-4 w-4" />
              </div>
              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                1. Retailer & Order Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Retailer Name */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-stone-400" />
                  Retailer Name <span className="text-red-500">*</span>
                </Label>
                {retailerOptions.length > 0 && (
                  <div className="mb-1.5">
                    <Select
                      options={retailerOptions}
                      placeholder="Search and select existing retailer..."
                      onChange={handleRetailerSelect}
                      isClearable
                      styles={customSelectStyles}
                      isLoading={isRetailerLoading}
                    />
                  </div>
                )}
                <Input
                  id="retailer"
                  placeholder="Or enter custom retailer name"
                  value={formData.fair_order_retailer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fair_order_retailer: e.target.value,
                    })
                  }
                  required
                  className="h-10 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs font-medium"
                />
              </div>

              {/* GST No */}
              <div className="space-y-1.5">
                <Label htmlFor="gst_no" className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-stone-400" />
                  GST Number
                </Label>
                <Input
                  id="gst_no"
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  value={formData.fair_order_gst_no}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fair_order_gst_no: e.target.value,
                    })
                  }
                  className="h-10 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs font-medium uppercase"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <Label htmlFor="mobile" className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-stone-400" />
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  placeholder="Retailer Contact Number"
                  value={formData.fair_order_retailer_mobile}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fair_order_retailer_mobile: e.target.value,
                    })
                  }
                  className="h-10 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs font-medium"
                />
              </div>

              {/* Delivery Date */}
              <div className="space-y-1.5">
                <Label htmlFor="delivery_date" className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  Expected Delivery Date
                </Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.fair_order_delivery_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fair_order_delivery_date: e.target.value,
                    })
                  }
                  className="h-10 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs font-medium"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1.5 lg:col-span-3">
                <Label htmlFor="remarks" className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-stone-400" />
                  Order Remarks / Instructions
                </Label>
                <Input
                  id="remarks"
                  placeholder="Special instructions, packaging notes, or fair references..."
                  value={formData.fair_order_remarks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fair_order_remarks: e.target.value,
                    })
                  }
                  className="h-10 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Barcode Verification & Garment Items */}
          <div className="bg-[#FDFBF7] border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            
            {/* Header & Mode Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200/70 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#543D2B] text-white">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    2. Garment Barcode Verification & Size Entry
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    Verify available stock and configure sizes for each garment style.
                  </p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="inline-flex rounded-xl p-1 bg-stone-200/70 border border-stone-300/60 shadow-inner">
                <button
                  type="button"
                  onClick={() => setEntryMode("typing")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    entryMode === "typing"
                      ? "bg-[#543D2B] text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  Typing Mode
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode("scanner")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    entryMode === "scanner"
                      ? "bg-[#543D2B] text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <ScanQrCode className="h-3.5 w-3.5" />
                  Scanner Mode
                </button>
              </div>
            </div>

            {/* TYPING MODE INPUT */}
            {entryMode === "typing" && (
              <div className="p-4 rounded-xl bg-white border border-stone-200/90 space-y-3 shadow-2xs">
                <div className="text-[11px] font-bold text-[#A27B5C] uppercase tracking-wider flex items-center gap-1.5">
                  <Keyboard className="h-3.5 w-3.5" />
                  Manual Barcode Lookup
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2.5 max-w-xl">
                  <div className="relative flex-1 w-full">
                    <Input
                      ref={typingBarcodeInputRef}
                      placeholder="ENTER BARCODE (e.g. 70701)..."
                      value={typingBarcode}
                      onChange={(e) => setTypingBarcode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleVerifyBarcodeValue(typingBarcode);
                        }
                      }}
                      className="h-10 pl-3 pr-8 font-mono text-xs uppercase tracking-wider bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-900 shadow-2xs font-semibold placeholder:font-sans placeholder:normal-case"
                    />
                    {typingBarcode && (
                      <button
                        type="button"
                        onClick={() => setTypingBarcode("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleVerifyBarcodeValue(typingBarcode)}
                    disabled={isStockLoading || !typingBarcode.trim()}
                    className="w-full sm:w-auto h-10 px-5 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isStockLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Verify Stock
                  </Button>
                </div>
              </div>
            )}

            {/* SCANNER MODE */}
            {entryMode === "scanner" && (
              <div className="p-4 rounded-xl bg-white border border-stone-200/90 space-y-3 shadow-2xs">
                <div className="text-[11px] font-bold text-[#A27B5C] uppercase tracking-wider flex items-center gap-1.5">
                  <ScanQrCode className="h-3.5 w-3.5" />
                  Camera / QR Scanner
                </div>
                <Button
                  type="button"
                  onClick={() => setShowScannerModal(true)}
                  className="h-11 px-6 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ScanQrCode className="h-4 w-4" />
                  Open Camera Scanner
                </Button>
              </div>
            )}

            {/* Verified Items List Cards */}
            <div className="space-y-2.5 pt-1">
              {subItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-stone-200/90 rounded-xl p-3.5 bg-white shadow-2xs hover:border-[#A27B5C] transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F5F2EB] text-[#A27B5C]">
                            <Tag className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-mono font-bold text-sm text-stone-900">
                            {item.fair_order_sub_barcode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubItem(item.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-700">
                          MRP: <span className="text-[#A27B5C] font-bold">₹{item.fair_order_sub_mrp}</span>
                        </span>
                        <span className="text-stone-500 font-medium text-[11px]">
                          Style: {item.fair_order_sub_dress_type}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        {/* Size Dropdown */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-stone-500">
                            Size:
                          </span>
                          <select
                            value={item.fair_order_sub_dress_size}
                            onChange={(e) =>
                              handleSizeChange(item.id, e.target.value)
                            }
                            className="h-8 rounded-lg border border-stone-200 bg-stone-50/60 px-2 text-xs font-bold text-stone-800 focus:ring-1 focus:ring-[#A27B5C] cursor-pointer"
                          >
                            {ALL_SIZES.map((sz) => {
                              const label = getSizeDisplayLabel(sz);
                              return (
                                <option key={sz} value={label}>
                                  {label}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Quantity Stepper (- QTY +) */}
                        <div className="flex items-center gap-1.5 border border-stone-200 rounded-lg p-0.5 bg-stone-50/50">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-stone-700 hover:bg-stone-100 shadow-2xs font-bold cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-mono font-bold text-xs px-2 text-stone-900">
                            {item.fair_order_sub_quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-stone-700 hover:bg-stone-100 shadow-2xs font-bold cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed border-stone-200 bg-white/60">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F2EB] text-[#A27B5C] mb-2">
                    <Tag className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-stone-700">
                    No items added yet
                  </p>
                  <p className="text-[11px] text-stone-400 max-w-xs mt-0.5">
                    Enter or scan barcode digits above to verify stock and select sizes.
                  </p>
                </div>
              )}
            </div>

            {/* Order Summary Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-[#F5F2EB] rounded-xl border border-[#E0D6CA] text-xs">
              <div>
                <span className="text-stone-600 font-medium">Selected Retailer: </span>
                <span className="font-bold text-stone-900">{formData.fair_order_retailer || "Not Selected"}</span>
                <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                  {subItems.length} unique barcode style(s) attached
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div className="bg-white/80 border border-stone-200 px-3 py-1.5 rounded-lg shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Styles</span>
                  <span className="text-sm font-black text-[#543D2B]">{totalSets}</span>
                </div>
                <div className="bg-white/80 border border-stone-200 px-3 py-1.5 rounded-lg shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Pieces</span>
                  <span className="text-sm font-black text-[#543D2B]">{totalItems}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="h-10 px-5 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs font-semibold shadow-2xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="h-10 px-6 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Creating Order Form...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="h-4 w-4" />
                  <span>Create Order Form</span>
                </>
              )}
            </Button>
          </div>

        </form>
      </div>

      {/* POPUP 1: Size Grid Modal (Elevated Luxury Theme) */}
      <Dialog open={sizeModalOpen} onOpenChange={setSizeModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-[#FAF8F5] border border-stone-200 shadow-2xl space-y-4">
          {/* Header Title */}
          <div>
            <span className="text-[10px] font-bold text-[#A27B5C] uppercase tracking-wider">
              Garment Size Selection
            </span>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight font-heading mt-0.5">
              Select Sizes · <span className="font-mono">{activeVerifiedStock?.barcode}</span>
            </h2>
          </div>

          {/* Stock & MRP Bar */}
          <div className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Stock Available: {activeVerifiedStock?.raw?.stock ?? activeVerifiedStock?.raw?.fair_temp_qnty ?? 0} Pcs
            </span>
            <span className="font-semibold text-stone-700">
              MRP: <span className="text-[#A27B5C] font-bold">₹{activeVerifiedStock?.raw?.fair_mrp || "0"}</span>
            </span>
          </div>

          {/* Quick Actions & Selection Badge */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-semibold text-stone-700">
              Selected:{" "}
              <span className="text-[#543D2B] font-extrabold text-sm font-mono">
                {selectedSizesGrid.length}
              </span>{" "}
              size(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSizesGrid([...ALL_SIZES])}
                className="text-[#A27B5C] hover:text-[#543D2B] font-bold hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={() => setSelectedSizesGrid([])}
                className="text-stone-500 hover:text-stone-800 font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Sizes Grid */}
          <div className="grid grid-cols-4 gap-2 max-h-[260px] overflow-y-auto p-1">
            {ALL_SIZES.map((sz) => {
              const isSelected = selectedSizesGrid.includes(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleSizeSelection(sz)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center select-none cursor-pointer ${
                    isSelected
                      ? "bg-[#543D2B] text-white shadow-sm scale-95"
                      : "bg-white text-stone-800 border border-stone-200 hover:bg-[#F5F2EB] shadow-2xs"
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => {
                setSizeModalOpen(false);
                setSelectedSizesGrid([]);
              }}
              className="text-stone-500 hover:text-stone-800 text-xs font-semibold px-2 cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="button"
              onClick={handleConfirmAddSizes}
              className="bg-[#543D2B] hover:bg-[#412E20] text-white font-bold px-6 py-2 rounded-xl text-xs shadow-sm cursor-pointer"
            >
              Add Selected Sizes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* POPUP 2: Mobile Camera Scanner Modal */}
      <Dialog open={showScannerModal} onOpenChange={setShowScannerModal}>
        <DialogContent className="max-w-md rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-stone-800">Scan Barcode</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <ScannerModel barcodeScannerValue={handleScannerScanResult} />
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
};

export default CreateFairOrderForm;
