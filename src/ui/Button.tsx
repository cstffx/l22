import { Button as KButton } from '@kobalte/core/button';
import type { ButtonRootProps } from '@kobalte/core/button';
import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './tokens.css';
import './button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'success' | 'danger' | 'quiet';
export type ButtonSize = 'xs' | 'sm' | 'md';

export type ButtonProps = ButtonRootProps & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	class?: string;
	children?: JSX.Element;
	onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
};

/** Botón de Kobalte con el estilo de beautiful-ui (píldora, variantes y tamaños). */
export function Button(props: ButtonProps) {
	const rest = omit(props, 'variant', 'size', 'class');
	return (
		<KButton
			{...rest}
			class={`ui-button${props.class ? ` ${props.class}` : ''}`}
			data-variant={props.variant ?? 'secondary'}
			data-size={props.size ?? 'md'}
		/>
	);
}
