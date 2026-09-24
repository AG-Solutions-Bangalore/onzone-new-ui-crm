import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import axios from "axios";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Page from "@/app/dashboard/page";
import { LoaderComponent } from "@/components/LoaderComponent/LoaderComponent";
import { useToast } from "@/hooks/use-toast";
import BASE_URL from "@/config/BaseUrl";

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const EditBrand = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [brand, setBrand] = useState({
    fabric_brand_brands: "",
    fabric_brand_status: "Active",
    fabric_brand_images: "",
    fabric_brand_short: "",
    fabric_brand_36: "",
    fabric_brand_38: "",
    fabric_brand_39: "",
    fabric_brand_40: "",
    fabric_brand_42: "",
    fabric_brand_44: "",
    fabric_brand_46: "",
    fabric_brand_48: "",
    fabric_brand_50: "",
  });

  // Fetch brand data
  const { data: brandData, isLoading } = useQuery({
    queryKey: ["brand", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/fetch-brand-by-Id/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  useEffect(() => {
    if (brandData) {
      const raw = brandData?.brand || brandData?.data || brandData;
      const b = Array.isArray(raw) ? raw[0] : raw;
      if (b && typeof b === "object") {
        setBrand({
          fabric_brand_brands: b.fabric_brand_brands || "",
          fabric_brand_status: b.fabric_brand_status || "Active",
          fabric_brand_images: b.fabric_brand_images || "",
          fabric_brand_short: b.fabric_brand_short || "",
          fabric_brand_36: b.fabric_brand_36 !== undefined && b.fabric_brand_36 !== null ? String(b.fabric_brand_36) : "",
          fabric_brand_38: b.fabric_brand_38 !== undefined && b.fabric_brand_38 !== null ? String(b.fabric_brand_38) : "",
          fabric_brand_39: b.fabric_brand_39 !== undefined && b.fabric_brand_39 !== null ? String(b.fabric_brand_39) : "",
          fabric_brand_40: b.fabric_brand_40 !== undefined && b.fabric_brand_40 !== null ? String(b.fabric_brand_40) : "",
          fabric_brand_42: b.fabric_brand_42 !== undefined && b.fabric_brand_42 !== null ? String(b.fabric_brand_42) : "",
          fabric_brand_44: b.fabric_brand_44 !== undefined && b.fabric_brand_44 !== null ? String(b.fabric_brand_44) : "",
          fabric_brand_46: b.fabric_brand_46 !== undefined && b.fabric_brand_46 !== null ? String(b.fabric_brand_46) : "",
          fabric_brand_48: b.fabric_brand_48 !== undefined && b.fabric_brand_48 !== null ? String(b.fabric_brand_48) : "",
          fabric_brand_50: b.fabric_brand_50 !== undefined && b.fabric_brand_50 !== null ? String(b.fabric_brand_50) : "",
        });
      }
    }
  }, [brandData]);

  // Update brand mutation
  const updateBrandMutation = useMutation({
    mutationFn: async (formData) => {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/update-brand/${id}?_method=PUT`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: async (data) => {
      if (data?.code === 200 || data?.status === 200 || data?.msg || data?.message) {
        toast({
          title: "Success",
          description: data?.msg || data?.message || "Brand updated successfully",
        });
        await queryClient.invalidateQueries({ queryKey: ["brand"] });
        navigate("/master/brand");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data?.msg || data?.message || "Update failed",
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message?.includes("duplicate") ||
          error.response?.data?.msg?.includes("duplicate")
            ? "Duplicate entry"
            : error.response?.data?.message ||
              error.response?.data?.msg ||
              "Update failed",
      });
    },
  });

  const onInputChange = (e) => {
    const { name, value } = e.target;
    setBrand((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("fabric_brand_brands", brand.fabric_brand_brands || "");
      if (selectedFile) {
        formData.append("fabric_brand_images", selectedFile);
      }
      formData.append("fabric_brand_status", brand.fabric_brand_status || "Active");
      if (brand.fabric_brand_short) {
        formData.append("fabric_brand_short", brand.fabric_brand_short);
      }
      formData.append("fabric_brand_36", brand.fabric_brand_36 || "0");
      formData.append("fabric_brand_38", brand.fabric_brand_38 || "0");
      formData.append("fabric_brand_39", brand.fabric_brand_39 || "0");
      formData.append("fabric_brand_40", brand.fabric_brand_40 || "0");
      formData.append("fabric_brand_42", brand.fabric_brand_42 || "0");
      formData.append("fabric_brand_44", brand.fabric_brand_44 || "0");
      formData.append("fabric_brand_46", brand.fabric_brand_46 || "0");
      formData.append("fabric_brand_48", brand.fabric_brand_48 || "0");
      formData.append("fabric_brand_50", brand.fabric_brand_50 || "0");

      updateBrandMutation.mutate(formData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please check form values",
      });
    }
  };

  const imageUrl = selectedFile
    ? URL.createObjectURL(selectedFile)
    : brand.fabric_brand_images
    ? `https://houseofonzone.com/admin/storage/app/public/Brands/${brand.fabric_brand_images}`
    : "https://houseofonzone.com/admin/storage/app/public/no_image.jpg";

  if (isLoading) {
    return (
      <Page>
        <LoaderComponent />
      </Page>
    );
  }

  return (
    <Page>
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-stone-800 tracking-tight">
              Edit Brand
            </h1>
            <p className="text-xs md:text-sm text-stone-500 font-medium">
              Update brand profile, logo, size specifications, and status
            </p>
          </div>
          <Link to="/master/brand">
            <Button variant="outline" className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl gap-2 shadow-2xs">
              <ArrowLeft className="h-4 w-4" /> Back to Brands
            </Button>
          </Link>
        </div>

        <Card className="rounded-2xl border border-stone-200/80 bg-white shadow-xs overflow-hidden">
          <CardHeader className="bg-[#FBF9F5] border-b border-stone-200/80 px-6 py-4">
            <CardTitle className="font-heading text-lg font-bold text-stone-800">
              Brand Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Brand Image */}
                <div className="flex flex-col items-center space-y-4 p-4 rounded-2xl bg-stone-50/50 border border-stone-200/80">
                  <div className="w-48 h-48 rounded-xl border-2 border-stone-200 overflow-hidden shadow-xs bg-white">
                    <img
                      src={imageUrl}
                      alt="Brand"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://houseofonzone.com/admin/storage/app/public/no_image.jpg";
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-full space-y-1.5">
                    <Label htmlFor="image" className="text-xs font-semibold text-stone-700">
                      Update Brand Logo
                    </Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      className="bg-white border-stone-200 focus:border-[#A27B5C] rounded-xl text-stone-700 text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                    />
                  </div>
                </div>

                {/* Brand Fields */}
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="brandName" className="text-xs font-semibold text-stone-700">
                        Brand Name <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-[11px] text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md font-medium">
                        Not editable
                      </span>
                    </div>
                    <Input
                      id="brandName"
                      type="text"
                      name="fabric_brand_brands"
                      value={brand.fabric_brand_brands}
                      disabled
                      readOnly
                      placeholder="Brand name"
                      className="bg-stone-100/90 border-stone-200 text-stone-600 cursor-not-allowed rounded-xl font-medium select-none"
                    />
                    <p className="text-[11px] text-stone-600">
                      Brand name cannot be modified once created.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="status" className="text-xs font-semibold text-stone-700">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      name="fabric_brand_status"
                      value={brand.fabric_brand_status}
                      onValueChange={(value) =>
                        setBrand((prev) => ({
                          ...prev,
                          fabric_brand_status: value,
                        }))
                      }
                    >
                      <SelectTrigger className="bg-white border-stone-200 focus:border-[#A27B5C] rounded-xl text-stone-800">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-stone-200 rounded-xl shadow-lg">
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Size Specifications Section */}
              {/* <div className="space-y-3 pt-4 border-t border-stone-200/80">
                <div>
                  <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
                    Size Specifications
                  </h3>
                  <p className="text-xs text-stone-500">
                    Specify rates or values for each standard size
                  </p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E6DEC9]">
                  {[
                    { name: "fabric_brand_36", label: "Size 36" },
                    { name: "fabric_brand_38", label: "Size 38" },
                    { name: "fabric_brand_39", label: "Size 39" },
                    { name: "fabric_brand_40", label: "Size 40" },
                    { name: "fabric_brand_42", label: "Size 42" },
                    { name: "fabric_brand_44", label: "Size 44" },
                    { name: "fabric_brand_46", label: "Size 46" },
                    { name: "fabric_brand_48", label: "Size 48" },
                    { name: "fabric_brand_50", label: "Size 50" },
                  ].map((sizeItem) => (
                    <div key={sizeItem.name} className="space-y-1">
                      <Label
                        htmlFor={sizeItem.name}
                        className="text-[11px] font-semibold text-stone-700"
                      >
                        {sizeItem.label}
                      </Label>
                      <Input
                        id={sizeItem.name}
                        name={sizeItem.name}
                        value={brand[sizeItem.name] ?? ""}
                        onChange={onInputChange}
                        placeholder="0"
                        className="h-8 text-xs bg-white border-stone-200 focus:border-[#A27B5C] rounded-lg text-stone-800"
                      />
                    </div>
                  ))}
                </div>
              </div> */}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <Link to="/master/brand">
                  <Button variant="outline" className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl px-5">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={updateBrandMutation.isPending}
                  className="bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-sm rounded-xl font-medium px-6 py-2.5 gap-2 cursor-pointer"
                >
                  {updateBrandMutation.isPending ? (
                    "Updating..."
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
};

export default EditBrand;
