import { Tag } from 'lucide-react';
import type { StockStrategyStats } from '../../types';
import { formatCurrency } from '../../utils';
import PnLText from '../PnLText';

interface StockStrategyModalProps {
	isOpen: boolean;
	onClose: () => void;
	stockStats: StockStrategyStats | null;
}

const StockStrategyModal = ({ isOpen, onClose, stockStats }: StockStrategyModalProps) => {
	if (!isOpen || !stockStats) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
				<div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
					<div>
						<h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
							{stockStats.stockName} <span className="text-sm text-gray-500 font-normal">({stockStats.stockCode})</span>
						</h3>
						<p className="text-xs text-gray-500 mt-1">T操作 / 策略详情</p>
					</div>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
						✕
					</button>
				</div>

				<div className="p-0 overflow-y-auto flex-1">
					<table className="w-full text-sm text-left">
						<thead className="bg-gray-50 text-gray-500 sticky top-0 z-10 shadow-sm">
							<tr>
								<th className="px-6 py-3">分组标记 (Tag)</th>
								<th className="px-6 py-3 text-right">投入成本</th>
								<th className="px-6 py-3 text-right">回笼资金</th>
								<th className="px-6 py-3 text-right">净利润</th>
								<th className="px-6 py-3 text-right">收益率</th>
								<th className="px-6 py-3 text-center">状态</th>
								<th className="px-6 py-3 text-right">时间跨度</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{stockStats.groups.length === 0 ? (
								<tr>
									<td colSpan={7} className="px-6 py-12 text-center text-gray-400">
										暂无策略分组数据
									</td>
								</tr>
							) : (
								stockStats.groups.map((g) => (
									<tr key={g.tag} className="hover:bg-gray-50">
										<td className="px-6 py-4 font-medium text-blue-600 flex items-center gap-1">
											<Tag size={14} /> {g.tag}
										</td>
										<td className="px-6 py-4 text-right text-gray-600">{formatCurrency(g.totalBuyCost)}</td>
										<td className="px-6 py-4 text-right text-gray-600">{formatCurrency(g.totalSellRevenue)}</td>
										<td className="px-6 py-4 text-right font-bold">
											<PnLText value={g.netProfit} />
										</td>
										<td className={`px-6 py-4 text-right font-mono ${g.roi >= 0 ? 'text-red-600' : 'text-green-600'}`}>
											{g.roi > 0 ? '+' : ''}
											{g.roi.toFixed(2)}%
										</td>
										<td className="px-6 py-4 text-center">
											{g.isClosed ? (
												<span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">已闭环</span>
											) : (
												<span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">进行中</span>
											)}
										</td>
										<td className="px-6 py-4 text-right text-xs text-gray-400">
											{g.startDate} ~ {g.endDate}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
				<div className="bg-gray-50 px-6 py-3 border-t text-right text-sm text-gray-500 flex justify-between">
					<span>累计投入: {formatCurrency(stockStats.totalBuyCost)}</span>
					<span>
						共 {stockStats.groups.length} 个策略组，累计净利: <PnLText value={stockStats.netProfit} />
					</span>
				</div>
			</div>
		</div>
	);
};

export default StockStrategyModal;
