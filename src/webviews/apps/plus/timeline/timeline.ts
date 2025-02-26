import './timeline.scss';
import { html, LitElement, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { setAbbreviatedShaLength, shortenRevision } from '../../../../git/utils/revision.utils';
import { isSubscriptionPaid } from '../../../../plus/gk/utils/subscription.utils';
import type { Deferrable } from '../../../../system/function/debounce';
import { debounce } from '../../../../system/function/debounce';
import type { State } from '../../../plus/timeline/protocol';
import { SelectDataPointCommand, UpdatePeriodCommand } from '../../../plus/timeline/protocol';
import { GlApp } from '../../shared/app';
import type { HostIpc } from '../../shared/ipc';
import type { CommitEventDetail, GlTimelineChart } from './components/chart';
import { TimelineStateProvider } from './stateProvider';
import { timelineBaseStyles, timelineStyles } from './timeline.css';
import './components/chart';
import '../../shared/components/feature-gate';
import '../../shared/components/feature-badge';
import '../../shared/components/code-icon';
import '../../shared/components/progress';

@customElement('gl-timeline-app')
export class GlTimelineApp extends GlApp<State> {
	static override shadowRootOptions: ShadowRootInit = {
		...LitElement.shadowRootOptions,
		delegatesFocus: true,
	};

	static override styles = [timelineBaseStyles, timelineStyles];

	@query('#chart')
	private _chart?: GlTimelineChart;

	protected override createStateProvider(state: State, ipc: HostIpc): TimelineStateProvider {
		return new TimelineStateProvider(this, state, ipc);
	}
	protected override onPersistState(state: State): void {
		this._ipc.setPersistedState({ period: state.period, uri: state.uri });
	}

	override connectedCallback(): void {
		super.connectedCallback();

		setAbbreviatedShaLength(this.state.abbreviatedShaLength);
	}

	get allowed(): boolean | 'mixed' {
		return this.state.access?.allowed ?? false;
	}

	get header(): { title: string; description: string } {
		let title = this.state.item.path;
		let description;

		if (title != null) {
			const index = title.lastIndexOf('/');
			if (index >= 0) {
				const name = title.substring(index + 1);
				description = title.substring(0, index);
				title = name;
			}
		}

		return { title: title ?? '', description: description ?? '' };
	}

	get itemType() {
		return this.state.item.type;
	}

	@state()
	private _loading = false;

	get period(): State['period'] {
		return this.state.period;
	}

	get subscription(): State['access']['subscription']['current'] | undefined {
		return this.state.access?.subscription?.current;
	}

	get sha(): string | undefined {
		return shortenRevision(this.state.item.sha);
	}

	get uri(): string | undefined {
		return this.state.uri;
	}

	override render(): unknown {
		return html`
			${this.allowed
				? html`<gl-feature-gate
						.source=${{ source: 'timeline' as const, detail: 'gate' }}
						.state=${this.subscription?.state}
				  ></gl-feature-gate>`
				: nothing}
			<div class="container">
				<progress-indicator ?active=${this._loading}></progress-indicator>
				<header class="header" ?hidden=${!this.uri}>
					<span class="details">
						<span class="details__title"
							><code-icon icon="${this.itemType === 'folder' ? 'folder' : 'file'}"></code-icon
							>&nbsp;&nbsp;${this.header.title}</span
						>
						<span class="details__description">${this.header.description}</span>
						<span class="details__sha">
							${this.sha
								? html`<code-icon icon="git-commit" size="16"></code-icon
										><span class="sha">${this.sha}</span>`
								: nothing}
						</span>
					</span>
					<span class="toolbox">
						<span class="select-container">
							<label for="periods">Timeframe</label>
							<select
								class="period"
								name="periods"
								position="below"
								.value=${this.period}
								@change=${this.onPeriodChanged}
							>
								<option value="7|D" ?selected=${this.period === '7|D'}>1 week</option>
								<option value="1|M" ?selected=${this.period === '1|M'}>1 month</option>
								<option value="3|M" ?selected=${this.period === '3|M'}>3 months</option>
								<option value="6|M" ?selected=${this.period === '6|M'}>6 months</option>
								<option value="9|M" ?selected=${this.period === '9|M'}>9 months</option>
								<option value="1|Y" ?selected=${this.period === '1|Y'}>1 year</option>
								<option value="2|Y" ?selected=${this.period === '2|Y'}>2 years</option>
								<option value="4|Y" ?selected=${this.period === '4|Y'}>4 years</option>
								<option value="all" ?selected=${this.period === 'all'}>Full history</option>
							</select>
						</span>
						${this.placement === 'view'
							? html`<gl-button
									appearance="toolbar"
									href="command:gitlens.views.timeline.openInTab"
									tooltip="Open in Editor"
									aria-label="Open in Editor"
							  >
									<code-icon icon="link-external"></code-icon>
							  </gl-button>`
							: nothing}
						${this.subscription == null || !isSubscriptionPaid(this.subscription)
							? html`<gl-feature-badge
									placement="bottom"
									.source=${{ source: 'timeline' as const, detail: 'badge' }}
									.subscription=${this.subscription}
							  ></gl-feature-badge>`
							: nothing}
					</span>
				</header>

				<main class="timeline">${this.renderChart()}</main>
			</div>
		`;
	}

	private renderChart() {
		if (!this.uri || !this.state.dataset) {
			return html`<div class="timeline__empty">
				<p>There are no editors open that can provide file history information.</p>
			</div>`;
		}

		return html`<gl-timeline-chart
			id="chart"
			placement="${this.placement}"
			dateFormat="${this.state.dateFormat}"
			shortDateFormat="${this.state.shortDateFormat}"
			.dataPromise=${this.state.dataset}
			@gl-commit-select=${this.onChartCommitSelected}
			@gl-loading=${(e: CustomEvent<Promise<void>>) => {
				this._loading = true;
				void e.detail.finally(() => (this._loading = false));
			}}
		>
		</gl-timeline-chart>`;
	}

	private onChartCommitSelected(e: CustomEvent<CommitEventDetail>) {
		if (e.detail.id == null) return;

		this.fireSelectDataPoint(e.detail);
	}

	private onPeriodChanged(e: Event) {
		const element = e.target as HTMLSelectElement;
		const value = element.options[element.selectedIndex].value;
		assertPeriod(value);

		// this.log(`onPeriodChanged(): name=${element.name}, value=${value}`);

		this._ipc.sendCommand(UpdatePeriodCommand, { period: value });
	}

	private _fireSelectDataPointDebounced: Deferrable<(e: CommitEventDetail) => void> | undefined;
	private fireSelectDataPoint(e: CommitEventDetail) {
		this._fireSelectDataPointDebounced ??= debounce(
			(e: CommitEventDetail) => this._ipc.sendCommand(SelectDataPointCommand, e),
			150,
			{ maxWait: 250 },
		);
		this._fireSelectDataPointDebounced(e);
	}
}

function assertPeriod(period: string): asserts period is State['period'] {
	if (period === 'all') return;

	const [value, unit] = period.split('|');
	if (isNaN(Number(value)) || (unit !== 'D' && unit !== 'M' && unit !== 'Y')) {
		throw new Error(`Invalid period: ${period}`);
	}
}
