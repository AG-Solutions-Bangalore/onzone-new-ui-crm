import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Trash2,
  ChevronLeft,
  Plus,
  Loader2,
  Calendar,
  Building2,
  FileText,
  Barcode,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  Hash,
  ShoppingBag,
  Layers,
} from "lucide-react";
import Select from "react-select";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import BASE_URL from "@/config/BaseUrl";
import Page from "../dashboard/page";
import { getTodayDate } from "@/utils/currentDate";
import dateyear from "@/utils/DateYear";
import { useFetchRetailer } from "@/hooks/useApi";
import { LoaderComponent } from "@/components/LoaderComponent/LoaderComponent";

// Zod schema for validation
const orderSchema = z.object({
  work_order_sa_year: z.string(),
  work_order_sa_date: z.string().min(1, "Date is required"),
  work_order_sa_retailer_id: z.string().min(1, "Retailer is required"),
  work_order_sa_dc_no: z.string().min(1, "DC No is required"),
  work_order_sa_dc_date: z.string().min(1, "DC Date is required"),
  work_order_sa_box: z.string().optional(),
  work_order_sa_pcs: z.string().min(1, "Pieces count is required"),
  work_order_sa_fabric_sale: z.string().min(1, "Fabric sale is required"),
  work_order_sa_count: z.number().min(1, "Count is required"),
  work_order_sa_remarks: z.string().optional(),
});

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

