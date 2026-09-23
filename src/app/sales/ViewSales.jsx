import React, { useEffect, useRef, useState } from "react";
import Page from "../dashboard/page";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import moment from "moment";
import ReactToPrint from "react-to-print";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ButtonConfig } from "@/config/ButtonConfig";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import BASE_URL from "@/config/BaseUrl";


const printStyles = `
@media print {
  body {
    font-size: 8.5pt;
    line-height: 1.2;
    margin: 0;
    padding: 0;
  }
  @page {
    size: A4 landscape;
    margin: 4mm 3mm;
  }
  .print-container {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    width: 100% !important;
    max-width: 297mm !important; /* A4 landscape width */
    margin: 0 auto !important;
    padding: 0 !important;
    border: none !important;
  }
  .copy-wrapper {
    width: 48.5% !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .copy-heading {
    text-align: center !important;
    font-size: 10.5pt !important;
    font-weight: 700 !important;
    color: #1d4ed8 !important;
    margin-bottom: 2mm !important;
    letter-spacing: 0.5px !important;
  }
  .copy {
    width: 100% !important;
    border: 0.1px solid #000 !important;
    padding: 3.5mm 4mm !important;
    box-sizing: border-box !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin-bottom: 4px !important;
    font-size: 8pt !important;
  }
  table, th, td {
    border: 0.1px solid #000 !important;
    border-width: 0.1px !important;
  }
  th, td {
    padding: 2px 4px !important;
    line-height: 1.1 !important;
    vertical-align: middle !important;
    font-size: 8pt !important;
  }
  thead {
    background-color: #f0f0f0 !important;
    -webkit-print-color-adjust: exact !important;
  }
  .order-summary-footer {
    font-size: 8pt !important;
    margin-top: 4px !important;
    padding-top: 3px !important;
  }
  .font-semibold {
    font-weight: 600;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
}
`;
const ViewSales = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const componentRef = useRef(null);
    const navigate = useNavigate();

  
  
   
  useEffect(() => {
      // Add print styles to document head
      const styleSheet = document.createElement("style");
      styleSheet.type = "text/css";
      styleSheet.innerText = printStyles;
      document.head.appendChild(styleSheet);
      
      // Cleanup on unmount
      return () => {
        document.head.removeChild(styleSheet);
      }
    }, []);

    const { data, isLoading, isError, refetch } = useQuery({
      queryKey: ["salesPackingListView", id],
      queryFn: async () => {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${BASE_URL}/api/fetch-work-order-sales-view-by-id/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const workOrder = response.data.workordersales || {};

        let rawSub = [];
        if (Array.isArray(response.data)) {
          rawSub = response.data;
        } else if (response.data && typeof response.data === "object") {
          const allArrays = Object.values(response.data).filter(Array.isArray);

          // Find the array whose items contain work_order_sub_brand or finished_stock_amount
          const richArray = allArrays.find((arr) =>
            arr.some(
              (item) =>
                item &&
                (item.work_order_sub_brand ||
                  item.finished_stock_amount !== undefined)
            )
          );

          if (richArray && richArray.length > 0) {
            rawSub = richArray;
          } else {
            rawSub =
              response.data.workordersalessubNew ||
              response.data.workordersalessub_new ||
              response.data.workordersalessub ||
              response.data.workordersales_sub ||
              response.data.workorder_sub_sa_data ||
              response.data.data ||
              allArrays.find((arr) => arr.length > 0) ||
              [];
          }
        }

        const enrichedSub = rawSub.map((item) => {
          const brand =
            item.work_order_sub_brand ||
            item.brand ||
            item.brand_name ||
            item.work_order_sa_brand ||
            workOrder.work_order_sa_brand ||
            workOrder.brand_name ||
            "N/A";

          const mrp =
            item.finished_stock_amount !== undefined &&
            item.finished_stock_amount !== null &&
            item.finished_stock_amount !== ""
              ? item.finished_stock_amount
              : item.amount ||
                item.mrp ||
                item.rate ||
                item.price ||
                workOrder.finished_stock_amount ||
                workOrder.amount ||
                "-";

          const count = Number(
            item.count !== undefined && item.count !== null
              ? item.count
              : item.total_count || item.pcs || item.quantity || 1
          );

          return {
            ...item,
            work_order_sub_brand: brand,
            finished_stock_amount: mrp,
            brand,
            mrp,
            count,
          };
        });

        // Group by brand + mrp
        const aggregatedMap = new Map();
        enrichedSub.forEach((item) => {
          const key = `${item.brand}___${item.mrp}`;
          if (aggregatedMap.has(key)) {
            const existing = aggregatedMap.get(key);
            existing.count += item.count;
          } else {
            aggregatedMap.set(key, { ...item });
          }
        });

        const finalSub = Array.from(aggregatedMap.values());

        return {
          workOrder,
          workOrderSub: finalSub.length > 0 ? finalSub : enrichedSub,
          workOrderFooter: response.data.workordersalesfooter || {},
          workOrderDataMin: response.data.closest_min_combo || "",
          workOrderDataMax: response.data.closest_max_combo || "",
        };
      },
    });
    if (isLoading) {
      return <LoaderComponent name="Work Order Sales Data" />;
    }
  
    if (isError) {
      return (
        <ErrorComponent
          message="Error Fetching Work Order Sales Data"
          refetch={refetch}
        />
      );
    }
    const { workOrder = {}, workOrderSub = [], workOrderFooter = {} } = data || {};
  
   
  
  return (
   <Page>
      <div className="max-w-full mx-auto">
              <Card className="shadow-lg border border-stone-200/80 rounded-2xl overflow-hidden">
                <CardHeader className="border-b bg-[#FDFBF7] py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center justify-between w-full gap-4">
                      <CardTitle className="text-lg font-bold text-stone-900 tracking-tight">
                        Sales Packing List View
                      </CardTitle>
                    </div>
                    
                    <ReactToPrint
                      trigger={() => (
                        <Button variant="outline" size="sm" asChild>
                          <div className="flex items-center gap-2 cursor-pointer bg-white hover:bg-stone-50 border-stone-200 text-stone-700 font-semibold rounded-xl ml-4">
                            <Printer className="h-4 w-4 text-[#543D2B]" />
                            Print
                          </div>
                        </Button>
                      )}
                      content={() => componentRef.current}
                    />
                  </div>
                </CardHeader>
     
                <CardContent className="p-6 bg-white">
                  <div
                    ref={componentRef}
                    className="print-container bg-white flex flex-col print:flex-row print:justify-between gap-6 print:gap-4"
                  >
                    {/* Copy 1 - Shown on Screen (Full Width) and in Print (Left Column) */}
                    <div className="copy-wrapper w-full print:w-[48.5%] flex flex-col">
                      {/* Sales Packing List Centered Heading */}
                      <div className="copy-heading text-center mb-5 print:mb-2">
                        <span className="inline-block bg-[#E5D7C3] text-[#543D2B] px-8 py-2 print:py-1 rounded-xl font-extrabold text-lg print:text-base tracking-widest uppercase shadow-2xs border border-[#D8C7B0]">
                          Sales Packing List
                        </span>
                      </div>

                      {/* Content Area / Box */}
                      <div className="copy border border-stone-200 print:border print:border-black relative flex flex-col justify-between p-4 print:p-[3.5mm_4mm] rounded-2xl print:rounded-none bg-[#FDFBF7]/50 print:bg-white">
                        <div>
                          {/* Header Details: Name & Code on left, Ref Number & Date on right */}
                          <div className="flex justify-between items-start mb-5 print:mb-4 text-sm">
                            <div className="space-y-1">
                              <p className="font-bold text-stone-900">
                                <span className="text-stone-500 font-medium">Name:</span>{" "}
                                {workOrder.work_order_sa_retailer_name || "N/A"}
                              </p>
                              {workOrder.company_code && (
                                <p className="text-stone-700 font-semibold">
                                  <span className="text-stone-500 font-medium">Code:</span> {workOrder.company_code}
                                </p>
                              )}
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-bold text-stone-900">
                                <span className="text-stone-500 font-medium">Ref Number:</span>{" "}
                                <span className="text-[#543D2B] font-mono font-bold bg-[#E5D7C3]/50 px-2 py-0.5 rounded-lg border border-[#D8C7B0]/60">
                                  {workOrder.work_order_sa_ref}
                                </span>
                              </p>
                              <p className="text-stone-700 font-medium">
                                <span className="text-stone-500 font-medium">Date:</span>{" "}
                                {moment(workOrder.work_order_sa_date).format(
                                  "DD/MM/YYYY"
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Items Table */}
                          <div className="overflow-hidden rounded-xl border border-stone-200 print:rounded-none print:border-black">
                            <table className="w-full mb-0">
                              <thead className="bg-[#E5D7C3] text-[#543D2B] print:bg-[#E5D7C3]">
                                <tr>
                                  <th className="border-b border-stone-200 print:border p-2.5 print:p-1 text-center font-bold text-xs uppercase tracking-wider">Brand</th>
                                  <th className="border-b border-stone-200 print:border p-2.5 print:p-1 text-center font-bold text-xs uppercase tracking-wider">Mrp (₹)</th>
                                  <th className="border-b border-stone-200 print:border p-2.5 print:p-1 text-center font-bold text-xs uppercase tracking-wider">No of Pieces</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-stone-100">
                                {workOrderSub && workOrderSub.length > 0 ? (
                                  workOrderSub.map((item, index) => (
                                    <tr key={index} className="text-center hover:bg-stone-50/70 transition-colors">
                                      <td className="border-stone-200 print:border p-2.5 print:p-1 text-stone-800 font-medium text-sm">
                                        {item.work_order_sub_brand ||
                                          item.brand ||
                                          item.brand_name ||
                                          item.work_order_sa_brand ||
                                          workOrder.work_order_sa_brand ||
                                          workOrder.brand_name ||
                                          "N/A"}
                                      </td>
                                      <td className="border-stone-200 print:border p-2.5 print:p-1 text-stone-800 font-mono font-semibold text-sm">
                                        {item.finished_stock_amount !== undefined && item.finished_stock_amount !== null && item.finished_stock_amount !== ""
                                          ? item.finished_stock_amount
                                          : item.mrp ||
                                            item.amount ||
                                            "-"}
                                      </td>
                                      <td className="border-stone-200 print:border p-2.5 print:p-1 font-bold text-stone-900 text-sm">
                                        {item.count !== undefined && item.count !== null
                                          ? item.count
                                          : item.pcs || 1}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr className="text-center hover:bg-stone-50/70 transition-colors">
                                    <td className="border-stone-200 print:border p-2.5 print:p-1 text-stone-800 font-medium text-sm">
                                      {workOrder.work_order_sa_brand ||
                                        workOrder.work_order_sa_fabric_sale ||
                                        workOrder.brand_name ||
                                        "N/A"}
                                    </td>
                                    <td className="border-stone-200 print:border p-2.5 print:p-1 text-stone-800 font-mono font-semibold text-sm">
                                      {workOrder.finished_stock_amount ||
                                        workOrder.amount ||
                                        workOrder.mrp ||
                                        "-"}
                                    </td>
                                    <td className="border-stone-200 print:border p-2.5 print:p-1 font-bold text-stone-900 text-sm">
                                      {workOrderFooter.total_received ||
                                        workOrder.work_order_sa_pcs ||
                                        0}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Order Summary Footer - Outside the Box */}
                      <div className="order-summary-footer mt-4 print:mt-2 pt-3 print:pt-1 border-t border-stone-200 print:border-t-0 flex items-center gap-6 flex-wrap text-sm text-stone-800">
                        <span className="font-bold text-stone-900 bg-[#E5D7C3]/60 px-3 py-1 rounded-lg border border-[#D8C7B0]/60">
                          Order Summary
                        </span>
                        <span>
                          <strong className="text-stone-900">Total Pieces:</strong>{" "}
                          <span className="font-bold text-[#543D2B]">
                            {workOrderFooter.total_received ||
                              workOrder.work_order_sa_pcs ||
                              0}
                          </span>
                        </span>
                        <span>
                          <strong className="text-stone-900">Remarks:</strong>{" "}
                          {workOrder.work_order_sa_remarks ||
                            "No additional remarks"}
                        </span>
                      </div>
                    </div>

                    {/* Copy 2 - Hidden on Screen, Shown only in Print (Right Column) */}
                    <div className="copy-wrapper hidden print:flex print:w-[48.5%] flex-col">
                      {/* Sales Packing List Centered Heading Outside the Box */}
                      <div className="copy-heading text-center mb-2">
                        <span className="inline-block bg-[#E5D7C3] text-[#543D2B] px-6 py-1 rounded font-bold text-base tracking-wide uppercase">
                          Sales Packing List
                        </span>
                      </div>

                      {/* Box Content */}
                      <div className="copy border border-black relative flex flex-col justify-between p-[3.5mm_4mm] rounded-sm">
                        <div>
                          {/* Header Details: Name & Code on left, Ref Number & Date on right */}
                          <div className="flex justify-between items-start mb-4 text-sm">
                            <div>
                              <p className="font-semibold text-gray-800">
                                <strong>Name:</strong>{" "}
                                {workOrder.work_order_sa_retailer_name || "N/A"}
                              </p>
                              {workOrder.company_code && (
                                <p className="text-gray-700">
                                  <strong>Code:</strong> {workOrder.company_code}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                Ref Number:{" "}
                                <span className="text-[#543D2B] font-mono font-bold">
                                  {workOrder.work_order_sa_ref}
                                </span>
                              </p>
                              <p>
                                Date:{" "}
                                {moment(workOrder.work_order_sa_date).format(
                                  "DD/MM/YYYY"
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Table without Total column */}
                          <table className="w-full mb-0">
                            <thead className="bg-[#E5D7C3] text-[#543D2B]">
                              <tr>
                                <th className="border p-2 text-center font-bold">Brand</th>
                                <th className="border p-2 text-center font-bold">Mrp (₹)</th>
                                <th className="border p-2 text-center font-bold">No of Pieces</th>
                              </tr>
                            </thead>
                            <tbody>
                              {workOrderSub && workOrderSub.length > 0 ? (
                                workOrderSub.map((item, index) => (
                                  <tr key={index} className="text-center">
                                    <td className="border p-2">
                                      {item.work_order_sub_brand ||
                                        item.brand ||
                                        item.brand_name ||
                                        item.work_order_sa_brand ||
                                        workOrder.work_order_sa_brand ||
                                        workOrder.brand_name ||
                                        "N/A"}
                                    </td>
                                    <td className="border p-2">
                                      {item.finished_stock_amount !== undefined && item.finished_stock_amount !== null && item.finished_stock_amount !== ""
                                        ? item.finished_stock_amount
                                        : item.mrp ||
                                          item.amount ||
                                          "-"}
                                    </td>
                                    <td className="border p-2">
                                      {item.count !== undefined && item.count !== null
                                        ? item.count
                                        : item.pcs || 1}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr className="text-center">
                                  <td className="border p-2">
                                    {workOrder.work_order_sa_brand ||
                                      workOrder.work_order_sa_fabric_sale ||
                                      workOrder.brand_name ||
                                      "N/A"}
                                  </td>
                                  <td className="border p-2">
                                    {workOrder.finished_stock_amount ||
                                      workOrder.amount ||
                                      workOrder.mrp ||
                                      "-"}
                                  </td>
                                  <td className="border p-2">
                                    {workOrderFooter.total_received ||
                                      workOrder.work_order_sa_pcs ||
                                      0}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Order Summary Footer - Outside the Box */}
                      <div className="order-summary-footer mt-2 pt-1 flex items-center gap-6 flex-wrap text-sm">
                        <span className="font-bold text-gray-900">
                          Order Summary:
                        </span>
                        <span>
                          <strong>Total Pieces:</strong>{" "}
                          {workOrderFooter.total_received ||
                            workOrder.work_order_sa_pcs ||
                            0}
                        </span>
                        <span>
                          <strong>Remarks:</strong>{" "}
                          {workOrder.work_order_sa_remarks ||
                            "No additional remarks"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
             </Card>
           </div>
   </Page>
  )
}

export default ViewSales