import React, { useState, useRef, useEffect } from "react";
import Page from "../dashboard/page";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { getTodayDate } from "@/utils/currentDate";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Trash2,
  ArrowLeft,
  Scan,
  X,
  ScanQrCode,
  Minus,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import BASE_URL from "@/config/BaseUrl";
import { useMutation } from "@tanstack/react-query";
import { useFetchBrand } from "@/hooks/useApi";
import { LoaderComponent } from "@/components/LoaderComponent/LoaderComponent";
import ReactSelect from "react-select";

// Luxury custom select styles
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    borderColor: state.isFocused ? "#A27B5C" : "#E7E5E4",
    borderRadius: "0.75rem",
    minHeight: "2.125rem",
    height: "2.125rem",
    fontSize: "0.75rem",
    fontWeight: "500",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(162, 123, 92, 0.15)" : "none",
    "&:hover": {
      borderColor: "#A27B5C",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 0.625rem",
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
    padding: "0.4rem 0.625rem",
  }),
};

const formSchema = z.object({
  stock_brand: z.string().min(1, "Brand is required"),
  stock_date: z.string().min(1, "Date is required"),
  stock_remarks: z.string().optional(),
});

const CreateStock = () => {
  const { toast } = useToast();
  const [scanningActive, setScanningActive] = useState(true);
  const barcodeInputRef = useRef(null);
  const mobileBarcodeInputRef = useRef(null);
  const navigate = useNavigate();
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [barcodes, setBarcodes] = useState([]);
  const [barcodeCounts, setBarcodeCounts] = useState({});

  useEffect(() => {
    if (scanningActive && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [scanningActive]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stock_brand: "",
      stock_date: getTodayDate(),
      stock_remarks: "",
    },
  });

  const {
    data: brandData,
    isFetching: isBrandLoading,
  } = useFetchBrand();

  const brandOptions =
    brandData?.brand?.map((brand) => ({
      value: String(brand.fabric_brand_brands),
      label: String(brand.fabric_brand_brands),
    })) || [];

  const handleBarcodeScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const barcode = e.target.value.trim();
      if (barcode) {
        addBarcode(barcode);
        e.target.value = "";
      }
    }
  };

  const addBarcode = (barcode) => {
    setBarcodes((prev) => [...prev, barcode]);
    setBarcodeCounts((prev) => {
      const newCounts = { ...prev };
      newCounts[barcode] = (newCounts[barcode] || 0) + 1;
      return newCounts;
    });
    setHighlightedItem(barcode);
    setTimeout(() => {
      setHighlightedItem(null);
    }, 2000);
    toast({
      title: "Barcode Added",
      description: `Added barcode: ${barcode}`,
    });
  };

  const removeBarcode = (barcode) => {
    setBarcodes((prevBarcodes) => {
      const newBarcodes = [...prevBarcodes];
      const index = newBarcodes.indexOf(barcode);
      if (index !== -1) {
        newBarcodes.splice(index, 1);
      }
      return newBarcodes;
    });

    setBarcodeCounts((prevCounts) => {
      const newCounts = { ...prevCounts };
      if (newCounts[barcode] > 1) {
        newCounts[barcode] -= 1;
      } else {
        delete newCounts[barcode];
      }
      return newCounts;
    });

    toast({
      title: "Barcode Updated",
      description: `Updated barcode: ${barcode}`,
    });
  };

  const handleBarcodeScanMobile = (result) => {
    if (result) {
      addBarcode(result);
      setShowScanner(false);
    }
  };

  const submitStockMutation = useMutation({
    mutationFn: async (stockData) => {
      const response = await fetch(`${BASE_URL}/api/create-stock-add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(stockData),
      });
      if (!response.ok) throw new Error("Failed to create stock");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.msg || "Stock created successfully",
        variant: "default",
      });
      form.reset({
        stock_brand: "",
        stock_date: getTodayDate(),
        stock_remarks: "",
      });
      setBarcodes([]);
      setBarcodeCounts({});
      if (window.innerWidth < 1024) {
        setShowFormDrawer(false);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create stock",
        variant: "destructive",
      });
      if (window.innerWidth < 1024) {
        setShowFormDrawer(true);
      }
    },
  });

  const handleSubmitStock = () => {
    if (barcodes.length === 0) {
      toast({
        title: "No Barcodes",
        description: "Please add at least one barcode to the stock",
        variant: "destructive",
      });
      return;
    }

    const stockData = {
      ...form.getValues(),
      stock_data: barcodes.map((barcode) => ({ stock_barcode: barcode })),
    };

    if (window.innerWidth < 1024) {
      setShowFormDrawer(true);
    } else {
      try {
        submitStockMutation.mutate(stockData);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred",
        });
      }
    }
  };

  const handleFinalSubmit = () => {
    const stockData = {
      ...form.getValues(),
      stock_data: barcodes.map((barcode) => ({ stock_barcode: barcode })),
    };
    try {
      submitStockMutation.mutate(stockData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  const totalBarcodes = barcodes.length;

  if (isBrandLoading) {
    return <LoaderComponent name="Brand Data Fetching" />;
  }

  return (
    <Page>
      <div className="w-full space-y-2.5">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FDFBF7] border border-stone-200/80 px-4 py-2.5 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/stock")}
              className="h-8 w-8 p-0 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl shadow-2xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
                Create Stock
                <span className="text-[10px] font-semibold bg-[#F5F2EB] text-[#543D2B] px-2 py-0.5 rounded-full border border-stone-200/80 hidden sm:inline-block">
                  Inventory Inward
                </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F5F2EB] border border-stone-200/80 text-xs font-semibold text-stone-700">
              <Package className="h-3.5 w-3.5 text-[#A27B5C]" />
              <span>Total Barcodes:</span>
              <span className="font-bold text-[#543D2B] bg-white px-2 py-0.5 rounded-lg border border-stone-200/60 shadow-2xs ml-0.5">
                {totalBarcodes}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="block lg:hidden space-y-3">
          <div className="bg-[#FDFBF7] border border-stone-200/80 rounded-2xl p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-stone-800">
                Barcode Scanner
              </Label>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant={scanningActive ? "default" : "secondary"}
                  className={`text-[10px] h-5 font-semibold px-2 rounded-lg ${
                    scanningActive
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {scanningActive ? "Active" : "Paused"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScanningActive(!scanningActive)}
                  className="h-6 w-6 p-0 border-stone-200 text-stone-700 rounded-lg hover:bg-[#F5F2EB]"
                >
                  {scanningActive ? <X className="h-3 w-3" /> : <Scan className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            <Input
              ref={mobileBarcodeInputRef}
              placeholder="Scan or enter barcode..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const barcode = e.target.value.trim();
                  if (barcode) {
                    addBarcode(barcode);
                    e.target.value = "";
                  }
                }
              }}
              className="h-8 text-xs rounded-xl bg-white border-stone-200"
              disabled={!scanningActive}
            />
          </div>

          {/* Barcodes section in mobile */}
          <div className="bg-[#FDFBF7] border border-stone-200/80 rounded-2xl p-3 shadow-2xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-stone-800">
                Scanned Barcodes ({barcodes.length})
              </h3>
              {barcodes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBarcodes([]);
                    setBarcodeCounts({});
                  }}
                  className="h-6 px-2 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            {barcodes.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
                {Object.entries(barcodeCounts).map(([barcode, count]) => (
                  <div
                    key={barcode}
                    className={`bg-white p-1.5 rounded-xl border border-stone-200/80 shadow-2xs flex items-center justify-between text-xs ${
                      highlightedItem === barcode ? "border-[#A27B5C] bg-[#FAF8F5]" : ""
                    }`}
                  >
                    <span className="font-mono text-[11px] font-semibold text-stone-800 truncate" title={barcode}>
                      {barcode}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {count > 1 && (
                        <span className="text-[10px] font-bold text-[#543D2B] bg-[#F5F2EB] px-1.5 py-0.5 rounded-md">
                          {count}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBarcode(barcode)}
                        className="h-5 w-5 hover:bg-red-50 text-red-500 rounded-md p-0"
                      >
                        {count > 1 ? <Minus className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-stone-400">
                No barcodes added yet
              </div>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-[#FDFBF7] border-t border-stone-200 p-2.5 flex justify-between gap-2 z-20">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/stock")}
              className="border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs h-9 px-4"
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowScanner(true)}
              disabled={!scanningActive}
              className="border-stone-200 text-[#543D2B] hover:bg-[#F5F2EB] rounded-xl text-xs h-9 px-3"
            >
              <ScanQrCode className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                if (barcodes.length === 0) {
                  toast({
                    title: "No Barcodes",
                    description: "Please add at least one barcode to the stock",
                    variant: "destructive",
                  });
                  return;
                }
                setShowFormDrawer(true);
              }}
              disabled={barcodes.length === 0}
              className="bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold h-9 px-5 disabled:opacity-50"
            >
              Next Step
            </Button>
          </div>
        </div>

        {/* Desktop View (Zero Unwanted Scroll) */}
        <div className="hidden lg:grid grid-cols-12 gap-3 h-[calc(100vh-140px)]">
          {/* Left Form Panel */}
          <div className="col-span-5 xl:col-span-4 bg-[#FDFBF7] border border-stone-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between overflow-hidden">
            <div className="space-y-2.5 overflow-y-auto pr-1">
              <div className="space-y-1">
                <Label htmlFor="stock_brand" className="text-xs font-bold text-stone-800">
                  Brand <span className="text-red-500">*</span>
                </Label>
                <ReactSelect
                  id="stock_brand"
                  options={brandOptions}
                  value={
                    brandOptions.find(
                      (option) => option.value === form.watch("stock_brand"),
                    ) || null
                  }
                  onChange={(option) =>
                    form.setValue(
                      "stock_brand",
                      option ? option.value : "",
                      { shouldValidate: true },
                    )
                  }
                  placeholder="Select brand"
                  isSearchable
                  styles={customSelectStyles}
                />
                {form.formState.errors.stock_brand && (
                  <p className="text-[11px] text-destructive font-medium">
                    {form.formState.errors.stock_brand.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="stock_date" className="text-xs font-bold text-stone-800">
                  Date
                </Label>
                <Input
                  id="stock_date"
                  type="date"
                  className="h-8.5 text-xs rounded-xl bg-white border-stone-200 font-medium text-stone-800"
                  {...form.register("stock_date")}
                />
                {form.formState.errors.stock_date && (
                  <p className="text-[11px] text-destructive font-medium">
                    {form.formState.errors.stock_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="stock_remarks" className="text-xs font-bold text-stone-800">
                  Remarks
                </Label>
                <Textarea
                  id="stock_remarks"
                  rows={2}
                  className="text-xs rounded-xl bg-white border-stone-200 placeholder:text-stone-400 resize-none py-1.5"
                  placeholder="Any special instructions"
                  {...form.register("stock_remarks")}
                />
              </div>

              {/* Barcode Scanner Box */}
              <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-xl p-2.5 space-y-1.5 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Scan className="h-3.5 w-3.5 text-[#A27B5C]" />
                    Barcode Scanner
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={scanningActive ? "default" : "secondary"}
                      className={`text-[10px] h-4.5 px-2 rounded-md font-semibold ${
                        scanningActive
                          ? "bg-emerald-600 text-white"
                          : "bg-stone-200 text-stone-600"
                      }`}
                    >
                      {scanningActive ? "Active" : "Paused"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScanningActive(!scanningActive)}
                      className="h-5 w-5 p-0 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-md"
                    >
                      {scanningActive ? <X className="h-3 w-3" /> : <Scan className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Input
                    ref={barcodeInputRef}
                    placeholder="Scan or enter barcode..."
                    onKeyDown={handleBarcodeScan}
                    className="flex-1 h-8 text-xs rounded-lg bg-white border-stone-200"
                    disabled={!scanningActive}
                  />
                  <Button
                    onClick={() => {
                      if (barcodeInputRef.current) {
                        barcodeInputRef.current.focus();
                      }
                    }}
                    disabled={!scanningActive}
                    className="h-8 px-2.5 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-lg text-xs font-bold shadow-2xs"
                  >
                    <Scan className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-[10px] text-stone-400 font-medium">
                  {scanningActive
                    ? "Scan barcode or type and press Enter"
                    : "Activate scanning to add barcodes"}
                </p>
              </div>
            </div>

            {/* Bottom Submit Action */}
            <div className="pt-2 border-t border-stone-200/80">
              <Button
                onClick={handleSubmitStock}
                disabled={barcodes.length === 0 || submitStockMutation.isPending}
                className="w-full h-9 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitStockMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Submitting Stock...</span>
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4" />
                    <span>Submit Stock ({totalBarcodes})</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Barcodes Container Panel */}
          <div className="col-span-7 xl:col-span-8 bg-[#FDFBF7] border border-stone-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center pb-2.5 mb-2 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900 tracking-tight">
                  Scanned Barcodes
                </span>
                <span className="text-[11px] font-bold bg-[#F5F2EB] text-[#543D2B] px-2 py-0.5 rounded-full border border-stone-200/60">
                  {Object.keys(barcodeCounts).length} Unique ({barcodes.length} Total)
                </span>
              </div>
              {barcodes.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBarcodes([]);
                    setBarcodeCounts({});
                  }}
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200/80 rounded-lg px-2.5 font-semibold"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {barcodes.length > 0 ? (
              <div className="flex-grow overflow-y-auto pr-1">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                  {Object.entries(barcodeCounts).map(([barcode, count]) => (
                    <div
                      key={barcode}
                      className={`bg-white p-2 rounded-xl border transition-all duration-200 flex items-center justify-between shadow-2xs ${
                        highlightedItem === barcode
                          ? "border-[#A27B5C] ring-2 ring-[#A27B5C]/20 bg-[#FAF8F5]"
                          : "border-stone-200/80 hover:border-stone-300"
                      }`}
                    >
                      <span
                        className="text-xs font-mono font-semibold text-stone-800 truncate mr-1.5"
                        title={barcode}
                      >
                        {barcode}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {count > 1 ? (
                          <>
                            <span className="text-[10px] font-bold text-[#543D2B] bg-[#F5F2EB] px-1.5 py-0.5 rounded-md">
                              x{count}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBarcode(barcode)}
                              className="h-6 w-6 hover:bg-red-50 text-red-500 rounded-lg"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBarcode(barcode)}
                            className="h-6 w-6 hover:bg-red-50 text-red-500 rounded-lg"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full border border-dashed border-stone-300/80 rounded-xl bg-[#FAF8F5] p-6 text-center">
                <div className="bg-[#F5F2EB] p-3 rounded-full mb-2.5 text-[#A27B5C]">
                  <Scan className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-bold text-stone-700 mb-0.5">
                  No Barcodes Added Yet
                </h4>
                <p className="text-[11px] text-stone-400 max-w-xs">
                  Scan garments using your handheld scanner or enter barcode numbers in the left panel
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Camera Scanner Dialog */}
        <Dialog open={showScanner} onOpenChange={setShowScanner}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl bg-[#FAF8F5] border border-stone-200">
            <DialogHeader className="px-4 pt-4">
              <DialogTitle className="text-sm font-bold text-stone-900">Scan Barcode</DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Point your camera at a barcode to scan
              </DialogDescription>
            </DialogHeader>
            <div className="h-64 relative">
              <Scanner
                onScan={(detectedCodes) => {
                  if (detectedCodes && detectedCodes.length > 0) {
                    const result = detectedCodes[0].rawValue;
                    setTimeout(() => {
                      handleBarcodeScanMobile(result);
                    }, 100);
                  }
                }}
                onError={(error) => {
                  console.log(error?.message);
                  toast({
                    title: "Scan Error",
                    description: error?.message || "Failed to scan barcode",
                    variant: "destructive",
                  });
                }}
                formats={[
                  "qr_code",
                  "code_128",
                  "code_39",
                  "code_93",
                  "codabar",
                  "ean_13",
                  "ean_8",
                  "upc_a",
                  "upc_e",
                  "itf",
                ]}
                constraints={{
                  facingMode: "environment",
                  aspectRatio: 1,
                }}
                styles={{
                  container: {
                    borderRadius: "8px",
                    overflow: "hidden",
                  },
                  video: {
                    objectFit: "cover",
                  },
                }}
              />
            </div>
            <DialogFooter className="px-4 pb-4">
              <Button
                variant="outline"
                onClick={() => setShowScanner(false)}
                className="border-stone-200 text-stone-700 rounded-xl text-xs"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mobile Stock Submit Drawer */}
        <Drawer open={showFormDrawer} onOpenChange={setShowFormDrawer}>
          <DrawerContent className="max-h-[90vh] bg-[#FAF8F5] border-t border-stone-200">
            <DrawerHeader className="text-left">
              <DrawerTitle className="text-sm font-bold text-stone-900">Stock Inward Details</DrawerTitle>
              <DrawerDescription className="text-xs text-stone-500">
                Complete brand and date info before final submission
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto space-y-3">
              <div className="p-2 bg-[#F5F2EB] rounded-xl border border-stone-200/80">
                <p className="text-xs font-bold text-[#543D2B] text-center">
                  Total {barcodes.length} barcode(s) scanned
                </p>
              </div>
              <form className="space-y-3 pb-4">
                <div className="space-y-1">
                  <Label htmlFor="mobile_stock_brand" className="text-xs font-bold text-stone-800">
                    Brand <span className="text-red-500">*</span>
                  </Label>
                  <ReactSelect
                    id="mobile_stock_brand"
                    options={brandOptions}
                    value={
                      brandOptions.find(
                        (option) => option.value === form.watch("stock_brand"),
                      ) || null
                    }
                    onChange={(option) =>
                      form.setValue("stock_brand", option ? option.value : "", {
                        shouldValidate: true,
                      })
                    }
                    placeholder="Select brand"
                    isSearchable
                    styles={customSelectStyles}
                  />
                  {form.formState.errors.stock_brand && (
                    <p className="text-[11px] text-destructive">
                      {form.formState.errors.stock_brand.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mobile_stock_date" className="text-xs font-bold text-stone-800">
                    Date
                  </Label>
                  <Input
                    id="mobile_stock_date"
                    type="date"
                    className="h-8.5 text-xs rounded-xl bg-white border-stone-200"
                    {...form.register("stock_date")}
                  />
                  {form.formState.errors.stock_date && (
                    <p className="text-[11px] text-destructive">
                      {form.formState.errors.stock_date.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mobile_stock_remarks" className="text-xs font-bold text-stone-800">
                    Remarks
                  </Label>
                  <Textarea
                    id="mobile_stock_remarks"
                    rows={2}
                    placeholder="Any special instructions"
                    className="text-xs rounded-xl bg-white border-stone-200"
                    {...form.register("stock_remarks")}
                  />
                </div>
              </form>
            </div>
            <DrawerFooter className="pt-2 gap-2">
              <Button
                onClick={handleFinalSubmit}
                disabled={
                  !form.formState.isValid ||
                  barcodes.length === 0 ||
                  submitStockMutation.isPending
                }
                className="bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold h-9"
              >
                {submitStockMutation.isPending ? "Submitting..." : "Submit Stock"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFormDrawer(false)}
                className="border-stone-200 text-stone-700 rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </Page>
  );
};

export default CreateStock;
