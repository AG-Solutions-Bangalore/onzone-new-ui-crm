import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Send,
  ArrowLeft,
  Package,
  Calendar,
  Factory,
  ChevronLeft,
  Trash2,
  Plus,
  Loader2,
  Camera,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import BASE_URL from "@/config/BaseUrl";
import {
  LoaderComponent,
  ErrorComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import Page from "../dashboard/page";
import ScannerModel from "@/components/ScannerModel"; // Import scanner component

const work_receive = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const formSchema = z.object({
  work_order_rc_dc_no: z.string().min(1, "DC No is required"),
  work_order_rc_dc_date: z.string().min(1, "DC Date is required"),
  work_order_rc_box: z.number().min(1, "Box count is required"),
  work_order_rc_pcs: z.number().min(1, "Pieces count is required"),
  work_order_rc_fabric_received: z
    .string()
    .min(1, "Fabric received status is required"),
  work_order_rc_fabric_count: z.string().optional(),
  work_order_rc_remarks: z.string().optional(),
  work_order_rc_count: z.number().optional(),
});

const EditOrderReceived = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRefs = useRef([]);

  // Step state
  const [step, setStep] = useState(1);

  const [workorder, setWorkOrderReceive] = useState({
    work_order_rc_factory_no: "",
    work_order_rc_id: "",
    work_order_rc_date: "",
    work_order_rc_dc_no: "",
    work_order_rc_dc_date: "",
    work_order_rc_brand: "",
    work_order_rc_box: "",
    work_order_rc_pcs: "",
    work_order_rc_fabric_received: "",
    work_order_rc_received_by: "",
    work_order_rc_fabric_count: "",
    work_order_rc_count: "",
    work_order_rc_remarks: "",
    work_order_rc_ref: "",
  });

  const [users, setUsers] = useState([
    { id: "", work_order_rc_sub_box: 1, barcodes: [], dbIds: [] },
  ]);

  const [loadingStates, setLoadingStates] = useState({});
  const [duplicateBarcodes, setDuplicateBarcodes] = useState({});
  const [activeInputIndex, setActiveInputIndex] = useState(null);
  const [currentInputValue, setCurrentInputValue] = useState("");
  const [highlightedItem, setHighlightedItem] = useState(null);

  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Alert Dialog States
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    data: null,
    message: "",
  });

  // Fetch work order received data
  const {
    data: workOrderData,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["workOrderReceived", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-work-order-received-by-id/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
  });

  // Transform API data to match our state structure
  useEffect(() => {
    if (workOrderData) {
      const { workorderrc, workorderrcsub } = workOrderData;

      if (workorderrc) {
        setWorkOrderReceive({
          work_order_rc_factory_no: workorderrc.work_order_rc_factory_no || "",
          work_order_rc_id: workorderrc.work_order_rc_id || "",
          work_order_rc_date: workorderrc.work_order_rc_date || "",
          work_order_rc_dc_no: workorderrc.work_order_rc_dc_no || "",
          work_order_rc_dc_date: workorderrc.work_order_rc_dc_date || "",
          work_order_rc_brand: workorderrc.work_order_rc_brand || "",
          work_order_rc_box: workorderrc.work_order_rc_box || "",
          work_order_rc_pcs: workorderrc.work_order_rc_pcs || "",
          work_order_rc_fabric_received:
            workorderrc.work_order_rc_fabric_received || "",
          work_order_rc_received_by:
            workorderrc.work_order_rc_received_by || "",
          work_order_rc_fabric_count:
            workorderrc.work_order_rc_fabric_count || "",
          work_order_rc_count: workorderrc.work_order_rc_count || "",
          work_order_rc_remarks: workorderrc.work_order_rc_remarks || "",
          work_order_rc_ref: workorderrc.work_order_rc_ref || "",
        });
      }

      if (workorderrcsub && workorderrcsub.length > 0) {
        const boxGroups = workorderrcsub.reduce((acc, item) => {
          const boxNo = item.work_order_rc_sub_box || "1";
          if (!acc[boxNo]) {
            acc[boxNo] = {
              id: `box-${boxNo}`,
              work_order_rc_sub_box: parseInt(boxNo),
              barcodes: [],
              dbIds: [],
            };
          }
          if (item.work_order_rc_sub_barcode) {
            acc[boxNo].barcodes.push(item.work_order_rc_sub_barcode);
            acc[boxNo].dbIds.push(item.id);
          }
          return acc;
        }, {});

        // Convert to array and sort by box number
        const usersArray = Object.values(boxGroups)
          .sort((a, b) => a.work_order_rc_sub_box - b.work_order_rc_sub_box)
          .map((box, index) => ({
            ...box,
            id: box.id || `box-${index + 1}`,
          }));

        setUsers(usersArray);
      } else {
        setUsers([
          { id: "box-1", work_order_rc_sub_box: 1, barcodes: [], dbIds: [] },
        ]);
      }
    }
  }, [workOrderData]);

  // Calculate and update box and pieces count whenever users state changes
  useEffect(() => {
    const totalBoxes = users.length;
    const totalPieces = users.reduce(
      (total, user) => total + user.barcodes.length,
      0,
    );

    setWorkOrderReceive((prev) => ({
      ...prev,
      work_order_rc_box: totalBoxes.toString(),
      work_order_rc_pcs: totalPieces.toString(),
    }));
  }, [users]);

  // Calculate duplicate barcodes (unchanged)
  const calculateDuplicates = useCallback((users) => {
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
  }, []);

  useEffect(() => {
    setDuplicateBarcodes(calculateDuplicates(users));
  }, [users, calculateDuplicates]);

  const onInputChange = (e) => {
    const { name, value } = e.target;

    // Don't allow manual changes to box and pcs fields since they're auto-calculated
    if (name === "work_order_rc_box" || name === "work_order_rc_pcs") {
      toast({
        title: "Auto-calculated Field",
        description:
          "This field is automatically calculated from barcode entries",
        variant: "default",
      });
      return;
    }

    setWorkOrderReceive((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBarcodeInputChange = (e, index) => {
    setCurrentInputValue(e.target.value);
  };

  // Modified addBarcodeToBox to accept optional scanned value
  const addBarcodeToBox = async (index, barcodeOverride = null) => {
    const barcode = barcodeOverride
      ? barcodeOverride.toUpperCase().trim()
      : currentInputValue.trim();
    if (!barcode) return;

    setLoadingStates((prev) => ({ ...prev, [index]: true }));

    try {
      if (barcode.length !== 6) {
        toast({
          title: "Invalid format",
          description: "Barcode must be exactly 6 characters",
          variant: "destructive",
        });
        return;
      }

      // Add the barcode to the box (without dbId for new barcodes)
      const newUsers = [...users];
      newUsers[index].barcodes.push(barcode);
      newUsers[index].dbIds.push(null);
      setUsers(newUsers);

      // Clear input only if not coming from scanner
      if (!barcodeOverride) {
        setCurrentInputValue("");
      }

      toast({
        title: "Success",
        description: "Barcode added successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error adding barcode",
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

  // Show confirmation dialog for box deletion (unchanged)
  const confirmBoxDelete = (index) => {
    const boxNumber = users[index].work_order_rc_sub_box;
    const barcodeCount = users[index].barcodes.length;
    const hasDbEntries = users[index].dbIds.some((id) => id !== null);

    setDeleteDialog({
      isOpen: true,
      data: { index, boxNumber, barcodeCount, hasDbEntries },
      message: hasDbEntries
        ? `Are you sure you want to delete Box ${boxNumber}? This will remove ${barcodeCount} barcode(s) from the database.`
        : `Are you sure you want to remove Box ${boxNumber}? This will remove ${barcodeCount} barcode(s).`,
    });
  };

  // Handle confirmed deletion (unchanged)
  const handleConfirmedDelete = async () => {
    const { index, boxNumber, hasDbEntries } = deleteDialog.data;

    if (hasDbEntries) {
      const success = await deleteBoxFromDB(boxNumber);
      if (!success) return;
    }

    await removeUser(index);

    setDeleteDialog({ isOpen: false, data: null, message: "" });
  };

  // Delete entire box from database (unchanged)
  const deleteBoxFromDB = async (boxNumber) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/api/delete-work-order-received-box-sub`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          work_order_rc_ref: workorder.work_order_rc_ref,
          work_order_rc_sub_box: boxNumber.toString(),
        },
      });
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete box from database",
      });
      return false;
    }
  };

  // Actual box removal function (unchanged)
  const removeUser = async (index) => {
    const newUsers = users.filter((_, i) => i !== index);
    const updatedUsers = newUsers.map((u, i) => ({
      ...u,
      work_order_rc_sub_box: i + 1,
    }));
    setUsers(updatedUsers);

    toast({
      title: "Success",
      description: "Box removed successfully",
      variant: "default",
    });
  };

  const addItem = (e) => {
    e.preventDefault();
    const newUsers = [
      ...users,
      {
        id: `box-${users.length + 1}`,
        work_order_rc_sub_box: users.length + 1,
        barcodes: [],
        dbIds: [],
      },
    ];
    setUsers(newUsers);
  };

  const updateOrderReceivedMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${BASE_URL}/api/update-work-orders-received/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.code === "200" || data?.code === 200) {
        toast({
          title: "Success",
          description: "Work Order Receive Updated Successfully",
        });
        navigate("/order-received");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error while editing the order received",
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "API Error occurred",
      });
    },
  });

  // Step navigation (unchanged)
  const handleNext = () => {
    const required = [
      "work_order_rc_dc_no",
      "work_order_rc_dc_date",
      "work_order_rc_fabric_received",
    ];
    const missing = required.filter((field) => !workorder[field]);
    if (missing.length > 0) {
      toast({
        variant: "destructive",
        title: "Please fill all required fields",
        description: `Missing: ${missing.join(", ")}`,
      });
      return;
    }
    if (parseInt(workorder.work_order_rc_box) < 1) {
      toast({
        variant: "destructive",
        title: "Invalid Box Count",
        description: "Please add at least one box.",
      });
      return;
    }
    if (parseInt(workorder.work_order_rc_pcs) < 1) {
      toast({
        variant: "destructive",
        title: "Invalid Piece Count",
        description: "Please add at least one barcode.",
      });
      return;
    }
    setStep(2);
  };

  const handleBack = () => setStep(1);

  const onSubmit = async (e) => {
    e.preventDefault();

    const submissionData = {
      work_order_rc_dc_no: workorder.work_order_rc_dc_no,
      work_order_rc_dc_date: workorder.work_order_rc_dc_date,
      work_order_rc_box: parseInt(workorder.work_order_rc_box),
      work_order_rc_pcs: parseInt(workorder.work_order_rc_pcs),
      work_order_rc_fabric_received: workorder.work_order_rc_fabric_received,
      work_order_rc_fabric_count: workorder.work_order_rc_fabric_count,
      work_order_rc_remarks: workorder.work_order_rc_remarks,
      work_order_rc_count: parseInt(workorder.work_order_rc_pcs),
      workorder_sub_rc_data: users.flatMap((user) =>
        user.barcodes.map((barcode, barcodeIndex) => ({
          id: user.dbIds[barcodeIndex] || null,
          work_order_rc_sub_box: user.work_order_rc_sub_box.toString(),
          work_order_rc_sub_barcode: barcode,
        })),
      ),
    };

    const validation = formSchema.safeParse(submissionData);
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Please fix the following:",
        description: (
          <div className="grid gap-1">
            {validation.error.errors.map((error, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex items-center justify-center h-4 w-4 mt-0.5 flex-shrink-0 rounded-full bg-red-100 text-red-700 text-xs">
                  {i + 1}
                </div>
                <p className="text-xs">
                  <span className="font-medium">
                    {error.path[0].toString().replace(/_/g, " ")}:
                  </span>{" "}
                  {error.message}
                </p>
              </div>
            ))}
          </div>
        ),
      });
      return;
    }

    const totalBoxes = users.length;
    const totalBarcodes = users.reduce(
      (total, user) => total + user.barcodes.length,
      0,
    );

    if (totalBoxes === 0) {
      toast({
        variant: "destructive",
        title: "No Boxes Added",
        description: "Please add at least one box with barcodes",
      });
      return;
    }

    if (totalBarcodes === 0) {
      toast({
        variant: "destructive",
        title: "No Barcodes Added",
        description: "Please add at least one barcode",
      });
      return;
    }

    updateOrderReceivedMutation.mutate(submissionData);
  };

  const totalTCodes = users.reduce(
    (total, user) => total + user.barcodes.length,
    0,
  );

  // Scanner helpers
  const openScannerForBox = (index) => {
    setActiveInputIndex(index);
    setCurrentInputValue("");
    setIsScannerOpen(true);
  };

  const closeScanner = () => setIsScannerOpen(false);

  const handleScannerScan = (value) => {
    if (activeInputIndex === null && activeInputIndex !== 0) {
      toast({
        title: "Error",
        description: "No box selected for scanning.",
        variant: "destructive",
      });
      return;
    }
    addBarcodeToBox(activeInputIndex, value);
    // setIsScannerOpen(false);
  };

  if (isFetching) {
    return <LoaderComponent name="Work Order Received Data" />;
  }

  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Work Order Received Data"
        refetch={refetch}
      />
    );
  }

  return (
    <Page>
      <div className="max-w-full mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Update Work Order Receive
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/order-received" className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium">Step {step} of 2</span>
              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: step === 1 ? "50%" : "100%" }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <form className="space-y-1">
              {step === 1 && (
                <>
                  {/* Basic Information Grid (same as before) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    <div className="">
                      <Label htmlFor="work_order_rc_factory_no">Factory</Label>
                      <Input
                        id="work_order_rc_factory_no"
                        name="work_order_rc_factory_no"
                        value={workorder.work_order_rc_factory_no}
                        onChange={onInputChange}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="">
                      <Label htmlFor="work_order_rc_id">Work Order ID</Label>
                      <Input
                        id="work_order_rc_id"
                        name="work_order_rc_id"
                        value={workorder.work_order_rc_id}
                        onChange={onInputChange}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="">
                      <Label htmlFor="work_order_rc_date">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Receive Date
                      </Label>
                      <Input
                        id="work_order_rc_date"
                        type="date"
                        name="work_order_rc_date"
                        value={workorder.work_order_rc_date}
                        onChange={onInputChange}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="">
                      <Label htmlFor="work_order_rc_dc_no">DC No</Label>
                      <Input
                        id="work_order_rc_dc_no"
                        name="work_order_rc_dc_no"
                        value={workorder.work_order_rc_dc_no}
                        onChange={onInputChange}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="">
                      <Label htmlFor="work_order_rc_dc_date">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        DC Date
                      </Label>
                      <Input
                        id="work_order_rc_dc_date"
                        type="date"
                        name="work_order_rc_dc_date"
                        value={workorder.work_order_rc_dc_date}
                        onChange={onInputChange}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="">
                      <Label htmlFor="work_order_rc_brand">Brand</Label>
                      <Input
                        id="work_order_rc_brand"
                        name="work_order_rc_brand"
                        value={workorder.work_order_rc_brand}
                        onChange={onInputChange}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="">
                      <Label htmlFor="work_order_rc_box">
                        No of Box <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="work_order_rc_box"
                        name="work_order_rc_box"
                        value={workorder.work_order_rc_box}
                        onChange={onInputChange}
                        required
                        disabled
                        className="bg-gray-100 font-semibold"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-calculated from boxes below
                      </p>
                    </div>
                    <div className="">
                      <Label htmlFor="work_order_rc_pcs">
                        Total No of Pcs <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="work_order_rc_pcs"
                        name="work_order_rc_pcs"
                        value={workorder.work_order_rc_pcs}
                        onChange={onInputChange}
                        required
                        disabled
                        className="bg-gray-100 font-semibold"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-calculated from barcodes below
                      </p>
                    </div>
                    <div className="">
                      <Label htmlFor="work_order_rc_fabric_received">
                        Fabric Received <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        name="work_order_rc_fabric_received"
                        value={workorder.work_order_rc_fabric_received}
                        onValueChange={(value) =>
                          setWorkOrderReceive((prev) => ({
                            ...prev,
                            work_order_rc_fabric_received: value,
                          }))
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          {work_receive.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {workorder.work_order_rc_fabric_received === "Yes" && (
                      <div className="">
                        <Label htmlFor="work_order_rc_received_by">
                          Fabric Received By
                        </Label>
                        <Input
                          id="work_order_rc_received_by"
                          name="work_order_rc_received_by"
                          value={workorder.work_order_rc_received_by}
                          onChange={onInputChange}
                        />
                      </div>
                    )}
                    <div
                      className={` ${
                        workorder.work_order_rc_fabric_received === "Yes"
                          ? "xl:col-span-2"
                          : "xl:col-span-1"
                      }`}
                    >
                      <Label htmlFor="work_order_rc_fabric_count">
                        Fabric Left Over
                      </Label>
                      <Input
                        id="work_order_rc_fabric_count"
                        name="work_order_rc_fabric_count"
                        value={workorder.work_order_rc_fabric_count}
                        onChange={onInputChange}
                      />
                    </div>
                    <div
                      className={` ${
                        workorder.work_order_rc_fabric_received === "Yes"
                          ? "xl:col-span-4"
                          : "xl:col-span-2"
                      }`}
                    >
                      <Label htmlFor="work_order_rc_remarks">Remarks</Label>
                      <Textarea
                        id="work_order_rc_remarks"
                        name="work_order_rc_remarks"
                        value={workorder.work_order_rc_remarks}
                        onChange={onInputChange}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button type="button" onClick={handleNext}>
                      Next
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  {/* Barcode entries with scanner */}
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
                        const barcodeGroups = user.barcodes.reduce(
                          (acc, barcode) => {
                            if (!acc[barcode]) {
                              acc[barcode] = { barcode, count: 1 };
                            } else {
                              acc[barcode].count += 1;
                            }
                            return acc;
                          },
                          {},
                        );

                        const uniqueBarcodes = Object.values(barcodeGroups);

                        return (
                          <div
                            key={user.id}
                            className="bg-[#FDFBF7] border border-stone-200/80 rounded-2xl p-3.5 shadow-2xs space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-stone-800">
                                  Box {user.work_order_rc_sub_box}
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
                                />

                                {/* Camera/Scanner button */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8.5 w-8.5 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] hover:text-[#543D2B] rounded-xl p-0"
                                  onClick={() => openScannerForBox(index)}
                                  title="Scan barcode"
                                >
                                  <Camera className="h-3.5 w-3.5" />
                                </Button>

                                <Button
                                  type="button"
                                  onClick={() => addBarcodeToBox(index)}
                                  disabled={
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
                                  onClick={() => confirmBoxDelete(index)}
                                  className="h-8.5 w-8.5 border-stone-200 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  disabled={users.length <= 1}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div>
                              {uniqueBarcodes.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 pt-1">
                                  {uniqueBarcodes.map(
                                    (barcodeGroup, barcodeIndex) => (
                                      <div
                                        key={`${index}-${barcodeGroup.barcode}-${barcodeIndex}`}
                                        className={`bg-white p-1.5 rounded-xl border border-stone-200/80 text-xs flex items-center justify-between shadow-2xs ${
                                          highlightedItem ===
                                          barcodeGroup.barcode
                                            ? "border-[#A27B5C] bg-[#FAF8F5] ring-2 ring-[#A27B5C]/20"
                                            : ""
                                        }`}
                                      >
                                        <div className="flex items-center min-w-0 flex-1">
                                          <span className="text-stone-400 mr-1 text-[10px] w-4 text-right shrink-0">
                                            {barcodeIndex + 1}.
                                          </span>
                                          <span
                                            className="font-mono text-xs font-semibold text-stone-800 truncate"
                                            title={barcodeGroup.barcode}
                                          >
                                            {barcodeGroup.barcode}
                                          </span>
                                        </div>
                                        {barcodeGroup.count > 1 && (
                                          <span className="text-[10px] font-bold text-[#543D2B] bg-[#F5F2EB] px-1.5 py-0.5 rounded-md shrink-0">
                                            x{barcodeGroup.count}
                                          </span>
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-stone-400 py-1">
                                  No barcodes added yet
                                </p>
                              )}

                              {uniqueBarcodes.some((bg) => bg.count > 1) && (
                                <div className="mt-1 text-amber-600 text-xs font-medium">
                                  Duplicate barcodes in this box
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
                      size="sm"
                      className="h-9 border border-stone-300 text-stone-700 hover:bg-[#F5F2EB] hover:text-[#543D2B] rounded-xl text-xs font-bold px-4 shadow-2xs transition-all flex items-center gap-1.5 mt-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Box
                    </Button>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Button variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={updateOrderReceivedMutation.isPending}
                        className="h-10 px-6 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {updateOrderReceivedMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Update
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog (unchanged) */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ isOpen: false, data: null, message: "" })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Box
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4 relative">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Scan Barcode</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeScanner}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" /> {/* close icon */}
              </Button>
            </div>
            <ScannerModel barcodeScannerValue={handleScannerScan} />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Position the barcode inside the scanner view
            </p>
          </div>
        </div>
      )}
    </Page>
  );
};

export default EditOrderReceived;
