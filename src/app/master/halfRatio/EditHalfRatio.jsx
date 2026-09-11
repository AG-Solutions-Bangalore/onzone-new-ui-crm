import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import * as z from "zod";
import axios from "axios";
import { Link } from "react-router-dom";

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
import BASE_URL from "@/config/BaseUrl";
import Page from "@/app/dashboard/page";
import { useToast } from "@/hooks/use-toast";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const ratioGroupOptions = [
  { value: "a", label: "a" },
  { value: "ab", label: "ab" },
  { value: "abc", label: "abc" },
];

const ratioSchema = z.object({
  ratio_range: z.string().min(1, "Ratio range is required"),
  ratio_group: z.string().min(1, "Ratio group is required"),
  ratio_status: z.string().min(1, "Status is required"),
  ratio_type38: z.string().min(1, "Ratio 38 is required"),
  ratio_type40: z.string().min(1, "Ratio 40 is required"),
  ratio_type42: z.string().min(1, "Ratio 42 is required"),
  ratio_type44: z.string().min(1, "Ratio 44 is required"),
  ratio_type46: z.string().min(1, "Ratio 46 is required"),
  ratio_type48: z.string().min(1, "Ratio 48 is required"),
  ratio_type50: z.string().min(1, "Ratio 50 is required"),
});

