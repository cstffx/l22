import { TextField as KField } from '@kobalte/core/text-field';
import type {
	TextFieldDescriptionProps,
	TextFieldErrorMessageProps,
	TextFieldLabelProps,
	TextFieldInputProps,
	TextFieldRootProps,
} from '@kobalte/core/text-field';
import { omit, Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import './tokens.css';
import './field.css';

/* Partes desacopladas, igual que Kobalte:
 *
 *   <TextField>
 *     <TextField.Label>Nombre</TextField.Label>
 *     <TextField.Input placeholder="…" />
 *     <TextField.Description>Ayuda</TextField.Description>
 *   </TextField>
 */

type Slot = { class?: string; children?: JSX.Element };

export function TextFieldRoot(props: TextFieldRootProps & Slot) {
	const rest = omit(props, 'class');
	return <KField {...rest} class={cx('ui-textfield', props.class)} />;
}

export function TextFieldLabel(props: TextFieldLabelProps & Slot) {
	const rest = omit(props, 'class');
	return <KField.Label {...rest} class={cx('ui-textfield-label', props.class)} />;
}

type InputExtra = {
	class?: string;
	placeholder?: string;
	onKeyDown?: (e: KeyboardEvent) => void;
	/** Ícono a la izquierda del texto. */
	startIcon?: JSX.Element;
	/** Ícono (o botón) a la derecha del texto. */
	endIcon?: JSX.Element;
};

export function TextFieldInput(props: TextFieldInputProps & InputExtra) {
	const rest = omit(props, 'class', 'startIcon', 'endIcon');
	const input = () => (
		<KField.Input
			{...rest}
			class={cx('ui-input', props.startIcon && 'ui-input-start', props.endIcon && 'ui-input-end', props.class)}
		/>
	);
	return (
		<Show when={props.startIcon || props.endIcon} fallback={input()}>
			<div class="ui-input-wrap">
				<Show when={props.startIcon}>
					<span class="ui-input-icon ui-input-icon-start">{props.startIcon}</span>
				</Show>
				{input()}
				<Show when={props.endIcon}>
					<span class="ui-input-icon ui-input-icon-end">{props.endIcon}</span>
				</Show>
			</div>
		</Show>
	);
}

export function TextFieldTextArea(props: Parameters<typeof KField.TextArea>[0] & { class?: string; placeholder?: string }) {
	const rest = omit(props, 'class');
	return <KField.TextArea {...rest} class={cx('ui-input', props.class)} />;
}

export function TextFieldDescription(props: TextFieldDescriptionProps & Slot) {
	const rest = omit(props, 'class');
	return <KField.Description {...rest} class={cx('ui-textfield-description', props.class)} />;
}

export function TextFieldErrorMessage(props: TextFieldErrorMessageProps & Slot) {
	const rest = omit(props, 'class');
	return <KField.ErrorMessage {...rest} class={cx('ui-textfield-error', props.class)} />;
}

export const TextField = Object.assign(TextFieldRoot, {
	Label: TextFieldLabel,
	Input: TextFieldInput,
	TextArea: TextFieldTextArea,
	Description: TextFieldDescription,
	ErrorMessage: TextFieldErrorMessage,
});
