

import { useEffect, useState } from 'react';
import './TopLoadingBar.css'; 
import Page from '@/app/dashboard/page';



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
 </Page>
  );
};

export default LoadingBar;