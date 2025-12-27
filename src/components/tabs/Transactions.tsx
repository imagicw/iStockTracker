import React from "react";
import { Link, Edit2, RotateCcw } from "lucide-react";
import Pagination from "../Pagination";
import { formatNumber, formatCurrency } from "../../utils";
import type { Transaction, Account } from "../../types";

interface TransactionsProps {
  transactions: Transaction[];
  selectedAccountId: string;
  transactionsPage: number;
  transactionsPageSize: number;
  setTransactionsPage: (page: number) => void;
  setTransactionsPageSize: (size: number) => void;
  accounts: Account[];
  handleLinkClick: (tx: Transaction) => void;
  handleEditTx: (tx: Transaction) => void;
  handleRevokeClick: (id: string) => void;
}

const Transactions: React.FC<TransactionsProps> = ({
  transactions,
  selectedAccountId,
  transactionsPage,
  transactionsPageSize,
  setTransactionsPage,
  setTransactionsPageSize,
  accounts,
  handleLinkClick,
  handleEditTx,
  handleRevokeClick,
}) => {
  const stickyLeftFirst =
    "sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-40";
  const stickyRightLast =
    "sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]";

  return (
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
              .slice(
                (transactionsPage - 1) * transactionsPageSize,
                transactionsPage * transactionsPageSize
              )
              .map((tx) => {
                const isBuy = tx.type === "BUY";
                const isSell = tx.type === "SELL";
                const isInterest = tx.type === "INTEREST";
                const isDividend = tx.type === "DIVIDEND";
                const isRevoked = tx.status === "revoked";

                const totalFee =
                  (tx.commission || 0) + (tx.tax || 0) + (tx.otherFees || 0);

                let amount = 0;
                if (isInterest || isDividend) {
                  amount = tx.price - totalFee;
                } else if (isBuy) {
                  amount = tx.price * tx.shares + totalFee;
                } else {
                  amount = tx.price * tx.shares - totalFee;
                }

                let badgeColor = "bg-gray-100 text-gray-600";
                if (isBuy) badgeColor = "bg-red-100 text-red-600";
                if (isSell) badgeColor = "bg-green-100 text-green-600";
                if (isDividend) badgeColor = "bg-yellow-100 text-yellow-700";
                if (isInterest) badgeColor = "bg-amber-100 text-amber-700";

                const rowOpacity = isRevoked
                  ? "opacity-50 grayscale bg-gray-50"
                  : "hover:bg-gray-50";
                const textDecoration = isRevoked
                  ? "line-through decoration-gray-400"
                  : "";

                return (
                  <tr key={tx.id} className={`${rowOpacity} group`}>
                    <td
                      className={`px-4 py-3 text-gray-500 whitespace-nowrap ${isRevoked ? "bg-gray-50" : "bg-white"
                        } group-hover:bg-gray-50 ${stickyLeftFirst}`}
                    >
                      {tx.date}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {accounts.find((a) => a.id === tx.accountId)?.name ||
                        "未知"}
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
                    <td className={`px-4 py-3 font-medium ${textDecoration}`}>
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
                      className={`px-4 py-3 text-right font-medium ${textDecoration} ${isInterest ? "text-amber-600" : ""
                        }`}
                    >
                      {formatCurrency(amount)}
                    </td>
                    <td
                      className={`px-4 py-3 text-center ${isRevoked ? "bg-gray-50" : "bg-white"
                        } group-hover:bg-gray-50 ${stickyRightLast}`}
                    >
                      {isRevoked ? (
                        <span className="text-xs font-bold text-gray-400 border border-gray-300 px-2 py-1 rounded">
                          已撤回
                        </span>
                      ) : (
                        <div className="flex justify-center space-x-2">
                          {(tx.type === "BUY" || tx.type === "SELL") && (
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
      <Pagination
        currentPage={transactionsPage}
        totalItems={
          transactions.filter(
            (t) =>
              selectedAccountId === "all" || t.accountId === selectedAccountId
          ).length
        }
        pageSize={transactionsPageSize}
        onPageChange={setTransactionsPage}
        onPageSizeChange={setTransactionsPageSize}
      />
    </div>
  );
};

export default Transactions;
