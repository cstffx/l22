import { Show } from 'solid-js';
import type { JSX } from '@solidjs/web';

export function GridCheckbox(props: { checked: boolean; mixed?: boolean; onChange: () => void; label: string; class?: string }) {
	return (
		<label class={['ui-dg-check', props.class]} title={props.label} onClick={(e) => e.stopPropagation()}>
			<input type="checkbox" checked={props.checked} onChange={props.onChange} aria-label={props.label} />
			<span class={`ui-dg-check-box${props.checked || props.mixed ? ' is-active' : ''}`}>
				<Show when={props.mixed} fallback={<Show when={props.checked}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg></Show>}>
					<span class="ui-dg-dash" />
				</Show>
			</span>
		</label>
	);
}

/** Resuelve una plantilla de `ColumnDef`: cadena tal cual, función con su contexto. */
export function renderTemplate<TContext>(template: string | ((context: TContext) => unknown) | undefined, context: () => TContext, fallback: () => unknown): JSX.Element {
	if (template === undefined) return fallback() as JSX.Element;
	if (typeof template === 'string') return template;
	return template(context()) as JSX.Element;
}

export const asText = (value: unknown): string => {
	if (value == null) return '';
	return Array.isArray(value) ? value.join(', ') : String(value);
};
