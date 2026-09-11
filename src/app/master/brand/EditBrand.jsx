import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import BASE_URL from "@/config/BaseUrl";

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const brandSchema = z.object({
  fabric_brand_brands: z
    .string()
    .min(1, "Brand name is required")
    .regex(/^[A-Za-z ]+$/, "Only letters allowed"),
  fabric_brand_status: z.string().min(1, "Status is required"),
  fabric_brand_images: z.any().optional(),
});

const EditBrand = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [brand, setBrand] = useState({
    fabric_brand_brands: "",
    fabric_brand_status: "",
    fabric_brand_images: "",
  });

  // Fetch brand data
  const { data: brandData, isLoading } = useQuery({
    queryKey: ["brand", id],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/api/fetch-brand-by-Id/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch brand");
      return response.json();
    },
    onSuccess: (data) => {
      setBrand(data?.brand);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch brand data",
      });
    },
  });

  // Update brand mutation
  const updateBrandMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await fetch(
        `${BASE_URL}/api/update-brand/${id}?_method=PUT`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Update failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Brand updated successfully",
      });
      navigate("/master/brand");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message.includes("duplicate")
          ? "Duplicate entry"
          : "Update failed",
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
      const validatedData = brandSchema.parse(brand);
      const formData = new FormData();
      formData.append("fabric_brand_brands", validatedData.fabric_brand_brands);
      if (selectedFile) formData.append("fabric_brand_images", selectedFile);
      formData.append("fabric_brand_status", validatedData.fabric_brand_status);

      updateBrandMutation.mutate(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: err.message,
          });
        });
      }
    }
  };

  const imageUrl = brand.fabric_brand_images
    ? `https://houseofonzone.com/admin/storage/app/public/Brands/${brand.fabric_brand_images}`
    : "https://houseofonzone.com/admin/storage/app/public/no_image.jpg";

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
              Update brand profile, logo, and active availability
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
                    <Label htmlFor="brandName" className="text-xs font-semibold text-stone-700">
                      Brand Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="brandName"
                      type="text"
                      name="fabric_brand_brands"
                      value={brand.fabric_brand_brands}
                      onChange={onInputChange}
                      placeholder="Enter brand name"
                      className="bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800"
                    />
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
                  className="bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-sm rounded-xl font-medium px-6 py-2.5 gap-2"
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
