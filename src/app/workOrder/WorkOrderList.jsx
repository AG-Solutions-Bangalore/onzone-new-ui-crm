import React, { useState } from "react";
import Page from "../dashboard/page";
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
  ArrowUpDown,
  ChevronDown,
  Download,
  Edit,
  Eye,
  Loader2,
  Search,
  SquareChevronRight,
  SquarePlus,
  Trash,
  UserPen,
  View,
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

import BASE_URL from "@/config/BaseUrl";
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
import { useNavigate } from "react-router-dom";
import moment from "moment";

import { ButtonConfig } from "@/config/ButtonConfig";

import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import { useToast } from "@/hooks/use-toast";

const WorkOrderList = () => {
  const { toast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWorkOrderId, setDeleteWorkOrderId] = useState(null);
  const [downloadLoadingId, setDownloadLoadingId] = useState(null);
  const userType = localStorage.getItem("userType");
  const {
    data: workorder = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["workorder"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-work-order-list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response?.data?.workorder || response?.data?.data || (Array.isArray(response?.data) ? response.data : []);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      return await axios.delete(
        `${BASE_URL}/api/delete-half-work-order/${id}`,
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
        description: `${response.data.msg}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `${error.response?.data?.message}`,
        variant: "destructive",
      });
    },
  });
  const confirmDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteWorkOrderId && !deleteMutation.isPending) {
      deleteMutation.mutate(deleteWorkOrderId);
    }
  };

  const updateData = async (e, id) => {
    e.preventDefault();
    setDownloadLoadingId(id);
    let data = {
      workorder_id: id,
    };
    try {
      const res = await axios.post(
        `${BASE_URL}/api/download-work-order-barcode-report-new`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "workorder_barcode.csv");
      document.body.appendChild(link);
      link.click();
      toast({
        title: "Success",
        description: "Excel Download Successfully",
      });
    } catch (error) {
      console.error("Error downloading barcode", error);
      toast({
        title: "Error",
        description: "Error downloading barcode",
      });
    } finally {
      setDownloadLoadingId(null);
    }
  };
  // State for table management
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const navigate = useNavigate();

  // Define columns for the table
  const columns = [
    {
      id: "sl_no",
      header: "Sl. No.",
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination;
        return (
          <span className="font-semibold text-stone-700 text-xs">
            {pageIndex * pageSize + row.index + 1}
          </span>
        );
      },
    },
    {
      accessorKey: "work_order_no",
      id: "Work Order No",
      header: "Work Order No",
      cell: ({ row }) => (
        <span className="font-semibold text-stone-800">
          {row.getValue("Work Order No")}
        </span>
      ),
    },
    {
      accessorKey: "work_order_date",
      id: "Date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("Date");
        return (
          <span className="whitespace-nowrap font-medium text-stone-600">
            {moment(date).format("DD-MMM-YYYY")}
          </span>
        );
      },
    },
    {
      accessorKey: "work_order_factory",
      id: "Factory",
      header: "Factory",
      cell: ({ row }) => (
        <span className="text-stone-700 font-medium">
          {row.getValue("Factory")}
        </span>
      ),
    },

    {
      accessorKey: "work_order_brand",
      id: "Brand",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-stone-700 font-bold hover:bg-[#F5F2EB]"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Brand
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-stone-500" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-stone-700">{row.getValue("Brand")}</span>
      ),
    },
    {
      accessorKey: "work_order_count",
      id: "Total",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold text-stone-800">
          {row.getValue("Total")}
        </span>
      ),
    },
    {
      accessorKey: "total_receive",
      id: "Send",
      header: "Send",
      cell: ({ row }) => (
        <span className="font-semibold text-stone-800">
          {row.getValue("Send")}
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
          Factory: "bg-amber-50 text-amber-800 border-amber-200/80",
          Received: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
        };

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
              statusColors[status] || "bg-stone-100 text-stone-700 border-stone-200"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    ...(userType !== "4"
      ? [
          {
            id: "actions",

            header: "Action",
            cell: ({ row }) => {
              const workOrderId = row.original.id;
              const deleteReceive = row.original.total_receive;
              const materialStatus = row.original.work_order_status;
              return (
                <div className="flex items-center gap-1">
                  {materialStatus !== "Received" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-stone-500 hover:text-stone-800 hover:bg-[#F5F2EB] rounded-lg"
                            onClick={() =>
                              navigate(
                                `/work-order/edit-work-order/${workOrderId}`,
                              )
                            }
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Work Order</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-stone-500 hover:text-stone-800 hover:bg-[#F5F2EB] rounded-lg"
                          onClick={() =>
                            navigate(
                              `/work-order/view-work-order/${workOrderId}`,
                            )
                          }
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Work Order Receipt</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-stone-500 hover:text-stone-800 hover:bg-[#F5F2EB] rounded-lg"
                          onClick={(e) => updateData(e, workOrderId)}
                          disabled={downloadLoadingId === workOrderId}
                        >
                          {downloadLoadingId === workOrderId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download Barcode</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-stone-500 hover:text-stone-800 hover:bg-[#F5F2EB] rounded-lg"
                          onClick={() =>
                            navigate(
                              `/work-order/work-order-material/${workOrderId}`,
                              {
                                state: {
                                  materialStatus,
                                },
                              },
                            )
                          }
                        >
                          <SquareChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Work Order View List</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {deleteReceive === 0 && userType != "4" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            onClick={() => {
                              setDeleteWorkOrderId(workOrderId);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Work Order</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
  ];

  // Create the table instance
  const table = useReactTable({
    data: workorder || [],
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

  // Render loading state
  if (isLoading) {
    return <LoaderComponent name="Work Order" />;
  }

  // Render error state
  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Work Order Data"
        refetch={refetch}
      />
    );
  }
  return (
    <Page>
      <div className="w-full space-y-3.5 pt-1">
        {/* Unified Top Header & Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-[#FDFBF7] border border-stone-200/80 px-5 py-3.5 rounded-2xl shadow-2xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A27B5C]">
              Work Order Management
            </span>
            <h1 className="font-heading text-lg font-bold text-stone-800 tracking-tight leading-none mt-0.5">
              {userType === "4" ? "New Packaging Slip List" : "Work Order List"}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-64 flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <Input
                placeholder="Search work order..."
                value={table.getState().globalFilter || ""}
                onChange={(event) => table.setGlobalFilter(event.target.value)}
                className="h-9 pl-9 pr-3 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs"
              />
            </div>

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

            {userType !== "4" ? (
              <Button
                size="sm"
                onClick={() => navigate("/work-order/create-work-order")}
                className="h-9 bg-[#A27B5C] hover:bg-[#8D6B4F] text-white rounded-xl text-xs font-semibold px-4 shadow-sm transition-all duration-200"
              >
                <SquarePlus className="mr-1.5 h-4 w-4" /> Work Order
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate("/work-order/factory-create-work-order")}
                className="h-9 bg-[#A27B5C] hover:bg-[#8D6B4F] text-white rounded-xl text-xs font-semibold px-4 shadow-sm transition-all duration-200"
              >
                <SquarePlus className="mr-1.5 h-4 w-4" /> New Packaging Slip
              </Button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl border border-stone-200/80 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="bg-[#F5F2EB] border-b border-stone-200/80 hover:bg-[#F5F2EB]"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-stone-700 font-bold text-xs uppercase tracking-wider py-3"
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
                      className="hover:bg-[#FBF9F5] transition-colors border-b border-stone-100"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="py-2.5 px-4 text-xs text-stone-700"
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
                      className="h-28 text-center text-stone-400 text-xs"
                    >
                      No work orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination & Summary */}
        <div className="flex items-center justify-between px-2 pt-1 pb-4">
          <div className="text-xs text-stone-500 font-medium">
            Total Work Orders : &nbsp;
            <span className="font-semibold text-stone-700">
              {table.getFilteredRowModel().rows.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 px-3 border-stone-200 text-stone-600 hover:bg-[#F5F2EB] disabled:opacity-40 text-xs rounded-lg shadow-2xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 px-3 border-stone-200 text-stone-600 hover:bg-[#F5F2EB] disabled:opacity-40 text-xs rounded-lg shadow-2xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              work order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
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
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};

export default WorkOrderList;
