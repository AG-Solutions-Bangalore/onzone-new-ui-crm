import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import BASE_URL from "@/config/BaseUrl";
import { Loader2, Edit, AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ButtonConfig } from "@/config/ButtonConfig";

const EditWidth = ({ widthId }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    width_mea: "",
    width_status: "Active",
  });
  const [originalData, setOriginalData] = useState(null);

  // Fetch width data
  const fetchWidthData = async () => {
    setIsFetching(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-width-by-Id/${widthId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const widthData = response?.data?.width;
      setFormData({
        width_mea: widthData.width_mea || "",
        width_status: widthData.width_status || "Active",
      });
      setOriginalData({
        width_mea: widthData.width_mea || "",
        width_status: widthData.width_status || "Active",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch style data",
        variant: "destructive",
      });
      setOpen(false);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchWidthData();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!formData.width_mea.trim()) {
      toast({
        title: "Error",
        description: "Width type is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/update-width/${widthId}?_method=PUT`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response?.data.code === 200) {
        toast({
          title: "Success",
          description: `${response.data.msg}`,
        });

        await queryClient.invalidateQueries(["width"]);
        setOpen(false);
      } else {
        toast({
          title: "Error",
          description: response.data.msg || "Failed to update width",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update width",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if there are changes
  const hasChanges =
    originalData &&
    (formData.width_mea !== originalData.width_mea ||
      formData.width_status !== originalData.width_status);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit Width</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-80 bg-white border border-stone-200 rounded-2xl shadow-xl p-5" align="end">
        {isFetching ? (
          <div className="flex justify-center py-6 text-stone-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#A27B5C]" />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="space-y-1">
              <h4 className="font-heading font-bold text-stone-800 leading-none">Edit Width</h4>
              <p className="text-xs text-stone-500">
                Update width measurement and status
              </p>
            </div>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="width_mea" className="text-xs font-semibold text-stone-700">
                  Width
                </label>
                <div className="relative">
                  <Input
                    id="width_mea"
                    placeholder="Enter width"
                    value={formData.width_mea}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        width_mea: e.target.value,
                      }))
                    }
                    className={`bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 ${
                      hasChanges ? "pr-8 border-[#A27B5C]" : ""
                    }`}
                  />
                  {hasChanges &&
                    formData.width_mea !== originalData.width_mea && (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <RefreshCcw
                          className="h-3.5 w-3.5 text-[#A27B5C] cursor-pointer hover:rotate-180 transition-all duration-300"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              width_mea: originalData.width_mea,
                            }))
                          }
                        />
                      </div>
                    )}
                </div>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="width_status" className="text-xs font-semibold text-stone-700">
                  Status
                </label>
                <Select
                  value={formData.width_status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      width_status: value,
                    }))
                  }
                >
                  <SelectTrigger
                    className="bg-white border-stone-200 focus:border-[#A27B5C] rounded-xl text-stone-800"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 rounded-xl shadow-lg">
                    <SelectItem value="Active">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="Inactive">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-stone-400 mr-2" />
                        Inactive
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasChanges && (
                <Alert className="bg-[#FAF7F2] border-[#E8E0D4] py-2 px-3 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-[#A27B5C]" />
                  <AlertDescription className="text-stone-700 text-xs">
                    You have unsaved changes
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isLoading || !hasChanges}
                className="bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-sm rounded-xl font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Width"
                )}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default EditWidth;
