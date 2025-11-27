import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import type { Account } from '../types';
import type { User } from 'firebase/auth';

export const useAccounts = (user: User | null) =>
{
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() =>
  {
    if (!user)
    {
      Promise.resolve().then(() => setInitialized(false));
      Promise.resolve().then(() => setAccounts([]));
      return;
    }

    Promise.resolve().then(() => setLoading(true));

    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'accounts'));
    const unsubscribe = onSnapshot(q, (snapshot) =>
    {
      setAccounts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Account));
      setLoading(false);
      setInitialized(true);
    }, (err) =>
    {
      console.error(err);
      setLoading(false);
      setInitialized(true); // Even on error, we are "initialized" (with empty or old data)
    });

    return () => unsubscribe();
  }, [user]);

  const addAccount = async (name: string, initialPnL: number) =>
  {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'accounts'), {
      name: name.trim(),
      initialRealizedPnL: initialPnL,
      broker: 'Default',
      createdAt: serverTimestamp(),
    });
  };

  const updateAccount = async (id: string, name: string, initialPnL: number) =>
  {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'accounts', id), {
      name: name.trim(),
      initialRealizedPnL: initialPnL,
    });
  };

  return { accounts, loading, initialized, addAccount, updateAccount };
};
