import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { fetchCNMarketStocks, type MarketStock } from '../services/api';

const STORAGE_KEY = 'market_stocks_cn';

export const useMarketData = (user: User | null) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAndStore = async () => {
        setLoading(true);
        try {
            const stocks = await fetchCNMarketStocks();
            if (stocks.code === 0) {
                if (stocks.data && stocks.data.length > 0) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks.data));
                }
            }
            return stocks.code === 0;
        } catch (err: any) {
            console.error('Failed to sync market data:', err);
            setError(err.message || 'Failed to sync market data');
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const syncData = async () => {
            if (!user) return;

            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                // Data already exists, no need to fetch
                return;
            }

            await fetchAndStore();
        };

        syncData();
    }, [user]);

    const refresh = async () => {
        return await fetchAndStore();
    };

    return { loading, error, refresh };
};
