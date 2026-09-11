import React, { useRef, useState, useEffect, useMemo } from "react";
import Page from "../dashboard/page";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import moment from "moment";
import * as XLSX from "xlsx";
import ReactToPrint from "react-to-print";
import {
  Printer,
  Download,
  Plus,
  Minus,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Barcode,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import BoxBarcodeScannerModal from "./BoxBarcodeScannerModal";

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
  const [validationStatus, setValidationStatus] = useState(null);
  const [receiveConfirmOpen, setReceiveConfirmOpen] = useState(false);
  const [selectedBoxToReceive, setSelectedBoxToReceive] = useState(null);
  const [receiveSelectedConfirmOpen, setReceiveSelectedConfirmOpen] = useState(false);
  const [barcodeFilter, setBarcodeFilter] = useState("all");
  const location = useLocation();

  const [checkedBoxes, setCheckedBoxes] = useState(new Set());
  const [expandedBoxes, setExpandedBoxes] = useState(new Set());

  const { orderReceivedStatus } = location.state || {};

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dcreceipt", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-work-order-received-view-by-id/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return {
        workOrder: response.data.workorderrc || {},
        workOrderSub: response.data.workorderrcsub || [],
        workOrderFooter: response.data.workorderfooter || {},
      };
    },
  });

  const { workOrder = {}, workOrderSub = [] } = data || {};

  const isOrderReceived =
    orderReceivedStatus?.toLowerCase() === "received" ||
    workOrder?.work_order_rc_status?.toLowerCase() === "received";


  // --- Build table rows (aggregated by box, barcode, size, rate) ---
  const tableRows = useMemo(() => {
    const rows = [];
    workOrderSub.forEach((item) => {
      const box = item.work_order_rc_sub_box || "1";
      const barcodeStr = item.work_order_rc_sub_barcode || "";
      const barcodes = barcodeStr.split(",").filter((b) => b.trim());
      if (barcodes.length === 0) return;

      const size = item.finished_stock_size || "N/A";
      const amount = item.finished_stock_amount || "N/A";

      barcodes.forEach((barcode) => {
        rows.push({
          box,
          barcode: barcode.trim(),
          size,
          amount,
        });
      });
    });

    const aggregated = {};
    rows.forEach((row) => {
      const key = `${row.box}|${row.barcode}|${row.size}|${row.amount}`;
      if (!aggregated[key]) {
        aggregated[key] = { ...row, quantity: 0 };
      }
      aggregated[key].quantity += 1;
    });

    return Object.values(aggregated);
  }, [workOrderSub]);

  // Group by box for rendering
  const groupedRows = useMemo(() => {
    return tableRows.reduce((acc, row) => {
      if (!acc[row.box]) acc[row.box] = [];
      acc[row.box].push(row);
      return acc;
    }, {});
  }, [tableRows]);

  // Build grouped boxes for barcode dialog
  const groupedBoxesForDialog = useMemo(() => {
    return workOrderSub.reduce((acc, item) => {
      const boxNumber = item.work_order_rc_sub_box;
      if (!acc[boxNumber]) {
        acc[boxNumber] = {
          barcodes: [],
          totalPcs: 0,
        };
      }

      if (item.work_order_rc_sub_barcode) {
        const barcodes = item.work_order_rc_sub_barcode
          .split(",")
          .filter((b) => b.trim());
        acc[boxNumber].barcodes.push(...barcodes);
        acc[boxNumber].totalPcs += barcodes.length;
      }
      return acc;
    }, {});
  }, [workOrderSub]);

  // Sort box numbers numerically from all sources
  const sortedBoxes = useMemo(() => {
    const boxSet = new Set();
    workOrderSub.forEach((item) => {
      if (item.work_order_rc_sub_box) {
        boxSet.add(String(item.work_order_rc_sub_box));
      }
    });
    Object.keys(groupedRows).forEach((b) => boxSet.add(String(b)));
    Object.keys(groupedBoxesForDialog).forEach((b) => boxSet.add(String(b)));

    if (boxSet.size === 0 && workOrder?.work_order_rc_box) {
      const total = parseInt(workOrder.work_order_rc_box) || 0;
      for (let i = 1; i <= total; i++) {
        boxSet.add(String(i));
      }
    }

    return Array.from(boxSet).sort((a, b) => Number(a) - Number(b));
  }, [groupedRows, groupedBoxesForDialog, workOrderSub, workOrder?.work_order_rc_box]);

  const generateFactoryCode = (factoryName) => {
    if (!factoryName) return "";
    return factoryName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  const formatBoxNumber = (boxNumber) => {
    const factoryCode = generateFactoryCode(workOrder.work_order_rc_factory);
    return `${factoryCode}${id}${boxNumber}`;
  };

  // ----- Excel Download Function -----
  const downloadExcel = () => {
    const selectedBoxes = [...checkedBoxes];

    if (selectedBoxes.length === 0) {
      toast({
        title: "Info",
        description: "Please select at least one box to export.",
        variant: "default",
      });
      return;
    }

    const filteredRows = tableRows.filter((row) =>
      selectedBoxes.includes(row.box),
    );

    if (filteredRows.length === 0) {
      toast({
        title: "Info",
        description: "No data found for selected boxes.",
        variant: "default",
      });
      return;
    }

    const selectedBoxData = selectedBoxes
      .map((box) => groupedBoxesForDialog[box])
      .filter(Boolean);
    const totalBoxes = selectedBoxes.length;
    const totalPcs = selectedBoxData.reduce(
      (sum, box) => sum + box.totalPcs,
      0,
    );

    // Prepare array of arrays (worksheet data)
    const wsData = [];

    // TITLE
    wsData.push(["DC RECEIPT"]);
    wsData.push([]);

    // SUMMARY
    wsData.push(["SUMMARY"]);

    // Factory name as title (without "Factory" label)
    const factoryName = workOrder.work_order_rc_factory || "";

    // Two‑column summary – Work Order No on the right
    const leftFields = [
      [factoryName],
      ["Brand", workOrder.work_order_rc_brand || ""],
      ["Date", moment(workOrder.work_order_rc_date).format("DD-MM-YYYY")],
    ];
    const rightFields = [
      ["Work Order No", workOrder.work_order_rc_id || ""],

      ["No of Box", totalBoxes.toString()],
      ["Total Pcs", totalPcs.toString()],
    ];
    const maxRows = Math.max(leftFields.length, rightFields.length);

    for (let i = 0; i < maxRows; i++) {
      const left = leftFields[i] || ["", ""];
      const right = rightFields[i] || ["", ""];
      wsData.push([left[0], left[1], "", right[0], right[1]]);
    }

    // BLANK ROW BEFORE DETAILS
    wsData.push([]);
    wsData.push(["DETAILS"]);
    wsData.push([]);

    // DETAILS – grouped by box
    const grouped = filteredRows.reduce((acc, row) => {
      if (!acc[row.box]) acc[row.box] = [];
      acc[row.box].push(row);
      return acc;
    }, {});

    const sortedBoxesSelected = Object.keys(grouped).sort(
      (a, b) => Number(a) - Number(b),
    );

    // Keep track of row indices for styling box headers
    const styleMap = {};

    sortedBoxesSelected.forEach((box, index) => {
      const headerRowIndex = wsData.length;
      wsData.push([`Box ${box}`]); // This cell will be styled
      styleMap[headerRowIndex] = { bold: true, fontSize: 14 };

      wsData.push(["Barcode", "Size", "MRP", "Quantity"]);
      grouped[box].forEach((row) => {
        wsData.push([row.barcode, row.size, row.amount, row.quantity]);
      });

      if (index < sortedBoxesSelected.length - 1) {
        wsData.push([]); // blank row as separator
      }
    });

    // Create worksheet from the array data
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws["!cols"] = [
      { wch: 18 }, // Key / Barcode
      { wch: 22 }, // Value / Size
      { wch: 5 }, // Spacer
      { wch: 18 }, // Right key
      { wch: 22 }, // Right value
    ];

    // --- Apply styling to box headers ---
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let r = range.s.r; r <= range.e.r; r++) {
      if (styleMap[r]) {
        const cellAddress = XLSX.utils.encode_cell({ r: r, c: 0 });
        if (ws[cellAddress]) {
          if (!ws[cellAddress].s) ws[cellAddress].s = {};
          ws[cellAddress].s.font = {
            bold: true,
            sz: 24, // font size 14
          };
        }
      }
    }

    // Increase row height for those header rows
    if (!ws["!rows"]) ws["!rows"] = [];
    Object.keys(styleMap).forEach((rowIdx) => {
      ws["!rows"][parseInt(rowIdx)] = { hpt: 26 }; // 26 points tall
    });

    // Create workbook and save
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DC Receipt");

    const fileName = `Packing${workOrder.work_order_rc_id}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };
  // ---------------------------------

  const updateMutation = useMutation({
    mutationFn: async (workOrderId) => {
      const token = localStorage.getItem("token");
      return await axios.put(
        `${BASE_URL}/api/update-work-order-received-finish-by-id/${workOrderId}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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
        refetch();
        setBarcodeDialogOpen(false);
        setValidationStatus(null);
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

  const updateBoxStatusMutation = useMutation({
    mutationFn: async (boxNumber) => {
      const token = localStorage.getItem("token");
      const workOrderRcRef = workOrder?.work_order_rc_ref || id;
      const payload = {
        box: boxNumber,
        work_order_rc_ref: workOrderRcRef,
      };

      const response = await axios.put(
        `${BASE_URL}/api/update-work-orders-received-status-box`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      setReceiveConfirmOpen(false);
      setSelectedBoxToReceive(null);
      toast({
        title: "Success",
        description: data?.message || data?.msg || "Box status updated successfully",
      });
      refetch();
    },
    onError: (error) => {
      setReceiveConfirmOpen(false);
      setSelectedBoxToReceive(null);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Error updating box received status",
      });
    },
  });

  const handleReceiveBoxClick = (boxNumber) => {
    setSelectedBoxToReceive(boxNumber);
    setReceiveConfirmOpen(true);
  };

  const confirmReceiveBox = () => {
    if (selectedBoxToReceive) {
      updateBoxStatusMutation.mutate(selectedBoxToReceive);
    }
  };

  const isBoxReceivedCheck = (boxNumber) => {
    const boxSubItems = workOrderSub.filter(
      (item) => String(item.work_order_rc_sub_box || "1") === String(boxNumber),
    );
    return (
      boxSubItems.length > 0 &&
      boxSubItems.every(
        (item) =>
          item.work_order_rc_sub_status?.toLowerCase() === "received" ||
          item.status?.toLowerCase() === "received" ||
          item.work_order_rc_status?.toLowerCase() === "received",
      )
    );
  };

  const updateSelectedBoxesStatusMutation = useMutation({
    mutationFn: async (boxesToUpdate) => {
      const token = localStorage.getItem("token");
      const workOrderRcRef = workOrder?.work_order_rc_ref || id;

      const promises = boxesToUpdate.map((boxNumber) => {
        const payload = {
          box: boxNumber,
          work_order_rc_ref: workOrderRcRef,
        };
        return axios.put(
          `${BASE_URL}/api/update-work-orders-received-status-box`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      });

      return await Promise.all(promises);
    },
    onSuccess: () => {
      setReceiveSelectedConfirmOpen(false);
      toast({
        title: "Success",
        description: "Selected box(es) marked as received successfully",
      });
      refetch();
    },
    onError: (error) => {
      setReceiveSelectedConfirmOpen(false);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "Error updating selected boxes status",
      });
    },
  });

  const selectedBoxesToReceiveList = useMemo(() => {
    return Array.from(checkedBoxes)
      .filter((box) => !isBoxReceivedCheck(box))
      .sort((a, b) => Number(a) - Number(b));
  }, [checkedBoxes, workOrderSub]);

  const handleReceiveSelectedClick = () => {
    if (checkedBoxes.size === 0) {
      toast({
        title: "Info",
        description: "Please select at least one box to mark as received.",
        variant: "default",
      });
      return;
    }
    if (selectedBoxesToReceiveList.length === 0) {
      toast({
        title: "Info",
        description: "All selected boxes are already marked as received.",
        variant: "default",
      });
      return;
    }
    setReceiveSelectedConfirmOpen(true);
  };

  const confirmReceiveSelectedBoxes = () => {
    if (selectedBoxesToReceiveList.length > 0) {
      updateSelectedBoxesStatusMutation.mutate(selectedBoxesToReceiveList);
    }
  };

  const openBarcodeDialog = (boxNumber, boxData) => {
    setSelectedBox({
      boxNumber,
      originalBarcodes: [...boxData.barcodes],
      currentBarcodes: [...boxData.barcodes],
    });
    setBarcodeDialogOpen(true);
  };

  const handleSaveBoxBarcodes = (updatedBarcodesList) => {
    if (!selectedBox) return;
    const groupedBoxes = workOrderSub.reduce((acc, item) => {
      const boxNumber = item.work_order_rc_sub_box;
      if (!acc[boxNumber]) {
        acc[boxNumber] = {
          barcodes: [],
        };
      }
      if (boxNumber === selectedBox.boxNumber) {
        acc[boxNumber].barcodes = [...updatedBarcodesList];
      } else {
        if (item.work_order_rc_sub_barcode) {
          const barcodes = item.work_order_rc_sub_barcode
            .split(",")
            .filter((b) => b.trim());
          acc[boxNumber].barcodes.push(...barcodes);
        }
      }
      return acc;
    }, {});

    const workorder_sub_rc_data = Object.entries(groupedBoxes).map(
      ([boxNumber, boxData]) => ({
        work_order_rc_sub_box: boxNumber,
        work_order_rc_sub_barcode: boxData.barcodes.join(","),
      }),
    );

    const totalPcs = workorder_sub_rc_data.reduce((total, box) => {
      const barcodes = box.work_order_rc_sub_barcode
        .split(",")
        .filter((b) => b.trim());
      return total + barcodes.length;
    }, 0);

    const submissionData = {
      work_order_rc_dc_no: workOrder.work_order_rc_dc_no,
      work_order_rc_dc_date: workOrder.work_order_rc_dc_date,
      work_order_rc_box: Object.keys(groupedBoxes).length.toString(),
      work_order_rc_pcs: totalPcs.toString(),
      work_order_rc_fabric_received:
        workOrder.work_order_rc_fabric_received || "No",
      work_order_rc_fabric_count: workOrder.work_order_rc_fabric_count || "",
      work_order_rc_remarks: workOrder.work_order_rc_remarks || "",
      workorder_sub_rc_data: workorder_sub_rc_data,
      work_order_rc_count: Object.keys(groupedBoxes).length,
    };

    updateOrderReceivedMutation.mutate(submissionData);
  };

  // Accurate piece-by-piece match calculation
  const getOriginalItemStatus = (index, barcode) => {
    if (!selectedBox) return "missing";
    const origList = selectedBox.originalBarcodes || [];
    const countBefore = origList
      .slice(0, index + 1)
      .filter((b) => b === barcode).length;
    const currentCount = (selectedBox.currentBarcodes || []).filter(
      (b) => b === barcode,
    ).length;
    return currentCount >= countBefore ? "matched" : "missing";
  };

  const getCurrentItemStatus = (index, barcode) => {
    if (!selectedBox) return "extra";
    const currList = selectedBox.currentBarcodes || [];
    const countBefore = currList
      .slice(0, index + 1)
      .filter((b) => b === barcode).length;
    const originalCount = (selectedBox.originalBarcodes || []).filter(
      (b) => b === barcode,
    ).length;
    return countBefore <= originalCount ? "matched" : "extra";
  };

  const toggleBox = (box) => {
    setCheckedBoxes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(box)) {
        newSet.delete(box);
      } else {
        newSet.add(box);
      }
      return newSet;
    });
  };

  const toggleBoxExpand = (box) => {
    setExpandedBoxes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(box)) {
        newSet.delete(box);
      } else {
        newSet.add(box);
      }
      return newSet;
    });
  };

  const isAllChecked =
    sortedBoxes.length > 0 && sortedBoxes.every((box) => checkedBoxes.has(box));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setCheckedBoxes(new Set(sortedBoxes));
    } else {
      setCheckedBoxes(new Set());
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

  return (
    <Page>
      <div className="max-w-full mx-auto">
        <Card className="shadow-lg">
          {/* Sticky Header and DC Summary Details Section */}
          <div className="sticky top-16 z-20 bg-white border-b shadow-sm rounded-t-xl print:static print:border-none print:shadow-none">
            <CardHeader className="border-b py-3 px-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <CardTitle className="text-lg font-semibold">
                    Dc Receipt
                  </CardTitle>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-gray-600">Total No of Boxes:</span>
                      <span className="font-semibold text-gray-900">{sortedBoxes.length}</span>
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-gray-600">Selected:</span>
                      <span className="font-bold text-blue-600">{checkedBoxes.size}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 print-hidden-custom flex-wrap">
                  {sortedBoxes.length > 0 && (
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none border rounded-md px-2.5 py-1.5 hover:bg-gray-50 transition-colors bg-white">
                      <input
                        type="checkbox"
                        ref={(el) => {
                          if (el) {
                            el.indeterminate =
                              checkedBoxes.size > 0 &&
                              checkedBoxes.size < sortedBoxes.length;
                          }
                        }}
                        checked={isAllChecked}
                        onChange={handleSelectAll}
                        className="w-4 h-4 cursor-pointer accent-primary"
                      />
                      <span>Select All</span>
                    </label>
                  )}

                  {!isOrderReceived && checkedBoxes.size > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReceiveSelectedClick}
                      disabled={updateSelectedBoxesStatusMutation.isPending}
                    >
                      <div className="flex items-center gap-2 cursor-pointer">
                        Received ({checkedBoxes.size})
                      </div>
                    </Button>
                  )}

                  {/* Excel Download Button */}
                  {checkedBoxes.size > 0 && (
                    <Button variant="outline" size="sm" onClick={downloadExcel}>
                      <div className="flex items-center gap-2 cursor-pointer">
                        <Download className="h-4 w-4" />
                        Excel ({checkedBoxes.size})
                      </div>
                    </Button>
                  )}

                  {/* Print Button - visible only when at least one box is checked */}
                  {checkedBoxes.size > 0 && (
                    <ReactToPrint
                      trigger={() => (
                        <Button variant="outline" size="sm" asChild>
                          <div className="flex items-center gap-2 cursor-pointer">
                            <Printer className="h-4 w-4" />
                            Print ({checkedBoxes.size})
                          </div>
                        </Button>
                      )}
                      content={() => componentRef.current}
                    />
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Header Table - hidden when printing since each box will print its own header */}
            <div className="p-4 bg-white print-hidden-custom">
              <table className="w-full border-collapse text-sm">
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
                        "DD-MM-YYYY",
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
                        "DD-MM-YYYY",
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
            </div>
          </div>

          <CardContent className="p-4">
            <div ref={componentRef} className="bg-white rounded-lg print:p-4">
              <style>{`
                @media print {
                  .print-hidden-custom {
                    display: none !important;
                  }
                  .print-visible-table-custom {
                    display: table !important;
                  }
                  .print-box-container {
                    display: block !important;
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                  }
                  .print-page-break {
                    break-after: page !important;
                    page-break-after: always !important;
                  }
                }
                @media screen {
                  .print-visible-table-custom {
                    display: none !important;
                  }
                }
              `}</style>

              {/* Table grouped by box – all boxes visible on screen, only checked printed */}
              <div className="space-y-6">
                {sortedBoxes.map((box) => {
                  const isChecked = checkedBoxes.has(box);
                  const isExpanded = expandedBoxes.has(box);
                  const rows = groupedRows[box] || [];
                  const boxData = groupedBoxesForDialog[box] || {
                    barcodes: [],
                    totalPcs: 0,
                  };
                  const totalAmount = rows.reduce(
                    (sum, row) =>
                      sum + (parseFloat(row.amount) || 0) * (row.quantity || 1),
                    0,
                  );
                  const checkedBoxesArray = sortedBoxes.filter((b) =>
                    checkedBoxes.has(b),
                  );
                  const isLastChecked =
                    checkedBoxesArray[checkedBoxesArray.length - 1] === box;

                  const isBoxReceived = isBoxReceivedCheck(box);

                  return (
                    <React.Fragment key={`box-frag-${box}`}>
                      <div
                        className={`border border-black p-3 ${
                          isChecked
                            ? "print-box-container"
                            : "print-hidden-custom"
                        }`}
                      >
                        {/* Header Table for print only - shows before every box */}
                        <table className="w-full mb-4 border-collapse text-sm print-visible-table-custom">
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
                                  "DD-MM-YYYY",
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
                                  "DD-MM-YYYY",
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
                              <td className="p-1 w-[8rem]">
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

                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            {/* Checkbox – hidden when printing */}
                            <div className="print-hidden-custom">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleBox(box)}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </div>
                            <h3 className="text-lg font-semibold">
                              Box (Total Pcs: {boxData.totalPcs})
                            </h3>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Check / Manage Barcodes Button */}
                            <div className="print-hidden-custom">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openBarcodeDialog(box, boxData)}
                                className="h-8 text-xs font-medium cursor-pointer flex items-center gap-1.5 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                              >
                                <Barcode className="h-3.5 w-3.5" />
                                Check / Manage Barcodes
                              </Button>
                            </div>

                            {/* Show / Hide Button */}
                            <div className="print-hidden-custom">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleBoxExpand(box)}
                                className="h-8 text-xs font-medium cursor-pointer"
                              >
                                {isExpanded ? (
                                  <div className="flex items-center gap-1.5">
                                    <ChevronUp className="h-3.5 w-3.5" />
                                    Hide
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <ChevronDown className="h-3.5 w-3.5" />
                                    Show
                                  </div>
                                )}
                              </Button>
                            </div>

                            <div className="print-hidden-custom">
                              {isBoxReceived && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Received
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-sm">{box}</span>
                          </div>
                        </div>

                        {/* Table is shown when expanded on screen, and always rendered when printing */}
                        <div className={isExpanded ? "block" : "hidden print:block"}>
                          <table className="w-full border-collapse border border-black text-sm">
                            <thead>
                              <tr className="bg-[#E5D7C3] text-[#543D2B]">
                                <th className="border border-black p-1 text-left font-bold uppercase text-xs">
                                  Barcode
                                </th>
                                <th className="border border-black p-1 text-left font-bold uppercase text-xs">
                                  Size
                                </th>
                                <th className="border border-black p-1 text-left font-bold uppercase text-xs">
                                  Amount (₹)
                                </th>
                                <th className="border border-black p-1 text-right font-bold uppercase text-xs">
                                  Quantity
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row, idx) => (
                                <tr key={idx}>
                                  <td className="border border-black p-1">
                                    {row.barcode}
                                  </td>
                                  <td className="border border-black p-1">
                                    {row.size}
                                  </td>
                                  <td className="border border-black p-1">
                                    {row.amount}
                                  </td>
                                  <td className="border border-black p-1 text-right">
                                    {row.quantity}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2-Step Barcode Scanner & Comparison Modal */}
      <BoxBarcodeScannerModal
        open={barcodeDialogOpen}
        onOpenChange={setBarcodeDialogOpen}
        boxNumber={selectedBox?.boxNumber}
        formattedBoxTitle={selectedBox ? formatBoxNumber(selectedBox.boxNumber) : ""}
        expectedItems={selectedBox ? (groupedRows[selectedBox.boxNumber] || []) : []}
        initialBarcodes={selectedBox?.currentBarcodes || []}
        originalBarcodes={selectedBox?.originalBarcodes || []}
        onSave={handleSaveBoxBarcodes}
        isSaving={updateOrderReceivedMutation.isPending}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Close DC Receipt Order?"
        description="Are you sure you want to close this DC Receipt and mark all materials as received?"
        variant="warning"
        confirmText="Yes, Close Order"
        cancelText="No"
        onConfirm={confirmCloseWorkOrder}
        isLoading={updateMutation.isPending}
      />

      <ConfirmDialog
        open={receiveConfirmOpen}
        onOpenChange={setReceiveConfirmOpen}
        title={`Mark Box ${selectedBoxToReceive} as Received?`}
        description={`Are you sure you want to mark Box ${selectedBoxToReceive} as received?`}
        variant="success"
        confirmText="Yes, Mark Received"
        cancelText="Cancel"
        onConfirm={confirmReceiveBox}
        isLoading={updateBoxStatusMutation.isPending}
      />

      <ConfirmDialog
        open={receiveSelectedConfirmOpen}
        onOpenChange={setReceiveSelectedConfirmOpen}
        title={`Mark ${selectedBoxesToReceiveList.length} Selected Box(es) as Received?`}
        description={`Are you sure you want to mark Box ${selectedBoxesToReceiveList.join(", ")} as received?`}
        variant="success"
        confirmText="Yes, Mark Received"
        cancelText="Cancel"
        onConfirm={confirmReceiveSelectedBoxes}
        isLoading={updateSelectedBoxesStatusMutation.isPending}
      />
    </Page>
  );
};

export default DcReceiptReceived;
