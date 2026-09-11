import React from "react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import BASE_URL from "@/config/BaseUrl";
import { Loader2, SquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocation } from "react-router-dom";
import { ButtonConfig } from "@/config/ButtonConfig";

const AddStyle = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    style_type: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const handleSubmit = async () => {
    if (!formData.style_type.trim()) {
      toast({
        title: "Error",
        description: "Style are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/create-style`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response?.data.code == 200) {
        toast({
          title: "Success",
          description: response.data.msg,
        });

        setFormData({
          style_type: "",
        });
        await queryClient.invalidateQueries(["style"]);
        setOpen(false);
      } else {
        toast({
          title: "Error",
          description: response.data.msg,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create style",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {pathname === "/master/style" ? (
          <Button
            variant="default"
            className="bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-sm rounded-xl font-medium px-4 py-2 flex items-center gap-2"
          >
            <SquarePlus className="h-4 w-4" /> Add Style
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[#A27B5C] hover:text-[#8C6547] font-semibold"
          >
            + Create Style
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-white border border-stone-200 rounded-2xl shadow-xl p-5" align="end">
        <div className="grid gap-4">
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-stone-800 leading-none">Create New Style</h4>
            <p className="text-xs text-stone-500">
              Enter the style or cut name below
            </p>
          </div>
          <div className="grid gap-3">
            <Input
              id="style_type"
              placeholder="e.g. Slim Fit, Regular, Oversized"
              value={formData.style_type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  style_type: e.target.value,
                }))
              }
              className="bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800"
            />

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-sm rounded-xl font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Style"
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddStyle;
