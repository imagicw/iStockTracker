import { AlertTriangle } from 'lucide-react';

interface RevokeConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

const RevokeConfirmModal = ({ isOpen, onClose, onConfirm }: RevokeConfirmModalProps) => {
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6">
				<div className="flex items-center space-x-3 text-amber-600 mb-4">
					<AlertTriangle size={24} />
					<h3 className="font-bold text-lg">撤回交易确认</h3>
				</div>
				<p className="text-gray-600 text-sm mb-6">
					确定要撤回这条交易记录吗？
					<br />
					撤回后它将<span className="font-bold text-gray-800">不再参与收益计算</span>，但会保留在列表中作为痕迹。
				</p>
				<div className="flex space-x-3">
					<button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
						取消
					</button>
					<button onClick={onConfirm} className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium">
						确认撤回
					</button>
				</div>
			</div>
		</div>
	);
};

export default RevokeConfirmModal;
