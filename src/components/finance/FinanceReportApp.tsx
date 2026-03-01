import { useEffect, useMemo, useState } from 'react';
import type { ReportCatalog, ReportType } from '../../lib/finance/types';
import { normalizeReport } from '../../lib/finance/normalize';
import { formatAmountList } from '../../lib/finance/format';
import ReportDrawer from './ReportDrawer';
import ReportHeader from './ReportHeader';
import ReportTable from './ReportTable';
import SectionToc from './SectionToc';

interface FinanceReportAppProps {
	catalog: ReportCatalog;
	dataMap: Record<string, unknown>;
}

function firstReportTypeForYear(catalog: ReportCatalog, year: string): ReportType | null {
	const yearEntry = catalog.years.find((entry) => entry.year === year);
	return yearEntry?.reports[0]?.type ?? null;
}

function firstFilePath(catalog: ReportCatalog, year: string, reportType: ReportType): string | null {
	const yearEntry = catalog.years.find((entry) => entry.year === year);
	const report = yearEntry?.reports.find((entry) => entry.type === reportType);
	return report?.files[0]?.path ?? null;
}

export default function FinanceReportApp({ catalog, dataMap }: FinanceReportAppProps) {
	const defaultYear = catalog.years[0]?.year ?? '';
	const defaultType = (firstReportTypeForYear(catalog, defaultYear) ?? 'budget') as ReportType;
	const defaultFilePath = firstFilePath(catalog, defaultYear, defaultType) ?? '';

	const [selectedYear, setSelectedYear] = useState(defaultYear);
	const [selectedReportType, setSelectedReportType] = useState<ReportType>(defaultType);
	const [selectedFilePath, setSelectedFilePath] = useState(defaultFilePath);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const selectedYearEntry = useMemo(
		() => catalog.years.find((entry) => entry.year === selectedYear),
		[catalog.years, selectedYear]
	);

	const selectedReport = useMemo(
		() => selectedYearEntry?.reports.find((entry) => entry.type === selectedReportType),
		[selectedYearEntry, selectedReportType]
	);

	useEffect(() => {
		if (!selectedYearEntry) {
			return;
		}

		const hasSelectedType = selectedYearEntry.reports.some((report) => report.type === selectedReportType);
		if (!hasSelectedType) {
			const fallback = selectedYearEntry.reports[0]?.type;
			if (fallback) {
				setSelectedReportType(fallback);
			}
		}
	}, [selectedYearEntry, selectedReportType]);

	useEffect(() => {
		if (!selectedReport) {
			return;
		}

		const hasSelectedFile = selectedReport.files.some((file) => file.path === selectedFilePath);
		if (!hasSelectedFile) {
			setSelectedFilePath(selectedReport.files[0]?.path ?? '');
		}
	}, [selectedReport, selectedFilePath]);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const params = new URLSearchParams(window.location.search);
		const year = params.get('year');
		const type = params.get('type') as ReportType | null;
		const file = params.get('file');

		if (year && catalog.years.some((entry) => entry.year === year)) {
			setSelectedYear(year);
		}

		if (year && type) {
			const hasType = catalog.years
				.find((entry) => entry.year === year)
				?.reports.some((entry) => entry.type === type);

			if (hasType) {
				setSelectedReportType(type);
			}
		}

		if (file && dataMap[file]) {
			setSelectedFilePath(file);
		}
	}, [catalog.years, dataMap]);

	const normalized = useMemo(() => {
		const reportData = dataMap[selectedFilePath];
		if (!reportData) {
			return null;
		}

		return normalizeReport({
			reportType: selectedReportType,
			reportData
		});
	}, [dataMap, selectedFilePath, selectedReportType]);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const params = new URLSearchParams();
		if (selectedYear) {
			params.set('year', selectedYear);
		}
		if (selectedReportType) {
			params.set('type', selectedReportType);
		}
		if (selectedFilePath) {
			params.set('file', selectedFilePath);
		}

		const query = params.toString();
		const nextUrl = query.length > 0 ? `${window.location.pathname}?${query}` : window.location.pathname;
		window.history.replaceState({}, '', nextUrl);
	}, [selectedYear, selectedReportType, selectedFilePath]);

	if (catalog.years.length === 0) {
		return <div className="notification is-danger is-light">No report data found in src/data.</div>;
	}

	if (!selectedReport || !normalized) {
		return <div className="notification is-warning is-light">Unable to load the selected report.</div>;
	}

	const contextLabel = `${selectedYear} / ${selectedReport.label}`;
	const totalsTitle = 'Net';
	const totalsColumns =
		normalized.sections[0]?.columns.length > 0
			? normalized.sections[0].columns
			: normalized.reportTotals.map((_, index) => `Amount ${index + 1}`);
	const totalsAnchorId = 'section-net';
	const subtotalLabel = 'Subtotal';
	const totalsRows =
		selectedReportType === 'budget'
			? totalsColumns.map((column, columnIndex) => ({
				account: column,
				values: formatAmountList((normalized.reportTotals[columnIndex] ?? { amounts: [] }).amounts)
			}))
			: [
				{
					account: 'Net Amount',
					values: formatAmountList((normalized.reportTotals[0] ?? { amounts: [] }).amounts)
				}
			];
	const netAmountLabel = 'Net Amount';
	const actualNetValues = totalsRows[0]?.values ?? ['-'];
	const budgetNetValues = totalsRows[1]?.values ?? ['-'];
	const defaultNetValues = totalsRows[0]?.values ?? ['-'];
	const tocSections = [
		...normalized.sections,
		{
			id: 'report-totals',
			label: totalsTitle,
			anchorId: totalsAnchorId
		}
	];

	return (
		<div className="finance-app">
			<div className={`finance-drawer ${isDrawerOpen ? 'is-open' : ''}`}>
				<ReportDrawer
					years={catalog.years}
					selectedYear={selectedYear}
					selectedReportType={selectedReportType}
					onSelectYear={(year) => {
						setSelectedYear(year);
						const nextType = firstReportTypeForYear(catalog, year);
						if (nextType) {
							setSelectedReportType(nextType);
							const nextFile = firstFilePath(catalog, year, nextType);
							if (nextFile) {
								setSelectedFilePath(nextFile);
							}
						}
					}}
					onSelectReportType={(type) => {
						setSelectedReportType(type);
						const nextFile = firstFilePath(catalog, selectedYear, type);
						if (nextFile) {
							setSelectedFilePath(nextFile);
						}
					}}
					onClose={() => setIsDrawerOpen(false)}
				/>
			</div>

			{isDrawerOpen ? (
				<button
					type="button"
					className="finance-drawer-backdrop"
					onClick={() => setIsDrawerOpen(false)}
					aria-label="Close menu"
				/>
			) : null}

			<main className="finance-main">
				<ReportHeader
					reportLabel={normalized.title}
					contextLabel={contextLabel}
					fileOptions={selectedReport.files}
					selectedFilePath={selectedFilePath}
					onSelectFile={setSelectedFilePath}
					openDrawer={() => setIsDrawerOpen(true)}
				/>
				<SectionToc sections={tocSections} mode="mobile" />

				<div className="finance-report-scroll">
					{normalized.sections.map((section) => (
						<section key={section.id} id={section.anchorId} className="finance-report-box">
							<div className="finance-report-section-title-wrap">
								<h2 className="title is-6 finance-report-section-title">{section.label}</h2>
							</div>
							<ReportTable columns={section.columns} rows={section.rows} reportType={selectedReportType} />
							<div className="table-container finance-subtotal-table-container">
								<table className="table is-fullwidth finance-net-table finance-subtotal-table">
									<tbody>
										<tr>
											<td>{subtotalLabel}</td>
											{section.columns.map((column, columnIndex) => {
												const values = formatAmountList(
													(section.sectionTotals[columnIndex] ?? { amounts: [] }).amounts
												);

												return (
													<td key={`${section.id}-${column}`} className="is-numeric">
														<div className="cell-values">
															{values.map((value, valueIndex) => (
																<div key={`${section.id}-${column}-${value}-${valueIndex}`}>{value}</div>
															))}
														</div>
													</td>
												);
											})}
										</tr>
									</tbody>
								</table>
							</div>
						</section>
					))}

					<section id={totalsAnchorId} className="finance-report-box finance-report-box-totals">
						<div className="finance-report-section-title-wrap">
							<h2 className="title is-6 finance-report-section-title">{totalsTitle}</h2>
						</div>
						<div className="table-container finance-net-table-container">
							<table className="table is-fullwidth finance-net-table">
								<tbody>
									<tr>
										<td>{netAmountLabel}</td>
										{selectedReportType === 'budget' ? (
											<>
												<td className="is-numeric">
													<div className="cell-values">
														{actualNetValues.map((value, valueIndex) => (
															<div key={`actual-${value}-${valueIndex}`}>{value}</div>
														))}
													</div>
												</td>
												<td className="is-numeric">
													<div className="cell-values">
														{budgetNetValues.map((value, valueIndex) => (
															<div key={`budget-${value}-${valueIndex}`}>{value}</div>
														))}
													</div>
												</td>
											</>
										) : (
											<td className="is-numeric">
												<div className="cell-values">
													{defaultNetValues.map((value, valueIndex) => (
														<div key={`net-${value}-${valueIndex}`}>{value}</div>
													))}
												</div>
											</td>
										)}
									</tr>
								</tbody>
							</table>
						</div>
					</section>
				</div>
			</main>

			<SectionToc sections={tocSections} mode="desktop" />
		</div>
	);
}
