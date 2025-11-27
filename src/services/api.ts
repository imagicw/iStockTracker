import { request, type ApiResponse } from '../utils/request';

export type StockPriceResponse = ApiResponse<Record<string, number>>;

export interface FetchStockPricesParams
{
  symbols: string[];
}

export const fetchStockPrices = async (symbols: string[]): Promise<StockPriceResponse> =>
{
  return request<StockPriceResponse>('/api/v1/batch-quotes', {
    method: 'POST',
    data: { symbols },
  });
};
