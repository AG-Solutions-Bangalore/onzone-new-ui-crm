import React, { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import moment from "moment";
import { Printer, FileText, FileDown, Search, ArrowUp } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ReactToPrint from "react-to-print";
import Page from "@/app/dashboard/page";
import { useToast } from "@/hooks/use-toast";
import { getTodayDate } from "@/utils/currentDate";
import BASE_URL from "@/config/BaseUrl";
import html2pdf from "html2pdf.js";

const formSchema = z.object({
  work_order_sa_from_date: z.string().min(1, "From date is required"),
  work_order_sa_to_date: z.string().min(1, "To date is required"),
  work_order_sa_retailer_id: z.string().optional(),
});




const SalesReport = () => {
  const { toast } = useToast();
  const tableRef = useRef(null);
  const [searchParams, setSearchParams] = useState({
    work_order_sa_from_date: "2024-01-01",
    work_order_sa_to_date: getTodayDate(),
    work_order_sa_retailer_id: "",
  });
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

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      work_order_sa_from_date: "2024-01-01",
      work_order_sa_to_date: getTodayDate(),
      work_order_sa_retailer_id: "",
    },
  });

  const { data: salesReport, isLoading } = useQuery({
    queryKey: ["salesReport", searchParams],
    queryFn: async () => {
      if (!searchParams) return { workorder: [] };

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/fetch-work-order-sales-report`,
        searchParams,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    enabled: !!searchParams,
  });

  const onSubmit = (data) => {
    if (searchParams && JSON.stringify(searchParams) === JSON.stringify(data)) {
        toast({
          title: "Same search parameters",
          description: "You're already viewing results for these search criteria",
          variant: "default",
        });
        return;
      }
    setSearchParams(data);
  };

  const handleDownloadCsv = async () => {
    try {
      if (!searchParams) return;

      const response = await axios.post(
        `${BASE_URL}/api/download-work-order-sales-report`,
        searchParams,
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
      link.setAttribute("download", "sales_report.csv");
      document.body.appendChild(link);
      link.click();

      toast({
        title: "Download Successful",
        description: "Sales order report downloaded as CSV",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download sales order report",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    const input = tableRef.current;
    const options = {
      margin: [5, 5, 5, 5], 
      filename: "sales-order-report.pdf",
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
            description: "Sales order report saved as PDF",
          });
        });
    
  };
  
  return (
    <Page>
      <div className="max-w-full mx-auto space-y-4">
        <Card className="rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden bg-white">
          <CardHeader className="bg-[#FDFBF7] border-b border-stone-200/80 px-6 py-4">
            <CardTitle className="text-lg font-bold text-stone-900">Sales Report</CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end gap-3.5"
            >
              <div className="space-y-1">
                <Label htmlFor="work_order_sa_from_date" className="text-xs font-bold text-stone-700">From Date</Label>
                <Input
                  id="work_order_sa_from_date"
                  type="date"
                  {...form.register("work_order_sa_from_date")}
                  className="h-9 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-2 focus:ring-[#A27B5C]/15 rounded-xl text-stone-800 font-medium"
                />
                {form.formState.errors.work_order_sa_from_date && (
                  <p className="text-[11px] text-red-500 font-medium">
                    {form.formState.errors.work_order_sa_from_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="work_order_sa_to_date" className="text-xs font-bold text-stone-700">To Date</Label>
                <Input
                  id="work_order_sa_to_date"
                  type="date"
                  {...form.register("work_order_sa_to_date")}
                  className="h-9 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-2 focus:ring-[#A27B5C]/15 rounded-xl text-stone-800 font-medium"
                />
                {form.formState.errors.work_order_sa_to_date && (
                  <p className="text-[11px] text-red-500 font-medium">
                    {form.formState.errors.work_order_sa_to_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="work_order_sa_retailer_id" className="text-xs font-bold text-stone-700">Retailer ID</Label>
                <Input
                  id="work_order_sa_retailer_id"
                  type="text"
                  placeholder="Optional"
                  {...form.register("work_order_sa_retailer_id")}
                  className="h-9 text-xs bg-white border-stone-200 focus:border-[#A27B5C] focus:ring-2 focus:ring-[#A27B5C]/15 rounded-xl text-stone-800 font-medium"
                />
              </div>

              <div>
                <Button 
                  type="submit"  
                  disabled={isLoading} 
                  className="w-full h-9 bg-[#543D2B] hover:bg-[#412E20] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {searchParams && (
          <Card className="rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <CardHeader className="bg-[#FDFBF7] border-b border-stone-200/80 px-6 py-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <CardTitle className="text-lg font-bold text-stone-900 flex flex-row items-center gap-2.5">
                  <span>Report Results</span>
                  {salesReport?.workordersales?.length > 0 && (
                    <span className="bg-[#E5D7C3] text-[#543D2B] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#D8C7B0]">
                      {salesReport.workordersales.length} records
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCsv}
                    className="h-8.5 border-stone-200 hover:bg-[#F5F2EB] text-stone-700 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs"
                  >
                    <FileDown className="h-3.5 w-3.5 text-[#543D2B]" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPDF}
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
                        Work Order SA No
                      </TableHead>
                      <TableHead className="text-center font-bold text-[#543D2B] text-xs uppercase tracking-wider py-3">
                        Work Order SA Date
                      </TableHead>
                      <TableHead className="text-center font-bold text-[#543D2B] text-xs uppercase tracking-wider py-3">
                        Retailer
                      </TableHead>
                      <TableHead className="text-center font-bold text-[#543D2B] text-xs uppercase tracking-wider py-3">
                        Packing Slip No
                      </TableHead>
                      <TableHead className="text-center font-bold text-[#543D2B] text-xs uppercase tracking-wider py-3">
                        SA Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesReport?.workordersales?.length ? (
                      salesReport.workordersales.map((order, index) => (
                        <TableRow 
                          key={index}
                          className={`hover:bg-[#FAF8F5] transition-colors border-b border-stone-100 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-[#FDFBF7]/40'
                          }`}
                        >
                          <TableCell className="text-center font-mono font-semibold text-stone-800 border-r border-stone-100">
                            {order.work_order_sa_no}
                          </TableCell>
                          <TableCell className="text-center text-stone-600 border-r border-stone-100">
                            {moment(order.work_order_sa_date).format("DD-MM-YYYY")}
                          </TableCell>
                          <TableCell className="text-center font-medium text-stone-800 border-r border-stone-100">
                            {order.work_order_sa_retailer_name}
                          </TableCell>
                          <TableCell className="text-center font-mono text-stone-700 border-r border-stone-100">
                            {order.work_order_sa_dc_no}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              order.work_order_sa_status === "Active" || order.work_order_sa_status === "Completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-stone-100 text-stone-600 border border-stone-200"
                            }`}>
                              {order.work_order_sa_status}
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
        )}

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

export default SalesReport;