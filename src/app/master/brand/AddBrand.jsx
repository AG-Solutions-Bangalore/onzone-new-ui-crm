import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import BASE_URL from "@/config/BaseUrl";
import { Loader2, SquarePlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { ButtonConfig } from "@/config/ButtonConfig";

const AddBrand = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fabric_brand_brands: "",
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
  const [selectedFile, setSelectedFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "fabric_brand_brands") {
      if (/^[A-Za-z ]*$/.test(value)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else if (name === "fabric_brand_short") {
      if (/^[a-zA-Z0-9]{0,2}$/.test(value)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.fabric_brand_brands ||
      !selectedFile ||
      !formData.fabric_brand_short
    ) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const data = new FormData();
    data.append("fabric_brand_brands", formData.fabric_brand_brands);
    data.append("fabric_brand_images", selectedFile);
    data.append("fabric_brand_short", formData.fabric_brand_short);
    data.append("fabric_brand_36", formData.fabric_brand_36 || "");
    data.append("fabric_brand_38", formData.fabric_brand_38 || "");
    data.append("fabric_brand_39", formData.fabric_brand_39 || "");
    data.append("fabric_brand_40", formData.fabric_brand_40 || "");
    data.append("fabric_brand_42", formData.fabric_brand_42 || "");
    data.append("fabric_brand_44", formData.fabric_brand_44 || "");
    data.append("fabric_brand_46", formData.fabric_brand_46 || "");
    data.append("fabric_brand_48", formData.fabric_brand_48 || "");
    data.append("fabric_brand_50", formData.fabric_brand_50 || "");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${BASE_URL}/api/create-brand`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.data.code === 200) {
        toast({
          title: "Success",
          description: `${response.data.msg}`,
        });

        setFormData({
          fabric_brand_brands: "",
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
        setSelectedFile(null);
        await queryClient.invalidateQueries(["brand"]);
        setOpen(false);
      } else {
        toast({
          title: "Error",
          description: response.data.msg || "Duplicate entry",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create brand",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {pathname === "/master/brand" ? (
          <Button
            variant="default"
            className="bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-sm rounded-xl font-medium px-4 py-2 flex items-center gap-2"
          >
            <SquarePlus className="h-4 w-4" /> Add Brand
          </Button>
        ) : pathname === "/create-contract" ||
          pathname === "/create-invoice" ||
          pathname === "/costing-create" ? (
          <p className="text-xs text-[#A27B5C] hover:text-[#8C6547] font-semibold cursor-pointer">
            <span className="flex items-center flex-row gap-1">
              <SquarePlus className="w-4 h-4" /> <span>Add</span>
            </span>
          </p>
        ) : null}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-stone-200 rounded-2xl shadow-xl p-6">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold text-stone-800">
            Create New Brand
          </DialogTitle>
          <p className="text-xs text-stone-500 font-medium">
            Fill in the details below to add a brand to your directory.
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="fabric_brand_brands" className="text-xs font-semibold text-stone-700">
                Brand Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fabric_brand_brands"
                name="fabric_brand_brands"
                value={formData.fabric_brand_brands}
                onChange={handleInputChange}
                placeholder="Enter Brand Name"
                className="bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800"
                required
              />
            </div>

            {/* Brand Short Code */}
            <div className="grid gap-1.5">
              <Label htmlFor="fabric_brand_short" className="text-xs font-semibold text-stone-700">
                Short Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fabric_brand_short"
                name="fabric_brand_short"
                value={formData.fabric_brand_short}
                onChange={handleInputChange}
                placeholder="Ex: AD"
                maxLength={2}
                className="bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 uppercase"
                required
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="grid gap-2">
            <Label htmlFor="fabric_brand_images" className="text-xs font-semibold text-stone-700">
              Brand Logo / Image <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fabric_brand_images"
              name="fabric_brand_images"
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="bg-stone-50/50 border-stone-200 focus:border-[#A27B5C] rounded-xl text-stone-700 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-200 file:text-stone-700 hover:file:bg-stone-300 cursor-pointer"
              required
            />

            {selectedFile && (
              <div className="flex items-center gap-3 p-2.5 bg-[#F5F2EB]/60 rounded-xl border border-stone-200/60 mt-1">
                <div className="w-12 h-12 rounded-lg border border-stone-300 overflow-hidden bg-white shrink-0 shadow-2xs">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-800 truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-stone-500">{(selectedFile.size / 1024).toFixed(1)} KB • Selected</p>
                </div>
              </div>
            )}
          </div>

          {/* Size Rates / Specifications */}
          {/* <div className="space-y-2 pt-2 border-t border-stone-200">
            <Label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Size Specifications
            </Label>
            <div className="grid grid-cols-3 gap-2.5 bg-[#FAF8F5] p-3 rounded-xl border border-[#E6DEC9]">
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
                    value={formData[sizeItem.name]}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="h-8 text-xs bg-white border-stone-200 focus:border-[#A27B5C] rounded-lg text-stone-800"
                  />
                </div>
              ))}
            </div>
          </div> */}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-sm rounded-xl font-medium px-5 py-2.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Brand"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBrand;
