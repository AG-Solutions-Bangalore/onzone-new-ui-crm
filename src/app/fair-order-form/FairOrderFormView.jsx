import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import moment from "moment";
import { ChevronLeft, Printer, Download } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import html2pdf from "html2pdf.js";

import { Button } from "@/components/ui/button";
import Page from "@/app/dashboard/page";
import BASE_URL from "@/config/BaseUrl";
import {
  LoaderComponent,
  ErrorComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import { useToast } from "@/hooks/use-toast";

const SIZE_SUB_LABELS = {
  "28": "28",
  "30": "30",
  "32": "32",
  "34": "34",
  "36": "S/36",
  "38": "M/38",
  "40": "L/40",
  "42": "XL/42",
  "44": "2XL/44",
  "46": "3XL/46",
  "48": "4XL/48",
  "50": "5XL/50",
};

const FairOrderFormView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const orderRef = useRef(null);

  const {
    data: responseData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["fairOrderFormById", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/fairOrderFormById/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const handlePrint = useReactToPrint({
    content: () => orderRef.current,
    documentTitle: `ONZONE_Fair_Order_${id}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 4mm;
      }
      @media print {
        html, body {
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-hide {
          display: none !important;
        }
        .order-sheet-container {
          height: 284mm !important;
          min-height: 284mm !important;
          max-height: 284mm !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          box-sizing: border-box !important;
          border-width: 2px !important;
          margin: 0 auto !important;
        }
        .order-sheet-table-wrapper {
          flex: 1 1 auto !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .order-sheet-table {
          height: 100% !important;
        }
      }
    `,
  });

  const handleDownloadPdf = () => {
    const element = orderRef.current;
    if (!element) return;
    const opt = {
      margin: 4,
      filename: `ONZONE_Fair_Order_${id}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .catch((err) => {
        toast({
          title: "PDF Generation Failed",
          description: err?.message || "Could not generate PDF",
          variant: "destructive",
        });
      });
  };

  if (isLoading) {
    return <LoaderComponent name="Fair Order Details" />;
  }

  if (isError) {
    return (
      <ErrorComponent
        message="Error fetching order details"
        refetch={refetch}
      />
    );
  }

  // Extract nested properties flexibly
  const orderHeader =
    responseData?.fairOrderForm ||
    responseData?.data?.fairOrderForm ||
    responseData?.data ||
    responseData ||
    {};

  const subItems =
    responseData?.fairOrderSub ||
    responseData?.subs ||
    responseData?.data?.fairOrderSub ||
    responseData?.data?.subs ||
    orderHeader?.subs ||
    orderHeader?.fairOrderSub ||
    [];

  const orderDate = orderHeader?.fair_order_date
    ? moment(orderHeader.fair_order_date).format("DD/MM/YY")
    : orderHeader?.created_at
    ? moment(orderHeader.created_at).format("DD/MM/YY")
    : "-";

  const deliveryDate = orderHeader?.fair_order_delivery_date
    ? moment(orderHeader.fair_order_delivery_date).format("DD/MM/YY")
    : orderDate;

  const rawOrderNo =
    orderHeader?.fair_order_no ||
    orderHeader?.fair_order_ref_no ||
    id ||
    "1";
  
  // Format Order Number (e.g. 5-digit padded or clean string)
  const orderNo = String(rawOrderNo);

  // Helper to parse dress size string e.g., "32, 44" into array of strings
  const parseSizes = (sizeStr) => {
    if (!sizeStr) return [];
    if (Array.isArray(sizeStr)) return sizeStr.map((s) => String(s).trim());
    return String(sizeStr)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  // Standard size columns matching user order sheet pad
  const baseSizes = ["28", "30", "32", "34", "36", "38", "40", "42"];
  const dynamicExtraSizes = subItems.flatMap((item) =>
    parseSizes(item?.fair_order_sub_dress_size || item?.dress_size || item?.size)
  );

  const sizeColumns = Array.from(
    new Set([...baseSizes, ...dynamicExtraSizes])
  ).sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  // Calculate totals
  const totalQty = subItems.reduce((acc, item) => {
    const q = parseFloat(item?.fair_order_sub_quantity || item?.quantity || 0);
    return acc + (isNaN(q) ? 0 : q);
  }, 0);

  // Rows count set to 16 so the order table fills out smoothly down to the footer border
  const MIN_ROWS = 16;
  const rowsToRender = [...subItems];
  while (rowsToRender.length < MIN_ROWS) {
    rowsToRender.push(null);
  }

  return (
    <Page>
      <div className="w-full p-2 sm:p-4 space-y-4">
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between print-hide pb-2 border-b">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-lg font-semibold hover:opacity-80 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Order Details</span>
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 text-xs"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </Button>
          </div>
        </div>

        {/* Printable Order Sheet Pad Container */}
        <div
          ref={orderRef}
          className="order-sheet-container bg-white border-2 border-gray-900 text-gray-900 font-sans p-3 sm:p-4 shadow-md w-full max-w-full box-border flex flex-col h-auto"
        >
          {/* Company Title Header */}
          <div className="border-b-2 border-red-600 pb-1.5 mb-2 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-red-700 uppercase tracking-wide font-serif">
              ONZONE CLOTHING CO.
            </h1>
            <p className="text-[11px] sm:text-xs text-gray-800 font-medium mt-0.5">
              # 19, Parekh Square, 3rd Cross, H. Siddaiah Road, Bangalore - 560 027. Phone : 080-41248938. Mob.: 99160 82518
            </p>
          </div>

          {/* Reorganized Top Header Box */}
          <div className="border border-gray-900 p-2.5 space-y-2 mb-2 text-xs sm:text-sm">
            {/* Line 1: Client Name (To, M/s) & Date (without border) & Order Number (fixed width box for up to 5 digits) */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Client Name */}
              <div className="flex items-baseline flex-1 min-w-[220px]">
                <span className="font-bold text-gray-900 whitespace-nowrap">To, M/s</span>
                <span className="font-bold text-gray-900 px-2 text-sm sm:text-base">
                  {orderHeader?.fair_order_retailer || "-"}
                </span>
                <span className="flex-1 border-b border-dotted border-gray-700 h-0 ml-1"></span>
              </div>

              {/* Date (Without Border) */}
              <div className="flex items-baseline whitespace-nowrap">
                <span className="font-bold">Date.</span>
                <span className="font-semibold text-gray-900 px-1.5 border-b border-dotted border-gray-700 min-w-[75px] text-center ml-1">
                  {orderDate}
                </span>
              </div>

              {/* Order Number Box (Fixed Width for up to 5 Digits) */}
              <div className="w-36 min-w-[144px] flex items-center justify-between border border-red-400 bg-red-50/40 px-2 py-1 rounded text-red-700 shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-tight text-gray-700 whitespace-nowrap">
                  Order Number
                </span>
                <span className="font-extrabold text-lg tracking-wider text-red-700 ml-1">
                  {orderNo}
                </span>
              </div>
            </div>

            {/* Line 2: Single line containing GSTIN, Mobile Number, and Date of Delivery */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1.5 text-xs sm:text-sm border-t border-gray-200">
              <div className="flex items-baseline">
                <span className="font-bold">GSTIN. :</span>
                <span className="ml-1.5 font-semibold text-gray-900">
                  {orderHeader?.fair_order_gst_no || "-"}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold">Mobile Number :</span>
                <span className="ml-1.5 font-semibold text-blue-900">
                  {orderHeader?.fair_order_retailer_mobile || "-"}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold">Date of Delivery :</span>
                <span className="ml-1.5 font-semibold text-blue-950">
                  {deliveryDate}
                </span>
              </div>
            </div>

            {/* Remarks sub-line if present */}
            {orderHeader?.fair_order_remarks && (
              <div className="flex items-baseline w-full pt-1 text-xs text-gray-600 italic border-t border-dashed border-gray-200">
                <span className="font-semibold text-gray-800 not-italic mr-1.5">
                  Remarks:
                </span>
                <span>{orderHeader.fair_order_remarks}</span>
              </div>
            )}
          </div>

          {/* Main Order Items Table (S.No Column Removed, Style Code Maximized, Size Columns Very Small) */}
          <div className="order-sheet-table-wrapper flex-1 flex flex-col">
            <table className="order-sheet-table w-full h-full border-collapse border border-gray-900 text-xs sm:text-sm">
              <thead>
                {/* Row 1: Header Titles */}
                <tr className="bg-[#E5D7C3] text-[#543D2B]">
                  <th
                    rowSpan={2}
                    className="border border-gray-900 px-3 py-1 text-left font-bold min-w-[280px]"
                  >
                    Style Code / Particulars
                  </th>
                  <th
                    colSpan={sizeColumns.length}
                    className="border border-gray-900 px-1 py-0.5 text-center font-bold tracking-wider uppercase text-xs"
                  >
                    SIZE
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-gray-900 px-2 py-1 text-center font-bold w-14"
                  >
                    Qty.
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-gray-900 px-2 py-1 text-center font-bold w-16"
                  >
                    Rate
                  </th>
                </tr>

                {/* Row 2: Sizes & Sub-labels */}
                <tr className="bg-gray-50">
                  {sizeColumns.map((sz) => (
                    <th
                      key={sz}
                      className="border border-gray-900 px-0.5 py-1 text-center font-bold text-[11px] w-7 min-w-[22px]"
                    >
                      <div>{sz}</div>
                      <div className="text-[8px] font-normal text-gray-600 leading-none">
                        {SIZE_SUB_LABELS[sz] || ""}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-300">
                {rowsToRender.map((item, index) => {
                  if (!item) {
                    // Empty paper row aesthetic
                    return (
                      <tr key={`empty-${index}`} className="border-b border-gray-300">
                        <td className="border border-gray-900 py-1"></td>
                        {sizeColumns.map((sz) => (
                          <td key={sz} className="border border-gray-900 py-1"></td>
                        ))}
                        <td className="border border-gray-900 py-1"></td>
                        <td className="border border-gray-900 py-1"></td>
                      </tr>
                    );
                  }

                  const itemSizes = parseSizes(
                    item?.fair_order_sub_dress_size ||
                      item?.dress_size ||
                      item?.size
                  );
                  const barcode =
                    item?.fair_order_sub_barcode ||
                    item?.fair_order_sub_barcode_main ||
                    "-";
                  const dressType = item?.fair_order_sub_dress_type || "";
                  const qty =
                    item?.fair_order_sub_quantity ?? item?.quantity ?? 0;
                  const mrp = item?.fair_order_sub_mrp || item?.mrp || "";

                  return (
                    <tr key={item?.id || index} className="hover:bg-blue-50/20">
                      {/* Style Code / Particulars (MAXIMIZED SPACE) */}
                      <td className="border border-gray-900 px-3 py-1 font-bold text-gray-900 text-sm min-w-[280px]">
                        <div className="flex items-center gap-2">
                          <span>{barcode}</span>
                          {dressType && (
                            <span className="text-[10px] text-gray-600 border border-gray-400 px-1.5 rounded bg-gray-50 font-normal">
                              {dressType}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Size Matrix Cells (VERY SMALL FOR DOTS / TICKS / 1) */}
                      {sizeColumns.map((sz) => {
                        const isSelected = itemSizes.includes(sz);
                        return (
                          <td
                            key={sz}
                            className="border border-gray-900 text-center font-extrabold text-blue-900 text-xs w-7 min-w-[22px] px-0 py-1"
                          >
                            {isSelected ? "1" : ""}
                          </td>
                        );
                      })}

                      {/* Qty */}
                      <td className="border border-gray-900 text-center font-bold px-2 text-sm py-1">
                        {qty}
                      </td>

                      {/* Rate / MRP */}
                      <td className="border border-gray-900 text-center px-2 py-1">
                        {mrp ? `₹${mrp}` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Row */}
              <tfoot>
                <tr className="border-t-2 border-gray-900 font-extrabold text-xs sm:text-sm bg-gray-100">
                  <td
                    colSpan={1 + sizeColumns.length}
                    className="border border-gray-900 px-3 py-1.5 text-right uppercase tracking-wider font-extrabold"
                  >
                    TOTAL QUANTITY:
                  </td>
                  <td className="border border-gray-900 px-2 py-1.5 text-center text-base font-extrabold text-red-700 underline decoration-double">
                    {totalQty}
                  </td>
                  <td className="border border-gray-900 px-2 py-1.5 text-center"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Layout Three-Section Split Side-by-Side (Font Size 8px) */}
          <div className="border-2 border-t-0 border-gray-900 grid grid-cols-12 divide-x divide-gray-900 text-[8px] leading-tight">
            {/* Section 1: Terms & Conditions (5/12 Width) */}
            <div className="col-span-5 p-1.5 space-y-0.5 text-gray-800 text-[8px]">
              <div className="font-bold text-black uppercase underline mb-0.5 text-[8.5px]">
                TERMS & CONDITIONS :
              </div>
              <ol className="list-decimal list-inside space-y-0.5 text-[8px]">
                <li>Order once placed cannot be cancelled.</li>
                <li>Our responsibility ceases when the goods leave our godown.</li>
                <li>Subject to stock. Disputes if any should be settled in Bangalore Court Only.</li>
                <li>Verbal commitments shall be invalid until and unless written on the order sheet.</li>
                <li>Interest will be charged at the rate of 24% per annum after the due date.</li>
              </ol>
            </div>

            {/* Section 2: Ordered By (Middle Part - 4/12 Width) */}
            <div className="col-span-4 p-1.5 flex flex-col justify-between min-h-[75px] text-[8px]">
              <div className="font-bold text-gray-900">Ordered by :</div>
              <div className="border-b border-dashed border-gray-500 mb-1"></div>
            </div>

            {/* Section 3: Signatory (Right Part - 3/12 Width) */}
            <div className="col-span-3 p-1.5 flex flex-col justify-between min-h-[75px] text-right text-[8px]">
              <div className="font-bold text-red-700 text-[8.5px]">
                For : ONZONE CLOTHING CO.
              </div>
              <div className="text-gray-400 italic text-[8px] mb-1">
                Authorized Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default FairOrderFormView;
