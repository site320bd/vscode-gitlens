import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
// import { map } from 'lit/directives/map.js';
import './code-icon';
import './overlays/tooltip';
import { classMap } from 'lit/directives/class-map.js';

export type CollapsibleState = 'none' | 'collapsed' | 'expanded';

@customElement('gl-breadcrumbs')
export class GlBreadcrumbs extends LitElement {
	static override styles = css`
		* {
			box-sizing: border-box;
		}

		:host {
			display: flex;
			flex-direction: row;
			flex-wrap: nowrap;
			align-items: center;
			gap: 0.4rem;
			overflow: hidden;
			font-size: var(--vscode-font-size);
			color: var(--vscode-foreground);
		}

		.chevron {
			flex-shrink: 0;
			opacity: 0.6;
		}

		/* Applied to slotted items */
		::slotted(gl-breadcrumb-item:not(:first-child))::before {
			font-family: 'codicon';
			content: '\\eab6'; /* codicon for chevron-right */
			font-size: 12px;
			display: flex;
			flex-shrink: 0;
			opacity: 0.6;
		}
	`;

	@state()
	private _collapsedItems = new Set<number>(); // Items to collapse

	@state()
	private _hoveredItem: number | null = null;

	override updated(changedProperties: Map<string, any>) {
		// If items change, reset collapsed state based on collapsibleState
		if (changedProperties.has('items')) {
			this._initializeCollapsedState();
		}
	}

	override connectedCallback() {
		super.connectedCallback();
		this._initializeCollapsedState();
	}

	private _initializeCollapsedState() {
		// Initialize collapsed items based on the collapsibleState
		const newCollapsedItems = new Set<number>();

		// this.items.forEach((item, index) => {
		// 	if (item.collapsibleState === 'collapsed') {
		// 		newCollapsedItems.add(index);
		// 	}
		// });
		this._collapsedItems = newCollapsedItems;
	}

	private isCollapsed(index: number): boolean {
		if (this._hoveredItem === index) return false;
		return this._collapsedItems.has(index);
	}

	private toggleCollapse(index: number, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		const newCollapsedItems = new Set(this._collapsedItems);
		if (newCollapsedItems.has(index)) {
			newCollapsedItems.delete(index);
		} else {
			newCollapsedItems.add(index);
		}
		this._collapsedItems = newCollapsedItems;
	}

	private handleMouseEnter(index: number) {
		this._hoveredItem = index;
	}

	private handleMouseLeave() {
		this._hoveredItem = null;
	}

	override render() {
		return html`<div class="breadcrumbs"><slot></slot></div>`;
		// // Check if using the slot-based API (preferred) or the items array
		// const hasSlots = this.querySelector('gl-breadcrumb-item') !== null;

		// if (hasSlots) {
		// }

		// // Fallback to the items array if no slots
		// if (!hasSlots) return nothing;

		// return html`
		// 	${this.items.map((item, index) => {
		// 		// Check for collapsible state
		// 		const isCollapsible = item.collapsibleState === 'collapsed' || item.collapsibleState === 'expanded';
		// 		// const hasChildren = Boolean(item.children?.length);
		// 		const isCollapsed = isCollapsible && this.isCollapsed(index) && this._hoveredItem !== index;

		// 		return html`
		// 			${index > 0
		// 				? html`<code-icon class="chevron" icon="chevron-right" size="12"></code-icon>`
		// 				: nothing}
		// 			<gl-breadcrumb-item
		// 				type="${item.type}"
		// 				tooltip="${item.tooltip}"
		// 				icon="${item.icon || ''}"
		// 				collapsibleState="${item.collapsibleState || 'none'}"
		// 				?collapsed="${isCollapsed}"
		// 				@mouseenter=${isCollapsible ? () => this.handleMouseEnter(index) : undefined}
		// 				@mouseleave=${isCollapsible ? () => this.handleMouseLeave() : undefined}
		// 				.children=${item.children || []}
		// 			>
		// 				${item.label}
		// 			</gl-breadcrumb-item>
		// 		`;
		// 	})}
		// `;
	}
}

@customElement('gl-breadcrumb-item')
export class GlBreadcrumbItem extends LitElement {
	static override styles = css`
		* {
			box-sizing: border-box;
		}

		:host {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 0.4rem;
			white-space: nowrap;
			overflow: hidden;
		}

		.breadcrumb-item {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 0.4rem;
			white-space: nowrap;
			overflow: hidden;
		}

		.breadcrumb-content {
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;
		}

		.breadcrumb-icon {
			flex-shrink: 0;
			z-index: 2;
		}

		.collapsible .breadcrumb-icon {
			cursor: pointer;
		}

		.breadcrumb-label {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
		}

		.breadcrumb-children {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 0.4rem;
			overflow: hidden;
			transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
		}

		.breadcrumb-item.collapsed .breadcrumb-label,
		.breadcrumb-item.collapsed .breadcrumb-children {
			width: 0;
			opacity: 0;
			margin-left: -0.4rem;
		}

		/* For smooth hover animations */
		.breadcrumb-item.collapsed:hover .breadcrumb-label,
		.breadcrumb-item.collapsed:hover .breadcrumb-children {
			width: max-content;
			opacity: 1;
			margin-left: 0;
		}
	`;

