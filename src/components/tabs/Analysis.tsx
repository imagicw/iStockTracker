import React from "react";
import { ChevronRight } from "lucide-react";
import PnLText from "../PnLText";
import Pagination from "../Pagination";
import { formatCurrency } from "../../utils";
import type { StockStrategyStats } from "../../types";

interface AnalysisProps {
  stockStrategyAnalysis: StockStrategyStats[];
  analysisPage: number;
  analysisPageSize: number;
  setAnalysisPage: (page: number) => void;
  setAnalysisPageSize: (size: number) => void;
  setSelectedStrategyStock: (stock: StockStrategyStats | null) => void;
}

const Analysis: React.FC<AnalysisProps> = ({
  stockStrategyAnalysis,
  analysisPage,
  analysisPageSize,
  setAnalysisPage,
  setAnalysisPageSize,
  setSelectedStrategyStock,
}) => {
  return (
    <div>
      <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
        <h2 className="font-semibold text-gray-700">
          T操作 / 策略汇总 (按股票)
        </h2>
        <div className="text-xs text-gray-500">点击股票查看策略明细</div>
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
              stockStrategyAnalysis
                .slice(
                  (analysisPage - 1) * analysisPageSize,
                  analysisPage * analysisPageSize
                )
                .map((s) => (
                  <tr
                    key={s.stockCode}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedStrategyStock(s)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {s.stockName}
                      </div>
                      <div className="text-xs text-gray-400">{s.stockCode}</div>
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
                      className={`px-6 py-4 text-right font-mono ${
                        s.roi >= 0 ? "text-red-600" : "text-green-600"
                      }`}
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
      <Pagination
        currentPage={analysisPage}
        totalItems={stockStrategyAnalysis.length}
        pageSize={analysisPageSize}
        onPageChange={setAnalysisPage}
        onPageSizeChange={setAnalysisPageSize}
      />
    </div>
  );
};

export default Analysis;
