import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable
} from '@tanstack/react-table';
import { useMemo } from 'react';
import { aggregateAmountsByCurrency, formatAmountList } from '../../lib/finance/format';
import type { NormalizedCell, NormalizedRow, ReportType } from '../../lib/finance/types';

interface ReportTableProps {
	columns: string[];
	rows: NormalizedRow[];
	reportType: ReportType;
}

const columnHelper = createColumnHelper<NormalizedRow>();

function CellValue({ cell }: { cell: NormalizedCell }) {
	const values = formatAmountList(cell.amounts);

	return (
		<div className="cell-values">
			{values.map((value, index) => (
				<div key={`${value}-${index}`}>{value}</div>
			))}
		</div>
	);
}

const percentFormatter = new Intl.NumberFormat('ko-KR', {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});

function budgetPerformanceFromRow(row: NormalizedRow): { percentageText: string; progressValue: number | null } {
	const actualTotals = aggregateAmountsByCurrency(row.cells[0]?.amounts ?? []);
	const budgetTotals = aggregateAmountsByCurrency(row.cells[1]?.amounts ?? []);

	if (actualTotals.length === 0 || budgetTotals.length === 0) {
		return { percentageText: '-', progressValue: null };
	}

	const budgetByCurrency = new Map(budgetTotals.map((entry) => [entry.currency, entry.total]));

	const comparableActual =
		actualTotals.find((entry) => entry.currency === 'KRW' && budgetByCurrency.has('KRW')) ??
		actualTotals.find((entry) => budgetByCurrency.has(entry.currency));

	if (!comparableActual) {
		return { percentageText: '-', progressValue: null };
	}

	const budgetValue = budgetByCurrency.get(comparableActual.currency);
	if (budgetValue == null || budgetValue === 0) {
		return { percentageText: '-', progressValue: null };
	}

	const percentage = (comparableActual.total / budgetValue) * 100;
	if (!Number.isFinite(percentage)) {
		return { percentageText: '-', progressValue: null };
	}

	const progressValue = Math.max(0, Math.min(100, percentage));
	return {
		percentageText: `${percentFormatter.format(percentage)}%`,
		progressValue
	};
}

export default function ReportTable({ columns, rows, reportType }: ReportTableProps) {
	const tableColumns = useMemo(() => {
		const amountColumns = columns.map((columnName, index) =>
			columnHelper.display({
				id: `amount-${index}`,
				header: columnName,
				cell: ({ row }) => <CellValue cell={row.original.cells[index] ?? { amounts: [] }} />,
				meta: {
					isNumeric: true
				}
			})
		);

		const performanceColumn =
			reportType === 'budget'
				? [
						columnHelper.display({
							id: 'performance-rate',
							header: 'Performance',
							cell: ({ row }) => {
								const performance = budgetPerformanceFromRow(row.original);

								if (performance.progressValue === null) {
									return <span className="finance-performance-empty">-</span>;
								}

								return (
									<div className="finance-performance-cell">
										<progress
											className="progress is-info is-small finance-performance-bar"
											value={performance.progressValue}
											max={100}
										>
											{performance.percentageText}
										</progress>
										<span className="finance-performance-text">{performance.percentageText}</span>
									</div>
								);
							},
							meta: {
								isNumeric: true
							}
						})
					]
				: [];

		const accountColumn = columnHelper.accessor('account', {
			header: 'Account',
			cell: ({ row, getValue }) => (
				<div
					className="account-cell"
					style={{ paddingLeft: `${row.original.depth * 1.05}rem` }}
					title={row.original.fullName}
				>
					{getValue()}
				</div>
			)
		});

		if (reportType === 'budget') {
			return [accountColumn, ...performanceColumn, ...amountColumns];
		}

		return [accountColumn, ...amountColumns, ...performanceColumn];
	}, [columns, reportType]);

	const table = useReactTable({
		data: rows,
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel()
	});

	if (rows.length === 0) {
		return <div className="notification is-warning is-light">No rows available in this report.</div>;
	}

	return (
		<div className="table-container finance-table-container">
			<table className="table is-fullwidth is-striped is-hoverable finance-table">
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								const isNumeric = Boolean(header.column.columnDef.meta && (header.column.columnDef.meta as { isNumeric?: boolean }).isNumeric);
								return (
									<th key={header.id} className={isNumeric ? 'is-numeric' : ''}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</th>
								);
							})}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => (
						<tr key={row.id}>
							{row.getVisibleCells().map((cell) => {
								const isNumeric = Boolean(cell.column.columnDef.meta && (cell.column.columnDef.meta as { isNumeric?: boolean }).isNumeric);
								return (
									<td key={cell.id} className={isNumeric ? 'is-numeric' : ''}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
