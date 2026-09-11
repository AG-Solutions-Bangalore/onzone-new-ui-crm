import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { Trash2, ChevronLeft, Plus, Minus, Loader2 } from "lucide-react";
import Select from "react-select";
import {
  Select as ShadcnSelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useToast } from "@/hooks/use-toast";
import BASE_URL from "@/config/BaseUrl";
import Page from "../dashboard/page";
import { getTodayDate } from "@/utils/currentDate";
import dateyear from "@/utils/DateYear";
import { useFetchFactory } from "@/hooks/useApi";
import { LoaderComponent } from "@/components/LoaderComponent/LoaderComponent";
import { Textarea } from "@/components/ui/textarea";

// Zod schema for validation
const orderSchema = z.object({
  work_order_rc_year: z.string(),
  work_order_rc_date: z.string().min(1, "Date is required"),
  work_order_rc_factory_no: z.string().min(1, "Factory is required"),
  work_order_rc_id: z.number().min(1, "Work Order ID is required"),
  work_order_rc_dc_no: z.string().min(1, "DC No is required"),
  work_order_rc_dc_date: z.string().min(1, "DC Date is required"),
  work_order_rc_brand: z.string().min(1, "Brand is required"),
  work_order_rc_box: z.string().min(1, "Box count is required"),
  work_order_rc_pcs: z.string().min(1, "Pieces count is required"),
  work_order_rc_received_by: z.string().optional(),
  work_order_rc_fabric_received: z
    .string()
    .min(1, "Fabric received is required"),
  work_order_rc_fabric_count: z.string().optional(),
  work_order_rc_remarks: z.string().optional(),
});

const workReceiveOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const AddOrderReceived = () => {
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const { toast } = useToast();
  const [workorder, setWorkorder] = useState({
    work_order_rc_year: dateyear || "",
    work_order_rc_date: getTodayDate() || "",
    work_order_rc_factory_no: "",
    work_order_rc_id: "",
    work_order_no: "", // for ref
    work_order_rc_dc_no: "",
    work_order_rc_dc_date: getTodayDate() || "",
    work_order_rc_brand: "",
    work_order_rc_box: "",
    work_order_rc_pcs: "",
    work_order_rc_received_by: "",
    work_order_rc_fabric_received: "",
    work_order_rc_fabric_count: "",
    work_order_rc_remarks: "",
  });

  const [users, setUsers] = useState([
    { work_order_rc_sub_barcode: "", work_order_rc_sub_box: 1, barcodes: [] },
  ]);
  const [loadingStates, setLoadingStates] = useState({});

  const [duplicateBarcodes, setDuplicateBarcodes] = useState({});
  const [activeInputIndex, setActiveInputIndex] = useState(null);
  const [currentInputValue, setCurrentInputValue] = useState("");
  const [highlightedItem, setHighlightedItem] = useState(null);
  const { data: factoryData, isFetching } = useFetchFactory();

  const { data: workOrders = [] } = useQuery({
    queryKey: ["workOrders", workorder.work_order_rc_factory_no],
    queryFn: async () => {
      if (!workorder.work_order_rc_factory_no) return [];
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/api/fetch-work-order/${workorder.work_order_rc_factory_no}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch work orders");
      const data = await response.json();

      return data.workorder || [];
    },
    enabled: !!workorder.work_order_rc_factory_no,
  });

  const { data: brandData } = useQuery({
    queryKey: ["brand", workorder.work_order_rc_id],
    queryFn: async () => {
      if (!workorder.work_order_rc_id) return { work_order_brand: "" };
      const token = localStorage.getItem("token");
      console.log("workorder", workorder?.work_order_rc_id);

      const response = await fetch(
        `${BASE_URL}/api/fetch-work-order-brand/${workorder.work_order_rc_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch brand");
      const data = await response.json();
      return data.workorderbrand || { work_order_brand: "" };
    },
    enabled: !!workorder.work_order_rc_id,
  });

  useEffect(() => {
    if (brandData?.work_order_brand) {
      setWorkorder((prev) => ({
        ...prev,
        work_order_rc_brand: brandData.work_order_brand,
      }));
    }
  }, [brandData]);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem("token");

      // Convert barcodes array back to comma-separated string for submission
      const submissionData = {
        ...data,
        workorder_sub_rc_data: data.workorder_sub_rc_data.map((user) => ({
          ...user,
          work_order_rc_sub_barcode: user.barcodes.join(","),
        })),
      };

      const response = await fetch(
        `${BASE_URL}/api/create-work-order-received`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submissionData),
        },
      );
      if (!response.ok) throw new Error("Failed to create order");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order received successfully",
        variant: "default",
      });
      navigate("/order-received");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.message,
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

    if (name === "work_order_rc_box") {
      const boxCount = parseInt(value) || 0;
      if (users.length > boxCount) {
        setUsers(users.slice(0, boxCount));
      }
    }
  };

  const calculateDuplicates = (users) => {
    const allBarcodes = [];

    users.forEach((user) => {
      user.barcodes.forEach((barcode) => {
        if (barcode) {
          allBarcodes.push(barcode);
        }
      });
    });

    const duplicates = {};
    const seen = {};

    allBarcodes.forEach((barcode) => {
      if (seen[barcode]) {
        duplicates[barcode] = (duplicates[barcode] || 1) + 1;
      } else {
        seen[barcode] = true;
      }
    });

    return duplicates;
  };

  useEffect(() => {
    setDuplicateBarcodes(calculateDuplicates(users));
  }, [users]);

  const handleBarcodeInputChange = (e, index) => {
    setCurrentInputValue(e.target.value);
  };

  const addBarcodeToBox = async (index) => {
    if (!currentInputValue.trim()) return;
    setLoadingStates((prev) => ({ ...prev, [index]: true }));

    try {
      const maxPcs = parseInt(workorder.work_order_rc_pcs || 0, 10);
      const currentTotal = users.reduce(
        (total, user) => total + user.barcodes.length,
        0,
      );

      if (currentTotal >= maxPcs) {
        toast({
          title: "Limit reached",
          description: `You cannot enter more than ${maxPcs} T-codes total.`,
          variant: "destructive",
        });
        return;
      }

      // Validate barcode format (6 digits)
      const barcode = currentInputValue.trim();
      if (barcode.length !== 6) {
        toast({
          title: "Invalid format",
          description: "Barcode must be exactly 6 digits",
          variant: "destructive",
        });
        return;
      }

      // Check if barcode exists in the work order
      const workId = workorder.work_order_no;
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${BASE_URL}/api/fetch-work-order-finish-check/${workId}/${barcode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Barcode validation failed");
      const data = await response.json();

      if (data?.code === 200) {
        // Add the barcode to the box
        const newUsers = [...users];
        newUsers[index].barcodes.push(barcode);
        setUsers(newUsers);
        setCurrentInputValue("");

        toast({
          title: "Success",
          description: "Barcode added successfully",
          variant: "default",
        });

        // Auto-focus next box if needed
        // const totalTCodes = users.reduce((total, user) => total + user.barcodes.length, 0);
        // const nextIndex = index + 1;
        // if (inputRefs.current[nextIndex] && totalTCodes < maxPcs) {
        //   setActiveInputIndex(nextIndex);
        //   setTimeout(() => {
        //     inputRefs.current[nextIndex]?.focus();
        //   }, 100);
        // }
      } else {
        toast({
          title: "Error",
          description: data?.msg || "Barcode not found in work order",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error validating barcode",
        variant: "destructive",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBarcodeToBox(index);
    }
  };

  // const removeBarcode = (barcodeToRemove, index) => {
  //   const newUsers = [...users];
  //   newUsers[index].barcodes = newUsers[index].barcodes.filter(barcode => barcode !== barcodeToRemove);
  //   setUsers(newUsers);
  // };
  const removeBarcode = useCallback(
    (boxIndex, barcodeIndex) => {
      const newUsers = [...users];
      newUsers[boxIndex].barcodes.splice(barcodeIndex, 1);
      setUsers(newUsers);
    },
    [users],
  );
  const addItem = (e) => {
    e.preventDefault();
    const boxCount = parseInt(workorder.work_order_rc_box) || 0;
    if (users.length < boxCount) {
      const newUsers = [
        ...users,
        {
          work_order_rc_sub_barcode: "",
          work_order_rc_sub_box: users.length + 1,
          barcodes: [],
        },
      ];
      setUsers(newUsers);
    }
  };

  const removeUser = (index) => {
    const newUsers = users.filter((_, i) => i !== index);

    const updatedUsers = newUsers.map((u, i) => ({
      ...u,
      work_order_rc_sub_box: i + 1,
    }));
    setUsers(updatedUsers);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const data = {
      ...workorder,
      work_order_rc_year: dateyear,
      work_order_rc_count: users.length,
      workorder_sub_rc_data: users,
      work_order_rc_id: workorder.work_order_no,
      work_order_rc_brand: brandData?.work_order_brand || "",
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
                    <div className="flex items-center justify-center h-4 w-4 mt-0.5 flex-shrink-0 rounded-full bg-red-100 text-red-700 text-xs">
                      {i + 1}
                    </div>
                    <p className="text-xs">
                      <span className="font-medium">{label}:</span>{" "}
                      {error.message}
                    </p>
                  </div>
                );
              })}
            </div>
          ),
        });
        return;
      }

      const expectedBoxCount = parseInt(workorder.work_order_rc_box, 10) || 0;
      if (users.length !== expectedBoxCount) {
        toast({
          variant: "destructive",
          title: "Box Count Mismatch",
          description: `You specified ${expectedBoxCount} boxes, but ${users.length} box(es) are present.`,
        });
        return;
      }

      const expectedPcsCount = parseInt(workorder.work_order_rc_pcs, 10) || 0;
      const totalBarcodes = users.reduce(
        (total, user) => total + user.barcodes.length,
        0,
      );
      if (totalBarcodes !== expectedPcsCount) {
        toast({
          variant: "destructive",
          title: "Pieces Count Mismatch",
          description: `You specified ${expectedPcsCount} pieces, but ${totalBarcodes} barcodes are entered.`,
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

  const isInputDisabled = (index) => {
    const maxPcs = parseInt(workorder.work_order_rc_pcs || 0, 10);
    const totalTCodes = users.reduce(
      (total, user) => total + user.barcodes.length,
      0,
    );
    return totalTCodes >= maxPcs;
  };

  const totalTCodes = users.reduce(
    (total, user) => total + user.barcodes.length,
    0,
  );

  if (isFetching) {
    return <LoaderComponent name=" Data" />;
  }

  return (
    <Page>
      <div className="max-w-full mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Add Order Received
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/order-received" className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <form className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Factory */}
                <div className="space-y-1">
                  <Label htmlFor="factory">
                    Factory <span className="text-red-500">*</span>
                  </Label>

                  <Select
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Search factory..."
                    options={
                      factoryData?.factory?.map((factory) => ({
                        value: factory.factory_no.toString(),
                        label: factory.factory_name,
                      })) || []
                    }
                    value={
                      factoryData?.factory
                        ?.map((factory) => ({
                          value: factory.factory_no.toString(),
                          label: factory.factory_name,
                        }))
                        .find(
                          (opt) =>
                            opt.value ===
                            String(workorder.work_order_rc_factory_no),
                        ) || null
                    }
                    onChange={(selected) => {
                      setWorkorder((prev) => ({
                        ...prev,
                        work_order_rc_factory_no: selected?.value || "",
                        work_order_rc_id: "",
                        work_order_no: "",
                      }));
                    }}
                  />
                </div>

                {/* Work Order ID */}
                {/* <div className="space-y-1">
                  <Label htmlFor="workOrderId">
                    Work Order ID <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="work_order_rc_id"
                    value={workorder.work_order_rc_id}
                    onValueChange={(value) => {
                      const selectedWorkOrder = workOrders.find(
                        (item) => item.id === value,
                      );
                      setWorkorder({
                        ...workorder,
                        work_order_rc_id: selectedWorkOrder?.id,
                        work_order_no: selectedWorkOrder.work_order_no,
                      });
                    }}
                    disabled={!workorder.work_order_rc_factory_no}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select work order">
                        {workorder.work_order_no || "Select work order"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {workOrders.map((workOrder) => (
                        <SelectItem key={workOrder.id} value={workOrder.id}>
                          {workOrder.work_order_no}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}
                <div className="space-y-1">
                  <Label htmlFor="workOrderId">
                    Work Order ID <span className="text-red-500">*</span>
                  </Label>

                  <Select
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder={
                      workorder.work_order_rc_factory_no
                        ? "Search work order..."
                        : "Select factory first"
                    }
                    isDisabled={!workorder.work_order_rc_factory_no}
                    options={workOrders.map((workOrder) => ({
                      value: workOrder.id.toString(),
                      label: workOrder.work_order_no,
                    }))}
                    value={
                      workOrders
                        .map((workOrder) => ({
                          value: workOrder.id.toString(),
                          label: workOrder.work_order_no,
                        }))
                        .find(
                          (opt) =>
                            opt.value === String(workorder.work_order_rc_id),
                        ) || null
                    }
                    onChange={(selected) => {
                      const selectedWorkOrder = workOrders.find(
                        (item) => item.id.toString() === selected?.value,
                      );

                      setWorkorder((prev) => ({
                        ...prev,
                        work_order_rc_id: selected?.value || "",
                        work_order_no: selectedWorkOrder?.work_order_no || "",
                      }));
                    }}
                  />
                </div>

                {/* Brand */}
                <div className="space-y-1">
                  <Label htmlFor="brand">Brand (read only)</Label>
                  <Input
                    id="brand"
                    name="work_order_rc_brand"
                    value={workorder.work_order_rc_brand}
                    readOnly
                  />
                </div>

                {/* Receive Date */}
                <div className="space-y-1">
                  <Label htmlFor="receiveDate">
                    Receive Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    id="receiveDate"
                    name="work_order_rc_date"
                    value={workorder.work_order_rc_date}
                    onChange={onInputChange}
                  />
                </div>

                {/* DC No */}
                <div className="space-y-1">
                  <Label htmlFor="dcNo">
                    DC No <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dcNo"
                    name="work_order_rc_dc_no"
                    value={workorder.work_order_rc_dc_no}
                    onChange={onInputChange}
                  />
                </div>

                {/* DC Date */}
                <div className="space-y-1">
                  <Label htmlFor="dcDate">
                    DC Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    id="dcDate"
                    name="work_order_rc_dc_date"
                    value={workorder.work_order_rc_dc_date}
                    onChange={onInputChange}
                  />
                </div>

                {/* No of Box */}
                <div className="space-y-1">
                  <Label htmlFor="boxCount">
                    No of Box <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="boxCount"
                    name="work_order_rc_box"
                    value={workorder.work_order_rc_box}
                    onChange={onInputChange}
                    min={0}
                  />
                </div>

                {/* Total No of Pcs */}
                <div className="space-y-1">
                  <Label htmlFor="pcsCount">
                    Total No of Pcs <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pcsCount"
                    name="work_order_rc_pcs"
                    value={workorder.work_order_rc_pcs}
                    onChange={onInputChange}
                  />
                </div>

                {/* Fabric Received */}
                <div className="space-y-1">
                  <Label htmlFor="fabricReceived">
                    Fabric Received <span className="text-red-500">*</span>
                  </Label>
                  <ShadcnSelect
                    name="work_order_rc_fabric_received"
                    value={workorder.work_order_rc_fabric_received}
                    onValueChange={(value) =>
                      setWorkorder({
                        ...workorder,
                        work_order_rc_fabric_received: value,
                        work_order_rc_received_by:
                          value === "Yes"
                            ? workorder.work_order_rc_received_by
                            : "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {workReceiveOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </ShadcnSelect>
                </div>

                {/* Fabric Received By (conditional) */}
                {workorder.work_order_rc_fabric_received === "Yes" && (
                  <div className="space-y-1">
                    <Label htmlFor="receivedBy">Fabric Received By</Label>
                    <Input
                      id="receivedBy"
                      name="work_order_rc_received_by"
                      value={workorder.work_order_rc_received_by}
                      onChange={onInputChange}
                    />
                  </div>
                )}

                {/* Fabric Leftover */}
                <div
                  className={`space-y-1 ${
                    workorder.work_order_rc_fabric_received === "Yes"
                      ? "col-span-2"
                      : ""
                  }`}
                >
                  <Label htmlFor="fabricLeft">Fabric Leftover</Label>
                  <Input
                    id="fabricLeft"
                    name="work_order_rc_fabric_count"
                    value={workorder.work_order_rc_fabric_count}
                    onChange={onInputChange}
                  />
                </div>

                {/* Remarks */}
                <div
                  className={`space-y-1 ${
                    workorder.work_order_rc_fabric_received === "Yes"
                      ? "col-span-full"
                      : "col-span-2"
                  }`}
                >
                  <Label htmlFor="remarks">Remarks</Label>
                  <Input
                    id="remarks"
                    name="work_order_rc_remarks"
                    value={workorder.work_order_rc_remarks}
                    onChange={onInputChange}
                  />
                </div>
              </div>

              <hr className="my-2" />

              {/* Barcode entries */}
              {/* <div className="space-y-2">
              <Label>
          Barcode Entries (Total Box: {users.length}, Total Barcode: {totalTCodes})
         
        </Label>

           
                  <div className="space-y-1">
                    {users.map((user, index) => {
                       const tCodeCount = user.work_order_rc_sub_barcode 
                       ? user.work_order_rc_sub_barcode.split(',').filter(code => code.trim().length === 6).length 
                       : 0;
                   
            const boxDuplicates = {};
            if (user.work_order_rc_sub_barcode) {
              const codes = user.work_order_rc_sub_barcode.split(',')
                .map(code => code.trim())
                .filter(code => code.length === 6);
              
              const seen = {};
              codes.forEach(barcode => {
                if (seen[barcode]) {
                  boxDuplicates[barcode] = (boxDuplicates[barcode] || 1) + 1;
                } else {
                  seen[barcode] = true;
                }
              });
            }
            
            const formatBoxDuplicates = () => {
              return Object.entries(boxDuplicates).map(([barcode, count]) => (
                `${barcode} × ${count}`
              )).join(', ');
            };
                      return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="grid grid-cols-1  gap-3 w-full">
                        

                 
                          <div className="space-y-2 ">
                            <Label htmlFor={`barcode-${index}`}>     Box {index + 1} — T Code </Label>
                            <div className="flex gap-2">
                              <Textarea
                                id={`barcode-${index}`}
                                ref={(el) => (inputRefs.current[index] = el)}
                                name={`work_order_rc_sub_barcode_${index}`}
                                value={user.work_order_rc_sub_barcode}
                                onChange={(e) => handleBarcodeChange(e, index)}
                               rows={3}
                                className="flex-1"
                                disabled={isInputDisabled(index)}
                              />
                              
                              <Button
                                variant="outline"
                                size="icon"
                                type="button"
                                onClick={() => removeUser(index)}
                      className="hover:text-red-800 "
                                disabled={users.length <= 1}
                              >
                                <Trash2 className="h-4 w-4 " />
                              </Button>
                            </div>
                            <span className="text-sm">
                      Total barcode: ({tCodeCount} entered)
                      {Object.keys(boxDuplicates).length > 0 && (
                        <span className="text-amber-600 ml-2">
                          Duplicates: {formatBoxDuplicates()}
                        </span>
                      )}
                    </span>
                          </div>
                          <span>
                         
                              </span>
                        </div>
                      </div>
                 )   })}
                  </div>
        

                <Button
                  variant="outline"
                  onClick={addItem}
                
                  disabled={
                    !workorder.work_order_rc_box ||
                    users.length >= (parseInt(workorder.work_order_rc_box) || 0) ||
                    users.reduce((total, user) => {
                      if (user.work_order_rc_sub_barcode) {
                        const codes = user.work_order_rc_sub_barcode.split(',');
                        return total + codes.filter(code => code.trim().length === 6).length;
                      }
                      return total;
                    }, 0) >= parseInt(workorder.work_order_rc_pcs || 0, 10)
                  }
                >
                  + Add Box
                </Button>
              </div> */}

              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <Label className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-2">
                    Barcode Entries
                    <span className="text-[10px] font-semibold bg-[#F5F2EB] text-[#543D2B] px-2 py-0.5 rounded-full border border-stone-200/80">
                      Total Boxes: {users.length} • Total Barcodes: {totalTCodes}
                    </span>
                  </Label>
                </div>

                <div className="space-y-2.5">
                  {users.map((user, index) => {
                    const boxDuplicates = {};
                    user.barcodes.forEach((barcode) => {
                      if (boxDuplicates[barcode]) {
                        boxDuplicates[barcode] += 1;
                      } else {
                        boxDuplicates[barcode] = 1;
                      }
                    });

                    const formatBoxDuplicates = () => {
                      return Object.entries(boxDuplicates)
                        .filter(([_, count]) => count > 1)
                        .map(([barcode, count]) => `${barcode} × ${count}`)
                        .join(", ");
                    };

                    return (
                      <div
                        key={index}
                        className="bg-[#FDFBF7] border border-stone-200/80 rounded-2xl p-3.5 shadow-2xs space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-800">
                              Box {index + 1}
                            </span>
                            <span className="text-[11px] font-medium text-stone-500 bg-[#F5F2EB] px-2 py-0.5 rounded-md">
                              {user.barcodes.length} barcode(s)
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Input
                              ref={(el) => (inputRefs.current[index] = el)}
                              value={
                                activeInputIndex === index
                                  ? currentInputValue
                                  : ""
                              }
                              onChange={(e) => {
                                const value = e.target.value
                                  .toUpperCase()
                                  .replace(/\s/g, "");
                                handleBarcodeInputChange(
                                  { target: { value } },
                                  index,
                                );
                              }}
                              onKeyPress={(e) => handleKeyPress(e, index)}
                              onFocus={() => {
                                setActiveInputIndex(index);
                                setCurrentInputValue("");
                              }}
                              onPaste={(e) => {
                                const pastedText = e.clipboardData
                                  .getData("text")
                                  .toUpperCase()
                                  .replace(/\s/g, "");
                                e.preventDefault();
                                document.execCommand(
                                  "insertText",
                                  false,
                                  pastedText,
                                );
                                handleBarcodeInputChange(
                                  { target: { value: pastedText } },
                                  index,
                                );
                              }}
                              placeholder="Enter barcode digits..."
                              className="h-8.5 text-xs px-3 uppercase bg-white border border-stone-200 focus:border-[#A27B5C] focus:ring-2 focus:ring-[#A27B5C]/15 rounded-xl text-stone-900 font-mono tracking-wider font-semibold placeholder:text-stone-400 placeholder:normal-case placeholder:font-sans placeholder:tracking-normal w-48 sm:w-56 shadow-2xs"
                              disabled={isInputDisabled(index)}
                            />

                            <Button
                              type="button"
                              onClick={() => addBarcodeToBox(index)}
                              disabled={
                                isInputDisabled(index) ||
                                !currentInputValue.trim() ||
                                activeInputIndex !== index
                              }
                              size="sm"
                              className="h-8.5 w-8.5 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl shadow-2xs flex items-center justify-center cursor-pointer transition-all disabled:opacity-40 p-0"
                            >
                              {loadingStates[index] ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Plus className="h-3.5 w-3.5" />
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              size="icon"
                              type="button"
                              onClick={() => removeUser(index)}
                              className="h-8.5 w-8.5 border-stone-200 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              disabled={users.length <= 1}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          {user.barcodes.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 pt-1">
                              {Object.entries(
                                user.barcodes.reduce((acc, barcode) => {
                                  if (!acc[barcode]) acc[barcode] = 0;
                                  acc[barcode]++;
                                  return acc;
                                }, {}),
                              ).map(([barcode, count]) => {
                                const firstIndex = user.barcodes.findIndex(
                                  (b) => b === barcode,
                                );

                                return (
                                  <div
                                    key={`${index}-${barcode}-${firstIndex}`}
                                    className={`bg-white p-1.5 rounded-xl border border-stone-200/80 text-xs flex items-center justify-between shadow-2xs ${
                                      highlightedItem === barcode
                                        ? "border-[#A27B5C] bg-[#FAF8F5] ring-2 ring-[#A27B5C]/20"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center min-w-0 flex-1">
                                      <span className="text-stone-400 mr-1 text-[10px] w-4 text-right shrink-0">
                                        {firstIndex + 1}.
                                      </span>
                                      <span
                                        className="font-mono text-xs font-semibold text-stone-800 truncate"
                                        title={barcode}
                                      >
                                        {barcode}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {count > 1 && (
                                        <span className="text-[10px] font-bold text-[#543D2B] bg-[#F5F2EB] px-1.5 py-0.5 rounded-md">
                                          x{count}
                                        </span>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        onClick={() => {
                                          const newBarcodes = [
                                            ...user.barcodes,
                                          ];
                                          const barcodeIndex =
                                            newBarcodes.findIndex(
                                              (b) => b === barcode,
                                            );
                                          if (barcodeIndex !== -1) {
                                            newBarcodes.splice(barcodeIndex, 1);
                                            const newUsers = [...users];
                                            newUsers[index].barcodes =
                                              newBarcodes;
                                            setUsers(newUsers);
                                          }
                                        }}
                                        className="h-5 w-5 hover:bg-red-50 text-red-500 rounded-md p-0"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-stone-400 py-1">
                              No barcodes added yet
                            </p>
                          )}
                          {Object.keys(boxDuplicates).filter(
                            (barcode) => boxDuplicates[barcode] > 1,
                          ).length > 0 && (
                            <div className="mt-1 text-amber-600 text-xs font-medium">
                              Duplicates: {formatBoxDuplicates()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={addItem}
                  disabled={
                    !workorder.work_order_rc_box ||
                    users.length >=
                      (parseInt(workorder.work_order_rc_box) || 0) ||
                    users.reduce(
                      (total, user) => total + user.barcodes.length,
                      0,
                    ) >= parseInt(workorder.work_order_rc_pcs || 0, 10)
                  }
                  size="sm"
                  className="h-9 border border-stone-300 text-stone-700 hover:bg-[#F5F2EB] hover:text-[#543D2B] rounded-xl text-xs font-bold px-4 shadow-2xs transition-all flex items-center gap-1.5 mt-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Box
                </Button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" asChild>
                  <Link to="/order-received">Cancel</Link>
                </Button>
                <Button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
};

export default AddOrderReceived;
