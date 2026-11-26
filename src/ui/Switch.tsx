import { Switch as KSwitch } from '@kobalte/core/switch';
import type { SwitchRootProps } from '@kobalte/core/switch';
import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './tokens.css';
import './controls.css';

export type SwitchProps = SwitchRootProps & {
	label?: JSX.Element;
	description?: JSX.Element;
	class?: string;
};

/** Interruptor de Kobalte con el estilo de beautiful-ui. */
export function Switch(props: SwitchProps) {
	const rest = omit(props, 'label', 'description', 'class');
	return (
		<KSwitch {...rest} class={`ui-field ui-switch${props.class ? ` ${props.class}` : ''}`}>
			<KSwitch.Input />
			<KSwitch.Control class="ui-track">
				<KSwitch.Thumb class="ui-thumb" />
			</KSwitch.Control>
			{(props.label || props.description) && (
				<div class="ui-field-text">
					{props.label && <KSwitch.Label class="ui-label">{props.label}</KSwitch.Label>}
					{props.description && <KSwitch.Description class="ui-description">{props.description}</KSwitch.Description>}
				</div>
			)}
		</KSwitch>
	);
}
