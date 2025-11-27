export type TransactionType = 'BUY' | 'SELL' | 'DIVIDEND' | 'INTEREST';
export type ToastType = 'success' | 'error' | 'info';
export type SortDirection = 'asc' | 'desc';

export interface Account
{
  id: string;
  name: string;
  broker: string;
  initialRealizedPnL?: number;
}

export interface Transaction
{
  id: string;
  accountId: string;
  stockCode: string;
  stockName: string;
  type: TransactionType;
  price: number;
  shares: number;
  commission: number;
  tax: number;
  otherFees: number;
  marginInterest: number;
  date: string;
  status?: 'normal' | 'revoked';
  groupTag?: string;
  createdAt?: any;
}

export interface StockPosition
{
  stockCode: string;
  stockName: string;
  sharesHeld: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalFees: number;
  totalInterest: number;
  totalDividend: number;
  lastUpdate: string;
  isCleared: boolean;
}

export interface TradeGroupStats
{
  tag: string;
  stockCode: string;
  stockName: string;
  buyVol: number;
  sellVol: number;
  totalBuyCost: number;
  totalSellRevenue: number;
  netProfit: number;
  roi: number;
  isClosed: boolean;
  startDate: string;
  endDate: string;
  transactions: Transaction[];
}

export interface StockStrategyStats
{
  stockCode: string;
  stockName: string;
  totalBuyCost: number;
  totalSellRevenue: number;
  netProfit: number;
  roi: number;
  groups: TradeGroupStats[];
}
