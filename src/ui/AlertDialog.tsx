import { AlertDialog as KAlertDialog } from '@kobalte/core/alert-dialog';
import type {
	AlertDialogCloseButtonProps,
	AlertDialogRootProps,
	AlertDialogContentProps,
	AlertDialogDescriptionProps,
	AlertDialogOverlayProps,
	AlertDialogTitleProps,
	AlertDialogTriggerProps,
} from '@kobalte/core/alert-dialog';
import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import type { ButtonSize, ButtonVariant } from './Button';
import { Button } from './Button';
import { cx } from './cx';
import './tokens.css';
import './motion.css';
import './alert-dialog.css';

/* Partes desacopladas, igual que Kobalte: el usuario las compone.
 *
 *   <AlertDialog>
 *     <AlertDialog.Trigger>Abrir</AlertDialog.Trigger>
 *     <AlertDialog.Portal>
 *       <AlertDialog.Overlay />
 *       <AlertDialog.Content>
 *         <AlertDialog.Header>
 *           <AlertDialog.Title>…</AlertDialog.Title>
 *           <AlertDialog.Description>…</AlertDialog.Description>
 *         </AlertDialog.Header>
 *         <AlertDialog.Footer>
 *           <AlertDialog.CloseButton>Cancelar</AlertDialog.CloseButton>
 *         </AlertDialog.Footer>
 *       </AlertDialog.Content>
 *     </AlertDialog.Portal>
 *   </AlertDialog>
 */

type Slot = { class?: string; children?: JSX.Element };
type ButtonStyleProps = Slot & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
};

/* Función nueva (no el objeto de Kobalte): Object.assign de abajo no debe pisar sus partes. */
export function AlertDialogRoot(props: AlertDialogRootProps) {
	return <KAlertDialog {...props} />;
}
export const AlertDialogPortal = KAlertDialog.Portal;

export function AlertDialogTrigger(props: AlertDialogTriggerProps & ButtonStyleProps) {
	return <KAlertDialog.Trigger as={Button} variant="secondary" size="sm" {...props} />;
}

export function AlertDialogOverlay(props: AlertDialogOverlayProps & Slot) {
	const rest = omit(props, 'class');
	return <KAlertDialog.Overlay {...rest} class={cx('ui-dialog-overlay', props.class)} />;
}

/** Centra la tarjeta en pantalla y renderiza `AlertDialog.Content` de Kobalte. */
export function AlertDialogContent(props: AlertDialogContentProps & Slot) {
	const rest = omit(props, 'class');
	return (
		<div class="ui-dialog-positioner">
			<KAlertDialog.Content {...rest} class={cx('ui-dialog', props.class)} />
		</div>
	);
}

export function AlertDialogHeader(props: JSX.HTMLAttributes<HTMLDivElement>) {
	const rest = omit(props, 'class');
	return <div {...rest} class={cx('ui-dialog-pad', props.class)} />;
}

export function AlertDialogFooter(props: JSX.HTMLAttributes<HTMLDivElement>) {
	const rest = omit(props, 'class');
	return <div {...rest} class={cx('ui-dialog-footer', props.class)} />;
}

/** Agrupa los botones de acción a la derecha del pie. */
export function AlertDialogActions(props: JSX.HTMLAttributes<HTMLDivElement>) {
	const rest = omit(props, 'class');
	return <div {...rest} class={cx('ui-dialog-actions', props.class)} />;
}

export function AlertDialogTitle(props: AlertDialogTitleProps & Slot) {
	const rest = omit(props, 'class');
	return <KAlertDialog.Title {...rest} class={cx('ui-dialog-title', props.class)} />;
}

export function AlertDialogDescription(props: AlertDialogDescriptionProps & Slot) {
	const rest = omit(props, 'class');
	return <KAlertDialog.Description {...rest} class={cx('ui-dialog-description', props.class)} />;
}

export function AlertDialogCloseButton(props: AlertDialogCloseButtonProps & ButtonStyleProps) {
	return <KAlertDialog.CloseButton as={Button} variant="secondary" size="sm" {...props} />;
}

export const AlertDialog = Object.assign(AlertDialogRoot, {
	Trigger: AlertDialogTrigger,
	Portal: AlertDialogPortal,
	Overlay: AlertDialogOverlay,
	Content: AlertDialogContent,
	Header: AlertDialogHeader,
	Footer: AlertDialogFooter,
	Actions: AlertDialogActions,
	Title: AlertDialogTitle,
	Description: AlertDialogDescription,
	CloseButton: AlertDialogCloseButton,
});
