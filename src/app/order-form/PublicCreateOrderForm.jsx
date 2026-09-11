import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { getTodayDate } from "@/utils/currentDate";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Plus,
  Trash2,
  Barcode,
  Keyboard,
  ArrowLeft,
  Scan,
  X,
  ScanQrCode,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import BASE_URL from "@/config/BaseUrl";
import { useMutation } from "@tanstack/react-query";
import { ButtonConfig } from "@/config/ButtonConfig";

const formSchema = z.object({
  order_retailer: z.string().min(1,"Retailer is required"),
  order_date: z.string().min(1, "Date is required"),
  order_remarks: z.string().optional(),

});

const PublicCreateOrderForm = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [items, setItems] = useState([]);
  const [scanningActive, setScanningActive] = useState(true);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [currentBarcode, setCurrentBarcode] = useState("");
  const [quantity, setQuantity] = useState(0);
  const barcodeInputRef = useRef(null);
  const mobileBarcodeInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  useEffect(() => {
    if (showResults && scanningActive && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [showResults, scanningActive]);
  useEffect(() => {
    if (barcodeModalOpen && quantityInputRef.current) {
      setTimeout(() => {
        quantityInputRef.current.focus();
      }, 100);
    }
  }, [barcodeModalOpen]);
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      order_retailer: "",
      order_date: getTodayDate(),
      order_remarks: "",
   
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      if (
        searchParams &&
        JSON.stringify(searchParams) === JSON.stringify(data)
      ) {
        toast({
          title: "Same search parameters",
          description:
            "You're already viewing results for these search criteria",
        });
        return;
      }
      setSearchParams(data);

      setTimeout(() => {
        setShowResults(true);
      }, 100);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process the request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

 
  
  const addItem = () => {
    setItems([...items, { id: Date.now(), barcode: "", quantity: 0 }]);
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleBarcodeScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const barcode = e.target.value.trim();
      if (barcode) {
 
        const emptyItem = items.find((item) => !item.barcode);
        if (emptyItem) {
          setCurrentBarcode(barcode);
          setQuantity(emptyItem.quantity);
          setBarcodeModalOpen(true);
          e.target.value = "";
          return;
        }

        setCurrentBarcode(barcode);
        const existingItem = items.find((item) => item.barcode === barcode);
        if (existingItem) {
          setQuantity(existingItem.quantity);
        } else {
          setQuantity(0);
        }
        setBarcodeModalOpen(true);
        e.target.value = "";
      }
    }
  };

  
  const handleQuantitySubmit = () => {
    if (!currentBarcode || quantity <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid barcode and quantity",
        variant: "destructive",
      });
      return;
    }
  
    const emptyItem = items.find((item) => !item.barcode);
    let newItemId;
  
    if (emptyItem) {
      const updatedItems = items.map((item) =>
        item.id === emptyItem.id ? { ...item, barcode: currentBarcode, quantity } : item
      );
      setItems(updatedItems);
      newItemId = emptyItem.id;
      toast({
        title: "Item Updated",
        description: `Updated empty item with barcode: ${currentBarcode}`,
      });
    } else {
      const existingItemIndex = items.findIndex(
        (item) => item.barcode === currentBarcode
      );
  
      if (existingItemIndex >= 0) {
        const updatedItems = [...items];
        updatedItems[existingItemIndex].quantity = quantity;
        setItems(updatedItems);
        newItemId = updatedItems[existingItemIndex].id;
        toast({
          title: "Quantity Updated",
          description: `Updated quantity for barcode: ${currentBarcode}`,
        });
      } else {
        const newItem = { id: Date.now(), barcode: currentBarcode, quantity };
        setItems([newItem, ...items]);
        newItemId = newItem.id;
        toast({
          title: "Item Added",
          description: `Added new item with barcode: ${currentBarcode}`,
        });
      }
    }
  
    setHighlightedItem(newItemId);
    setTimeout(() => {
      setHighlightedItem(null);
    }, 2000);
  
    setBarcodeModalOpen(false);
    setCurrentBarcode("");
    setQuantity(0);
  
    if (barcodeInputRef.current) {
      setTimeout(() => {
        barcodeInputRef.current.focus();
      }, 100);
    }
  };

  const handleBarcodeScanMobile = (result) => {
    if (result) {
 
      const emptyItem = items.find((item) => !item.barcode);
      if (emptyItem) {
        setCurrentBarcode(result);
        setQuantity(emptyItem.quantity);
        setBarcodeModalOpen(true);
        setShowScanner(false);
        return;
      }
   
      setCurrentBarcode(result);
      const existingItem = items.find((item) => item.barcode === result);
      if (existingItem) {
        setQuantity(existingItem.quantity);
        setHighlightedItem(existingItem.id);
        setTimeout(() => {
          setHighlightedItem(null);
        }, 2000);
      } else {
        setQuantity(0);
      }
      setBarcodeModalOpen(true);
      setShowScanner(false);
    }
  };
  const handleNumberClick = (num) => {
    if (quantity === "" || quantity === 0) {
      setQuantity(num);
    } else {
      const newValue = parseInt(quantity.toString() + num.toString());
      setQuantity(newValue);
    }
  };

  const handleQuantityChange = (value) => {
    if (typeof value === "string") {
      if (value === "") {
        setQuantity("");
        return;
      }

      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue >= 1) {
        setQuantity(numValue);
      }
    } else {
      setQuantity(value);
    }
  };

  const handleBackspace = () => {
    if (quantity === "" || quantity === 0) {
      setQuantity("");
    } else {
      const currentStr = quantity.toString();
      if (currentStr.length === 1) {
        setQuantity("");
      } else {
        const newValue = parseInt(currentStr.slice(0, -1));
        setQuantity(newValue);
      }
    }
  };

  const handleClear = () => {
    setQuantity("");
  };

  const incrementQuantity = () => {
    setQuantity((prev) => parseInt(prev || 0) + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 0) {
      setQuantity((prev) => parseInt(prev) - 1);
    }
  };
  const submitOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      
      const response = await fetch(`${BASE_URL}/api/create-order-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          
        },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error("Failed to create order");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.msg || 'Order created successfully',
        variant: "default",
      });
      setShowResults(false)
      setSearchParams(null);
      setItems([]);
   
    },
    onError: (error) => {
    
      toast({
        title: "Error",
        description: error.response.data.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });
  

  const handleSubmitOrder = () => {
    const emptySkuItem = items.find((item) => !item.barcode);
    if (emptySkuItem) {
      toast({
        title: "Empty SKU",
        description: "Please fill all SKU fields before submitting",
        variant: "destructive",
      });
      return;
    }
    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the order",
        variant: "destructive",
      });
      return;
    }
  
    const orderItems = items.map((item) => ({
      order_sub_barcode: item.barcode,
      order_sub_quantity: item.quantity,
    }));
  
    const orderData = {
      ...form.getValues(),
      order_data: orderItems,
    };
  
    try {
      submitOrderMutation.mutate(orderData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };
  
  const handleBackToForm = () => {
    setShowResults(false);
    
      setSearchParams(null);
      setItems([]);
     
   
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = items.length;

  return (
    <>
      <div className="w-full p-0 md:p-0">
        


        <div className="">
          <Card className="shadow-sm">
            {!showResults ? (
              <>
                <CardHeader className="bg-blue-50 rounded-t-lg">
                  <CardTitle>
                    
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={()=>navigate('/')}
                      className="mr-3"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    Order Form</CardTitle>
                  <CardDescription>
                    Create a new order by filling out the form below
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     
                      <div className="space-y-2">
  <Label htmlFor="order_retailer">Retailer <span className="text-red-700">*</span></Label>
  <Input
    id="order_retailer"
    placeholder="Enter retailer name"
    {...form.register("order_retailer")}
  />
  {form.formState.errors.order_retailer && (
    <p className="text-sm text-destructive">
      {form.formState.errors.order_retailer.message}
    </p>
  )}
</div>


                      <div className="space-y-2">
                        <Label htmlFor="order_date">Date</Label>
                        <Input
                          id="order_date"
                          type="date"
                          {...form.register("order_date")}
                        />
                        {form.formState.errors.order_date && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.order_date.message}
                          </p>
                        )}
                      </div>

                     

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="order_remarks">Remarks</Label>
                        <Textarea
                        
                          id="order_remarks"
                          rows={4} 
                          placeholder="Any special instructions"
                          {...form.register("order_remarks")}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
               className={` ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Order...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Generate Order
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </>
            ) : (
              <>
                <div className="lg:hidden overflow-hidden">
            
            <div className="sticky top-0 z-10 bg-blue-50 border-b border-gray-200 p-2 mb-2">
<div className="flex items-center justify-between mb-1">
  <div className="flex items-center">
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBackToForm}
      className="h-6 w-6 p-0 mr-1"
    >
      <ArrowLeft className="h-3 w-3" />
    </Button>
    <div className="min-w-0">
      <h1 className="text-sm font-semibold text-gray-800 truncate">
        Order Details
      </h1>
      <p className="text-xs text-gray-600 truncate">
{searchParams.order_retailer || "No retailer"} • {searchParams.order_date} 
</p>
    </div>
  </div>
  
  <div className="flex items-center space-x-1">
    <div className="text-right">
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium text-blue-800">{uniqueItems} sets</span>
        <span className="text-xs font-medium text-green-800">{totalItems} items</span>
      </div>
      <Badge
        variant={scanningActive ? "default" : "secondary"}
        className="text-xs h-4 mt-1"
      >
        {scanningActive ? (
          <div className="flex items-center">
            <div className="animate-pulse bg-white rounded-full h-1.5 w-1.5 mr-1"></div>
            Active
          </div>
        ) : (
          "Paused"
        )}
      </Badge>
    </div>
  </div>
