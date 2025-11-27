import { useMemo, useState } from 'react';
import type { Transaction, StockPosition, TradeGroupStats, StockStrategyStats, SortDirection, Account } from '../types';

export const usePortfolioAnalysis = (
  transactions: Transaction[],
  accounts: Account[],
  prices: Record<string, number>,
  selectedAccountId: string
) =>
{
  // Sort State
  const [holdingsSort, setHoldingsSort] = useState<{ key: keyof StockPosition; direction: SortDirection }>({ key: 'marketValue', direction: 'desc' });
  const [historySort, setHistorySort] = useState<{ key: keyof StockPosition; direction: SortDirection }>({ key: 'realizedPnL', direction: 'desc' });

  // --- Calculation Engine ---
  const portfolio = useMemo(() =>
  {
    const positions: Record<string, StockPosition> = {};

    const sortedTx = [...transactions].sort((a, b) =>
    {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      const diff = dateA - dateB;
      if (diff !== 0) return diff;
      if (a.createdAt && b.createdAt)
      {
        return a.createdAt.seconds - b.createdAt.seconds;
      }
      return 0;
    });

    sortedTx.forEach((tx) =>
    {
      if (selectedAccountId !== 'all' && tx.accountId !== selectedAccountId) return;
      if (tx.status === 'revoked') return;

      if (!positions[tx.stockCode])
      {
        positions[tx.stockCode] = {
          stockCode: tx.stockCode,
          stockName: tx.stockName || tx.stockCode,
          sharesHeld: 0,
          avgCost: 0,
          currentPrice: prices[tx.stockCode] || tx.price,
          marketValue: 0,
          totalCost: 0,
          realizedPnL: 0,
          unrealizedPnL: 0,
          totalFees: 0,
          totalInterest: 0,
          totalDividend: 0,
          lastUpdate: tx.date,
          isCleared: false,
        };
      }

      const pos = positions[tx.stockCode];
      const totalFee = (Number(tx.commission) || 0) + (Number(tx.tax) || 0) + (Number(tx.otherFees) || 0);
      pos.totalFees += totalFee;
      pos.lastUpdate = tx.date;

      if (tx.type === 'BUY')
      {
        const cost = tx.price * tx.shares + totalFee;
        pos.totalCost += cost;
        pos.sharesHeld += Number(tx.shares);
        if (pos.sharesHeld > 0)
        {
          pos.avgCost = pos.totalCost / pos.sharesHeld;
        }
      } else if (tx.type === 'SELL')
      {
        const revenue = tx.price * tx.shares - totalFee;
        const costOfSharesSold = pos.avgCost * tx.shares;
        const pnl = revenue - costOfSharesSold;

        pos.realizedPnL += pnl;
        pos.sharesHeld -= Number(tx.shares);
        pos.totalCost -= costOfSharesSold;

        if (pos.sharesHeld < 0.0001 && pos.sharesHeld > -1)
        {
          pos.sharesHeld = 0;
          pos.totalCost = 0;
          pos.avgCost = 0;
        }
      } else if (tx.type === 'DIVIDEND')
      {
        const netDividend = (Number(tx.price) || 0) - (Number(tx.tax) || 0);
        pos.totalDividend += netDividend;
        pos.realizedPnL += netDividend;
      } else if (tx.type === 'INTEREST')
      {
        const interestAmount = Number(tx.price) || 0;
        pos.totalInterest += interestAmount;
        pos.realizedPnL -= interestAmount;
      }
    });

    Object.values(positions).forEach((pos) =>
    {
      pos.currentPrice = prices[pos.stockCode] || pos.currentPrice;

      if (pos.sharesHeld > 0.0001)
      {
        pos.marketValue = pos.sharesHeld * pos.currentPrice;
        pos.unrealizedPnL = pos.marketValue - pos.totalCost;
        pos.isCleared = false;
      } else
      {
        pos.marketValue = 0;
        pos.unrealizedPnL = 0;
        pos.isCleared = true;
      }
    });

    return positions;
  }, [transactions, selectedAccountId, prices]);

  const activePositions = useMemo(() => Object.values(portfolio).filter((p) => !p.isCleared), [portfolio]);
  const clearedPositions = useMemo(() => Object.values(portfolio).filter((p) => p.isCleared), [portfolio]);

  // Group Analysis Calculation
  const groupAnalysis = useMemo(() =>
  {
    const groups: Record<string, TradeGroupStats> = {};

    transactions.forEach((tx) =>
    {
      if (selectedAccountId !== 'all' && tx.accountId !== selectedAccountId) return;
      if (tx.status === 'revoked') return;
      if (!tx.groupTag) return;

      const tagKey = `${tx.stockCode}_${tx.groupTag}`;

      if (!groups[tagKey])
      {
        groups[tagKey] = {
          tag: tx.groupTag,
          stockCode: tx.stockCode,
          stockName: tx.stockName,
          buyVol: 0,
          sellVol: 0,
          totalBuyCost: 0,
          totalSellRevenue: 0,
          netProfit: 0,
          roi: 0,
          isClosed: false,
          startDate: tx.date,
          endDate: tx.date,
          transactions: [],
        };
      }

      const group = groups[tagKey];
      group.transactions.push(tx);
      if (tx.date < group.startDate) group.startDate = tx.date;
      if (tx.date > group.endDate) group.endDate = tx.date;

      const totalFee = (Number(tx.commission) || 0) + (Number(tx.tax) || 0) + (Number(tx.otherFees) || 0);

      if (tx.type === 'BUY')
      {
        group.buyVol += tx.shares;
        group.totalBuyCost += tx.price * tx.shares + totalFee;
      } else if (tx.type === 'SELL')
      {
        group.sellVol += tx.shares;
        group.totalSellRevenue += tx.price * tx.shares - totalFee;
      } else if (tx.type === 'INTEREST')
      {
        group.totalSellRevenue -= tx.price;
      } else if (tx.type === 'DIVIDEND')
      {
        const netDiv = (Number(tx.price) || 0) - (Number(tx.tax) || 0);
        group.totalSellRevenue += netDiv;
      }
    });

    return Object.values(groups)
      .map((g) =>
      {
        g.netProfit = g.totalSellRevenue - g.totalBuyCost;
        g.roi = g.totalBuyCost > 0 ? (g.netProfit / g.totalBuyCost) * 100 : 0;
        g.isClosed = Math.abs(g.buyVol - g.sellVol) < 0.0001;
        return g;
      })
      .sort((a, b) => b.endDate.localeCompare(a.endDate));
  }, [transactions, selectedAccountId]);

  // New: Aggregate Analysis by Stock
  const stockStrategyAnalysis = useMemo(() =>
  {
    const stocks: Record<string, StockStrategyStats> = {};

    groupAnalysis.forEach((g) =>
    {
      if (!stocks[g.stockCode])
      {
        stocks[g.stockCode] = {
          stockCode: g.stockCode,
          stockName: g.stockName,
          totalBuyCost: 0,
          totalSellRevenue: 0,
          netProfit: 0,
          roi: 0,
          groups: [],
        };
      }
      const s = stocks[g.stockCode];
      s.totalBuyCost += g.totalBuyCost;
      s.totalSellRevenue += g.totalSellRevenue;
      s.netProfit += g.netProfit;
      s.groups.push(g);
    });

    return Object.values(stocks)
      .map((s) =>
      {
        s.roi = s.totalBuyCost > 0 ? (s.netProfit / s.totalBuyCost) * 100 : 0;
        return s;
      })
      .sort((a, b) => b.netProfit - a.netProfit);
  }, [groupAnalysis]);

  // Sort logic
  const activePositionsSorted = useMemo(() =>
  {
    return [...activePositions].sort((a, b) =>
    {
      const valA = a[holdingsSort.key];
      const valB = b[holdingsSort.key];
      if (typeof valA === 'string' && typeof valB === 'string')
      {
        return holdingsSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return holdingsSort.direction === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [activePositions, holdingsSort]);

  const clearedPositionsSorted = useMemo(() =>
  {
    return [...clearedPositions].sort((a, b) =>
    {
      const valA = a[historySort.key];
      const valB = b[historySort.key];
      return historySort.direction === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [clearedPositions, historySort]);

  const handleHoldingsSort = (key: keyof StockPosition) =>
  {
    setHoldingsSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleHistorySort = (key: keyof StockPosition) =>
  {
    setHistorySort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const totalInitialPnL = useMemo(() =>
  {
    return accounts
      .filter((acc) => selectedAccountId === 'all' || acc.id === selectedAccountId)
      .reduce((sum, acc) => sum + (acc.initialRealizedPnL || 0), 0);
  }, [accounts, selectedAccountId]);

  const totalMarketValue = activePositions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalUnrealizedPnL = activePositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  const totalRealizedPnL = Object.values(portfolio).reduce((sum, p) => sum + p.realizedPnL, 0) + totalInitialPnL;

  const uniqueStocks = useMemo(() =>
  {
    return Object.values(portfolio)
      .map((p) => ({ code: p.stockCode, name: p.stockName }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [portfolio]);

  return {
    portfolio,
    activePositions,
    clearedPositions,
    groupAnalysis,
    stockStrategyAnalysis,
    activePositionsSorted,
    clearedPositionsSorted,
    holdingsSort,
    historySort,
    handleHoldingsSort,
    handleHistorySort,
    totalMarketValue,
    totalUnrealizedPnL,
    totalRealizedPnL,
    uniqueStocks,
  };
};
