import type { TemplateResult } from 'lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { GitReference } from '../../../../git/models/reference';
import './button';
import './ref-name';

@customElement('gl-ref-button')
export class GlRefButton extends LitElement {
	static override styles = css`
		:host {
			max-width: 100%;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		gl-button {
			max-width: 100%;
		}

		.label {
			display: inline-flex;
			flex-direction: row;
			max-width: 100%;
		}

		.chevron {
			margin-left: 0.2rem;
			vertical-align: middle;
		}
	`;

	@property({ type: Boolean, reflect: true })
	disabled = false;

	@property({ type: Object })
	ref?: GitReference;

	@property({ type: Number })
	size: number = 12;

	@property()
	tooltip?: string;

	@property({ type: Boolean })
	worktree = false;

	override render(): unknown {
		return html`<gl-button
			appearance="toolbar"
			?disabled=${this.disabled}
			tooltip="${ifDefined(this.tooltip)}"
			aria-label="${ifDefined(this.tooltip)}"
			><span class="label"
				>${this.ref == null
					? html`<slot name="empty">&lt;missing&gt;</slot>`
					: html`<gl-ref-name
							.ref=${this.ref}
							.size=${this.size}
							?worktree=${this.worktree}
					  ></gl-ref-name>`}<code-icon class="chevron" icon="chevron-down" size="10"></code-icon></span
		></gl-button>`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'gl-ref-button': GlRefButton;
	}
}

export function renderRefButton(ref: GitReference | undefined, worktree?: boolean): TemplateResult {
	return html`<gl-ref-button .ref=${ref} .size=${12} ?worktree=${worktree ?? false}></gl-ref-button>`;
}
