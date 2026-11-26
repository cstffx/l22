import './sv-grid-scrollbar';
import './tokens.css';

/* Barra de desplazamiento controlada: envuelve el custom element `<sv-grid-scrollbar>`.
 * Recibe la posición y avisa del valor deseado; quien la usa decide si lo aplica.
 *
 *   <Scrollbar
 *     orientation="vertical"
 *     viewportSize={viewport()}
 *     contentSize={content()}
 *     value={top()}
 *     onScrollChange={setTop}
 *   />
 *
 * El tamaño en el eje principal lo fija el elemento (16 px); el otro eje lo da el contenedor
 * (`class` o `style`). Colores y radio, con las variables `--sg-scrollbar-*` (docs/scrollbar.md).
 */
export type ScrollbarProps = {
	orientation?: 'vertical' | 'horizontal';
	/** Tamaño visible, en px. */
	viewportSize: number;
	/** Tamaño total del contenido, en px. */
	contentSize: number;
	/** Posición actual (scrollTop / scrollLeft), en px. */
	value: number;
	/** Desplazamiento por clic en una flecha, en px. Por defecto 40. */
	step?: number;
	/** Recibe el valor deseado, ya acotado a `[0, contentSize - viewportSize]`. */
	onScrollChange?: (value: number) => void;
	class?: string;
	style?: string;
};

export function Scrollbar(props: ScrollbarProps) {
	const listen = (el: HTMLElement) => {
		el.addEventListener('scroll-change', (e) => {
			props.onScrollChange?.((e as CustomEvent<{ value: number }>).detail.value);
		});
	};
	return (
		<sv-grid-scrollbar
			ref={listen}
			class={props.class}
			style={props.style}
			orientation={props.orientation ?? 'vertical'}
			viewport-size={props.viewportSize}
			content-size={props.contentSize}
			value={props.value}
			step={props.step}
		/>
	);
}
