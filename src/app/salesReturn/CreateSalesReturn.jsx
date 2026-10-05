import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Trash2,
  ChevronLeft,
  Plus,
  Minus,
  Loader2,
  Calendar,
  Building2,
  Barcode,
  PackageCheck,
  CheckCircle2,
  Hash,
  RotateCcw,
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
  work_order_sa_year: z.union([z.string(), z.number()]).optional(),
  work_order_sa_date: z.string().min(1, "Date is required"),
  work_order_sa_retailer_id: z.union([
    z.string().min(1, "Retailer is required"),
    z.number().min(1, "Retailer is required"),
  ]),
  work_order_sa_dc_no: z.string().min(1, "Return Slip No is required"),
  work_order_sa_dc_date: z.string().optional(),
  work_order_sa_box: z.union([z.string(), z.number()]).optional(),
  work_order_sa_pcs: z.union([
    z.string().min(1, "Pieces count is required"),
    z.number().min(1, "Pieces count is required"),
  ]),
  work_order_sa_fabric_sale: z.string().optional(),
  work_order_sa_count: z.union([z.string(), z.number()]).optional(),
  work_order_sa_remarks: z.string().optional(),
});

// Calculate total pieces and box count from a combination string like "42x1 + 48x1"
const computeComboTotal = (comboStr) => {
  if (!comboStr) return { pcs: 0, boxes: 0 };
  let totalPcs = 0;
  let totalBoxes = 0;

  const parts = String(comboStr).split("+");
  parts.forEach((part) => {
    const match = part.trim().match(/(\d+)\s*[xX*]\s*(\d+)/);
    if (match) {
      const size = parseInt(match[1], 10) || 0;
      const count = parseInt(match[2], 10) || 0;
      totalPcs += size * count;
      totalBoxes += count;
    } else {
      const num = parseInt(part.trim(), 10);
      if (!isNaN(num)) {
        totalPcs += num;
        totalBoxes += 1;
      }
    }
  });

  return { pcs: totalPcs, boxes: totalBoxes };
};

// Parse response from getboxcombination/{value} API
const parseBoxCombinationResponse = (data) => {
  if (!data) return { minCombo: null, maxCombo: null };

  const formatComboValue = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (Array.isArray(v)) {
      return v
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            return item.box_name || item.name || item.size || JSON.stringify(item);
          }
          return String(item);
        })
        .join(" + ");
    }
    if (typeof v === "object") {
      if (v.combination) return formatComboValue(v.combination);
      if (v.combo) return formatComboValue(v.combo);
      return Object.entries(v)
        .map(([k, val]) => `${k}x${val}`)
        .join(" + ");
    }
    return String(v);
  };

  const payload =
    data.data ||
    data.box_combination ||
    data.boxCombination ||
    data.combination ||
    data.combinations ||
    data;

  const minRaw =
    payload.closest_min_combo ??
    payload.closest_min ??
    payload.minCombo ??
    payload.min_combo ??
    payload.min ??
    payload.min_combination ??
    payload.minimum ??
    payload.min_box ??
    payload.minBox;

  const maxRaw =
    payload.closest_max_combo ??
    payload.closest_max ??
    payload.maxCombo ??
    payload.max_combo ??
    payload.max ??
    payload.max_combination ??
    payload.maximum ??
    payload.max_box ??
    payload.maxBox;

  const minFormatted = formatComboValue(minRaw);
  const maxFormatted = formatComboValue(maxRaw);

  return {
    minCombo: minFormatted,
    maxCombo: maxFormatted,
  };
};

