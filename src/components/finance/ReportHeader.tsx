import type { CatalogFile } from '../../lib/finance/types';

interface ReportHeaderProps {
	reportLabel: string;
	contextLabel: string;
	fileOptions: CatalogFile[];
	selectedFilePath: string;
	onSelectFile: (path: string) => void;
	openDrawer: () => void;
}

export default function ReportHeader({
	reportLabel,
	contextLabel,
	fileOptions,
	selectedFilePath,
	onSelectFile,
	openDrawer
}: ReportHeaderProps) {
	return (
		<header className="finance-header">
			<div className="finance-header-top">
				<button type="button" className="button is-light finance-menu-button" onClick={openDrawer}>
					Menu
				</button>
				<div className="finance-header-text">
					<p className="finance-context">{contextLabel}</p>
					<h1 className="title is-5 finance-title">{reportLabel}</h1>
				</div>
			</div>

			<div className="finance-header-controls">
				<div className="field">
					<label className="label">Source File</label>
					<div className="control select is-fullwidth">
						<select value={selectedFilePath} onChange={(event) => onSelectFile(event.target.value)}>
							{fileOptions.map((file) => (
								<option key={file.path} value={file.path}>
									{file.name}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>
		</header>
	);
}
