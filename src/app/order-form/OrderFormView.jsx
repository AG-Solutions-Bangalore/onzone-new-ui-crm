import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { ChevronLeft, Barcode, Printer } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Page from "@/app/dashboard/page";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import BASE_URL from "@/config/BaseUrl";
import axios from "axios";
import { ErrorComponent, LoaderComponent } from "@/components/LoaderComponent/LoaderComponent";
import ReactToPrint, { useReactToPrint } from "react-to-print";

const OrderFormView = () => {
  const {id} = useParams()
  const { toast } = useToast();
  const navigate = useNavigate();
   const orderRef = useRef(null);

  const {
    data: orderformdata,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["orderformdata", id],
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
  });
  const OrderPrint = useReactToPrint({
    content: () => orderRef.current,
    documentTitle: "order-report",
    pageStyle: `
      @page {
      size: auto;
 margin: 3mm 3mm 3mm 3mm;
        border: 0px solid black;
      
    }
    @media print {
      body {
        border: 0px solid red;
        margin: 1mm;
        padding: 1mm 1mm 1mm 1mm;
        min-height: 100vh;
      }
      .print-hide {
        display: none;
      }
     
    }
    `,
  });
  
  const totalItems = orderformdata?.orderSub?.reduce((sum, item) => sum + parseFloat(item.order_sub_quantity), 0) || 0;
  const uniqueItems = orderformdata?.orderSub?.length || 0;


  if (isLoading) {
    return <LoaderComponent name="Order View Form Data" />;
  }


  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Order View Form Data"
        refetch={refetch}
      />
    );
  }

  return (
    <Page>
      <div className="w-full p-0 md:p-0">
        <div className="sm:hidden">
          <div className="sticky top-0 z-10 border border-gray-200 rounded-lg bg-blue-50 shadow-sm p-0 mb-2">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 p-2">
                  <button
                    onClick={() => navigate("/order-form")}
                    className="rounded-full p-1"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h1 className="text-base font-bold text-gray-800">
                    Order Details
                  </h1>
                </div>
               
              <button
              onClick={OrderPrint}
                className={`sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm p-3 rounded-b-md`}
              >
                <Printer className="h-4 w-4" />
              </button>
          
        
              </div>
            </div>
          </div>

          {orderformdata && (
            <div className="p-2" >
              <div className="text-center font-semibold text-sm mb-2">
                ORDER FORM
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex justify-center border p-1">
                  <span className="font-medium">Date:</span>{" "}
                  <span className="ml-1">
                    {moment(orderformdata.data.order_date).format("DD-MMM-YYYY")}
                  </span>
                </div>
                <div className="flex justify-center border p-1">
                  <span className="font-medium">Ref No:</span>{" "}
                  <span className="ml-1">
                    {orderformdata.data.order_ref || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="border p-2 text-xs mb-3">
                <span className="font-semibold">Retailer:</span>{" "}
                <span>{orderformdata.data.order_retailer || 'Not specified'}</span>
              </div>

              <div className="border p-2 text-xs mb-3">
                <span className="font-semibold">Remarks:</span>{" "}
                <span>{orderformdata.data.order_remarks || 'Not specified'}</span>
              </div>

              <table className="w-full border-collapse text-xs mb-3">
                <thead>
                  <tr className="bg-[#E5D7C3] text-[#543D2B]">
                    <th className="border border-stone-300 p-2 text-left font-bold uppercase tracking-wider">Sl No</th>
                    <th className="border border-stone-300 p-2 text-left font-bold uppercase tracking-wider">SKU</th>
                    <th className="border border-stone-300 p-2 text-right font-bold uppercase tracking-wider">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {orderformdata.orderSub.map((item, index) => (
                    <tr
                      key={item.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="border p-1 text-left">{index + 1}</td>
                      <td className="border p-1 text-left">
                        <div className="flex items-center">
                          {item.order_sub_barcode}
                        </div>
                      </td>
                      <td className="border p-1 text-right">{item.order_sub_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

           
              <table className="w-full border-collapse text-xs">
                <tbody>
                  <tr className="font-bold">
                    <td className="border p-1 text-right">Total Sets</td>
                    <td className="border p-1 text-right">{uniqueItems}</td>
                  </tr>
                  <tr className="font-bold">
                    <td className="border p-1 text-right">Total Items</td>
                    <td className="border p-1 text-right">{totalItems}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="hidden sm:block">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/order-form")}
                    className="rounded-full"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <CardTitle className="text-xl">Order Details</CardTitle>
                </div>
             
                                    <Button
                                    onClick={OrderPrint}
                                    variant="outline" size="sm">
                                      <Printer className="mr-2 h-4 w-4" />
                                      Print
                                    </Button>
                                
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto" ref={orderRef}>
                <div className="text-center border-l border-t border-r p-4 space-y-1">
                  <h3 className="text-2xl font-semibold">ORDER FORM</h3>
                </div>

                <div className="grid grid-cols-2 border m-0">
                  <div className="flex items-center justify-center border-r border-gray-300 py-2 px-3">
                    <span className="font-medium">Date:</span>
                    <span className="ml-1">
                      {moment(orderformdata.data.order_date).format("DD-MMM-YYYY")}
                    </span>
                  </div>
                  <div className="flex items-center justify-center py-2 px-3">
                    <span className="font-medium">Ref No:</span>
                    <span className="ml-1">
                      {orderformdata.data.order_ref || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="border-l border-r p-2">
                  <span className="font-semibold">Retailer:</span>{" "}
                  <span>{orderformdata.data.order_retailer || 'Not specified'}</span>
                </div>

                <div className="border-l border-r p-2">
                  <span className="font-semibold">Remarks:</span>{" "}
                  <span>{orderformdata.data.order_remarks || 'Not specified'}</span>
                </div>

                <Table className="border">
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100">
                      <TableHead className="text-center  text-black font-bold border-r">
                        Sl No
                      </TableHead>
                      <TableHead className="text-center text-black font-bold border-r">
                        SKU
                      </TableHead>
                      <TableHead className="text-center text-black font-bold">
                        Quantity
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderformdata.orderSub.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-white "}
                      >
                        <TableCell className="text-center border-r">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-center border-r">
                          <div className="flex items-center justify-center">
                            {item.order_sub_barcode}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.order_sub_quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="font-bold">
                      <TableCell
                        colSpan={2}
                        className="text-right bg-white font-medium border-r"
                      >
                        Total Sets
                      </TableCell>
                      <TableCell className="text-right bg-white">
                        {uniqueItems}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold">
                      <TableCell
                        colSpan={2}
                        className="text-right bg-white font-medium border-r border-b"
                      >
                        Total Items
                      </TableCell>
                      <TableCell className="text-right bg-white border-b">
                        {totalItems}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Page>
  );
};

export default OrderFormView;