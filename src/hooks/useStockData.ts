import { useState } from 'react';
import { fetchStockPrices } from '../services/api';

export const useStockData = () =>
{
  const [prices, setPrices] = useState<Record<string, number>>(() =>
  {
    try
    {
      const cachedData = localStorage.getItem('STOCK_PRICES_CACHE');
      if (cachedData)
      {
        const { prices: savedPrices } = JSON.parse(cachedData);
        return savedPrices || {};
      }
    } catch (e)
    {
      console.error('Failed to load prices from cache', e);
    }
    return {};
  });
  const [loading, setLoading] = useState(false);

  const updatePrices = async (stockCodes: string[]) =>
  {
    setLoading(true);
    try
    {
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = 'STOCK_PRICES_CACHE';
      const cachedData = localStorage.getItem(cacheKey);
      let cachedPrices: Record<string, number> = {};
      let needsFetch = false;

      if (cachedData)
      {
        const { date, prices: savedPrices } = JSON.parse(cachedData);
        if (date === today)
        {
          cachedPrices = savedPrices;
          // Check if all requested codes are in cache
          const missingCodes = stockCodes.filter(code => savedPrices[code] === undefined);
          if (missingCodes.length === 0)
          {
            setPrices(savedPrices);
            setLoading(false);
            return true;
          }
          needsFetch = true;
        } else
        {
          needsFetch = true;
        }
      } else
      {
        needsFetch = true;
      }

      if (needsFetch)
      {
        const response = await fetchStockPrices(stockCodes);
        const newPrices: Record<string, number> = { ...cachedPrices }; // Start with existing cache

        if (response && response.data)
        {
          Object.entries(response.data).forEach(([code, price]) =>
          {
            newPrices[code] = Number(price.toFixed(2));
          });
        }

        setPrices(newPrices);
        localStorage.setItem(cacheKey, JSON.stringify({ date: today, prices: newPrices }));
      }

      return true;
    } catch (e)
    {
      console.error(e);
      return false;
    } finally
    {
      setLoading(false);
    }
  };

  const setPrice = (stockCode: string, price: number) =>
  {
    setPrices((prev) => ({ ...prev, [stockCode]: price }));
  };

  return { prices, loading, updatePrices, setPrice };
};
