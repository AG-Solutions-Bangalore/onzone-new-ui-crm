// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import App from './App.jsx'
// import './index.css'
// import { BrowserRouter } from "react-router-dom";
// import AppProvider from './lib/ContextPanel.jsx';

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//        <BrowserRouter  >
//        <AppProvider>
//     <App />
//     </AppProvider>
//     </BrowserRouter>
//   </StrictMode>,
// )
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./lib/axiosInterceptor.js";
import AppProvider from "./lib/ContextPanel.jsx";
import App from "./App.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes fresh cache: instant navigation without redundant fetches
      gcTime: 1000 * 60 * 15, // 15 minutes in-memory cache retention
      refetchOnWindowFocus: false, // Prevents slow refetches on every window/tab focus
      refetchOnMount: false, // Reuses cache when navigating back and forth within staleTime
      refetchOnReconnect: true,
      retry: 1,
    },
  },
}); 

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <QueryClientProvider client={queryClient}>
        {" "}
        <AppProvider>
          <App />
        </AppProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
