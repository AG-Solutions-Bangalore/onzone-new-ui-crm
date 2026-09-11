import {
  Key,
  LogOut,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ChangePassword from "@/app/auth/ChangePassword";
import Profile from "@/app/auth/Profile";

export function NavUser({ user }) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [open, setOpen] = useState(false);
  const [openprofile, setOpenProfile] = useState(false);

  const handleLogout = async () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const name = user?.name || "admin";
  const initials = name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase() || "A";

  return (
    <>
      <div className={`flex items-center bg-[#121315] text-stone-200 ${isCollapsed ? "justify-center p-2" : "justify-between p-3"}`}>
        <DropdownMenu>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E5D7C3] text-stone-950 font-extrabold text-xs shadow-xs hover:opacity-90 transition-opacity"
                  >
                    {initials}
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" className="bg-[#1C1D1F] text-stone-200 border-stone-800 text-xs">
                {name} (Administrator)
              </TooltipContent>
            </Tooltip>
          ) : (
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity flex-1 min-w-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E5D7C3] text-stone-950 font-extrabold text-xs shadow-xs">
                  {initials}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-xs font-bold text-white capitalize truncate">
                    {name}
                  </p>
                  <p className="text-[10px] text-stone-400 font-medium">Administrator</p>
                </div>
              </button>
            </DropdownMenuTrigger>
          )}

          <DropdownMenuContent
            className="w-48 rounded-xl bg-[#1C1D1F] text-stone-200 border border-stone-800 shadow-xl z-50"
            side={isCollapsed ? "right" : "top"}
            align={isCollapsed ? "start" : "start"}
            sideOffset={isCollapsed ? 12 : 8}
          >
            <div className="px-2.5 py-1.5 border-b border-white/5 mb-1">
              <p className="text-xs font-bold text-white capitalize">{name}</p>
              <p className="text-[10px] text-stone-400">Administrator</p>
            </div>
            <DropdownMenuItem
              onClick={() => setOpenProfile(true)}
              className="cursor-pointer text-xs hover:bg-white/10 text-stone-300 hover:text-white"
            >
              <User className="h-4 w-4 mr-2" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setOpen(true)}
              className="cursor-pointer text-xs hover:bg-white/10 text-stone-300 hover:text-white"
            >
              <Key className="h-4 w-4 mr-2" />
              <span>Change Password</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-stone-800" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!isCollapsed && (
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors ml-1 shrink-0"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      <ChangePassword setOpen={setOpen} open={open} />
      <Profile setOpen={setOpenProfile} open={openprofile} />
    </>
  );
}
