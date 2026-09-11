import React, { useRef, useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import ReactToPrint from "react-to-print";
import { Printer, FileText, FileDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useNavigate, useParams } from "react-router-dom";

import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import BASE_URL from "@/config/BaseUrl";
import Page from "@/app/dashboard/page";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import html2pdf from "html2pdf.js";

const RetailerReport = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 150);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };





  const { data: retailerView = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["retailerReportList"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-customer-report`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response?.data?.customer || response?.data?.data || (Array.isArray(response?.data) ? response.data : []);
    },
  });

 

  const handleSavePDF = () => {
    const input = tableRef.current;
    const options = {
      margin: [5, 5, 5, 5], 
      filename: "retailer-report.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        windowHeight: input.scrollHeight,
        scrollY: 0,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: { mode: "avoid-all" },
    };
  
      html2pdf()
        .from(input)
        .set(options)
        .toPdf()
        .get("pdf")
        .then((pdf) => {
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            pdf.text(
              `Page ${i} of ${totalPages}`,
              pdf.internal.pageSize.getWidth() - 20,
              pdf.internal.pageSize.getHeight() - 10
            );
          }
        })
        .save()
        .then(() => {
          toast({
            title: "PDF Generated",
            description: "Retailer order report saved as PDF",
          });
        });
    
  };
  const handleDownload = async () => {
    try {


      const response = await axios.post(
        `${BASE_URL}/api/download-customer-report`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "retailer_report.csv");
      document.body.appendChild(link);
      link.click();

      toast({
        title: "Download Successful",
        description: "Retailer order report downloaded as CSV",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download retailer order report",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoaderComponent name="Retailer Report Data" />;
  }

  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching   Retailer Report Data"
        refetch={refetch}
      />
    );
  }


  return (
    <Page>
      <div className="max-w-full mx-auto">

        <Card className="rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden bg-white">
          <CardHeader className="bg-[#FDFBF7] border-b border-stone-200/80 px-6 py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <CardTitle className="text-lg font-bold text-stone-900 flex flex-row items-center gap-2.5">
                <span>Report Results</span>
                {retailerView?.length > 0 && (
                  <span className="bg-[#E5D7C3] text-[#543D2B] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#D8C7B0]">
                    {retailerView.length} records
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8.5 border-stone-200 hover:bg-[#F5F2EB] text-stone-700 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs"
                >
                  <FileDown className="h-3.5 w-3.5 text-[#543D2B]" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSavePDF}
                  className="h-8.5 border-stone-200 hover:bg-[#F5F2EB] text-stone-700 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs"
                >
                  <FileText className="h-3.5 w-3.5 text-[#543D2B]" />
                  PDF
                </Button>
                <ReactToPrint
                  trigger={() => (
                    <Button variant="outline" size="sm" className="h-8.5 border-stone-200 hover:bg-[#F5F2EB] text-stone-700 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs">
                      <Printer className="h-3.5 w-3.5 text-[#543D2B]" />
                      Print
                    </Button>
                  )}
                  content={() => tableRef.current}
                  pageStyle={`
                    @page {
                      size: A4 ;
                      margin: 2mm;
                    }
                    @media print {
                      body { margin: 2mm !important; }
                      table { width: 100%; border-collapse: collapse; font-size: 10pt; }
                      th, td { border: 1px solid #ddd; padding: 4px; text-align: center; }
                    }
                  `}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div ref={tableRef} className="overflow-x-auto rounded-xl border border-stone-200">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-[#E5D7C3] hover:bg-[#E5D7C3] border-b border-stone-200">
                    <TableHead className="text-center font-bold text-[#543D2B] text-xs uppercase tracking-wider py-3">
                      Retailer
                    </TableHead>
                    <TableHead className="text-center font-bold text-[#543D2B] text-xs uppercase tracking-wider py-3">
                      Type
                    </TableHead>
                    <TableHead className="text-center font-bold text-[#543D2B] text-xs uppercase tracking-wider py-3">
                      Mobile
                    </TableHead>
                    <TableHead className="text-center font-bold text-[#543D2B] text-xs uppercase tracking-wider py-3">
                      Email
                    </TableHead>
                    <TableHead className="text-center font-bold text-[#543D2B] text-xs uppercase tracking-wider py-3">
                      Address
                    </TableHead>
                    <TableHead className="text-center font-bold text-[#543D2B] text-xs uppercase tracking-wider py-3">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retailerView?.length ? (
                    retailerView.map((order, index) => (
                      <TableRow
                        key={index}
                        className={`hover:bg-[#FAF8F5] transition-colors border-b border-stone-100 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-[#FDFBF7]/40'
                        }`}
                      >
                        <TableCell className="text-center font-medium text-stone-800 border-r border-stone-100">
                          {order.customer_name}
                        </TableCell>
                        <TableCell className="text-center text-stone-600 border-r border-stone-100">
                          {order.customer_type}
                        </TableCell>
                        <TableCell className="text-center font-mono text-stone-700 border-r border-stone-100">
                          {order.customer_mobile}
                        </TableCell>
                        <TableCell className="text-center text-stone-600 border-r border-stone-100">
                          {order.customer_email}
                        </TableCell>
                        <TableCell className="text-center text-stone-600 border-r border-stone-100">
                          {order.customer_address}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            order.customer_status === "Active" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-stone-100 text-stone-600 border border-stone-200"
                          }`}>
                            {order.customer_status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-12 text-gray-500"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading sales orders...
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-lg">📋</div>
                            <div>No sales orders found for the selected criteria</div>
                            <div className="text-sm text-gray-400">
                              Try adjusting your search parameters
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Floating Scroll to Top Button */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 p-3 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-full shadow-xl border border-[#A27B5C]/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 text-xs font-bold"
            title="Scroll to Top"
          >
            <ArrowUp className="h-4 w-4" />
            <span className="hidden sm:inline text-[11px]">Top</span>
          </button>
        )}
      </div>
    </Page>
  );
};

export default RetailerReport;