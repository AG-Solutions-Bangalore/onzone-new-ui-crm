import { motion } from "framer-motion";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";

export function NavMainUser({ projects }) {
  const { isMobile } = useSidebar();
  const location = useLocation();
  const buttonVariants = {
    hover: { scale: 1.05 },
  };
  if (!projects || projects.length === 0) {
    return null;
  }
  const hasActiveItems = projects.length > 0;
  if (!hasActiveItems) {
    return null;
  }
  return (
    <SidebarGroup>
      <SidebarGroupLabel>User Management</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              key={item.name}
            >
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild tooltip={item.name}>
                  <Link to={item.url}>
                    <item.icon />
                    <span
                      className={`transition-colors duration-200 ${
                        isActive ? "text-blue-500" : "hover:text-blue-500"
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </motion.div>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
