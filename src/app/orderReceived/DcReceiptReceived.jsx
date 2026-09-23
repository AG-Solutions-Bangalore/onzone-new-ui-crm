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
  CheckCircle2,
  CheckCheck,
  XCircle,
  ChevronDown,
  ChevronUp,
  Barcode,
  AlertTriangle,
  Building2,
  Tag,
  Calendar,
  Hash,
  Package,
  Boxes,
  FileText,
  Layers,
  User,
  RotateCcw,
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
  const [notReceiveConfirmOpen, setNotReceiveConfirmOpen] = useState(false);
  const [selectedBoxToNotReceive, setSelectedBoxToNotReceive] = useState(null);
  const [notReceiveSelectedConfirmOpen, setNotReceiveSelectedConfirmOpen] = useState(false);
  const [closeOrderConfirmOpen, setCloseOrderConfirmOpen] = useState(false);
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
    wsData.push(["PACKING RECEIPT"]);
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
    XLSX.utils.book_append_sheet(wb, ws, "Packing Receipt");

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
      const workOrderRcRef =
        workOrder?.work_order_rc_ref || workOrder?.work_order_rc_id || id;
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
        description: data?.message || data?.msg || "Box marked as received successfully",
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
      const workOrderRcRef =
        workOrder?.work_order_rc_ref || workOrder?.work_order_rc_id || id;

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
      setCheckedBoxes(new Set());
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

  const isAllBoxesReceived = useMemo(() => {
    return (
      sortedBoxes.length > 0 &&
      sortedBoxes.every((box) => isBoxReceivedCheck(box))
    );
  }, [sortedBoxes, workOrderSub]);

  const closeAllOrderReceivedMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${BASE_URL}/api/update-work-orders-all-received-status/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      setCloseOrderConfirmOpen(false);
      toast({
        title: "Success",
        description:
          data?.message ||
          data?.msg ||
          "Order closed and marked as received successfully",
      });
      navigate("/factory-outlet/received");
    },
    onError: (error) => {
      setCloseOrderConfirmOpen(false);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "Error closing order received",
      });
    },
  });

  const updateBoxNotReceivedStatusMutation = useMutation({
    mutationFn: async (boxNumber) => {
      const token = localStorage.getItem("token");
      const workOrderRcRef = workOrder?.work_order_rc_ref || id;
      const payload = {
        box: boxNumber,
        work_order_rc_ref: workOrderRcRef,
      };

      const response = await axios.put(
        `${BASE_URL}/api/update-work-orders-notreceived-status-box`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      setNotReceiveConfirmOpen(false);
      setSelectedBoxToNotReceive(null);
      toast({
        title: "Success",
        description: data?.message || data?.msg || "Box received status undone successfully",
      });
      refetch();
    },
    onError: (error) => {
      setNotReceiveConfirmOpen(false);
      setSelectedBoxToNotReceive(null);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Error undoing box received status",
      });
    },
  });

  const handleNotReceiveBoxClick = (boxNumber) => {
    setSelectedBoxToNotReceive(boxNumber);
    setNotReceiveConfirmOpen(true);
  };

  const confirmNotReceiveBox = () => {
    if (selectedBoxToNotReceive) {
      updateBoxNotReceivedStatusMutation.mutate(selectedBoxToNotReceive);
    }
  };

  const updateSelectedBoxesNotReceivedStatusMutation = useMutation({
    mutationFn: async (boxesToUpdate) => {
      const token = localStorage.getItem("token");
      const workOrderRcRef = workOrder?.work_order_rc_ref || id;

      const promises = boxesToUpdate.map((boxNumber) => {
        const payload = {
          box: boxNumber,
          work_order_rc_ref: workOrderRcRef,
        };
        return axios.put(
          `${BASE_URL}/api/update-work-orders-notreceived-status-box`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      });

      return await Promise.all(promises);
    },
    onSuccess: () => {
      setNotReceiveSelectedConfirmOpen(false);
      setCheckedBoxes(new Set());
      toast({
        title: "Success",
        description: "Selected box(es) marked as not received (undone) successfully",
      });
      refetch();
    },
    onError: (error) => {
      setNotReceiveSelectedConfirmOpen(false);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "Error undoing selected boxes status",
      });
    },
  });

  const selectedBoxesToNotReceiveList = useMemo(() => {
    return Array.from(checkedBoxes)
      .filter((box) => isBoxReceivedCheck(box))
      .sort((a, b) => Number(a) - Number(b));
  }, [checkedBoxes, workOrderSub]);

  const handleNotReceiveSelectedClick = () => {
    if (checkedBoxes.size === 0) {
      toast({
        title: "Info",
        description: "Please select at least one box to undo received status.",
        variant: "default",
      });
      return;
    }
    if (selectedBoxesToNotReceiveList.length === 0) {
      toast({
        title: "Info",
        description: "None of the selected boxes are marked as received.",
        variant: "default",
      });
      return;
    }
    setNotReceiveSelectedConfirmOpen(true);
  };

  const confirmNotReceiveSelectedBoxes = () => {
    if (selectedBoxesToNotReceiveList.length > 0) {
      updateSelectedBoxesNotReceivedStatusMutation.mutate(
        selectedBoxesToNotReceiveList,
      );
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
        <Card className="shadow-lg border border-stone-200/80 rounded-2xl overflow-hidden bg-white">
          {/* Header and Packing Summary Details Section */}
          <div className="bg-white border-b border-stone-200/80 print:border-none">
            <CardHeader className="border-b py-3 px-4 bg-[#FDFBF7]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <CardTitle className="text-lg font-semibold">
                    Packing Receipt
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

                  {selectedBoxesToReceiveList.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReceiveSelectedClick}
                      disabled={updateSelectedBoxesStatusMutation.isPending}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold"
                    >
                      <div className="flex items-center gap-1.5 cursor-pointer">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Received ({selectedBoxesToReceiveList.length})
                      </div>
                    </Button>
                  )}

                  {selectedBoxesToNotReceiveList.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNotReceiveSelectedClick}
                      disabled={updateSelectedBoxesNotReceivedStatusMutation.isPending}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 font-semibold"
                    >
                      <div className="flex items-center gap-1.5 cursor-pointer">
                        <RotateCcw className="h-3.5 w-3.5 text-amber-700" />
                        Undo Received ({selectedBoxesToNotReceiveList.length})
                      </div>
                    </Button>
                  )}

                  {/* Close the Order Button - visible ONLY when all boxes are marked as received and order is not yet closed */}
                  {!isOrderReceived && isAllBoxesReceived && (
                    <Button
                      size="sm"
                      onClick={() => setCloseOrderConfirmOpen(true)}
                      disabled={closeAllOrderReceivedMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                    >
                      <div className="flex items-center gap-1.5 cursor-pointer">
                        <CheckCheck className="h-4 w-4" />
                        Close the Order
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

            {/* Header Table */}
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
                      Packing No
                    </td>
                    <td className="p-1 w-[8rem]">
                      : {workOrder.work_order_rc_dc_no}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right border-r">
                      Packing Date
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

          <CardContent className="p-3 sm:p-4 bg-stone-50/40">
            <div ref={componentRef} className="rounded-xl print:p-4 print:bg-white">
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
              <div className="space-y-2.5">
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

                  const isBoxReceived = isBoxReceivedCheck(box);

                  return (
                    <React.Fragment key={`box-frag-${box}`}>
                      {/* Box Container: Screen card style vs Print format */}
                      <div
                        className={`rounded-xl border transition-all duration-200 overflow-hidden ${isChecked
                            ? "print-box-container border-[#A27B5C] bg-[#FDFBF7]/50 shadow-xs ring-1 ring-[#A27B5C]/20"
                            : "print-hidden-custom border-stone-200/90 bg-white hover:border-stone-300 shadow-2xs"
                          }`}
                      >
                        {/* Header Table for print only - shows before every box in print */}
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
                                Packing No
                              </td>
                              <td className="p-1 w-[8rem]">
                                : {workOrder.work_order_rc_dc_no}
                              </td>
                              <td className="font-semibold p-1 w-[6rem] text-right border-r">
                                Packing Date
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

                        {/* Box Header Bar (Screen View) */}
                        <div className="py-2 px-3 sm:px-4 bg-white border-b border-stone-100 flex items-center justify-between flex-wrap gap-2.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Checkbox – hidden when printing */}
                            <div className="print-hidden-custom flex items-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleBox(box)}
                                className="w-4 h-4 cursor-pointer accent-[#543D2B] rounded"
                              />
                            </div>

                            <span className="bg-[#E5D7C3] text-[#543D2B] font-bold text-xs px-2.5 py-0.5 rounded-md border border-[#D8C7B0]/80 shadow-2xs flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              Box #{box}
                            </span>

                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-800 text-xs font-semibold border border-stone-200">
                              Total Pcs: <strong className="text-stone-900 font-bold">{boxData.totalPcs}</strong>
                            </span>

                            <div className="print-hidden-custom flex items-center gap-1.5">
                              {isBoxReceived && (
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Received
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleNotReceiveBoxClick(box)}
                                    disabled={updateBoxNotReceivedStatusMutation.isPending}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors cursor-pointer"
                                    title="Undo received status for this box"
                                  >
                                    <RotateCcw className="h-3 w-3 text-amber-700" />
                                    Undo
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 print-hidden-custom flex-wrap">
                            {/* Check / Manage Barcodes Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openBarcodeDialog(box, boxData)}
                              className="h-7 text-xs font-semibold bg-white hover:bg-stone-50 border-stone-200 text-stone-700 rounded-lg px-2.5 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                            >
                              <Barcode className="h-3.5 w-3.5 text-[#543D2B]" />
                              Check / Manage Barcodes
                            </Button>

                            {/* Show / Hide Details Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleBoxExpand(box)}
                              className="h-7 text-xs font-semibold bg-white hover:bg-stone-50 border-stone-200 text-stone-700 rounded-lg px-2.5 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5 text-stone-500" />
                                  Hide Details
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
                                  Show Details
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Table is shown when expanded on screen, and always rendered when printing */}
                        <div className={`${isExpanded ? "block" : "hidden print:block"} p-2.5 sm:p-3 bg-white/70 border-t border-stone-100`}>
                          <div className="overflow-hidden rounded-lg border border-stone-200/80 print:rounded-none print:border-black">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="bg-[#E5D7C3] text-[#543D2B] print:bg-[#E5D7C3]">
                                  <th className="border-b border-stone-200 print:border p-2 print:p-1 text-left font-bold text-xs uppercase tracking-wider">
                                    Barcode
                                  </th>
                                  <th className="border-b border-stone-200 print:border p-2 print:p-1 text-center font-bold text-xs uppercase tracking-wider">
                                    Size
                                  </th>
                                  <th className="border-b border-stone-200 print:border p-2 print:p-1 text-center font-bold text-xs uppercase tracking-wider">
                                    Amount (₹)
                                  </th>
                                  <th className="border-b border-stone-200 print:border p-2 print:p-1 text-right font-bold text-xs uppercase tracking-wider">
                                    Quantity
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-stone-100">
                                {rows.length > 0 ? (
                                  rows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                                      <td className="border-stone-200 print:border p-2 print:p-1 font-mono font-semibold text-stone-800 text-xs">
                                        {row.barcode}
                                      </td>
                                      <td className="border-stone-200 print:border p-2 print:p-1 text-center text-stone-700 text-xs">
                                        {row.size}
                                      </td>
                                      <td className="border-stone-200 print:border p-2 print:p-1 text-center font-mono text-stone-800 text-xs">
                                        {row.amount}
                                      </td>
                                      <td className="border-stone-200 print:border p-2 print:p-1 text-right font-bold text-stone-900 text-xs">
                                        {row.quantity}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="p-3 text-center text-stone-500 text-xs">
                                      No item barcodes registered for this box yet.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                              {rows.length > 0 && (
                                <tfoot>
                                  <tr className="bg-stone-50/80 font-bold text-xs text-stone-900 border-t border-stone-200">
                                    <td colSpan={2} className="p-2 print:p-1 text-stone-600 font-semibold">
                                      Subtotal for Box #{box}
                                    </td>
                                    <td className="p-2 print:p-1 text-center font-mono font-bold text-[#543D2B]">
                                      ₹{totalAmount.toLocaleString()}
                                    </td>
                                    <td className="p-2 print:p-1 text-right font-bold text-[#543D2B]">
                                      {boxData.totalPcs} Pcs
                                    </td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
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
        title="Close Packing Receipt Order?"
        description="Are you sure you want to close this Packing Receipt and mark all materials as received?"
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

      <ConfirmDialog
        open={notReceiveConfirmOpen}
        onOpenChange={setNotReceiveConfirmOpen}
        title={`Undo Received Status for Box ${selectedBoxToNotReceive}?`}
        description={`Are you sure you want to undo received status and mark Box ${selectedBoxToNotReceive} as not received?`}
        variant="warning"
        confirmText="Yes, Undo Received"
        cancelText="Cancel"
        onConfirm={confirmNotReceiveBox}
        isLoading={updateBoxNotReceivedStatusMutation.isPending}
      />

      <ConfirmDialog
        open={notReceiveSelectedConfirmOpen}
        onOpenChange={setNotReceiveSelectedConfirmOpen}
        title={`Undo Received Status for ${selectedBoxesToNotReceiveList.length} Selected Box(es)?`}
        description={`Are you sure you want to undo received status and mark Box ${selectedBoxesToNotReceiveList.join(", ")} as not received?`}
        variant="warning"
        confirmText="Yes, Undo Received"
        cancelText="Cancel"
        onConfirm={confirmNotReceiveSelectedBoxes}
        isLoading={updateSelectedBoxesNotReceivedStatusMutation.isPending}
      />

      <ConfirmDialog
        open={closeOrderConfirmOpen}
        onOpenChange={setCloseOrderConfirmOpen}
        title="Close Order Confirmation"
        description="Do you really want to close the order?"
        variant="success"
        confirmText="Yes"
        cancelText="No"
        onConfirm={() => closeAllOrderReceivedMutation.mutate()}
        isLoading={closeAllOrderReceivedMutation.isPending}
      />
    </Page>
  );
};

export default DcReceiptReceived;
