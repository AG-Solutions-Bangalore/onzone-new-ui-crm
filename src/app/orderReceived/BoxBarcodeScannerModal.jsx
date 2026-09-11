import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Scan,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
  CheckCheck,
  Search,
  Package,
  Layers,
  X,
  Sparkles,
} from "lucide-react";
import { ButtonConfig } from "@/config/ButtonConfig";

const BoxBarcodeScannerModal = ({
  open,
  onOpenChange,
  boxNumber,
  formattedBoxTitle,
  expectedItems = [], // Array of { barcode, size, amount, quantity }
  initialBarcodes = [], // Array of barcode strings currently assigned
  originalBarcodes = [], // Array of original barcode strings from packing list
  onSave,
  isSaving = false,
}) => {
  const [activeStep, setActiveStep] = useState(1); // 1 = Scanning, 2 = Comparison & Double-Check
  const [scanningActive, setScanningActive] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [scannedCounts, setScannedCounts] = useState({});
  const [doubleCheckedMissing, setDoubleCheckedMissing] = useState({});
  const [scanFeedback, setScanFeedback] = useState(null);
  const [comparisonFilter, setComparisonFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const barcodeInputRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  // Initialize or reset state when modal opens or box changes
  useEffect(() => {
    if (open) {
      setActiveStep(1);
      setScanningActive(true);
      setInputValue("");
      setScanFeedback(null);
      setComparisonFilter("all");
      setSearchQuery("");
      setDoubleCheckedMissing({});

      // Start FRESH with 0 scanned barcodes so the operator scans physical box items one by one!
      setScannedCounts({});

      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [open, boxNumber]);

  // Map of expected items for this box
  const expectedItemsMap = useMemo(() => {
    const map = {};
    (expectedItems || []).forEach((item) => {
      const bc = (item.barcode || "").trim().toUpperCase();
      if (!bc) return;
      if (!map[bc]) {
        map[bc] = {
          barcode: bc,
          size: item.size || "N/A",
          amount: item.amount || "N/A",
          expectedQty: 0,
        };
      }
      map[bc].expectedQty += item.quantity || 1;
    });
    return map;
  }, [expectedItems]);

  // Helper to get item metadata (Size, Amount, Expected Qty)
  const getItemMeta = (barcode) => {
    const clean = (barcode || "").trim().toUpperCase();
    if (expectedItemsMap[clean]) {
      return expectedItemsMap[clean];
    }
    return {
      barcode: clean,
      size: "N/A",
      amount: "N/A",
      expectedQty: 0,
    };
  };

  // Comprehensive comparison calculation
  const comparisonData = useMemo(() => {
    const allBarcodes = new Set([
      ...Object.keys(expectedItemsMap),
      ...Object.keys(scannedCounts),
    ]);

    let totalExpected = 0;
    let totalScanned = 0;
    let totalMatched = 0;
    let totalMissing = 0;
    let totalExtra = 0;

    const items = Array.from(allBarcodes).map((barcode) => {
      const meta = getItemMeta(barcode);
      const expectedQty = meta.expectedQty || 0;
      const scannedQty = scannedCounts[barcode] || 0;

      totalExpected += expectedQty;
      totalScanned += scannedQty;

      let status = "matched"; // 'matched' | 'missing' | 'extra'
      let diff = 0;

      if (scannedQty === expectedQty && expectedQty > 0) {
        status = "matched";
        totalMatched += scannedQty;
      } else if (scannedQty < expectedQty) {
        status = "missing";
        diff = expectedQty - scannedQty;
        totalMatched += scannedQty;
        totalMissing += diff;
      } else if (scannedQty > expectedQty) {
        status = "extra";
        diff = scannedQty - expectedQty;
        totalMatched += expectedQty;
        totalExtra += diff;
      } else if (expectedQty === 0 && scannedQty > 0) {
        status = "extra";
        diff = scannedQty;
        totalExtra += scannedQty;
      }

      return {
        barcode,
        size: meta.size,
        amount: meta.amount,
        expectedQty,
        scannedQty,
        status,
        diff,
        isDoubleChecked: Boolean(doubleCheckedMissing[barcode]),
      };
    });

    return {
      items,
      totalExpected,
      totalScanned,
      totalMatched,
      totalMissing,
      totalExtra,
    };
  }, [expectedItemsMap, scannedCounts, doubleCheckedMissing]);

  // Audio / Visual Feedback on Scan
  const showFeedback = (type, message, barcode) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setScanFeedback({ type, message, barcode });
    feedbackTimeoutRef.current = setTimeout(() => {
      setScanFeedback(null);
    }, 3500);
  };

  // Handle Scanning Barcode
  const handleScanBarcode = (rawCode) => {
    const barcode = (rawCode || "").trim().toUpperCase();
    if (!barcode) return;

    const meta = getItemMeta(barcode);
    const expected = meta.expectedQty;
    const current = scannedCounts[barcode] || 0;
    const nextCount = current + 1;

    setScannedCounts((prev) => ({
      ...prev,
      [barcode]: nextCount,
    }));

    // Check feedback status
    if (expected > 0) {
      if (nextCount < expected) {
        showFeedback(
          "info",
          `Scanned ${barcode} (Received: ${nextCount}/${expected} pcs, ${expected - nextCount} remaining)`,
          barcode
        );
      } else if (nextCount === expected) {
        showFeedback(
          "success",
          `All ${expected} pcs matched for ${barcode}! (Actual: ${expected}, Scanned: ${nextCount})`,
          barcode
        );
      } else {
        const extraQty = nextCount - expected;
        showFeedback(
          "warning",
          `+${extraQty} Extra piece added for ${barcode}! (Actual expected: ${expected}, Scanned: ${nextCount})`,
          barcode
        );
      }
    } else {
      showFeedback(
        "warning",
        `+1 Extra added: ${barcode} is not in the expected packing list for this box!`,
        barcode
      );
    }

    setInputValue("");
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  // Input Key Handler
  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        handleScanBarcode(inputValue);
      }
    }
  };

  // Increment Quantity directly
  const handleIncrement = (barcode) => {
    const clean = barcode.trim().toUpperCase();
    const meta = getItemMeta(clean);
    const expected = meta.expectedQty;
    const nextCount = (scannedCounts[clean] || 0) + 1;

    setScannedCounts((prev) => ({
      ...prev,
      [clean]: nextCount,
    }));

    if (expected > 0 && nextCount === expected) {
      showFeedback(
        "success",
        `Quantity updated: ${clean} fully received (${nextCount}/${expected})`,
        clean
      );
    } else if (expected > 0 && nextCount > expected) {
      showFeedback(
        "warning",
        `+${nextCount - expected} Extra piece added for ${clean}! (Actual: ${expected}, Scanned: ${nextCount})`,
        clean
      );
    }
  };

  // Decrement Quantity directly
  const handleDecrement = (barcode) => {
    const clean = barcode.trim().toUpperCase();
    const current = scannedCounts[clean] || 0;
    if (current <= 1) {
      handleRemoveBarcode(clean);
    } else {
      setScannedCounts((prev) => ({
        ...prev,
        [clean]: current - 1,
      }));
    }
  };

  // Remove Barcode completely
  const handleRemoveBarcode = (barcode) => {
    const clean = barcode.trim().toUpperCase();
    setScannedCounts((prev) => {
      const next = { ...prev };
      delete next[clean];
      return next;
    });
    showFeedback("info", `Removed ${clean} from scanned list`, clean);
  };

  // Reset to original barcodes from DC
  const handleResetToOriginal = () => {
    const counts = {};
    (originalBarcodes || []).forEach((bc) => {
      if (!bc) return;
      const clean = bc.trim().toUpperCase();
      if (clean) {
        counts[clean] = (counts[clean] || 0) + 1;
      }
    });
    setScannedCounts(counts);
    setDoubleCheckedMissing({});
    showFeedback("info", "Reset barcodes to original packing list");
  };

  // Clear all scanned
  const handleClearAll = () => {
    setScannedCounts({});
    setDoubleCheckedMissing({});
    showFeedback("info", "Cleared all scanned barcodes");
  };

  // Toggle Double-Check for a missing item
  const toggleDoubleCheckMissing = (barcode) => {
    setDoubleCheckedMissing((prev) => ({
      ...prev,
      [barcode]: !prev[barcode],
    }));
  };

  // Double check all missing
  const handleDoubleCheckAllMissing = () => {
    const newChecked = { ...doubleCheckedMissing };
    comparisonData.items
      .filter((it) => it.status === "missing")
      .forEach((it) => {
        newChecked[it.barcode] = true;
      });
    setDoubleCheckedMissing(newChecked);
    showFeedback("success", "Marked all missing items as Double-Checked");
  };

  // Build final array of barcodes and save
  const handleSave = () => {
    const finalBarcodeList = [];
    Object.entries(scannedCounts).forEach(([barcode, count]) => {
      for (let i = 0; i < count; i++) {
        finalBarcodeList.push(barcode);
      }
    });
    onSave(finalBarcodeList);
  };

  // Filtered comparison items
  const filteredComparisonItems = useMemo(() => {
    return comparisonData.items
      .filter((item) => {
        if (comparisonFilter === "matched") {
          return item.scannedQty >= item.expectedQty && item.expectedQty > 0;
        }
        if (comparisonFilter === "missing") {
          return item.scannedQty < item.expectedQty;
        }
        if (comparisonFilter === "extra") {
          return item.scannedQty > item.expectedQty || item.expectedQty === 0;
        }
        return true;
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.barcode.toLowerCase().includes(q) ||
          String(item.size).toLowerCase().includes(q) ||
          String(item.amount).toLowerCase().includes(q)
        );
      });
  }, [comparisonData.items, comparisonFilter, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] h-[92vh] flex flex-col p-5 overflow-hidden bg-slate-50/50">
        {/* Header with Title & Step Navigation */}
        <DialogHeader className="shrink-0 pb-2 border-b">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span>Barcode Verification — {formattedBoxTitle || `Box ${boxNumber}`}</span>
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Scan all barcodes, verify quantities, and double check missing pieces before saving.
              </p>
            </div>

            {/* Step Switcher Tabs */}
            <div className="flex items-center bg-gray-200/80 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setActiveStep(1);
                  setTimeout(() => barcodeInputRef.current?.focus(), 100);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeStep === 1
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Scan className="h-3.5 w-3.5" />
                <span>1. Scan Barcodes</span>
                <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {comparisonData.totalScanned}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeStep === 2
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>2. Compare & Verify</span>
                {comparisonData.totalMissing > 0 ? (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                    {comparisonData.totalMissing} Missing
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    ✓ Complete
                  </span>
                )}
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* ========================================================================= */}
        {/* SCREEN 1: SCANNING VIEW (Left: Scanner Widget, Right: Scanned Items List) */}
        {/* ========================================================================= */}
        {activeStep === 1 && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 min-h-0 overflow-hidden pt-2">
            {/* LEFT SIDE: Barcode Scanner Widget (Matching Attached Screenshot) */}
            <div className="md:col-span-5 flex flex-col min-h-0 h-full bg-white border border-gray-200 rounded-xl p-4 shadow-xs overflow-y-auto">
              {/* Scanner Top Bar */}
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-sm font-bold text-gray-900">Barcode Scanner</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors ${
                      scanningActive
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    {scanningActive ? "• Active" : "Paused"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setScanningActive(!scanningActive);
                      if (!scanningActive) {
                        setTimeout(() => barcodeInputRef.current?.focus(), 50);
                      }
                    }}
                    className="h-7 w-7 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    title={scanningActive ? "Pause Scanner" : "Activate Scanner"}
                  >
                    {scanningActive ? (
                      <X className="h-4 w-4 text-red-600" />
                    ) : (
                      <Scan className="h-4 w-4 text-emerald-600" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Exact Red/Pink Styled Scanner Container from Attached Image */}
              <div className="bg-red-50/80 border border-red-200 rounded-xl p-3.5 mb-3.5 shrink-0">
                <Label className="text-xs font-semibold text-gray-800 block mb-1.5">
                  Barcode Scanner
                </Label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Input
                      ref={barcodeInputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                      onKeyDown={handleInputKeyDown}
                      placeholder="Scan or enter barcode..."
                      disabled={!scanningActive}
                      className="bg-white border-gray-300 uppercase font-mono text-xs h-9 pr-3 focus-visible:ring-red-700"
                      autoFocus
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      if (inputValue.trim()) {
                        handleScanBarcode(inputValue);
                      } else {
                        barcodeInputRef.current?.focus();
                      }
                    }}
                    disabled={!scanningActive}
                    className={`h-9 px-3 shrink-0 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} text-white shadow-xs transition-colors cursor-pointer`}
                    title="Scan / Submit Barcode"
                  >
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  {scanningActive
                    ? "Scan barcode or type and press Enter"
                    : "Activate scanning to add barcodes"}
                </p>
              </div>

              {/* Real-time Scan Feedback Banner */}
              {scanFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium mb-3 shrink-0 flex items-start gap-2 animate-in fade-in duration-200 ${
                    scanFeedback.type === "success"
                      ? "bg-emerald-50 border border-emerald-300 text-emerald-900"
                      : scanFeedback.type === "warning"
                      ? "bg-amber-50 border border-amber-300 text-amber-900"
                      : scanFeedback.type === "error"
                      ? "bg-rose-50 border border-rose-300 text-rose-900"
                      : "bg-blue-50 border border-blue-300 text-blue-900"
                  }`}
                >
                  {scanFeedback.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : scanFeedback.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 leading-relaxed">{scanFeedback.message}</div>
                </div>
              )}

              {/* Box Progress & Live Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 shrink-0">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
                  <span>Box Scanning Progress</span>
                  <span className="font-bold text-gray-900">
                    {comparisonData.totalScanned} / {comparisonData.totalExpected} Pcs
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-300 ${
                      comparisonData.totalMissing === 0 && comparisonData.totalExpected > 0
                        ? "bg-emerald-600"
                        : "bg-blue-600"
                    }`}
                    style={{
                      width: `${
                        comparisonData.totalExpected > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (comparisonData.totalMatched / comparisonData.totalExpected) * 100
                              )
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                {/* Micro Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white border rounded-lg p-2">
                    <span className="text-[10px] text-gray-500 block">Expected</span>
                    <span className="font-bold text-gray-800 text-sm">
                      {comparisonData.totalExpected}
                    </span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-emerald-800">
                    <span className="text-[10px] text-emerald-600 block">Matched</span>
                    <span className="font-bold text-sm">{comparisonData.totalMatched}</span>
                  </div>
                  <div
                    className={`border rounded-lg p-2 ${
                      comparisonData.totalMissing > 0
                        ? "bg-rose-50 border-rose-200 text-rose-800 font-bold animate-pulse"
                        : "bg-white text-gray-400"
                    }`}
                  >
                    <span className="text-[10px] text-rose-600 block">Missing</span>
                    <span className="font-bold text-sm">{comparisonData.totalMissing}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Switch Action */}
              <div className="mt-auto pt-3 border-t flex flex-col gap-2 shrink-0">
                <Button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Compare & Verify (Step 2)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <div className="flex items-center justify-end text-[11px] text-gray-500 px-1">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-rose-600 hover:text-rose-800 underline cursor-pointer"
                  >
                    Clear All Scanned (0 pcs)
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Real-Time Scanned List with Plus/Minus Controls */}
            <div className="md:col-span-7 flex flex-col min-h-0 h-full bg-white border border-gray-200 rounded-xl p-4 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Scanned Items</h3>
                  <p className="text-[11px] text-gray-500">
                    If item has multiple quantities, scan again or use the plus (+) button directly
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-7 text-[11px] px-2.5 text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer"
                    title="Clear all scanned items (0 pcs)"
                  >
                    Clear All
                  </Button>
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                    {comparisonData.totalScanned} Total Pcs
                  </span>
                </div>
              </div>

              {/* Scanned Items Scrollable List */}
              <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2.5">
                {Object.keys(scannedCounts).length > 0 ? (
                  Object.entries(scannedCounts).map(([barcode, count], idx) => {
                    const meta = getItemMeta(barcode);
                    const expected = meta.expectedQty;
                    const isMatched = count === expected && expected > 0;
                    const isPartial = count < expected;
                    const isExtra = count > expected || expected === 0;

                    return (
                      <div
                        key={barcode}
                        className={`p-3 rounded-xl border transition-all ${
                          isMatched
                            ? "bg-emerald-50/60 border-emerald-300"
                            : isPartial
                            ? "bg-amber-50/60 border-amber-300"
                            : "bg-purple-50/60 border-purple-300"
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          {/* Item Details: Barcode, Size, Amount, and Actual Quantity */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500 font-mono">
                                #{idx + 1}
                              </span>
                              <span className="font-mono text-sm font-bold text-gray-900 tracking-wide">
                                {barcode}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600 mt-1">
                              <span className="bg-white/90 px-2 py-0.5 rounded border border-gray-200 font-medium">
                                Size: <strong className="text-gray-900">{meta.size}</strong>
                              </span>
                              <span className="bg-white/90 px-2 py-0.5 rounded border border-gray-200 font-medium">
                                MRP: <strong className="text-gray-900">₹{meta.amount}</strong>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded border font-semibold ${
                                  expected > 0
                                    ? "bg-blue-50 border-blue-200 text-blue-900"
                                    : "bg-gray-100 border-gray-300 text-gray-700"
                                }`}
                              >
                                Actual Qty: <strong className="text-blue-950 font-bold">{expected}</strong>
                              </span>
                            </div>
                          </div>

                          {/* Right Side: Quantity Counter with Plus/Minus & Status Pill */}
                          <div className="flex items-center gap-3">
                            {/* Expected status pill */}
                            <div className="text-right">
                              {isMatched && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> {count}/{expected} Matched (Found)
                                </span>
                              )}
                              {isPartial && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                  {count}/{expected} Scanned ({expected - count} left)
                                </span>
                              )}
                              {isExtra && (
                                <div className="flex flex-col items-end">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-2xs">
                                    <AlertTriangle className="h-3.5 w-3.5 text-white" />
                                    +{count - expected} Extra Added
                                  </span>
                                  <span className="text-[10px] text-amber-900 font-bold mt-0.5">
                                    (Actual: {expected}, Scanned: {count})
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Direct Plus/Minus Quantity Control Buttons */}
                            <div
                              className={`flex items-center bg-white border rounded-lg shadow-2xs overflow-hidden ${
                                isExtra
                                  ? "border-amber-400 ring-1 ring-amber-300"
                                  : isMatched
                                  ? "border-emerald-300"
                                  : "border-gray-300"
                              }`}
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDecrement(barcode)}
                                className="h-8 w-8 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-none cursor-pointer"
                                title="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>

                              <span
                                className={`w-9 text-center font-bold text-sm font-mono ${
                                  isExtra
                                    ? "text-amber-900 font-extrabold"
                                    : "text-gray-900"
                                }`}
                              >
                                {count}
                              </span>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleIncrement(barcode)}
                                className={`h-8 w-8 rounded-none cursor-pointer ${
                                  isExtra
                                    ? "text-amber-700 hover:bg-amber-100"
                                    : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50"
                                }`}
                                title="Increase quantity (+1)"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            {/* Remove Icon */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveBarcode(barcode)}
                              className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Delete this barcode"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-xl">
                    <Scan className="h-12 w-12 text-gray-300 mb-2 animate-pulse" />
                    <p className="text-sm font-semibold text-gray-700">No barcodes scanned yet</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Scan barcodes one by one on the left. If a barcode has multiple quantities, you can scan it repeatedly or press (+) to add more.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: COMPARISON & DOUBLE CHECK VIEW                                   */}
        {/* ========================================================================= */}
        {activeStep === 2 && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden pt-2 gap-3">
            {/* Top KPI Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
              <div className="bg-white border rounded-xl p-3 shadow-2xs">
                <span className="text-xs text-gray-500 font-medium block">Total Expected</span>
                <div className="text-lg font-extrabold text-gray-900 mt-0.5">
                  {comparisonData.totalExpected} <span className="text-xs font-normal">Pcs</span>
                </div>
              </div>

              <div className="bg-white border rounded-xl p-3 shadow-2xs">
                <span className="text-xs text-gray-500 font-medium block">Total Scanned</span>
                <div className="text-lg font-extrabold text-blue-700 mt-0.5">
                  {comparisonData.totalScanned} <span className="text-xs font-normal">Pcs</span>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 shadow-2xs">
                <span className="text-xs text-emerald-700 font-medium block">✓ Matched</span>
                <div className="text-lg font-extrabold text-emerald-800 mt-0.5">
                  {comparisonData.totalMatched} <span className="text-xs font-normal">Pcs</span>
                </div>
              </div>

              <div
                className={`border rounded-xl p-3 shadow-2xs ${
                  comparisonData.totalMissing > 0
                    ? "bg-rose-50 border-rose-300 text-rose-900"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                <span className="text-xs font-medium block">✗ Missing</span>
                <div className="text-lg font-extrabold mt-0.5">
                  {comparisonData.totalMissing} <span className="text-xs font-normal">Pcs</span>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 shadow-2xs">
                <span className="text-xs text-purple-700 font-medium block">+ Extra</span>
                <div className="text-lg font-extrabold text-purple-800 mt-0.5">
                  {comparisonData.totalExtra} <span className="text-xs font-normal">Pcs</span>
                </div>
              </div>
            </div>



            {/* Filter Tabs & Search Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap shrink-0">
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setComparisonFilter("all")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    comparisonFilter === "all"
                      ? "bg-white text-gray-900 shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All Items ({comparisonData.items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonFilter("matched")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    comparisonFilter === "matched"
                      ? "bg-emerald-700 text-white shadow-2xs"
                      : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  ✓ Matched (
                  {
                    comparisonData.items.filter(
                      (i) => i.scannedQty >= i.expectedQty && i.expectedQty > 0
                    ).length
                  }
                  )
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonFilter("missing")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    comparisonFilter === "missing"
                      ? "bg-rose-700 text-white shadow-2xs"
                      : "text-rose-700 hover:bg-rose-50"
                  }`}
                >
                  ✗ Missing (
                  {
                    comparisonData.items.filter(
                      (i) => i.scannedQty < i.expectedQty
                    ).length
                  }
                  )
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonFilter("extra")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    comparisonFilter === "extra"
                      ? "bg-purple-700 text-white shadow-2xs"
                      : "text-purple-700 hover:bg-purple-50"
                  }`}
                >
                  + Extra (
                  {
                    comparisonData.items.filter(
                      (i) => i.scannedQty > i.expectedQty || i.expectedQty === 0
                    ).length
                  }
                  )
                </button>
              </div>

              <div className="relative w-64">
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search barcode or size..."
                  className="pl-8 h-8 text-xs bg-white"
                />
              </div>
            </div>

            {/* Comparison Table */}
            <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col min-h-0 shadow-xs">
              <div className="flex-1 overflow-y-auto min-h-0">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 border-b text-gray-600 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Barcode</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Amount (₹)</th>
                      <th className="py-2.5 px-3 text-center">Expected</th>
                      <th className="py-2.5 px-3 text-center">Scanned</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Double-Check / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredComparisonItems.length > 0 ? (
                      filteredComparisonItems.map((item) => {
                        const isMatched =
                          item.scannedQty === item.expectedQty && item.expectedQty > 0;
                        const isPartial =
                          item.scannedQty > 0 && item.scannedQty < item.expectedQty;
                        const isMissing =
                          item.scannedQty === 0 && item.expectedQty > 0;
                        const isExtra =
                          item.scannedQty > item.expectedQty || item.expectedQty === 0;

                        return (
                          <tr
                            key={item.barcode}
                            className={`hover:bg-gray-50 transition-colors ${
                              isMissing
                                ? "bg-rose-50/40"
                                : isPartial
                                ? "bg-amber-50/40"
                                : isExtra
                                ? "bg-purple-50/40"
                                : "bg-white"
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                              {item.barcode}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-gray-700">
                              {item.size}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-gray-700">
                              ₹{item.amount}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-gray-800">
                              {item.expectedQty}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              <span
                                className={`inline-block px-2 py-0.5 rounded font-mono ${
                                  isMatched
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isPartial
                                    ? "bg-amber-100 text-amber-800"
                                    : isMissing
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {item.scannedQty}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {isMatched && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle className="h-3 w-3" /> Matched ({item.scannedQty}/{item.expectedQty})
                                </span>
                              )}
                              {isPartial && (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                    Scanned {item.scannedQty}/{item.expectedQty} ({item.diff} Missing)
                                  </span>
                                  {item.isDoubleChecked && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 block">
                                      <CheckCheck className="h-3 w-3" /> Verified Missing
                                    </span>
                                  )}
                                </div>
                              )}
                              {isMissing && (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <XCircle className="h-3 w-3" /> Missing {item.expectedQty} Pcs
                                  </span>
                                  {item.isDoubleChecked && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 block">
                                      <CheckCheck className="h-3 w-3" /> Verified Missing
                                    </span>
                                  )}
                                </div>
                              )}
                              {isExtra && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                                  +{item.diff} Extra Added (Actual: {item.expectedQty}, Scanned: {item.scannedQty})
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {(isMissing || isPartial) && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleIncrement(item.barcode)}
                                    className="h-6 text-[11px] px-2 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 font-semibold cursor-pointer"
                                    title="Add / Found 1 piece"
                                  >
                                    <Plus className="h-3 w-3 mr-0.5" /> Add Piece
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={item.isDoubleChecked ? "default" : "outline"}
                                    onClick={() => toggleDoubleCheckMissing(item.barcode)}
                                    className={`h-6 text-[11px] px-2 font-semibold cursor-pointer ${
                                      item.isDoubleChecked
                                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                        : "bg-white text-gray-700 hover:bg-gray-100"
                                    }`}
                                    title="Mark as double-checked"
                                  >
                                    <CheckCheck className="h-3 w-3 mr-1" />
                                    {item.isDoubleChecked ? "Double-Checked" : "Double-Check"}
                                  </Button>
                                </div>
                              )}
                              {isExtra && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDecrement(item.barcode)}
                                  className="h-6 text-[11px] px-2 text-rose-700 border-rose-300 hover:bg-rose-50 font-semibold cursor-pointer"
                                >
                                  <Minus className="h-3 w-3 mr-0.5" /> Remove Extra
                                </Button>
                              )}
                              {isMatched && (
                                <span className="text-[11px] text-emerald-700 font-semibold">
                                  ✓ Fully Matched
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-gray-500 text-xs italic">
                          No items match the selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <DialogFooter className="mt-3 pt-3 border-t shrink-0 flex items-center justify-between flex-wrap gap-2">
          <div>
            {activeStep === 2 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveStep(1);
                  setTimeout(() => barcodeInputRef.current?.focus(), 100);
                }}
                className="text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Scanner (Step 1)
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear Scanned (0 pcs)
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>

            {activeStep === 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveStep(2)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Proceed to Comparison (Step 2)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving Barcodes...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Save & Update Barcodes
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoxBarcodeScannerModal;
