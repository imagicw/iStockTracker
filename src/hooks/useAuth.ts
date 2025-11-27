import { useState, useEffect } from 'react';
import
{
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getFirebaseErrorMessage } from '../utils';

export const useAuth = () =>
{
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() =>
  {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) =>
    {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginAnonymously = async () =>
  {
    setLoading(true);
    setError(null);
    try
    {
      await signInAnonymously(auth);
    } catch (err: any)
    {
      setError(getFirebaseErrorMessage(err.message));
    } finally
    {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) =>
  {
    setLoading(true);
    setError(null);
    try
    {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any)
    {
      setError(getFirebaseErrorMessage(err.message));
      throw err;
    } finally
    {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string) =>
  {
    setLoading(true);
    setError(null);
    try
    {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err: any)
    {
      setError(getFirebaseErrorMessage(err.message));
      throw err;
    } finally
    {
      setLoading(false);
    }
  };

  const logout = async () =>
  {
    setLoading(true);
    try
    {
      await signOut(auth);
    } catch (err: any)
    {
      setError(getFirebaseErrorMessage(err.message));
    } finally
    {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    loginAnonymously,
    loginWithEmail,
    registerWithEmail,
    logout
  };
};