const CreateSales = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { toast } = useToast();

  const [workorder, setWorkorder] = useState({
    work_order_sa_year: dateyear || "",
    work_order_sa_date: getTodayDate() || "",
    work_order_sa_retailer_id: "",
    work_order_sa_dc_no: "",
    work_order_sa_dc_date: getTodayDate() || "",
    work_order_sa_box: "",
    work_order_sa_pcs: "",
    work_order_sa_fabric_sale: "",
    work_order_sa_count: 1,
    work_order_sa_remarks: "",
  });

  const [barcodes, setBarcodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [duplicateBarcodes, setDuplicateBarcodes] = useState({});
  const [currentInputValue, setCurrentInputValue] = useState("");

  const { data: retailerData, isFetching } = useFetchRetailer();

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem("token");

      const submissionData = {
        ...data,
        workorder_sub_sa_data: data.barcodes.map((barcode) => ({
          work_order_sa_sub_barcode: barcode,
        })),
      };

      const response = await fetch(`${BASE_URL}/api/create-work-order-sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });
      if (!response.ok) throw new Error("Failed to create sales order");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sales order created successfully",
        variant: "default",
      });
      navigate("/sales");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create sales order",
        variant: "destructive",
      });
    },
  });

  const onInputChange = (e) => {
    const { name, value } = e.target;
    setWorkorder({
      ...workorder,
      [name]: value,
    });

    // Clear barcodes if pcs count is reduced below current barcode count
    if (name === "work_order_sa_pcs") {
      const pcsCount = parseInt(value, 10) || 0;
      if (barcodes.length > pcsCount) {
        setBarcodes(barcodes.slice(0, pcsCount));
      }
    }
  };

  const calculateDuplicates = (barcodesList) => {
    const duplicates = {};
    const seen = {};

    barcodesList.forEach((barcode) => {
      if (seen[barcode]) {
        duplicates[barcode] = (duplicates[barcode] || 1) + 1;
      } else {
        seen[barcode] = true;
      }
    });

    return duplicates;
  };

  useEffect(() => {
    setDuplicateBarcodes(calculateDuplicates(barcodes));
  }, [barcodes]);

  const handleBarcodeInputChange = (e) => {
    setCurrentInputValue(e.target.value);
  };

  const addBarcode = async () => {
    if (!currentInputValue.trim()) return;

    const maxPcs = parseInt(workorder.work_order_sa_pcs || 0, 10);
    if (!maxPcs || maxPcs <= 0) {
      toast({
        title: "Total Pieces Required",
        description: "Please enter the 'Total No of Pcs' before scanning barcodes.",
        variant: "destructive",
      });
      return;
    }

    if (barcodes.length >= maxPcs) {
      toast({
        title: "Limit reached",
        description: `You have reached the maximum of ${maxPcs} T-codes specified in Total Pieces.`,
        variant: "destructive",
      });
      return;
    }

    const barcode = currentInputValue.trim();
    if (barcode.length < 4) {
      toast({
        title: "Invalid format",
        description: "T-Code must be at least 4 digits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/api/fetch-work-order-receive-check/${barcode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Barcode validation failed");
      const data = await response.json();

      if (data?.code === 200) {
        setBarcodes([...barcodes, barcode]);
        setCurrentInputValue("");

        toast({
          title: "T-Code Verified",
          description: `Barcode ${barcode} added to sales dispatch.`,
          variant: "default",
        });

        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      } else {
        toast({
          title: "Validation Failed",
          description: data?.msg || "Barcode not found in received orders",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error communicating with barcode verification service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBarcode();
    }
  };

  const removeBarcode = useCallback(
    (index) => {
      const newBarcodes = [...barcodes];
      newBarcodes.splice(index, 1);
      setBarcodes(newBarcodes);
    },
    [barcodes]
  );

  const onSubmit = async (e) => {
    e.preventDefault();

    const data = {
      ...workorder,
      work_order_sa_year: dateyear,
      work_order_sa_count: barcodes.length,
      barcodes: barcodes,
    };

    try {
      const validation = orderSchema.safeParse(data);
      if (!validation.success) {
        toast({
          variant: "destructive",
          title: "Please fix the following:",
          description: (
            <div className="grid gap-1">
              {validation.error.errors.map((error, i) => {
                const field = error.path[0].replace(/_/g, " ");
                const label = field.charAt(0).toUpperCase() + field.slice(1);
                return (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex items-center justify-center h-4 w-4 mt-0.5 shrink-0 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <p className="text-xs">
                      <span className="font-semibold">{label}:</span> {error.message}
                    </p>
                  </div>
                );
              })}
            </div>
          ),
        });
        return;
      }

      const expectedPcsCount = parseInt(workorder.work_order_sa_pcs, 10) || 0;
      if (barcodes.length !== expectedPcsCount) {
        toast({
          variant: "destructive",
          title: "Pieces Count Mismatch",
          description: `You specified ${expectedPcsCount} pieces, but ${barcodes.length} T-code barcodes are entered.`,
        });
        return;
      }

      submitMutation.mutate(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during validation",
      });
    }
  };

  const maxPcs = parseInt(workorder.work_order_sa_pcs || 0, 10);
  const isComplete = maxPcs > 0 && barcodes.length === maxPcs;
  const isInputDisabled = maxPcs > 0 && barcodes.length >= maxPcs;

  if (isFetching) {
    return <LoaderComponent name="Sales Order Form" />;
  }

  return (
    <Page>
      <div className="w-full space-y-4 max-w-7xl mx-auto pt-1">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FDFBF7] border border-stone-200/80 px-5 py-3 rounded-2xl shadow-2xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A27B5C] flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" />
              Sales & Distribution
            </span>
            <h1 className="font-heading text-lg font-bold text-stone-800 tracking-tight leading-tight mt-0.5">
              Create Work Order Sales
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Record new delivery outward sales and link verified garment T-Codes.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs shadow-2xs font-semibold"
          >
            <Link to="/sales" className="flex items-center gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              Back to Sales
            </Link>
          </Button>
        </div>

        {/* Section 1: Sales & Dispatch Information */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5F2EB] text-[#A27B5C]">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                1. Order & Dispatch Details
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Retailer */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-stone-400" />
                Retailer <span className="text-red-500">*</span>
              </Label>
              <Select
                name="work_order_sa_retailer_id"
                isSearchable={true}
                options={retailerData?.customer?.map((retailer) => ({
                  value: retailer.id,
                  label: retailer.customer_name,
                }))}
                value={
                  retailerData?.customer
                    ?.map((retailer) => ({
                      value: retailer.id,
                      label: retailer.customer_name,
                    }))
                    .find(
                      (opt) =>
                        opt.value === workorder.work_order_sa_retailer_id
                    ) || null
                }
                onChange={(selectedOption) => {
                  setWorkorder({
                    ...workorder,
                    work_order_sa_retailer_id: selectedOption?.value || "",
                  });
                }}
                styles={customSelectStyles}
                placeholder="Search and select retailer..."
              />
            </div>

            {/* Sales Date */}
            <div className="space-y-1.5">
              <Label htmlFor="salesDate" className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                Sales Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id="salesDate"
                name="work_order_sa_date"
                value={workorder.work_order_sa_date}
                onChange={onInputChange}
                className="h-10 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs font-medium"
              />
            </div>

            {/* Total No of Pcs */}
            <div className="space-y-1.5">
              <Label htmlFor="pcsCount" className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <PackageCheck className="h-3.5 w-3.5 text-stone-400" />
                Total No of Pcs <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pcsCount"
                type="number"
                placeholder="e.g. 50"
                name="work_order_sa_pcs"
                value={workorder.work_order_sa_pcs}
                onChange={onInputChange}
                className="h-10 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs font-medium"
              />
            </div>

            {/* DC No */}
            <div className="space-y-1.5">
              <Label htmlFor="dcNo" className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-stone-400" />
                DC No <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dcNo"
                placeholder="Enter Delivery Challan No"
                name="work_order_sa_dc_no"
                value={workorder.work_order_sa_dc_no}
                onChange={onInputChange}
                className="h-10 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs font-medium"
              />
            </div>

            {/* DC Date */}
            <div className="space-y-1.5">
              <Label htmlFor="dcDate" className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                DC Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id="dcDate"
                name="work_order_sa_dc_date"
                value={workorder.work_order_sa_dc_date}
                onChange={onInputChange}
                className="h-10 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs font-medium"
              />
            </div>

            {/* Fabric Sales */}
            <div className="space-y-1.5">
              <Label htmlFor="fabricSale" className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-stone-400" />
                Fabric Sales <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fabricSale"
                placeholder="Fabric sales reference / type"
                name="work_order_sa_fabric_sale"
                value={workorder.work_order_sa_fabric_sale}
                onChange={onInputChange}
                className="h-10 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs font-medium"
              />
            </div>

            {/* Remarks */}
            <div className="space-y-1.5 col-span-full">
              <Label htmlFor="remarks" className="text-xs font-semibold text-stone-700">
                Remarks / Dispatch Notes
              </Label>
              <Input
                id="remarks"
                placeholder="Optional notes or dispatch remarks..."
                name="work_order_sa_remarks"
                value={workorder.work_order_sa_remarks}
                onChange={onInputChange}
                className="h-10 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Interactive T-Code Barcode Scanning & Verification Panel */}
        <div className="bg-[#FDFBF7] border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          
          {/* Header with Live Progress Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#543D2B] text-white">
                <Barcode className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  2. Garment T-Code Barcode Scanner
                </h2>
                <p className="text-[11px] text-stone-500">
                  Scan or enter the unique barcode digits for each garment piece.
                </p>
              </div>
            </div>

            {/* Status Counter Badge */}
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  isComplete
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                    : barcodes.length > 0
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-stone-100 text-stone-600 border-stone-200"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Barcode className="h-3.5 w-3.5 text-amber-600" />
                )}
                <span>
                  Scanned: {barcodes.length} / {maxPcs || 0} Pcs
                </span>
              </div>
            </div>
          </div>

          {/* Scanner Input Row */}
          <div className="flex items-center gap-2.5 max-w-xl">
            <div className="relative flex-1">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <Input
                ref={inputRef}
                value={currentInputValue}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/\s/g, "");
                  handleBarcodeInputChange({ target: { value } });
                }}
                onKeyPress={handleKeyPress}
                onPaste={(e) => {
                  const pastedText = e.clipboardData
                    .getData("text")
                    .toUpperCase()
                    .replace(/\s/g, "");
                  e.preventDefault();
                  document.execCommand("insertText", false, pastedText);
                  handleBarcodeInputChange({ target: { value: pastedText } });
                }}
                placeholder={
                  isInputDisabled
                    ? "Target pieces count reached"
                    : "SCAN OR ENTER T-CODE DIGITS..."
                }
                className="h-10 pl-10 pr-3 font-mono text-xs uppercase tracking-wider bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-900 shadow-2xs font-semibold placeholder:font-sans placeholder:normal-case"
                disabled={isInputDisabled}
              />
            </div>

            <Button
              type="button"
              onClick={addBarcode}
              disabled={isInputDisabled || !currentInputValue.trim() || loading}
              className="h-10 px-5 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add T-Code
            </Button>
          </div>

          {/* Scanned Barcodes Grid Area */}
          <div className="rounded-xl border border-stone-200 bg-white/80 p-3 min-h-[140px] max-h-[300px] overflow-y-auto shadow-inner">
            {barcodes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {barcodes.map((barcode, index) => {
                  const count = barcodes.filter((b) => b === barcode).length;
                  const isDuplicate = count > 1;

                  return (
                    <div
                      key={`${index}-${barcode}`}
                      className={`group relative rounded-xl border p-2 text-xs flex items-center justify-between transition-all ${
                        isDuplicate
                          ? "bg-amber-50/80 border-amber-300 text-amber-900 shadow-2xs"
                          : "bg-white border-stone-200/90 text-stone-800 hover:border-[#A27B5C] shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-stone-100 text-[10px] font-bold text-stone-600">
                          {index + 1}
                        </span>
                        <span className="font-mono font-bold truncate text-[11px]" title={barcode}>
                          {barcode}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 pl-1">
                        {isDuplicate && (
                          <span className="rounded-md bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-800">
                            x{count}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeBarcode(index)}
                          className="flex h-5 w-5 items-center justify-center rounded-md text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove barcode"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F2EB] text-[#A27B5C] mb-2">
                  <Barcode className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-stone-700">
                  No T-Code barcodes added yet
                </p>
                <p className="text-[11px] text-stone-400 max-w-xs mt-0.5">
                  Type or scan barcode numbers in the box above to link them to this delivery order.
                </p>
              </div>
            )}
          </div>

          {/* Duplicate Warning Indicator */}
          {Object.keys(duplicateBarcodes).length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 font-medium">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                Duplicate T-Codes detected:{" "}
                {Object.entries(duplicateBarcodes)
                  .map(([barcode, count]) => `${barcode} (${count}x)`)
                  .join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-6">
          <Button
            variant="outline"
            asChild
            className="h-10 px-5 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs font-semibold shadow-2xs"
          >
            <Link to="/sales">Cancel</Link>
          </Button>

          <Button
            type="button"
            onClick={onSubmit}
            disabled={submitMutation.isPending}
            className="h-10 px-6 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Submitting Sales Order...</span>
              </>
            ) : (
              <>
                <PackageCheck className="h-4 w-4" />
                <span>Submit Sales Order</span>
              </>
            )}
          </Button>
        </div>

      </div>
    </Page>
  );
};

export default CreateSales;
