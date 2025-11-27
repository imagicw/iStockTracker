import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import type { Transaction } from '../types';
import type { User } from 'firebase/auth';

export const useTransactions = (user: User | null) =>
{
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() =>
  {
    if (!user)
    {
      return () => setTransactions([]);
    }

    Promise.resolve().then(() => setLoading(true));

    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'));
    const unsubscribe = onSnapshot(q, (snapshot) =>
    {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);

      data.sort((a, b) =>
      {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        if (a.createdAt && b.createdAt)
        {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });

      setTransactions(data);
      setLoading(false);
    }, (err) =>
    {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addTransaction = async (tx: Partial<Transaction>) =>
  {
    if (!user) return;
    // Ensure numeric fields are numbers
    const safeTx = {
      ...tx,
      price: Number(tx.price) || 0,
      shares: Number(tx.shares) || 0,
      commission: Number(tx.commission) || 0,
      tax: Number(tx.tax) || 0,
      otherFees: Number(tx.otherFees) || 0,
      marginInterest: 0,
      status: tx.status || 'normal',
      groupTag: tx.groupTag || '',
      createdAt: serverTimestamp(),
    };
    // Remove undefined fields
    Object.keys(safeTx).forEach(key => (safeTx as any)[key] === undefined && delete (safeTx as any)[key]);
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), safeTx);
  };

  const updateTransaction = async (id: string, tx: Partial<Transaction>) =>
  {
    if (!user) return;
    const safeTx = {
      ...tx,
      price: Number(tx.price) || 0,
      shares: Number(tx.shares) || 0,
      commission: Number(tx.commission) || 0,
      tax: Number(tx.tax) || 0,
      otherFees: Number(tx.otherFees) || 0,
      // Don't overwrite status or createdAt unless specified
    };
    // Remove undefined fields
    Object.keys(safeTx).forEach(key => (safeTx as any)[key] === undefined && delete (safeTx as any)[key]);

    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id), safeTx);
  };

  const revokeTransaction = async (id: string) =>
  {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id), {
      status: 'revoked',
    });
  };

  const linkTransactions = async (id1: string, id2: string, tag: string) =>
  {
    if (!user) return;
    const p1 = updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id1), { groupTag: tag });
    const p2 = updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id2), { groupTag: tag });
    await Promise.all([p1, p2]);
  };

  const importTransactions = async (data: any[], targetAccountId: string) =>
  {
    if (!user) return;
    const batchPromises = data.map((item) =>
    {
      return addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), {
        ...item,
        accountId: targetAccountId,
        createdAt: serverTimestamp(),
      });
    });
    await Promise.all(batchPromises);
  };

  return { transactions, loading, addTransaction, updateTransaction, revokeTransaction, linkTransactions, importTransactions };
};
