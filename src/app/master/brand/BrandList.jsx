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
  Check,
  X,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion } from "framer-motion";
import { ButtonConfig } from "@/config/ButtonConfig";

import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import { useToast } from "@/hooks/use-toast";
import BASE_URL from "@/config/BaseUrl";
import Page from "@/app/dashboard/page";
import AddBrand from "./AddBrand";

const BrandList = () => {
  const { toast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWorkOrderId, setDeleteWorkOrderId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const {
    data: brand = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["brand"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-brand-list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response?.data?.brand || response?.data?.data || (Array.isArray(response?.data) ? response.data : []);
    },
    retry: 2,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      return await axios.delete(`${BASE_URL}/api/delete-brand/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: (response) => {
      refetch();
      setDeleteConfirmOpen(false);
      toast({
        title: "Success",
        description: `${response.data.msg || "Brand deleted successfully"}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `${error.response?.data?.message || "Failed to delete brand"}`,
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
      accessorKey: "fabric_brand_images",
      id: "Images",
      header: "Images",
      cell: ({ row }) => {
        const brandImage = row.original.fabric_brand_images;
        const imageUrl = brandImage
          ? `https://houseofonzone.com/admin/storage/app/public/Brands/${brandImage}`
          : "https://houseofonzone.com/admin/storage/app/public/no_image.jpg";

        return (
          <div
            className="relative group w-10 h-10 rounded-xl overflow-hidden cursor-pointer border border-stone-200/80 shadow-2xs hover:shadow-md transition-all hover:scale-105"
            title="Click to preview full image"
            onClick={() =>
              setPreviewImage({
                url: imageUrl,
                brand: row.original.fabric_brand_brands,
                short: row.original.fabric_brand_short,
                status: row.original.fabric_brand_status,
              })
            }
          >
            <img
              src={imageUrl}
              alt={row.original.fabric_brand_brands || "Brand Img"}
              onError={(e) => {
                e.currentTarget.src =
                  "https://houseofonzone.com/admin/storage/app/public/no_image.jpg";
              }}
              className="w-full h-full object-cover bg-stone-50"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Eye className="w-4 h-4 text-white drop-shadow" />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "fabric_brand_brands",
      id: "Brand",
      header: "Brand",
      cell: ({ row }) => (
        <div className="font-semibold text-stone-800">{row.getValue("Brand")}</div>
      ),
    },
    {
      accessorKey: "fabric_brand_status",
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
        const brandId = row.original.id;

        return (
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                    onClick={() => navigate(`/master/brand/edit-brand/${brandId}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Brand</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                    onClick={() => {
                      setDeleteWorkOrderId(brandId);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Brand</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  // Create the table instance
  const table = useReactTable({
    data: brand || [],
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
    return <LoaderComponent name="Brand Data" />;
  }

  // Render error state
  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Brand Data"
        refetch={refetch}
      />
    );
  }

  return (
    <Page>
      <div className="w-full space-y-3.5 pt-1">
        {/* Unified Top Header & Actions Bar in One Compact Line */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-[#FDFBF7] border border-stone-200/80 px-5 py-3.5 rounded-2xl shadow-2xs">
          <div className="pl-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A27B5C]">Master</span>
            <h1 className="font-heading text-lg font-bold text-stone-800 tracking-tight leading-none mt-0.5">
              Brand Directory
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-full sm:w-64 flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <Input
                placeholder="Search brand..."
                value={table.getState().globalFilter || ""}
                onChange={(event) => table.setGlobalFilter(event.target.value)}
                className="h-9 pl-8 pr-3 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs"
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

            <AddBrand />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-stone-200/80 bg-white shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-stone-200/80 bg-[#F5F2EB] hover:bg-[#F5F2EB]">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="text-stone-700 font-bold text-xs uppercase tracking-wider py-2.5 px-4"
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
                    className="border-b border-stone-100 hover:bg-[#FDFBF7] transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2 px-4 text-stone-700 text-xs">
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
                    No brands found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Row selection and pagination button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
          <div className="text-xs md:text-sm text-stone-500 font-medium">
            Total Brands: <span className="font-semibold text-stone-800">{table.getFilteredRowModel().rows.length}</span>
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
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Brand?"
        description="This action cannot be undone. This will permanently delete the brand."
        variant="danger"
        confirmText="Delete"
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-md p-6 bg-[#FDFBF7] border border-stone-200/80 rounded-2xl shadow-xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-heading text-lg font-bold text-stone-800 flex items-center justify-between">
              <span>{previewImage?.brand || "Brand Logo Preview"}</span>
              {previewImage?.short && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F5F2EB] text-[#A27B5C] border border-[#A27B5C]/20">
                  {previewImage.short}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 pt-2">
            <div className="w-full aspect-square max-w-[320px] rounded-2xl border-2 border-stone-200 overflow-hidden shadow-sm bg-white flex items-center justify-center p-2">
              <img
                src={previewImage?.url}
                alt={previewImage?.brand}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://houseofonzone.com/admin/storage/app/public/no_image.jpg";
                }}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div className="flex items-center justify-between w-full text-xs text-stone-500 font-medium px-1">
              <span>Status: <strong className="text-stone-800">{previewImage?.status || "Active"}</strong></span>
              <a
                href={previewImage?.url}
                target="_blank"
                rel="noreferrer"
                className="text-[#A27B5C] hover:underline font-semibold"
              >
                Open Original ↗
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
};

export default BrandList;