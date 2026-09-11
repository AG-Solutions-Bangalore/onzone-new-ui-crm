import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Send, Trash2, Minus } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as z from "zod";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  LoaderComponent,
  ErrorComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import Page from "../dashboard/page";
import { useToast } from "@/hooks/use-toast";
import BASE_URL from "@/config/BaseUrl";

const formSchema = z.object({
  work_order_sa_dc_no: z.string().min(1, "DC No is required"),
  work_order_sa_dc_date: z.string().min(1, "DC Date is required"),
  work_order_sa_box: z.number().optional(),
  work_order_sa_pcs: z.number().min(1, "Pieces count is required"),
  work_order_sa_fabric_sale: z
    .string()
    .min(1, "Fabric sale status is required"),
  work_order_sa_remarks: z.string().optional(),
  work_order_sa_count: z.number().optional(),
  workorder_sub_sa_data: z.array(
    z.object({
      id: z.number().optional(),
      work_order_sa_sub_barcode: z.string().min(1, "T Code is required"),
    })
  ),
});

const EditSales = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [workorder, setWorkOrderSales] = useState({
    work_order_sa_date: "",
    work_order_sa_retailer_id: "",
    work_order_sa_dc_no: "",
    work_order_sa_dc_date: "",
    work_order_sa_retailer_name: "",
    work_order_sa_box: "",
    work_order_sa_pcs: "",
    work_order_sa_fabric_sale: "",
    work_order_sa_count: "",
    work_order_sa_remarks: "",
  });

  const useTemplate = { id: "", work_order_sa_sub_barcode: "" };
  const [users, setUsers] = useState([useTemplate]);

  // Alert Dialog States
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    data: null, // { index, barcode, dbId }
    message: ""
  });

  const {
    data: workOrderData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workOrderSales", id],
    queryFn: async () => {
      if (!id) {
        throw new Error("No ID provided");
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      try {
        const response = await axios.get(
          `${BASE_URL}/api/fetch-work-order-sales-by-id/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        return response.data;
      } catch (error) {
        console.error("API Error:", error.response?.data || error.response?.data?.message);
        throw error;
      }
    },
    enabled: !!id,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (workOrderData) {
      const { workordersales, workordersalessub } = workOrderData;

      if (workordersales) {
        setWorkOrderSales({
          work_order_sa_date: workordersales.work_order_sa_date || "",
          work_order_sa_retailer_id:
            workordersales.work_order_sa_retailer_id || "",
          work_order_sa_dc_no: workordersales.work_order_sa_dc_no || "",
          work_order_sa_dc_date: workordersales.work_order_sa_dc_date || "",
          work_order_sa_retailer_name:
            workordersales.work_order_sa_retailer_name || "",
          work_order_sa_box: workordersales.work_order_sa_box || "",
          work_order_sa_pcs: workordersales.work_order_sa_pcs || "",
          work_order_sa_fabric_sale:
            workordersales.work_order_sa_fabric_sale || "",
          work_order_sa_count: workordersales.work_order_sa_count || "",
          work_order_sa_remarks: workordersales.work_order_sa_remarks || "",
        });
      }

      if (workordersalessub && workordersalessub.length > 0) {
        setUsers(
          workordersalessub.map((item) => ({
            id: item.id || "",
            work_order_sa_sub_barcode: item.work_order_sa_sub_barcode || "",
          }))
        );
      } else {
        setUsers([useTemplate]);
      }
    }
  }, [workOrderData]);

  const validateOnlyDigits = (inputtxt) => {
    const phoneno = /^\d+$/;
    return phoneno.test(inputtxt) || inputtxt.length === 0;
  };

  const onInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "work_order_sa_box" || name === "work_order_sa_pcs") {
      if (validateOnlyDigits(value)) {
        setWorkOrderSales((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setWorkOrderSales((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const onChange = (e, index) => {
    const { name, value } = e.target;
    setUsers((prev) =>
      prev.map((user, i) => (i === index ? { ...user, [name]: value } : user))
    );
  };

  // Show confirmation dialog for barcode deletion
  const confirmBarcodeDelete = (index, barcode, dbId) => {
    setDeleteDialog({
      isOpen: true,
      data: { index, barcode, dbId },
      message: dbId 
        ? `Are you sure you want to delete barcode "${barcode}" from the database?`
        : `Are you sure you want to remove barcode "${barcode}"?`
    });
  };

  // Handle confirmed deletion
  const handleConfirmedDelete = async () => {
    const { index, barcode, dbId } = deleteDialog.data;

    // If this barcode exists in the database, delete it via API
    if (dbId) {
      const success = await deleteBarcodeFromDB(dbId);
      if (!success) return;
    }
    
    // Remove from local state
    const newUsers = [...users];
    newUsers.splice(index, 1);
    setUsers(newUsers);

    toast({
      title: dbId ? "Deleted" : "Removed",
      description: `Barcode ${dbId ? 'deleted from database' : 'removed'} successfully`,
      variant: "default",
    });

    setDeleteDialog({ isOpen: false, data: null, message: "" });
  };

  // Delete individual barcode from database
  const deleteBarcodeFromDB = async (barcodeId) => {
    if (!barcodeId) return true;
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${BASE_URL}/api/delete-work-order-sales-sub/${barcodeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete barcode from database",
      });
      return false;
    }
  };

  const updateOrderSalesMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${BASE_URL}/api/update-work-orders-sales/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.code === "200" || data?.code === 200) {
        toast({
          title: "Success",
          description: "Work Order Sales Updated Successfully",
        });
        navigate("/sales");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error while editing the order sales",
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "API Error occurred",
      });
    },
  });

  const onSubmit = async (e) => {
    e.preventDefault();

    const data = {
      work_order_sa_dc_no: workorder.work_order_sa_dc_no,
      work_order_sa_dc_date: workorder.work_order_sa_dc_date,
      work_order_sa_box: parseInt(workorder.work_order_sa_box) || 0,
      work_order_sa_pcs: parseInt(workorder.work_order_sa_pcs) || 0,
      work_order_sa_fabric_sale: workorder.work_order_sa_fabric_sale,
      work_order_sa_remarks: workorder.work_order_sa_remarks,
      workorder_sub_sa_data: users,
      work_order_sa_count: parseInt(workorder.work_order_sa_count) || 0,
    };

    const validation = formSchema.safeParse(data);
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Please fix the following:",
        description: (
          <div className="grid gap-1">
            {validation.error.errors.map((error, i) => {
              const field = error.path[0].toString().replace(/_/g, " ");
              const label = field.charAt(0).toUpperCase() + field.slice(1);
              return (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex items-center justify-center h-4 w-4 mt-0.5 flex-shrink-0 rounded-full bg-red-100 text-red-700 text-xs">
                    {i + 1}
                  </div>
                  <p className="text-xs">
                    <span className="font-medium">{label}:</span>{" "}
                    {error.message}
                  </p>
                </div>
              );
            })}
          </div>
        ),
      });
      return;
    }

    updateOrderSalesMutation.mutate(data);
  };

  if (isLoading) {
    return <LoaderComponent name="Work Order Sales Data" />;
  }

  if (isError) {
    return (
      <ErrorComponent
        message={`Error Fetching Work Order Sales Data: ${
          error?.message || "Unknown error"
        }`}
        refetch={refetch}
      />
    );
  }

  return (
    <Page>
      <div className="max-w-full mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Update Work Order Sales
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/sales" className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <form className="space-y-2">
              {/* Basic Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="work_order_sa_retailer_name">Retailers</Label>
                  <Input
                    id="work_order_sa_retailer_name"
                    name="work_order_sa_retailer_name"
                    value={workorder.work_order_sa_retailer_name}
                    onChange={onInputChange}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="work_order_sa_date">Sales Date</Label>
                  <Input
                    id="work_order_sa_date"
                    type="date"
                    name="work_order_sa_date"
                    value={workorder.work_order_sa_date}
                    onChange={onInputChange}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="work_order_sa_dc_no">DC No</Label>
                  <Input
                    id="work_order_sa_dc_no"
                    name="work_order_sa_dc_no"
                    value={workorder.work_order_sa_dc_no}
                    onChange={onInputChange}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="work_order_sa_dc_date">DC Date</Label>
                  <Input
                    id="work_order_sa_dc_date"
                    type="date"
                    name="work_order_sa_dc_date"
                    value={workorder.work_order_sa_dc_date}
                    onChange={onInputChange}
                  />
                </div>
                <div className="space-y-1 hidden">
                  <Label htmlFor="work_order_sa_dc_date">No of Box</Label>
                  <Input
                    id="work_order_sa_box"
                    name="work_order_sa_box"
                    value={workorder.work_order_sa_box}
                    onChange={onInputChange}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="work_order_sa_pcs">Total No of Pcs</Label>
                  <Input
                    id="work_order_sa_pcs"
                    name="work_order_sa_pcs"
                    value={workorder.work_order_sa_pcs}
                    onChange={onInputChange}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="work_order_sa_fabric_sale">
                    Fabric Sales
                  </Label>
                  <Input
                    id="work_order_sa_fabric_sale"
                    name="work_order_sa_fabric_sale"
                    value={workorder.work_order_sa_fabric_sale}
                    onChange={onInputChange}
                  />
                </div>

                <div className="lg:col-span-3 space-y-1">
                  <Label htmlFor="work_order_sa_remarks">Remarks</Label>
                  <Textarea
                    id="work_order_sa_remarks"
                    name="work_order_sa_remarks"
                    value={workorder.work_order_sa_remarks}
                    onChange={onInputChange}
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <Separator />

              {/* Sub Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider flex items-center gap-2">
                    Item Details
                    <span className="text-[10px] font-semibold bg-[#F5F2EB] text-[#543D2B] px-2 py-0.5 rounded-full border border-stone-200/80 normal-case tracking-normal">
                      {users.length} item(s)
                    </span>
                  </h4>
                </div>

                <div className="grid gap-2.5">
                  {users.map((user, index) => (
                    <div
                      key={index}
                      className="bg-[#FDFBF7] border border-stone-200/80 rounded-2xl p-3.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <Input
                            type="hidden"
                            name="id"
                            value={user.id}
                            onChange={(e) => onChange(e, index)}
                          />

                          <div className="space-y-1">
                            <Label htmlFor={`tcode_${index}`} className="text-xs font-bold text-stone-800">
                              T Code #{index + 1}
                            </Label>
                            <Input
                              id={`tcode_${index}`}
                              name="work_order_sa_sub_barcode"
                              value={user.work_order_sa_sub_barcode}
                              onChange={(e) => onChange(e, index)}
                              placeholder="Enter T Code"
                              className="h-9 text-xs px-3 bg-white border border-stone-200 focus:border-[#A27B5C] focus:ring-2 focus:ring-[#A27B5C]/15 rounded-xl text-stone-900 font-mono tracking-wider font-semibold"
                            />
                          </div>
                        </div>

                        <div className="flex items-end self-end">
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={() => confirmBarcodeDelete(index, user.work_order_sa_sub_barcode, user.id)}
                            className="h-9 w-9 border-stone-200 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title={user.id ? "Delete from database" : "Remove locally"}
                          >
                            {user.id ? (
                              <Trash2 className="h-3.5 w-3.5" />
                            ) : (
                              <Minus className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <Button
                  type="button"
                  onClick={onSubmit}
                  disabled={updateOrderSalesMutation.isPending}
                  className="h-10 px-6 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {updateOrderSalesMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Update
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, data: null, message: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmedDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDialog.data?.dbId ? 'Delete' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};

export default EditSales;