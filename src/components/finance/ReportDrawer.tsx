import { useEffect, useMemo, useState } from 'react';
import type { CatalogYear, ReportType } from '../../lib/finance/types';

interface ReportDrawerProps {
	years: CatalogYear[];
	selectedYear: string;
	selectedReportType: ReportType;
	onSelectYear: (year: string) => void;
	onSelectReportType: (type: ReportType) => void;
	onClose: () => void;
}

export default function ReportDrawer({
	years,
	selectedYear,
	selectedReportType,
	onSelectYear,
	onSelectReportType,
	onClose
}: ReportDrawerProps) {
	const defaultExpanded = useMemo(() => new Set([selectedYear]), [selectedYear]);
	const [expandedYears, setExpandedYears] = useState<Set<string>>(defaultExpanded);

	useEffect(() => {
		setExpandedYears((previous) => {
			if (previous.has(selectedYear)) {
				return previous;
			}

			const next = new Set(previous);
			next.add(selectedYear);
			return next;
		});
	}, [selectedYear]);

	function toggleYear(year: string): void {
		setExpandedYears((previous) => {
			const next = new Set(previous);
			if (next.has(year)) {
				next.delete(year);
			} else {
				next.add(year);
			}
			return next;
		});
	}

	return (
		<aside className="menu finance-drawer-content">
			<p className="menu-label">Fiscal Years</p>
			<ul className="menu-list">
				{years.map((year) => {
					const isExpanded = expandedYears.has(year.year);
					const isActiveYear = year.year === selectedYear;

					return (
						<li key={year.year}>
							<button
								type="button"
								className={`drawer-year ${isActiveYear ? 'is-active' : ''}`}
								onClick={() => {
									onSelectYear(year.year);
									toggleYear(year.year);
								}}
							>
								<span>{year.year}</span>
								<span className="drawer-year-indicator">{isExpanded ? '-' : '+'}</span>
							</button>
							{isExpanded ? (
								<ul>
									{year.reports.map((report) => (
										<li key={report.type}>
											<a
												href="#"
												className={report.type === selectedReportType && isActiveYear ? 'is-active' : ''}
												onClick={(event) => {
													event.preventDefault();
													onSelectYear(year.year);
													onSelectReportType(report.type);
													onClose();
												}}
											>
												{report.label}
											</a>
										</li>
									))}
								</ul>
							) : null}
						</li>
					);
				})}
			</ul>
		</aside>
	);
}