	@property({ type: String })
	type: 'repo' | 'ref' | 'folder' | 'file' = 'file';

	@property()
	tooltip: string = '';

	@property()
	icon?: string;

	@property({ type: String })
	collapsibleState: CollapsibleState = 'none';

	@property({ type: Boolean, reflect: true })
	collapsed: boolean = false;

	@property({ type: Number })
	private _hoveredItem: number | null = null;

	override connectedCallback(): void {
		super.connectedCallback();

		// Initialize collapsed state based on the collapsibleState
		this.collapsed = this.collapsibleState === 'collapsed';
	}

	private toggleCollapse(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.collapsed = !this.collapsed;
	}

	private handleMouseEnter() {
		this._hoveredItem = 1; // Any non-null value
	}

	private handleMouseLeave() {
		this._hoveredItem = null;
	}

	override render() {
		const isCollapsible = this.collapsibleState === 'collapsed' || this.collapsibleState === 'expanded';
		const isCollapsed = isCollapsible && this.collapsed && this._hoveredItem === null;

		return html`
			<div
				class=${classMap({
					'breadcrumb-item': true,
					collapsed: isCollapsed,
					collapsible: isCollapsible,
				})}
				@mouseenter=${isCollapsible ? () => this.handleMouseEnter() : undefined}
				@mouseleave=${isCollapsible ? () => this.handleMouseLeave() : undefined}
			>
				<gl-tooltip content="${this.tooltip}" placement="bottom">
					<span class="breadcrumb-content">
						${this.icon
							? html`<code-icon
									class="breadcrumb-icon"
									icon="${this.icon}"
									@click=${isCollapsible ? (e: MouseEvent) => this.toggleCollapse(e) : undefined}
							  ></code-icon>`
							: nothing}
						<span class="breadcrumb-label"><slot></slot></span>
					</span>
				</gl-tooltip>
				<div class="breadcrumb-children">
					<slot name="children"></slot>
				</div>
			</div>
		`;

		// ${hasChildren
		// 	? html`<div class="breadcrumb-children">
		// 			${map(
		// 				this.subitems,
		// 				child =>
		// 					html`<code-icon class="chevron" icon="chevron-right" size="12"></code-icon>
		// 						<gl-tooltip content="${child.tooltip}" placement="bottom">
		// 							<span class="breadcrumb-label">${child.label}</span>
		// 						</gl-tooltip>`,
		// 			)}
		// 	  </div>`
		// 	: nothing}
	}
}

@customElement('gl-breadcrumb-item-child')
export class GlBreadcrumbItemChild extends LitElement {
	static override styles = css`
		* {
			box-sizing: border-box;
		}

		:host {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 0.4rem;
			white-space: nowrap;
			overflow: hidden;
		}

		.breadcrumb-item {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 0.4rem;
			white-space: nowrap;
			overflow: hidden;
		}

		.breadcrumb-content {
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;
		}

		.breadcrumb-icon {
			flex-shrink: 0;
			z-index: 2;
		}

		.collapsible .breadcrumb-icon {
			cursor: pointer;
		}

		.breadcrumb-label {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
		}

		.breadcrumb-children {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 0.4rem;
			overflow: hidden;
			transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
		}

		.breadcrumb-item.collapsed .breadcrumb-label,
		.breadcrumb-item.collapsed .breadcrumb-children {
			width: 0;
			opacity: 0;
			margin-left: -0.4rem;
		}

		/* For smooth hover animations */
		.breadcrumb-item.collapsed:hover .breadcrumb-label,
		.breadcrumb-item.collapsed:hover .breadcrumb-children {
			width: max-content;
			opacity: 1;
			margin-left: 0;
		}
	`;

	@property()
	tooltip: string = '';

	override render() {
		// const isCollapsible = this.collapsibleState === 'collapsed' || this.collapsibleState === 'expanded';
		// const hasChildren = Boolean(this.children?.length);
		// const isCollapsed = isCollapsible && this.collapsed && this._hoveredItem === null;

		return html`<code-icon class="chevron" icon="chevron-right" size="12"></code-icon>
			<gl-tooltip content="${this.tooltip}" placement="bottom">
				<span class="breadcrumb-label"><slot></slot></span>
			</gl-tooltip>`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'gl-breadcrumbs': GlBreadcrumbs;
		'gl-breadcrumb-item': GlBreadcrumbItem;
		'gl-breadcrumb-item-child': GlBreadcrumbItemChild;
	}
}
