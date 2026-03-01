import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable
} from '@tanstack/react-table';
import { useMemo } from 'react';
import { formatAmountList } from '../../lib/finance/format';
import type { NormalizedCell, NormalizedRow } from '../../lib/finance/types';

interface ReportTableProps {
	columns: string[];
	rows: NormalizedRow[];
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

export default function ReportTable({ columns, rows }: ReportTableProps) {
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

		return [
			columnHelper.accessor('account', {
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
			}),
			...amountColumns
		];
	}, [columns]);

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
