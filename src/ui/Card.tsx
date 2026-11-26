import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import './tokens.css';
import './card.css';

/* Tarjeta con regiones desacopladas:
 *
 *   <Card>
 *     <Card.Header>
 *       <Card.Title>Título</Card.Title>
 *       <Card.Action>…</Card.Action>
 *     </Card.Header>
 *     <Card.Body>Contenido</Card.Body>
 *     <Card.Footer>Pie</Card.Footer>
 *   </Card>
 */

type DivProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> & { class?: string };

/** Superficie base: radio 10, `shadow-card`, sin desbordes. */
export function CardRoot(props: DivProps) {
	const rest = omit(props, 'class');
	return <div {...rest} class={cx('ui-card', props.class)} />;
}

/** Región del título: barra con borde inferior (padding `10px 12px`). */
export function CardHeader(props: DivProps) {
	const rest = omit(props, 'class');
	return <div {...rest} class={cx('ui-card-header', props.class)} />;
}

/** Texto del título (13px, peso 500). Va dentro de `Card.Header`. */
export function CardTitle(props: DivProps) {
	const rest = omit(props, 'class');
	return <div {...rest} class={cx('ui-card-title', props.class)} />;
}

/** Elemento alineado a la derecha del header (estado, botón, menú…). */
export function CardAction(props: DivProps) {
	const rest = omit(props, 'class');
	return <div {...rest} class={cx('ui-card-action', props.class)} />;
}

/** Región principal: padding de 12px, columna con separación de 8px. */
export function CardBody(props: DivProps) {
	const rest = omit(props, 'class');
	return <div {...rest} class={cx('ui-card-body', props.class)} />;
}

/** Región inferior: borde superior, contenido en fila y separado a los extremos. */
export function CardFooter(props: DivProps) {
	const rest = omit(props, 'class');
	return <div {...rest} class={cx('ui-card-footer', props.class)} />;
}

export const Card = Object.assign(CardRoot, {
	Header: CardHeader,
	Title: CardTitle,
	Action: CardAction,
	Body: CardBody,
	Footer: CardFooter,
});
