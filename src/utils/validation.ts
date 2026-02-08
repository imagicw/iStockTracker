import type { Account, Transaction, TransactionType } from '../types';

export interface ImportData {
  accounts: Account[];
  transactions: Transaction[];
}

const isValidTransactionType = (type: any): type is TransactionType => {
  return ['BUY', 'SELL', 'DIVIDEND', 'INTEREST'].includes(type);
};

const sanitizeString = (str: any, maxLength: number = 255): string => {
  if (typeof str !== 'string') return '';
  return str.slice(0, maxLength);
};

const sanitizeNumber = (num: any, allowNegative: boolean = false): number => {
  const n = Number(num);
  if (isNaN(n)) return 0;
  if (!allowNegative && n < 0) return 0;
  return n;
};

export const validateImportData = (data: any): ImportData => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON format: Root must be an object.');
  }

  if (!Array.isArray(data.accounts)) {
    throw new Error('Invalid format: "accounts" must be an array.');
  }

  if (!Array.isArray(data.transactions)) {
    throw new Error('Invalid format: "transactions" must be an array.');
  }

  const cleanAccounts: Account[] = data.accounts.map((acc: any, index: number) => {
    if (!acc.id || typeof acc.id !== 'string') {
      throw new Error(`Account[${index}]: Invalid or missing ID.`);
    }
    if (!acc.name || typeof acc.name !== 'string') {
      throw new Error(`Account[${index}]: Invalid or missing Name.`);
    }

    // Whitelist and sanitize
    return {
      id: sanitizeString(acc.id, 50),
      name: sanitizeString(acc.name, 50),
      broker: sanitizeString(acc.broker || 'Default', 50),
      initialRealizedPnL: sanitizeNumber(acc.initialRealizedPnL !== undefined ? acc.initialRealizedPnL : acc.initialPnL, true),
    } as Account;
  });

  const cleanTransactions: Transaction[] = data.transactions.map((tx: any, index: number) => {
    if (!tx.accountId || typeof tx.accountId !== 'string') {
        throw new Error(`Transaction[${index}]: Missing Account ID.`);
    }

    // Type validation
    if (!isValidTransactionType(tx.type)) {
        throw new Error(`Transaction[${index}]: Invalid transaction type "${tx.type}".`);
    }

    return {
      id: sanitizeString(tx.id, 50),
      accountId: sanitizeString(tx.accountId, 50),
      stockCode: sanitizeString(tx.stockCode, 20),
      stockName: sanitizeString(tx.stockName, 50),
      type: tx.type,
      price: sanitizeNumber(tx.price, false),
      shares: sanitizeNumber(tx.shares, false),
      commission: sanitizeNumber(tx.commission, false),
      tax: sanitizeNumber(tx.tax, false),
      otherFees: sanitizeNumber(tx.otherFees, false),
      marginInterest: sanitizeNumber(tx.marginInterest, false),
      date: sanitizeString(tx.date, 10), // YYYY-MM-DD
      status: tx.status === 'revoked' ? 'revoked' : 'normal',
      groupTag: sanitizeString(tx.groupTag, 50),
      // createdAt is optional and handled by serverTimestamp often, but if present we sanitize
      createdAt: tx.createdAt ? sanitizeString(tx.createdAt, 30) : undefined,
    } as Transaction;
  });

  return { accounts: cleanAccounts, transactions: cleanTransactions };
};
