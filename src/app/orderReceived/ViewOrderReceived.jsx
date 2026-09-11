import React, { useState, useEffect, useRef } from "react";
import Page from "../dashboard/page";

import axios from "axios";
import ReactToPrint from "react-to-print";
import Moment from "moment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate, useParams } from "react-router-dom";
import BASE_URL from "@/config/BaseUrl";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const printStyles = `
@media print {
  body {
    font-size: 10pt;
    line-height: 1.2;
    margin: 0;
    padding: 0;
  }
  @page {
    size: A4;
    margin: 15mm;
  }
  .print-container {
    width: 100%;
    max-width: 210mm;
    margin: 0 auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    page-break-inside: avoid;
    margin-bottom: 10px;
    font-size: 9pt;
  }
  table, th {
    border: 0.1px solid #000;
    border-width: 0.1px;
  }
  th, td {
    padding: 3px 5px;
    line-height: 1.1;
    vertical-align: middle;
  }
  thead {
    background-color: #f0f0f0 !important;
    -webkit-print-color-adjust: exact;
  }
  .font-semibold {
    font-weight: 600;
  }
  h3 {
    font-size: 14pt;
    margin-bottom: 10px;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
}
`;

const ViewOrderReceived = () => {
  const { id } = useParams();
  const [workOrder, setWorkOrder] = useState({});

  const [loader, setLoader] = useState(true);
  const [isError, setIsError] = useState(false);

  const componentRef = useRef(null);
  useEffect(() => {
    // Add print styles to document head
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
  const fetchViewReceived = async () => {
    setLoader(true);
    setIsError(false);
    try {
      const response = await axios({
        url: BASE_URL + "/api/fetch-work-order-received-view-by-id/" + id,
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setWorkOrder(response.data.workorderrc);
    } catch (error) {
      console.error("Error fetching work order received data:", error);
      setIsError(true);
    } finally {
      setLoader(false);
    }
  };
  useEffect(() => {
    fetchViewReceived();
  }, [id]);

  if (loader) {
    return <LoaderComponent name=" Order Received Data" />;
  }

  // Render error state
  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Work Order Received Data"
        refetch={fetchViewReceived}
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
                Packing List
              </CardTitle>
              <ReactToPrint
                trigger={() => (
                  <Button variant="outline" size="sm" asChild>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <Printer className="h-4 w-4" />
                      Print
                    </div>
                  </Button>
                )}
                content={() => componentRef.current}
              />
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div ref={componentRef} className="bg-white  rounded-lg print:p-4">
              {/* Main Details Table */}
              <table className="w-full mb-1 border-collapse text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="font-semibold p-1 w-[8rem]">Factory</td>
                    <td className="p-1 w-[16rem]">
                      : {workOrder.work_order_rc_factory}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right">
                      Date
                    </td>
                    <td className="p-1 w-[8rem]">
                      :{" "}
                      {Moment(workOrder.work_order_rc_date).format(
                        "DD-MM-YYYY",
                      )}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="font-semibold p-1 w-[8rem]">Brand</td>
                    <td className="p-1 w-[16rem]">
                      : {workOrder.work_order_rc_brand}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right">
                      DC No
                    </td>
                    <td className="p-1 w-[8rem]">
                      : {workOrder.work_order_rc_dc_no}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right">
                      DC Date
                    </td>
                    <td className="p-1 w-[8rem]">
                      :{" "}
                      {Moment(workOrder.work_order_rc_dc_date).format(
                        "DD-MM-YYYY",
                      )}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="font-semibold p-1 w-[8rem]">No of Box</td>
                    <td className="p-1 w-[16rem]">
                      : {workOrder.work_order_rc_box}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right">
                      Total Pcs
                    </td>
                    <td className="p-1 w-[8rem]">
                      : {workOrder.work_order_rc_pcs}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right">
                      Received By
                    </td>
                    <td className="p-1 w-[8rem]">
                      : {workOrder.work_order_rc_received_by}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold p-1 w-[8rem]">
                      Work Order No
                    </td>
                    <td className="p-1 w-[16rem]">
                      : {workOrder.work_order_rc_id}
                    </td>
                    <td className="font-semibold p-1 w-[6rem] text-right">
                      Remarks
                    </td>
                    <td colSpan="3" className="p-1 break-words">
                      : {workOrder.work_order_rc_remarks}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
};

export default ViewOrderReceived;
