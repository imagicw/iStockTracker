import React from 'react';

interface AccountCreationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (e: React.FormEvent) => void;
	name: string;
	setName: (val: string) => void;
	initialPnL: string;
	setInitialPnL: (val: string) => void;
	isEdit: boolean;
}

const AccountCreationModal: React.FC<AccountCreationModalProps> = ({ isOpen, onClose, onSubmit, name, setName, initialPnL, setInitialPnL, isEdit }) => {
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
				<div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
					<h3 className="font-bold text-lg text-gray-800">{isEdit ? '编辑证券账户' : '添加证券账户'}</h3>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
						✕
					</button>
				</div>
				<form onSubmit={onSubmit} className="p-6 space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">账户名称</label>
						<input
							autoFocus
							required
							maxLength={50}
							type="text"
							className="w-full border rounded-lg p-2"
							placeholder="例如：招商证券-主账户"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">期初已实现盈亏 (CNY)</label>
						<input
							type="number"
							className="w-full border rounded-lg p-2"
							placeholder="历史累计盈亏 (盈利填正，亏损填负)"
							value={initialPnL}
							onChange={(e) => setInitialPnL(e.target.value)}
						/>
						<p className="text-xs text-gray-500 mt-1">用于衔接之前的投资战绩，将直接计入“已实现盈亏”统计中，不影响持仓成本。</p>
					</div>
					<button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
						{isEdit ? '保存修改' : '确认添加'}
					</button>
				</form>
			</div>
		</div>
	);
};

export default AccountCreationModal;
