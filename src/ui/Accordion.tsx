import { Accordion as KAccordion } from '@kobalte/core/accordion';
import type { AccordionRootProps, AccordionItemProps } from '@kobalte/core/accordion';
import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './tokens.css';
import './accordion.css';

export type AccordionProps = AccordionRootProps & {
	class?: string;
	children?: JSX.Element;
};

/** Accordion de Kobalte con el estilo de tarjeta de beautiful-ui. Usa `<AccordionItem>` como hijos. */
export function Accordion(props: AccordionProps) {
	const rest = omit(props, 'class');
	return <KAccordion {...rest} class={`ui-accordion${props.class ? ` ${props.class}` : ''}`} />;
}

export type AccordionItemWrapperProps = AccordionItemProps & {
	title: JSX.Element;
	/** Ícono de 11px a la izquierda del título. */
	icon?: JSX.Element;
	/** Texto secundario alineado a la derecha (p. ej. «290 caracteres»). */
	meta?: JSX.Element;
	class?: string;
	children?: JSX.Element;
};

export function AccordionItem(props: AccordionItemWrapperProps) {
	const rest = omit(props, 'title', 'icon', 'meta', 'class', 'children');
	return (
		<KAccordion.Item {...rest} class={`ui-accordion-item${props.class ? ` ${props.class}` : ''}`}>
			<KAccordion.Header class="ui-accordion-header">
				<KAccordion.Trigger class="ui-accordion-trigger">
					<span class="ui-accordion-title">
						{props.icon}
						<span>{props.title}</span>
					</span>
					{props.meta && <span class="ui-accordion-meta">{props.meta}</span>}
					<svg class="ui-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="m6 9 6 6 6-6" />
					</svg>
				</KAccordion.Trigger>
			</KAccordion.Header>
			<KAccordion.Content class="ui-accordion-content">
				<div class="ui-accordion-body">{props.children}</div>
			</KAccordion.Content>
		</KAccordion.Item>
	);
}
