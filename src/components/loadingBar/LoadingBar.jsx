import { useEffect, useState } from "react";
import "./TopLoadingBar.css";
import Page from "@/app/dashboard/page";
import { Loader2 } from "lucide-react";

const LoadingBar = () => {
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 95) {
          clearInterval(interval);
          return prevProgress;
        }
        return prevProgress + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <Page>
      <div className="top-loading-bar" style={{ width: `${progress}%` }}></div>
      <div className="flex justify-center items-center min-h-[60vh] w-full">
        <Loader2 className="h-9 w-9 animate-spin text-[#A27B5C]" />
      </div>
    </Page>
  );
};

export default LoadingBar;