import React, { useEffect, useRef, useState } from "react";
import Page from "../dashboard/page";
import { Loader, Printer } from "lucide-react";
import BASE_URL from "@/config/BaseUrl";
import ReactToPrint from "react-to-print";
import { useParams } from "react-router-dom";
import Moment from "moment";
import axios from "axios";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";

const tablecss = {
  fontSize: "12px",
  lineHeight: "1.2",
};

const printStyles = `
    .print-only {
      display: none !important;
    }
    @media print {
      .screen-only {
        display: none !important;
      }
      .print-only {
        display: block !important;
      }
      @page {
        size: A4;
        margin: 2mm 2mm 2mm 2mm;  // Reduced page margins
        marks: none;
      }
  
      /* Hide default headers and footers */
      html {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
  
      /* Remove URLs and other default print information */
       @page { margin: 2mm 2mm 2mm 2mm; } 
      @page :first { margin-top: 2mm; margin-bottom: 2mm; margin-left: 2mm; margin-right: 2mm; } 
      @page :left { margin-left: 2mm; margin-right: 2mm; } 
      @page :right { margin-left: 2mm; margin-right: 2mm; }
      
      /* General print layout optimizations */
      * {
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.2 !important;
      }
      
      /* Header area optimizations */
      .print-header {
        margin-bottom: 0.2rem !important;
      
      }
      
      /* Table-specific print styles */
      table {
        font-size: 9.5px !important;
        border-collapse: collapse !important;
        width: 100% !important;
      }
      
      td, th {
        padding: 1.5px 1px !important;
        height: auto !important;
        line-height: 1 !important;
      }
      
      tr {
        page-break-inside: avoid;
        height: auto !important;
      }
      
      /* Remove extra spacing */
      .p-5, .p-12, .p-2 {
        padding: 2px !important;
      }
      
      .mx-4 {
        margin: 0 !important;
      }
      
      /* Optimize spacing for specific elements */
      .print-compact {
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Hide unnecessary elements when printing */
      .no-print {
        display: none !important;
      }
      
      /* Ensure table headers stay compact */
      thead th {
        padding: 1.5px 1px !important;
        font-size: 9.5px !important;
      }
      
      /* Optimize table rows */
      tbody tr {
        min-height: 0 !important;
      }
      
      /* Adjust font sizes for different elements */
      .text-sm {
        font-size: 9px !important;
      }
      
      .font-bold {
        font-weight: 600 !important;
      }
      
      /* Optimize table borders */
      table, th, td {
        border-width: 1px !important;
      }
    }
  `;
