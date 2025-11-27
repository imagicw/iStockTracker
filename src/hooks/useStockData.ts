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

  const updatePrices = async (stockCodes: string[], forceRefresh = false) =>
  {
    setLoading(true);
    try
    {
      const today = new Date().toISOString().split("T")[0];
      const cacheKey = "STOCK_PRICES_CACHE";
      const cachedData = localStorage.getItem(cacheKey);

      let currentPrices: Record<string, number> = {};
      let codesToFetch: string[] = stockCodes;

      if (!forceRefresh && cachedData)
      {
        try
        {
          const { date, prices: savedPrices } = JSON.parse(cachedData);
          if (date === today)
          {
            currentPrices = savedPrices || {};
            // Only fetch codes that are not in the cache
            codesToFetch = stockCodes.filter(
              (code) => currentPrices[code] === undefined
            );
          }
        } catch (e)
        {
          console.error("Error parsing cached prices:", e);
        }
      }

      // If we have valid cached prices and not forcing refresh, update state immediately
      if (!forceRefresh && Object.keys(currentPrices).length > 0)
      {
        setPrices((prev) => ({ ...prev, ...currentPrices }));
      }

      // If nothing to fetch, we are done
      if (codesToFetch.length === 0)
      {
        setLoading(false);
        return true;
      }

      const response = await fetchStockPrices(codesToFetch);
      const newPrices: Record<string, number> = { ...currentPrices };

      if (response && response.data)
      {
        Object.entries(response.data).forEach(([code, price]) =>
        {
          newPrices[code] = Number(price.toFixed(2));
        });
      }

      setPrices(newPrices);
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ date: today, prices: newPrices })
      );

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