// Helper function to calculate closest min and max box combinations based on pieces
const calculateBoxCombos = (totalPcs) => {
  const n = parseInt(totalPcs, 10);
  if (!n || n <= 0) return { minCombo: null, maxCombo: null };

  const standardSizes = [32, 30, 28, 24, 20, 18, 16, 14, 12];

  // Find exact combinations of standard box sizes that sum to n
  const findExactCombos = (target) => {
    const results = [];
    const search = (remaining, startIndex, current) => {
      if (remaining === 0) {
        results.push([...current]);
        return;
      }
      if (remaining < 0) return;
      for (let i = startIndex; i < standardSizes.length; i++) {
        const size = standardSizes[i];
        if (size <= remaining) {
          current.push(size);
          search(remaining - size, i, current);
          current.pop();
        }
      }
    };
    search(target, 0, []);
    return results;
  };

  const formatCombo = (countsMap) => {
    return Object.entries(countsMap)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([size, count]) => `${size}x${count}`)
      .join(" + ");
  };

  const toCountsMap = (sizesList) => {
    const map = {};
    sizesList.forEach((s) => {
      map[s] = (map[s] || 0) + 1;
    });
    return map;
  };

  const exactCombos = findExactCombos(n);

  if (exactCombos.length > 0) {
    const sorted = [...exactCombos].sort((a, b) => a.length - b.length);
    const minComboSizes = sorted[0];
    const maxComboSizes = sorted[sorted.length - 1];

    const minFormatted = formatCombo(toCountsMap(minComboSizes));
    const maxFormatted = formatCombo(toCountsMap(maxComboSizes));

    return {
      minCombo: minFormatted,
      maxCombo: maxFormatted,
    };
  }

  if (n % 16 === 0) {
    const boxes = n / 16;
    return {
      minCombo: null,
      maxCombo: `16x${boxes}`,
    };
  }

  const base16Count = Math.floor(n / 16);
  const remainder = n % 16;

  if (base16Count > 0 && remainder > 0) {
    return {
      minCombo: null,
      maxCombo: `16x${base16Count} + ${remainder}x1`,
    };
  }

  return {
    minCombo: null,
    maxCombo: `${n}x1`,
  };
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

