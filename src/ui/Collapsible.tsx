import { Collapsible as KCollapsible } from '@kobalte/core/collapsible';
import type {
	CollapsibleContentProps,
	CollapsibleRootProps,
	CollapsibleTriggerProps,
} from '@kobalte/core/collapsible';
import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import './tokens.css';
import './collapsible.css';

/* Partes desacopladas, igual que Kobalte:
 *
 *   <Collapsible>
 *     <Collapsible.Trigger>
 *       <Collapsible.Title>Título</Collapsible.Title>
 *       <Collapsible.Meta>3 ítems</Collapsible.Meta>
 *       <Collapsible.Chevron />
 *     </Collapsible.Trigger>
 *     <Collapsible.Content>Contenido</Collapsible.Content>
 *   </Collapsible>
 */

type Slot = { class?: string; children?: JSX.Element };

/* Función nueva: Object.assign de abajo no debe pisar las partes del objeto de Kobalte. */
export function CollapsibleRoot(props: CollapsibleRootProps & Slot) {
	const rest = omit(props, 'class');
	return <KCollapsible {...rest} class={cx('ui-collapsible', props.class)} />;
}

export function CollapsibleTrigger(props: CollapsibleTriggerProps & Slot) {
	const rest = omit(props, 'class');
	return <KCollapsible.Trigger {...rest} class={cx('ui-collapsible-trigger', props.class)} />;
}

/** Contenido animado; envuelve los hijos en un cuerpo con padding de 12px. */
export function CollapsibleContent(props: CollapsibleContentProps & Slot) {
	const rest = omit(props, 'class', 'children');
	return (
		<KCollapsible.Content {...rest} class={cx('ui-collapsible-content', props.class)}>
			<div class="ui-collapsible-body">{props.children}</div>
		</KCollapsible.Content>
	);
}

/** Título de la barra (13px, negrita). Admite un ícono de 11px como primer hijo. */
export function CollapsibleTitle(props: Slot) {
	return (
		<span class={cx('ui-collapsible-title', props.class)}>
			{props.children}
		</span>
	);
}

/** Texto secundario alineado a la derecha de la barra. */
export function CollapsibleMeta(props: Slot) {
	return <span class={cx('ui-collapsible-meta', props.class)}>{props.children}</span>;
}

/** Chevron que gira al abrir. */
export function CollapsibleChevron(props: { class?: string }) {
	return (
		<svg class={cx('ui-collapsible-chevron', props.class)} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

export const Collapsible = Object.assign(CollapsibleRoot, {
	Trigger: CollapsibleTrigger,
	Content: CollapsibleContent,
	Title: CollapsibleTitle,
	Meta: CollapsibleMeta,
	Chevron: CollapsibleChevron,
});
