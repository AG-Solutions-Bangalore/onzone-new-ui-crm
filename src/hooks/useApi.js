
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BASE_URL from "@/config/BaseUrl";

const STALE_TIME = 5 * 60 * 1000;
const CACHE_TIME = 30 * 60 * 1000;

const fetchData = async (endpoint, token) => {
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) throw new Error(`Failed to fetch data from ${endpoint}`);
  return response.json();
};

const createQueryConfig = (queryKey, endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  return {
    queryKey,
    queryFn: () => fetchData(endpoint, token),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    cacheTime: CACHE_TIME,
    retry: 2,
    ...options,
  };
};



// onzone hooks 


export const useFetchBrand = () => {
  return useQuery(createQueryConfig(["brand"], "/api/fetch-brand"));
};
export const useFetchWidth = () => {
  return useQuery(
    createQueryConfig(["width"], "/api/fetch-width")
  );
};
export const useFetchStyle = () => {
  return useQuery(
    createQueryConfig(["style"], "/api/fetch-style")
  );
};
export const useFetchRatio = () => {
  return useQuery(
    createQueryConfig(["ratio"], "/api/fetch-ratio")
  );
};
export const useFetchHalfRatio = () => {
  return useQuery(
    createQueryConfig(["half_ratio"], "/api/fetch-half-ratio")
  );
};
export const useFetchFactory = () => {
  return useQuery(
    createQueryConfig(["factory"], "/api/fetch-factory")
  );
};
export const useFetchCurrentYear = () => {
  return useQuery(
    createQueryConfig(["current_year"], "/api/fetch-year")
  );
};
export const useFetchRetailer = () => {
  return useQuery(
    createQueryConfig(["retailers"], "/api/fetch-customer")
  );
};
