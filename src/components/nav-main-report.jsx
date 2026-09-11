

import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom";


const itemVariants = {
  open: { opacity: 1, height: "auto", transition: { duration: 0.3 } },
  closed: { opacity: 0, height: 0, transition: { duration: 0.3 } },
};

const buttonVariants = {
  hover: { scale: 1.05 },
};

export function NavMainReport({
  items
}) {

  if(!items || items.length ===0 ){
    return null 
  }
  const hasActiveItems = items.length > 0
  if(!hasActiveItems){
    return null
  }

  return (
    (<SidebarGroup>
      <SidebarGroupLabel>Report</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible">
            <SidebarMenuItem>
              {/* <CollapsibleTrigger asChild> */}
              <motion.div
                  variants={buttonVariants}
                  whileHover="hover" 
                >
                         <Link to={item.url}>
                <SidebarMenuButton tooltip={item.title}>
         
                     
                {item.icon && <item.icon />}
                <span className="transition-colors duration-200 hover:text-blue-500">{item.title}</span>
          
                  
          
                </SidebarMenuButton>
                         </Link>
                </motion.div>
              {/* </CollapsibleTrigger> */}
              {/* <CollapsibleContent 
               as={motion.div} 
               variants={itemVariants}
               initial="closed"
               animate={item.isActive ? "open" : "closed"}
              >
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <Link to={subItem.url}>
                     
                          <motion.span
                            className="transition-colors duration-200 hover:text-blue-500"
                            whileHover={{ scale: 1.05 }} 
                          >
                            {subItem.title}
                          </motion.span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent> */}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>)
  );
}
