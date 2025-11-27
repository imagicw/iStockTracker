import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortDirection, StockPosition } from '../types';

const SortableHeader = ({
	label,
	sortKey,
	currentSort,
	onSort,
	align = 'right',
	className = '',
}: {
	label: string;
	sortKey: keyof StockPosition;
	currentSort: { key: string; direction: SortDirection };
	onSort: (key: keyof StockPosition) => void;
	align?: 'left' | 'right' | 'center';
	className?: string;
}) => {
	const isSorted = currentSort.key === sortKey;
	const Icon = isSorted ? (currentSort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

	return (
		<th
			className={`px-6 py-3 cursor-pointer hover:bg-gray-200 transition select-none group ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${className}`}
			onClick={() => onSort(sortKey)}
			title="点击排序"
		>
			<div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
				<span>{label}</span>
				<Icon size={14} className={`text-gray-400 group-hover:text-gray-600 ${isSorted ? 'text-blue-600' : 'opacity-0 group-hover:opacity-50'}`} />
			</div>
		</th>
	);
};

export default SortableHeader;
