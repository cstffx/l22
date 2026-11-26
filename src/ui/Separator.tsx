import { Separator as KSeparator } from '@kobalte/core/separator';
import type { SeparatorRootProps } from '@kobalte/core/separator';
import { omit } from 'solid-js';
import { cx } from './cx';
import './tokens.css';
import './primitives.css';

/** Línea divisoria de Kobalte con el color `line` de beautiful-ui. */
export function Separator(props: SeparatorRootProps & { class?: string }) {
	const rest = omit(props, 'class');
	return <KSeparator {...rest} class={cx('ui-separator', props.class)} />;
}
