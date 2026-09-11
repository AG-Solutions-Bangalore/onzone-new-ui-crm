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
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const token = localStorage.getItem("token");
      return await axios({
        url: `${BASE_URL}/api/update-brand/${id}?_method=PUT`,
        method: "POST",
        data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: (response) => {
      refetch();
      setEditingRow(null);
      setEditFormData({});
      setSelectedFile(null);
      toast({
        title: "Success",
        description: `${response.data.msg}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update brand",
        variant: "destructive",
      });
    },
  });

  // const confirmDelete = (e) => {
  //   e.preventDefault();
  //   e.stopPropagation()
  //   if (deleteWorkOrderId) {
  //     deleteMutation.mutate(deleteWorkOrderId);
  //     setDeleteWorkOrderId(null);
  //   }
  // };

  const confirmDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteWorkOrderId && !deleteMutation.isPending) {
      deleteMutation.mutate(deleteWorkOrderId);
    }
  };

  const validateOnlyText = (inputtxt) => {
    var re = /^[A-Za-z ]+$/;
    if (inputtxt === "" || re.test(inputtxt)) {
      return true;
    } else {
      return false;
    }
  };

  const handleEditClick = (row) => {
    setEditingRow(row.original.id);
    setEditFormData({
      fabric_brand_brands: row.original.fabric_brand_brands,
      fabric_brand_status: row.original.fabric_brand_status,
      fabric_brand_images: row.original.fabric_brand_images,
    });
    setSelectedFile(null);
  };

  const handleCancelEdit = () => {
  
  if (selectedFile) {
    URL.revokeObjectURL(URL.createObjectURL(selectedFile));
  }
  setEditingRow(null);
  setEditFormData({});
  setSelectedFile(null);
};
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "fabric_brand_brands") {
      if (validateOnlyText(value)) {
        setEditFormData({
          ...editFormData,
          [name]: value,
        });
      }
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (value) => {
    setEditFormData({
      ...editFormData,
      fabric_brand_status: value,
    });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpdateSubmit = (id) => {
    const data = new FormData();
    data.append("fabric_brand_brands", editFormData.fabric_brand_brands);
    data.append("fabric_brand_status", editFormData.fabric_brand_status);
    if (selectedFile) {
      data.append("fabric_brand_images", selectedFile);
    }

    updateMutation.mutate({ id, data });
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
        const isEditing = editingRow == row.original.id;
        const brandImage = row.original.fabric_brand_images;
        const imageUrl = brandImage
          ? `https://houseofonzone.com/admin/storage/app/public/Brands/${brandImage}`
          : "https://houseofonzone.com/admin/storage/app/public/no_image.jpg";

        if (isEditing) {
          return (
            <div className="relative group">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Current Brand Img"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://houseofonzone.com/admin/storage/app/public/no_image.jpg";
                    }}
                    className="rounded-xl border-2 border-stone-200 shadow-sm"
                    style={{ width: "50px", height: "50px", objectFit: "cover" }}
                  />
                  <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-full">
                    Current
                  </span>
                </div>

                {selectedFile && (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Selected Brand Img"
                      className="rounded-xl border-2 border-[#A27B5C]/50 shadow-sm"
                      style={{ width: "50px", height: "50px", objectFit: "cover" }}
                    />
                    <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                      New
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-2">
                <label className="relative cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center px-3 py-1.5 bg-[#A27B5C] hover:bg-[#8C6547] text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-xs">
                    <span>{selectedFile ? "Change" : "Choose"}</span>
                  </div>
                </label>
              </div>
            </div>
          );
        }

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
      cell: ({ row }) => {
        const isEditing = editingRow === row.original.id;

        if (isEditing) {
          return (
            <Input
              type="text"
              value={editFormData.fabric_brand_brands || ""}
              onChange={handleInputChange}
              name="fabric_brand_brands"
              className="w-full bg-white border-stone-200 focus:border-[#A27B5C] rounded-lg text-sm"
              required
            />
          );
        }

        return <div className="font-medium text-stone-800">{row.getValue("Brand")}</div>;
      },
    },
    {
      accessorKey: "fabric_brand_status",
      id: "Status",
      header: "Status",
      cell: ({ row }) => {
        const isEditing = editingRow === row.original.id;
        const status = row.getValue("Status");

        if (isEditing) {
          return (
            <Select
              value={editFormData.fabric_brand_status || ""}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="w-full bg-white border-stone-200 rounded-lg">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

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
        const isEditing = editingRow === brandId;

        if (isEditing) {
          return (
            <div className="flex flex-row space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUpdateSubmit(brandId)}
                      disabled={updateMutation.isPending}
                      className="text-green-600 hover:text-green-800"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {updateMutation.isPending ? "Updating..." : "Save Changes"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancelEdit}
                      disabled={updateMutation.isPending}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cancel</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        }

        return (
          <div className="flex flex-row">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(row)}
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

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative w-full sm:w-64 flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <Input
                placeholder="Search brand..."
                value={table.getState().globalFilter || ""}
                onChange={(event) => table.setGlobalFilter(event.target.value)}
                className="h-9 pl-9.5 pr-3 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 shadow-2xs"
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