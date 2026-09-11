import React, { useRef, useState } from "react";
import Page from "../dashboard/page";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import moment from "moment";
import ReactToPrint from "react-to-print";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ButtonConfig } from "@/config/ButtonConfig";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import BASE_URL from "@/config/BaseUrl";
import Barcode from "react-barcode";

const DcReceiptReceived = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const componentRef = useRef(null);
  const navigate = useNavigate();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWorkOrderId, setDeleteWorkOrderId] = useState(null);
  const location = useLocation();

  const { orderReceivedStatus } = location.state || {};

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dcreceipt", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-work-order-received-view-by-id/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return {
        workOrder: response.data.workorderrc || {},
        workOrderSub: response.data.workorderrcsubNew || [],
        workOrderFooter: response.data.workorderfooter || {},
      };
    },
  });

  // Function to generate factory code (first char of each word)
  const generateFactoryCode = (factoryName) => {
    if (!factoryName) return "";
    
    return factoryName
      .split(" ")
      .map(word => word.charAt(0).toUpperCase())
      .join("");
  };

  // Function to format box number
  const formatBoxNumber = (boxNumber) => {
    const factoryCode = generateFactoryCode(data?.workOrder?.work_order_rc_factory);
    return `${factoryCode}${id}${boxNumber}`;
  };

  const updateMutation = useMutation({
    mutationFn: async (workOrderId) => {
      const token = localStorage.getItem("token");
      return await axios.put(
        `${BASE_URL}/api/update-work-order-received-finish-by-id/${workOrderId}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    onSuccess: (response) => {
      refetch();
      setDeleteConfirmOpen(false);
      toast({
        title: "Success",
        description: `${response?.data?.msg}`,
      });
      navigate("/order-received");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error closing dc receipt order",
      });
    },
  });

  const confirmCloseWorkOrder = () => {
    if (deleteWorkOrderId) {
      updateMutation.mutate(deleteWorkOrderId);
      setDeleteWorkOrderId(null);
    }
  };

  if (isLoading) {
    return <LoaderComponent name="Work Order Dc Receipt Data" />;
  }

  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Work Order Dc Receipt Data"
        refetch={refetch}
      />
    );
  }

  const splitBarcodeData = (data) => {
    const barcodes = data.split(",").map((b) => b.trim());
    
    const barcodeCounts = {};
    barcodes.forEach(barcode => {
      barcodeCounts[barcode] = (barcodeCounts[barcode] || 0) + 1;
    });
  
    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(barcodeCounts).map(([barcode, count], index) => (
          <span key={index} className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-sm">
            {barcode}
            {count > 1 && (
              <span className="ml-1 text-gray-600">(×{count})</span>
            )}
          </span>
        ))}
      </div>
    );
  };

  const { workOrder, workOrderSub } = data;

  const groupedBoxes = workOrderSub.reduce((acc, item) => {
    const boxNumber = item.work_order_rc_sub_box;
    if (!acc[boxNumber]) {
      acc[boxNumber] = {
        barcodes: [],
        totalPcs: 0,
      };
    }
    acc[boxNumber].barcodes.push(item.work_order_rc_sub_barcode);
    acc[boxNumber].totalPcs++;
    return acc;
  }, {});

  // Render box content dynamically
  const renderDynamicBoxContent = () => {
    return Object.entries(groupedBoxes).map(([boxNumber, boxData], index) =>
      renderBoxContent(
        boxNumber,
        boxData.totalPcs,
        boxData.barcodes.join(","),
        index
      )
    );
  };

  // Render box content with barcode
  const renderBoxContent = (boxNumber, totalPcs, barcodeData, index) => {
    const formattedBoxNumber = formatBoxNumber(boxNumber);
    
    return (
      <div key={`box-${boxNumber}-${index}`} className="mb-4 break-inside-avoid">
        {/* Barcode Section */}
        <div className="border flex flex-col border-black p-3">
          {/* Barcode and Box Info */}
          <div className="flex flex-row items-start justify-start gap-5">
            {/* Barcode */}
            <div className="flex flex-col   items-center">
              <Barcode
                value={formattedBoxNumber}
                width={1.5}
                height={55}
                fontSize={14}
                margin={0}
                displayValue={true}
                format="CODE128"
                background="transparent"
                lineColor="#000000"
              />
              <div className="text-center mt-1 ">
                <span className="text-sm font-semibold">Box: {formattedBoxNumber}</span>
                <span className="mx-2">/</span>
                <span className="text-sm">Total Pcs: {totalPcs}</span>
              </div>
            </div>

             <div className="mt-2 ">
            <div className="text-xs font-medium mb-1">Item Barcodes:</div>
            {splitBarcodeData(barcodeData)}
          </div>
          </div>
          
          {/* Barcode Data */}
         
        </div>
      </div>
    );
  };

  return (
    <Page>
      <div className="max-w-full mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Dc Receipt
              </CardTitle>
              {orderReceivedStatus?.toLowerCase() !== "received" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteWorkOrderId(id);
                    setDeleteConfirmOpen(true);
                  }}
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    All Received
                  </div>
                </Button>
              )}
              <ReactToPrint
                trigger={() => (
                  <Button variant="outline" size="sm" asChild>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <Printer className="h-4 w-4" />
                      Print
                    </div>
                  </Button>
                )}
                content={() => componentRef.current}
              />
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div ref={componentRef} className="bg-white rounded-lg print:p-4">
              {/* Main Details Table with Single Border */}
              <table className="w-full mb-1 border-collapse text-sm">
                <tbody>
                  <tr className="border-t border-l border-r border-black">
                    <td className="font-semibold p-1 w-[8rem] border-r">
                      Factory
                    </td>
                    <td className="p-1 w-[16rem] border-r">
                      : {workOrder.work_order_rc_factory}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      Date
                    </td>
                    <td className="p-1 w-[8rem]">
                      :{" "}
                      {moment(workOrder.work_order_rc_date).format(
                        "DD-MM-YYYY"
                      )}
                    </td>
                  </tr>
                  <tr className="border-l border-r border-black">
                    <td className="font-semibold p-1 w-[8rem] border-r">
                      Brand
                    </td>
                    <td className="p-1 w-[16rem] border-r">
                      : {workOrder.work_order_rc_brand}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      DC No
                    </td>
                    <td className="p-1 w-[8rem]">
                      : {workOrder.work_order_rc_dc_no}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      DC Date
                    </td>
                    <td className="p-1 w-[8rem]">
                      :{" "}
                      {moment(workOrder.work_order_rc_dc_date).format(
                        "DD-MM-YYYY"
                      )}
                    </td>
                  </tr>
                  <tr className="border-l border-r border-black">
                    <td className="font-semibold p-1 w-[8rem] border-r">
                      No of Box
                    </td>
                    <td className="p-1 w-[16rem] border-r">
                      : {workOrder.work_order_rc_box}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      Total Pcs
                    </td>
                    <td className="p-1 w-[8rem] border-r">
                      : {workOrder.work_order_rc_pcs}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      Received By
                    </td>
                    <td className="p-1 w-[8rem]">
                      : {workOrder.work_order_rc_received_by}
                    </td>
                  </tr>
                  <tr className="border-l border-r border-b border-black">
                    <td className="font-semibold p-1 w-[8rem] border-r">
                      Work Order No
                    </td>
                    <td className="p-1 w-[16rem] border-r">
                      : {workOrder.work_order_rc_id}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      Remarks
                    </td>
                    <td colSpan="3" className="p-1 break-words">
                      : {workOrder.work_order_rc_remarks}
                    </td>
                  </tr>
                </tbody>
              </table>
              {/* Render boxes with barcodes */}
              <div className="mt-4 space-y-4">{renderDynamicBoxContent()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this{" "}
              <span className="text-red-500">DC Receipt</span> and mark all
              materials as received?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCloseWorkOrder}
              className={`${ButtonConfig.backgroundColor} ${ButtonConfig.textColor} text-black hover:bg-red-600`}
              disabled={updateMutation.isPending}
            >
         {updateMutation.isPending ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </div>
        ) : (
          "Yes"
        )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};

export default DcReceiptReceived;




import React, { useRef, useState } from "react";
import Page from "../dashboard/page";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import moment from "moment";
import ReactToPrint from "react-to-print";
import { Printer, BarcodeIcon, Plus, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ButtonConfig } from "@/config/ButtonConfig";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import BASE_URL from "@/config/BaseUrl";
import Barcode from "react-barcode";

const DcReceiptReceived = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const componentRef = useRef(null);
  const navigate = useNavigate();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWorkOrderId, setDeleteWorkOrderId] = useState(null);
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [currentInputValue, setCurrentInputValue] = useState("");
  const [loadingStates, setLoadingStates] = useState({});
  const location = useLocation();

  const { orderReceivedStatus } = location.state || {};

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dcreceipt", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-work-order-received-view-by-id/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return {
        workOrder: response.data.workorderrc || {},
        workOrderSub: response.data.workorderrcsubNew || [],
        workOrderFooter: response.data.workorderfooter || {},
      };
    },
  });


  const generateFactoryCode = (factoryName) => {
    if (!factoryName) return "";
    
    return factoryName
      .split(" ")
      .map(word => word.charAt(0).toUpperCase())
      .join("");
  };

  
  const formatBoxNumber = (boxNumber) => {
    const factoryCode = generateFactoryCode(data?.workOrder?.work_order_rc_factory);
    return `${factoryCode}${id}${boxNumber}`;
  };

  const updateMutation = useMutation({
    mutationFn: async (workOrderId) => {
      const token = localStorage.getItem("token");
      return await axios.put(
        `${BASE_URL}/api/update-work-order-received-finish-by-id/${workOrderId}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    onSuccess: (response) => {
      refetch();
      setDeleteConfirmOpen(false);
      toast({
        title: "Success",
        description: `${response?.data?.msg}`,
      });
      navigate("/order-received");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error closing dc receipt order",
      });
    },
  });

  const updateOrderReceivedMutation = useMutation({
    mutationFn: async (submissionData) => {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${BASE_URL}/api/update-work-orders-received/${id}`,
        submissionData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.code === "200" || data?.code === 200) {
        toast({
          title: "Success",
          description: "Work Order Receive Updated Successfully",
        });
        refetch();
        setBarcodeDialogOpen(false);
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

  const confirmCloseWorkOrder = () => {
    if (deleteWorkOrderId) {
      updateMutation.mutate(deleteWorkOrderId);
      setDeleteWorkOrderId(null);
    }
  };

  const openBarcodeDialog = (boxNumber, boxData) => {
    setSelectedBox({
      boxNumber,
      originalBarcodes: [...boxData.barcodes],
      currentBarcodes: [...boxData.barcodes],
    });
    setBarcodeDialogOpen(true);
    setCurrentInputValue(""); // Reset input when opening dialog
  };

  const handleBarcodeInputChange = (e) => {
    setCurrentInputValue(e.target.value);
  };

  const addBarcodeToBox = async () => {
    if (!currentInputValue.trim() || !selectedBox) return;
    
    setLoadingStates((prev) => ({ ...prev, [selectedBox.boxNumber]: true }));

    try {
      const barcode = currentInputValue.trim().toUpperCase();
      if (barcode.length !== 6) {
        toast({
          title: "Invalid format",
          description: "Barcode must be exactly 6 digits",
          variant: "destructive",
        });
        return;
      }

      // Validate barcode against work order
      const workId = data?.workOrder?.work_order_rc_id;
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `${BASE_URL}/api/fetch-work-order-finish-check/${workId}/${barcode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Barcode validation failed");
      const validationData = await response.json();

      if (validationData?.code === 200) {
        // Add barcode to current box
        setSelectedBox(prev => ({
          ...prev,
          currentBarcodes: [...prev.currentBarcodes, barcode]
        }));
        setCurrentInputValue("");
        
        toast({
          title: "Success",
          description: "Barcode added successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: validationData?.msg || 'Barcode not found in work order',
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
      setLoadingStates((prev) => ({ ...prev, [selectedBox.boxNumber]: false }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBarcodeToBox();
    }
  };

  const removeBarcode = (barcodeIndex) => {
    if (!selectedBox) return;
    
    setSelectedBox(prev => ({
      ...prev,
      currentBarcodes: prev.currentBarcodes.filter((_, index) => index !== barcodeIndex)
    }));
  };

  const updateBoxBarcodes = () => {
    if (!selectedBox) return;

    // Prepare data for API call - we need to update the entire work order
    const groupedBoxes = data.workOrderSub.reduce((acc, item) => {
      const boxNumber = item.work_order_rc_sub_box;
      if (!acc[boxNumber]) {
        acc[boxNumber] = {
          barcodes: [],
        };
      }
      
      // If this is the selected box, use the updated barcodes
      if (boxNumber === selectedBox.boxNumber) {
        acc[boxNumber].barcodes = [...new Set(selectedBox.currentBarcodes)];
      } else {
        // For other boxes, keep the original barcodes
        acc[boxNumber].barcodes.push(item.work_order_rc_sub_barcode);
      }
      return acc;
    }, {});

    const workorder_sub_rc_data = Object.entries(groupedBoxes).map(([boxNumber, boxData]) => ({
      work_order_rc_sub_box: boxNumber,
      work_order_rc_sub_barcode: boxData.barcodes.join(",")
    }));

    const totalPcs = workorder_sub_rc_data.reduce((total, box) => {
      const barcodes = box.work_order_rc_sub_barcode.split(',').filter(b => b.trim());
      return total + barcodes.length;
    }, 0);

    const submissionData = {
      work_order_rc_dc_no: data?.workOrder?.work_order_rc_dc_no,
      work_order_rc_dc_date: data?.workOrder?.work_order_rc_dc_date,
      work_order_rc_box: Object.keys(groupedBoxes).length.toString(),
      work_order_rc_pcs: totalPcs.toString(),
      work_order_rc_fabric_received: data?.workOrder?.work_order_rc_fabric_received || "No",
      work_order_rc_fabric_count: data?.workOrder?.work_order_rc_fabric_count || "",
      work_order_rc_remarks: data?.workOrder?.work_order_rc_remarks || "",
      workorder_sub_rc_data: workorder_sub_rc_data,
      work_order_rc_count: Object.keys(groupedBoxes).length,
    };

    console.log("Submission Data:", submissionData);
    updateOrderReceivedMutation.mutate(submissionData);
  };

  const splitBarcodeData = (data) => {
    const barcodes = data.split(",").map((b) => b.trim());
    
    const barcodeCounts = {};
    barcodes.forEach(barcode => {
      barcodeCounts[barcode] = (barcodeCounts[barcode] || 0) + 1;
    });
  
    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(barcodeCounts).map(([barcode, count], index) => (
          <span key={index} className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-sm">
            {barcode}
            {count > 1 && (
              <span className="ml-1 text-gray-600">(×{count})</span>
            )}
          </span>
        ))}
      </div>
    );
  };

  // Calculate duplicates for the selected box
  const calculateBoxDuplicates = (barcodes) => {
    const duplicates = {};
    barcodes.forEach(barcode => {
      duplicates[barcode] = (duplicates[barcode] || 0) + 1;
    });
    return duplicates;
  };

  if (isLoading) {
    return <LoaderComponent name="Work Order Dc Receipt Data" />;
  }

  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Work Order Dc Receipt Data"
        refetch={refetch}
      />
    );
  }

  const { workOrder, workOrderSub } = data;

  const groupedBoxes = workOrderSub.reduce((acc, item) => {
    const boxNumber = item.work_order_rc_sub_box;
    if (!acc[boxNumber]) {
      acc[boxNumber] = {
        barcodes: [],
        totalPcs: 0,
      };
    }
    acc[boxNumber].barcodes.push(item.work_order_rc_sub_barcode);
    acc[boxNumber].totalPcs++;
    return acc;
  }, {});

  // Render box content dynamically
  const renderDynamicBoxContent = () => {
    return Object.entries(groupedBoxes).map(([boxNumber, boxData], index) =>
      renderBoxContent(
        boxNumber,
        boxData.totalPcs,
        boxData.barcodes.join(","),
        boxData,
        index
      )
    );
  };

  // Render box content with barcode
  const renderBoxContent = (boxNumber, totalPcs, barcodeData, boxData, index) => {
    const formattedBoxNumber = formatBoxNumber(boxNumber);
    
    return (
      <div key={`box-${boxNumber}-${index}`} className="mb-4 break-inside-avoid">
        <div className="border flex flex-col border-black p-3">
          <div className="flex flex-row items-start justify-between gap-5">
            <div className="flex flex-col items-center">
              <Barcode
                value={formattedBoxNumber}
                width={1.5}
                height={55}
                fontSize={14}
                margin={0}
                displayValue={true}
                format="CODE128"
                background="transparent"
                lineColor="#000000"
              />
              <div className="text-center mt-1 ">
                <span className="text-sm font-semibold">Box: {formattedBoxNumber}</span>
                <span className="mx-2">/</span>
                <span className="text-sm">Total Pcs: {totalPcs}</span>
              </div>
            </div>

            <div className="mt-2 flex-1">
              <div className="text-xs font-medium mb-1">Item Barcodes:</div>
              {splitBarcodeData(barcodeData)}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => openBarcodeDialog(boxNumber, boxData)}
              className="h-8 w-8 p-0"
            >
              <BarcodeIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Page>
      <div className="max-w-full mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Dc Receipt
              </CardTitle>
              {orderReceivedStatus?.toLowerCase() !== "received" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteWorkOrderId(id);
                    setDeleteConfirmOpen(true);
                  }}
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    All Received
                  </div>
                </Button>
              )}
              <ReactToPrint
                trigger={() => (
                  <Button variant="outline" size="sm" asChild>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <Printer className="h-4 w-4" />
                      Print
                    </div>
                  </Button>
                )}
                content={() => componentRef.current}
              />
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div ref={componentRef} className="bg-white rounded-lg print:p-4">
              {/* Main Details Table with Single Border */}
              <table className="w-full mb-1 border-collapse text-sm">
                <tbody>
                  <tr className="border-t border-l border-r border-black">
                    <td className="font-semibold p-1 w-[8rem] border-r">
                      Factory
                    </td>
                    <td className="p-1 w-[16rem] border-r">
                      : {workOrder.work_order_rc_factory}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      Date
                    </td>
                    <td className="p-1 w-[8rem]">
                      :{" "}
                      {moment(workOrder.work_order_rc_date).format(
                        "DD-MM-YYYY"
                      )}
                    </td>
                  </tr>
                  <tr className="border-l border-r border-black">
                    <td className="font-semibold p-1 w-[8rem] border-r">
                      Brand
                    </td>
                    <td className="p-1 w-[16rem] border-r">
                      : {workOrder.work_order_rc_brand}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      DC No
                    </td>
                    <td className="p-1 w-[8rem]">
                      : {workOrder.work_order_rc_dc_no}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      DC Date
                    </td>
                    <td className="p-1 w-[8rem]">
                      :{" "}
                      {moment(workOrder.work_order_rc_dc_date).format(
                        "DD-MM-YYYY"
                      )}
                    </td>
                  </tr>
                  <tr className="border-l border-r border-black">
                    <td className="font-semibold p-1 w-[8rem] border-r">
                      No of Box
                    </td>
                    <td className="p-1 w-[16rem] border-r">
                      : {workOrder.work_order_rc_box}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      Total Pcs
                    </td>
                    <td className="p-1 w-[8rem] border-r">
                      : {workOrder.work_order_rc_pcs}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      Received By
                    </td>
                    <td className="p-1 w-[8rem]">
                      : {workOrder.work_order_rc_received_by}
                    </td>
                  </tr>
                  <tr className="border-l border-r border-b border-black">
                    <td className="font-semibold p-1 w-[8rem] border-r">
                      Work Order No
                    </td>
                    <td className="p-1 w-[16rem] border-r">
                      : {workOrder.work_order_rc_id}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      Remarks
                    </td>
                    <td colSpan="3" className="p-1 break-words">
                      : {workOrder.work_order_rc_remarks}
                    </td>
                  </tr>
                </tbody>
              </table>
              {/* Render boxes with barcodes */}
              <div className="mt-4 space-y-4">{renderDynamicBoxContent()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barcode Scanning Dialog */}
      <Dialog open={barcodeDialogOpen} onOpenChange={setBarcodeDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Barcode Management - Box {selectedBox?.boxNumber}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
            {/* Left Side - Original Barcodes */}
            <div className="border rounded-lg p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Original Barcodes</h3>
                <div className="text-sm">
                  <span className="font-semibold">Box: {selectedBox && formatBoxNumber(selectedBox.boxNumber)}</span>
                  <span className="mx-2">/</span>
                  <span>Total Pcs: {selectedBox?.originalBarcodes.length}</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {selectedBox?.originalBarcodes.map((barcode, index) => {
                    const isMatched = selectedBox?.currentBarcodes.includes(barcode);
                    return (
                      <div
                        key={`original-${barcode}-${index}`}
                        className={`p-3 rounded border text-sm font-mono ${
                          isMatched 
                            ? 'bg-green-100 border-green-500 text-green-800' 
                            : 'bg-red-100 border-red-500 text-red-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{index + 1}. {barcode}</span>
                          {isMatched && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                              Matched
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Side - Barcode Management */}
            <div className="border rounded-lg p-4 flex flex-col">
              <h3 className="text-lg font-semibold mb-4">Scan & Add Barcodes</h3>
              
              {/* Input Section */}
              <div className="flex gap-2 mb-4">
                <Input
                  value={currentInputValue}
                  onChange={handleBarcodeInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter 6-digit barcode"
                  className="flex-1 uppercase"
                  maxLength={6}
                />
                <Button
                  onClick={addBarcodeToBox}
                  disabled={!currentInputValue.trim() || loadingStates[selectedBox?.boxNumber]}
                  size="sm"
                >
                  {loadingStates[selectedBox?.boxNumber] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Current Barcodes List */}
              <div className="flex-1 overflow-y-auto">
                {selectedBox?.currentBarcodes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {selectedBox.currentBarcodes.map((barcode, barcodeIndex) => {
                      const duplicates = calculateBoxDuplicates(selectedBox.currentBarcodes);
                      const isDuplicate = duplicates[barcode] > 1;
                      
                      return (
                        <div
                          key={`current-${barcode}-${barcodeIndex}`}
                          className={`bg-white p-2 rounded border border-gray-200 text-sm flex items-center justify-between ${
                            isDuplicate ? 'bg-amber-50 border-amber-300' : ''
                          }`}
                        >
                          <div className="flex items-center min-w-0 flex-1">
                            <span className="text-gray-500 mr-2 w-6 text-right shrink-0">
                              {barcodeIndex + 1}.
                            </span>
                            <span className="font-mono truncate" title={barcode}>
                              {barcode}
                            </span>
                            {isDuplicate && (
                              <span className="ml-2 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                                Duplicate
                              </span>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => removeBarcode(barcodeIndex)}
                            className="h-6 w-6 hover:bg-red-100 text-red-500 shrink-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic text-center py-8">
                    No barcodes added yet
                  </p>
                )}
                
                {/* Duplicates Warning */}
                {selectedBox && (() => {
                  const duplicates = calculateBoxDuplicates(selectedBox.currentBarcodes);
                  const duplicateEntries = Object.entries(duplicates).filter(([_, count]) => count > 1);
                  
                  if (duplicateEntries.length > 0) {
                    return (
                      <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                        <div className="font-medium text-amber-800 mb-1">Duplicates:</div>
                        <div className="text-amber-700">
                          {duplicateEntries.map(([barcode, count]) => (
                            <span key={barcode} className="mr-2">
                              {barcode} × {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setBarcodeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={updateBoxBarcodes}
              disabled={updateOrderReceivedMutation.isPending}
            >
              {updateOrderReceivedMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </div>
              ) : (
                "Update Barcodes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this{" "}
              <span className="text-red-500">DC Receipt</span> and mark all
              materials as received?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCloseWorkOrder}
              className={`${ButtonConfig.backgroundColor} ${ButtonConfig.textColor} text-black hover:bg-red-600`}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                "Yes"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};

export default DcReceiptReceived;