import { createUniqueId, omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import './tokens.css';
import './form.css';

/* Formulario estilo Linear: un campo por fila, etiqueta a la izquierda, control a la derecha
 * y un separador entre campos.
 *
 *   <Form controlWidth={240} onSubmit={guardar}>
 *     <Form.Field label="Nombre" description="Se muestra en tu perfil.">
 *       <TextField><TextField.Input /></TextField>
 *     </Form.Field>
 *     <Form.Field label="Notificaciones">
 *       <Switch checked={on()} onChange={setOn} />
 *     </Form.Field>
 *   </Form>
 *
 * `Form.Section` agrupa campos bajo un título:
 *
 *   <Form.Section title="Cuenta"> <Form.Field …/> </Form.Section>
 */

export type FormProps = Omit<JSX.FormHTMLAttributes<HTMLFormElement>, 'class'> & {
	class?: string;
	/** Ancho de la columna de controles (por defecto 240px). */
	controlWidth?: number | string;
};

/** Contenedor `<form>`: apila los campos y fija el ancho de la columna de controles. */
export function FormRoot(props: FormProps) {
	const rest = omit(props, 'class', 'controlWidth', 'style');
	const width = () => (typeof props.controlWidth === 'number' ? `${props.controlWidth}px` : props.controlWidth);
	return <form {...rest} class={cx('ui-form', props.class)} style={{ ...(props.style as object), '--form-control-w': width() }} />;
}

export type FormFieldProps = {
	/** Etiqueta de la columna izquierda. */
	label: JSX.Element;
	/** Texto de ayuda bajo la etiqueta. */
	description?: JSX.Element;
	/** Mensaje de error bajo el control. */
	error?: JSX.Element;
	/** Ancho de la columna de controles solo para este campo. */
	controlWidth?: number | string;
	class?: string;
	/** El control (TextField, Combobox, Switch…), alineado a la derecha. */
	children?: JSX.Element;
};

/** Una fila: etiqueta (y ayuda) a la izquierda, control a la derecha. */
export function FormField(props: FormFieldProps) {
	const id = createUniqueId();
	const width = () => (typeof props.controlWidth === 'number' ? `${props.controlWidth}px` : props.controlWidth);
	return (
		<div class={cx('ui-form-field', props.class)} role="group" aria-labelledby={`${id}-label`} style={{ '--form-control-w': width() }}>
			<div class="ui-form-text">
				<span id={`${id}-label`} class="ui-form-label">{props.label}</span>
				{props.description && <span class="ui-form-description">{props.description}</span>}
			</div>
			<div class="ui-form-control">
				{props.children}
				{props.error && <span class="ui-form-error" role="alert">{props.error}</span>}
			</div>
		</div>
	);
}

export type FormSectionProps = {
	/** Título de la sección. */
	title: JSX.Element;
	class?: string;
	/** Los `Form.Field` de la sección. */
	children?: JSX.Element;
};

/** Agrupa campos bajo un título (12px, mayúsculas, `ink-3`). */
export function FormSection(props: FormSectionProps) {
	return (
		<section class={cx('ui-form-section', props.class)}>
			<h3 class="ui-form-section-title">{props.title}</h3>
			{props.children}
		</section>
	);
}

export const Form = Object.assign(FormRoot, { Field: FormField, Section: FormSection });
