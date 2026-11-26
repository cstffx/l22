import { Tooltip as KTooltip } from '@kobalte/core/tooltip';
import type { TooltipContentProps, TooltipRootProps, TooltipTriggerProps } from '@kobalte/core/tooltip';
import { omit } from 'solid-js';
import type { JSX, ValidComponent } from '@solidjs/web';
import type { ButtonSize, ButtonVariant } from './Button';
import { cx } from './cx';
import './tokens.css';
import './motion.css';
import './tooltip.css';

/* Partes desacopladas, igual que Kobalte:
 *
 *   <Tooltip>
 *     <Tooltip.Trigger>Pasa el cursor</Tooltip.Trigger>
 *     <Tooltip.Portal>
 *       <Tooltip.Content>Texto de ayuda</Tooltip.Content>
 *     </Tooltip.Portal>
 *   </Tooltip>
 */

type Slot = { class?: string; children?: JSX.Element };

export function TooltipRoot(props: TooltipRootProps) {
	return <KTooltip gutter={6} {...props} />;
}

export const TooltipPortal = KTooltip.Portal;

/** Sin estilo propio: se renderiza como `button`; usa `as` para otro elemento o componente. */
export function TooltipTrigger(props: TooltipTriggerProps & Slot & { as?: ValidComponent; variant?: ButtonVariant; size?: ButtonSize } & Record<`data-${string}` | `aria-${string}`, unknown> & { href?: string; type?: 'button'; onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent> }) {
	return <KTooltip.Trigger {...props} />;
}

export function TooltipContent(props: TooltipContentProps & Slot) {
	const rest = omit(props, 'class');
	return <KTooltip.Content {...rest} class={cx('ui-tooltip', props.class)} />;
}

export const Tooltip = Object.assign(TooltipRoot, {
	Trigger: TooltipTrigger,
	Portal: TooltipPortal,
	Content: TooltipContent,
});
