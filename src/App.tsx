import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  PlusCircle,
  TrendingUp,
  Wallet,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  PieChart,
  Layers,
  Database,
  Download,
  Upload,
  FileText,
  RefreshCw,
} from "lucide-react";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useAccounts } from "./hooks/useAccounts";
import { useTransactions } from "./hooks/useTransactions";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db, appId } from "./lib/firebase";
import { useStockData } from "./hooks/useStockData";
import { usePortfolioAnalysis } from "./hooks/usePortfolioAnalysis";
import { useMarketData } from "./hooks/useMarketData";

import Login from "./components/Login";
import LoadingOverlay from "./components/LoadingOverlay";
import ToastMessage from "./components/ToastMessage";

// Modals
import AccountCreationModal from "./components/modals/AccountCreationModal";
import TransactionModal from "./components/modals/TransactionModal";
import RevokeConfirmModal from "./components/modals/RevokeConfirmModal";
import LinkTransactionModal from "./components/modals/LinkTransactionModal";
import ImportModal from "./components/modals/ImportModal";
import BackupRestoreModal from "./components/modals/BackupRestoreModal";
import StockStrategyModal from "./components/modals/StockStrategyModal";

// Tab Components
import Holdings from "./components/tabs/Holdings";
import Analysis from "./components/tabs/Analysis";
import History from "./components/tabs/History";
import Transactions from "./components/tabs/Transactions";
import StockDetails from "./components/tabs/StockDetails";
import Accounts from "./components/tabs/Accounts";

// Types & Utils
import type {
  Transaction,
  Account,
  StockPosition,
  StockStrategyStats,
  ToastType,
} from "./types";
import { formatCurrency, formatDateForInput, sanitizeCSVField } from "./utils";
import { validateImportData } from "./utils/validation";

