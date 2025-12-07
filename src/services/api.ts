import { request, type ApiResponse } from '../utils/request';

export type StockPriceResponse = ApiResponse<Record<string, number>>;

export interface FetchStockPricesParams {
  symbols: string[];
}


export interface StockInfo {
  symbol: string;
  name: string;
  market: string;
}

export const fetchStockPrices = async (symbols: string[]): Promise<StockPriceResponse> => {
  return request<StockPriceResponse>('/api/v1/stock/price', {
    method: 'GET',
    params: { symbols: symbols, mode: 'simple' },
  });
};

export const searchStocks = async (name: string): Promise<ApiResponse<StockInfo[]>> => {
  return request<ApiResponse<StockInfo[]>>(`/api/v1/stock/search?name=${encodeURIComponent(name)}`, {
    method: 'GET',
  });
};

export const fetchCNMarketStocks = async (): Promise<ApiResponse<StockInfo[]>> => {
  return request<ApiResponse<StockInfo[]>>('/api/v1/stock/market/CN', {
    method: 'GET',
  });
};
