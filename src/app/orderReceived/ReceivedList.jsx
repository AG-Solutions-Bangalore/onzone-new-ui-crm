import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Loader2,
  ReceiptText,
  Search,
  SquarePlus,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BASE_URL from "@/config/BaseUrl";
import { useNavigate } from "react-router-dom";
import { ButtonConfig } from "@/config/ButtonConfig";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import Page from "@/app/dashboard/page";
import moment from "moment";

import { useToast } from "@/hooks/use-toast";

const ReceivedList = () => {
  const { toast } = useToast();
  // ----- fetch data -----
  const {
    data: workorderrc,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["workorderrc"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-work-order-received-list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data.workorderrc;
    },
  });

  // ----- table state -----
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [statusFilter, setStatusFilter] = useState("ontheway");
  const navigate = useNavigate();

  const getNormalizedStatus = (status) => {
    const s = (status || "").toLowerCase().trim().replace(/[\s_-]+/g, "");
    if (s === "ontheway") return "ontheway";
    if (s === "received") return "received";
    if (s === "packed" || s === "draft") return "packed";
    return s;
  };

  const onTheWayCount =
    workorderrc?.filter(
      (item) => getNormalizedStatus(item.work_order_rc_status) === "ontheway",
    ).length || 0;

  const packedCount =
    workorderrc?.filter(
      (item) => getNormalizedStatus(item.work_order_rc_status) === "packed",
    ).length || 0;

  const receivedCount =
    workorderrc?.filter(
      (item) => getNormalizedStatus(item.work_order_rc_status) === "received",
    ).length || 0;

  const filteredData = React.useMemo(() => {
    if (!workorderrc) return [];
    if (statusFilter === "ontheway") {
      return workorderrc.filter(
        (item) => getNormalizedStatus(item.work_order_rc_status) === "ontheway",
      );
    }
    if (statusFilter === "packed") {
      return workorderrc.filter(
        (item) => getNormalizedStatus(item.work_order_rc_status) === "packed",
      );
    }
    if (statusFilter === "received") {
      return workorderrc.filter(
        (item) => getNormalizedStatus(item.work_order_rc_status) === "received",
      );
    }
    return workorderrc;
  }, [workorderrc, statusFilter]);

  // ----- confirmation dialog state -----
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState(null);

  // ----- mutation for updating status -----
  const [updatingId, setUpdatingId] = useState(null);
  const updateStatusMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      const res1 = await axios.put(
        `${BASE_URL}/api/update-work-order-received-finish-by-id/${id}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      try {
        await axios.put(
          `${BASE_URL}/api/update-work-orders-received-factory-status/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (e) {}
      return res1.data;
    },
    onMutate: (id) => {
      setUpdatingId(id);
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data?.msg || data?.message || "Order marked as received successfully",
      });
      refetch();
    },
    onSettled: () => {
      setUpdatingId(null);
      setConfirmDialogOpen(false);
      setConfirmOrderId(null);
    },
    onError: (error) => {
      console.error("Update status error:", error);
      setConfirmDialogOpen(false);
      setConfirmOrderId(null);
    },
  });

  // ----- handle dialog confirm -----
  const handleConfirm = () => {
    if (confirmOrderId) {
      updateStatusMutation.mutate(confirmOrderId);
    }
  };

  // ----- columns definition -----
  const columns = [
    {
      accessorKey: "work_order_rc_no",
      id: "Work Order Rc No",
      header: "Work Order Rc No",
      cell: ({ row }) => <div>{row.getValue("Work Order Rc No")}</div>,
    },
    {
      accessorKey: "work_order_rc_date",
      id: "Date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("Date");
        return (
          <span className="text-stone-600 whitespace-nowrap font-medium">
            {date ? moment(date).format("DD-MMM-YYYY") : "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "work_order_rc_factory",
      id: "Factory",
      header: "Factory",
      cell: ({ row }) => <div>{row.getValue("Factory")}</div>,
    },
    {
      accessorKey: "work_order_rc_brand",
      id: "Brand",
      header: "Brand",
      cell: ({ row }) => <div>{row.getValue("Brand")}</div>,
    },
    {
      accessorKey: "work_order_rc_status",
      id: "Status",
      header: "Status",
      cell: ({ row }) => {
        const rawStatus = row.getValue("Status") || "";
        const norm = getNormalizedStatus(rawStatus);

        let displayStatus = rawStatus;
        let badgeClass = "bg-stone-100 text-stone-700 border-stone-200";

        if (norm === "ontheway") {
          displayStatus = "On the Way";
          badgeClass = "bg-blue-50 text-blue-700 border-blue-200/80";
        } else if (norm === "packed") {
          displayStatus = "Packed";
          badgeClass = "bg-stone-100 text-stone-700 border-stone-300";
        } else if (norm === "received") {
          displayStatus = "Received";
          badgeClass = "bg-rose-50 text-rose-700 border-rose-200/80";
        }

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
          >
            {displayStatus}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const orderReceivedId = row.original.id;
        const orderReceivedStatus = row.original.work_order_rc_status;
        const userType = localStorage.getItem("userType");

        return (
          <div className="flex flex-row">
            {/* DC Receipt */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      navigate(
                        `/order-received/dc-receipt/${orderReceivedId}`,
                        { state: { orderReceivedStatus } },
                      )
                    }
                  >
                    <ReceiptText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Packing Receipt</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  // ----- table instance -----
  const table = useReactTable({
    data: filteredData || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 7,
      },
    },
  });

  // ----- loading / error -----
  if (isLoading) return <LoaderComponent name="Received Data" />;
  if (isError)
    return (
      <ErrorComponent
        message="Error Fetching Received Data"
        refetch={refetch}
      />
    );

  return (
    <Page>
      <div className="w-full space-y-3.5 pt-1">
        {/* Unified Top Header & Actions Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-[#FDFBF7] border border-stone-200/80 px-5 py-3 rounded-2xl shadow-2xs">
          <div className="shrink-0">
            <h1 className="font-heading text-lg font-bold text-stone-800 tracking-tight leading-none whitespace-nowrap">
              {localStorage.getItem("userType") == 4
                ? "New Packaging Slip List"
                : "Goods Received from Factory"}
            </h1>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 xl:pb-0">
            {/* Status Filter Buttons */}
            <div className="flex items-center bg-[#F5F2EB] p-1 rounded-xl border border-stone-200/80 gap-1 shrink-0">
              <button
                type="button"
                className={`h-7 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === "all"
                    ? "bg-[#A27B5C] text-white shadow-none"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
                }`}
                onClick={() => setStatusFilter("all")}
              >
                All ({workorderrc?.length || 0})
              </button>
              <button
                type="button"
                className={`h-7 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === "ontheway"
                    ? "bg-[#543D2B] text-white shadow-none"
                    : "text-[#543D2B] hover:bg-[#543D2B]/10"
                }`}
                onClick={() =>
                  setStatusFilter(
                    statusFilter === "ontheway" ? "all" : "ontheway",
                  )
                }
              >
                On the Way ({onTheWayCount})
              </button>
              <button
                type="button"
                className={`h-7 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === "packed"
                    ? "bg-stone-700 text-white shadow-none"
                    : "text-stone-700 hover:bg-stone-200"
                }`}
                onClick={() =>
                  setStatusFilter(statusFilter === "packed" ? "all" : "packed")
                }
              >
                Packed ({packedCount})
              </button>
              <button
                type="button"
                className={`h-7 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === "received"
                    ? "bg-rose-600 text-white shadow-none"
                    : "text-rose-700 hover:bg-rose-50"
                }`}
                onClick={() =>
                  setStatusFilter(
                    statusFilter === "received" ? "all" : "received",
                  )
                }
              >
                Received ({receivedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-44 lg:w-52 shrink-0 flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <Input
                placeholder="Search received..."
                value={table.getState().globalFilter || ""}
                onChange={(event) => table.setGlobalFilter(event.target.value)}
                className="h-9 pl-9 pr-3 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs"
              />
            </div>

            {/* Columns Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs shadow-2xs shrink-0 cursor-pointer"
                >
                  Columns <ChevronDown className="ml-1 h-3.5 w-3.5 text-stone-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#FDFBF7] border border-stone-200/80 rounded-xl shadow-lg"
              >
                {table
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

        {/* Table */}
        <div className="rounded-2xl border border-stone-200/80 bg-white shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-stone-200/80 bg-[#F5F2EB]/90 hover:bg-[#F5F2EB]"
                >
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b border-stone-100 hover:bg-stone-50/70 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-3 px-4 text-sm text-stone-700"
                      >
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
                  <TableCell
                    colSpan={columns.length}
                    className="h-28 text-center text-stone-400 text-sm"
                  >
                    No received records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between py-2 text-xs text-stone-500">
          <div>
            Total Received:&nbsp;
            <span className="font-semibold text-stone-800">
              {table.getFilteredRowModel().rows.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs shadow-2xs disabled:opacity-40"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs shadow-2xs disabled:opacity-40"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="bg-[#FDFBF7] border border-stone-200/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-stone-900 font-bold">
              Confirm Completion
            </DialogTitle>
            <DialogDescription className="text-stone-600 text-xs">
              Do you want to mark this order as <strong>Received</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs"
              onClick={() => {
                setConfirmDialogOpen(false);
                setConfirmOrderId(null);
              }}
            >
              No
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={updateStatusMutation.isLoading}
              className="bg-[#A27B5C] hover:bg-[#8C6547] text-white rounded-xl text-xs shadow-2xs"
            >
              {updateStatusMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Yes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
};

export default ReceivedList;
