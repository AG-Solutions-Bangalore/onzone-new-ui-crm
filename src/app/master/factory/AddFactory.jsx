



import { useState } from "react";

import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import * as z from "zod";
import axios from "axios";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import BASE_URL from "@/config/BaseUrl";
import Page from "@/app/dashboard/page";


const factorySchema = z.object({
  factory_name: z.string().min(1, "Factory name is required"),
  factory_address: z.string().min(1, "Address is required"),
  factory_gstin: z.string().min(1, "GSTIN is required"),
  factory_contact_name: z.string()
    .min(1, "Contact name is required")
    .regex(/^[A-Za-z ]+$/, "Only letters allowed"),
  factory_contact_mobile: z.string()
    .min(10, "Must be 10 digits")
    .max(10, "Must be 10 digits")
    .regex(/^\d+$/, "Only digits allowed"),
  factory_contact_email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format"),
});

const AddFactory = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [factory, setFactory] = useState({
    factory_name: "",
    factory_address: "",
    factory_gstin: "",
    factory_contact_name: "",
    factory_contact_mobile: "",
    factory_contact_email: "",
  });

  const createFactoryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios({
        url: `${BASE_URL}/api/create-factory`,
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
        resetForm();
        navigate("/master/factory");
      } else {
        throw new Error(data.msg || "Duplicate Entry");
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message,
      });
    },
  });

  const resetForm = () => {
    setFactory({
      factory_name: "",
      factory_address: "",
      factory_gstin: "",
      factory_contact_name: "",
      factory_contact_mobile: "",
      factory_contact_email: "",
    });
  };

  const onInputChange = (e) => {
    const { name, value } = e.target;
    setFactory(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    try {
      const validatedData = factorySchema.parse(factory);
      createFactoryMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: err.message,
          });
        });
      }
    }
  };

  return (
    <Page>
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-stone-800 tracking-tight">
              Create Factory
            </h1>
            <p className="text-xs md:text-sm text-stone-500 font-medium">
              Register a new manufacturing unit or production partner
            </p>
          </div>
          <Link to="/master/factory">
            <Button variant="outline" className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl gap-2 shadow-2xs">
              <ArrowLeft className="h-4 w-4" /> Back to Factories
            </Button>
          </Link>
        </div>

        <Card className="rounded-2xl border border-stone-200/80 bg-white shadow-xs overflow-hidden">
          <CardHeader className="bg-[#FBF9F5] border-b border-stone-200/80 px-6 py-4">
            <CardTitle className="font-heading text-lg font-bold text-stone-800">
              Factory Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="factory_name" className="text-xs font-semibold text-stone-700">
                    Factory Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="factory_name"
                    name="factory_name"
                    value={factory.factory_name}
                    onChange={onInputChange}
                    placeholder="Enter factory name"
                    className="bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="factory_contact_email" className="text-xs font-semibold text-stone-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="factory_contact_email"
                    name="factory_contact_email"
                    type="email"
                    value={factory.factory_contact_email}
                    onChange={onInputChange}
                    placeholder="Enter email address"
                    className="bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="factory_address" className="text-xs font-semibold text-stone-700">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="factory_address"
                    name="factory_address"
                    value={factory.factory_address}
                    onChange={onInputChange}
                    placeholder="Enter full address"
                    className="bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="factory_gstin" className="text-xs font-semibold text-stone-700">
                    GSTIN <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="factory_gstin"
                    name="factory_gstin"
                    value={factory.factory_gstin}
                    onChange={onInputChange}
                    placeholder="Enter GSTIN number"
                    className="bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800 uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="factory_contact_name" className="text-xs font-semibold text-stone-700">
                    Contact Person Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="factory_contact_name"
                    name="factory_contact_name"
                    value={factory.factory_contact_name}
                    onChange={onInputChange}
                    placeholder="Enter contact name"
                    className="bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="factory_contact_mobile" className="text-xs font-semibold text-stone-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="factory_contact_mobile"
                    name="factory_contact_mobile"
                    value={factory.factory_contact_mobile}
                    onChange={onInputChange}
                    placeholder="Enter 10-digit mobile"
                    maxLength={10}
                    className="bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-[#A27B5C]/20 rounded-xl text-stone-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <Link to="/master/factory">
                  <Button variant="outline" className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl px-5">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createFactoryMutation.isPending}
                  className="bg-[#A27B5C] hover:bg-[#8C6547] text-white shadow-sm rounded-xl font-medium px-6 py-2.5 gap-2"
                >
                  {createFactoryMutation.isPending ? (
                    <>
                      <Send className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Create Factory
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

export default AddFactory;