import { useState } from 'react';
import type { Account, TransactionType, ToastType } from '../../types';
import { sanitizeTransactionInput } from '../../utils/validation';

interface ImportModalProps {
	isOpen: boolean;
	onClose: () => void;
	onImport: (data: any[], targetAccountId: string) => void;
	accounts: Account[];
	showMessage: (msg: string, type: ToastType) => void;
}

const ImportModal = ({ isOpen, onClose, onImport, accounts, showMessage }: ImportModalProps) => {
	const [text, setText] = useState('');
	const [parsedData, setParsedData] = useState<any[]>([]);
	const [targetAccountId, setTargetAccountId] = useState('');

	if (!isOpen) return null;

	const parseText = () => {
		if (!text.trim()) return;
		const lines = text.trim().split('\n');
		const data = [];

		for (const line of lines) {
			if (line.includes('日期') && line.includes('代码')) continue;

			const parts = line.split(/[\t,，]+/).map((p) => p.trim());
			if (parts.length < 5) continue;

			const date = parts[0].replace(/\//g, '-');
			const stockCode = parts[1];
			const stockName = parts[2];
			const typeRaw = parts[3];
			const price = parseFloat(parts[4]);
			const shares = parseFloat(parts[5]);

			let type: TransactionType = 'BUY';
			if (typeRaw.includes('卖')) type = 'SELL';
			else if (typeRaw.includes('红') || typeRaw.includes('股息')) type = 'DIVIDEND';
			else if (typeRaw.includes('息') || typeRaw.includes('利')) type = 'INTEREST';

			const commission = parseFloat(parts[6] || '0');
			const tax = parseFloat(parts[7] || '0');
			const otherFees = parseFloat(parts[8] || '0');
			const groupTag = parts[9] || '';

			if (!isNaN(price)) {
				const safeShares = isNaN(shares) ? 0 : shares;

				try {
					// 🛡️ Sentinel: Sanitize imported data before adding to state
					const sanitized = sanitizeTransactionInput({
						date,
						stockCode,
						stockName,
						type,
						price,
						shares: safeShares,
						commission,
						tax,
						otherFees,
						marginInterest: 0,
						status: 'normal',
						groupTag,
					});
					data.push(sanitized);
				} catch (e) {
					console.warn(`Skipping invalid line: ${line}`, e);
				}
			}
		}
		setParsedData(data);
	};

	const handleConfirm = () => {
		if (!targetAccountId) {
			showMessage('请选择导入的目标账户', 'error');
			return;
		}
		if (parsedData.length === 0) {
			showMessage('没有解析到有效数据', 'error');
			return;
		}
		onImport(parsedData, targetAccountId);
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
				<div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
					<h3 className="font-bold text-lg text-gray-800">批量导入交易</h3>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
						✕
					</button>
				</div>
				<div className="p-6 overflow-y-auto flex-1">
					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-1">选择导入账户</label>
						<select className="w-full border rounded-lg p-2 bg-white" value={targetAccountId} onChange={(e) => setTargetAccountId(e.target.value)}>
							<option value="">-- 请选择 --</option>
							{accounts.map((acc) => (
								<option key={acc.id} value={acc.id}>
									{acc.name}
								</option>
							))}
						</select>
					</div>

					<div className="mb-4 space-y-2">
						<label className="block text-sm font-medium text-gray-700">粘贴数据 (Excel / CSV)</label>
						<p className="text-xs text-gray-500">
							格式：<span className="font-mono bg-gray-100 p-0.5 rounded">日期, 代码, 名称, 操作, 金额/价格, 数量, 佣金, 税, 其他, [分组Tag]</span>
							<br />
							支持 Tab 或 逗号 分隔。
						</p>
						<textarea
							className="w-full h-32 border rounded-lg p-2 font-mono text-sm"
							placeholder={`2023-01-01, 600519, 茅台, 买入, 1800, 100, 5, 0, 0, 首仓\n2023-01-02, 600519, 茅台, 卖出, 1850, 100, 5, 1.8, 0, 首仓`}
							value={text}
							onChange={(e) => setText(e.target.value)}
							maxLength={5000000} // 🛡️ Sentinel: Enforce paste size limit to prevent DoS via large parsing
						/>
						<button onClick={parseText} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium">
							解析预览
						</button>
					</div>

					{parsedData.length > 0 && (
						<div className="border rounded-lg overflow-hidden">
							<table className="w-full text-xs text-left">
								<thead className="bg-gray-50 text-gray-500">
									<tr>
										<th className="px-2 py-1">日期</th>
										<th className="px-2 py-1">操作</th>
										<th className="px-2 py-1">代码</th>
										<th className="px-2 py-1">价格</th>
										<th className="px-2 py-1">Tag</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{parsedData.map((row, i) => (
										<tr key={i}>
											<td className="px-2 py-1">{row.date}</td>
											<td className="px-2 py-1">
												{row.type === 'INTEREST' ? '利息' : row.type === 'BUY' ? '买' : row.type === 'SELL' ? '卖' : '分红'}
											</td>
											<td className="px-2 py-1">{row.stockName}</td>
											<td className="px-2 py-1">{row.price}</td>
											<td className="px-2 py-1 text-blue-600">{row.groupTag}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
				<div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
					<button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">
						取消
					</button>
					<button
						onClick={handleConfirm}
						disabled={parsedData.length === 0 || !targetAccountId}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
					>
						确认导入 ({parsedData.length}条)
					</button>
				</div>
			</div>
		</div>
	);
};

export default ImportModal;
