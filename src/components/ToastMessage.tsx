import { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import type { ToastType } from '../types';

const ToastMessage = ({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) => {
	useEffect(() => {
		const timer = setTimeout(() => {
			onClose();
		}, 3000);
		return () => clearTimeout(timer);
	}, [message, onClose]);

	const styles = {
		success: 'bg-green-50 text-green-800 border-green-200',
		error: 'bg-red-50 text-red-800 border-red-200',
		info: 'bg-blue-50 text-blue-800 border-blue-200',
	};

	const icons = {
		success: <CheckCircle size={18} />,
		error: <AlertCircle size={18} />,
		info: <Info size={18} />,
	};

	return (
		<div
			className={`fixed top-6 right-6 z-[70] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border ${styles[type]} transition-all animate-in slide-in-from-top-5 fade-in duration-300`}
		>
			{icons[type]}
			<span className="text-sm font-medium">{message}</span>
		</div>
	);
};

export default ToastMessage;