export default function StockTracker() {
  // --- Auth ---
  const { user, loading: authLoading, logout } = useAuth();
  const { refresh: refreshMarketData, loading: marketDataLoading } = useMarketData(user);

  // --- State ---
  const [activeTab, setActiveTab] = useState<
    | "holdings"
    | "history"
    | "transactions"
    | "accounts"
    | "stock_details"
    | "analysis"
  >("holdings");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Stock Details State
  const [selectedStockCode, setSelectedStockCode] = useState<string>("");
  const [selectedStrategyStock, setSelectedStrategyStock] =
    useState<StockStrategyStats | null>(null);

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountInitialPnL, setNewAccountInitialPnL] = useState("");
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);

  const [txForm, setTxForm] = useState<Partial<Transaction>>({
    type: "BUY",
    date: new Date().toISOString().split("T")[0],
    commission: 5,
    tax: 0,
    otherFees: 0,
    marginInterest: 0,
    shares: 100,
    price: 0,
    status: "normal",
    groupTag: "",
  });

  // Pagination State
  const [analysisPage, setAnalysisPage] = useState(1);
  const [analysisPageSize, setAnalysisPageSize] = useState(20);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(20);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPageSize, setTransactionsPageSize] = useState(20);

  const [editingPrice, setEditingPrice] = useState<{
    stockCode: string;
    currentPrice: string;
  } | null>(null);

  // --- Data Hooks ---
  const {
    accounts,
    initialized: accountsInitialized,
    addAccount,
    updateAccount,
  } = useAccounts(user);
  const {
    transactions,
    initialized: transactionsInitialized,
    addTransaction,
    updateTransaction,
    revokeTransaction,
    linkTransactions,
    importTransactions,
  } = useTransactions(user);
  const {
    prices,
    loading: pricesLoading,
    updatePrices,
    setPrice,
  } = useStockData();

  // --- Analysis Hook ---
  const {
    portfolio,
    // activePositions, // Unused
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
    activePositions,
  } = usePortfolioAnalysis(transactions, accounts, prices, selectedAccountId);

  // --- Derived State ---
  const activeLinkSourceTx = useMemo(() => {
    if (!linkSourceId) return null;
    return transactions.find((t) => t.id === linkSourceId) || null;
  }, [transactions, linkSourceId]);

  const stockDetailsData = useMemo(() => {
    if (!selectedStockCode) return null;
    const pos = portfolio[selectedStockCode];
    if (!pos) return null;
    const stockTxs = transactions.filter((tx) => {
      if (selectedAccountId !== "all" && tx.accountId !== selectedAccountId)
        return false;
      if (tx.status === "revoked") return false;
      return tx.stockCode === selectedStockCode;
    });
    return { position: pos, transactions: stockTxs };
  }, [selectedStockCode, portfolio, transactions, selectedAccountId]);

  // --- Auto Update Prices ---
  const hasCheckedPrices = useRef(false);
  useEffect(() => {
    if (user && activePositions.length > 0 && !hasCheckedPrices.current) {
      updatePrices(activePositions.map((s) => s.stockCode));
      hasCheckedPrices.current = true;
    }
  }, [user, activePositions, updatePrices]);

  // --- Handlers ---
  const showMessage = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

  const handleUpdatePrices = async () => {
    const codes = activePositions.map((p) => p.stockCode);
    const success = await updatePrices(codes, true);
    if (success) showMessage("股价已更新", "success");
    else showMessage("更新股价失败", "error");
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setNewAccountName("");
    setNewAccountInitialPnL("");
    setShowAccountModal(true);
  };

  const handleEditAccount = (acc: Account, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(acc);
    setNewAccountName(acc.name);
    setNewAccountInitialPnL(acc.initialRealizedPnL?.toString() || "");
    setShowAccountModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    setGlobalLoading(true);
    try {
      const initialPnLValue = parseFloat(newAccountInitialPnL) || 0;
      if (editingAccount) {
        await updateAccount(editingAccount.id, newAccountName, initialPnLValue);
        showMessage("账户已更新", "success");
      } else {
        await addAccount(newAccountName, initialPnLValue);
        showMessage("账户已创建", "success");
      }
      setShowAccountModal(false);
    } catch (e) {
      showMessage("操作失败", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleQuickAction = (
    action: "BUY" | "SELL" | "CLEAR",
    pos: StockPosition
  ) => {
    const isBuy = action === "BUY";
    const isClear = action === "CLEAR";
    let targetAccountId = selectedAccountId !== "all" ? selectedAccountId : "";

    // If 'all' accounts selected, try to infer the correct account
    if (!targetAccountId) {
      const accountHoldings: Record<string, number> = {};
      transactions.forEach((tx) => {
        if (tx.stockCode === pos.stockCode && tx.status !== "revoked") {
          if (!accountHoldings[tx.accountId]) accountHoldings[tx.accountId] = 0;
          if (tx.type === "BUY") accountHoldings[tx.accountId] += tx.shares;
          else if (tx.type === "SELL")
            accountHoldings[tx.accountId] -= tx.shares;
        }
      });

      // Find accounts with positive holdings
      const holdingAccounts = Object.keys(accountHoldings).filter(
        (accId) => accountHoldings[accId] > 0.0001
      );

      if (holdingAccounts.length === 1) {
        targetAccountId = holdingAccounts[0];
      }
    }

    setTxForm({
      ...txForm,
      type: isBuy ? "BUY" : "SELL",
      stockCode: pos.stockCode,
      stockName: pos.stockName,
      price: pos.currentPrice,
      shares: isClear ? pos.sharesHeld : 100,
      accountId: targetAccountId,
      date: new Date().toISOString().split("T")[0],
      status: "normal",
      groupTag: "",
      id: undefined,
    });
    setShowAddModal(true);
  };

  const handleEditTx = (tx: Transaction) => {
    setTxForm({
      id: tx.id,
      accountId: tx.accountId,
      stockCode: tx.stockCode,
      stockName: tx.stockName,
      type: tx.type,
      price: tx.price,
      shares: tx.shares,
      commission: tx.commission,
      tax: tx.tax,
      otherFees: tx.otherFees,
      marginInterest: tx.marginInterest,
      date: formatDateForInput(tx.date),
      status: tx.status || "normal",
      groupTag: tx.groupTag || "",
    });
    setShowAddModal(true);
  };

  const handleSubmitTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.accountId) {
      showMessage("请选择账户", "error");
      return;
    }
    setGlobalLoading(true);
    try {
      if (txForm.id) {
        await updateTransaction(txForm.id, txForm);
        showMessage("交易已更新", "success");
      } else {
        await addTransaction(txForm);
        showMessage("交易已保存", "success");
      }
      setShowAddModal(false);
      setTxForm((prev) => ({
        ...prev,
        id: undefined,
        shares: 100,
        price: 0,
        commission: 5,
        status: "normal",
        groupTag: "",
      }));
    } catch (error) {
      showMessage("保存失败", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRevokeClick = (id: string) => {
    setRevokeTargetId(id);
    setShowRevokeModal(true);
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTargetId) return;
    setGlobalLoading(true);
    try {
      await revokeTransaction(revokeTargetId);
      setShowRevokeModal(false);
      showMessage("交易已撤回", "info");
    } catch (e) {
      showMessage("撤回失败", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleLinkClick = (tx: Transaction) => {
    setLinkSourceId(tx.id);
    setShowLinkModal(true);
  };

  const handleExecuteLink = async (targetTx: Transaction) => {
    if (!activeLinkSourceTx) return;
    setGlobalLoading(true);

    let tag = targetTx.groupTag || activeLinkSourceTx.groupTag;
    if (!tag) {
      const datePart = activeLinkSourceTx.date.replace(/-/g, "");
      const randomPart = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      tag = `T-${datePart}-${randomPart}`;
    }

    try {
      await linkTransactions(activeLinkSourceTx.id, targetTx.id, tag);
      showMessage(`已关联! 标记: ${tag}`, "success");

      const currentCandidates = transactions.filter(
        (tx) =>
          tx.stockCode === activeLinkSourceTx.stockCode &&
          tx.accountId === activeLinkSourceTx.accountId &&
          tx.id !== activeLinkSourceTx.id &&
          tx.id !== targetTx.id &&
          tx.status !== "revoked" &&
          (tx.type === "BUY" || tx.type === "SELL") &&
          (!tx.groupTag || tx.groupTag !== tag)
      );

      if (currentCandidates.length === 0) {
        setShowLinkModal(false);
        setLinkSourceId(null);
      }
    } catch (e) {
      showMessage("关联失败", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleImportConfirm = async (data: any[], targetAccId: string) => {
    setGlobalLoading(true);
    try {
      await importTransactions(data, targetAccId);
      setShowImportModal(false);
      showMessage(`成功导入 ${data.length} 条记录！`, "success");
    } catch (e) {
      showMessage("导入失败", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRestoreData = async (jsonContent: string) => {
    if (!user) return;
    try {
      // 🛡️ Sentinel: Validate and sanitize import data to prevent injection/corruption
      const data = validateImportData(JSON.parse(jsonContent));

      setGlobalLoading(true);

      // Restore Accounts
      const accountIdMap: Record<string, string> = {};
      const batch = writeBatch(db);

      // Process accounts
      for (const bAccount of data.accounts) {
        const existing = accounts.find((a) => a.name === bAccount.name);
        if (existing) {
          accountIdMap[bAccount.id] = existing.id;
        } else {
          const newAccountRef = doc(
            collection(db, "artifacts", appId, "users", user.uid, "accounts")
          );
          batch.set(newAccountRef, {
            name: bAccount.name,
            initialRealizedPnL:
              bAccount.initialRealizedPnL || 0,
            createdAt: new Date().toISOString(),
          });
          accountIdMap[bAccount.id] = newAccountRef.id;
        }
      }

      // Process transactions
      // Note: Firestore batch limit is 500. If we have many transactions, we need multiple batches.
      // For simplicity, we'll commit the accounts first, then transactions in chunks.
      await batch.commit();

      // Now add transactions
      const txCollectionRef = collection(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "transactions"
      );
      const chunkSize = 450; // Safe limit

      const newTransactions = data.transactions
        .map((tx: any) => {
          const newAccountId = accountIdMap[tx.accountId];
          if (!newAccountId) return null; // Skip if account not found/mapped

          // Remove ID to let Firestore generate new one
          const { id, ...rest } = tx;
          return {
            ...rest,
            accountId: newAccountId,
            // Ensure dates are valid or keep as is
          };
        })
        .filter(Boolean);

      for (let i = 0; i < newTransactions.length; i += chunkSize) {
        const chunk = newTransactions.slice(i, i + chunkSize);
        const txBatch = writeBatch(db);
        chunk.forEach((tx: any) => {
          const newTxRef = doc(txCollectionRef);
          txBatch.set(newTxRef, tx);
        });
        await txBatch.commit();
      }

      showMessage("数据恢复成功", "success");
      setShowBackupModal(false);
    } catch (e) {
      showMessage(
        "恢复失败: " + (e instanceof Error ? e.message : "未知错误"),
        "error"
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  // Re-implementing handleRestoreData properly by importing firebase functions
  // (To be cleaner, this should be in a hook, but for now I'll inline it to ensure it works as before)
  // I need to import db, appId, collection, addDoc, serverTimestamp from firebase/firestore
  // I'll add these imports to the top.

  const handleExport = () => {
    const dataToExport = transactions.filter((tx) => {
      if (selectedAccountId !== "all" && tx.accountId !== selectedAccountId)
        return false;
      if (tx.status === "revoked") return false;
      return true;
    });

    if (dataToExport.length === 0) {
      showMessage("没有可导出的数据", "error");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent +=
      "日期,代码,名称,操作,价格/金额,数量,佣金,印花/红利税,其他费用,分组Tag,账户\n";

    dataToExport.forEach((tx) => {
      const accName =
        accounts.find((a) => a.id === tx.accountId)?.name || "未知账户";
      let typeStr = "买入";
      if (tx.type === "SELL") typeStr = "卖出";
      else if (tx.type === "DIVIDEND") typeStr = "分红";
      else if (tx.type === "INTEREST") typeStr = "融资利息";

      const row = [
        sanitizeCSVField(tx.date),
        sanitizeCSVField(tx.stockCode),
        sanitizeCSVField(tx.stockName),
        sanitizeCSVField(typeStr),
        sanitizeCSVField(tx.price || 0),
        sanitizeCSVField(tx.shares || 0),
        sanitizeCSVField(tx.commission || 0),
        sanitizeCSVField(tx.tax || 0),
        sanitizeCSVField(tx.otherFees || 0),
        sanitizeCSVField(tx.groupTag || ""),
        sanitizeCSVField(accName),
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `交易记录_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showMessage(`已导出 ${dataToExport.length} 条记录`, "success");
  };

  if (authLoading) return <LoadingOverlay />;
  if (!user) return <Login />;
  if (!accountsInitialized || !transactionsInitialized)
    return <LoadingOverlay />;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <TrendingUp className="text-blue-600" size={28} />
            <h1 className="text-xl font-bold tracking-tight">
              智投 StockTrack
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={async () => {
                showMessage("正在更新市场数据...", "info");
                const success = await refreshMarketData();
                if (success) {
                  showMessage("市场数据更新成功", "success");
                } else {
                  showMessage("市场数据更新失败", "error");
                }
              }}
              disabled={marketDataLoading}
              className={`text-gray-500 hover:text-blue-600 flex items-center space-x-1 text-sm font-medium transition px-2 ${marketDataLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="更新市场数据"
            >
              <RefreshCw size={16} className={marketDataLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">更新数据</span>
            </button>
            <button
              onClick={() => setShowBackupModal(true)}
              className="text-gray-500 hover:text-blue-600 flex items-center space-x-1 text-sm font-medium transition px-2"
              title="备份与恢复"
            >
              <Database size={16} />
              <span className="hidden sm:inline">备份</span>
            </button>
            <button
              onClick={handleExport}
              className="text-gray-500 hover:text-blue-600 flex items-center space-x-1 text-sm font-medium transition px-2"
              title="导出 CSV"
            >
              <Download size={16} />
              <span className="hidden sm:inline">导出</span>
            </button>
            <button
              onClick={() => {
                if (accounts.length === 0) {
                  setShowAccountModal(true);
                } else {
                  setShowImportModal(true);
                }
              }}
              className="text-gray-500 hover:text-blue-600 flex items-center space-x-1 text-sm font-medium transition px-2"
              title="批量导入"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">导入</span>
            </button>
            <select
              className="bg-gray-100 border-none rounded-md py-1 px-3 text-sm focus:ring-2 focus:ring-blue-500"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="all">所有账户</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (accounts.length === 0) {
                  setShowAccountModal(true);
                } else {
                  setTxForm((prev) => ({
                    ...prev,
                    accountId:
                      selectedAccountId !== "all"
                        ? selectedAccountId
                        : prev.accountId,
                    date: new Date().toISOString().split("T")[0],
                    id: undefined,
                  }));
                  setShowAddModal(true);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-1 text-sm font-medium shadow-sm transition"
            >
              <PlusCircle size={16} />
              <span>记一笔</span>
            </button>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 text-sm font-medium">
                当前持仓市值
              </span>
              <Wallet className="text-blue-400 opacity-50" size={20} />
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalMarketValue)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 text-sm font-medium">
                浮动盈亏
              </span>
              {totalUnrealizedPnL >= 0 ? (
                <ArrowUpRight className="text-red-500" size={20} />
              ) : (
                <ArrowDownRight className="text-green-500" size={20} />
              )}
            </div>
            <div
              className={`text-2xl font-bold ${totalUnrealizedPnL >= 0 ? "text-red-600" : "text-green-600"}`}
            >
              {totalUnrealizedPnL > 0 ? "+" : ""}
              {formatCurrency(totalUnrealizedPnL)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 text-sm font-medium">
                已实现盈亏 (累计)
              </span>
              <PieChart className="text-purple-400 opacity-50" size={20} />
            </div>
            <div
              className={`text-2xl font-bold ${totalRealizedPnL >= 0 ? "text-red-600" : "text-green-600"}`}
            >
              {totalRealizedPnL > 0 ? "+" : ""}
              {formatCurrency(totalRealizedPnL)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              包含 历史期初、T操作、清仓盈亏、利息及分红
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
          {[
            { id: "holdings", label: "当前持仓", icon: Wallet },
            { id: "history", label: "清仓历史", icon: Layers }, // Changed icon to Layers as History was removed, or keep History if I re-add it. Wait, History was removed from imports. Let's check imports.
            { id: "analysis", label: "T操作/策略", icon: Layers },
            { id: "transactions", label: "交易明细", icon: Filter },
            { id: "stock_details", label: "个股透视", icon: FileText },
            { id: "accounts", label: "账户管理", icon: DollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-300/50"
                }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm min-h-[400px] border border-gray-100 overflow-hidden">
          {/* VIEW: HOLDINGS */}
          {activeTab === "holdings" && (
            <Holdings
              pricesLoading={pricesLoading}
              handleUpdatePrices={handleUpdatePrices}
              holdingsSort={holdingsSort}
              handleHoldingsSort={handleHoldingsSort}
              activePositionsSorted={activePositionsSorted}
              editingPrice={editingPrice}
              setEditingPrice={setEditingPrice}
              setPrice={setPrice}
              handleQuickAction={handleQuickAction}
            />
          )}

          {/* VIEW: ANALYSIS (Grouped by Stock) */}
          {activeTab === "analysis" && (
            <Analysis
              stockStrategyAnalysis={stockStrategyAnalysis}
              analysisPage={analysisPage}
              analysisPageSize={analysisPageSize}
              setAnalysisPage={setAnalysisPage}
              setAnalysisPageSize={setAnalysisPageSize}
              setSelectedStrategyStock={setSelectedStrategyStock}
            />
          )}

          {/* VIEW: HISTORY */}
          {activeTab === "history" && (
            <History
              clearedPositionsSorted={clearedPositionsSorted}
              historyPage={historyPage}
              historyPageSize={historyPageSize}
              setHistoryPage={setHistoryPage}
              setHistoryPageSize={setHistoryPageSize}
              historySort={historySort}
              handleHistorySort={handleHistorySort}
            />
          )}

          {/* VIEW: TRANSACTIONS */}
          {activeTab === "transactions" && (
            <Transactions
              transactions={transactions}
              selectedAccountId={selectedAccountId}
              transactionsPage={transactionsPage}
              transactionsPageSize={transactionsPageSize}
              setTransactionsPage={setTransactionsPage}
              setTransactionsPageSize={setTransactionsPageSize}
              accounts={accounts}
              handleLinkClick={handleLinkClick}
              handleEditTx={handleEditTx}
              handleRevokeClick={handleRevokeClick}
            />
          )}

          {/* VIEW: STOCK DETAILS */}
          {activeTab === "stock_details" && (
            <StockDetails
              selectedStockCode={selectedStockCode}
              setSelectedStockCode={setSelectedStockCode}
              uniqueStocks={uniqueStocks}
              stockDetailsData={stockDetailsData}
            />
          )}

          {/* VIEW: ACCOUNTS */}
          {activeTab === "accounts" && (
            <Accounts
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              setSelectedAccountId={setSelectedAccountId}
              handleEditAccount={handleEditAccount}
              handleAddAccount={handleAddAccount}
            />
          )}
        </div>
      </main>

      <TransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmitTx}
        form={txForm}
        setForm={setTxForm}
        accounts={accounts}
      />

      <AccountCreationModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onSubmit={handleSaveAccount}
        name={newAccountName}
        setName={setNewAccountName}
        initialPnL={newAccountInitialPnL}
        setInitialPnL={setNewAccountInitialPnL}
        isEdit={!!editingAccount}
      />

      <RevokeConfirmModal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={handleConfirmRevoke}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportConfirm}
        accounts={accounts}
        showMessage={showMessage}
      />

      <LinkTransactionModal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setLinkSourceId(null);
        }}
        sourceTx={activeLinkSourceTx}
        allTransactions={transactions}
        onLink={handleExecuteLink}
      />

      <StockStrategyModal
        isOpen={!!selectedStrategyStock}
        onClose={() => setSelectedStrategyStock(null)}
        stockStats={selectedStrategyStock}
      />

      <BackupRestoreModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        accounts={accounts}
        transactions={transactions}
        showMessage={showMessage}
        onRestore={handleRestoreData}
      />

      {globalLoading && <LoadingOverlay />}
      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
