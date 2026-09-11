import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useLocation } from "react-router-dom";
import React from "react";

export function NavMain({ items }) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLinkClick = () => {
    const sidebarContent = document.querySelector(".sidebar-content");
    if (sidebarContent) {
      sessionStorage.setItem("sidebarScrollPosition", sidebarContent.scrollTop);
    }
  };

  React.useEffect(() => {
    const sidebarContent = document.querySelector(".sidebar-content");
    const scrollPosition = sessionStorage.getItem("sidebarScrollPosition");

    if (sidebarContent && scrollPosition) {
      sidebarContent.scrollTop = parseInt(scrollPosition);
    }
  }, [location.pathname]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="p-0">
      <SidebarMenu className="space-y-1.5">
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;
          const hasDirectUrl = item.url && item.url !== "#";
          const isAnySubItemActive = hasSubItems && item.items.some(
            (subItem) =>
              location.pathname === subItem.url ||
              location.pathname.startsWith(subItem.url + "/")
          );
          const isDirectUrlActive =
            hasDirectUrl &&
            (location.pathname === item.url ||
              location.pathname.startsWith(item.url + "/")) &&
            !isAnySubItemActive;
          const isParentActive = isDirectUrlActive || isAnySubItemActive;

          // Single Link Item without children
          if (!hasSubItems) {
            if (isCollapsed) {
              return (
                <SidebarMenuItem key={item.title} className="flex justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.url}
                        onClick={handleLinkClick}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition-all duration-200 ${
                          isParentActive
                            ? "bg-[#E5D7C3] text-stone-950 font-bold shadow-xs"
                            : "text-stone-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {item.icon && (
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${
                              isParentActive ? "text-stone-950 stroke-[2.2]" : "text-stone-400 stroke-[1.8]"
                            }`}
                          />
                        )}
                        <span className="sr-only">{item.title}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className="bg-[#1C1D1F] text-stone-200 border-stone-800 text-xs">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <Link
                  to={item.url}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isParentActive
                      ? "bg-[#E5D7C3] text-stone-950 font-bold shadow-xs"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.icon && (
                    <item.icon
                      className={`h-4 w-4 shrink-0 ${
                        isParentActive ? "text-stone-950 stroke-[2.2]" : "text-stone-400 stroke-[1.8]"
                      }`}
                    />
                  )}
                  <span className="flex-1">{item.title}</span>
                </Link>
              </SidebarMenuItem>
            );
          }

          // Item with Children (e.g. Master, Factory Outward, Other, Reports)
          if (isCollapsed) {
            return (
              <SidebarMenuItem key={item.title} className="flex justify-center">
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition-all duration-200 ${
                            isParentActive
                              ? "bg-[#E5D7C3] text-stone-950 font-bold shadow-xs"
                              : "text-stone-300 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {item.icon && (
                            <item.icon
                              className={`h-4 w-4 shrink-0 ${
                                isParentActive ? "text-stone-950 stroke-[2.2]" : "text-stone-400 stroke-[1.8]"
                              }`}
                            />
                          )}
                          <span className="sr-only">{item.title}</span>
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className="bg-[#1C1D1F] text-stone-200 border-stone-800 text-xs">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenuContent
                    side="right"
                    align="start"
                    sideOffset={12}
                    className="w-48 rounded-xl bg-[#1C1D1F] text-stone-200 border border-stone-800 shadow-xl p-1.5 z-50"
                  >
                    {hasDirectUrl ? (
                      <DropdownMenuItem asChild>
                        <Link
                          to={item.url}
                          onClick={handleLinkClick}
                          className={`flex items-center w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer mb-1 border-b border-white/5 ${
                            isDirectUrlActive
                              ? "bg-[#E5D7C3] text-stone-950 font-bold"
                              : "text-stone-200 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {item.title}
                        </Link>
                      </DropdownMenuItem>
                    ) : (
                      <div className="px-2.5 py-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider border-b border-white/5 mb-1">
                        {item.title}
                      </div>
                    )}
                    {item.items?.map((subItem) => {
                      const isSubItemActive =
                        location.pathname === subItem.url ||
                        location.pathname.startsWith(subItem.url + "/");
                      return (
                        <DropdownMenuItem key={subItem.title} asChild>
                          <Link
                            to={subItem.url}
                            onClick={handleLinkClick}
                            className={`flex items-center w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              isSubItemActive
                                ? "bg-[#E5D7C3] text-stone-950 font-bold"
                                : "text-stone-300 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            {subItem.title}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isParentActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {hasDirectUrl ? (
                  <div
                    className={`flex items-center justify-between w-full rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isDirectUrlActive
                        ? "bg-[#E5D7C3] text-stone-950 font-bold shadow-xs"
                        : isAnySubItemActive
                        ? "text-white bg-white/10"
                        : "text-stone-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Link
                      to={item.url}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 flex-1 px-3.5 py-2.5 min-w-0"
                    >
                      {item.icon && (
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${
                            isDirectUrlActive
                              ? "text-stone-950 stroke-[2.2]"
                              : "text-stone-400 stroke-[1.8]"
                          }`}
                        />
                      )}
                      <span className="truncate">{item.title}</span>
                    </Link>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Toggle ${item.title} submenu`}
                        className={`p-2.5 mr-1 rounded-lg transition-colors cursor-pointer ${
                          isDirectUrlActive
                            ? "text-stone-900 hover:bg-black/10"
                            : "text-stone-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </button>
                    </CollapsibleTrigger>
                  </div>
                ) : (
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isParentActive
                          ? "text-white bg-white/10"
                          : "text-stone-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && (
                          <item.icon className="h-4 w-4 shrink-0 text-stone-400 stroke-[1.8]" />
                        )}
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-stone-500 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </button>
                  </CollapsibleTrigger>
                )}

                <CollapsibleContent className="pl-6 pr-1 pt-1 pb-1">
                  <SidebarMenuSub className="border-l border-white/10 pl-2 space-y-0.5">
                    {item.items?.map((subItem) => {
                      const isSubItemActive =
                        location.pathname === subItem.url ||
                        location.pathname.startsWith(subItem.url + "/");
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <Link
                            to={subItem.url}
                            onClick={handleLinkClick}
                            className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 select-none ${
                              isSubItemActive
                                ? "bg-[#E5D7C3] text-stone-950 font-bold shadow-2xs"
                                : "text-stone-400 hover:text-white"
                            }`}
                          >
                            {subItem.title}
                          </Link>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}