const EditHalfRatio = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ratioValues, setRatioValues] = useState({
    ratio_range: "",
    ratio_group: "",
    ratio_status: "",
    ratio_type38: "",
    ratio_type40: "",
    ratio_type42: "",
    ratio_type44: "",
    ratio_type46: "",
    ratio_type48: "",
    ratio_type50: "",
  });

  // Fetch ratio data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["half-ratio", id],
    queryFn: async () => {
      const response = await axios.get(
        `${BASE_URL}/api/fetch-half-ratio-by-id/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      return response.data;
    },
  });

  // Use useEffect to populate the form when data is loaded
  useEffect(() => {
    if (data?.ratioHalf) {
      const ratioData = data.ratioHalf;
      const ratioTypes = ratioData.ratio_type.split(",");

      setRatioValues({
        ratio_range: ratioData.ratio_range,
        ratio_group: ratioData.ratio_group,
        ratio_status: ratioData.ratio_status,
        ratio_type38: ratioTypes[0] || "",
        ratio_type40: ratioTypes[1] || "",
        ratio_type42: ratioTypes[2] || "",
        ratio_type44: ratioTypes[3] || "",
        ratio_type46: ratioTypes[4] || "",
        ratio_type48: ratioTypes[5] || "",
        ratio_type50: ratioTypes[6] || "",
      });
    }
  }, [data]);

  // Handle errors with useEffect
  useEffect(() => {
    if (isError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch ratio data",
      });
    }
  }, [isError, toast]);

  // Update ratio mutation
  const updateRatioMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios({
        url: `${BASE_URL}/api/update-half-ratio/${id}?_method=PUT`,
        method: "POST",
        data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.code === 200) {
        toast({
          title: "Success",
          description: `${data.msg}`,
        });
        navigate("/master/half-ratio");
      } else {
        throw new Error(data.msg || "Update failed");
      }
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
    setRatioValues((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    try {
      const validatedData = ratioSchema.parse(ratioValues);
      updateRatioMutation.mutate(validatedData);
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

  if (isLoading) {
    return <LoaderComponent name="Edit half ratio Data" />;
  }

  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching half ratio Data"
        refetch={refetch}
      />
    );
  }

  return (
    <Page>
      <div className="w-full max-w-5xl mx-auto space-y-4">
        {/* Top Header Card */}
        <div className="flex items-center justify-between bg-[#FDFBF7] border border-stone-200/80 px-5 py-3.5 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#A27B5C] bg-[#F5F2EB] px-2.5 py-1 rounded-lg border border-stone-200/60">
              Master / Half-Ratio
            </span>
            <h3 className="font-heading text-lg font-bold text-stone-900 tracking-tight">
              Edit Half-Ratio
            </h3>
          </div>
          <Link to="/master/half-ratio">
            <Button variant="outline" size="sm" className="h-8.5 text-xs border-stone-200 hover:bg-[#F5F2EB] text-stone-700 rounded-xl gap-1.5 shadow-2xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to List
            </Button>
          </Link>
        </div>

        {/* Form Card */}
        <Card className="border border-stone-200/80 shadow-xs rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-[#FBF9F5] border-b border-stone-200/80 px-5 py-3">
            <CardTitle className="font-heading text-sm font-bold text-stone-800">
              Edit Half-Ratio Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Primary Attributes */}
              <div className="bg-[#FDFBF7] border border-stone-200/80 rounded-xl p-3.5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Ratio Range */}
                  <div className="space-y-1">
                    <Label htmlFor="ratio_range" className="text-xs font-bold text-stone-700">
                      Ratio Range <span className="text-[#A27B5C]">*</span>
                    </Label>
                    <Input
                      id="ratio_range"
                      name="ratio_range"
                      value={ratioValues.ratio_range}
                      onChange={onInputChange}
                      placeholder="Enter ratio range"
                      className="h-8.5 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-2 focus:ring-[#A27B5C]/15 rounded-xl text-stone-800 font-medium"
                    />
                  </div>

                  {/* Ratio Group */}
                  <div className="space-y-1">
                    <Label htmlFor="ratio_group" className="text-xs font-bold text-stone-700">
                      Ratio Group <span className="text-[#A27B5C]">*</span>
                    </Label>
                    <Select
                      name="ratio_group"
                      value={ratioValues.ratio_group}
                      onValueChange={(value) =>
                        setRatioValues((prev) => ({
                          ...prev,
                          ratio_group: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8.5 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-2 focus:ring-[#A27B5C]/15 rounded-xl text-stone-800 font-medium">
                        <SelectValue placeholder="Select ratio group" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#FDFBF7] border border-stone-200/80 rounded-xl shadow-lg">
                        {ratioGroupOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs focus:bg-[#F5F2EB]">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <Label htmlFor="ratio_status" className="text-xs font-bold text-stone-700">
                      Status <span className="text-[#A27B5C]">*</span>
                    </Label>
                    <Select
                      name="ratio_status"
                      value={ratioValues.ratio_status}
                      onValueChange={(value) =>
                        setRatioValues((prev) => ({
                          ...prev,
                          ratio_status: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8.5 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-2 focus:ring-[#A27B5C]/15 rounded-xl text-stone-800 font-medium">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#FDFBF7] border border-stone-200/80 rounded-xl shadow-lg">
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs focus:bg-[#F5F2EB]">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Ratio Values Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    Size Ratios
                    <span className="text-[10px] font-semibold bg-[#E5D7C3]/60 text-[#543D2B] px-2 py-0.5 rounded-md border border-[#D8C7B0]/60 normal-case tracking-normal">
                      7 Sizes (38 - 50)
                    </span>
                  </Label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-xl p-2.5 space-y-1 text-center">
                    <Label htmlFor="ratio_type38" className="text-[11px] font-bold text-stone-700 block">
                      Half 38 <span className="text-[#A27B5C]">*</span>
                    </Label>
                    <Input
                      id="ratio_type38"
                      name="ratio_type38"
                      value={ratioValues.ratio_type38}
                      onChange={onInputChange}
                      placeholder="Ratio"
                      className="h-8 text-xs text-center font-mono font-bold bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-1 focus:ring-[#A27B5C]/20 rounded-lg text-stone-900"
                    />
                  </div>

                  <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-xl p-2.5 space-y-1 text-center">
                    <Label htmlFor="ratio_type40" className="text-[11px] font-bold text-stone-700 block">
                      Half 40 <span className="text-[#A27B5C]">*</span>
                    </Label>
                    <Input
                      id="ratio_type40"
                      name="ratio_type40"
                      value={ratioValues.ratio_type40}
                      onChange={onInputChange}
                      placeholder="Ratio"
                      className="h-8 text-xs text-center font-mono font-bold bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-1 focus:ring-[#A27B5C]/20 rounded-lg text-stone-900"
                    />
                  </div>

                  <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-xl p-2.5 space-y-1 text-center">
                    <Label htmlFor="ratio_type42" className="text-[11px] font-bold text-stone-700 block">
                      Half 42 <span className="text-[#A27B5C]">*</span>
                    </Label>
                    <Input
                      id="ratio_type42"
                      name="ratio_type42"
                      value={ratioValues.ratio_type42}
                      onChange={onInputChange}
                      placeholder="Ratio"
                      className="h-8 text-xs text-center font-mono font-bold bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-1 focus:ring-[#A27B5C]/20 rounded-lg text-stone-900"
                    />
                  </div>

                  <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-xl p-2.5 space-y-1 text-center">
                    <Label htmlFor="ratio_type44" className="text-[11px] font-bold text-stone-700 block">
                      Half 44 <span className="text-[#A27B5C]">*</span>
                    </Label>
                    <Input
                      id="ratio_type44"
                      name="ratio_type44"
                      value={ratioValues.ratio_type44}
                      onChange={onInputChange}
                      placeholder="Ratio"
                      className="h-8 text-xs text-center font-mono font-bold bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-1 focus:ring-[#A27B5C]/20 rounded-lg text-stone-900"
                    />
                  </div>

                  <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-xl p-2.5 space-y-1 text-center">
                    <Label htmlFor="ratio_type46" className="text-[11px] font-bold text-stone-700 block">
                      Half 46 <span className="text-[#A27B5C]">*</span>
                    </Label>
                    <Input
                      id="ratio_type46"
                      name="ratio_type46"
                      value={ratioValues.ratio_type46}
                      onChange={onInputChange}
                      placeholder="Ratio"
                      className="h-8 text-xs text-center font-mono font-bold bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-1 focus:ring-[#A27B5C]/20 rounded-lg text-stone-900"
                    />
                  </div>

                  <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-xl p-2.5 space-y-1 text-center">
                    <Label htmlFor="ratio_type48" className="text-[11px] font-bold text-stone-700 block">
                      Half 48 <span className="text-[#A27B5C]">*</span>
                    </Label>
                    <Input
                      id="ratio_type48"
                      name="ratio_type48"
                      value={ratioValues.ratio_type48}
                      onChange={onInputChange}
                      placeholder="Ratio"
                      className="h-8 text-xs text-center font-mono font-bold bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-1 focus:ring-[#A27B5C]/20 rounded-lg text-stone-900"
                    />
                  </div>

                  <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-xl p-2.5 space-y-1 text-center col-span-2 sm:col-span-1">
                    <Label htmlFor="ratio_type50" className="text-[11px] font-bold text-stone-700 block">
                      Half 50 <span className="text-[#A27B5C]">*</span>
                    </Label>
                    <Input
                      id="ratio_type50"
                      name="ratio_type50"
                      value={ratioValues.ratio_type50}
                      onChange={onInputChange}
                      placeholder="Ratio"
                      className="h-8 text-xs text-center font-mono font-bold bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-1 focus:ring-[#A27B5C]/20 rounded-lg text-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200/80">
                <Link to="/master/half-ratio">
                  <Button variant="outline" size="sm" type="button" className="h-9 text-xs border-stone-200 hover:bg-[#F5F2EB] text-stone-700 rounded-xl gap-1.5 font-semibold">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </Link>

                <Button
                  type="submit"
                  size="sm"
                  disabled={updateRatioMutation.isPending}
                  className="h-9 px-5 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl shadow-xs gap-2 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {updateRatioMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Update Half-Ratio
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

export default EditHalfRatio;
