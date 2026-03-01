import type {
	MoneyAmount,
	NormalizedReport,
	NormalizedRow,
	NormalizedSection,
	ReportType
} from './types';

type UnknownRecord = Record<string, unknown>;

interface NormalizeInput {
	reportType: ReportType;
	reportData: unknown;
}

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null;
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function isMoneyAmount(value: unknown): value is MoneyAmount {
	return isRecord(value) && ('acommodity' in value || 'aquantity' in value);
}

function collectAmounts(value: unknown): MoneyAmount[] {
	if (value == null) {
		return [];
	}

	if (isMoneyAmount(value)) {
		return [value];
	}

	if (!Array.isArray(value)) {
		return [];
	}

	const amounts: MoneyAmount[] = [];
	for (const item of value) {
		amounts.push(...collectAmounts(item));
	}

	return amounts;
}

function accountInfo(accountPath: string): { account: string; depth: number } {
	const parts = accountPath
		.split(':')
		.map((segment) => segment.trim())
		.filter(Boolean);

	if (parts.length === 0) {
		return { account: accountPath, depth: 0 };
	}

	return {
		account: parts[parts.length - 1],
		depth: parts.length - 1
	};
}

function formatDateRange(dates: unknown): string {
	const range = asArray(dates)[0];
	const values = asArray(range)
		.map((item) => (isRecord(item) ? item.contents : null))
		.filter((item): item is string => typeof item === 'string');

	if (values.length === 2) {
		return `${values[0]} - ${values[1]}`;
	}

	if (values.length === 1) {
		return values[0];
	}

	return 'Amount';
}

function slugify(value: string): string {
	const normalized = value
		.toLowerCase()
		.trim()
		.replace(/[^\p{L}\p{N}\s-]/gu, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');

	return normalized.length > 0 ? normalized : 'section';
}

function normalizeCbrReport(reportData: unknown): NormalizedReport {
	const report = isRecord(reportData) ? reportData : {};
	const subreports = asArray(report.cbrSubreports);
	const cbrTotals = isRecord(report.cbrTotals) ? report.cbrTotals : {};
	const sections: NormalizedSection[] = subreports.map((entry, sectionIndex) => {
		const tuple = asArray(entry);
		const label = typeof tuple[0] === 'string' ? tuple[0] : `Section ${sectionIndex + 1}`;
		const subreportData = isRecord(tuple[1]) ? tuple[1] : {};
		const subreportTotals = isRecord(subreportData.prTotals) ? subreportData.prTotals : {};
		const rows = asArray(subreportData.prRows);

		const normalizedRows: NormalizedRow[] = rows.map((row, rowIndex) => {
			const rowRecord = isRecord(row) ? row : {};
			const fullName =
				typeof rowRecord.prrName === 'string' ? rowRecord.prrName : `Row ${sectionIndex + 1}-${rowIndex + 1}`;
			const { account, depth } = accountInfo(fullName);
			const amounts = collectAmounts(rowRecord.prrTotal);

			return {
				id: `${sectionIndex}-${rowIndex}`,
				fullName,
				account,
				depth,
				cells: [{ amounts }]
			};
		});

		return {
			id: String(sectionIndex),
			label,
			anchorId: `section-${slugify(label)}-${sectionIndex}`,
			columns: [formatDateRange(subreportData.prDates)],
			rows: normalizedRows,
			sectionTotals: [{ amounts: collectAmounts(subreportTotals.prrTotal) }]
		};
	});

	const title = typeof report.cbrTitle === 'string' ? report.cbrTitle : 'Financial Report';

	return {
		title,
		sections,
		reportTotals: [{ amounts: collectAmounts(cbrTotals.prrTotal) }]
	};
}

function normalizeBudgetReport(reportData: unknown): NormalizedReport {
	const report = isRecord(reportData) ? reportData : {};
	const rows = asArray(report.prRows);
	const totals = isRecord(report.prTotals) ? asArray(report.prTotals.prrTotal) : [];

	const normalizedRows: NormalizedRow[] = rows.map((row, rowIndex) => {
		const rowRecord = isRecord(row) ? row : {};
		const fullName = typeof rowRecord.prrName === 'string' ? rowRecord.prrName : `Row ${rowIndex + 1}`;
		const { account, depth } = accountInfo(fullName);
		const totals = asArray(rowRecord.prrTotal);

		const actualAmounts = collectAmounts(totals[0]);
		const budgetAmounts = collectAmounts(totals[1]);

		return {
			id: `budget-${rowIndex}`,
			fullName,
			account,
			depth,
			cells: [{ amounts: actualAmounts }, { amounts: budgetAmounts }]
		};
	});

	return {
		title: 'Budget Performance',
		sections: [
			{
				id: 'budget-0',
				label: 'Budget Performance',
				anchorId: 'section-budget-performance',
				columns: ['Actual', 'Budget'],
				rows: normalizedRows,
				sectionTotals: [{ amounts: collectAmounts(totals[0]) }, { amounts: collectAmounts(totals[1]) }]
			}
		],
		reportTotals: [{ amounts: collectAmounts(totals[0]) }, { amounts: collectAmounts(totals[1]) }]
	};
}

export function normalizeReport({ reportType, reportData }: NormalizeInput): NormalizedReport {
	if (reportType === 'budget') {
		return normalizeBudgetReport(reportData);
	}

	return normalizeCbrReport(reportData);
}
