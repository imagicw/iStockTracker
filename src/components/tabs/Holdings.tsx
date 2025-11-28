import React from "react";
import { RefreshCw, PlusCircle, MinusCircle, XCircle } from "lucide-react";
import SortableHeader from "../SortableHeader";
import PnLText from "../PnLText";
import { formatCurrency, formatNumber } from "../../utils";
import type { StockPosition, SortDirection } from "../../types";

interface HoldingsProps {
  pricesLoading: boolean;
  handleUpdatePrices: () => void;
  holdingsSort: { key: string; direction: SortDirection } | null;
  handleHoldingsSort: (key: keyof StockPosition) => void;
  activePositionsSorted: StockPosition[];
  editingPrice: { stockCode: string; currentPrice: string } | null;
  setEditingPrice: (
    price: { stockCode: string; currentPrice: string } | null
  ) => void;
  setPrice: (stockCode: string, price: number) => void;
  handleQuickAction: (
    action: "BUY" | "SELL" | "CLEAR",
    pos: StockPosition
  ) => void;
}

const Holdings: React.FC<HoldingsProps> = ({
  pricesLoading,
  handleUpdatePrices,
  holdingsSort,
  handleHoldingsSort,
  activePositionsSorted,
  editingPrice,
  setEditingPrice,
  setPrice,
  handleQuickAction,
}) => {
  const stickyLeftFirst =
    "sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-40";
  const stickyLeftSecond =
    "sticky left-40 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-28 border-l border-gray-100";
  const stickyRightLast =
    "sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]";

  return (
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
                      className={`px-6 py-4 text-right font-mono font-medium ${
                        roi >= 0 ? "text-red-500" : "text-green-500"
                      }`}
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
                          onClick={() => handleQuickAction("CLEAR", pos)}
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
  );
};

export default Holdings;
