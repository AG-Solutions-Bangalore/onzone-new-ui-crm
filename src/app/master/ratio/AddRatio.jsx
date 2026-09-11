import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import BASE_URL from "@/config/BaseUrl";
import { Loader2, SquarePlus, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ButtonConfig } from "@/config/ButtonConfig";
import { Label } from "@/components/ui/label";

const AddRatio = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleFileSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("uploaded_file", selectedFile);

      const response = await axios.post(
        `${BASE_URL}/api/create-ratio-files`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response?.data.code == 200) {
        toast({
          title: "Success",
          description: `${response.data.msg}`,
        });
        await queryClient.invalidateQueries(["ratios"]);
        setOpen(false);
        navigate("/master/ratio");
      } else {
        toast({
          title: "Error",
          description: response.data.msg || "Duplicate Entry",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to upload ratio file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {pathname === "/master/ratio" && (
          <Button
            variant="default"
            className={`ml-2 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
          >
            <SquarePlus className="h-4 w-4 mr-2" /> Ratio
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-5 bg-[#FDFBF7] border border-stone-200/80 shadow-xl rounded-2xl">
        <div className="grid gap-4">
          <div className="space-y-1">
            <h4 className="font-heading font-semibold text-stone-800 text-base leading-none">Upload Ratio File</h4>
            <p className="text-xs text-stone-500 font-sans">
              Upload Excel file (.xlsx, .xls) with ratio data
            </p>
          </div>

          <form onSubmit={handleFileSubmit} className="space-y-4">
            <div className="grid gap-3">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="ratioFile" className="text-xs font-semibold text-stone-700">Ratio File <span className="text-[#A27B5C]">*</span></Label>
                <Input
                  id="ratioFile"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-700 file:bg-[#F5F2EB] file:text-stone-700 file:border-0 file:rounded-lg file:mr-3 file:px-3 file:py-1 file:font-medium hover:file:bg-[#EAE5D9] cursor-pointer text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#F5F2EB]/60 rounded-xl border border-stone-200/60">
                <span className="text-xs text-stone-600 font-medium">
                  Sample template:
                </span>
                <Button variant="outline" size="sm" asChild className="h-7 text-xs border-stone-300 bg-white hover:bg-[#F5F2EB] text-stone-700 rounded-lg shadow-2xs">
                  <a
                    href="https://houseofonzone.com/admin/storage/app/public/File/format.xlsx"
                    download="ratio_format.xlsx"
                    className="flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5 text-[#A27B5C]" />
                    Download Format
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t border-stone-200/60">
              <Button
                type="submit"
                disabled={isLoading}
                className={`${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor} rounded-xl shadow-xs`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload File"
                )}
              </Button>

              <Button
                variant="outline"
                onClick={(e) => {
                  (e.preventDefault(), setOpen(false));
                }}
                className="flex items-center gap-2 border-stone-200 hover:bg-stone-100 text-stone-700 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddRatio;
