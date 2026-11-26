import { Combobox as KCombobox } from '@kobalte/core/combobox';
import type {
	ComboboxContentProps,
	ComboboxControlProps,
	ComboboxDescriptionProps,
	ComboboxErrorMessageProps,
	ComboboxIconProps,
	ComboboxInputProps,
	ComboboxItemIndicatorProps,
	ComboboxItemLabelProps,
	ComboboxItemProps,
	ComboboxLabelProps,
	ComboboxListboxProps,
	ComboboxRootProps,
	ComboboxTriggerProps,
} from '@kobalte/core/combobox';
import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import { Glide } from './Glide';
import { IconCheck, IconChevronDown } from './icons';
import './tokens.css';
import './motion.css';
import './menu.css';
import './field.css';
import './combobox.css';

/* Partes desacopladas, igual que Kobalte (el campo del TextField + el panel del DropdownMenu):
 *
 *   <Combobox
 *     options={frutas}
 *     placeholder="Elige una fruta"
 *     itemComponent={(p) => (
 *       <Combobox.Item item={p.item}>
 *         <Combobox.ItemLabel>{p.item.rawValue}</Combobox.ItemLabel>
 *         <Combobox.ItemIndicator><IconCheck /></Combobox.ItemIndicator>
 *       </Combobox.Item>
 *     )}
 *   >
 *     <Combobox.Label>Fruta</Combobox.Label>
 *     <Combobox.Control aria-label="Fruta">
 *       <Combobox.Input />
 *       <Combobox.Trigger />
 *     </Combobox.Control>
 *     <Combobox.Portal>
 *       <Combobox.Content>
 *         <Combobox.Listbox />
 *       </Combobox.Content>
 *     </Combobox.Portal>
 *   </Combobox>
 */

type Slot = { class?: string; children?: JSX.Element };

export function ComboboxRoot<Option, OptGroup = never>(props: ComboboxRootProps<Option, OptGroup> & Slot) {
	const rest = omit(props, 'class');
	return <KCombobox<Option, OptGroup> gutter={6} {...(rest as ComboboxRootProps<Option, OptGroup>)} class={cx('ui-textfield ui-combobox', props.class)} />;
}

export const ComboboxPortal = KCombobox.Portal;
export const ComboboxHiddenSelect = KCombobox.HiddenSelect;

export function ComboboxLabel(props: ComboboxLabelProps & Slot) {
	const rest = omit(props, 'class');
	return <KCombobox.Label {...rest} class={cx('ui-textfield-label', props.class)} />;
}

export function ComboboxControl(props: ComboboxControlProps<unknown> & Slot) {
	const rest = omit(props, 'class');
	return <KCombobox.Control {...rest} class={cx('ui-combobox-control', props.class)} />;
}

export function ComboboxInput(props: ComboboxInputProps & { class?: string; placeholder?: string }) {
	const rest = omit(props, 'class');
	return <KCombobox.Input {...rest} class={cx('ui-combobox-input', props.class)} />;
}

/** Botón de apertura; sin hijos muestra un chevron. */
export function ComboboxTrigger(props: ComboboxTriggerProps & Slot) {
	const rest = omit(props, 'class', 'children');
	return (
		<KCombobox.Trigger {...rest} class={cx('ui-combobox-trigger', props.class)}>
			{props.children ?? <ComboboxIcon><IconChevronDown size={12} /></ComboboxIcon>}
		</KCombobox.Trigger>
	);
}

export function ComboboxIcon(props: ComboboxIconProps & Slot) {
	const rest = omit(props, 'class');
	return <KCombobox.Icon {...rest} class={cx('ui-combobox-icon', props.class)} />;
}

/** Panel con Glide: el resaltado de hover se desliza entre las opciones. */
export function ComboboxContent(props: ComboboxContentProps & Slot) {
	const rest = omit(props, 'class', 'children');
	return (
		<KCombobox.Content {...rest} class={cx('ui-menu ui-combobox-content', props.class)}>
			<Glide rowSelector="[role='option']">{props.children}</Glide>
		</KCombobox.Content>
	);
}

export function ComboboxListbox(props: ComboboxListboxProps<unknown, unknown> & Slot) {
	const rest = omit(props, 'class');
	return <KCombobox.Listbox {...rest} class={cx('ui-combobox-listbox', props.class)} />;
}

export function ComboboxItem(props: ComboboxItemProps & Slot) {
	const rest = omit(props, 'class');
	return <KCombobox.Item {...rest} class={cx('ui-menu-item', props.class)} />;
}

export function ComboboxItemLabel(props: ComboboxItemLabelProps & Slot) {
	const rest = omit(props, 'class');
	return <KCombobox.ItemLabel {...rest} class={cx('ui-menu-label', props.class)} />;
}

/** Marca de la opción elegida; sin hijos muestra un check. */
export function ComboboxItemIndicator(props: ComboboxItemIndicatorProps & Slot) {
	const rest = omit(props, 'class', 'children');
	return (
		<KCombobox.ItemIndicator {...rest} class={cx('ui-menu-indicator', props.class)}>
			{props.children ?? <IconCheck size={14} />}
		</KCombobox.ItemIndicator>
	);
}

export function ComboboxDescription(props: ComboboxDescriptionProps & Slot) {
	const rest = omit(props, 'class');
	return <KCombobox.Description {...rest} class={cx('ui-textfield-description', props.class)} />;
}

export function ComboboxErrorMessage(props: ComboboxErrorMessageProps & Slot) {
	const rest = omit(props, 'class');
	return <KCombobox.ErrorMessage {...rest} class={cx('ui-textfield-error', props.class)} />;
}

export const Combobox = Object.assign(ComboboxRoot, {
	Label: ComboboxLabel,
	Control: ComboboxControl,
	Input: ComboboxInput,
	Trigger: ComboboxTrigger,
	Icon: ComboboxIcon,
	Portal: ComboboxPortal,
	Content: ComboboxContent,
	Listbox: ComboboxListbox,
	Item: ComboboxItem,
	ItemLabel: ComboboxItemLabel,
	ItemIndicator: ComboboxItemIndicator,
	Description: ComboboxDescription,
	ErrorMessage: ComboboxErrorMessage,
	HiddenSelect: ComboboxHiddenSelect,
});
