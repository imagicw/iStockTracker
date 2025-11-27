import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  PlusCircle,
  MinusCircle,
  XCircle,
  TrendingUp,
  History,
  Wallet,
  RefreshCw,
  RotateCcw,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  PieChart,
  Edit2,
  Search,
  Layers,
  Link,
  ChevronRight,
  Database,
  Download,
  Upload,
  FileText,
} from "lucide-react";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useAccounts } from "./hooks/useAccounts";
import { useTransactions } from "./hooks/useTransactions";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db, appId } from "./lib/firebase";
import { useStockData } from "./hooks/useStockData";
import { usePortfolioAnalysis } from "./hooks/usePortfolioAnalysis";

// Components
import Login from "./components/Login";
import PnLText from "./components/PnLText";
import LoadingOverlay from "./components/LoadingOverlay";
import ToastMessage from "./components/ToastMessage";
import SortableHeader from "./components/SortableHeader";

// Modals
import AccountCreationModal from "./components/modals/AccountCreationModal";
import TransactionModal from "./components/modals/TransactionModal";
import RevokeConfirmModal from "./components/modals/RevokeConfirmModal";
import LinkTransactionModal from "./components/modals/LinkTransactionModal";
import ImportModal from "./components/modals/ImportModal";
import BackupRestoreModal from "./components/modals/BackupRestoreModal";
import StockStrategyModal from "./components/modals/StockStrategyModal";

// Types & Utils
import type {
  Transaction,
  Account,
  StockPosition,
  StockStrategyStats,
  ToastType,
} from "./types";
import { formatCurrency, formatNumber, formatDateForInput } from "./utils";

