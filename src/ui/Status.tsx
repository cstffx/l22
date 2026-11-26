import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import './tokens.css';
import './status.css';

export type StatusProps = JSX.HTMLAttributes<HTMLSpanElement> & {
	/** Color del punto: cualquier color CSS (`var(--green)`, `oklch(…)`…). Por defecto, gris tenue. */
	color?: string;
	class?: string;
	/** Texto del estado. */
	children?: JSX.Element;
};

/** Estado en línea: un punto de color y su etiqueta. Sin fondo ni borde (para eso, `Badge dot`). */
export function Status(props: StatusProps) {
	const rest = omit(props, 'class', 'color', 'children');
	return (
		<span {...rest} class={cx('ui-status', props.class)} style={{ '--status-color': props.color }}>
			<span class="ui-status-dot" aria-hidden="true" />
			{props.children}
		</span>
	);
}
