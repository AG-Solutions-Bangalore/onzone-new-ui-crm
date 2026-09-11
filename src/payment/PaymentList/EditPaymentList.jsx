import Page from "@/app/dashboard/page";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  SelectContent,
  SelectItem,
  Select as SelectStatus,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import BASE_URL from "@/config/BaseUrl";
import { ButtonConfig } from "@/config/ButtonConfig";
import { useToast } from "@/hooks/use-toast";
import { useFetchPaymentAmount } from "@/hooks/useApi";
import { useCurrentYear } from "@/hooks/useCurrentYear";
import { decryptId } from "@/utils/encyrption/Encyrption";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Loader2,
  MinusCircle,
  PlusCircle,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { z } from "zod";

const productRowSchema = z.object({
  id: z.any().optional(),
  invoicePSub_inv_ref: z.string().min(1, "Ref data is required"),
  invoicePSub_amt_adv: z.any().optional(),
  invoicePSub_amt_dp: z.any().optional(),
  invoicePSub_amt_da: z.any().optional(),
  invoicePSub_bank_c: z.any().optional(),
  invoicePSub_discount: z.any().optional(),
  invoicePSub_shortage: z.any().optional(),
  invoiceSub_sbaga: z.any().optional(),
  invoicePSub_remarks: z.any().optional(),
});

const contractFormSchema = z.object({
  invoiceP_years: z.string().optional(),

  invoiceP_dates: z.string().min(1, "P Date is required"),
  branch_short: z.string().min(1, "Branch Short is required"),
  branch_name: z.string().min(1, "Branch Name is required"),
  invoiceP_dollar_rate: z.number().min(1, "Dollar Rate is required"),
  invoiceP_v_date: z.string().min(1, "Invoice Date is required"),
  invoiceP_usd_amount: z
    .union([z.string(), z.number()])
    .refine((val) => Number(val) >= 1, {
      message: "USD amount is required and must be at least 1",
    }),
  invoiceP_irtt_no: z.string().min(1, "IRTT No is required"),
  invoiceP_status: z.string().min(1, "Status is required"),
  payment_data: z.array(productRowSchema),
});

