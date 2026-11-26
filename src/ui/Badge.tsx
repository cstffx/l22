import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import './tokens.css';
import './badge.css';

export const BADGE_COLORS = ['neutral', 'accent', 'amber', 'lime', 'yellow', 'purple', 'orange', 'cyan', 'red', 'magenta', 'green', 'pink'] as const;
export type BadgeColor = (typeof BADGE_COLORS)[number];

export type BadgeProps = JSX.HTMLAttributes<HTMLSpanElement> & {
	/** Tono del badge. */
	color?: BadgeColor;
	size?: 'sm' | 'default' | 'md';
	/** Punto de color antes del texto. */
	dot?: boolean;
	class?: string;
	children?: JSX.Element;
};

/** Etiqueta compacta de color. Fondo, texto y borde se derivan de un único tono. */
export function Badge(props: BadgeProps) {
	const rest = omit(props, 'class', 'color', 'size', 'dot', 'children');
	return (
		<span {...rest} class={cx('ui-badge', props.class)} data-color={props.color ?? 'neutral'} data-size={props.size ?? 'default'}>
			{props.dot && <span class="ui-badge-dot" aria-hidden="true" />}
			{props.children}
		</span>
	);
}