</div>

<div className="bg-white p-1.5 rounded border border-gray-200 mt-1">
  <div className="flex items-center justify-between mb-1">
    <Label className="text-xs font-medium text-gray-700">SKU Scanner</Label>
    <div className="flex space-x-1">
    
      <Button
        variant={scanningActive ? "outline" : "default"}
        size="sm"
        onClick={() => setScanningActive(!scanningActive)}
        className="h-6 px-1"
      >
        {scanningActive ? (
          <X className="h-3 w-3" />
        ) : (
          <Scan className="h-3 w-3" />
        )}
      </Button>
    </div>
  </div>
  
  <Input
    ref={mobileBarcodeInputRef}
    placeholder="Enter SKU..."
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const barcode = e.target.value.trim();
        if (barcode) {
          handleBarcodeScanMobile(barcode);
          e.target.value = "";
        }
      }
    }}
    className="h-7 text-xs"
    disabled={!scanningActive}
  />
  
  <p className="text-[10px] text-muted-foreground mt-1 truncate">
    {scanningActive
      ? "Scan or type SKU and press Enter"
      : "Activate scanning to add items"}
  </p>
</div>
</div>

            <div className="mb-1 border-2  p-2">
              

              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-blue-800">
                  Order Items
                </h3>
                <Button onClick={addItem} size="sm"
                
              
                className={`h-7 text-xs ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor} `}>
                  <Plus className=" h-3 w-3" />
                  Add
                </Button>
              </div>

              {items.length > 0 ? (
                <>
                <div className="space-y-2  overflow-y-auto h-96">
                  {items.slice().reverse().map((item, index) => (
                    <div
                    key={item.id}
                    id={`item-${item.id}`}
                    className={`bg-white p-2 rounded-md border border-gray-200 transition-colors duration-200 ${
                      highlightedItem === item.id ? 'bg-blue-100 border-2 border-blue-600' : ''
                    }`}
                    >
                      <div className="grid grid-cols-12 gap-1 items-center">
                        <div className="col-span-1 text-xs text-gray-500 text-center">
                        {items.length - index}
                        </div>
                        <div className="col-span-7">
                          <Input
                            value={item.barcode}
                            onChange={(e) =>
                              updateItem(item.id, "barcode", e.target.value)
                            }
                            placeholder="SKU"
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="tel"
                            min="0"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="h-6 w-6 hover:bg-red-100 text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
            </>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 border border-dashed rounded-lg bg-gray-50">
                  <div className="bg-gray-100 p-2 rounded-full mb-2">
                    <Search className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    No items added yet
                  </p>
                  <Button onClick={addItem} size="sm" className={`h-7 text-xs ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}>
                    <Plus className=" h-3 w-3" />
                    Add Item
                  </Button>
                </div>
              )}
            </div>

            <div className="fixed bottom-0 left-0 md:left-12 right-0 bg-white border-t border-gray-200 p-2 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToForm}
                className="border-gray-300 hover:bg-gray-100 text-xs h-9"
              >
                Back
              </Button>
              <Button
              
                variant="default"
                onClick={() => setShowScanner(true)}
                disabled={!scanningActive}
                className={`border-gray-300 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor} text-xs h-9`}
              >
               <ScanQrCode className="h-3 w-3" />
              </Button>

              
              <Button
                onClick={handleSubmitOrder}
                disabled={items.length === 0 || submitOrderMutation.isPending}
                className={`${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor} disabled:bg-gray-400 text-xs h-9`}
              >
               {submitOrderMutation.isPending ? "Submitting..." : "Submit "}
              </Button>
            </div>
          </div>










          <div className="hidden lg:block overflow-hidden">
  <CardHeader className="pb-2 bg-blue-50 rounded-t-lg">
    <div className="flex items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBackToForm}
        className="mr-2 h-7"
      >
        <ArrowLeft className="h-3 w-3" />
      </Button>
      <div>
        <CardTitle className="text-base">Order Details</CardTitle>
      </div>
    </div>
  </CardHeader>

  <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)]">

    <div className="lg:w-1/3 border-r p-3 bg-blue-50 flex flex-col">
      <div className="space-y-2 flex-grow">
        <div className="grid grid-cols-4 items-center gap-1">
          <h3 className="text-xs font-medium text-muted-foreground col-span-1">Retailer:</h3>
          <p className="text-xs font-medium col-span-3 truncate">{searchParams.order_retailer || "Not specified"}</p>
        </div>

        <div className="grid grid-cols-4 items-center gap-1">
          <h3 className="text-xs font-medium text-muted-foreground col-span-1">Date:</h3>
          <p className="text-xs col-span-3">{searchParams.order_date}</p>
        </div>

        <div className="grid grid-cols-4 gap-1">
          <h3 className="text-xs font-medium text-muted-foreground col-span-1">Remarks:</h3>
          <p className="text-xs col-span-3 line-clamp-2">{searchParams.order_remarks || "Not specified"}</p>
        </div>
        
       
        <div className="pt-1">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-medium">SKU Scanning</h3>
            <div className="flex items-center gap-1">
              <Badge variant={scanningActive ? "default" : "secondary"} className="text-xs h-5">
                {scanningActive ? (
                  <div className="flex items-center">
                    <div className="animate-pulse bg-white rounded-full h-1.5 w-1.5 mr-1"></div>
                    Active
                  </div>
                ) : (
                  "Paused"
                )}
              </Badge>

              <Button
                variant={scanningActive ? "outline" : "default"}
                size="sm"
                onClick={() => setScanningActive(!scanningActive)}
                className={`h-5 px-2 text-xs ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
              >
                {scanningActive ? (
                  <X className="h-3 w-3" />
                ) : (
                  <Scan className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-red-100/50  p-2 rounded-md">
            <Label className="text-xs font-medium">SKU Scanner</Label>
            <div className="flex gap-1 mt-1">
              <Input
                ref={barcodeInputRef}
                placeholder="Scan or enter SKU..."
                onKeyDown={handleBarcodeScan}
                className="flex-1 h-7 text-xs"
                disabled={!scanningActive}
              />
              <Button
                onClick={() => {
                  if (barcodeInputRef.current) {
                    barcodeInputRef.current.focus();
                  }
                }}
                disabled={!scanningActive}
                className={`h-7 px-2 text-xs ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
              >
                <Scan className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {scanningActive
                ? "Scan SKU or type and press Enter"
                : "Activate scanning to add items"}
            </p>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <Card className="mt-3">
        <CardHeader className="py-2 px-3 bg-blue-100">
          <CardTitle className="text-xs">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-3">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Total Sets</span>
              <span className="text-xs font-medium">{uniqueItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Total Items</span>
              <span className="text-xs font-medium">{totalItems}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="py-2 px-3">
          <Button
            onClick={handleSubmitOrder}
            disabled={items.length === 0 || submitOrderMutation.isPending}
            className={`w-full h-7 text-xs ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor} disabled:bg-gray-400`}
          >
            {submitOrderMutation.isPending ? "Submitting..." : "Submit Order"}
          </Button>
        </CardFooter>
      </Card>
    </div>

  
    <div className="lg:w-2/3 p-3 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <CardTitle className="text-base">Order Items</CardTitle>
        <Button
          onClick={addItem}
          size="sm"
          className={`h-7 text-xs ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Item
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="flex-grow overflow-auto" >
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow className="bg-blue-50 hover:bg-blue-50">
                <TableHead className="w-10 py-1 text-xs">#</TableHead>
                <TableHead className="py-1 text-xs">SKU</TableHead>
                <TableHead className="w-24 py-1 text-xs">Quantity</TableHead>
                <TableHead className="w-12 py-1 text-xs"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.slice().reverse().map((item, index) => (
                <TableRow  key={item.id} 
                id={`item-${item.id}`}
                className={`h-10  transition-colors duration-200 ${
                  highlightedItem === item.id ? ' bg-red-300' : ''
                }`}>
                 <TableCell className="py-1 text-xs text-center">
      {items.length - index}
    </TableCell>
                  <TableCell className="py-1">
                    <Input
                      value={item.barcode}
                      onChange={(e) =>
                        updateItem(item.id, "barcode", e.target.value)
                      }
                      placeholder="Enter SKU"
                      className="h-7 text-xs"
                    />
                  </TableCell>
                  <TableCell className="py-1">
                    <Input
                      type="tel"
                      min="0"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="h-7 text-xs"
                    />
                  </TableCell>
                  <TableCell className="py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-6 w-6 hover:bg-red-100 text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full border border-dashed rounded-lg bg-gray-50 p-4">
          <div className="bg-gray-100 p-2 rounded-full mb-2">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-xs text-gray-500 mb-2 text-center">No items added yet</p>
          <Button
            onClick={addItem}
            className={`h-7 text-xs ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add First Item
          </Button>
        </div>
      )}
    </div>
  </div>
</div>
              </>
            )}
          </Card>
        </div>
      </div>
      {/* quantity dialog  */}
      <Dialog open={barcodeModalOpen} onOpenChange={setBarcodeModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter Quantity</DialogTitle>
            <DialogDescription>
              Please specify the quantity for sku:{" "}
              <span className="font-semibold">{currentBarcode}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center space-x-2 py-4">
            <Button
              variant="outline"
              size="icon"
              onClick={decrementQuantity}
              className="h-12 w-12 text-xl"
              disabled={quantity <= 1}
            >
              -
            </Button>

            <div className="flex flex-col items-center">
              <Input
                ref={quantityInputRef}
                type="text"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-24 h-12 text-center text-xl"
                readOnly={isMobile}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleQuantitySubmit();
                  }
                }}
              />
              <span className="text-xs text-muted-foreground mt-1">
                Quantity
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={incrementQuantity}
              className="h-12 w-12 text-xl"
            >
              +
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                variant="outline"
                onClick={() => handleNumberClick(num)}
                className="h-10"
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => handleNumberClick(0)}
              className="h-10"
            >
              0
            </Button>
            <Button
              variant="outline"
              onClick={handleBackspace}
              className="h-10"
            >
              ⌫
            </Button>
            <Button variant="outline" onClick={handleClear} className="h-10">
              Clear
            </Button>
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBarcodeModalOpen(false)}
              className="border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleQuantitySubmit}
              className="bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-semibold shadow-sm transition-all px-4"
            >
              {items.find(item => item.barcode === currentBarcode) ? "Update Order" : "Add to Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* mobile scanner  */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-xs w-[92vw] p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>Scan Barcode</DialogTitle>
            <DialogDescription>
              Point your camera at a barcode to scan
            </DialogDescription>
          </DialogHeader>
          <div className="h-48 relative">
          
<Scanner
  onScan={(detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const result = detectedCodes[0].rawValue;
     
      setTimeout(() => {
        handleBarcodeScanMobile(result);
      }, 100);
    }
  }}
  onError={(error) => {
    console.log(error?.message);
    toast({
      title: "Scan Error",
      description: error?.message || "Failed to scan barcode",
      variant: "destructive",
    });
  }}
  formats={[
    "qr_code",
    "code_128",
    "code_39",
    "code_93",
    "codabar",
    "ean_13",
    "ean_8",
    "upc_a",
    "upc_e",
    "itf",
  ]}
  constraints={{
    facingMode: "environment", 
    aspectRatio: 1, 
  }}
  styles={{
    container: {
      borderRadius: '8px',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '280px',
      margin: '0 auto',
    },
    video: {
      objectFit: 'cover',
      maxHeight: '192px',
    }
  }}
/>
          </div>
          <DialogFooter className="px-4 pb-4">
            <Button variant="secondary" onClick={() => setShowScanner(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PublicCreateOrderForm;