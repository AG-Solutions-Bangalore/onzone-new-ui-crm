import {  useToast } from "@/hooks/use-toast";
import { useEffect } from "react";


const DisableInspect = () => {
  const {toast}= useToast()
  useEffect(() => {
    const handleRightClick = (e) => {
      e.preventDefault();
    
      toast({
        title: "Warning",
        description: "Right click is disabled.",
        variant: "destructive",
      });
    };

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) || 
        (e.metaKey && e.altKey && key === "i") 
      ) {
        e.preventDefault();
     
        toast({
          title: "Warning",
          description: "Developer tools are disabled on this page.",
          variant: "destructive",
        });
        return false;
      }
    };

    document.addEventListener("contextmenu", handleRightClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleRightClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
};

export default DisableInspect;