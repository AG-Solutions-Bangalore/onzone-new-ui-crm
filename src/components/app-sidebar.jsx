import * as React from "react";
import {
  LayoutDashboard,
  Settings2,
  Boxes,
  Printer,
  FileText,
  PackageCheck,
  ShoppingBag,
  FileSpreadsheet,
  Archive,
  FolderKanban,
  FileBarChart,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import onzoneDarkLogo from "@/assets/onzone-logo-white-red.png";
import onzoneDarkEmblem from "@/assets/onzone-emblem-white-red.png";

export function AppSidebar({ ...props }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const nameL = localStorage.getItem("name") || "admin";
  const emailL = localStorage.getItem("email") || "admin@onzone.com";
  const userType = localStorage.getItem("userType");

  const initialData = {
    user: {
      name: `${nameL}`,
      email: `${emailL}`,
      avatar: "",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/home",
        icon: LayoutDashboard,
        isActive: false,
      },
      {
        title: "Master",
        url: "#",
        isActive: false,
        icon: Settings2,
        items: [
          {
            title: "Brand",
            url: "/master/brand",
          },
          {
            title: "Style",
            url: "/master/style",
          },
          {
            title: "Factory",
            url: "/master/factory",
          },
          {
            title: "Width",
            url: "/master/width",
          },
          {
            title: "Retailer",
            url: "/master/retailer",
          },
          {
            title: "Ratio",
            url: "/master/ratio",
          },
          {
            title: "Half Ratio",
            url: "/master/half-ratio",
          },
        ],
      },
      {
        title: "Work Order",
        url: "/work-order",
        icon: Boxes,
        isActive: false,
      },
      {
        title: "Sticker Printing",
        url: "/sticker-printing",
        icon: Printer,
      },
      {
        title: "Factory Outward",
        url: "/order-received",
        icon: FileText,
        isActive: false,
        items: [
          {
            title: "Goods Received",
            url: "/factory-outlet/received",
          },
        ],
      },
      {
        title: "Sales",
        url: "/sales",
        icon: ShoppingBag,
        isActive: false,
      },
      {
        title: "Order Form",
        url: "/fair-order-form",
        icon: FileSpreadsheet,
        isActive: false,
      },
      {
        title: "Finished Stock",
        url: "/finished-stock",
        icon: Archive,
        isActive: false,
      },
      {
        title: "Other",
        url: "#",
        icon: FolderKanban,
        isActive: false,
        items: [
          {
            title: "Stock",
            url: "/create-stock",
          },
          {
            title: "Order Form ( Old )",
            url: "/order-form",
          },
        ],
      },
      {
        title: "Reports",
        url: "#",
        icon: FileBarChart,
        isActive: false,
        items: [
          {
            title: "Retailer Report",
            url: "/report/retailer-report",
          },
          {
            title: "Work Order Report",
            url: "/report/work-order-report",
          },
          {
            title: "Received Report",
            url: "/report/received-report",
          },
          {
            title: "Sales Report",
            url: "/report/sales-report",
          },
        ],
      },
    ],
  };

  const data = {
    ...initialData,
    navMain:
      userType === "4"
        ? [
            {
              title: "Work Order",
              url: "/work-order",
              icon: Boxes,
              isActive: false,
            },
            {
              title: "New Packing Slip",
              url: "/order-received",
              icon: FileText,
              isActive: false,
            },
          ]
        : initialData.navMain,
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-stone-800 bg-[#161719] text-stone-200 select-none" {...props}>
      {/* Brand Header */}
      <SidebarHeader className="bg-[#161719] pt-4 pb-3 border-b border-white/5 transition-all overflow-hidden">
        {isCollapsed ? (
          <div className="flex justify-center items-center py-1">
            <img
              src={onzoneDarkEmblem}
              alt="Onzone"
              className="h-8 w-8 object-contain transition-transform hover:scale-110 drop-shadow-xs"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-1">
            <img
              src={onzoneDarkLogo}
              alt="Onzone Logo"
              className="h-11 w-auto max-w-[190px] object-contain transition-transform hover:scale-102 drop-shadow-xs"
            />
          </div>
        )}
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="sidebar-content no-scrollbar bg-[#161719] px-2 py-3">
        <NavMain items={data.navMain} />
      </SidebarContent>

      {/* User Profile Footer */}
      <SidebarFooter className="p-0 bg-[#121315] border-t border-white/10 overflow-hidden">
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