const CreateSalesReturn = () => {
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
  const [currentInputValue, setCurrentInputValue] = useState("");

  // Debounce pieces input to prevent firing API on every single keystroke/arrow step
  const [debouncedPcs, setDebouncedPcs] = useState(workorder.work_order_sa_pcs);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPcs(workorder.work_order_sa_pcs);
    }, 450);
    return () => clearTimeout(timer);
  }, [workorder.work_order_sa_pcs]);

  // Query backend getboxcombination/{value} API using debounced value
  const { data: apiBoxCombo, isLoading: isBoxComboLoading } = useQuery({
    queryKey: ["boxCombinationReturn", debouncedPcs],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const pcs = debouncedPcs;
      if (!pcs || parseInt(pcs, 10) <= 0) return null;
      try {
        const response = await fetch(
          `${BASE_URL}/api/getboxcombination/${pcs}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) return null;
        return await response.json();
      } catch (err) {
        console.warn("getboxcombination API error:", err);
        return null;
      }
    },
    enabled: Boolean(debouncedPcs && parseInt(debouncedPcs, 10) > 0),
    staleTime: 5 * 60 * 1000,
  });

  const isComboLoading =
    isBoxComboLoading ||
    (workorder.work_order_sa_pcs !== debouncedPcs &&
      parseInt(workorder.work_order_sa_pcs, 10) > 0);

  const boxCombos = useMemo(() => {
    if (apiBoxCombo) {
      const parsed = parseBoxCombinationResponse(apiBoxCombo);
      if (parsed.minCombo || parsed.maxCombo) {
        return parsed;
      }
    }
    return calculateBoxCombos(workorder.work_order_sa_pcs);
  }, [apiBoxCombo, workorder.work_order_sa_pcs]);

  const uniqueBarcodes = useMemo(() => {
    const map = new Map();
    barcodes.forEach((b) => {
      map.set(b, (map.get(b) || 0) + 1);
    });
    return Array.from(map.entries()).map(([barcode, count], idx) => ({
      index: idx + 1,
      barcode,
      count,
    }));
  }, [barcodes]);

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

      const response = await fetch(
        `${BASE_URL}/api/create-work-order-sales-return`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submissionData),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || errorData?.msg || "Failed to create sales return"
        );
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description:
          data?.msg ||
          data?.message ||
          "Sales return record created successfully",
        variant: "default",
      });
      navigate("/sales-return");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sales return",
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
          description: `Barcode ${barcode} added to sales return.`,
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

  const removeOneBarcode = useCallback(
    (barcodeToRemove) => {
      const idx = barcodes.lastIndexOf(barcodeToRemove);
      if (idx !== -1) {
        const newBarcodes = [...barcodes];
        newBarcodes.splice(idx, 1);
        setBarcodes(newBarcodes);
      }
    },
    [barcodes]
  );

  const addOneBarcode = useCallback(
    (barcodeToAdd) => {
      const maxPcs = parseInt(workorder.work_order_sa_pcs || 0, 10);
      if (barcodes.length >= maxPcs) {
        toast({
          title: "Limit reached",
          description: `You have reached the maximum of ${maxPcs} T-codes specified in Total Pieces.`,
          variant: "destructive",
        });
        return;
      }
      setBarcodes((prev) => [...prev, barcodeToAdd]);
    },
    [barcodes.length, workorder.work_order_sa_pcs, toast]
  );

  const removeAllOfBarcode = useCallback(
    (barcodeToRemove) => {
      setBarcodes((prev) => prev.filter((b) => b !== barcodeToRemove));
    },
    []
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
    return <LoaderComponent name="Sales Return Form" />;
  }

  return (
    <Page>
      <div className="w-full space-y-4 max-w-7xl mx-auto pt-1">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FDFBF7] border border-stone-200/80 px-5 py-3 rounded-2xl shadow-2xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A27B5C] flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Sales Return
            </span>
            <h1 className="font-heading text-lg font-bold text-stone-800 tracking-tight leading-tight mt-0.5">
              Create Sales Return
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Record customer sales return and link verified product barcodes.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs shadow-2xs font-semibold"
          >
            <Link to="/sales-return" className="flex items-center gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        {/* Return & Retailer Information Form */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Return Date */}
            <div className="space-y-1.5">
              <Label htmlFor="salesDate" className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                Return Date <span className="text-red-500">*</span>
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
              {workorder.work_order_sa_pcs && parseInt(workorder.work_order_sa_pcs, 10) > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] pt-0.5">
                  {isComboLoading ? (
                    <span className="text-stone-400 flex items-center gap-1 py-0.5 font-medium">
                      <Loader2 className="h-3 w-3 animate-spin text-[#A27B5C]" /> Loading combinations...
                    </span>
                  ) : (() => {
                    const minStr = boxCombos.minCombo?.trim();
                    const maxStr = boxCombos.maxCombo?.trim();
                    const isMatched =
                      (minStr && maxStr && minStr.replace(/\s+/g, "") === maxStr.replace(/\s+/g, "")) ||
                      (!minStr && maxStr) ||
                      (minStr && !maxStr);

                    if (isMatched) {
                      const matchedStr = (maxStr || minStr || "").trim();
                      const calc = computeComboTotal(matchedStr);
                      const sumVal =
                        apiBoxCombo?.total ||
                        apiBoxCombo?.total_pcs ||
                        calc.pcs ||
                        workorder.work_order_sa_pcs;
                      const displayMatched = matchedStr
                        ? matchedStr.includes("=")
                          ? matchedStr
                          : `${matchedStr}${sumVal ? ` = ${sumVal}` : ""}`
                        : "N/A";

                      return (
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-md font-bold border border-green-200">
                            <strong className="text-green-800">Matched:</strong> {displayMatched}
                          </span>
                        </div>
                      );
                    }

                    const minCalc = computeComboTotal(minStr);
                    const maxCalc = computeComboTotal(maxStr);

                    const minDisplay = minStr
                      ? minStr.includes("=")
                        ? minStr
                        : `${minStr}${minCalc.pcs ? ` = ${minCalc.pcs}` : ""}`
                      : "N/A";

                    const maxDisplay = maxStr
                      ? maxStr.includes("=")
                        ? maxStr
                        : `${maxStr}${maxCalc.pcs ? ` = ${maxCalc.pcs}` : ""}`
                      : "N/A";

                    return (
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md font-bold border border-red-200">
                          <strong className="text-red-800">Min:</strong> {minDisplay}
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold border border-blue-200">
                          <strong className="text-blue-800">Max:</strong> {maxDisplay}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Return Slip No */}
            <div className="space-y-1.5">
              <Label htmlFor="packingSlipNo" className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-stone-400" />
                Return Slip No <span className="text-red-500">*</span>
              </Label>
              <Input
                id="packingSlipNo"
                placeholder="Enter Return Slip No"
                name="work_order_sa_dc_no"
                value={workorder.work_order_sa_dc_no}
                onChange={onInputChange}
                className="h-10 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs font-medium"
              />
            </div>

            {/* Remarks */}
            <div className="space-y-1.5 col-span-full">
              <Label htmlFor="remarks" className="text-xs font-semibold text-stone-700">
                Remarks / Return Notes
              </Label>
              <Input
                id="remarks"
                placeholder="Optional notes or return remarks..."
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
                  Product Barcode
                </h2>
                <p className="text-[11px] text-stone-500">
                  Scan or enter the unique product barcode for each garment piece returned.
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
                    : "SCAN OR ENTER PRODUCT BARCODE..."
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
              Add
            </Button>
          </div>

          {/* Scanned Barcodes Grid Area */}
          <div className="rounded-xl border border-stone-200 bg-white/80 p-3 min-h-[140px] max-h-[300px] overflow-y-auto shadow-inner">
            {uniqueBarcodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {uniqueBarcodes.map((item) => {
                  const isLimitReached = barcodes.length >= maxPcs;

                  return (
                    <div
                      key={item.barcode}
                      className="group relative rounded-xl border border-[#E6DEC9] bg-[#FAF8F5] hover:bg-white p-2.5 text-xs flex items-center justify-between shadow-2xs hover:border-[#A27B5C] transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#543D2B]/10 text-[10px] font-bold text-[#543D2B]">
                          {item.index}
                        </span>
                        <span className="font-mono font-bold truncate text-xs text-stone-800" title={item.barcode}>
                          {item.barcode}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 pl-1.5 shrink-0">
                        {/* Multiplier Badge */}
                        <span
                          className="rounded-md bg-[#543D2B] text-white px-2 py-0.5 text-[11px] font-extrabold tracking-tight shadow-2xs"
                          title={`${item.count} piece${item.count > 1 ? "s" : ""}`}
                        >
                          *{item.count}
                        </span>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-0.5 bg-stone-100 rounded-lg p-0.5 border border-stone-200">
                          <button
                            type="button"
                            onClick={() => removeOneBarcode(item.barcode)}
                            className="flex h-5 w-5 items-center justify-center rounded-md text-stone-600 hover:bg-white hover:text-stone-900 transition-colors cursor-pointer"
                            title="Decrease count by 1"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => addOneBarcode(item.barcode)}
                            disabled={isLimitReached}
                            className="flex h-5 w-5 items-center justify-center rounded-md text-stone-600 hover:bg-white hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isLimitReached ? "Target pieces count reached" : "Increase count by 1"}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAllOfBarcode(item.barcode)}
                            className="flex h-5 w-5 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer ml-0.5"
                            title="Remove this barcode"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
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
                  No product barcodes added yet
                </p>
                <p className="text-[11px] text-stone-400 max-w-xs mt-0.5">
                  Type or scan barcode numbers in the box above to link them to this sales return.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-6">
          <Button
            variant="outline"
            asChild
            className="h-10 px-5 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs font-semibold shadow-2xs"
          >
            <Link to="/sales-return">Cancel</Link>
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
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <PackageCheck className="h-4 w-4" />
                <span>Submit</span>
              </>
            )}
          </Button>
        </div>

      </div>
    </Page>
  );
};

export default CreateSalesReturn;
