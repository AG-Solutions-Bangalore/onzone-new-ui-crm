import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Eye,
  Edit,
  Trash2,
  SquarePlus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import BASE_URL from "@/config/BaseUrl";
import Page from "@/app/dashboard/page";
import moment from "moment";
import { useToast } from "@/hooks/use-toast";
import {
  LoaderComponent,
  ErrorComponent,
} from "@/components/LoaderComponent/LoaderComponent";

const FairOrderFormList = () => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    data: orderList = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["fairOrderFormlist"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fairOrderFormlist`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response?.data?.data || response?.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      return await axios.delete(`${BASE_URL}/api/fairdeleteOrder/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: (response) => {
      refetch();
      setDeleteConfirmOpen(false);
      toast({
        title: "Success",
        description: response?.data?.msg || "Order deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete order",
        variant: "destructive",
      });
    },
  });

  const handleConfirmDelete = () => {
    if (deleteOrderId && !deleteMutation.isPending) {
      deleteMutation.mutate(deleteOrderId);
    }
  };

  const columns = [
    {
      accessorKey: "fair_order_no",
      id: "Order No",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent text-stone-800 font-semibold text-xs uppercase tracking-wider"
        >
          Order No
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-semibold text-stone-900">
          {row.getValue("Order No") || row.original.fair_order_no || row.original.id || "-"}
        </div>
      ),
    },
    {
      accessorKey: "fair_order_date",
      id: "Date",
      header: "Date",
      cell: ({ row }) => {
        const val = row.original.fair_order_date || row.original.created_at;
        return (
          <span className="text-stone-600 whitespace-nowrap font-medium">
            {val ? moment(val).format("DD-MMM-YYYY") : "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "fair_order_delivery_date",
      id: "Delivery Date",
      header: "Delivery Date",
      cell: ({ row }) => {
        const val = row.original.fair_order_delivery_date;
        return (
          <span className="text-stone-600 whitespace-nowrap font-medium">
            {val ? moment(val).format("DD-MMM-YYYY") : "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "fair_order_retailer",
      id: "Retailer",
      header: "Retailer",
      cell: ({ row }) => (
        <div className="font-medium text-stone-800">
          {row.getValue("Retailer") || row.original.fair_order_retailer || row.original.retailer_name || "-"}
        </div>
      ),
    },
    {
      accessorKey: "fair_order_total_qty",
      id: "Total Qty",
      header: "Total Qty",
      cell: ({ row }) => (
        <span className="font-semibold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md text-xs">
          {row.getValue("Total Qty") || row.original.fair_order_total_qty || "0"}
        </span>
      ),
    },
    {
      accessorKey: "fair_order_status",
      id: "Status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("Status") || row.original.fair_order_status || "Active";
        const statusColors = {
          Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
          Pending: "bg-amber-50 text-amber-700 border-amber-200",
          Completed: "bg-blue-50 text-blue-700 border-blue-200",
          Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
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
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const id = row.original.id;
        return (
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                    onClick={() => navigate(`/fair-order-form/view/${id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Order</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-stone-600 hover:text-[#A27B5C] hover:bg-[#A27B5C]/10 rounded-lg"
                    onClick={() => navigate(`/fair-order-form/edit/${id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Order</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    onClick={() => {
                      setDeleteOrderId(id);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Order</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: Array.isArray(orderList) ? orderList : [],
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 7 },
    },
  });

  if (isLoading) {
    return <LoaderComponent name="Fair Order Forms" />;
  }

  if (isError) {
    return (
      <ErrorComponent
        message="Failed to load fair order forms list"
        refetch={refetch}
      />
    );
  }

  return (
    <Page>
      <div className="w-full space-y-3.5 pt-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-[#FDFBF7] border border-stone-200/80 px-5 py-3.5 rounded-2xl shadow-2xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A27B5C]">
              Order Form
            </span>
            <h1 className="font-heading text-lg font-bold text-stone-800 tracking-tight leading-none mt-0.5">
              Order Form Directory
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-64 flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <Input
                placeholder="Search order forms..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
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

            <Button
              onClick={() => navigate("/fair-order-form/create")}
              className="h-9 bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-2xs rounded-xl font-medium px-3 text-xs flex items-center gap-1.5"
            >
              <SquarePlus className="h-4 w-4" />
              Create Order Form
            </Button>
          </div>
        </div>

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
                      className={`text-stone-800 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 ${
                        header.column.id === "Order No"
                          ? "w-28 whitespace-nowrap"
                          : header.column.id === "Date"
                          ? "w-32 whitespace-nowrap"
                          : header.column.id === "Delivery Date"
                          ? "w-36 whitespace-nowrap"
                          : header.column.id === "Total Qty"
                          ? "w-24 whitespace-nowrap"
                          : header.column.id === "Status"
                          ? "w-28 whitespace-nowrap"
                          : header.column.id === "actions"
                          ? "w-28 whitespace-nowrap"
                          : "min-w-[180px]"
                      }`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
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
                        className={`py-3 px-4 text-sm text-stone-700 ${
                          cell.column.id === "Order No"
                            ? "w-28"
                            : cell.column.id === "Date"
                            ? "w-32"
                            : cell.column.id === "Delivery Date"
                            ? "w-36"
                            : cell.column.id === "Total Qty"
                            ? "w-24"
                            : cell.column.id === "Status"
                            ? "w-28"
                            : cell.column.id === "actions"
                            ? "w-28"
                            : "min-w-[180px]"
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
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
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between py-2 text-xs text-stone-500">
          <div>
            Showing&nbsp;
            <span className="font-semibold text-stone-800">
              {table.getRowModel().rows.length}
            </span>
            &nbsp;of&nbsp;
            <span className="font-semibold text-stone-800">
              {table.getFilteredRowModel().rows.length}
            </span>
            &nbsp;entries
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

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#FDFBF7] border border-stone-200/80 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-stone-900 font-bold">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-stone-600 text-xs">
              This action cannot be undone. This will permanently delete the
              fair order form from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs shadow-2xs"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};

export default FairOrderFormList;
