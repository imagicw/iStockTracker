import { useState } from 'react';
import { mockFetchPrice } from '../utils';

export const useStockData = () =>
{
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const updatePrices = async (stockCodes: string[]) =>
  {
    setLoading(true);
    try
    {
      const newPrices: Record<string, number> = { ...prices };
      for (const code of stockCodes)
      {
        newPrices[code] = await mockFetchPrice(code);
      }
      setPrices(newPrices);
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
