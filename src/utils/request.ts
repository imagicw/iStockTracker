
import { extend, type ResponseError } from 'umi-request';

export interface ApiResponse<T = any>
{
  code: number;
  data: T;
  msg: string;
  total?: number;
}

const request = extend({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  errorHandler: (error: ResponseError) =>
  {
    console.error('Request failed:', error);
    throw error;
  },
});

// Response Interceptor
request.interceptors.response.use(async (response) =>
{
  const data: ApiResponse = await response.clone().json();
  if (data.code !== 0)
  {
    throw new Error(data.msg || 'Unknown error');
  }
  return response;
});

export { request };

