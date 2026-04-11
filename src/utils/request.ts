export interface ApiResponse<T = any> {
  code: number;
  data: T;
  msg: string;
  total?: number;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

export const request = async <T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { params, data: requestData, headers, timeout, ...restOptions } = options;

  let finalUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      finalUrl += (finalUrl.includes("?") ? "&" : "?") + queryString;
    }
  }

  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const finalOptions: RequestInit = {
    ...restOptions,
    headers: finalHeaders,
  };

  if (requestData && !finalOptions.body) {
    finalOptions.body = JSON.stringify(requestData);
  }

  // 🛡️ Sentinel: Add timeout to prevent hanging requests and DoS
  const timeoutMs = timeout || 10000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  finalOptions.signal = controller.signal;

  try {
    const response = await fetch(finalUrl, finalOptions);
    clearTimeout(id);

    if (!response.ok) {
      const error: any = new Error(response.statusText);
      error.response = response;
      error.status = response.status;
      throw error;
    }

    const data: ApiResponse = await response.json();

    if (data.code !== 0) {
      throw new Error(data.msg || "Unknown error");
    }

    return data as any;
  } catch (error: any) {
    clearTimeout(id);

    // 🛡️ Sentinel: Sanitize error logging to avoid leaking sensitive request/response data (headers, etc.)
    const safeLog = {
      name: error.name,
      message: error.message,
      status: error.status || error.response?.status,
      type: error.type,
    };
    console.error("Request failed:", safeLog);
    throw error;
  }
};

// Add shorthand methods if needed by other parts of the app
request.get = <T = any>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'GET' });
request.post = <T = any>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'POST' });
request.put = <T = any>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'PUT' });
request.delete = <T = any>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'DELETE' });
request.patch = <T = any>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'PATCH' });
