import { extend, type ResponseError } from "umi-request";

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  msg: string;
  total?: number;
}

const request = extend({
  headers: {
    "Content-Type": "application/json",
  },
  errorHandler: (error: ResponseError) => {
    // 🛡️ Sentinel: Sanitize error logging to avoid leaking sensitive request/response data (headers, etc.)
    const safeLog = {
      name: error.name,
      message: error.message,
      status: error.response?.status,
      type: error.type,
    };
    console.error("Request failed:", safeLog);
    throw error;
  },
});

// Response Interceptor
request.interceptors.response.use(async (response) => {
  const data: ApiResponse = await response.clone().json();
  if (data.code !== 0) {
    throw new Error(data.msg || "Unknown error");
  }
  return response;
});

export { request };
