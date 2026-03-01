import type { SectionOption } from '../../lib/finance/types';

interface SectionTocProps {
	sections: SectionOption[];
	mode: 'desktop' | 'mobile';
}

export default function SectionToc({ sections, mode }: SectionTocProps) {
	if (sections.length === 0) {
		return null;
	}

	if (mode === 'mobile') {
		return (
			<div className="finance-toc-mobile">
				<div className="field">
					<label className="label">Jump to section</label>
					<div className="control select is-fullwidth">
						<select
							defaultValue=""
							onChange={(event) => {
								const anchorId = event.target.value;
								if (!anchorId) {
									return;
								}

								window.location.hash = anchorId;
							}}
						>
							<option value="" disabled>
								Select section
							</option>
							{sections.map((section) => (
								<option key={section.id} value={section.anchorId}>
									{section.label}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>
		);
	}

	return (
		<aside className="finance-toc">
			<p className="menu-label">Table of Contents</p>
			<ul className="menu-list">
				{sections.map((section) => (
					<li key={section.id}>
						<a href={`#${section.anchorId}`} className="finance-toc-link">
							{section.label}
						</a>
					</li>
				))}
			</ul>
		</aside>
	);
}
