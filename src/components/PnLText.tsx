import { formatCurrency } from '../utils';

const PnLText = ({ value, prefix = '' }: { value: number; prefix?: string }) => {
	const isPositive = value > 0;
	const isZero = value === 0;
	const colorClass = isPositive ? 'text-red-500' : isZero ? 'text-gray-500' : 'text-green-500';
	return (
		<span className={`font-medium ${colorClass}`}>
			{prefix}
			{value > 0 ? '+' : ''}
			{formatCurrency(value)}
		</span>
	);
};

export default PnLText;
