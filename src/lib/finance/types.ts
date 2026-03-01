export type ReportType = 'bse' | 'is' | 'budget';

export interface CatalogFile {
	name: string;
	path: string;
}

export interface CatalogReport {
	type: ReportType;
	label: string;
	files: CatalogFile[];
}

export interface CatalogYear {
	year: string;
	reports: CatalogReport[];
}

export interface ReportCatalog {
	years: CatalogYear[];
}

export interface MoneyAmount {
	acommodity?: string;
	aquantity?: {
		decimalMantissa?: number;
		decimalPlaces?: number;
		floatingPoint?: number;
	};
}

export interface NormalizedCell {
	amounts: MoneyAmount[];
}

export interface NormalizedRow {
	id: string;
	fullName: string;
	account: string;
	depth: number;
	cells: NormalizedCell[];
}

export interface SectionOption {
	id: string;
	label: string;
	anchorId: string;
}

export interface NormalizedSection extends SectionOption {
	columns: string[];
	rows: NormalizedRow[];
	sectionTotals: NormalizedCell[];
}

export interface NormalizedReport {
	title: string;
	sections: NormalizedSection[];
	reportTotals: NormalizedCell[];
}
