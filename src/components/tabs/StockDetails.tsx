import React from "react";
import { Search } from "lucide-react";
import PnLText from "../PnLText";
import { formatNumber, formatCurrency } from "../../utils";
import type { StockPosition, Transaction } from "../../types";

interface StockDetailsProps {
  selectedStockCode: string;
  setSelectedStockCode: (code: string) => void;
  uniqueStocks: { code: string; name: string }[];
  stockDetailsData: {
    position: StockPosition;
    transactions: Transaction[];
  } | null;
}

const StockDetails: React.FC<StockDetailsProps> = ({
  selectedStockCode,
  setSelectedStockCode,
  uniqueStocks,
  stockDetailsData,
}) => {
  return (
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
                  <PnLText value={stockDetailsData.position.realizedPnL} />
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
                  {formatNumber(stockDetailsData.position.totalInterest)}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-xs text-green-600 font-medium mb-1">
                  累计分红
                </div>
                <div className="text-xl font-bold text-green-700">
                  {formatNumber(stockDetailsData.position.totalDividend)}
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
                      <th className="px-4 py-3 text-right">价格/金额</th>
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
                      if (isSell) badgeColor = "bg-green-100 text-green-600";
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
                            className={`px-4 py-3 text-right font-medium ${
                              isInterest ? "text-amber-600" : ""
                            }`}
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
  );
};

export default StockDetails;