const BranchHeader = () => {
  return (
    <div
      className={`flex sticky top-0 z-10 border border-gray-200 rounded-lg justify-between items-start gap-8 mb-2 ${ButtonConfig.cardheaderColor} p-4 shadow-sm`}
    >
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-800">Edit Payment</h1>
      </div>
    </div>
  );
};
const MemoizedProductSelect = React.memo(
  ({ value, onChange, options, placeholder }) => {
    const selectOptions = options.map((option) => ({
      value: option.value,
      label: option.label,
    }));

    const selectedOption = selectOptions.find(
      (option) => option.value === value
    );

    const customStyles = {
      control: (provided, state) => ({
        ...provided,
        minHeight: "36px",
        borderRadius: "6px",
        borderColor: state.isFocused ? "black" : "#e5e7eb",
        boxShadow: state.isFocused ? "black" : "none",
        "&:hover": {
          borderColor: "none",
          cursor: "text",
        },
      }),
      option: (provided, state) => ({
        ...provided,
        fontSize: "14px",
        backgroundColor: state.isSelected
          ? "#A5D6A7"
          : state.isFocused
          ? "#f3f4f6"
          : "white",
        color: state.isSelected ? "black" : "#1f2937",
        "&:hover": {
          backgroundColor: "#EEEEEE",
          color: "black",
        },
      }),

      menu: (provided) => ({
        ...provided,
        borderRadius: "6px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }),
      placeholder: (provided) => ({
        ...provided,
        color: "#616161",
        fontSize: "14px",
        display: "flex",
        flexDirection: "row",
        alignItems: "start",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }),
      singleValue: (provided) => ({
        ...provided,
        color: "black",
        fontSize: "14px",
      }),
    };

    const DropdownIndicator = (props) => {
      return (
        <div {...props.innerProps}>
          <ChevronDown className="h-4 w-4 mr-3 text-gray-500" />
        </div>
      );
    };

    return (
      <Select
        value={selectedOption}
        onChange={(selected) => onChange(selected ? selected.value : "")}
        options={selectOptions}
        placeholder={placeholder}
        styles={customStyles}
        components={{
          IndicatorSeparator: () => null,
          DropdownIndicator,
        }}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        getOptionLabel={(option) => option.label} // Show only the invoice reference in the input
        getOptionValue={(option) => option.value} // Use the value for the option
      />
    );
  }
);
const EditPaymentList = () => {
  const { id } = useParams();
  const decryptedId = decryptId(id);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: currentYear } = useCurrentYear();
  const [crossedRows, setCrossedRows] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    invoiceP_years: currentYear,
    invoiceP_dates: "",
    branch_short: "",
    branch_name: "",
    invoiceP_dollar_rate: "",
    invoiceP_v_date: "",
    invoiceP_usd_amount: "",
    invoiceP_irtt_no: "",
    invoiceP_status: "",
  });

  const [invoiceData, setInvoiceData] = useState([
    {
      id: "",
      invoicePSub_inv_ref: "",
      invoicePSub_amt_adv: 0,
      invoicePSub_amt_dp: 0,
      invoicePSub_amt_da: 0,
      invoicePSub_bank_c: 0,
      invoicePSub_discount: 0,
      invoicePSub_shortage: 0,
      invoicePSub_remarks: "",
    },
  ]);

  useEffect(() => {
    if (currentYear) {
      setFormData((prev) => ({
        ...prev,
        invoiceP_years: currentYear,
      }));
    }
  }, [currentYear]);

  const {
    data: paymentDatas,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["payment", decryptedId],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/api/panel-fetch-invoice-payment-by-id/${decryptedId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch payment");
      return response.json();
    },
  });

  const fetchPaymentStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(
      `${BASE_URL}/api/panel-fetch-invoice-payment-status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch company data");
    const data = await response.json();
    return data.invoicePaymentStatus;
  };

  const { data: PaymentData } = useQuery({
    queryKey: ["payment"],
    queryFn: fetchPaymentStatus,
  });

  const { data: invoiceNoData } = useFetchPaymentAmount();

  useEffect(() => {
    if (paymentDatas && PaymentData) {
      setFormData((prev) => ({
        ...prev,
        invoiceP_status: paymentDatas.payment.invoiceP_status || "",
      }));
    }
  }, [paymentDatas, PaymentData]);

  useEffect(() => {
    if (paymentDatas) {
      setFormData((prev) => ({
        ...prev,
        invoiceP_years: paymentDatas.payment.invoiceP_year || currentYear,
        invoiceP_dates: paymentDatas.payment.invoiceP_date || "",
        branch_short: paymentDatas.payment.branch_short || "",
        branch_name: paymentDatas.payment.branch_name || "",
        invoiceP_dollar_rate: paymentDatas.payment.invoiceP_dollar_rate || "",
        invoiceP_v_date: paymentDatas.payment.invoiceP_v_date || "",
        invoiceP_usd_amount: paymentDatas.payment.invoiceP_usd_amount || "",
        invoiceP_irtt_no: paymentDatas.payment.invoiceP_irtt_no || "",
        invoiceP_status: paymentDatas.payment?.invoiceP_status || "",
      }));

      if (Array.isArray(paymentDatas.paymentSub)) {
        setInvoiceData(
          paymentDatas.paymentSub.map((sub) => ({
            id: sub.id ?? "",
            invoicePSub_inv_ref: sub.invoicePSub_inv_ref || "",
            invoicePSub_amt_adv: sub.invoicePSub_amt_adv || 0,
            invoicePSub_amt_dp: sub.invoicePSub_amt_dp || 0,
            invoicePSub_amt_da: sub.invoicePSub_amt_da || 0,
            invoicePSub_bank_c: sub.invoicePSub_bank_c || 0,
            invoicePSub_discount: sub.invoicePSub_discount || 0,
            invoicePSub_shortage: sub.invoicePSub_shortage || 0,
            invoicePSub_remarks: sub.invoicePSub_remarks || "",
          }))
        );
      }
    }
  }, [paymentDatas]);

  const handleDeleteRow = (rowId) => {
    setCrossedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const deleteProductMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/api/panel-delete-invoice-payment-sub/${invoiceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to delete invoice Table");
      return response.json();
    },
  });

  const createBranch = async (data) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(
      `${BASE_URL}/api/panel-update-invoice-payment/${decryptedId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      throw responseData;
    }

    return responseData;
  };

  const createBranchMutation = useMutation({
    mutationFn: createBranch,
    onSuccess: (response) => {
      if (response.code === 200) {
        toast({
          title: "Success",
          description: response.msg,
        });
        navigate("/payment-payment-list");
      } else if (response.code === 400) {
        toast({
          title: "Duplicate Entry",
          description: response.msg,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Unexpected Response",
          description: response.msg || "Something unexpected happened.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.msg || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handlePaymentChange = (e, rowIndex, fieldName) => {
    if (fieldName === "invoicePSub_inv_ref") {
      const value = typeof e === "string" ? e : e.target.value;
      const updatedData = [...invoiceData];
      updatedData[rowIndex][fieldName] = value;
      setInvoiceData(updatedData);
    } else if (fieldName === "invoicePSub_remarks") {
      const updatedData = [...invoiceData];
      updatedData[rowIndex][fieldName] = e.target.value;
      setInvoiceData(updatedData);
    } else {
      if (/^\d*$/.test(e.target.value)) {
        const updatedData = [...invoiceData];
        updatedData[rowIndex][fieldName] = e.target.value;
        setInvoiceData(updatedData);
      }
    }
  };

  const handleInputChange = (e, field) => {
    const value = e.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addRow = useCallback(() => {
    setInvoiceData((prev) => [
      ...prev,
      {
        invoicePSub_inv_ref: "",
        invoicePSub_amt_adv: "",
        invoicePSub_amt_dp: "",
        invoicePSub_amt_da: "",
        invoicePSub_bank_c: "",
        invoicePSub_discount: "",
        invoicePSub_shortage: "",
        invoicePSub_remarks: "",
      },
    ]);
  }, []);

  const removeRow = useCallback(
    (index) => {
      if (invoiceData.length > 1) {
        setInvoiceData((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [invoiceData.length]
  );
  const calculateTotalInvoiceSubAmount = () => {
    return invoiceData.reduce((sum, item) => {
      if (!crossedRows.has(item.id)) {
        return (
          sum +
          (Number(item.invoicePSub_amt_adv) || 0) +
          (Number(item.invoicePSub_amt_dp) || 0) +
          (Number(item.invoicePSub_amt_da) || 0)
        );
      }
      return sum;
    }, 0);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const totalInvoiceSubAmount = calculateTotalInvoiceSubAmount();
      const invoiceUsdAmount = Number(formData.invoiceP_usd_amount) || 0;
      if (invoiceUsdAmount !== totalInvoiceSubAmount) {
        toast({
          title: "Validation Error",
          description: "The total invoice amounts do not match the USD amount.",
          variant: "destructive",
        });
        return;
      }
      if (crossedRows.size > 0) {
        setIsDeleting(true);
        toast({
          title: "Processing",
          description: "Deleting selected rows...",
        });

        const deletionPromises = Array.from(crossedRows).map((rowId) =>
          deleteProductMutation.mutateAsync(rowId)
        );

        await Promise.all(deletionPromises);
        toast({
          title: "Success",
          description: "Selected rows deleted successfully",
        });
      }
      const validatedData = contractFormSchema.parse({
        ...formData,
        payment_data: invoiceData.filter((row) => !crossedRows.has(row.id)),
      });

      await createBranchMutation.mutateAsync(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldLabels = {
          invoicePSub_inv_ref: "Invoice Ref",
          invoiceP_dates: "Payment Date",
          branch_name: "Company Name",
          invoiceP_dollar_rate: "Dollar Rate",
          invoiceP_v_date: "Value Date",
          invoiceP_usd_amount: "USD Amount",
          invoiceP_irtt_no: "IRTT No",
          invoiceP_status: "Status",
        };

        const groupedErrors = error.errors.reduce((acc, err) => {
          const field = err.path.join(".");
          if (!acc[field]) acc[field] = [];
          acc[field].push(err.message);
          return acc;
        }, {});

        const errorMessages = Object.entries(groupedErrors).map(
          ([field, messages]) => {
            const fieldKey = field.split(".").pop();
            const label = fieldLabels[fieldKey] || field;
            return `${label}: ${messages.join(", ")}`;
          }
        );

        toast({
          title: "Validation Error",
          description: (
            <div>
              <ul className="list-disc pl-5">
                {errorMessages.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          ),
          variant: "destructive",
        });
      } else {
        console.error("Unexpected error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoaderComponent name="Payment  Data" />; // ✅ Correct prop usage
  }

  // Render error state
  if (isError) {
    return <ErrorComponent message="Error Payment Data" refetch={refetch} />;
  }

  return (
    <Page>
      <form onSubmit={handleSubmit} className="w-full p-4">
        <BranchHeader />
        <Card className={`mb-6 ${ButtonConfig.cardColor}`}>
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <div>
                  <label
                    className={`block  ${ButtonConfig.cardLabel} text-sm mb-2 font-medium `}
                  >
                    Payment Date<span className="text-red-500">*</span>
                  </label>
                  <Input
                    className="bg-white"
                    value={formData.invoiceP_dates || ""}
                    onChange={(e) => handleInputChange(e, "invoiceP_dates")}
                    placeholder="Enter Payment Date"
                    type="date"
                  />
                </div>
              </div>
              <div>
                <label
                  className={`block  ${ButtonConfig.cardLabel} text-sm mb-2 font-medium `}
                >
                  Company <span className="text-red-500">*</span>
                </label>

                <Input
                  className="bg-white"
                  value={formData.branch_short}
                  onChange={(e) => handleInputChange(e, "branch_short")}
                  disabled
                />
              </div>

              <div>
                <div>
                  <label
                    className={`block  ${ButtonConfig.cardLabel} text-sm mb-2 font-medium `}
                  >
                    Value Date<span className="text-red-500">*</span>
                  </label>
                  <Input
                    className="bg-white"
                    value={formData.invoiceP_v_date}
                    onChange={(e) => handleInputChange(e, "invoiceP_v_date")}
                    placeholder="Enter Date"
                    type="date"
                  />
                </div>
              </div>

              <div>
                <div>
                  <label
                    className={`block  ${ButtonConfig.cardLabel} text-sm mb-2 font-medium `}
                  >
                    USD Amount<span className="text-red-500">*</span>
                  </label>
                  <Input
                    className="bg-white"
                    value={formData.invoiceP_usd_amount}
                    onChange={(e) =>
                      handleInputChange(e, "invoiceP_usd_amount")
                    }
                    placeholder="Enter  USD Amount"
                    type="tel"
                    onKeyPress={(e) => {
                      // Allow only numbers, backspace, and dot (for decimal)
                      if (!/[0-9.]/.test(e.key) && e.key !== "Backspace") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <div>
                  <label
                    className={`block  ${ButtonConfig.cardLabel} text-sm mb-2 font-medium `}
                  >
                    Dollor Rate<span className="text-red-500">*</span>
                  </label>
                  <Input
                    className="bg-white"
                    value={formData.invoiceP_dollar_rate}
                    onChange={(e) =>
                      handleInputChange(e, "invoiceP_dollar_rate")
                    }
                    placeholder="Enter Dollor Rate"
                    type="number"
                    disabled
                  />
                </div>
              </div>

              <div>
                <div>
                  <label
                    className={`block  ${ButtonConfig.cardLabel} text-sm mb-2 font-medium `}
                  >
                    Irtt Number<span className="text-red-500"></span>
                  </label>
                  <Input
                    className="bg-white"
                    value={formData.invoiceP_irtt_no}
                    onChange={(e) => handleInputChange(e, "invoiceP_irtt_no")}
                    placeholder="Enter Irtt Number"
                    type="number"
                  />
                </div>
              </div>

              <div className="grid gap-1">
                <label
                  className={`block  ${ButtonConfig.cardLabel} text-sm mb-2 font-medium `}
                >
                  Status<span className="text-red-500">*</span>
                </label>
                <SelectStatus
                  value={formData?.invoiceP_status}
                  onValueChange={(value) =>
                    handleInputChange({ target: { value } }, "invoiceP_status")
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {PaymentData?.map((status, index) => (
                      <SelectItem
                        key={index}
                        value={status.invoicePaymentStatus}
                      >
                        {status.invoicePaymentStatus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectStatus>
              </div>
            </div>

            <div className="mt-4">
              <Table className="border border-gray-300 rounded-lg shadow-sm">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="text-sm font-semibold text-gray-600 py-2 px-4">
                      Invoice No
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-600 py-2 px-4">
                      Adj Adv
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-600 py-2 px-4">
                      Adj Dp
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-600 py-2 px-4">
                      Adj DA
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-600 py-2 px-4">
                      Bank Ch
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-600 py-2 px-4">
                      Discount
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-600 py-2 px-4">
                      Shortage
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-600 py-2 px-4">
                      Remarks
                    </TableHead>
                    <TableHead className="text-sm font-semibold text-gray-600 py-2 px-4">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceData.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      className={`border-t border-gray-200 hover:bg-gray-50 ${
                        crossedRows.has(row.id) ? "bg-red-200   opacity-70" : ""
                      }`}
                    >
                      <TableCell className="px-4 py-2">
                        {row.id ? (
                          <Input
                            className="bg-white"
                            value={row.invoicePSub_inv_ref}
                            onChange={(e) =>
                              handlePaymentChange(
                                e,
                                rowIndex,
                                "invoicePSub_inv_ref"
                              )
                            }
                            disabled
                          />
                        ) : (
                          <MemoizedProductSelect
                            value={row.invoicePSub_inv_ref}
                            onChange={(value) =>
                              handlePaymentChange(
                                value,
                                rowIndex,
                                "invoicePSub_inv_ref"
                              )
                            }
                            options={
                              invoiceNoData?.invoicePaymentAmount?.map(
                                (status) => ({
                                  value: status.invoice_ref,
                                  label: (
                                    <div className="flex flex-col">
                                      <span className="font-bold text-sm">
                                        {status.invoice_ref}
                                      </span>
                                      <span className="text-gray-600 text-[10px]">
                                        Amount (USD):{" "}
                                        {status.invoice_i_value_usd}
                                      </span>
                                      <span className="text-gray-600 text-[10px]">
                                        Balance: {status.balance}
                                      </span>
                                      <span className="text-gray-600 text-[10px]">
                                        Received: {status.received}
                                      </span>
                                    </div>
                                  ),
                                })
                              ) || []
                            }
                            placeholder="Select Payment"
                          />
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          className="bg-white"
                          value={row.invoicePSub_amt_adv}
                          onChange={(e) =>
                            handlePaymentChange(
                              e,
                              rowIndex,
                              "invoicePSub_amt_adv"
                            )
                          }
                          placeholder="Enter Amount Adv"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          className="bg-white"
                          value={row.invoicePSub_amt_dp}
                          onChange={(e) =>
                            handlePaymentChange(
                              e,
                              rowIndex,
                              "invoicePSub_amt_dp"
                            )
                          }
                          placeholder="Enter Amount DP"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          className="bg-white"
                          value={row.invoicePSub_amt_da}
                          onChange={(e) =>
                            handlePaymentChange(
                              e,
                              rowIndex,
                              "invoicePSub_amt_da"
                            )
                          }
                          placeholder="Enter Amount DA"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          className="bg-white"
                          value={row.invoicePSub_bank_c}
                          onChange={(e) =>
                            handlePaymentChange(
                              e,
                              rowIndex,
                              "invoicePSub_bank_c"
                            )
                          }
                          placeholder="Enter Bank Name"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          className="bg-white"
                          value={row.invoicePSub_discount}
                          onChange={(e) =>
                            handlePaymentChange(
                              e,
                              rowIndex,
                              "invoicePSub_discount"
                            )
                          }
                          placeholder="Enter Discount"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          className="bg-white"
                          value={row.invoicePSub_shortage}
                          onChange={(e) =>
                            handlePaymentChange(
                              e,
                              rowIndex,
                              "invoicePSub_shortage"
                            )
                          }
                          placeholder="Enter Shortage"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Textarea
                          className="bg-white"
                          value={row.invoicePSub_remarks}
                          onChange={(e) =>
                            handlePaymentChange(
                              e,
                              rowIndex,
                              "invoicePSub_remarks"
                            )
                          }
                          placeholder="Enter Remarks"
                        />
                      </TableCell>
                      <TableCell className="p-2 border">
                        {row.id ? (
                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteRow(row.id)}
                            className={`${
                              crossedRows.has(row.id)
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() => removeRow(rowIndex)}
                            disabled={invoiceData.length === 1}
                            className="text-red-500"
                            type="button"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p>Total : {calculateTotalInvoiceSubAmount()}</p>
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={addRow}
                  className={`${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-end">
          <Button
            type="submit"
            className={`${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor} flex items-center mt-2`}
            disabled={isDeleting || createBranchMutation.isPending}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting rows...
              </>
            ) : createBranchMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Payment...
              </>
            ) : (
              "Update Payment"
            )}
          </Button>
        </div>
      </form>
    </Page>
  );
};

export default EditPaymentList;
