import React from "react";
import SortableHeader from "../SortableHeader";
import PnLText from "../PnLText";
import Pagination from "../Pagination";
import { formatNumber } from "../../utils";
import type { StockPosition, SortDirection } from "../../types";

interface HistoryProps {
  clearedPositionsSorted: StockPosition[];
  historyPage: number;
  historyPageSize: number;
  setHistoryPage: (page: number) => void;
  setHistoryPageSize: (size: number) => void;
  historySort: { key: string; direction: SortDirection } | null;
  handleHistorySort: (key: keyof StockPosition) => void;
}

const History: React.FC<HistoryProps> = ({
  clearedPositionsSorted,
  historyPage,
  historyPageSize,
  setHistoryPage,
  setHistoryPageSize,
  historySort,
  handleHistorySort,
}) => {
  const stickyLeftFirst =
    "sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-40";

  return (
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
              clearedPositionsSorted
                .slice(
                  (historyPage - 1) * historyPageSize,
                  historyPage * historyPageSize
                )
                .map((pos) => (
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
      <Pagination
        currentPage={historyPage}
        totalItems={clearedPositionsSorted.length}
        pageSize={historyPageSize}
        onPageChange={setHistoryPage}
        onPageSizeChange={setHistoryPageSize}
      />
    </div>
  );
};

export default History;
