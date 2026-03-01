import type { ReportCatalog, ReportType } from './types';

const REPORT_ORDER: ReportType[] = ['bse', 'is', 'budget'];

const REPORT_LABELS: Record<ReportType, string> = {
	bse: 'Balance Sheet with Equity',
	is: 'Income Statement',
	budget: 'Budget Performance'
};

interface JsonModuleMap {
	[path: string]: unknown;
}

export function buildReportCatalog(dataMap: JsonModuleMap): ReportCatalog {
	const yearMap = new Map<string, Map<ReportType, { name: string; path: string }[]>>();

	for (const path of Object.keys(dataMap)) {
		const match = path.match(/\/data\/([^/]+)\/(bse|is|budget)\/([^/]+\.json)$/);
		if (!match) {
			continue;
		}

		const [, year, reportType, fileName] = match;
		const typedReportType = reportType as ReportType;

		if (!yearMap.has(year)) {
			yearMap.set(year, new Map<ReportType, { name: string; path: string }[]>());
		}

		const reportMap = yearMap.get(year);
		if (!reportMap) {
			continue;
		}

		if (!reportMap.has(typedReportType)) {
			reportMap.set(typedReportType, []);
		}

		reportMap.get(typedReportType)?.push({
			name: fileName,
			path
		});
	}

	const years = Array.from(yearMap.entries())
		.sort((a, b) => Number(b[0]) - Number(a[0]))
		.map(([year, reportMap]) => {
			const reports = REPORT_ORDER.map((type) => {
				const files = [...(reportMap.get(type) ?? [])].sort((a, b) => a.name.localeCompare(b.name));

				return {
					type,
					label: REPORT_LABELS[type],
					files
				};
			}).filter((report) => report.files.length > 0);

			return {
				year,
				reports
			};
		});

	return { years };
}
