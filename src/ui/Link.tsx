import { Link as KLink } from '@kobalte/core/link';
import type { LinkRootProps } from '@kobalte/core/link';
import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import './tokens.css';
import './primitives.css';

export type LinkProps = LinkRootProps & {
	class?: string;
	children?: JSX.Element;
	/** Marca la página actual (`aria-current="page"`). */
	current?: boolean;
	/** Subrayado discreto (para enlaces dentro de texto). */
	underline?: boolean;
};

/** Enlace de Kobalte. `current` marca la página actual (`aria-current="page"`). */
export function Link(props: LinkProps) {
	const rest = omit(props, 'class', 'underline', 'current');
	return <KLink {...rest} aria-current={props.current ? 'page' : undefined} class={cx('ui-link', props.underline && 'ui-link--underline', props.class)} />;
}
