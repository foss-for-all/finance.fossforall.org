import type { CatalogFile } from '../../lib/finance/types';

interface ReportHeaderProps {
	reportLabel: string;
	contextLabel: string;
	fileOptions: CatalogFile[];
	selectedFilePath: string;
	onSelectFile: (path: string) => void;
	onPrint: () => void;
	openDrawer: () => void;
}

export default function ReportHeader({
	reportLabel,
	contextLabel,
	fileOptions,
	selectedFilePath,
	onSelectFile,
	onPrint,
	openDrawer
}: ReportHeaderProps) {
	const selectedFileName = fileOptions.find((file) => file.path === selectedFilePath)?.name ?? selectedFilePath;
	const printTimestamp = new Intl.DateTimeFormat('ko-KR', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date());

	return (
		<header className="finance-header">
			<div className="finance-header-top">
				<div className="finance-header-meta">
					<button type="button" className="button is-light finance-menu-button" onClick={openDrawer}>
						Menu
					</button>
					<div className="finance-header-text">
						<p className="finance-context">{contextLabel}</p>
						<h1 className="title is-5 finance-title">{reportLabel}</h1>
					</div>
					<button type="button" className="button is-light finance-print-button" onClick={onPrint}>
						Print
					</button>
				</div>

				<div className="field finance-header-file-field">
					<label className="label" htmlFor="report-source-file">
						Source File
					</label>
					<div className="control select is-fullwidth finance-header-file-select">
						<select
							id="report-source-file"
							value={selectedFilePath}
							onChange={(event) => onSelectFile(event.target.value)}
						>
							{fileOptions.map((file) => (
								<option key={file.path} value={file.path}>
									{file.name}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>
			<p className="finance-print-meta">
				{contextLabel} - {reportLabel} - File {selectedFileName} - Printed {printTimestamp}
			</p>
		</header>
	);
}
