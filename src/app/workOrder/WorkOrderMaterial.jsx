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
import { ChevronDown, Search, Trash, X } from "lucide-react";
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
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ButtonConfig } from "@/config/ButtonConfig";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import { useToast } from "@/hooks/use-toast";

const WorkOrderMaterial = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWorkOrderId, setDeleteWorkOrderId] = useState(null);
  const [closeBarcode, setCloseBarcode] = useState(null);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const location = useLocation();
  const { materialStatus } = location.state || {};

  const {
    data: workorder,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["workorder", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-work-order-details-list-by-id/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.workorder;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (workOrderId) => {
      const token = localStorage.getItem("token");
      return await axios.put(
        `${BASE_URL}/api/update-work-order-finish-by-id/${workOrderId}`,
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
      navigate("/work-order");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error closing work order",
      });
    },
  });

  const updateReceivedStatusMutation = useMutation({
    mutationFn: async (barcode) => {
      const token = localStorage.getItem("token");
      return await axios.put(
        `${BASE_URL}/api/update-work-orders-received-status/${barcode}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    onSuccess: (response) => {
      refetch();
      setIsCloseDialogOpen(false);
      toast({
        title: "Success",
        description: `${response?.data?.msg}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error updating received status",
      });
    },
  });

  const confirmCloseWorkOrder = () => {
    if (deleteWorkOrderId) {
      updateMutation.mutate(deleteWorkOrderId);
      setDeleteWorkOrderId(null);
    }
  };

  const confirmCloseBarcode = () => {
    if (closeBarcode) {
      updateReceivedStatusMutation.mutate(closeBarcode);
      setCloseBarcode(null);
    }
  };

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  const columns = [
    {
      accessorKey: "finished_stock_tcode",
      id: "Barcode",
      header: "Barcode",
      cell: ({ row }) => <div>{row.getValue("Barcode")}</div>,
    },
    {
      accessorKey: "finished_stock_barcode",
      id: "Article",
      header: "Article",
      cell: ({ row }) => <div>{row.getValue("Article")}</div>,
    },
    {
      accessorKey: "finished_stock_total",
      id: "Ordered",
      header: "Ordered",
      cell: ({ row }) => <div>{row.getValue("Ordered")}</div>,
    },
    {
      accessorKey: "total_receive",
      id: "Received",
      header: "Received",
      cell: ({ row }) => <div>{row.getValue("Received")}</div>,
    },
    {
      accessorKey: "finished_stock_total",
      id: "Balance",
      header: "Balance",
      cell: ({ row }) => <div>{row.getValue("Balance")}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const totalBalance = row.original.finished_stock_total;
        return totalBalance === 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCloseBarcode(row.original.finished_stock_barcode);
              setIsCloseDialogOpen(true);
            }}
          >
            Close
          </Button>
        ) : null;
      },
    }
    
  ];

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

  if (isLoading) {
    return <LoaderComponent name="Work Order Material List" />;
  }

  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Work Order Material List"
        refetch={refetch}
      />
    );
  }

  return (
    <Page>
      <div className="w-full p-4">
        <div className="flex text-left text-2xl text-gray-800 font-[400]">
          Work Order
        </div>
        {/* Toolbar: Search, Column Filter, and Bulk Actions */}
        <div className="flex items-center py-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search work order..."
              value={table.getState().globalFilter || ""}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              className="pl-8 bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-gray-200"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
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
          {materialStatus !== "Received" && (
            <Button
              variant="default"
              className={`ml-2 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
              onClick={() => {
                setDeleteWorkOrderId(id);
                setDeleteConfirmOpen(true);
              }}
            >
              <X className="h-4 w-4" /> Close Work Order
            </Button>
          )}
        </div>
        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={`${ButtonConfig.tableHeader} ${ButtonConfig.tableLabel}`}
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Total Work Orders: {table.getFilteredRowModel().rows.length}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      {/* Alert for closing work order */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this work order and mark all
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
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Alert for closing barcode */}
      <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this barcode as received?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsCloseDialogOpen(false)}>
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCloseBarcode}
              className={`${ButtonConfig.backgroundColor} ${ButtonConfig.textColor} text-black hover:bg-red-600`}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};

export default WorkOrderMaterial;
