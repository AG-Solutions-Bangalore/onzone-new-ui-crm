import React, { useEffect, useRef } from "react";
import Page from "../dashboard/page";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import moment from "moment";
import ReactToPrint from "react-to-print";
import { Printer, FileSpreadsheet, ChevronLeft, RotateCcw } from "lucide-react";
import XLSX from "xlsx-js-style";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
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
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
  }
  .copy-heading span {
    background-color: #E5D7C3 !important;
    color: #543D2B !important;
    border: 1px solid #D8C7B0 !important;
    padding: 2px 10px !important;
    border-radius: 4px !important;
    font-weight: 800 !important;
    font-size: 9pt !important;
    display: inline-block !important;
    letter-spacing: 1px !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 7.5pt !important;
    margin-bottom: 2mm !important;
  }
  th, td {
    border: 0.1px solid #000 !important;
    padding: 2.5px 3px !important;
    text-align: center !important;
    line-height: 1.1 !important;
  }
  th {
    background-color: #E5D7C3 !important;
    color: #543D2B !important;
    font-weight: 700 !important;
    font-size: 8pt !important;
  }
  .order-summary-footer {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    border-top: 0.1px solid #000 !important;
    padding-top: 1.5mm !important;
    font-size: 8pt !important;
    margin-top: 1.5mm !important;
  }
  .order-summary-footer > span {
    margin: 0 !important;
  }
}
`;

const ViewSalesReturn = () => {
  const { id } = useParams();
  const componentRef = useRef(null);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);
    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["salesReturnListView", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-work-order-sales-return-view-by-id/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const workOrder =
        response.data.workordersalesreturn ||
        response.data.workordersales_return ||
        response.data.salesreturn ||
        response.data.sales_return ||
        response.data.workorder_sales_return ||
        response.data.workordersales ||
        response.data.workorder ||
        response.data.data ||
        response.data ||
        {};

      let rawSub = [];
      if (Array.isArray(response.data)) {
        rawSub = response.data;
      } else if (response.data && typeof response.data === "object") {
        const allArrays = Object.values(response.data).filter(Array.isArray);

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
            response.data.workordersalesreturnsub ||
            response.data.workordersalesreturn_sub ||
            response.data.workordersales_return_sub ||
            response.data.salesreturnsub ||
            response.data.workordersalessubNew ||
            response.data.workordersalessub ||
            response.data.workordersales_sub ||
            response.data.workorder_sub_sa_data ||
            response.data.sub_data ||
            response.data.data ||
            allArrays.find((arr) => arr.length > 0) ||
            [];
        }
      }

      const enrichedSub = (rawSub || []).map((item) => {
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
        workOrderSubRaw: enrichedSub,
        rawResponse: response.data,
        workOrderFooter:
          response.data.workordersalesreturnfooter ||
          response.data.workordersalesfooter ||
          {},
        workOrderDataMin: response.data.closest_min_combo || "",
        workOrderDataMax: response.data.closest_max_combo || "",
      };
    },
  });

  if (isLoading) {
    return <LoaderComponent name="Work Order Sales Return Data" />;
  }

  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Work Order Sales Return Data"
        refetch={refetch}
      />
    );
  }

  const {
    workOrder = {},
    workOrderSub = [],
    workOrderSubRaw = [],
    rawResponse = {},
    workOrderFooter = {},
  } = data || {};

  const downloadExcel = () => {
    // 1. Resolve raw barcode items
    let detailedItems = [];

    const hasBarcodesInRaw = (workOrderSubRaw || []).some(
      (it) =>
        it &&
        (it.work_order_sa_sub_barcode ||
          it.barcode ||
          it.work_order_rc_sub_barcode ||
          it.work_order_sub_barcode ||
          it.t_code ||
          it.item_code)
    );

    if (hasBarcodesInRaw) {
      detailedItems = workOrderSubRaw;
    } else {
      const allArrays = Object.values(rawResponse || {}).filter(Array.isArray);
      const barcodeArray = allArrays.find((arr) =>
        arr.some(
          (it) =>
            it &&
            (it.work_order_sa_sub_barcode ||
              it.barcode ||
              it.work_order_rc_sub_barcode ||
              it.work_order_sub_barcode ||
              it.t_code ||
              it.item_code)
        )
      );

      if (barcodeArray && barcodeArray.length > 0) {
        detailedItems = barcodeArray;
      } else {
        detailedItems =
          workOrderSubRaw && workOrderSubRaw.length > 0
            ? workOrderSubRaw
            : workOrderSub;
      }
    }

    // 2. Extract individual barcode rows
    const extractedRows = [];

    (detailedItems || []).forEach((item, index) => {
      const rawBarcode =
        item.work_order_sa_sub_barcode ||
        item.barcode ||
        item.work_order_rc_sub_barcode ||
        item.work_order_sub_barcode ||
        item.t_code ||
        item.item_code ||
        "";

      let brand =
        item.work_order_sub_brand ||
        item.brand ||
        item.brand_name ||
        item.work_order_sa_brand ||
        workOrder.work_order_sa_brand ||
        workOrder.brand_name ||
        "N/A";

      let price =
        item.finished_stock_amount !== undefined &&
        item.finished_stock_amount !== null &&
        item.finished_stock_amount !== ""
          ? item.finished_stock_amount
          : item.mrp ||
            item.amount ||
            item.rate ||
            item.price ||
            workOrder.finished_stock_amount ||
            workOrder.amount ||
            workOrder.mrp ||
            "-";

      const pcs = Number(
        item.count !== undefined && item.count !== null
          ? item.count
          : item.pcs || item.quantity || 1
      );

      if (price === "-" || price === undefined || price === null || price === "") {
        const match = (workOrderSubRaw || []).find(
          (sub) =>
            sub &&
            ((sub.work_order_sa_sub_barcode &&
              sub.work_order_sa_sub_barcode === rawBarcode) ||
              (sub.barcode && sub.barcode === rawBarcode)) &&
            sub.finished_stock_amount &&
            sub.finished_stock_amount !== "-"
        );
        if (match) {
          price = match.finished_stock_amount || match.mrp || match.amount || price;
          brand = match.brand || match.work_order_sub_brand || brand;
        }
      }

      if (
        rawBarcode &&
        typeof rawBarcode === "string" &&
        rawBarcode.includes(",")
      ) {
        const codes = rawBarcode
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        codes.forEach((code) => {
          extractedRows.push({
            barcode: code,
            brand,
            price,
            quantity: 1,
          });
        });
      } else {
        extractedRows.push({
          barcode: rawBarcode || `Item ${index + 1}`,
          brand,
          price,
          quantity: pcs,
        });
      }
    });

    // Group by barcode and price
    const barcodeMap = new Map();
    extractedRows.forEach((row) => {
      const key = `${row.barcode}___${row.price}`;
      if (barcodeMap.has(key)) {
        const existing = barcodeMap.get(key);
        existing.quantity += row.quantity;
      } else {
        barcodeMap.set(key, { ...row });
      }
    });

    const finalBarcodeRows = Array.from(barcodeMap.values());

    const borderThin = {
      top: { style: "thin", color: { rgb: "D8D0C5" } },
      bottom: { style: "thin", color: { rgb: "D8D0C5" } },
      left: { style: "thin", color: { rgb: "D8D0C5" } },
      right: { style: "thin", color: { rgb: "D8D0C5" } },
    };

    const borderTotal = {
      top: { style: "medium", color: { rgb: "543D2B" } },
      bottom: { style: "double", color: { rgb: "543D2B" } },
      left: { style: "thin", color: { rgb: "D8D0C5" } },
      right: { style: "thin", color: { rgb: "D8D0C5" } },
    };

    const titleStyle = {
      font: { name: "Segoe UI", sz: 14, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "543D2B" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    const subtitleStyle = {
      font: { name: "Segoe UI", sz: 9, bold: true, color: { rgb: "543D2B" } },
      fill: { fgColor: { rgb: "E5D7C3" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    const infoLabelStyle = {
      font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "543D2B" } },
      fill: { fgColor: { rgb: "E5D7C3" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: borderThin,
    };

    const infoValStyle = (align = "left", bold = false) => ({
      font: { name: "Segoe UI", sz: 10, bold, color: { rgb: "1C1917" } },
      fill: { fgColor: { rgb: "F7F4EF" } },
      alignment: { horizontal: align, vertical: "center" },
      border: borderThin,
    });

    const thStyle = {
      font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "543D2B" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: borderThin,
    };

    const dataCellStyle = (isEven, align = "center", bold = false) => ({
      font: { name: "Segoe UI", sz: 10, bold, color: { rgb: "1C1917" } },
      fill: { fgColor: { rgb: isEven ? "FFFFFF" : "FAF8F5" } },
      alignment: { horizontal: align, vertical: "center" },
      border: borderThin,
    });

    const setCell = (ws, r, c, val, style, isNum = false) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      ws[ref] = {
        v: val,
        t: isNum ? "n" : "s",
        s: style,
      };
    };

    // SHEET: Detailed (Barcode List)
    const wsDetail = {};
    const totalDetailCols = 5;

    for (let c = 0; c < totalDetailCols; c++) {
      setCell(wsDetail, 0, c, c === 0 ? "SALES RETURN LIST" : "", titleStyle);
      setCell(
        wsDetail,
        1,
        c,
        c === 0 ? "CUSTOMER RETURN & ITEM SCAN DETAILS" : "",
        subtitleStyle
      );
    }

    setCell(wsDetail, 3, 0, "CUSTOMER / RETAILER", infoLabelStyle);
    setCell(
      wsDetail,
      3,
      1,
      workOrder.work_order_sa_retailer_name || "N/A",
      infoValStyle("left", true)
    );
    setCell(wsDetail, 3, 2, "", infoValStyle());
    setCell(wsDetail, 3, 3, "REF / RETURN NO", infoLabelStyle);
    setCell(
      wsDetail,
      3,
      4,
      workOrder.work_order_sa_ref || workOrder.work_order_sa_no || "-",
      infoValStyle("center", true)
    );

    setCell(wsDetail, 4, 0, "RETURN SLIP NO", infoLabelStyle);
    setCell(
      wsDetail,
      4,
      1,
      workOrder.work_order_sa_dc_no || "-",
      infoValStyle("left")
    );
    setCell(wsDetail, 4, 2, "", infoValStyle());
    setCell(wsDetail, 4, 3, "DATE", infoLabelStyle);
    setCell(
      wsDetail,
      4,
      4,
      workOrder.work_order_sa_date
        ? moment(workOrder.work_order_sa_date).format("DD/MM/YYYY")
        : "-",
      infoValStyle("center")
    );

    const detailHeaders = [
      "Sl No",
      "Garment T-Code",
      "Brand",
      "MRP (Rs.)",
      "Quantity",
    ];
    detailHeaders.forEach((h, c) => setCell(wsDetail, 6, c, h, thStyle));

    let curRow = 7;
    let totalPieces = 0;
    let totalValue = 0;

    finalBarcodeRows.forEach((row, i) => {
      const isEven = i % 2 === 0;
      const numPrice = Number(row.price);
      const rowVal = !isNaN(numPrice) ? numPrice * row.quantity : 0;
      totalPieces += row.quantity;
      totalValue += rowVal;

      setCell(wsDetail, curRow, 0, i + 1, dataCellStyle(isEven, "center"), true);
      setCell(
        wsDetail,
        curRow,
        1,
        row.barcode,
        dataCellStyle(isEven, "center", true)
      );
      setCell(wsDetail, curRow, 2, row.brand, dataCellStyle(isEven, "left"));
      setCell(
        wsDetail,
        curRow,
        3,
        row.price === "-" ? "-" : row.price,
        dataCellStyle(isEven, "right")
      );
      setCell(
        wsDetail,
        curRow,
        4,
        row.quantity,
        dataCellStyle(isEven, "center", true),
        true
      );
      curRow++;
    });

    const totalStyle = (align = "center") => ({
      font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "543D2B" } },
      fill: { fgColor: { rgb: "E5D7C3" } },
      alignment: { horizontal: align, vertical: "center" },
      border: borderTotal,
    });

    setCell(wsDetail, curRow, 0, "", totalStyle());
    setCell(wsDetail, curRow, 1, "TOTAL", totalStyle("left"));
    setCell(wsDetail, curRow, 2, "", totalStyle());
    setCell(wsDetail, curRow, 3, "", totalStyle());
    setCell(wsDetail, curRow, 4, totalPieces, totalStyle("center"), true);

    wsDetail["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalDetailCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalDetailCols - 1 } },
      { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } },
      { s: { r: 4, c: 1 }, e: { r: 4, c: 2 } },
    ];

    wsDetail["!cols"] = [
      { wch: 8 },
      { wch: 22 },
      { wch: 24 },
      { wch: 14 },
      { wch: 12 },
    ];

    wsDetail["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: curRow, c: totalDetailCols - 1 },
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detailed Return");

    const cleanRef = String(
      workOrder.work_order_sa_ref ||
        workOrder.work_order_sa_no ||
        workOrder.work_order_sa_dc_no ||
        id
    ).replace(/[/\\?%*:|"<>]/g, "-");
    const fileName = `Sales_Return_Detailed_${cleanRef}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Page>
      <div className="max-w-full mx-auto space-y-4">
        <Card className="shadow-lg border border-stone-200/80 rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-[#FDFBF7] py-4 px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#543D2B] text-white">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A27B5C]">
                    Sales Return
                  </span>
                  <CardTitle className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-tight">
                    Sales Return View
                  </CardTitle>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-9 border-stone-200 text-stone-700 hover:bg-[#F5F2EB] rounded-xl text-xs font-semibold shadow-2xs"
                >
                  <Link to="/sales-return" className="flex items-center gap-1.5">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadExcel}
                  className="h-9 flex items-center gap-2 cursor-pointer bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 border-stone-200 text-stone-700 font-semibold rounded-xl text-xs shadow-2xs"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Download Excel
                </Button>

                <ReactToPrint
                  trigger={() => (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 flex items-center gap-2 cursor-pointer bg-white hover:bg-stone-50 border-stone-200 text-stone-700 font-semibold rounded-xl text-xs shadow-2xs"
                    >
                      <Printer className="h-4 w-4 text-[#543D2B]" />
                      Print
                    </Button>
                  )}
                  content={() => componentRef.current}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 bg-white">
            <div
              ref={componentRef}
              className="print-container bg-white flex flex-col print:flex-row print:justify-between gap-6 print:gap-4"
            >
              {/* Copy 1 - Shown on Screen (Full Width) and in Print (Left Column) */}
              <div className="copy-wrapper w-full print:w-[48.5%] flex flex-col">
                {/* Sales Return Centered Heading */}
                <div className="copy-heading text-center mb-5 print:mb-2">
                  <span className="inline-block bg-[#E5D7C3] text-[#543D2B] px-8 py-2 print:py-1 rounded-xl font-extrabold text-lg print:text-base tracking-widest uppercase shadow-2xs border border-[#D8C7B0]">
                    Sales Return
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
                            <span className="text-stone-500 font-medium">Code:</span>{" "}
                            {workOrder.company_code}
                          </p>
                        )}
                        <p className="text-stone-700 font-medium text-xs">
                          <span className="text-stone-500 font-medium">Return Slip No:</span>{" "}
                          <span className="font-semibold text-stone-800">
                            {workOrder.work_order_sa_dc_no || "-"}
                          </span>
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-stone-900">
                          <span className="text-stone-500 font-medium">Return No:</span>{" "}
                          <span className="text-[#543D2B] font-mono font-bold bg-[#E5D7C3]/50 px-2 py-0.5 rounded-lg border border-[#D8C7B0]/60">
                            {workOrder.work_order_sa_ref ||
                              workOrder.work_order_sa_no ||
                              "-"}
                          </span>
                        </p>
                        <p className="text-stone-700 font-medium">
                          <span className="text-stone-500 font-medium">Date:</span>{" "}
                          {workOrder.work_order_sa_date
                            ? moment(workOrder.work_order_sa_date).format(
                                "DD/MM/YYYY"
                              )
                            : "-"}
                        </p>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-hidden rounded-xl border border-stone-200 print:rounded-none print:border-black">
                      <table className="w-full mb-0">
                        <thead className="bg-[#E5D7C3] text-[#543D2B] print:bg-[#E5D7C3]">
                          <tr>
                            <th className="border-b border-stone-200 print:border p-2.5 print:p-1 text-center font-bold text-xs uppercase tracking-wider">
                              Brand
                            </th>
                            <th className="border-b border-stone-200 print:border p-2.5 print:p-1 text-center font-bold text-xs uppercase tracking-wider">
                              Mrp (₹)
                            </th>
                            <th className="border-b border-stone-200 print:border p-2.5 print:p-1 text-center font-bold text-xs uppercase tracking-wider">
                              No of Pieces
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-stone-100">
                          {workOrderSub && workOrderSub.length > 0 ? (
                            workOrderSub.map((item, index) => (
                              <tr
                                key={index}
                                className="text-center hover:bg-stone-50/70 transition-colors"
                              >
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
                                  {item.finished_stock_amount !== undefined &&
                                  item.finished_stock_amount !== null &&
                                  item.finished_stock_amount !== ""
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

                {/* Order Summary Footer */}
                <div className="order-summary-footer mt-4 print:mt-2 pt-3 print:pt-1 border-t border-stone-200 print:border-t-0 flex items-center gap-6 flex-wrap text-sm text-stone-800">
                  <span className="font-bold text-stone-900 bg-[#E5D7C3]/60 px-3 py-1 rounded-lg border border-[#D8C7B0]/60">
                    Return Summary
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
                    {workOrder.work_order_sa_remarks || "No additional remarks"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadExcel}
                    className="print:hidden flex items-center gap-2 cursor-pointer bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 border-stone-200 text-stone-700 font-semibold rounded-xl shadow-2xs h-8 px-3 text-xs transition-all"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Download Excel
                  </Button>
                </div>
              </div>

              {/* Copy 2 - Hidden on Screen, Shown only in Print (Right Column) */}
              <div className="copy-wrapper hidden print:flex print:w-[48.5%] flex-col">
                {/* Sales Return Centered Heading Outside the Box */}
                <div className="copy-heading text-center mb-2">
                  <span className="inline-block bg-[#E5D7C3] text-[#543D2B] px-6 py-1 rounded font-bold text-base tracking-wide uppercase">
                    Sales Return
                  </span>
                </div>

                {/* Box Content */}
                <div className="copy border border-black relative flex flex-col justify-between p-[3.5mm_4mm] rounded-sm">
                  <div>
                    {/* Header Details */}
                    <div className="flex justify-between items-start mb-4 text-sm">
                      <div>
                        <p className="font-semibold text-gray-800">
                          <span className="text-gray-600">Name:</span>{" "}
                          {workOrder.work_order_sa_retailer_name || "N/A"}
                        </p>
                        {workOrder.company_code && (
                          <p className="text-gray-800 font-semibold">
                            <span className="text-gray-600">Code:</span>{" "}
                            {workOrder.company_code}
                          </p>
                        )}
                        <p className="text-gray-700 text-xs">
                          <span className="text-gray-600">Return Slip No:</span>{" "}
                          {workOrder.work_order_sa_dc_no || "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">
                          <span className="text-gray-600">Return No:</span>{" "}
                          <span className="text-[#543D2B] font-mono font-bold">
                            {workOrder.work_order_sa_ref ||
                              workOrder.work_order_sa_no ||
                              "-"}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Date:</span>{" "}
                          {workOrder.work_order_sa_date
                            ? moment(workOrder.work_order_sa_date).format(
                                "DD/MM/YYYY"
                              )
                            : "-"}
                        </p>
                      </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-0 border-collapse">
                      <thead className="bg-[#E5D7C3] text-[#543D2B]">
                        <tr>
                          <th className="border border-black p-1 text-center font-bold text-xs uppercase">
                            Brand
                          </th>
                          <th className="border border-black p-1 text-center font-bold text-xs uppercase">
                            Mrp (₹)
                          </th>
                          <th className="border border-black p-1 text-center font-bold text-xs uppercase">
                            No of Pieces
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {workOrderSub && workOrderSub.length > 0 ? (
                          workOrderSub.map((item, index) => (
                            <tr key={index} className="text-center">
                              <td className="border border-black p-1 text-black font-medium text-xs">
                                {item.work_order_sub_brand ||
                                  item.brand ||
                                  item.brand_name ||
                                  item.work_order_sa_brand ||
                                  workOrder.work_order_sa_brand ||
                                  workOrder.brand_name ||
                                  "N/A"}
                              </td>
                              <td className="border border-black p-1 text-black font-semibold text-xs">
                                {item.finished_stock_amount !== undefined &&
                                item.finished_stock_amount !== null &&
                                item.finished_stock_amount !== ""
                                  ? item.finished_stock_amount
                                  : item.mrp ||
                                    item.amount ||
                                    "-"}
                              </td>
                              <td className="border border-black p-1 font-bold text-black text-xs">
                                {item.count !== undefined && item.count !== null
                                  ? item.count
                                  : item.pcs || 1}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="text-center">
                            <td className="border border-black p-1 text-black font-medium text-xs">
                              {workOrder.work_order_sa_brand ||
                                workOrder.work_order_sa_fabric_sale ||
                                workOrder.brand_name ||
                                "N/A"}
                            </td>
                            <td className="border border-black p-1 text-black font-semibold text-xs">
                              {workOrder.finished_stock_amount ||
                                workOrder.amount ||
                                workOrder.mrp ||
                                "-"}
                            </td>
                            <td className="border border-black p-1 font-bold text-black text-xs">
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

                {/* Footer in Print */}
                <div className="order-summary-footer mt-2 pt-1 border-t border-black flex items-center justify-between text-xs text-black">
                  <span>
                    <strong>Total Pieces:</strong>{" "}
                    {workOrderFooter.total_received ||
                      workOrder.work_order_sa_pcs ||
                      0}
                  </span>
                  <span>
                    <strong>Remarks:</strong>{" "}
                    {workOrder.work_order_sa_remarks || "No remarks"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
};

export default ViewSalesReturn;
