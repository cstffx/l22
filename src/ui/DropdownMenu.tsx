import { DropdownMenu as KMenu } from '@kobalte/core/dropdown-menu';
import type {
	DropdownMenuContentProps,
	DropdownMenuRootProps,
	DropdownMenuCheckboxItemProps,
	DropdownMenuGroupLabelProps,
	DropdownMenuGroupProps,
	DropdownMenuIconProps,
	DropdownMenuItemIndicatorProps,
	DropdownMenuItemLabelProps,
	DropdownMenuItemProps,
	DropdownMenuRadioGroupProps,
	DropdownMenuRadioItemProps,
	DropdownMenuTriggerProps,
} from '@kobalte/core/dropdown-menu';
import { omit } from 'solid-js';
import type { JSX, ValidComponent } from '@solidjs/web';
import type { ButtonSize, ButtonVariant } from './Button';
import { Button } from './Button';
import { cx } from './cx';
import { Glide } from './Glide';
import { Separator } from './Separator';
import './tokens.css';
import './motion.css';
import './menu.css';

/* Partes desacopladas, igual que Kobalte:
 *
 *   <DropdownMenu>
 *     <DropdownMenu.Trigger>Opciones</DropdownMenu.Trigger>
 *     <DropdownMenu.Portal>
 *       <DropdownMenu.Content>
 *         <DropdownMenu.Item>
 *           <DropdownMenu.Icon><IconPlus /></DropdownMenu.Icon>
 *           <DropdownMenu.Label>Nuevo</DropdownMenu.Label>
 *         </DropdownMenu.Item>
 *         <DropdownMenu.Separator />
 *       </DropdownMenu.Content>
 *     </DropdownMenu.Portal>
 *   </DropdownMenu>
 */

type Slot = { class?: string; children?: JSX.Element };

export function DropdownMenuRoot(props: DropdownMenuRootProps) {
	return <KMenu gutter={6} {...props} />;
}

export const DropdownMenuPortal = KMenu.Portal;

/** Por defecto un Button `secondary`/`sm`; pasa `as="button"` y tu `class` para un trigger propio. */
export function DropdownMenuTrigger(props: DropdownMenuTriggerProps & Slot & { as?: ValidComponent; variant?: ButtonVariant; size?: ButtonSize }) {
	return <KMenu.Trigger as={Button} variant="secondary" size="sm" {...props} />;
}

/** Panel con Glide: el resaltado de hover se desliza entre las filas. */
export function DropdownMenuContent(props: DropdownMenuContentProps & Slot) {
	const rest = omit(props, 'class', 'children');
	return (
		<KMenu.Content {...rest} class={cx('ui-menu', props.class)}>
			<Glide>{props.children}</Glide>
		</KMenu.Content>
	);
}

export function DropdownMenuItem(props: DropdownMenuItemProps & Slot) {
	const rest = omit(props, 'class');
	return <KMenu.Item {...rest} class={cx('ui-menu-item', props.class)} />;
}

export function DropdownMenuIcon(props: DropdownMenuIconProps & Slot) {
	const rest = omit(props, 'class');
	return <KMenu.Icon {...rest} class={cx('ui-menu-icon', props.class)} />;
}

export function DropdownMenuLabel(props: DropdownMenuItemLabelProps & Slot) {
	const rest = omit(props, 'class');
	return <KMenu.ItemLabel {...rest} class={cx('ui-menu-label', props.class)} />;
}

/** Se muestra solo si el ítem está marcado (CheckboxItem / RadioItem). */
export function DropdownMenuItemIndicator(props: DropdownMenuItemIndicatorProps & Slot) {
	const rest = omit(props, 'class');
	return <KMenu.ItemIndicator {...rest} class={cx('ui-menu-indicator', props.class)} />;
}

export function DropdownMenuCheckboxItem(props: DropdownMenuCheckboxItemProps & Slot) {
	const rest = omit(props, 'class');
	return <KMenu.CheckboxItem {...rest} class={cx('ui-menu-item', props.class)} />;
}

export function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps & Slot) {
	return <KMenu.RadioGroup {...props} />;
}

export function DropdownMenuRadioItem(props: DropdownMenuRadioItemProps & Slot) {
	const rest = omit(props, 'class');
	return <KMenu.RadioItem {...rest} class={cx('ui-menu-item', props.class)} />;
}

export function DropdownMenuGroup(props: DropdownMenuGroupProps & Slot) {
	return <KMenu.Group {...props} />;
}

export function DropdownMenuGroupLabel(props: DropdownMenuGroupLabelProps & Slot) {
	const rest = omit(props, 'class');
	return <KMenu.GroupLabel {...rest} class={cx('ui-menu-group-label', props.class)} />;
}

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
	Trigger: DropdownMenuTrigger,
	Portal: DropdownMenuPortal,
	Content: DropdownMenuContent,
	Item: DropdownMenuItem,
	Icon: DropdownMenuIcon,
	Label: DropdownMenuLabel,
	ItemIndicator: DropdownMenuItemIndicator,
	CheckboxItem: DropdownMenuCheckboxItem,
	RadioGroup: DropdownMenuRadioGroup,
	RadioItem: DropdownMenuRadioItem,
	Group: DropdownMenuGroup,
	GroupLabel: DropdownMenuGroupLabel,
	Separator,
});
