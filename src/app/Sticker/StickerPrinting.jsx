import React, { useState } from "react";
import Page from "../dashboard/page";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BASE_URL from "@/config/BaseUrl";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ButtonConfig } from "@/config/ButtonConfig";
import { useToast } from "@/hooks/use-toast";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import moment from "moment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import {
  ChevronDown,
  Loader2,
  Printer,
  Search,
  Plus,
  Trash2,
  Download,
  Barcode as BarcodeIcon,
  Camera,
  X,
  Scan,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import ScannerModel from "@/components/ScannerModel";

const StickerPrinting = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ─── Tab Selection ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("pending");

  // ─── Tab 1: Pending table state ────────────────────────────────────────────
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pendingGlobalFilter, setPendingGlobalFilter] = useState("");

  // ─── Tab 2: Printed table state ────────────────────────────────────────────
  const [printedSorting, setPrintedSorting] = useState([]);
  const [printedColumnFilters, setPrintedColumnFilters] = useState([]);
  const [printedColumnVisibility, setPrintedColumnVisibility] = useState({});
  const [printedGlobalFilter, setPrintedGlobalFilter] = useState("");

  // ─── Tab 3: Re-Printing table state ─────────────────────────────────────────
  const [reprintSorting, setReprintSorting] = useState([]);
  const [reprintColumnFilters, setReprintColumnFilters] = useState([]);
  const [reprintColumnVisibility, setReprintColumnVisibility] = useState({});
  const [reprintGlobalFilter, setReprintGlobalFilter] = useState("");

  // ─── Re-Print Modal & Scanner State ─────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  const [stickerRePrint, setStickerRePrint] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);

  // ─── Delete Dialog State ───────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // ─── Track which row is printing / downloading ─────────────────────────────
  const [printingId, setPrintingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadingReprintId, setDownloadingReprintId] = useState(null);

  // ─── Fetch: Pending stickers ────────────────────────────────────────────────
  const {
    data: stickerPending,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["sticker-pending"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-sticker-printing/pending`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data.data;
    },
  });

  // ─── Fetch: Printed stickers ─────────────────────────────────────────────────
  const {
    data: stickerPrint,
    isLoading: printedLoading,
    isError: printedError,
    refetch: refetchPrinted,
  } = useQuery({
    queryKey: ["sticker-print"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-sticker-printing/Print`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data.data;
    },
  });

  // ─── Fetch: Re-Printing stickers ────────────────────────────────────────────
  const {
    data: stickerReprint,
    isLoading: reprintLoading,
    isError: reprintError,
    refetch: refetchReprint,
  } = useQuery({
    queryKey: ["sticker-re-printing"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-sticker-re-printing-list`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const resData = response.data;
      if (Array.isArray(resData)) return resData;
      if (Array.isArray(resData?.data)) return resData.data;
      if (Array.isArray(resData?.sticker_re_print)) return resData.sticker_re_print;
      if (Array.isArray(resData?.sticker_reprinting)) return resData.sticker_reprinting;
      if (Array.isArray(resData?.sticker_re_printing)) return resData.sticker_re_printing;
      return [];
    },
  });

  // ─── Mutation: Mark sticker as printed + download barcode report ─────────────
  const printMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");

      // 1) Update sticker status to printed
      const updateResponse = await axios.put(
        `${BASE_URL}/api/update-sticker-printing/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // 2) Download barcode report CSV
      const barcodeResponse = await axios.post(
        `${BASE_URL}/api/download-work-order-barcode-report-new`,
        { workorder_id: id },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      // Trigger file download
      const url = window.URL.createObjectURL(new Blob([barcodeResponse.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "workorder_barcode.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return updateResponse.data;
    },
    onMutate: (id) => {
      setPrintingId(id);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description:
          "Sticker marked as printed and barcode downloaded successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["sticker-pending"] });
      queryClient.invalidateQueries({ queryKey: ["sticker-print"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to update sticker status.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setPrintingId(null);
    },
  });

  // ─── Mutation: Create sticker re-printing ──────────────────────────────────
  const createReprintMutation = useMutation({
    mutationFn: async (payload) => {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/create-sticker-re-printing`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description:
          data?.message || data?.msg || "Sticker re-printing created successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["sticker-re-printing"] });
      setIsAddModalOpen(false);
      setScannedBarcodes([]);
      setBarcodeInput("");
      setStickerRePrint("");
      setIsCameraActive(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          error?.response?.data?.msg ||
          "Failed to create sticker re-printing.",
        variant: "destructive",
      });
    },
  });

  // ─── Mutation: Delete sticker re-printing ──────────────────────────────────
  const deleteReprintMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${BASE_URL}/api/delete-sticker-re-printing/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Deleted",
        description:
          data?.message || data?.msg || "Sticker re-printing entry deleted successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["sticker-re-printing"] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          error?.response?.data?.msg ||
          "Failed to delete sticker re-printing entry.",
        variant: "destructive",
      });
    },
  });

  // ─── Barcode handling inside Re-Print Modal ────────────────────────────────
  const handleAddBarcode = (code) => {
    const trimmed = (code || barcodeInput).trim();
    if (!trimmed) return;

    // Support pasted multiple codes separated by commas, spaces, or newlines
    const codes = trimmed
      .split(/[\n,\s]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    let addedCount = 0;
    setScannedBarcodes((prev) => {
      const newItems = [...prev];
      codes.forEach((c) => {
        if (!newItems.includes(c)) {
          newItems.push(c);
          addedCount++;
        }
      });
      return newItems;
    });

    setBarcodeInput("");
    if (addedCount === 0 && codes.length > 0) {
      toast({
        title: "Duplicate Barcode",
        description: "This barcode is already in the queue.",
        variant: "destructive",
      });
    }
  };

  const handleCameraScan = (code) => {
    if (code) {
      handleAddBarcode(code);
    }
  };

  const handleRemoveBarcode = (indexToRemove) => {
    setScannedBarcodes((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitReprint = () => {
    if (scannedBarcodes.length === 0) {
      toast({
        title: "No Barcodes",
        description: "Please scan or enter at least one barcode.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      sticker_re_print: stickerRePrint?.trim() || "",
      sticker_data: scannedBarcodes.map((bc) => ({
        barcode: String(bc).trim(),
      })),
    };

    createReprintMutation.mutate(payload);
  };

  // ─── Download barcode only (for Printed tab) ────────────────────────────────
  const handleDownloadBarcode = async (id) => {
    setDownloadingId(id);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BASE_URL}/api/download-work-order-barcode-report-new`,
        { workorder_id: id },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "workorder_barcode.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "Barcode downloaded successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to download barcode.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // ─── Download barcode report for Re-Print ──────────────────────────────────
  const handleDownloadReprintBarcode = async (id) => {
    setDownloadingReprintId(id);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BASE_URL}/api/download-sticker-re-prinit-barcode-report-new`,
        { sticker_re_print_id: id },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `sticker_reprint_barcode_${id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "Re-print barcode downloaded successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to download re-print barcode.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReprintId(null);
    }
  };

  // ─── Shared base columns (no Action) ────────────────────────────────────────
  const baseColumns = [
    {
      accessorKey: "work_order_no",
      id: "Work Order No",
      header: "Work Order No",
      cell: ({ row }) => <div className="font-medium text-stone-900">{row.getValue("Work Order No")}</div>,
    },
    {
      accessorKey: "work_order_date",
      id: "Date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("Date");
        return <span className="text-stone-600">{moment(date).format("DD-MMM-YYYY")}</span>;
      },
    },
    {
      accessorKey: "work_order_factory",
      id: "Factory",
      header: "Factory",
      cell: ({ row }) => <div className="font-medium text-stone-800">{row.getValue("Factory")}</div>,
    },
    {
      accessorKey: "work_order_brand",
      id: "Brand",
      header: "Brand",
      cell: ({ row }) => <div className="text-stone-700">{row.getValue("Brand")}</div>,
    },
    {
      accessorKey: "work_order_count",
      id: "Total",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md text-xs">
          {row.getValue("Total")}
        </span>
      ),
    },
    {
      accessorKey: "work_order_status",
      id: "Status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("Status");
        const statusColors = {
          Factory: "bg-amber-50 text-amber-700 border-amber-200",
          Received: "bg-rose-50 text-rose-700 border-rose-200",
          Print: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              statusColors[status] || "bg-stone-100 text-stone-600 border-stone-200"
            }`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  // ─── Pending columns: base + Action ─────────────────────────────────────────
  const pendingColumns = [
    ...baseColumns,
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => {
        const id = row.original.id;
        const isCurrentlyPrinting = printingId === id;
        return (
          <Button
            size="sm"
            className="h-8 bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-2xs rounded-lg text-xs font-medium px-3 flex items-center gap-1.5 transition-all"
            onClick={() => printMutation.mutate(id)}
            disabled={isCurrentlyPrinting || printMutation.isPending}
          >
            {isCurrentlyPrinting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Printer className="w-3.5 h-3.5" />
            )}
            {isCurrentlyPrinting ? "Printing..." : "Print"}
          </Button>
        );
      },
    },
  ];

  // ─── Printed columns: base + Download Action ────────────────────────────────
  const printedColumns = [
    ...baseColumns,
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => {
        const id = row.original.id;
        const isCurrentlyDownloading = downloadingId === id;
        return (
          <Button
            size="sm"
            className="h-8 bg-[#F5F2EB] hover:bg-[#EBE5DA] text-stone-800 border border-stone-300/80 shadow-2xs rounded-lg text-xs font-medium px-3 flex items-center gap-1.5 transition-all"
            onClick={() => handleDownloadBarcode(id)}
            disabled={isCurrentlyDownloading}
          >
            {isCurrentlyDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A27B5C]" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-[#A27B5C]" />
            )}
            Reprint
          </Button>
        );
      },
    },
  ];

  // ─── Re-Printing columns (Sl. No, Sticker Re-Print, Actions) ────────────────
  const reprintColumns = [
    {
      id: "sl_no",
      header: "Sl. No",
      cell: ({ row }) => (
        <span className="font-semibold text-stone-600 text-xs px-1">
          {row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "sticker_re_print",
      id: "Sticker Re-Print",
      header: "Sticker Re-Print",
      cell: ({ row }) => {
        const val =
          row.original.sticker_re_print ||
          row.getValue("Sticker Re-Print");
        return (
          <span className="font-semibold text-stone-800 text-xs">
            {val || "—"}
          </span>
        );
      },
    },
    {
      id: "action",
      header: "Actions",
      cell: ({ row }) => {
        const id = row.original.id || row.original.sticker_re_print_id;
        const isDownloading = downloadingReprintId === id;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-2xs rounded-lg text-xs font-medium px-3 flex items-center gap-1.5 transition-all cursor-pointer"
              onClick={() => handleDownloadReprintBarcode(id)}
              disabled={isDownloading}
              title="Download Barcode Report"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloading ? "Downloading..." : "Download"}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 rounded-lg text-xs px-2.5 flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
              onClick={() => {
                setItemToDelete(row.original);
                setDeleteDialogOpen(true);
              }}
              title="Delete Re-Print entry"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </Button>
          </div>
        );
      },
    },
  ];

  // ─── Tab 1 table ─────────────────────────────────────────────────────────────
  const table = useReactTable({
    data: stickerPending || [],
    columns: pendingColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: pendingGlobalFilter,
    },
    initialState: {
      pagination: { pageSize: 7 },
    },
  });

  // ─── Tab 2 table ─────────────────────────────────────────────────────────────
  const closedTable = useReactTable({
    data: stickerPrint || [],
    columns: printedColumns,
    onSortingChange: setPrintedSorting,
    onColumnFiltersChange: setPrintedColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setPrintedColumnVisibility,
    globalFilterFn: "includesString",
    state: {
      sorting: printedSorting,
      columnFilters: printedColumnFilters,
      columnVisibility: printedColumnVisibility,
      rowSelection,
      globalFilter: printedGlobalFilter,
    },
    initialState: {
      pagination: { pageSize: 7 },
    },
  });

  // ─── Tab 3 table ─────────────────────────────────────────────────────────────
  const reprintTable = useReactTable({
    data: stickerReprint || [],
    columns: reprintColumns,
    onSortingChange: setReprintSorting,
    onColumnFiltersChange: setReprintColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setReprintColumnVisibility,
    globalFilterFn: "includesString",
    state: {
      sorting: reprintSorting,
      columnFilters: reprintColumnFilters,
      columnVisibility: reprintColumnVisibility,
      rowSelection,
      globalFilter: reprintGlobalFilter,
    },
    initialState: {
      pagination: { pageSize: 7 },
    },
  });

  if (isLoading) {
    return <LoaderComponent name="Sticker Printing" />;
  }
  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Work Order Data"
        refetch={refetch}
      />
    );
  }

  // Active table reference
  const currentTable =
    activeTab === "pending"
      ? table
      : activeTab === "printed"
      ? closedTable
      : reprintTable;

  // ─── Table body renderer ─────────────────────────────────────────────────────
  const renderTable = (tableInstance, colCount) => (
    <>
      <div className="rounded-2xl border border-stone-200/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            {tableInstance.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-stone-200/80 bg-[#F5F2EB]/90 hover:bg-[#F5F2EB]">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-stone-800 font-semibold text-xs uppercase tracking-wider py-3.5 px-4"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {tableInstance.getRowModel().rows?.length ? (
              tableInstance.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-stone-100 hover:bg-stone-50/70 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4 text-sm text-stone-700">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colCount} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center py-10 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] flex items-center justify-center text-[#A27B5C] mb-3 border border-stone-200/80 shadow-2xs">
                      <BarcodeIcon className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <p className="text-sm font-semibold text-stone-800">
                      {activeTab === "reprinting"
                        ? "No Re-Printing Requests Found"
                        : "No Sticker Records Found"}
                    </p>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm">
                      {activeTab === "reprinting"
                        ? "No barcodes are currently queued for re-printing. Scan or enter barcodes using the button below."
                        : activeTab === "pending"
                        ? "All work orders have been printed. Pending queue is empty."
                        : "No printed sticker records available."}
                    </p>
                    {activeTab === "reprinting" && (
                      <Button
                        size="sm"
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-4 h-8 bg-[#A27B5C] hover:bg-[#8C6547] text-white rounded-xl text-xs font-semibold px-3.5 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Barcodes</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-2 text-xs text-stone-500">
        <div>
          Total Records:&nbsp;
          <span className="font-semibold text-stone-800">
            {tableInstance.getFilteredRowModel().rows.length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => tableInstance.previousPage()}
            disabled={!tableInstance.getCanPreviousPage()}
            className="h-8 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs shadow-2xs disabled:opacity-40"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => tableInstance.nextPage()}
            disabled={!tableInstance.getCanNextPage()}
            className="h-8 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs shadow-2xs disabled:opacity-40"
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <Page>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-3.5 pt-1"
      >
        {/* Unified Single-Line Top Bar */}
        <div className="flex items-center justify-between gap-3 bg-[#FDFBF7] border border-stone-200/80 px-4 py-2.5 rounded-2xl shadow-2xs">
          {/* Left: Title */}
          <div className="shrink-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#A27B5C] block leading-tight">
              Operations
            </span>
            <h1 className="font-heading text-base font-bold text-stone-800 tracking-tight leading-none mt-0.5 whitespace-nowrap">
              Sticker Printing
            </h1>
          </div>

          {/* Right: Tabs + Search + Columns + Add Barcodes (Strictly Single Row) */}
          <div className="flex items-center gap-2 flex-nowrap shrink-0">
            {/* Tabs List */}
            <TabsList className="h-8 bg-[#F5F2EB] p-0.5 rounded-xl border border-stone-200/80 gap-0.5 shrink-0">
              <TabsTrigger
                value="pending"
                className="h-7 px-2.5 text-xs font-semibold rounded-lg data-[state=active]:bg-[#A27B5C] data-[state=active]:text-white text-stone-600 transition-all shadow-none flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Pending</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-stone-200 data-[state=active]:bg-white/25 data-[state=active]:text-white text-stone-700 font-bold">
                  {stickerPending?.length || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="printed"
                className="h-7 px-2.5 text-xs font-semibold rounded-lg data-[state=active]:bg-[#A27B5C] data-[state=active]:text-white text-stone-600 transition-all shadow-none flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Printed</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-stone-200 data-[state=active]:bg-white/25 data-[state=active]:text-white text-stone-700 font-bold">
                  {stickerPrint?.length || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="reprinting"
                className="h-7 px-2.5 text-xs font-semibold rounded-lg data-[state=active]:bg-[#A27B5C] data-[state=active]:text-white text-stone-600 transition-all shadow-none flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Re-Printing</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-stone-200 data-[state=active]:bg-white/25 data-[state=active]:text-white text-stone-700 font-bold">
                  {stickerReprint?.length || 0}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Search Input */}
            <div className="relative w-44 lg:w-56 shrink-0 flex items-center">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
              <Input
                placeholder={
                  activeTab === "pending"
                    ? "Search pending..."
                    : activeTab === "printed"
                    ? "Search printed..."
                    : "Search re-printing..."
                }
                value={
                  activeTab === "pending"
                    ? pendingGlobalFilter || ""
                    : activeTab === "printed"
                    ? printedGlobalFilter || ""
                    : reprintGlobalFilter || ""
                }
                onChange={(event) => {
                  if (activeTab === "pending") {
                    setPendingGlobalFilter(event.target.value);
                  } else if (activeTab === "printed") {
                    setPrintedGlobalFilter(event.target.value);
                  } else {
                    setReprintGlobalFilter(event.target.value);
                  }
                }}
                className="h-8 pl-8 pr-7 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs"
              />
              {(activeTab === "pending"
                ? pendingGlobalFilter
                : activeTab === "printed"
                ? printedGlobalFilter
                : reprintGlobalFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "pending") setPendingGlobalFilter("");
                    else if (activeTab === "printed") setPrintedGlobalFilter("");
                    else setReprintGlobalFilter("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Columns Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs shadow-2xs font-medium px-2.5 shrink-0 cursor-pointer"
                >
                  Columns <ChevronDown className="ml-1 h-3.5 w-3.5 text-stone-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#FDFBF7] border border-stone-200/80 rounded-xl shadow-lg"
              >
                {currentTable
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-stone-700 text-xs focus:bg-[#F5F2EB]"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Barcodes button (only on reprinting tab) */}
            {activeTab === "reprinting" && (
              <Button
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="h-8 bg-[#A27B5C] hover:bg-[#8C6547] text-white rounded-xl text-xs font-semibold px-3 flex items-center gap-1 shadow-2xs transition-all shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            )}
          </div>
        </div>

        {/* ── Tab 1: Pending ── */}
        <TabsContent value="pending" className="m-0 space-y-3.5">
          {renderTable(table, pendingColumns.length)}
        </TabsContent>

        {/* ── Tab 2: Printed ── */}
        <TabsContent value="printed" className="m-0 space-y-3.5">
          {printedLoading ? (
            <LoaderComponent name="Printed Stickers" />
          ) : printedError ? (
            <ErrorComponent
              message="Error Fetching Printed Stickers"
              refetch={refetchPrinted}
            />
          ) : (
            renderTable(closedTable, printedColumns.length)
          )}
        </TabsContent>

        {/* ── Tab 3: Re-Printing ── */}
        <TabsContent value="reprinting" className="m-0 space-y-3.5">
          {reprintLoading ? (
            <LoaderComponent name="Re-Printing Stickers" />
          ) : reprintError ? (
            <ErrorComponent
              message="Error Fetching Re-Printing Stickers"
              refetch={refetchReprint}
            />
          ) : (
            renderTable(reprintTable, reprintColumns.length)
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Add Stickers for Re-Printing Modal ─── */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xl bg-[#FDFBF7] border border-stone-200/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F5F2EB] border border-stone-200 flex items-center justify-center text-[#A27B5C]">
                <BarcodeIcon className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-stone-900">
                  Add Stickers for Re-Printing
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500 mt-0.5">
                  Scan or enter garment barcodes to queue them for sticker re-printing.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Sticker Re-Print field */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                Sticker Re-Print
              </label>
              <Input
                type="text"
                placeholder="Enter sticker re-print value..."
                value={stickerRePrint}
                onChange={(e) => setStickerRePrint(e.target.value)}
                className="h-9 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl"
              />
            </div>

            {/* Barcode input row with camera scanner toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  Scan or Enter Barcode
                </label>
                <button
                  type="button"
                  onClick={() => setIsCameraActive(!isCameraActive)}
                  className="text-xs font-semibold text-[#A27B5C] hover:text-[#8C6547] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {isCameraActive ? "Hide Camera" : "Use Camera Scanner"}
                </button>
              </div>

              {/* Camera Scanner Section */}
              {isCameraActive && (
                <div className="p-3 bg-stone-900/95 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-stone-300 text-xs px-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Scan className="w-3.5 h-3.5 text-[#A27B5C]" />
                      Position barcode in camera viewfinder
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCameraActive(false)}
                      className="text-stone-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="rounded-xl overflow-hidden max-h-[220px] flex justify-center bg-black/60">
                    <ScannerModel barcodeScannerValue={handleCameraScan} />
                  </div>
                </div>
              )}

              {/* Manual Barcode input bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <BarcodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Type or scan barcode and press Enter..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddBarcode();
                      }
                    }}
                    className="h-9 pl-9 pr-3 text-xs bg-white border-stone-200 rounded-xl font-mono"
                    autoFocus
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => handleAddBarcode()}
                  className="h-9 px-4 text-xs font-semibold bg-[#A27B5C] hover:bg-[#8C6547] text-white rounded-xl shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>
              <p className="text-[11px] text-stone-400">
                Tip: You can paste multiple comma-separated or line-separated barcodes at once.
              </p>
            </div>

            {/* Scanned Barcodes Preview List */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-800">
                    Queued Barcodes
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#A27B5C]/15 text-[#543D2B]">
                    {scannedBarcodes.length}
                  </span>
                </div>
                {scannedBarcodes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setScannedBarcodes([])}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {scannedBarcodes.length === 0 ? (
                <div className="border border-dashed border-stone-200 rounded-xl p-6 text-center text-xs text-stone-400 bg-white/60">
                  No barcodes queued yet. Scan with camera or enter barcode above.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl bg-white p-2.5 space-y-1.5">
                  {scannedBarcodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#FDFBF7] border border-stone-200/80 rounded-lg px-3 py-1.5 text-xs text-stone-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-stone-400 w-5">
                          #{idx + 1}
                        </span>
                        <span className="font-mono font-semibold text-stone-900">
                          {code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBarcode(idx)}
                        className="text-stone-400 hover:text-rose-600 transition-colors p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-5 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsCameraActive(false);
              }}
              className="h-9 text-xs border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitReprint}
              disabled={scannedBarcodes.length === 0 || createReprintMutation.isPending}
              className="h-9 text-xs font-semibold bg-[#A27B5C] hover:bg-[#8C6547] text-white rounded-xl px-5 shadow-2xs"
            >
              {createReprintMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                `Re-Print (${scannedBarcodes.length})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#FDFBF7] border border-stone-200/80 rounded-2xl shadow-xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-stone-900">
              Delete Re-Print Entry?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-stone-600">
              Are you sure you want to remove this sticker re-printing entry? This action cannot be undone.
              {itemToDelete && (
                <div className="mt-2.5 p-2.5 bg-stone-100 rounded-lg text-xs text-stone-800">
                  Sticker Re-Print: <strong>{itemToDelete.sticker_re_print || `#${itemToDelete.id}`}</strong>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={deleteReprintMutation.isPending}
              className="h-9 text-xs border-stone-200 text-stone-700 rounded-xl"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete?.id) {
                  deleteReprintMutation.mutate(itemToDelete.id);
                }
              }}
              disabled={deleteReprintMutation.isPending}
              className="h-9 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
            >
              {deleteReprintMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};

export default StickerPrinting;
