import { RadioGroup as KRadioGroup } from '@kobalte/core/radio-group';
import type { RadioGroupRootProps, RadioGroupItemProps } from '@kobalte/core/radio-group';
import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './tokens.css';
import './controls.css';

export type RadioGroupProps = RadioGroupRootProps & {
	label?: JSX.Element;
	class?: string;
	children?: JSX.Element;
};

/** Grupo de radios de Kobalte con el estilo de beautiful-ui. Usa `<Radio>` como hijos. */
export function RadioGroup(props: RadioGroupProps) {
	const rest = omit(props, 'label', 'class', 'children');
	return (
		<KRadioGroup {...rest} class={`ui-radio-group${props.class ? ` ${props.class}` : ''}`}>
			{props.label && <KRadioGroup.Label class="ui-group-label">{props.label}</KRadioGroup.Label>}
			{props.children}
		</KRadioGroup>
	);
}

export type RadioProps = RadioGroupItemProps & {
	label?: JSX.Element;
	description?: JSX.Element;
	class?: string;
};

export function Radio(props: RadioProps) {
	const rest = omit(props, 'label', 'description', 'class');
	return (
		<KRadioGroup.Item {...rest} class={`ui-field${props.class ? ` ${props.class}` : ''}`}>
			<KRadioGroup.ItemInput />
			<KRadioGroup.ItemControl class="ui-box ui-box-radio">
				<KRadioGroup.ItemIndicator forceMount class="ui-dot" />
			</KRadioGroup.ItemControl>
			<div class="ui-field-text">
				{props.label && <KRadioGroup.ItemLabel class="ui-label">{props.label}</KRadioGroup.ItemLabel>}
				{props.description && <KRadioGroup.ItemDescription class="ui-description">{props.description}</KRadioGroup.ItemDescription>}
			</div>
		</KRadioGroup.Item>
	);
}
