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

const FactoryList = () => {
  const { toast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWorkOrderId, setDeleteWorkOrderId] = useState(null);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [selectedFactoryId, setSelectedFactoryId] = useState(null);

  const {
    data: factory,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["factory"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/fetch-factory-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.factory;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      return await axios.delete(`${BASE_URL}/api/delete-factory/${id}`, {
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
    },
  });
  const confirmDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteWorkOrderId && !deleteMutation.isPending) {
      deleteMutation.mutate(deleteWorkOrderId);
    }
  };

  ///creatr user dialog
  const createUserMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");

      return axios.put(
        `${BASE_URL}/api/convert-factory-user/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    },

    onSuccess: (response) => {
      toast({
        title: "Success",
        description: response.data.msg,
      });

      refetch();
      setCreateUserDialogOpen(false);
    },

    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.msg ||
          error.response?.data?.message ||
          "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // State for table management
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  // Hidden by default: Factory No, Address, GSTIN (Admin can toggle via Columns dropdown)
  const [columnVisibility, setColumnVisibility] = useState({
    "Factory No": false,
    Address: false,
    GSTIN: false,
  });
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
      accessorKey: "factory_no",
      id: "Factory No",
      header: "Factory No",
      cell: ({ row }) => <div>{row.getValue("Factory No")}</div>,
    },
    {
      accessorKey: "factory_name",
      id: "Factory",
      header: "Factory",
      cell: ({ row }) => <div>{row.getValue("Factory")}</div>,
    },

    {
      accessorKey: "factory_address",
      id: "Address",
      header: "Address",
      cell: ({ row }) => <div>{row.getValue("Address")}</div>,
    },

    {
      accessorKey: "factory_gstin",
      id: "GSTIN",
      header: "GSTIN",
      cell: ({ row }) => <div>{row.getValue("GSTIN")}</div>,
    },

    {
      accessorKey: "factory_contact_name",
      id: "Contact Name",
      header: "Contact Name",
      cell: ({ row }) => <div>{row.getValue("Contact Name")}</div>,
    },

    {
      accessorKey: "factory_contact_mobile",
      id: "Mobile",
      header: "Mobile",
      cell: ({ row }) => <div>{row.getValue("Mobile")}</div>,
    },
    {
      accessorKey: "factory_user_created",
      id: "User-Created",
      header: "User-Created",
      cell: ({ row }) => <div>{row.getValue("User-Created")}</div>,
    },

    {
      accessorKey: "factory_status",
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
        const userCreated = row.original.factory_user_created;

        return (
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                    onClick={() =>
                      navigate(`/master/factory/edit-factory/${workOrderId}`)
                    }
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Factory</TooltipContent>
              </Tooltip>
            </TooltipProvider>

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
                <TooltipContent>Delete Factory</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {userCreated === "No" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#A27B5C] hover:text-[#8C6547] hover:bg-[#A27B5C]/10 rounded-lg"
                      onClick={() => {
                        setSelectedFactoryId(workOrderId);
                        setCreateUserDialogOpen(true);
                      }}
                    >
                      <UserPen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Create User</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
  ];

  // Create the table instance
  const table = useReactTable({
    data: factory || [],
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
    return <LoaderComponent name="Factory Data" />;
  }

  // Render error state
  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Factory Data"
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
              Factory Directory
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-64 flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <Input
                placeholder="Search factory..."
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

            <Button
              variant="default"
              className="h-9 bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-2xs rounded-xl font-medium px-3 text-xs flex items-center gap-1.5"
              onClick={() => navigate("/master/factory/add-factory")}
            >
              <SquarePlus className="h-4 w-4" /> Add Factory
            </Button>
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
                              header.getContext(),
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
                    className="h-32 text-center text-stone-400 font-medium"
                  >
                    No factories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Row selection and pagination button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
          <div className="text-xs md:text-sm text-stone-500 font-medium">
            Total Factories: <span className="font-semibold text-stone-800">{table.getFilteredRowModel().rows.length}</span>
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
              factory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={createUserDialogOpen}
        onOpenChange={setCreateUserDialogOpen}
      >
        <AlertDialogContent className="bg-white border-stone-200 rounded-2xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl font-bold text-stone-800">Create User?</AlertDialogTitle>
            <AlertDialogDescription className="text-stone-500">
              Do you want to create a portal user account for this factory?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl">No</AlertDialogCancel>

            <AlertDialogAction
              onClick={() => createUserMutation.mutate(selectedFactoryId)}
              disabled={createUserMutation.isPending}
              className="bg-[#A27B5C] hover:bg-[#8C6547] text-white rounded-xl shadow-xs"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Yes, Create"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};

export default FactoryList;
