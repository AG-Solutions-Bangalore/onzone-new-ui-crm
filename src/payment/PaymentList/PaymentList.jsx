import React, { useState } from "react";
import Page from "../../app/dashboard/page";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  expandRows,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  FilePlus2,
  Loader2,
  Search,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { ButtonConfig } from "@/config/ButtonConfig";
import {
  InvoiceCreate,
  InvoiceDelete,
  InvoiceDocument,
  InvoiceEdit,
  InvoiceView,
  PaymentCreate,
} from "@/components/buttonIndex/ButtonComponents";
import { Skeleton } from "@/components/ui/skeleton";
import { encryptId } from "@/utils/encyrption/Encyrption";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
const PaymentList = () => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInoice, setDeleteInoiceid] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [subRowData, setSubRowData] = useState({});
  const { toast } = useToast();
  const {
    data: payment,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["payment"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/panel-fetch-invoice-payment-list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.invoicePayment;
    },
  });

  const fetchSubRowData = async (id) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `${BASE_URL}/api/panel-fetch-invoice-payment-by-id/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  };

  const handleRowExpand = async (rowId) => {
    if (expandedRowId === rowId) {
      // If clicking the same row, collapse it
      setExpandedRowId(null);
    } else {
      // If clicking a different row, collapse the current one and expand the new one
      setExpandedRowId(rowId);
      if (!subRowData[rowId]) {
        try {
          const data = await fetchSubRowData(rowId);
          setSubRowData((prev) => ({ ...prev, [rowId]: data }));
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to fetch payment details",
            variant: "destructive",
          });
        }
      }
    }
  };

  // Calculate total amount for subrow
  const calculateSubRowTotal = (subRowItems) => {
    return subRowItems
      .reduce((total, item) => {
        return (
          total +
          (parseFloat(item.invoicePSub_amt_adv || 0) +
            parseFloat(item.invoicePSub_amt_dp || 0) +
            parseFloat(item.invoicePSub_amt_da || 0))
        );
      }, 0)
      .toFixed(2);
  };
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/api/panel-delete-invoice/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      refetch();
      setDeleteConfirmOpen(false);
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    },
  });
  const confirmDelete = () => {
    if (deleteInoice) {
      deleteMutation.mutate(deleteInoice);
      setDeleteInoiceid(null);
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
      accessorKey: "invoiceP_date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("invoiceP_date");
        return date ? moment(date).format("DD-MMM-YYYY") : "";
      },
    },
    {
      accessorKey: "branch_name",
      header: "Company",
      cell: ({ row }) => <div>{row.getValue("branch_name")}</div>,
    },

    {
      accessorKey: "invoiceP_dollar_rate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Dollor Rate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("invoiceP_dollar_rate")}</div>,
    },

    {
      accessorKey: "invoiceP_v_date",
      header: "V Date",
      cell: ({ row }) => {
        const date = row.getValue("invoiceP_v_date");
        return date ? moment(date).format("DD-MMM-YYYY") : "";
      },
    },
    {
      accessorKey: "invoiceP_usd_amount",
      header: "USD Amount",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.getValue("invoiceP_usd_amount")}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRowExpand(row.original.id)}
            className="p-0 h-6 w-6"
          >
            {expandedRowId === row.original.id ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      ),
    },
    {
      accessorKey: "invoiceP_status",
      header: "Status",
      cell: ({ row }) => <div>{row.getValue("invoiceP_status")}</div>,
    },

    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const invoiceId = row.original.id;

        return (
          <div className="flex flex-row">
            <TooltipProvider></TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InvoiceEdit
                    // onClick={() => navigate(`/payment-edit/${invoiceId}`)}
                    onClick={() => {
                      const encryptedId = encryptId(invoiceId);

                      navigate(
                        `/payment-edit/${encodeURIComponent(encryptedId)}`
                      );
                    }}
                  ></InvoiceEdit>
                </TooltipTrigger>
                <TooltipContent>Edit payment</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  // Create the table instance
  const table = useReactTable({
    data: payment || [],
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

  const SubRowContent = ({ rowId }) => {
    const data = subRowData[rowId];
    if (!data) {
      return (
        <div className="px-4 py-2 bg-gray-50">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      );
    }
    if (!data || !data.paymentSub) return null;

    return (
      <div className="px-4 py-2 bg-gray-50">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Invoice Ref
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                ADV
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">DP</th>
              <th className="border border-gray-300 px-4 py-2 text-left">DA</th>
            </tr>
          </thead>
          <tbody>
            {data.paymentSub.map((sub, index) => (
              <tr key={index} className="bg-white">
                <td className="border border-gray-300 px-4 py-2">
                  {sub.invoicePSub_inv_ref}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {sub.invoicePSub_amt_adv}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {sub.invoicePSub_amt_dp}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {sub.invoicePSub_amt_da}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render loading state
  if (isLoading) {
    return <LoaderComponent name="Payment  Data" />; // ✅ Correct prop usage
  }

  // Render error state
  if (isError) {
    return <ErrorComponent message="Error Payment Data" refetch={refetch} />;
  }

  return (
    <Page>
      <div className="w-full p-4">
        <div className="flex text-left text-2xl text-gray-800 font-[400]">
          Payment List
        </div>
        {/* searching and column filter  */}
        <div className="flex items-center py-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search Payment ..."
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
                .map((column) => {
                  return (
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
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div>
            <PaymentCreate
              className={`ml-2 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
              onClick={() => navigate("/payment-create")}
            ></PaymentCreate>
          </div>
        </div>
        {/* table  */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className={` ${ButtonConfig.tableHeader} ${ButtonConfig.tableLabel}`}
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
                  <React.Fragment key={row.id}>
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
                    {expandedRowId === row.original.id && (
                      <TableRow>
                        <TableCell colSpan={columns.length}>
                          <SubRowContent rowId={row.original.id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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
        {/* row slection and pagintaion button  */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Total Payment : &nbsp;
            {table.getFilteredRowModel().rows.length}
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
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              Payment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={`${ButtonConfig.backgroundColor}  ${ButtonConfig.textColor} hover:bg-red-600`}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};

export default PaymentList;
