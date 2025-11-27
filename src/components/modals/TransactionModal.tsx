import React from 'react';
import { Tag } from 'lucide-react';
import type { Transaction, Account, TransactionType } from '../../types';

interface TransactionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (e: React.FormEvent) => void;
	form: Partial<Transaction>;
	setForm: React.Dispatch<React.SetStateAction<Partial<Transaction>>>;
	accounts: Account[];
}

const TransactionModal = ({ isOpen, onClose, onSubmit, form, setForm, accounts }: TransactionModalProps) => {
	if (!isOpen) return null;

	const getSafeValue = (val: number | undefined) => {
		if (val === undefined || Number.isNaN(val)) return '';
		return val;
	};

	const isInterest = form.type === 'INTEREST';
	const isDividend = form.type === 'DIVIDEND';
	const isNonTrade = isInterest || isDividend;
	const isEditMode = !!form.id;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
				<div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
					<h3 className="font-bold text-lg text-gray-800">{isEditMode ? '编辑交易 / 分组' : '记一笔'}</h3>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
						✕
					</button>
				</div>
				<form onSubmit={onSubmit} className="p-6 space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">交易类型</label>
							<select
								className="w-full border rounded-lg p-2 bg-white"
								value={form.type}
								onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as TransactionType }))}
							>
								<option value="BUY">买入 (Open/Buy)</option>
								<option value="SELL">卖出 (Close/Sell)</option>
								<option value="DIVIDEND">分红 (Dividend)</option>
								<option value="INTEREST">融资利息 (Interest)</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">所属账户</label>
							<select
								required
								className="w-full border rounded-lg p-2 bg-white"
								value={form.accountId || ''}
								onChange={(e) => setForm((prev) => ({ ...prev, accountId: e.target.value }))}
							>
								<option value="">请选择...</option>
								{accounts.map((acc) => (
									<option key={acc.id} value={acc.id}>
										{acc.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">股票代码</label>
							<input
								required
								type="text"
								className="w-full border rounded-lg p-2"
								placeholder="如: 600519"
								value={form.stockCode || ''}
								onChange={(e) => setForm((prev) => ({ ...prev, stockCode: e.target.value }))}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">股票名称</label>
							<input
								type="text"
								className="w-full border rounded-lg p-2"
								placeholder="如: 茅台"
								value={form.stockName || ''}
								onChange={(e) => setForm((prev) => ({ ...prev, stockName: e.target.value }))}
							/>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<div className={isNonTrade ? 'col-span-2' : ''}>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								{isInterest ? '利息金额' : isDividend ? '分红总额 (税前)' : '价格 (Price)'}
							</label>
							<input
								required
								type="number"
								step="0.01"
								className="w-full border rounded-lg p-2"
								value={getSafeValue(form.price)}
								onChange={(e) => setForm((prev) => ({ ...prev, price: parseFloat(e.target.value) }))}
							/>
						</div>
						{!isNonTrade && (
							<div className="col-span-1">
								<label className="block text-sm font-medium text-gray-700 mb-1">数量 (股)</label>
								<input
									required
									type="number"
									className="w-full border rounded-lg p-2"
									value={getSafeValue(form.shares)}
									onChange={(e) => setForm((prev) => ({ ...prev, shares: parseFloat(e.target.value) }))}
								/>
							</div>
						)}
						<div className={isNonTrade ? 'col-span-1' : ''}>
							<label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
							<input
								type="date"
								required
								className="w-full border rounded-lg p-2"
								value={form.date || ''}
								onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
							/>
						</div>
					</div>

					{!isInterest && (
						<div className="bg-gray-50 p-3 rounded-lg space-y-2">
							<p className="text-xs font-semibold text-gray-500 uppercase">{isDividend ? '税务扣除' : '交易费用'}</p>
							<div className="grid grid-cols-3 gap-2">
								{!isDividend && (
									<div>
										<label className="text-xs text-gray-600 block">佣金</label>
										<input
											type="number"
											className="w-full text-sm border rounded p-1"
											value={getSafeValue(form.commission)}
											onChange={(e) => setForm((prev) => ({ ...prev, commission: parseFloat(e.target.value) }))}
										/>
									</div>
								)}
								<div>
									<label className={`text-xs text-gray-600 block ${isDividend ? 'text-amber-600 font-bold' : ''}`}>
										{isDividend ? '红利税' : '印花税'}
									</label>
									<input
										type="number"
										className="w-full text-sm border rounded p-1"
										value={getSafeValue(form.tax)}
										onChange={(e) => setForm((prev) => ({ ...prev, tax: parseFloat(e.target.value) }))}
									/>
								</div>
								{!isDividend && (
									<div>
										<label className="text-xs text-gray-600 block">其他/过户</label>
										<input
											type="number"
											className="w-full text-sm border rounded p-1"
											value={getSafeValue(form.otherFees)}
											onChange={(e) => setForm((prev) => ({ ...prev, otherFees: parseFloat(e.target.value) }))}
										/>
									</div>
								)}
							</div>
						</div>
					)}

					{isInterest && <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs">提示：融资利息直接计入支出，无额外手续费。</div>}
					{isDividend && (
						<div className="bg-green-50 text-green-800 p-3 rounded-lg text-xs">提示：分红收入 = 分红总额 - 红利税。不需要录入佣金等。</div>
					)}

					<div className="pt-2">
						<label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
							<Tag size={14} className="mr-1" />
							关联标记 / 分组 (可选)
						</label>
						<input
							type="text"
							className="w-full border rounded-lg p-2"
							placeholder="如: T-1127 或 第一波 (相同标记会自动统计T收益)"
							value={form.groupTag || ''}
							onChange={(e) => setForm((prev) => ({ ...prev, groupTag: e.target.value }))}
						/>
					</div>

					<button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
						{isEditMode ? '保存修改' : '保存记录'}
					</button>
				</form>
			</div>
		</div>
	);
};

export default TransactionModal;
