import { useMemo } from 'react';
import { Link, CheckCircle } from 'lucide-react';
import type { Transaction } from '../../types';
import { formatNumber } from '../../utils';

interface LinkTransactionModalProps {
	isOpen: boolean;
	onClose: () => void;
	sourceTx: Transaction | null;
	allTransactions: Transaction[];
	onLink: (targetTx: Transaction) => void;
}

const LinkTransactionModal = ({ isOpen, onClose, sourceTx, allTransactions, onLink }: LinkTransactionModalProps) => {
	// 筛选条件：同股票、同账户、非自己、非撤回、必须是买卖
	const candidates = useMemo(() => {
		if (!sourceTx) return [];
		return allTransactions.filter((tx) => {
			if (tx.stockCode !== sourceTx.stockCode) return false;
			if (tx.accountId !== sourceTx.accountId) return false;
			if (tx.id === sourceTx.id) return false;
			if (tx.status === 'revoked') return false;

			// 仅允许 BUY 和 SELL
			const validTypes = ['BUY', 'SELL'];
			if (!validTypes.includes(tx.type)) return false;
			if (!validTypes.includes(sourceTx.type)) return false;

			return true;
		});
	}, [allTransactions, sourceTx]);

	if (!isOpen || !sourceTx) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
				<div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
					<h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
						<Link size={20} className="text-blue-600" />
						关联交易 - {sourceTx.stockName} ({sourceTx.stockCode})
					</h3>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
						✕
					</button>
				</div>

				<div className="bg-blue-50 px-6 py-3 text-sm text-blue-800 border-b border-blue-100">
					当前选择：<span className="font-mono font-bold">{sourceTx.date}</span> 的
					<span className={`mx-1 font-bold ${sourceTx.type === 'BUY' ? 'text-red-600' : 'text-green-600'}`}>
						{sourceTx.type === 'BUY' ? '买入' : sourceTx.type === 'SELL' ? '卖出' : sourceTx.type}
					</span>
					<span className="font-mono">{sourceTx.shares}</span> 股 @ <span className="font-mono">{sourceTx.price}</span>
					{sourceTx.groupTag && <span className="ml-2 bg-white px-2 py-0.5 rounded border border-blue-200 text-xs">Tag: {sourceTx.groupTag}</span>}
				</div>

				<div className="p-0 overflow-y-auto flex-1">
					{candidates.length === 0 ? (
						<div className="p-12 text-center text-gray-400">没有找到同股票、同账户的可关联交易记录</div>
					) : (
						<table className="w-full text-sm text-left">
							<thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
								<tr>
									<th className="px-4 py-3">日期</th>
									<th className="px-4 py-3">操作</th>
									<th className="px-4 py-3 text-right">价格</th>
									<th className="px-4 py-3 text-right">数量</th>
									<th className="px-4 py-3">当前 Tag</th>
									<th className="px-4 py-3 text-center">操作</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{candidates.map((tx) => {
									const isBuy = tx.type === 'BUY';
									const badgeColor = isBuy ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';
									const isAlreadyLinked = sourceTx.groupTag && tx.groupTag === sourceTx.groupTag;

									return (
										<tr key={tx.id} className="hover:bg-gray-50">
											<td className="px-4 py-3 text-gray-600 font-mono">{tx.date}</td>
											<td className="px-4 py-3">
												<span className={`px-2 py-1 rounded text-xs font-medium ${badgeColor}`}>
													{tx.type === 'BUY' ? '买入' : tx.type === 'SELL' ? '卖出' : tx.type}
												</span>
											</td>
											<td className="px-4 py-3 text-right font-mono">{formatNumber(tx.price)}</td>
											<td className="px-4 py-3 text-right font-mono">{tx.shares}</td>
											<td className="px-4 py-3">
												{tx.groupTag ? (
													<span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs border">{tx.groupTag}</span>
												) : (
													<span className="text-gray-300 text-xs">-</span>
												)}
											</td>
											<td className="px-4 py-3 text-center">
												{isAlreadyLinked ? (
													<span className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
														<CheckCircle size={12} /> 已关联
													</span>
												) : (
													<button
														onClick={() => onLink(tx)}
														className="text-xs bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition shadow-sm"
													>
														关联此条
													</button>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
};

export default LinkTransactionModal;
