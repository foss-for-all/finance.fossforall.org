import type { MoneyAmount } from './types';

export interface AggregatedAmount {
	currency: string;
	total: number;
}

const numberFormatter = new Intl.NumberFormat('ko-KR', {
	maximumFractionDigits: 2
});

function quantityValue(amount: MoneyAmount): number | null {
	const quantity = amount.aquantity;
	if (!quantity) {
		return null;
	}

	if (typeof quantity.floatingPoint === 'number' && Number.isFinite(quantity.floatingPoint)) {
		return quantity.floatingPoint;
	}

	if (
		typeof quantity.decimalMantissa === 'number' &&
		typeof quantity.decimalPlaces === 'number' &&
		Number.isFinite(quantity.decimalMantissa) &&
		Number.isFinite(quantity.decimalPlaces)
	) {
		return quantity.decimalMantissa / 10 ** quantity.decimalPlaces;
	}

	return null;
}

export function formatAmount(amount: MoneyAmount): string {
	const value = quantityValue(amount);
	if (value === null) {
		return '-';
	}

	const currency = typeof amount.acommodity === 'string' ? amount.acommodity : '';
	const formattedValue = numberFormatter.format(value);

	if (!currency) {
		return formattedValue;
	}

	return `${formattedValue} ${currency}`;
}

export function aggregateAmountsByCurrency(amounts: MoneyAmount[]): AggregatedAmount[] {
	if (amounts.length === 0) {
		return [];
	}

	const grouped = new Map<string, AggregatedAmount>();

	for (const amount of amounts) {
		const value = quantityValue(amount);
		if (value === null) {
			continue;
		}

		const currency = typeof amount.acommodity === 'string' ? amount.acommodity : '';
		const key = currency || '__NO_CURRENCY__';
		const current = grouped.get(key);

		if (current) {
			current.total += value;
			continue;
		}

		grouped.set(key, {
			currency,
			total: value
		});
	}

	return Array.from(grouped.values());
}

export function formatAmountList(amounts: MoneyAmount[]): string[] {
	const aggregated = aggregateAmountsByCurrency(amounts);
	if (aggregated.length === 0) {
		return ['-'];
	}

	return aggregated.map((entry) => {
		const formattedValue = numberFormatter.format(entry.total);
		return entry.currency ? `${formattedValue} ${entry.currency}` : formattedValue;
	});
}
