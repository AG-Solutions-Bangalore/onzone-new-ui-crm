import React, { useState, useMemo, useEffect } from "react";
import Page from "../dashboard/page";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import BASE_URL from "@/config/BaseUrl";
import { useCurrentYear } from "@/hooks/useCurrentYear";
import { Card } from "@/components/ui/card";
import {
  ErrorComponent,
  LoaderComponent,
} from "@/components/LoaderComponent/LoaderComponent";
import {
  Package,
  ShoppingCart,
  Box,
  User,
  ArrowRight,
  ExternalLink,
  Calendar,
  BarChart2,
  FileText,
  ChevronDown,
  RefreshCw,
  Shirt,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import heroFashionImage from "@/assets/hero_fashion_hanger.jpg";

// Custom Tooltip matching the warm minimal aesthetic
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const received = payload.find((p) => p.dataKey === "total_received")?.value || 0;
    const sales = payload.find((p) => p.dataKey === "total_sales")?.value || 0;

    return (
      <div className="rounded-xl border border-stone-200 bg-white/95 p-3 text-stone-900 shadow-xl backdrop-blur-md text-xs">
        <p className="font-bold text-stone-800 border-b border-stone-100 pb-1.5 mb-2 font-heading">
          {label}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-stone-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-[#A27B5C]" />
              Total Received:
            </span>
            <span className="font-bold text-stone-900 font-mono">{Number(received).toLocaleString()} pcs</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-stone-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-[#1E232A]" />
              Total Sales:
            </span>
            <span className="font-bold text-stone-900 font-mono">{Number(sales).toLocaleString()} pcs</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const defaultYearList = ["2026-27", "2025-26", "2024-25", "2023-24", "2022-23"];

const Home = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") || "Admin";

  const { data: currentYear } = useCurrentYear();
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    if (currentYear && !selectedYear) {
      setSelectedYear(currentYear);
    }
  }, [currentYear, selectedYear]);

  const activeYear = selectedYear || currentYear || "2024-25";

  const availableYears = useMemo(() => {
    const set = new Set(defaultYearList);
    if (currentYear) set.add(currentYear);
    return Array.from(set).sort().reverse();
  }, [currentYear]);

  const {
    data: dashboardData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["dashboardSummary", activeYear],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/fetch-dashboard-data-by/${activeYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    enabled: !!activeYear,
  });

  // Safe data extraction
  const finalStockData = useMemo(() => dashboardData?.finalStock || [], [dashboardData]);
  const recentOrders = useMemo(() => dashboardData?.recent_work_order || [], [dashboardData]);
  const pendingStickers = dashboardData?.pending_sticker_print || 0;
  const pendingWorkOrders = dashboardData?.workorder_factory_count || 0;
  const ordersOnTheWay = dashboardData?.workorder_ontheway_count || 0;
  const activeRetailers = dashboardData?.retailer_count || 0;

  // Sorted stock data for bar chart
  const sortedStock = useMemo(() => {
    return [...finalStockData].sort(
      (a, b) => (Number(b.total_received) || 0) - (Number(a.total_received) || 0)
    );
  }, [finalStockData]);

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Dedicated custom fashion vector icons
  const ShirtIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      <path d="M12 2v20" />
      <path d="m8 2 4 4 4-4" />
    </svg>
  );

  const TShirtIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12l3 4-2 3-3-2v11H8V9L5 11 3 8l3-4z" />
      <path d="M9 4a3 3 0 0 0 6 0" />
    </svg>
  );

  const JeansIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h14v3l-2 13H13l-1-9-1 9H7L5 7V4z" />
      <path d="M5 7h14" />
      <path d="M8 7v2" />
      <path d="M16 7v2" />
      <path d="M12 4v3" />
    </svg>
  );

  const TrousersIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v4l-1.5 14H13l-1-10-1 10H7.5L6 7V3z" />
      <path d="M6 6h12" />
      <line x1="9.5" y1="9" x2="9.5" y2="18" strokeDasharray="1 2" />
      <line x1="14.5" y1="9" x2="14.5" y2="18" strokeDasharray="1 2" />
    </svg>
  );

  const JacketIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5 9 3l3 4 3-4 5 2-2 15H6L4 5z" />
      <path d="M9 3v8l3 3 3-3V3" />
      <path d="M12 14v7" />
      <path d="M4 5l4 6" />
      <path d="M20 5l-4 6" />
    </svg>
  );

  // Top selling categories data with specific apparel icons
  const topCategories = [
    { name: "Shirts", percent: 38, iconBg: "bg-[#FDF6ED]", iconColor: "text-amber-800", icon: ShirtIcon },
    { name: "T-Shirts", percent: 24, iconBg: "bg-[#EEF5FD]", iconColor: "text-sky-700", icon: TShirtIcon },
    { name: "Jeans", percent: 18, iconBg: "bg-[#EDF8F3]", iconColor: "text-emerald-700", icon: JeansIcon },
    { name: "Trousers", percent: 12, iconBg: "bg-[#F4F0FD]", iconColor: "text-purple-700", icon: TrousersIcon },
    { name: "Jackets", percent: 8, iconBg: "bg-stone-100", iconColor: "text-stone-800", icon: JacketIcon },
  ];

  if (isLoading) {
    return <LoaderComponent name="Dashboard Data" />;
  }

  if (isError) {
    return (
      <ErrorComponent
        message="Error Fetching Dashboard Data"
        refetch={refetch}
      />
    );
  }

  return (
    <Page>
      <div className="space-y-4 max-w-[1520px] mx-auto text-stone-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-[#F4EFEB] border border-[#ECE5DD] p-6 sm:p-8 flex flex-col justify-between shadow-sm min-h-[185px]">
          {/* Background Fashion Hanger Image with Smooth Alpha Mask Fade */}
          <div
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[52%] pointer-events-none overflow-hidden"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.3) 25%, rgba(0, 0, 0, 0.9) 70%, rgba(0, 0, 0, 1) 100%)",
              maskImage:
                "linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.3) 25%, rgba(0, 0, 0, 0.9) 70%, rgba(0, 0, 0, 1) 100%)",
            }}
          >
            <img
              src={heroFashionImage}
              alt="Men's collection"
              className="h-full w-full object-cover object-right mix-blend-multiply opacity-75"
            />
          </div>

          {/* Handwritten overlay */}
          <div className="absolute right-6 top-5 sm:right-12 sm:top-6 z-10 pointer-events-none hidden md:block">
            <span className="font-handwriting text-2xl sm:text-3xl text-stone-700 tracking-wide rotate-[-6deg] inline-block">
              Style<br />Sells<br />Confidence
            </span>
          </div>

          <div className="relative z-10 max-w-xl space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-heading">
              {greeting}, <span className="capitalize">{userName}</span>! 👋
            </h1>
            <p className="text-sm sm:text-base font-semibold text-stone-700">
              Welcome back to Onzone CRM
            </p>
            <p className="text-xs sm:text-sm text-stone-500 font-normal leading-relaxed pt-0.5 max-w-md">
              Manage your men's fashion business — from inventory to orders, all in one place.
            </p>
          </div>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Pending Stickers */}
          <div
            onClick={() => navigate("/sticker-printing")}
            className="rounded-2xl bg-[#FDF6ED] border border-[#FBEAD6] p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F6E3CC] text-amber-800">
                <Package className="h-6 w-6 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-600">Pending Stickers</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl font-bold text-stone-900 font-heading">
                    {pendingStickers.toLocaleString()}
                  </h3>
                  <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-[#FCE8D3] px-1.5 py-0.5 rounded">
                    ↑ 12%
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">Require barcode printing</p>
              </div>
            </div>
          </div>

          {/* Card 2: Pending Work Orders */}
          <div
            onClick={() => navigate("/work-order")}
            className="rounded-2xl bg-[#EEF5FD] border border-[#DDEBFA] p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D8E9FB] text-blue-700">
                <ShoppingCart className="h-6 w-6 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-600">Pending Work Orders</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl font-bold text-stone-900 font-heading">
                    {pendingWorkOrders.toLocaleString()}
                  </h3>
                  <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-[#DCEBFA] px-1.5 py-0.5 rounded">
                    ↑ 8%
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">In production queue</p>
              </div>
            </div>
          </div>

          {/* Card 3: Orders on the Way */}
          <div
            onClick={() => navigate("/order-received")}
            className="rounded-2xl bg-[#EDF8F3] border border-[#DBF1E5] p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D1EDDE] text-emerald-800">
                <Box className="h-6 w-6 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-600">Orders on the Way</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl font-bold text-stone-900 font-heading">
                    {ordersOnTheWay.toLocaleString()}
                  </h3>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-[#D8F0E4] px-1.5 py-0.5 rounded">
                    ↑ 14%
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">In transit / dispatched</p>
              </div>
            </div>
          </div>

          {/* Card 4: Active Retailers */}
          <div
            onClick={() => navigate("/master/retailer")}
            className="rounded-2xl bg-[#F4F0FD] border border-[#E8DEFA] p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#DFD3F8] text-purple-800">
                <User className="h-6 w-6 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-600">Active Retailers</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl font-bold text-stone-900 font-heading">
                    {activeRetailers.toLocaleString()}
                  </h3>
                  <span className="inline-flex items-center text-[10px] font-bold text-purple-700 bg-[#E8DEFA] px-1.5 py-0.5 rounded">
                    ↑ 0%
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">Registered network</p>
              </div>
            </div>
          </div>
        </div>

        {/* FULL WIDTH: Brand Inventory & Sales Chart */}
        <Card className="rounded-2xl border border-stone-200/70 bg-white p-5 sm:p-6 shadow-sm w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 font-heading">
                  Brand Inventory & Sales
                </h3>
                <p className="text-xs text-stone-400">
                  Live analytics comparing goods received against total sales across different brands.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Financial Year Selector Dropdown */}
              <div className="relative flex items-center">
                <Calendar className="absolute left-2.5 h-3.5 w-3.5 text-stone-500 pointer-events-none" />
                <select
                  value={activeYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold rounded-lg pl-8 pr-7 py-1.5 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#A27B5C]/30 transition-colors"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      FY {yr} {yr === currentYear ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-5 text-xs font-medium text-stone-600 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#A27B5C]" />
              <span>Total Received</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1E232A]" />
              <span>Total Sales</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-[300px] w-full pt-1">
            {sortedStock.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedStock}
                  margin={{ top: 10, right: 15, left: 10, bottom: 25 }}
                  barGap={4}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F5F5F7"
                  />
                  <XAxis
                    dataKey="fabric_brand_brands"
                    tick={{ fill: "#78716C", fontSize: 11, fontWeight: 500 }}
                    tickLine={false}
                    axisLine={{ stroke: "#E7E5E4" }}
                    interval={0}
                  />
                  <YAxis
                    width={45}
                    tick={{ fill: "#78716C", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return val;
                    }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar
                    name="Total Received"
                    dataKey="total_received"
                    fill="#A27B5C"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={34}
                  />
                  <Bar
                    name="Total Sales"
                    dataKey="total_sales"
                    fill="#1E232A"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 text-stone-400">
                <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-2">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-stone-600">No brand inventory data found for FY {activeYear}</p>
                <p className="text-[11px] text-stone-400 mt-0.5 max-w-xs">
                  Try selecting another financial year to view available records.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                  {availableYears
                    .filter((y) => y !== activeYear)
                    .slice(0, 3)
                    .map((y) => (
                      <button
                        key={y}
                        onClick={() => setSelectedYear(y)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-stone-100 hover:bg-[#A27B5C] hover:text-white text-stone-700 transition-colors cursor-pointer"
                      >
                        Check FY {y}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* BOTTOM ROW: Recent Work Orders (7 cols) + Top Selling Categories (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left: Recent Work Orders (7 cols) */}
          <Card className="lg:col-span-7 rounded-2xl border border-stone-200/70 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-heading">
                    Recent Work Orders
                  </h3>
                  <p className="text-xs text-stone-400">
                    Latest factory production and delivery requests for FY {activeYear}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/work-order")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-950 bg-stone-100/80 hover:bg-stone-200/80 px-3 py-1.5 rounded-full transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Clean Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-2.5 px-3">WO Number</th>
                    <th className="py-2.5 px-3">Brand</th>
                    <th className="py-2.5 px-3">Pieces</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-stone-50/70 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <span className="font-semibold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-xs">
                            #{order.work_order_no}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-stone-800">
                            {order.work_order_brand || "Onzone"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-stone-900 font-mono">
                            {Number(order.work_order_count || 0).toLocaleString()}{" "}
                            <span className="font-normal text-stone-400 font-sans">pcs</span>
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100/90 px-2.5 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            {order.work_order_status || "Factory"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/work-order/view-work-order/${order.id}`)
                            }
                            className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-950 font-medium"
                          >
                            <span>Details</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-stone-400">
                        <p className="text-xs font-semibold text-stone-600">No recent work orders found for FY {activeYear}</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Try selecting another financial year above or check the full work order registry.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Right: Top Selling Categories (5 cols) */}
          <Card className="lg:col-span-5 rounded-2xl border border-stone-200/70 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-base font-bold text-stone-900 font-heading">
                Top Selling Categories
              </h3>
              <button
                type="button"
                onClick={() => navigate("/finished-stock")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-950 bg-stone-100/80 hover:bg-stone-200/80 px-2.5 py-1 rounded-full transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Category List */}
            <div className="space-y-4">
              {topCategories.map((cat, index) => {
                const CategoryIcon = cat.icon || Shirt;
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg ${cat.iconBg} ${cat.iconColor} shadow-2xs`}
                        >
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-stone-800">{cat.name}</span>
                      </div>
                      <span className="font-bold text-stone-700 text-xs font-mono">
                        {cat.percent}%
                      </span>
                    </div>

                    {/* Progress Bar in Warm Brown */}
                    <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#A27B5C] transition-all duration-500"
                        style={{ width: `${cat.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
};

export default Home;
