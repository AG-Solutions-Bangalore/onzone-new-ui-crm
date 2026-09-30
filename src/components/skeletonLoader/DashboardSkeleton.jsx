import React from "react";
import { Loader2 } from "lucide-react";

const DashboardSkeleton = () => {
  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-[#FAF9F5]">
      <Loader2 className="h-9 w-9 animate-spin text-[#A27B5C]" />
    </div>
  );
};

export default DashboardSkeleton;