const WorkOrderReceipt = () => {
  const { id } = useParams();
  const componentRef = useRef();
  const [workorder, setWorkOrder] = useState([]);
  const [workordersub, setWorkOrderSub] = useState({});
  const [workorderfooter, setWorkOrderFooter] = useState([]);
  const [loader, setLoader] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchWorkOrder = async () => {
    setLoader(true);
    setIsError(false);
    try {
      const res = await axios({
        url: BASE_URL + "/api/fetch-work-order-by-id/" + id,
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setWorkOrder(res.data.workorder);
      setWorkOrderSub(res.data.workordersub);
      setWorkOrderFooter(res.data.workorderfooter);
    } catch (error) {
      console.error("Error fetching work order:", error);
      setIsError(true);
    } finally {
      setLoader(false);
    }
  };
  useEffect(() => {
    fetchWorkOrder();
  }, [id]);

  const renderValue = (value) => {
    return value == "0" ? <span className="text-gray-500">-</span> : value;
  };

  const PAGE_SIZE = 9;
  const pages = [];
  if (Array.isArray(workordersub)) {
    for (let i = 0; i < workordersub.length; i += PAGE_SIZE) {
      pages.push(workordersub.slice(i, i + PAGE_SIZE));
    }
  }

  const calculatePageTotals = (pageItems) => {
    const totals = {
      length: 0,
      h36: 0,
      h38: 0,
      h40: 0,
      h42: 0,
      h44: 0,
      h46: 0,
      h48: 0,
      h50: 0,
      half_total: 0,
      sum36: 0,
      sum38: 0,
      sum40: 0,
      sum42: 0,
      sum44: 0,
      sum46: 0,
      sum48: 0,
      sum50: 0,
      full_total: 0,
    };
    pageItems.forEach((item) => {
      totals.length += Number(item.work_order_sub_length || 0);
      totals.h36 += Number(item.work_order_sub_36_h || 0);
      totals.h38 += Number(item.work_order_sub_38_h || 0);
      totals.h40 += Number(item.work_order_sub_40_h || 0);
      totals.h42 += Number(item.work_order_sub_42_h || 0);
      totals.h44 += Number(item.work_order_sub_44_h || 0);
      totals.h46 += Number(item.work_order_sub_46_h || 0);
      totals.h48 += Number(item.work_order_sub_48_h || 0);
      totals.h50 += Number(item.work_order_sub_50_h || 0);
      totals.half_total += Number(item.work_order_sub_half_total || 0);
      totals.sum36 +=
        Number(item.work_order_sub_36_pcs || 0) +
        Number(item.work_order_sub_36_ratio || 0) +
        Number(item.work_order_sub_36_bits || 0);
      totals.sum38 +=
        Number(item.work_order_sub_38_pcs || 0) +
        Number(item.work_order_sub_38_ratio || 0) +
        Number(item.work_order_sub_38_bits || 0);
      totals.sum40 +=
        Number(item.work_order_sub_40_pcs || 0) +
        Number(item.work_order_sub_40_ratio || 0) +
        Number(item.work_order_sub_40_bits || 0);
      totals.sum42 +=
        Number(item.work_order_sub_42_pcs || 0) +
        Number(item.work_order_sub_42_ratio || 0) +
        Number(item.work_order_sub_42_bits || 0);
      totals.sum44 +=
        Number(item.work_order_sub_44_pcs || 0) +
        Number(item.work_order_sub_44_ratio || 0) +
        Number(item.work_order_sub_44_bits || 0);
      totals.sum46 +=
        Number(item.work_order_sub_46_pcs || 0) +
        Number(item.work_order_sub_46_ratio || 0) +
        Number(item.work_order_sub_46_bits || 0);
      totals.sum48 +=
        Number(item.work_order_sub_48_pcs || 0) +
        Number(item.work_order_sub_48_ratio || 0) +
        Number(item.work_order_sub_48_bits || 0);
      totals.sum50 +=
        Number(item.work_order_sub_50_pcs || 0) +
        Number(item.work_order_sub_50_ratio || 0) +
        Number(item.work_order_sub_50_bits || 0);
      totals.full_total += Number(item.work_order_sub_full_total || 0);
    });
    return totals;
  };

  if (loader) {
    return <LoaderComponent name="Work Order Receipt Data" />;
  }

  // Render error state
  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Work Order Receipt Data"
        refetch={fetchWorkOrder}
      />
    );
  }
  return (
    <Page>
      <style>{printStyles}</style>
      <div className="flex flex-col md:flex-row justify-between items-center bg-white  p-2 rounded-lg space-y-4 md:space-y-0">
        <h3 className="text-center md:text-left text-lg md:text-xl font-bold">
          Work Order
        </h3>
        <ul className="flex justify-end">
          <li>
            <ReactToPrint
              trigger={() => (
                <button className="flex items-center border  border-blue-500 hover:border-green-500 hover:animate-pulse p-2 rounded-lg">
                  <Printer className="mr-2" size={16} />
                  Print
                </button>
              )}
              content={() => componentRef.current}
            />
          </li>
        </ul>
      </div>
      <div>
        <>
          <div className="mx-auto w-full mt-4 ">
            <div className="bg-white  rounded-lg">
              <div
                className={`text-right p-2 ${
                  localStorage.getItem("user_type_id") == 4 ? "hidden" : ""
                }`}
              ></div>
              <div className="print-compact" ref={componentRef}>
                <div className="mx-4 text-base">
                  {/* <div className="print-header">
                    <table
                      className="w-full"
                      style={{ marginBottom: "0.2rem" }}
                    >
                      <tbody>
                        <tr>
                          <td className=" text-sm">
                            Work O.No&nbsp;:&nbsp;
                            <span className="font-bold">
                              {workorder.work_order_no}
                            </span>
                          </td>
                          <td className=" text-sm">
                            Factory&nbsp;:&nbsp;
                            <span className="font-bold">
                              {workorder.work_order_factory}
                            </span>
                          </td>

                          <td className="text-sm">
                            Brands&nbsp;:&nbsp;
                            <span className="font-bold">
                              {workorder.work_order_brand == "Other"
                                ? workorder.work_order_brand_other
                                : workorder.work_order_brand}
                            </span>
                          </td>
                          <td className="text-sm">
                            Ratio&nbsp;:&nbsp;
                            <span className="font-bold">
                              {workorder.work_order_ratio}
                            </span>
                          </td>

                          <td className="text-sm">
                            Width&nbsp;:&nbsp;
                            <span className="font-bold">
                              {workorder.work_order_width}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-sm">
                            Work Date&nbsp;:&nbsp;
                            <span className="font-bold">
                              {Moment(workorder.work_order_date).format(
                                "DD-MM-YYYY",
                              )}
                            </span>
                          </td>
                          <td className="text-sm">
                            Remarks&nbsp;:&nbsp;
                            <span className="font-bold">
                              {workorder.work_order_remarks}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div> */}
                  <hr className="my-4  border border-gray-400" />

                  {/* SCREEN ONLY VIEW (original layout, unmodified) */}
                  <div className="screen-only print:hidden">
                    <table style={{ width: "100%", border: "1px solid #000" }}>
                      <thead>
                        <tr
                          style={{
                            background: "#84B0CA",
                            textAlign: "center",
                            color: "white",
                          }}
                        >
                          <th
                            className="w-1/3"
                            style={{ border: "1px solid #000" }}
                          >
                            Swatch
                          </th>
                          <th
                            className="w-1"
                            style={{ border: "1px solid #000" }}
                          >
                            Mtrs
                          </th>
                          <th
                            className="w-1"
                            style={{ border: "1px solid #000" }}
                          >
                            Code Mrp
                          </th>
                          <th
                            className="w-5 p-2"
                            style={{ border: "1px solid #000" }}
                          >
                            Cons
                          </th>
                          <th style={{ border: "1px solid #000" }}>
                            {workorder?.work_order_38_39 === "Yes"
                              ? "38"
                              : "36"}
                          </th>
                          <th style={{ border: "1px solid #000" }}>
                            {workorder?.work_order_38_39 === "Yes"
                              ? "39"
                              : "38"}
                          </th>
                          <th style={{ border: "1px solid #000" }}>40</th>
                          <th style={{ border: "1px solid #000" }}>42</th>
                          <th style={{ border: "1px solid #000" }}>44</th>
                          <th style={{ border: "1px solid #000" }}>46</th>
                          <th style={{ border: "1px solid #000" }}>48</th>
                          <th style={{ border: "1px solid #000" }}>50</th>

                          <th style={{ border: "1px solid #000" }}>Total</th>
                          <th style={{ border: "1px solid #000" }}>Trim</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workordersub.map((fabricsub, key) => (
                          <React.Fragment key={key}>
                            <tr
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                height: "auto",
                              }}
                            >
                              <td
                                rowSpan={5}
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}></span>
                              </td>

                              <td
                                rowSpan={5}
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {fabricsub.work_order_sub_new_length == null
                                    ? fabricsub.work_order_sub_length
                                    : fabricsub.work_order_sub_new_length
                                        .replace(/,/g, " ")
                                        .split(" ")
                                        .map((item, index) => (
                                          <span
                                            key={index}
                                            className="flex flex-col items-center m-1 "
                                            style={tablecss}
                                          >
                                            {item}
                                          </span>
                                        ))}{" "}
                                </span>
                              </td>

                              <td
                                rowSpan={2}
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {fabricsub.work_order_sub_barcode}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {workorder.work_order_ratio_h_consumption}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_36_h)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_38_h)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_40_h)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_42_h)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_44_h)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_46_h)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_48_h)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_50_h)}
                                </span>
                              </td>

                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {fabricsub.work_order_sub_half_total}
                                </span>
                              </td>
                              <td
                                rowSpan={5}
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}></span>
                              </td>
                            </tr>
                            <tr style={{ border: "1px solid rgb(0, 0, 0)" }}>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>PCS</span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_36_pcs)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_38_pcs)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_40_pcs)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_42_pcs)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_44_pcs)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_46_pcs)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_48_pcs)}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(fabricsub.work_order_sub_50_pcs)}
                                </span>
                              </td>

                              <td
                                rowSpan={4}
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {fabricsub.work_order_sub_full_total}
                                </span>
                              </td>
                            </tr>
                            <tr style={{ border: "1px solid rgb(0, 0, 0)" }}>
                              <td
                                rowSpan={3}
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {fabricsub.work_order_sub_amount}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>RATIO</span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_36_ratio,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_38_ratio,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_40_ratio,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_42_ratio,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_44_ratio,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_46_ratio,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_48_ratio,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_50_ratio,
                                  )}
                                </span>
                              </td>
                            </tr>
                            <tr style={{ border: "1px solid rgb(0, 0, 0)" }}>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>BITS</span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_36_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_38_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_40_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_42_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_44_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_46_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_48_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_50_bits,
                                  )}
                                </span>
                              </td>
                            </tr>
                            <tr
                              style={{ borderBottom: "2px solid rgb(0, 0, 0)" }}
                            >
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {workorder.work_order_ratio_consumption}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_36_pcs +
                                      fabricsub.work_order_sub_36_ratio +
                                      fabricsub.work_order_sub_36_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_38_pcs +
                                      fabricsub.work_order_sub_38_ratio +
                                      fabricsub.work_order_sub_38_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_40_pcs +
                                      fabricsub.work_order_sub_40_ratio +
                                      fabricsub.work_order_sub_40_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_42_pcs +
                                      fabricsub.work_order_sub_42_ratio +
                                      fabricsub.work_order_sub_42_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_44_pcs +
                                      fabricsub.work_order_sub_44_ratio +
                                      fabricsub.work_order_sub_44_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_46_pcs +
                                      fabricsub.work_order_sub_46_ratio +
                                      fabricsub.work_order_sub_46_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_48_pcs +
                                      fabricsub.work_order_sub_48_ratio +
                                      fabricsub.work_order_sub_48_bits,
                                  )}
                                </span>
                              </td>
                              <td
                                style={{
                                  border: "1px solid rgb(0, 0, 0)",
                                  textAlign: "center",
                                }}
                              >
                                <span className="font-bold" style={tablecss}>
                                  {renderValue(
                                    fabricsub.work_order_sub_50_pcs +
                                      fabricsub.work_order_sub_50_ratio +
                                      fabricsub.work_order_sub_50_bits,
                                  )}
                                </span>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                      {workorderfooter.map((wsub, key) => (
                        <tfoot key={key}>
                          <tr>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span
                                className="font-bold  text-sm"
                                style={tablecss}
                              >
                                {wsub.work_order_sub_length
                                  ? wsub.work_order_sub_length.toFixed(1)
                                  : "N/A"}
                              </span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                            </td>
                            <td
                              className="font-bold"
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                              {renderValue(wsub.work_order_sub_36_h)}
                            </td>
                            <td
                              className="font-bold"
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                              {renderValue(wsub.work_order_sub_38_h)}
                            </td>
                            <td
                              className="font-bold"
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                              {renderValue(wsub.work_order_sub_40_h)}
                            </td>
                            <td
                              className="font-bold"
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                              {renderValue(wsub.work_order_sub_42_h)}
                            </td>
                            <td
                              className="font-bold"
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                              {renderValue(wsub.work_order_sub_44_h)}
                            </td>
                            <td
                              className="font-bold"
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                              {renderValue(wsub.work_order_sub_46_h)}
                            </td>
                            <td
                              className="font-bold"
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                              {renderValue(wsub.work_order_sub_48_h)}
                            </td>
                            <td
                              className="font-bold"
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                              {renderValue(wsub.work_order_sub_50_h)}
                            </td>

                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span className="font-bold" style={tablecss}>
                                {wsub.work_order_sub_half_total}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td
                              colSpan={2}
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span style={tablecss}></span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span className="font-bold" style={tablecss}>
                                {renderValue(wsub.sum_36_pcs)}
                              </span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span className="font-bold" style={tablecss}>
                                {renderValue(wsub.sum_38_pcs)}
                              </span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span className="font-bold" style={tablecss}>
                                {renderValue(wsub.sum_40_pcs)}
                              </span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span className="font-bold" style={tablecss}>
                                {renderValue(wsub.sum_42_pcs)}
                              </span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span className="font-bold" style={tablecss}>
                                {renderValue(wsub.sum_44_pcs)}
                              </span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span className="font-bold" style={tablecss}>
                                {renderValue(wsub.sum_46_pcs)}
                              </span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span className="font-bold" style={tablecss}>
                                {renderValue(wsub.sum_48_pcs)}
                              </span>
                            </td>
                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span className="font-bold" style={tablecss}>
                                {renderValue(wsub.sum_50_pcs)}
                              </span>
                            </td>

                            <td
                              style={{
                                border: "1px solid rgb(0, 0, 0)",
                                textAlign: "center",
                              }}
                            >
                              <span className="font-bold" style={tablecss}>
                                {wsub.work_order_sub_full_total}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      ))}
                    </table>
                  </div>

                  {/* PRINT ONLY VIEW (paginated, with row totals & page subtotals & grand totals) */}
                  <div className="print-only hidden print:block">
                    {pages.map((pageItems, pageIndex) => {
                      const isLastPage = pageIndex === pages.length - 1;
                      const pageTotals = calculatePageTotals(pageItems);

                      return (
                        <div
                          key={pageIndex}
                          style={{
                            pageBreakAfter: isLastPage ? "auto" : "always",
                            marginTop: "0",
                          }}
                        >
                          <div className="print-header">
                            <table
                              className="w-full"
                              style={{ marginBottom: "0.2rem" }}
                            >
                              <tbody>
                                <tr>
                                  <td className=" text-sm">
                                    Work O.No&nbsp;:&nbsp;
                                    <span className="font-bold">
                                      {workorder.work_order_no}
                                    </span>
                                  </td>
                                  <td className=" text-sm">
                                    Factory&nbsp;:&nbsp;
                                    <span className="font-bold">
                                      {workorder.work_order_factory}
                                    </span>
                                  </td>

                                  <td className="text-sm">
                                    Brands&nbsp;:&nbsp;
                                    <span className="font-bold">
                                      {workorder.work_order_brand == "Other"
                                        ? workorder.work_order_brand_other
                                        : workorder.work_order_brand}
                                    </span>
                                  </td>
                                  <td className="text-sm">
                                    Ratio&nbsp;:&nbsp;
                                    <span className="font-bold">
                                      {workorder.work_order_ratio}
                                    </span>
                                  </td>

                                  <td className="text-sm">
                                    Width&nbsp;:&nbsp;
                                    <span className="font-bold">
                                      {workorder.work_order_width}
                                    </span>
                                  </td>
                                </tr>
                                <tr>
                                  <td className="text-sm">
                                    Work Date&nbsp;:&nbsp;
                                    <span className="font-bold">
                                      {Moment(workorder.work_order_date).format(
                                        "DD-MM-YYYY",
                                      )}
                                    </span>
                                  </td>
                                  <td className="text-sm">
                                    Remarks&nbsp;:&nbsp;
                                    <span className="font-bold">
                                      {workorder.work_order_remarks}
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <table
                            style={{ width: "100%", border: "1px solid #000" }}
                          >
                            <thead>
                              <tr
                                style={{
                                  background: "#84B0CA",
                                  textAlign: "center",
                                  color: "white",
                                }}
                              >
                                <th
                                  className="w-1/3"
                                  style={{ border: "1px solid #000" }}
                                >
                                  Swatch
                                </th>
                                <th
                                  className="w-1"
                                  style={{ border: "1px solid #000" }}
                                >
                                  Mtrs
                                </th>
                                <th
                                  className="w-1"
                                  style={{ border: "1px solid #000" }}
                                >
                                  Code Mrp
                                </th>
                                <th
                                  className="w-5 p-2"
                                  style={{ border: "1px solid #000" }}
                                >
                                  Cons
                                </th>
                                <th style={{ border: "1px solid #000" }}>
                                  {workorder?.work_order_38_39 === "Yes"
                                    ? "38"
                                    : "36"}
                                </th>
                                <th style={{ border: "1px solid #000" }}>
                                  {workorder?.work_order_38_39 === "Yes"
                                    ? "39"
                                    : "38"}
                                </th>
                                <th style={{ border: "1px solid #000" }}>40</th>
                                <th style={{ border: "1px solid #000" }}>42</th>
                                <th style={{ border: "1px solid #000" }}>44</th>
                                <th style={{ border: "1px solid #000" }}>46</th>
                                <th style={{ border: "1px solid #000" }}>48</th>
                                <th style={{ border: "1px solid #000" }}>50</th>
                                <th style={{ border: "1px solid #000" }}>
                                  Total
                                </th>
                                <th style={{ border: "1px solid #000" }}>
                                  Trim
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageItems.map((fabricsub, key) => {
                                const pcsRowTotal =
                                  Number(fabricsub.work_order_sub_36_pcs || 0) +
                                  Number(fabricsub.work_order_sub_38_pcs || 0) +
                                  Number(fabricsub.work_order_sub_40_pcs || 0) +
                                  Number(fabricsub.work_order_sub_42_pcs || 0) +
                                  Number(fabricsub.work_order_sub_44_pcs || 0) +
                                  Number(fabricsub.work_order_sub_46_pcs || 0) +
                                  Number(fabricsub.work_order_sub_48_pcs || 0) +
                                  Number(fabricsub.work_order_sub_50_pcs || 0);
                                const ratioRowTotal =
                                  Number(
                                    fabricsub.work_order_sub_36_ratio || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_38_ratio || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_40_ratio || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_42_ratio || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_44_ratio || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_46_ratio || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_48_ratio || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_50_ratio || 0,
                                  );
                                const bitsRowTotal =
                                  Number(
                                    fabricsub.work_order_sub_36_bits || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_38_bits || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_40_bits || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_42_bits || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_44_bits || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_46_bits || 0,
                                  ) +
                                  Number(
                                    fabricsub.work_order_sub_48_bits || 0,
                                  ) +
                                  Number(fabricsub.work_order_sub_50_bits || 0);

                                return (
                                  <React.Fragment key={key}>
                                    <tr
                                      style={{
                                        border: "1px solid rgb(0, 0, 0)",
                                        height: "auto",
                                      }}
                                    >
                                      <td
                                        rowSpan={5}
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}></span>
                                      </td>
                                      <td
                                        rowSpan={5}
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {fabricsub.work_order_sub_new_length ==
                                          null
                                            ? fabricsub.work_order_sub_length
                                            : fabricsub.work_order_sub_new_length
                                                .replace(/,/g, " ")
                                                .split(" ")
                                                .map((item, index) => (
                                                  <span
                                                    key={index}
                                                    className="flex flex-col items-center m-1 "
                                                    style={tablecss}
                                                  >
                                                    {item}
                                                  </span>
                                                ))}
                                        </span>
                                      </td>
                                      <td
                                        rowSpan={2}
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {fabricsub.work_order_sub_barcode}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {
                                            workorder.work_order_ratio_h_consumption
                                          }
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_36_h,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_38_h,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_40_h,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_42_h,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_44_h,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_46_h,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_48_h,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_50_h,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {fabricsub.work_order_sub_half_total}
                                        </span>
                                      </td>
                                      <td
                                        rowSpan={5}
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}></span>
                                      </td>
                                    </tr>
                                    <tr
                                      style={{
                                        border: "1px solid rgb(0, 0, 0)",
                                      }}
                                    >
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>PCS</span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_36_pcs,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_38_pcs,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_40_pcs,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_42_pcs,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_44_pcs,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_46_pcs,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_48_pcs,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_50_pcs,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(pcsRowTotal)}
                                        </span>
                                      </td>
                                    </tr>
                                    <tr
                                      style={{
                                        border: "1px solid rgb(0, 0, 0)",
                                      }}
                                    >
                                      <td
                                        rowSpan={3}
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {fabricsub.work_order_sub_amount}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>RATIO</span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_36_ratio,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_38_ratio,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_40_ratio,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_42_ratio,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_44_ratio,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_46_ratio,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_48_ratio,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_50_ratio,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(ratioRowTotal)}
                                        </span>
                                      </td>
                                    </tr>
                                    <tr
                                      style={{
                                        border: "1px solid rgb(0, 0, 0)",
                                      }}
                                    >
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>BITS</span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_36_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_38_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_40_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_42_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_44_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_46_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_48_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(
                                            fabricsub.work_order_sub_50_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span style={tablecss}>
                                          {renderValue(bitsRowTotal)}
                                        </span>
                                      </td>
                                    </tr>
                                    <tr
                                      style={{
                                        borderBottom: "2px solid rgb(0, 0, 0)",
                                      }}
                                    >
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {
                                            workorder.work_order_ratio_consumption
                                          }
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_36_pcs +
                                              fabricsub.work_order_sub_36_ratio +
                                              fabricsub.work_order_sub_36_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_38_pcs +
                                              fabricsub.work_order_sub_38_ratio +
                                              fabricsub.work_order_sub_38_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_40_pcs +
                                              fabricsub.work_order_sub_40_ratio +
                                              fabricsub.work_order_sub_40_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_42_pcs +
                                              fabricsub.work_order_sub_42_ratio +
                                              fabricsub.work_order_sub_42_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_44_pcs +
                                              fabricsub.work_order_sub_44_ratio +
                                              fabricsub.work_order_sub_44_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_46_pcs +
                                              fabricsub.work_order_sub_46_ratio +
                                              fabricsub.work_order_sub_46_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_48_pcs +
                                              fabricsub.work_order_sub_48_ratio +
                                              fabricsub.work_order_sub_48_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(
                                            fabricsub.work_order_sub_50_pcs +
                                              fabricsub.work_order_sub_50_ratio +
                                              fabricsub.work_order_sub_50_bits,
                                          )}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {fabricsub.work_order_sub_full_total}
                                        </span>
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                ></td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                ></td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                ></td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                ></td>
                                <td
                                  className="font-bold"
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  {renderValue(pageTotals.h36)}
                                </td>
                                <td
                                  className="font-bold"
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  {renderValue(pageTotals.h38)}
                                </td>
                                <td
                                  className="font-bold"
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  {renderValue(pageTotals.h40)}
                                </td>
                                <td
                                  className="font-bold"
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  {renderValue(pageTotals.h42)}
                                </td>
                                <td
                                  className="font-bold"
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  {renderValue(pageTotals.h44)}
                                </td>
                                <td
                                  className="font-bold"
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  {renderValue(pageTotals.h46)}
                                </td>
                                <td
                                  className="font-bold"
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  {renderValue(pageTotals.h48)}
                                </td>
                                <td
                                  className="font-bold"
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  {renderValue(pageTotals.h50)}
                                </td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  <span className="font-bold" style={tablecss}>
                                    {pageTotals.half_total}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  <span
                                    className="font-bold text-sm"
                                    style={tablecss}
                                  >
                                    Subtotal
                                  </span>
                                </td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  <span
                                    className="font-bold text-sm"
                                    style={tablecss}
                                  >
                                    {pageTotals.length
                                      ? pageTotals.length.toFixed(1)
                                      : ""}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                ></td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                ></td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  <span className="font-bold" style={tablecss}>
                                    {renderValue(pageTotals.sum36)}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  <span className="font-bold" style={tablecss}>
                                    {renderValue(pageTotals.sum38)}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  <span className="font-bold" style={tablecss}>
                                    {renderValue(pageTotals.sum40)}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  <span className="font-bold" style={tablecss}>
                                    {renderValue(pageTotals.sum42)}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  <span className="font-bold" style={tablecss}>
                                    {renderValue(pageTotals.sum44)}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  <span className="font-bold" style={tablecss}>
                                    {renderValue(pageTotals.sum46)}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  <span className="font-bold" style={tablecss}>
                                    {renderValue(pageTotals.sum48)}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  <span className="font-bold" style={tablecss}>
                                    {renderValue(pageTotals.sum50)}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    border: "1px solid rgb(0, 0, 0)",
                                    textAlign: "center",
                                  }}
                                >
                                  <span className="font-bold" style={tablecss}>
                                    {pageTotals.full_total}
                                  </span>
                                </td>
                              </tr>

                              {/* Render grand total rows only at the very end of the final page */}
                              {isLastPage &&
                                workorderfooter.map((wsub, footerKey) => (
                                  <React.Fragment key={footerKey}>
                                    <tr>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      ></td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      ></td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      ></td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      ></td>
                                      <td
                                        className="font-bold"
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        {renderValue(wsub.work_order_sub_36_h)}
                                      </td>
                                      <td
                                        className="font-bold"
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        {renderValue(wsub.work_order_sub_38_h)}
                                      </td>
                                      <td
                                        className="font-bold"
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        {renderValue(wsub.work_order_sub_40_h)}
                                      </td>
                                      <td
                                        className="font-bold"
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        {renderValue(wsub.work_order_sub_42_h)}
                                      </td>
                                      <td
                                        className="font-bold"
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        {renderValue(wsub.work_order_sub_44_h)}
                                      </td>
                                      <td
                                        className="font-bold"
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        {renderValue(wsub.work_order_sub_46_h)}
                                      </td>
                                      <td
                                        className="font-bold"
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        {renderValue(wsub.work_order_sub_48_h)}
                                      </td>
                                      <td
                                        className="font-bold"
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        {renderValue(wsub.work_order_sub_50_h)}
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {wsub.work_order_sub_half_total}
                                        </span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold text-sm"
                                          style={tablecss}
                                        >
                                          Grand Total
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold text-sm"
                                          style={tablecss}
                                        >
                                          {wsub.work_order_sub_length
                                            ? wsub.work_order_sub_length.toFixed(
                                                1,
                                              )
                                            : ""}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      ></td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      ></td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(wsub.sum_36_pcs)}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(wsub.sum_38_pcs)}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(wsub.sum_40_pcs)}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(wsub.sum_42_pcs)}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(wsub.sum_44_pcs)}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(wsub.sum_46_pcs)}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(wsub.sum_48_pcs)}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {renderValue(wsub.sum_50_pcs)}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          border: "1px solid rgb(0, 0, 0)",
                                          textAlign: "center",
                                        }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={tablecss}
                                        >
                                          {wsub.work_order_sub_full_total}
                                        </span>
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                ))}
                            </tfoot>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      </div>
    </Page>
  );
};

export default WorkOrderReceipt;