export default function StockTracker() {
  // --- Auth ---
  const { user, loading: authLoading, logout } = useAuth();

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
    if (user && uniqueStocks.length > 0 && !hasCheckedPrices.current) {
      updatePrices(uniqueStocks.map((s) => s.code));
      hasCheckedPrices.current = true;
    }
  }, [user, uniqueStocks, updatePrices]);

  // --- Handlers ---
  const showMessage = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

  const handleUpdatePrices = async () => {
    const codes = Object.keys(portfolio);
    const success = await updatePrices(codes);
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
      const data = JSON.parse(jsonContent);
      if (!Array.isArray(data.accounts) || !Array.isArray(data.transactions)) {
        throw new Error("格式错误");
      }
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
              bAccount.initialRealizedPnL || bAccount.initialPnL || 0,
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
        tx.date,
        tx.stockCode,
        tx.stockName,
        typeStr,
        tx.price || 0,
        tx.shares || 0,
        tx.commission || 0,
        tx.tax || 0,
        tx.otherFees || 0,
        tx.groupTag || "",
        accName,
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

  const stickyLeftFirst =
    "sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-40";
  const stickyLeftSecond =
    "sticky left-40 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-28 border-l border-gray-100";
  const stickyRightLast =
    "sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]";

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
            { id: "history", label: "清仓历史", icon: History },
            { id: "analysis", label: "T操作/策略", icon: Layers },
            { id: "transactions", label: "交易明细", icon: Filter },
            { id: "stock_details", label: "个股透视", icon: FileText },
            { id: "accounts", label: "账户管理", icon: DollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
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
            <div className="p-0">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
                <h2 className="font-semibold text-gray-700">持仓列表</h2>
                <button
                  onClick={handleUpdatePrices}
                  disabled={pricesLoading}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={pricesLoading ? "animate-spin" : ""}
                  />
                  <span>{pricesLoading ? "更新中..." : "更新现价"}</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-max">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <SortableHeader
                        label="名称/代码"
                        sortKey="stockCode"
                        currentSort={holdingsSort}
                        onSort={handleHoldingsSort}
                        align="left"
                        className={`${stickyLeftFirst}`}
                      />
                      <SortableHeader
                        label="持仓"
                        sortKey="sharesHeld"
                        currentSort={holdingsSort}
                        onSort={handleHoldingsSort}
                        className={`${stickyLeftSecond}`}
                      />
                      <th className="px-6 py-3 text-right">现价</th>
                      <th className="px-6 py-3 text-right">成本价</th>
                      <SortableHeader
                        label="市值"
                        sortKey="marketValue"
                        currentSort={holdingsSort}
                        onSort={handleHoldingsSort}
                      />
                      <th className="px-6 py-3 text-right">浮动盈亏</th>
                      <th className="px-6 py-3 text-right">区间收益(T)</th>
                      <th className="px-6 py-3 text-right">盈亏比例</th>
                      <th
                        className={`px-6 py-3 text-center bg-gray-50 ${stickyRightLast}`}
                      >
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activePositionsSorted.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-6 py-12 text-center text-gray-400"
                        >
                          暂无持仓，快去开仓吧
                        </td>
                      </tr>
                    ) : (
                      activePositionsSorted.map((pos) => {
                        const roi =
                          pos.totalCost !== 0
                            ? (pos.unrealizedPnL / pos.totalCost) * 100
                            : 0;
                        return (
                          <tr
                            key={pos.stockCode}
                            className="hover:bg-gray-50 transition group"
                          >
                            <td
                              className={`px-6 py-4 bg-white group-hover:bg-gray-50 ${stickyLeftFirst}`}
                            >
                              <div className="font-medium text-gray-900">
                                {pos.stockName}
                              </div>
                              <div className="text-xs text-gray-400">
                                {pos.stockCode}
                              </div>
                            </td>
                            <td
                              className={`px-6 py-4 text-right font-mono bg-white group-hover:bg-gray-50 ${stickyLeftSecond}`}
                            >
                              {pos.sharesHeld}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-gray-700">
                              {editingPrice?.stockCode === pos.stockCode ? (
                                <input
                                  type="number"
                                  className="w-20 text-right border rounded px-1 py-0.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={editingPrice.currentPrice}
                                  onChange={(e) =>
                                    setEditingPrice({
                                      ...editingPrice,
                                      currentPrice: e.target.value,
                                    })
                                  }
                                  onBlur={() => {
                                    if (editingPrice.currentPrice) {
                                      setPrice(
                                        pos.stockCode,
                                        parseFloat(editingPrice.currentPrice)
                                      );
                                    }
                                    setEditingPrice(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      if (editingPrice.currentPrice) {
                                        setPrice(
                                          pos.stockCode,
                                          parseFloat(editingPrice.currentPrice)
                                        );
                                      }
                                      setEditingPrice(null);
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="cursor-pointer hover:text-blue-600 hover:underline decoration-dashed underline-offset-4"
                                  onClick={() =>
                                    setEditingPrice({
                                      stockCode: pos.stockCode,
                                      currentPrice: pos.currentPrice.toString(),
                                    })
                                  }
                                  title="点击修改现价"
                                >
                                  {formatNumber(pos.currentPrice)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-gray-500">
                              {formatNumber(pos.avgCost)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-medium">
                              {formatCurrency(pos.marketValue)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono">
                              <PnLText value={pos.unrealizedPnL} />
                            </td>
                            <td className="px-6 py-4 text-right font-mono">
                              <div className="flex flex-col items-end">
                                <PnLText value={pos.realizedPnL} />
                                <span className="text-[10px] text-gray-400">
                                  已落袋
                                </span>
                              </div>
                            </td>
                            <td
                              className={`px-6 py-4 text-right font-mono font-medium ${roi >= 0 ? "text-red-500" : "text-green-500"}`}
                            >
                              {roi >= 0 ? "+" : ""}
                              {roi.toFixed(2)}%
                            </td>
                            <td
                              className={`px-6 py-4 bg-white group-hover:bg-gray-50 ${stickyRightLast}`}
                            >
                              <div className="flex justify-center space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleQuickAction("BUY", pos)}
                                  className="p-1.5 rounded-full text-blue-600 bg-blue-100 hover:bg-blue-200 transition"
                                  title="加仓"
                                >
                                  <PlusCircle size={16} />
                                </button>
                                <button
                                  onClick={() => handleQuickAction("SELL", pos)}
                                  className="p-1.5 rounded-full text-orange-600 bg-orange-100 hover:bg-orange-200 transition"
                                  title="减仓"
                                >
                                  <MinusCircle size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleQuickAction("CLEAR", pos)
                                  }
                                  className="p-1.5 rounded-full text-red-600 bg-red-100 hover:bg-red-200 transition"
                                  title="一键清仓"
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: ANALYSIS (Grouped by Stock) */}
          {activeTab === "analysis" && (
            <div>
              <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
                <h2 className="font-semibold text-gray-700">
                  T操作 / 策略汇总 (按股票)
                </h2>
                <div className="text-xs text-gray-500">
                  点击股票查看策略明细
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-max">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-3">股票</th>
                      <th className="px-6 py-3 text-center">策略分组数量</th>
                      <th className="px-6 py-3 text-right">总投入成本</th>
                      <th className="px-6 py-3 text-right">总回笼资金</th>
                      <th className="px-6 py-3 text-right">总净利润</th>
                      <th className="px-6 py-3 text-right">平均收益率</th>
                      <th className="px-6 py-3 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stockStrategyAnalysis.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-gray-400"
                        >
                          暂无分组数据，请在交易中添加"分组标记"
                        </td>
                      </tr>
                    ) : (
                      stockStrategyAnalysis.map((s) => (
                        <tr
                          key={s.stockCode}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedStrategyStock(s)}
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {s.stockName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {s.stockCode}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                              {s.groups.length}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            {formatCurrency(s.totalBuyCost)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            {formatCurrency(s.totalSellRevenue)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-base">
                            <PnLText value={s.netProfit} />
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-mono ${s.roi >= 0 ? "text-red-600" : "text-green-600"}`}
                          >
                            {s.roi > 0 ? "+" : ""}
                            {s.roi.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button className="text-blue-600 hover:bg-blue-50 p-1 rounded-full">
                              <ChevronRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: HISTORY */}
          {activeTab === "history" && (
            <div>
              <div className="px-6 py-4 border-b bg-gray-50/50">
                <h2 className="font-semibold text-gray-700">已清仓历史战绩</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-max">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className={`px-6 py-3 bg-gray-50 ${stickyLeftFirst}`}>
                        股票
                      </th>
                      <th className="px-6 py-3 text-right">最后操作日</th>
                      <th className="px-6 py-3 text-right">累计交易费</th>
                      <th className="px-6 py-3 text-right">累计融资利息</th>
                      <th className="px-6 py-3 text-right">累计分红</th>
                      <SortableHeader
                        label="最终净盈亏"
                        sortKey="realizedPnL"
                        currentSort={historySort}
                        onSort={handleHistorySort}
                      />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clearedPositionsSorted.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-400"
                        >
                          暂无清仓记录
                        </td>
                      </tr>
                    ) : (
                      clearedPositionsSorted.map((pos) => (
                        <tr key={pos.stockCode} className="hover:bg-gray-50">
                          <td
                            className={`px-6 py-4 bg-white group-hover:bg-gray-50 ${stickyLeftFirst}`}
                          >
                            <div className="font-medium text-gray-900">
                              {pos.stockName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {pos.stockCode}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            {pos.lastUpdate}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-500">
                            {formatNumber(pos.totalFees)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-green-600">
                            {formatNumber(pos.totalInterest)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-amber-600">
                            {formatNumber(pos.totalDividend)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-base">
                            <PnLText value={pos.realizedPnL} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: TRANSACTIONS */}
          {activeTab === "transactions" && (
            <div>
              <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between">
                <h2 className="font-semibold text-gray-700">交易流水明细</h2>
                <div className="text-xs text-gray-400 flex items-center">
                  按时间倒序排列
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-max">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className={`px-4 py-3 bg-gray-50 ${stickyLeftFirst}`}>
                        日期
                      </th>
                      <th className="px-4 py-3">账户</th>
                      <th className="px-4 py-3">操作</th>
                      <th className="px-4 py-3">标的</th>
                      <th className="px-4 py-3 text-right">价格/金额</th>
                      <th className="px-4 py-3 text-right">数量</th>
                      <th className="px-4 py-3 text-right">税费</th>
                      <th className="px-4 py-3 text-right">发生金额</th>
                      <th
                        className={`px-4 py-3 text-center bg-gray-50 ${stickyRightLast}`}
                      >
                        状态/操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions
                      .filter(
                        (t) =>
                          selectedAccountId === "all" ||
                          t.accountId === selectedAccountId
                      )
                      .map((tx) => {
                        const isBuy = tx.type === "BUY";
                        const isSell = tx.type === "SELL";
                        const isInterest = tx.type === "INTEREST";
                        const isDividend = tx.type === "DIVIDEND";
                        const isRevoked = tx.status === "revoked";

                        let amount = 0;
                        if (isInterest || isDividend) {
                          amount = tx.price;
                        } else {
                          amount = tx.price * tx.shares;
                        }

                        const totalFee =
                          (tx.commission || 0) +
                          (tx.tax || 0) +
                          (tx.otherFees || 0);

                        let badgeColor = "bg-gray-100 text-gray-600";
                        if (isBuy) badgeColor = "bg-red-100 text-red-600";
                        if (isSell) badgeColor = "bg-green-100 text-green-600";
                        if (isDividend)
                          badgeColor = "bg-yellow-100 text-yellow-700";
                        if (isInterest)
                          badgeColor = "bg-amber-100 text-amber-700";

                        const rowOpacity = isRevoked
                          ? "opacity-50 grayscale bg-gray-50"
                          : "hover:bg-gray-50";
                        const textDecoration = isRevoked
                          ? "line-through decoration-gray-400"
                          : "";

                        return (
                          <tr key={tx.id} className={`${rowOpacity} group`}>
                            <td
                              className={`px-4 py-3 text-gray-500 whitespace-nowrap ${isRevoked ? "bg-gray-50" : "bg-white"} group-hover:bg-gray-50 ${stickyLeftFirst}`}
                            >
                              {tx.date}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {accounts.find((a) => a.id === tx.accountId)
                                ?.name || "未知"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${badgeColor}`}
                              >
                                {isBuy
                                  ? "买入"
                                  : isSell
                                    ? "卖出"
                                    : isInterest
                                      ? "利息"
                                      : "分红"}
                              </span>
                            </td>
                            <td
                              className={`px-4 py-3 font-medium ${textDecoration}`}
                            >
                              {tx.stockName}{" "}
                              <span className="text-gray-400 text-xs">
                                ({tx.stockCode})
                              </span>
                              {tx.groupTag && (
                                <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 px-1 rounded">
                                  {tx.groupTag}
                                </span>
                              )}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-mono ${textDecoration}`}
                            >
                              {isInterest ? "-" : formatNumber(tx.price)}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-mono ${textDecoration}`}
                            >
                              {isInterest ? "-" : tx.shares}
                            </td>
                            <td
                              className={`px-4 py-3 text-right text-gray-400 text-xs ${textDecoration}`}
                            >
                              {isInterest ? "-" : formatNumber(totalFee)}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-medium ${textDecoration} ${isInterest ? "text-amber-600" : ""}`}
                            >
                              {formatCurrency(amount)}
                            </td>
                            <td
                              className={`px-4 py-3 text-center ${isRevoked ? "bg-gray-50" : "bg-white"} group-hover:bg-gray-50 ${stickyRightLast}`}
                            >
                              {isRevoked ? (
                                <span className="text-xs font-bold text-gray-400 border border-gray-300 px-2 py-1 rounded">
                                  已撤回
                                </span>
                              ) : (
                                <div className="flex justify-center space-x-2">
                                  {(tx.type === "BUY" ||
                                    tx.type === "SELL") && (
                                    <button
                                      type="button"
                                      onClick={() => handleLinkClick(tx)}
                                      className="text-gray-500 hover:text-purple-600 transition p-1"
                                      title="关联交易 / 标记 T"
                                    >
                                      <Link size={14} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleEditTx(tx)}
                                    className="text-gray-500 hover:text-blue-600 transition p-1"
                                    title="编辑交易 / 分组"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeClick(tx.id)}
                                    className="text-gray-500 hover:text-orange-600 transition p-1"
                                    title="撤回交易"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: STOCK DETAILS */}
          {activeTab === "stock_details" && (
            <div className="p-6 min-h-[500px]">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Search size={16} className="mr-2" />
                    选择或搜索股票
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg bg-gray-50 font-medium"
                    value={selectedStockCode}
                    onChange={(e) => setSelectedStockCode(e.target.value)}
                  >
                    <option value="">-- 请选择要分析的股票 --</option>
                    {uniqueStocks.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {stockDetailsData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-xs text-blue-600 font-medium mb-1">
                          累计盈亏 (已落袋)
                        </div>
                        <div className="text-xl font-bold text-blue-800">
                          <PnLText
                            value={stockDetailsData.position.realizedPnL}
                          />
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-xs text-gray-500 font-medium mb-1">
                          累计交易费用
                        </div>
                        <div className="text-xl font-bold text-gray-700">
                          {formatNumber(stockDetailsData.position.totalFees)}
                        </div>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <div className="text-xs text-amber-600 font-medium mb-1">
                          累计融资利息
                        </div>
                        <div className="text-xl font-bold text-amber-700">
                          {formatNumber(
                            stockDetailsData.position.totalInterest
                          )}
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-xs text-green-600 font-medium mb-1">
                          累计分红
                        </div>
                        <div className="text-xl font-bold text-green-700">
                          {formatNumber(
                            stockDetailsData.position.totalDividend
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-6 py-4 border-b bg-gray-50/50 font-medium text-gray-700">
                        交易明细 ({stockDetailsData.transactions.length} 笔)
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500">
                            <tr>
                              <th className="px-4 py-3">日期</th>
                              <th className="px-4 py-3">操作</th>
                              <th className="px-4 py-3 text-right">
                                价格/金额
                              </th>
                              <th className="px-4 py-3 text-right">数量</th>
                              <th className="px-4 py-3 text-right">发生金额</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {stockDetailsData.transactions.map((tx) => {
                              const isBuy = tx.type === "BUY";
                              const isSell = tx.type === "SELL";
                              const isInterest = tx.type === "INTEREST";
                              const isDividend = tx.type === "DIVIDEND";
                              const amount =
                                isInterest || isDividend
                                  ? tx.price
                                  : tx.price * tx.shares;

                              let badgeColor = "bg-gray-100 text-gray-600";
                              if (isBuy) badgeColor = "bg-red-100 text-red-600";
                              if (isSell)
                                badgeColor = "bg-green-100 text-green-600";
                              if (isDividend)
                                badgeColor = "bg-yellow-100 text-yellow-700";
                              if (isInterest)
                                badgeColor = "bg-amber-100 text-amber-700";

                              return (
                                <tr key={tx.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                    {tx.date}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${badgeColor}`}
                                    >
                                      {isBuy
                                        ? "买入"
                                        : isSell
                                          ? "卖出"
                                          : isInterest
                                            ? "利息"
                                            : "分红"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-gray-600">
                                    {isInterest ? "-" : formatNumber(tx.price)}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-gray-600">
                                    {isInterest ? "-" : tx.shares}
                                  </td>
                                  <td
                                    className={`px-4 py-3 text-right font-medium ${isInterest ? "text-amber-600" : ""}`}
                                  >
                                    {formatCurrency(amount)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    请选择一只股票以查看详细分析
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: ACCOUNTS */}
          {activeTab === "accounts" && (
            <div className="p-8">
              <div className="max-w-md mx-auto text-center space-y-6">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
                  这里管理你的所有证券账户。不同的账户交易将被分开记录，但在首页可以查看汇总资产。
                </div>
                <div className="space-y-3">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex justify-between items-center p-4 bg-white border shadow-sm rounded-lg hover:border-blue-300 transition cursor-pointer"
                      onClick={() => setSelectedAccountId(acc.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                          <Wallet size={18} />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-gray-800">
                            {acc.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            期初盈亏:{" "}
                            <span
                              className={
                                acc.initialRealizedPnL &&
                                acc.initialRealizedPnL >= 0
                                  ? "text-red-500"
                                  : "text-green-500"
                              }
                            >
                              {formatCurrency(acc.initialRealizedPnL || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedAccountId === acc.id && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            当前选中
                          </span>
                        )}
                        <button
                          onClick={(e) => handleEditAccount(acc, e)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                          title="编辑账户"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddAccount}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition font-medium flex justify-center items-center space-x-2"
                >
                  <PlusCircle size={18} />
                  <span>添加新的证券账户</span>
                </button>
              </div>
            </div>
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

      {(globalLoading || pricesLoading) && <LoadingOverlay />}
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
