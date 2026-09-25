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

import { ButtonConfig } from "@/config/ButtonConfig";

import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import { useToast } from "@/hooks/use-toast";
import Page from "@/app/dashboard/page";
import AddWidth from "./AddWidth";
import EditWidth from "./EditWidth";


const WidthList = () => {
   const { toast } = useToast();
      const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
      const [deleteWorkOrderId, setDeleteWorkOrderId] = useState(null);
    
      const {
        data: width,
        isLoading,
        isError,
        refetch,
      } = useQuery({
        queryKey: ["width"],
        queryFn: async () => {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${BASE_URL}/api/fetch-width-list`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          return response.data.width;
        },
      });
    
      const deleteMutation = useMutation({
        mutationFn: async (id) => {
          const token = localStorage.getItem("token");
          return await axios.delete(`${BASE_URL}/api/delete-width/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
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
        }
      });
      const confirmDelete = (e) => {
        e.preventDefault();
      e.stopPropagation();
        if (deleteWorkOrderId && !deleteMutation.isPending) {
          deleteMutation.mutate(deleteWorkOrderId);
         
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
      accessorKey: "width_mea",
      id: "Width",
      header: "Fabric Width",
      cell: ({ row }) => <div className="font-medium text-stone-800">{row.getValue("Width")}</div>,
    },

    {
      accessorKey: "width_status",
      id: "Status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("Status");

        const statusColors = {
          Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
          Inactive: "bg-stone-100 text-stone-600 border-stone-200",
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
        const workOrderId = row.original.id;

        return (
          <div className="flex items-center space-x-1">
            <EditWidth widthId={workOrderId} />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    onClick={() => {
                      setDeleteWorkOrderId(workOrderId);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Width</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  // Create the table instance
  const table = useReactTable({
    data: width || [],
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
    return <LoaderComponent name="Width Data" />;
  }

  // Render error state
  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Width Data"
        refetch={refetch}
      />
    );
  }
  return (
    <Page>
      <div className="w-full space-y-3.5 pt-1">
        {/* Unified Top Header & Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-[#FDFBF7] border border-stone-200/80 px-5 py-3.5 rounded-2xl shadow-2xs">
          <div className="pl-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A27B5C]">Master</span>
            <h1 className="font-heading text-lg font-bold text-stone-800 tracking-tight leading-none mt-0.5">
              Width Directory
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-64 flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <Input
                placeholder="Search width..."
                value={table.getState().globalFilter || ""}
                onChange={(event) => table.setGlobalFilter(event.target.value)}
                className="h-9 pl-9 pr-3 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs shadow-2xs">
                  Columns <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-stone-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#FDFBF7] border border-stone-200/80 rounded-xl shadow-lg">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
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
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            <AddWidth />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-stone-200/80 bg-white shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-stone-200/80 bg-[#F5F2EB]/90 hover:bg-[#F5F2EB]">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="text-stone-800 font-semibold text-xs uppercase tracking-wider py-3.5 px-4"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
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
                      <TableCell key={cell.id} className="py-3 px-4 text-sm text-stone-700">
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
                    className="h-32 text-center text-stone-400 font-medium"
                  >
                    No widths found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Row selection and pagination button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
          <div className="text-xs md:text-sm text-stone-500 font-medium">
            Total Widths: <span className="font-semibold text-stone-800">{table.getFilteredRowModel().rows.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl"
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
                width.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className={`${ButtonConfig.backgroundColor}  ${ButtonConfig.textColor} text-black hover:bg-red-600`}
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
  )
}

export default WidthList