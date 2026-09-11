import Page from "@/app/dashboard/page";
import React, { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ProgressBar } from "@/components/spinner/ProgressBar";
import { ButtonConfig } from "@/config/ButtonConfig";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BASE_URL from "@/config/BaseUrl";
import { MinusCircle, PlusCircle } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useCurrentYear } from "@/hooks/useCurrentYear";
// Validation Schema

const productRowSchema = z.object({
  invoicePSub_inv_ref: z.string().min(1, "Ref data is required"),
  invoicePSub_amt_adv: z.any().optional(),
  invoicePSub_amt_dp: z.any().optional(),
  invoicePSub_amt_da: z.any().optional(),
  invoicePSub_bank_c: z.any().optional(),
  invoicePSub_discount: z.any().optional(),
  invoicePSub_shortage: z.any().optional(),
  invoiceSub_sbaga: z.any().optional(),
  invoicePSub_remarks: z.string().optional(),
});

const contractFormSchema = z.object({
  invoiceP_years: z.string().optional(),

  invoiceP_dates: z.string().min(1, "P Date is required"),
  branch_short: z.string().min(1, "Branch Short is required"),
  branch_name: z.string().min(1, "Branch Name is required"),
  invoiceP_dollar_rate: z.string().min(1, "Dollar Rate is required"),
  invoiceP_v_date: z.string().min(1, "Invoice Date is required"),
  invoiceP_usd_amount: z.string().min(1, "USD amount is required"),
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
        <h1 className="text-3xl font-bold text-gray-800">Create Payment</h1>
      </div>
    </div>
  );
};

const createBranch = async (data) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`${BASE_URL}/api/panel-create-invoice-payment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw responseData;
  }

  return responseData;
};

const CreatePayment = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: currentYear } = useCurrentYear();
  useEffect(() => {
    if (currentYear) {
      setFormData((prev) => ({
        ...prev,
        invoiceP_years: currentYear,
      }));
    }
  }, [currentYear]);
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
  const createBranchMutation = useMutation({
    mutationFn: createBranch,
    onSuccess: (response) => {
      if (response.code == 200) {
        toast({
          title: "Success",
          description: response.msg,
        });
        navigate("/payment-payment-list");
      } else if (response.code == 400) {
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
      setFormData({
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

      setInvoiceData([
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
    },
    onError: (error) => {
      console.error("API Error:", error);

      toast({
        title: "Error",
        description: error.msg || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handlePaymentChange = (e, rowIndex, fieldName) => {
    const value = e.target.value;

    if (
      fieldName === "invoicePSub_inv_ref" ||
      fieldName === "invoicePSub_remarks"
    ) {
      const updatedData = [...invoiceData];
      updatedData[rowIndex][fieldName] = value;
      setInvoiceData(updatedData);
    } else {
      if (/^\d*$/.test(value)) {
        const updatedData = [...invoiceData];
        updatedData[rowIndex][fieldName] = value;
        setInvoiceData(updatedData);
      } else {
        console.log("Invalid input. Only digits are allowed.");
      }
    }
  };

  const handleInputChange = (e, field) => {
    const value = e.target ? e.target.value : e;

    setFormData((prev) => {
      if (field === "branch_short") {
        const selectedBranch = branchData?.branch.find(
          (branch) => branch.branch_short === value
        );
        return {
          ...prev,
          branch_short: value,
          branch_name: selectedBranch ? selectedBranch.branch_name : "",
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const fetchCompanys = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${BASE_URL}/api/panel-fetch-branch`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch company data");
    return response.json();
  };

  const { data: branchData } = useQuery({
    queryKey: ["branch"],
    queryFn: fetchCompanys,
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
  const fetchPaymentAmount = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(
      `${BASE_URL}/api/panel-fetch-invoice-payment-amount`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch company data");
    const data = await response.json();
    return data.invoicePaymentAmount;
  };

  const { data: PaymentAmount } = useQuery({
    queryKey: ["paymentamount"],
    queryFn: fetchPaymentAmount,
  });

  const fieldLabels = {
    invoicePSub_inv_ref: " Invoice Ref",
    invoiceP_dates: "Payment Date",
    branch_name: "Company Name",
    invoiceP_dollar_rate: " Dollor Rate",
    invoiceP_v_date: "Value Date",
    invoiceP_usd_amount: "Usd Amount",
    invoiceP_irtt_no: "IRTT No",
    invoiceP_status: "Status",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const totalInvoiceSubAmount = invoiceData.reduce(
        (sum, item) =>
          sum +
          (Number(item.invoicePSub_amt_adv) || 0) +
          (Number(item.invoicePSub_amt_dp) || 0) +
          (Number(item.invoicePSub_amt_da) || 0) +
          (Number(item.invoicePSub_bank_c) || 0) +
          (Number(item.invoicePSub_discount) || 0) +
          (Number(item.invoicePSub_shortage) || 0),
        0
      );

      const invoiceUsdAmount = Number(formData.invoiceP_usd_amount) || 0;

      if (invoiceUsdAmount !== totalInvoiceSubAmount) {
        throw new z.ZodError([
          {
            path: ["invoiceP_usd_amount"],
            message: "Amount Does Not Match",
          },
        ]);
      }
      const validatedData = contractFormSchema.parse({
        ...formData,
        payment_data: invoiceData,
      });

      createBranchMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
    }
  };

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
                    value={formData.invoiceP_dates}
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
                <Select
                  value={formData.branch_short}
                  onValueChange={(value) =>
                    handleInputChange({ target: { value } }, "branch_short")
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectContent>
                      {branchData?.branch?.map((branch) => (
                        <SelectItem
                          key={branch.branch_short}
                          value={branch.branch_short}
                        >
                          {branch.branch_short}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectContent>
                </Select>
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
                    type="number"
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
                <Select
                  value={formData.invoiceP_status}
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
                </Select>
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
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceData.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <TableCell className="px-4 py-2">
                        <Select
                          value={row.invoicePSub_inv_ref}
                          onValueChange={(value) => {
                            handlePaymentChange(
                              { target: { value } },
                              rowIndex,
                              "invoicePSub_inv_ref"
                            );
                          }}
                        >
                          <SelectTrigger className="bg-white border border-gray-300">
                            <SelectValue placeholder="Select Payment">
                              {row.invoicePSub_inv_ref || "Select Payment"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-300">
                            {PaymentAmount?.map((status, index) => (
                              <SelectItem
                                key={index}
                                value={status.invoice_ref}
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm">
                                    {status.invoice_ref}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    Amount (USD): {status.invoice_i_value_usd}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    Balance: {status.balance}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          className="bg-white border border-gray-300"
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
                          className="bg-white border border-gray-300"
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
                          className="bg-white border border-gray-300"
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
                          className="bg-white border border-gray-300"
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
                          className="bg-white border border-gray-300"
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
                          className="bg-white border border-gray-300"
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
                          className="bg-white border border-gray-300"
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
                      <TableCell className="px-4 py-2 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            onClick={addRow}
                            className={`${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => removeRow(rowIndex)}
                            disabled={invoiceData.length === 1}
                            className="text-red-500"
                            type="button"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-end">
          <Button
            type="submit"
            className={`${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor} flex items-center mt-2`}
            disabled={createBranchMutation.isPending}
          >
            {createBranchMutation.isPending
              ? "Submitting..."
              : "Create Payment"}
          </Button>
        </div>
      </form>
    </Page>
  );
};

export default CreatePayment;
