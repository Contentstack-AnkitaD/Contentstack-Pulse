import { useCallback } from "react";
import { useAppSdk } from "./useAppSdk";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, string>;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export const useAppSdkApi = () => {
  const [appSdk] = useAppSdk();

  const apiCall = useCallback(
    async <T = any>(endpoint: string, options: ApiOptions = {}): Promise<ApiResponse<T>> => {
      if (!appSdk) {
        throw new Error("App SDK not initialized");
      }

      const { method = "GET", headers = {}, data, params } = options;

      let url = `${appSdk.endpoints.CMA}${endpoint}`;
      if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
      }

      const requestOptions: any = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      if (data && method !== "GET") {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await appSdk.api(url, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API call failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error_message || errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
      };
    },
    [appSdk]
  );

  return { apiCall, isReady: !!appSdk, appSdk };
};
