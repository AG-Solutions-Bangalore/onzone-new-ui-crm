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
import { ChevronDown, Loader2, Printer, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const StickerPrinting = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // ─── Track which row is printing / downloading ─────────────────────────────
  const [printingId, setPrintingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

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

  const [activeTab, setActiveTab] = useState("pending");

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
  const currentTable = activeTab === "pending" ? table : closedTable;

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
                <TableCell colSpan={colCount} className="h-28 text-center text-stone-400 text-sm">
                  No sticker records found.
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-[#FDFBF7] border border-stone-200/80 px-5 py-3.5 rounded-2xl shadow-2xs">
          {/* Left: Title */}
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A27B5C]">
              Operations
            </span>
            <h1 className="font-heading text-lg font-bold text-stone-800 tracking-tight leading-none mt-0.5">
              Sticker Printing
            </h1>
          </div>

          {/* Right: Tabs + Search + Columns (ALL IN ONE LINE) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Tabs List */}
            <TabsList className="h-9 bg-[#F5F2EB] p-1 rounded-xl border border-stone-200/80 gap-1">
              <TabsTrigger
                value="pending"
                className="h-7 px-3 text-xs font-semibold rounded-lg data-[state=active]:bg-[#A27B5C] data-[state=active]:text-white text-stone-600 transition-all shadow-none flex items-center gap-1.5"
              >
                <span>Pending</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-stone-200 data-[state=active]:bg-white/25 data-[state=active]:text-white text-stone-700 font-bold">
                  {stickerPending?.length || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="printed"
                className="h-7 px-3 text-xs font-semibold rounded-lg data-[state=active]:bg-[#A27B5C] data-[state=active]:text-white text-stone-600 transition-all shadow-none flex items-center gap-1.5"
              >
                <span>Printed</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-stone-200 data-[state=active]:bg-white/25 data-[state=active]:text-white text-stone-700 font-bold">
                  {stickerPrint?.length || 0}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Centered Search */}
            <div className="relative w-full sm:w-64 flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <Input
                placeholder={
                  activeTab === "pending"
                    ? "Search pending stickers..."
                    : "Search printed stickers..."
                }
                value={
                  activeTab === "pending"
                    ? pendingGlobalFilter || ""
                    : printedGlobalFilter || ""
                }
                onChange={(event) => {
                  if (activeTab === "pending") {
                    setPendingGlobalFilter(event.target.value);
                  } else {
                    setPrintedGlobalFilter(event.target.value);
                  }
                }}
                className="h-9 pl-9 pr-3 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs"
              />
            </div>

            {/* Columns Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs shadow-2xs"
                >
                  Columns <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-stone-500" />
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
      </Tabs>
    </Page>
  );
};

export default StickerPrinting;
