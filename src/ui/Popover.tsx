import { Popover as KPopover } from '@kobalte/core/popover';
import type {
	PopoverCloseButtonProps,
	PopoverContentProps,
	PopoverDescriptionProps,
	PopoverRootProps,
	PopoverTitleProps,
	PopoverTriggerProps,
} from '@kobalte/core/popover';
import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import type { ButtonSize, ButtonVariant } from './Button';
import { Button } from './Button';
import { cx } from './cx';
import './tokens.css';
import './motion.css';
import './popover.css';

/* Partes desacopladas, igual que Kobalte:
 *
 *   <Popover>
 *     <Popover.Trigger>Filtros</Popover.Trigger>
 *     <Popover.Portal>
 *       <Popover.Content>
 *         <Popover.Title>…</Popover.Title>
 *         …
 *       </Popover.Content>
 *     </Popover.Portal>
 *   </Popover>
 */

type Slot = { class?: string; children?: JSX.Element };
type ButtonStyleProps = Slot & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
};

export function PopoverRoot(props: PopoverRootProps) {
	return <KPopover gutter={8} {...props} />;
}

export const PopoverPortal = KPopover.Portal;

export function PopoverTrigger(props: PopoverTriggerProps & ButtonStyleProps) {
	return <KPopover.Trigger as={Button} variant="secondary" size="sm" {...props} />;
}

export function PopoverContent(props: PopoverContentProps & Slot) {
	const rest = omit(props, 'class');
	return <KPopover.Content {...rest} class={cx('ui-popover', props.class)} />;
}

export function PopoverTitle(props: PopoverTitleProps & Slot) {
	const rest = omit(props, 'class');
	return <KPopover.Title {...rest} class={cx('ui-popover-title', props.class)} />;
}

export function PopoverDescription(props: PopoverDescriptionProps & Slot) {
	const rest = omit(props, 'class');
	return <KPopover.Description {...rest} class={cx('ui-popover-description', props.class)} />;
}

export function PopoverCloseButton(props: PopoverCloseButtonProps & ButtonStyleProps) {
	return <KPopover.CloseButton as={Button} variant="quiet" size="xs" {...props} />;
}

export const Popover = Object.assign(PopoverRoot, {
	Trigger: PopoverTrigger,
	Portal: PopoverPortal,
	Content: PopoverContent,
	Title: PopoverTitle,
	Description: PopoverDescription,
	CloseButton: PopoverCloseButton,
});
