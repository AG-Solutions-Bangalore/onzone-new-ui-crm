import React from "react";

const DashboardSkeleton = () => {
  return (
    <div>
      {/* Mobile Skeleton (hidden on md and larger screens) */}
      <div className="sm:hidden">
        {/* <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <div className="animate-pulse flex flex-col space-y-4 w-full max-w-4xl p-4">
           
            <div className="h-12 bg-gray-300 rounded w-full mx-auto"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-gray-300 rounded-lg p-6">
                  <div className="h-4 bg-gray-400 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-400 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-400 rounded w-2/3"></div>
                </div>
              ))}
            </div>

      
            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mt-8"></div>
          </div>
        </div> */}
      </div>

      {/* Desktop Skeleton (hidden on screens smaller than md) */}
      <div className="hidden md:block">
        {/* <div className="flex min-h-screen bg-gray-100">
         
          <div className="w-64 bg-gray-200 p-6 animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-4 bg-gray-300 rounded w-3/4"></div>
              ))}
            </div>
          </div>

        
          <div className="flex-1 p-6 animate-pulse">
        
            <div className="h-12 bg-gray-300 rounded w-full mb-6"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-gray-300 rounded-lg p-6">
                  <div className="h-4 bg-gray-400 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-400 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-400 rounded w-2/3"></div>
                </div>
              ))}
            </div>


            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mt-8"></div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default DashboardSkeleton;