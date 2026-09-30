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
  savedScannedCounts = null, // Previously saved scanned counts if box was verified
  onSave,
  isSaving = false,
}) => {
  const [activeStep, setActiveStep] = useState(1); // 1 = Scanning, 2 = Comparison
  const [scanningActive, setScanningActive] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [scannedCounts, setScannedCounts] = useState({});
  const [scanOrder, setScanOrder] = useState([]);
  const [scanFeedback, setScanFeedback] = useState(null);
  const [comparisonFilter, setComparisonFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const barcodeInputRef = useRef(null);
  const scannedListRef = useRef(null);
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

      // If this box was previously scanned/verified, restore the scanned counts so progress is preserved!
      if (savedScannedCounts && Object.keys(savedScannedCounts).length > 0) {
        setScannedCounts({ ...savedScannedCounts });
        setScanOrder(Object.keys(savedScannedCounts).reverse());
      } else {
        setScannedCounts({});
        setScanOrder([]);
      }

      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [open, boxNumber, savedScannedCounts]);

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
  }, [expectedItemsMap, scannedCounts]);

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

  // Ordered scanned items with the most recently scanned item at the top
  const orderedScannedItems = useMemo(() => {
    const seen = new Set();
    const result = [];

    // 1. Items in order of most recent scan/increment
    scanOrder.forEach((barcode) => {
      const count = scannedCounts[barcode] || 0;
      if (count > 0 && !seen.has(barcode)) {
        seen.add(barcode);
        result.push([barcode, count]);
      }
    });

    // 2. Any barcodes in scannedCounts not yet in scanOrder (e.g. restored state)
    Object.entries(scannedCounts).forEach(([barcode, count]) => {
      if (count > 0 && !seen.has(barcode)) {
        seen.add(barcode);
        result.push([barcode, count]);
      }
    });

    return result;
  }, [scanOrder, scannedCounts]);

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
    setScanOrder((prev) => [barcode, ...prev.filter((b) => b !== barcode)]);

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
      scannedListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
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
    setScanOrder((prev) => [clean, ...prev.filter((b) => b !== clean)]);
    setTimeout(() => {
      scannedListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);

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
    setScanOrder((prev) => prev.filter((b) => b !== clean));
    showFeedback("info", `Removed ${clean} from scanned list`, clean);
  };

  // Reset to original barcodes from DC
  const handleResetToOriginal = () => {
    const counts = {};
    const order = [];
    (originalBarcodes || []).forEach((bc) => {
      if (!bc) return;
      const clean = bc.trim().toUpperCase();
      if (clean) {
        if (!counts[clean]) order.push(clean);
        counts[clean] = (counts[clean] || 0) + 1;
      }
    });
    setScannedCounts(counts);
    setScanOrder(order);
    showFeedback("info", "Reset barcodes to original packing list");
  };

  // Clear all scanned
  const handleClearAll = () => {
    setScannedCounts({});
    setScanOrder([]);
    showFeedback("info", "Cleared all scanned barcodes");
  };

  // Build final array of barcodes and save
  const handleSave = () => {
    const finalBarcodeList = [];
    Object.entries(scannedCounts).forEach(([barcode, count]) => {
      for (let i = 0; i < count; i++) {
        finalBarcodeList.push(barcode);
      }
    });
    onSave(finalBarcodeList, {
      expected: comparisonData.totalExpected,
      matched: comparisonData.totalMatched,
      missing: comparisonData.totalMissing,
      extra: comparisonData.totalExtra,
      total: comparisonData.totalScanned,
      scannedCounts: { ...scannedCounts },
      items: comparisonData.items,
    });
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
      <DialogContent className="max-w-5xl max-h-[92vh] h-[92vh] flex flex-col p-6 overflow-hidden bg-[#FDFBF7] border border-stone-200/90 rounded-2xl shadow-2xl">
        {/* Header with Title & Step Navigation */}
        <DialogHeader className="shrink-0 pb-3 border-b border-stone-200/80">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#F5F2EB] border border-stone-200/80 flex items-center justify-center text-[#543D2B] shadow-2xs">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                  <span>Barcode Verification</span>
                </DialogTitle>
                <p className="text-xs text-stone-500 mt-0.5">
                  Scan all barcodes and verify quantities before saving.
                </p>
              </div>
            </div>

            {/* Step Switcher Tabs */}
            <div className="flex items-center bg-[#F5F2EB] p-1 rounded-xl border border-stone-200/80">
              <button
                type="button"
                onClick={() => {
                  setActiveStep(1);
                  setTimeout(() => barcodeInputRef.current?.focus(), 100);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeStep === 1
                    ? "bg-white text-stone-900 shadow-xs border border-stone-200/60"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Scan className="h-3.5 w-3.5 text-[#A27B5C]" />
                <span>1. Scan Barcodes</span>
                <span className="bg-[#543D2B] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono">
                  {comparisonData.totalScanned}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeStep === 2
                    ? "bg-white text-stone-900 shadow-xs border border-stone-200/60"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-[#A27B5C]" />
                <span>2. Compare & Verify</span>
                {comparisonData.totalMissing > 0 ? (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse font-mono">
                    {comparisonData.totalMissing} Missing
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono">
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
            {/* LEFT SIDE: Barcode Scanner Widget */}
            <div className="md:col-span-5 flex flex-col min-h-0 h-full bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs overflow-y-auto">
              {/* Scanner Top Bar */}
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Barcode Scanner</h3>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                      scanningActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                        : "bg-stone-100 text-stone-600 border border-stone-200"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${scanningActive ? "bg-emerald-600 animate-pulse" : "bg-stone-400"}`} />
                    {scanningActive ? "Active" : "Paused"}
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
                    className="h-7 w-7 text-stone-400 hover:text-stone-800 hover:bg-[#F5F2EB] rounded-lg"
                    title={scanningActive ? "Pause Scanner" : "Activate Scanner"}
                  >
                    {scanningActive ? (
                      <X className="h-4 w-4 text-stone-500 hover:text-red-600" />
                    ) : (
                      <Scan className="h-4 w-4 text-emerald-600" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Polished Scanner Container */}
              <div className="bg-[#FAF8F5] border border-stone-200/90 rounded-xl p-3.5 mb-3.5 shrink-0 transition-all focus-within:border-[#A27B5C] focus-within:ring-2 focus-within:ring-[#A27B5C]/15">
                <Label className="text-xs font-bold text-stone-800 block mb-1.5">
                  Scan Barcode
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={barcodeInputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                      onKeyDown={handleInputKeyDown}
                      placeholder="SCAN OR ENTER BARCODE..."
                      disabled={!scanningActive}
                      className="bg-white border-stone-200 uppercase font-mono text-xs h-9.5 pr-3 focus-visible:ring-0 focus-visible:border-[#A27B5C] rounded-lg text-stone-900 tracking-wider font-semibold placeholder:text-stone-400"
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
                    className="h-9.5 px-3.5 shrink-0 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                    title="Scan / Submit Barcode"
                  >
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2">
                  <span>
                    {scanningActive
                      ? "Scan barcode or type & press Enter"
                      : "Activate scanning to continue"}
                  </span>
                  <span className="font-mono text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                    ↵ Enter
                  </span>
                </div>
              </div>

              {/* Real-time Scan Feedback Banner */}
              {scanFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium mb-3 shrink-0 flex items-start gap-2.5 animate-in fade-in duration-200 border ${
                    scanFeedback.type === "success"
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                      : scanFeedback.type === "warning"
                      ? "bg-amber-50/80 border-amber-200 text-amber-900"
                      : scanFeedback.type === "error"
                      ? "bg-rose-50/80 border-rose-200 text-rose-900"
                      : "bg-[#F5F2EB] border-stone-200 text-stone-800"
                  }`}
                >
                  {scanFeedback.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : scanFeedback.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-[#A27B5C] shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 leading-relaxed">{scanFeedback.message}</div>
                </div>
              )}

              {/* Box Progress & Live Summary Card */}
              <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-xl p-3.5 mb-2 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
                  <span>Box Scanning Progress</span>
                  <span className="font-mono text-stone-900">
                    {comparisonData.totalScanned} / {comparisonData.totalExpected} Pcs
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-300 ${
                      comparisonData.totalMissing === 0 && comparisonData.totalExpected > 0
                        ? "bg-emerald-600"
                        : "bg-[#543D2B]"
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
                  <div className="bg-white border border-stone-200 rounded-lg p-2 shadow-2xs">
                    <span className="text-[10px] text-stone-500 font-semibold block uppercase">Expected</span>
                    <span className="font-bold text-stone-800 text-sm font-mono">
                      {comparisonData.totalExpected}
                    </span>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2 text-emerald-800 shadow-2xs">
                    <span className="text-[10px] text-emerald-700 font-semibold block uppercase">Matched</span>
                    <span className="font-bold text-sm font-mono">{comparisonData.totalMatched}</span>
                  </div>
                  <div
                    className={`border rounded-lg p-2 shadow-2xs ${
                      comparisonData.totalMissing > 0
                        ? "bg-rose-50/70 border-rose-200 text-rose-800 font-bold"
                        : "bg-white border-stone-200 text-stone-400"
                    }`}
                  >
                    <span className={`text-[10px] font-semibold block uppercase ${comparisonData.totalMissing > 0 ? "text-rose-600" : "text-stone-400"}`}>
                      Missing
                    </span>
                    <span className="font-bold text-sm font-mono">{comparisonData.totalMissing}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Real-Time Scanned List with Plus/Minus Controls */}
            <div className="md:col-span-7 flex flex-col min-h-0 h-full bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Scanned Items</h3>
                  <p className="text-[11px] text-stone-500">
                    If item has multiple quantities, scan again or use the plus (+) button directly
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-7 text-[11px] px-2.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 border-stone-200 rounded-lg cursor-pointer"
                    title="Clear all scanned items (0 pcs)"
                  >
                    Clear All
                  </Button>
                  <span className="bg-[#F5F2EB] text-[#543D2B] border border-stone-200/80 text-xs font-bold px-2.5 py-1 rounded-lg font-mono">
                    {comparisonData.totalScanned} Total Pcs
                  </span>
                </div>
              </div>

              {/* Scanned Items Scrollable List */}
              <div ref={scannedListRef} className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2">
                {orderedScannedItems.length > 0 ? (
                  orderedScannedItems.map(([barcode, count], idx) => {
                    const meta = getItemMeta(barcode);
                    const expected = meta.expectedQty;
                    const isMatched = count === expected && expected > 0;
                    const isPartial = count < expected;
                    const isExtra = count > expected || expected === 0;

                    return (
                      <div
                        key={barcode}
                        className={`py-2 px-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                          idx === 0
                            ? isMatched
                              ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300/40"
                              : isPartial
                              ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/40"
                              : "bg-blue-50/40 border-blue-300 ring-1 ring-blue-300/40"
                            : isMatched
                            ? "bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300"
                            : isPartial
                            ? "bg-amber-50/30 border-amber-200/80 hover:border-amber-300"
                            : "bg-[#FAF8F5] border-stone-200/90 hover:border-stone-300"
                        }`}
                      >
                        {/* Left Side: Index, Barcode, and Actual Qty in one line */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
                          <span className="text-[11px] font-bold text-stone-400 font-mono shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-mono text-xs sm:text-sm font-bold text-stone-900 tracking-wider truncate">
                            {barcode}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F5F2EB] border border-stone-200/80 text-stone-700 shrink-0">
                            Actual: <strong className="text-stone-900 font-bold font-mono">{expected}</strong>
                          </span>
                        </div>

                        {/* Right Side: Status Pill, Stepper, Trash all in one line */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isMatched && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              <CheckCircle className="h-3 w-3 text-emerald-600" /> {count}/{expected} Matched
                            </span>
                          )}
                          {isPartial && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                              {count}/{expected} ({expected - count} left)
                            </span>
                          )}
                          {isExtra && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs whitespace-nowrap"
                              title={`Actual: ${expected}, Scanned: ${count}`}
                            >
                              <AlertTriangle className="h-3 w-3 text-white" />
                              +{count - expected} Extra
                            </span>
                          )}

                          {/* Direct Plus/Minus Quantity Control Buttons */}
                          <div
                            className={`flex items-center bg-white border rounded-lg shadow-2xs overflow-hidden h-7 ${
                              isExtra
                                ? "border-blue-300"
                                : isMatched
                                ? "border-emerald-300"
                                : "border-stone-200"
                            }`}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDecrement(barcode)}
                              className="h-7 w-7 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-none cursor-pointer p-0"
                              title="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>

                            <span
                              className={`w-7 text-center font-bold text-xs font-mono ${
                                isExtra
                                  ? "text-[#543D2B] font-extrabold"
                                  : "text-stone-900"
                              }`}
                            >
                              {count}
                            </span>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleIncrement(barcode)}
                              className="h-7 w-7 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-none cursor-pointer p-0"
                              title="Increase quantity (+1)"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Remove Icon */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveBarcode(barcode)}
                            className="h-7 w-7 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer p-0"
                            title="Delete this barcode"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-stone-200 rounded-xl bg-[#FAF8F5]/60">
                    <div className="h-14 w-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                      <Scan className="h-7 w-7 text-stone-400 animate-pulse" />
                    </div>
                    <p className="text-sm font-bold text-stone-800">No barcodes scanned yet</p>
                    <p className="text-xs text-stone-400 mt-1 max-w-xs leading-relaxed">
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
              <div className="bg-white border border-stone-200/80 rounded-xl p-3 shadow-2xs">
                <span className="text-xs text-stone-500 font-medium block">Total Expected</span>
                <div className="text-lg font-extrabold text-stone-900 mt-0.5 font-mono">
                  {comparisonData.totalExpected} <span className="text-xs font-normal text-stone-500">Pcs</span>
                </div>
              </div>

              <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-xl p-3 shadow-2xs">
                <span className="text-xs text-stone-500 font-medium block">Total Scanned</span>
                <div className="text-lg font-extrabold text-[#543D2B] mt-0.5 font-mono">
                  {comparisonData.totalScanned} <span className="text-xs font-normal text-stone-500">Pcs</span>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 shadow-2xs">
                <span className="text-xs text-emerald-700 font-medium block">✓ Matched</span>
                <div className="text-lg font-extrabold text-emerald-800 mt-0.5 font-mono">
                  {comparisonData.totalMatched} <span className="text-xs font-normal text-emerald-600">Pcs</span>
                </div>
              </div>

              <div
                className={`border rounded-xl p-3 shadow-2xs ${
                  comparisonData.totalMissing > 0
                    ? "bg-rose-50/70 border-rose-200 text-rose-900"
                    : "bg-white border-stone-200 text-stone-400"
                }`}
              >
                <span className={`text-xs font-medium block ${comparisonData.totalMissing > 0 ? "text-rose-600" : "text-stone-400"}`}>
                  ✗ Missing
                </span>
                <div className="text-lg font-extrabold mt-0.5 font-mono">
                  {comparisonData.totalMissing} <span className="text-xs font-normal">Pcs</span>
                </div>
              </div>

              <div className="bg-[#F5F2EB] border border-stone-200/80 rounded-xl p-3 shadow-2xs">
                <span className="text-xs text-[#543D2B] font-medium block">+ Extra</span>
                <div className="text-lg font-extrabold text-[#543D2B] mt-0.5 font-mono">
                  {comparisonData.totalExtra} <span className="text-xs font-normal text-stone-500">Pcs</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap shrink-0">
              <div className="flex items-center gap-1.5 bg-[#F5F2EB] p-1 rounded-xl border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => setComparisonFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    comparisonFilter === "all"
                      ? "bg-white text-stone-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  All Items ({comparisonData.items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonFilter("matched")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    comparisonFilter === "extra"
                      ? "bg-[#543D2B] text-white shadow-2xs"
                      : "text-[#543D2B] hover:bg-[#FAF8F5]"
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
                <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search barcode..."
                  className="pl-8 h-8 text-xs bg-white border-stone-200 rounded-lg text-stone-900"
                />
              </div>
            </div>

            {/* Comparison Table */}
            <div className="flex-1 bg-white border border-stone-200/80 rounded-xl overflow-hidden flex flex-col min-h-0 shadow-2xs">
              <div className="flex-1 overflow-y-auto min-h-0">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F5F2EB] border-b border-stone-200 text-stone-700 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Barcode</th>
                      <th className="py-2.5 px-3 text-center">Expected</th>
                      <th className="py-2.5 px-3 text-center">Scanned</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
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
                            className={`hover:bg-[#FAF8F5] transition-colors ${
                              isMissing
                                ? "bg-rose-50/30"
                                : isPartial
                                ? "bg-amber-50/30"
                                : isExtra
                                ? "bg-[#FDFBF7]"
                                : "bg-white"
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                              {item.barcode}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-stone-700 font-mono">
                              {item.expectedQty}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md font-mono ${
                                  isMatched
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isPartial
                                    ? "bg-amber-100 text-amber-800"
                                    : isMissing
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-stone-100 text-stone-800"
                                }`}
                              >
                                {item.scannedQty}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {isMatched && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle className="h-3 w-3" /> Matched ({item.scannedQty}/{item.expectedQty})
                                </span>
                              )}
                              {isPartial && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                  Scanned {item.scannedQty}/{item.expectedQty} ({item.diff} Missing)
                                </span>
                              )}
                              {isMissing && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <XCircle className="h-3 w-3" /> Missing {item.expectedQty} Pcs
                                </span>
                              )}
                              {isExtra && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  <AlertTriangle className="h-3 w-3 text-blue-600" />
                                  +{item.diff} Extra (Actual: {item.expectedQty}, Scanned: {item.scannedQty})
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
                                    className="h-6.5 text-[11px] px-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-semibold rounded-md cursor-pointer"
                                    title="Add / Found 1 piece"
                                  >
                                    <Plus className="h-3 w-3 mr-0.5" /> Add Piece
                                  </Button>
                                </div>
                              )}
                              {isExtra && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDecrement(item.barcode)}
                                  className="h-6.5 text-[11px] px-2 text-rose-700 border-rose-200 hover:bg-rose-50 font-semibold rounded-md cursor-pointer"
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
                        <td colSpan="5" className="text-center py-10 text-stone-400 text-xs italic">
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
        <DialogFooter className="mt-3 pt-3 border-t border-stone-200/80 shrink-0 flex items-center justify-between flex-wrap gap-2">
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
                className="text-xs flex items-center gap-1.5 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl cursor-pointer"
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
                className="text-xs text-stone-500 hover:text-rose-600 hover:bg-rose-50 border-stone-200 rounded-xl cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear Scanned ({comparisonData.totalScanned} pcs)
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs border-stone-200 text-stone-600 hover:bg-[#F5F2EB] rounded-xl cursor-pointer px-4"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#543D2B] hover:bg-[#412E20] text-white text-xs font-bold rounded-xl px-4 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoxBarcodeScannerModal;
