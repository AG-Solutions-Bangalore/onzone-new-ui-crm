import { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import moment from "moment";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  Select as SelectShadcn,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Import AlertDialog components
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

import Page from "@/app/dashboard/page";
import { useToast } from "@/hooks/use-toast";

import useNumericInput from "@/hooks/useNumericInput";
import { ErrorComponent, LoaderComponent } from "@/components/LoaderComponent/LoaderComponent";
import BASE_URL from "@/config/BaseUrl";
import { ButtonConfig } from "@/config/ButtonConfig";

const formSchema = z.object({
  order_date: z.string(),
  order_retailer: z.string().min(1, "Retailer is required"),
  order_remarks: z.string(),
  order_status: z.string(),
});

const EditOrderForm = () => {
  const { id } = useParams();
 
  const navigate = useNavigate();
  const { toast } = useToast();
  const handleKeyDown = useNumericInput();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      order_date: moment().format("YYYY-MM-DD"),
      order_retailer: "",
      order_remarks: "",
      order_status: "Pending",
    },
  });

  const [itemEntries, setItemEntries] = useState([
    {
      id: "",
      order_sub_barcode: "",
      order_sub_quantity: "0",
    },
  ]);

  const { 
    data: orderById, 
    isFetching, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ["orderById", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-order-form-by-id/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: 0,
    cacheTime: 0,
  });

  useEffect(() => {
    if (orderById) {
      const { data: orderData, orderSub } = orderById;
      const formValues = {
        order_date: moment(orderData.order_date).format("YYYY-MM-DD"),
        order_retailer: orderData.order_retailer || "",
        order_remarks: orderData.order_remarks || "",
        order_status: orderData.order_status || "Pending",
      };
      form.reset(formValues);
      
      if (orderSub && orderSub.length > 0) {
        const mappedData = orderSub.map((sub) => ({
          id: sub.id || "",
          order_sub_barcode: sub.order_sub_barcode || "",
          order_sub_quantity: sub.order_sub_quantity?.toString() || "0",
        }));
        setItemEntries(mappedData);
      } else {
        setItemEntries([
          {
            id: "",
            order_sub_barcode: "",
            order_sub_quantity: "0",
          },
        ]);
      }
    }
  }, [orderById]);

  const handleItemChange = (index, field, value) => {
    const updatedEntries = [...itemEntries];
    updatedEntries[index][field] = value;
    setItemEntries(updatedEntries);
  };

  const addItemEntry = () => {
    setItemEntries([
      ...itemEntries,
      {
        id: "",
        order_sub_barcode: "",
        order_sub_quantity: "0",
      },
    ]);
  };


  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      return await axios.delete(`${BASE_URL}/api/delete-order-form-sub/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: (response) => {
     
      setItemEntries(prev => prev.filter(item => item.id !== itemToDelete));
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
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

  const confirmDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (itemToDelete && !deleteMutation.isPending) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  const removeItemEntry = (index) => {
    const item = itemEntries[index];
    
   
    if (item.id) {
      setItemToDelete(item.id);
      setDeleteConfirmOpen(true);
    } else {
   
      const updatedEntries = [...itemEntries];
      updatedEntries.splice(index, 1);
      setItemEntries(updatedEntries);
    }
  };

  const updateOrderMutation = useMutation({
    mutationFn: async (payload) => {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${BASE_URL}/api/update-order-form/${id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      navigate("/order-form");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const validateForm = (data) => {
    const formErrors = {
      retailer: !data.order_retailer ? "Retailer is required" : "",
    };

    const itemErrors = itemEntries.map((entry, index) => ({
      barcode: !entry.order_sub_barcode ? "Barcode is required" : "",
      quantity: !entry.order_sub_quantity
        ? "Quantity is required"
        : isNaN(entry.order_sub_quantity)
        ? "Quantity must be a number"
        : "",
    }));

    const hasFormErrors = Object.values(formErrors).some(err => err);
    const hasItemErrors = itemErrors.some(
      (err) => err.barcode || err.quantity
    );

    return { formErrors, itemErrors, hasFormErrors, hasItemErrors };
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = form.getValues();
    const { formErrors, itemErrors, hasFormErrors, hasItemErrors } = validateForm(formData);

    if (hasFormErrors || hasItemErrors) {
      toast({
        title: "Validation Errors",
        description: (
          <div className="w-full space-y-3 text-xs max-h-[60vh] overflow-y-auto">
            {hasFormErrors && (
              <div className="w-full">
                <div className="font-medium mb-2 text-white">Form Errors</div>
                <div className="w-full">
                  <table className="w-full border-collapse border border-red-200 rounded-md">
                    <thead>
                      <tr className="bg-red-50">
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-red-800 border-b border-red-200">
                          Field
                        </th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-red-800 border-b border-red-200">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {formErrors.retailer && (
                        <tr className="bg-white hover:bg-gray-50">
                          <td className="px-2 py-1.5 text-gray-600 border-b border-gray-200 font-medium">
                            Retailer
                          </td>
                          <td className="px-2 py-1.5 text-red-600 border-b border-gray-200 break-all">
                            {formErrors.retailer}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {hasItemErrors && (
              <div className="w-full">
                <div className="font-medium mb-2 text-white">Item Errors</div>
                <div className="w-full">
                  <table className="w-full border-collapse border border-red-200 rounded-md">
                    <thead>
                      <tr className="bg-red-50">
                        <th className="px-1.5 py-1.5 text-left text-xs font-medium text-red-800 border-b border-red-200 w-8">
                          #
                        </th>
                        <th className="px-1.5 py-1.5 text-left text-xs font-medium text-red-800 border-b border-red-200">
                          Barcode
                        </th>
                        <th className="px-1.5 py-1.5 text-left text-xs font-medium text-red-800 border-b border-red-200">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemErrors.map(
                        (error, i) =>
                          (error.barcode || error.quantity) && (
                            <tr key={i} className="bg-white hover:bg-gray-50">
                              <td className="px-1.5 py-1.5 text-center text-gray-600 border-b border-gray-200 font-medium">
                                {i + 1}
                              </td>
                              <td className="px-1.5 py-1.5 text-red-600 border-b border-gray-200 break-all">
                                {error.barcode}
                              </td>
                              <td className="px-1.5 py-1.5 text-red-600 font-mono text-right border-b border-gray-200 break-all">
                                {error.quantity}
                              </td>
                            </tr>
                          )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      });
      setIsSubmitting(false);
      return;
    }

    await onSubmit(formData);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        order_retailer: data.order_retailer,
        order_remarks: data.order_remarks,
        order_status: data.order_status,
        order_data: itemEntries.map(item => ({
          id: item.id,
          order_sub_barcode: item.order_sub_barcode,
          order_sub_quantity: item.order_sub_quantity,
        })),
      };
      
      updateOrderMutation.mutate(payload);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/order-form");
  };

  if (isFetching) {
    return <LoaderComponent name="Order Form Data" />;
  }
  
  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Order Form Data"
        refetch={refetch}
      />
    );
  }

  return (
    <Page>
      <div className="w-full p-0 md:p-0">
      
        

        <div className="sm:hidden">
        
          <div className=" border border-gray-200 rounded-lg bg-blue-50 shadow-sm p-2 mb-2">
            <div className="flex justify-between items-center mb-2">
              <button
                onClick={handleCancel}
                className="flex items-center text-blue-800"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                <h1 className="text-base font-bold">Edit Order</h1>
              </button>
            </div>
          </div>

          <div className="mb-14">
            <form onSubmit={handleFormSubmit} className="space-y-4">
      
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <h3 className="font-medium mb-3">Order Information</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="order_date">Date</Label>
                    <Input
                      id="order_date"
                      type="date"
                      {...form.register("order_date")}
                      className="mt-1"
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="order_retailer">Retailer <span className="text-xs text-red-400 ">*</span></Label>
                    <Input
                      id="order_retailer"
                      {...form.register("order_retailer")}
                      className="mt-1"
                      placeholder="Enter retailer name"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <Label htmlFor="order_remarks">Remarks</Label>
                    <Input
                      id="order_remarks"
                      {...form.register("order_remarks")}
                      className="mt-1"
                      placeholder="Enter remarks"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="order_status">Status</Label>
                    <SelectShadcn
                      id="order_status"
                      value={form.watch("order_status")}
                      onValueChange={(value) => form.setValue("order_status", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </SelectShadcn>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Items</h3>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={addItemEntry}
                    className={`h-8 px-2 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
                  >
                    <Plus className="h-4 w-4 " />
                    Add
                  </Button>
                </div>
                {itemEntries.map((entry, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-2 rounded-md border border-gray-200 mb-2"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      {itemEntries.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemEntry(index)}
                          className="h-6 w-6 p-0 text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor={`barcode-${index}`} className="text-xs">Barcode <span className="text-xs text-red-400 ">*</span></Label>
                        <Input
                          id={`barcode-${index}`}
                          type="text"
                          value={entry.order_sub_barcode}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "order_sub_barcode",
                              e.target.value
                            )
                          }
                          maxLength={20}
                          className="h-8 text-sm"
                          placeholder="Barcode"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`quantity-${index}`} className="text-xs">Quantity <span className="text-xs text-red-400 ">*</span></Label>
                        <Input
                          id={`quantity-${index}`}
                          type="tel"
                          value={entry.order_sub_quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "order_sub_quantity",
                              e.target.value
                            )
                          }
                          maxLength={10}
                          onKeyDown={handleKeyDown}
                          className="h-8 text-sm"
                          placeholder="Quantity"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            
              <div className="fixed bottom-0 left-0 right-0 bg-[#FDFBF7] border-t border-stone-200 p-2 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-semibold h-9 px-4 disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="hidden sm:block">
          {/* Desktop View */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    className="mr-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <CardTitle>Edit Order</CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Order Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="order_date">Date</Label>
                    <Input
                      id="order_date"
                      type="date"
                      {...form.register("order_date")}
                      className="bg-white"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order_retailer">Retailer <span className="text-xs text-red-400 ">*</span></Label>
                    <Input
                      id="order_retailer"
                      {...form.register("order_retailer")}
                      className="bg-white"
                      placeholder="Enter retailer name"
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order_remarks">Remarks</Label>
                    <Input
                      id="order_remarks"
                      {...form.register("order_remarks")}
                      className="bg-white"
                      placeholder="Enter remarks"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order_status">Status</Label>
                    <SelectShadcn
                      id="order_status"
                      value={form.watch("order_status")}
                      onValueChange={(value) => form.setValue("order_status", value)}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </SelectShadcn>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Items</h3>
                    <Button 
                      type="button" 
                      onClick={addItemEntry}
                      className={`flex items-center ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}` }
                    >
                      <Plus className="h-4 w-4 " />
                      Add Item
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium text-sm">Barcode <span className="text-xs text-red-400 ">*</span></th>
                          <th className="text-left p-2 font-medium text-sm">Quantity <span className="text-xs text-red-400 ">*</span></th>
                          <th className="text-left p-2 font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemEntries.map((entry, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">
                              <Input
                                type="text"
                                value={entry.order_sub_barcode}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "order_sub_barcode",
                                    e.target.value
                                  )
                                }
                                maxLength={20}
                                className="h-9"
                                placeholder="Barcode"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="tel"
                                value={entry.order_sub_quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "order_sub_quantity",
                                    e.target.value
                                  )
                                }
                                maxLength={10}
                                onKeyDown={handleKeyDown}
                                className="h-9"
                                placeholder="Quantity"
                              />
                            </td>
                            <td className="p-2">
                              {itemEntries.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItemEntry(index)}
                                  className="h-8 w-8 text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

             
                <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs font-semibold px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold shadow-sm transition-all px-5 disabled:opacity-50"
                  >
                    {isSubmitting ? "Updating..." : "Update Order"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the item from the order.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </Page>
  );
};

export default EditOrderForm;