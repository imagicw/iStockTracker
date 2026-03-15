import { useState } from 'react';
import { Database, FileJson, Download, Upload } from 'lucide-react';
import type { Account, Transaction, ToastType } from '../../types';

interface BackupRestoreModalProps {
	isOpen: boolean;
	onClose: () => void;
	accounts: Account[];
	transactions: Transaction[];
	showMessage: (msg: string, type: ToastType) => void;
	onRestore: (jsonContent: string) => Promise<void>;
}

const BackupRestoreModal = ({ isOpen, onClose, accounts, transactions, showMessage, onRestore }: BackupRestoreModalProps) => {
	const [restoreText, setRestoreText] = useState('');
	const [mode, setMode] = useState<'backup' | 'restore'>('backup');

	if (!isOpen) return null;

	const handleDownloadBackup = () => {
		const data = {
			version: '1.0',
			exportedAt: new Date().toISOString(),
			accounts,
			transactions,
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `stock_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		// 🛡️ Sentinel: Clean up memory to prevent sensitive data leak
		URL.revokeObjectURL(url);
		showMessage('备份文件已下载', 'success');
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
				<div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
					<h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
						<Database size={18} className="text-blue-600" /> 数据管理
					</h3>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
						✕
					</button>
				</div>
				<div className="p-6">
					<div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-lg">
						<button
							onClick={() => setMode('backup')}
							className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'backup' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
						>
							备份数据 (Backup)
						</button>
						<button
							onClick={() => setMode('restore')}
							className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'restore' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
						>
							恢复数据 (Restore)
						</button>
					</div>

					{mode === 'backup' ? (
						<div className="text-center py-4 space-y-4">
							<FileJson size={48} className="mx-auto text-blue-200" />
							<p className="text-sm text-gray-600">
								将所有账户和交易记录导出为 JSON 文件。
								<br />
								请定期备份以防数据丢失。
							</p>
							<div className="flex justify-center gap-4 text-xs text-gray-400">
								<span>账户: {accounts.length}</span>
								<span>交易: {transactions.length}</span>
							</div>
							<button
								onClick={handleDownloadBackup}
								className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
							>
								<Download size={18} /> 下载备份文件
							</button>
						</div>
					) : (
						<div className="space-y-4">
							<div className="bg-amber-50 border border-amber-100 p-3 rounded text-xs text-amber-800">
								<p className="font-bold mb-1">⚠️ 注意事项</p>
								系统会自动检查账户名称：
								<ul className="list-disc pl-4 mt-1 space-y-1">
									<li>同名账户：交易记录将合并到现有账户。</li>
									<li>新账户：将自动创建并导入数据。</li>
								</ul>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">粘贴备份内容 (JSON) 或 上传文件</label>
								<div className="mb-2">
									<input
										type="file"
										accept=".json"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) {
												// 🛡️ Sentinel: Enforce file size limit to prevent DoS via large JSON parsing
												if (file.size > 5 * 1024 * 1024) {
													showMessage('文件过大，请上传小于 5MB 的文件', 'error');
													return;
												}
												const reader = new FileReader();
												reader.onload = (e) => {
													const content = e.target?.result as string;
													setRestoreText(content);
												};
												reader.readAsText(file);
											}
										}}
										className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
									/>
								</div>
								<textarea
									className="w-full h-32 border rounded-lg p-2 font-mono text-xs"
									placeholder='{"version": "1.0", "accounts": [...], "transactions": [...] }'
									value={restoreText}
									onChange={(e) => setRestoreText(e.target.value)}
									maxLength={5000000}
								/>
							</div>
							<button
								onClick={() => onRestore(restoreText)}
								disabled={!restoreText.trim()}
								className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
							>
								<Upload size={18} /> 开始恢复
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default BackupRestoreModal;
