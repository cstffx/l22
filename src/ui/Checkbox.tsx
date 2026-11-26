import { Checkbox as KCheckbox } from '@kobalte/core/checkbox';
import type { CheckboxRootProps } from '@kobalte/core/checkbox';
import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './tokens.css';
import './controls.css';

export type CheckboxProps = CheckboxRootProps & {
	label?: JSX.Element;
	description?: JSX.Element;
	class?: string;
};

const Check = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="m5 12 4 4L19 6" />
	</svg>
);
const Dash = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
		<path d="M6 12h12" />
	</svg>
);

/** Checkbox de Kobalte con el estilo de beautiful-ui. */
export function Checkbox(props: CheckboxProps) {
	const rest = omit(props, 'label', 'description', 'class');
	return (
		<KCheckbox {...rest} class={`ui-field ui-checkbox${props.class ? ` ${props.class}` : ''}`}>
			<KCheckbox.Input />
			<KCheckbox.Control class="ui-box">
				<KCheckbox.Indicator forceMount class="ui-indicator">{props.indeterminate ? <Dash /> : <Check />}</KCheckbox.Indicator>
			</KCheckbox.Control>
			{(props.label || props.description) && (
				<div class="ui-field-text">
					{props.label && <KCheckbox.Label class="ui-label">{props.label}</KCheckbox.Label>}
					{props.description && <KCheckbox.Description class="ui-description">{props.description}</KCheckbox.Description>}
				</div>
			)}
		</KCheckbox>
	);
}
