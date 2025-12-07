import { request, type ApiResponse } from '../utils/request';

export type StockPriceResponse = ApiResponse<Record<string, number>>;

export interface FetchStockPricesParams {
  symbols: string[];
}


export interface StockInfo {
  code: string;
  name: string;
}

export const fetchStockPrices = async (symbols: string[]): Promise<StockPriceResponse> => {
  return request<StockPriceResponse>('/api/v1/stocks/price', {
    method: 'GET',
    params: { symbols: symbols, mode: 'simple' },
  });
};

export const searchStocks = async (name: string): Promise<StockInfo[]> => {
  return request<StockInfo[]>(`/api/v1/stock/search?name=${encodeURIComponent(name)}`, {
    method: 'GET',
  });
};
