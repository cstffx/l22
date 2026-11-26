import { createSignal } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import './tokens.css';
import './glide.css';

export type GlideProps = {
	children?: JSX.Element;
	class?: string;
	/** Clase extra para la capa de resaltado (color, radio, márgenes). */
	highlightClass?: string;
	/** Selector de las filas interactivas. */
	rowSelector?: string;
};

const DEFAULT_ROWS = "[data-glide-row], [role^='menuitem']";

/** Una sola capa de hover que se desliza entre las filas interactivas (GlideMenu de beautiful-ui). */
export function Glide(props: GlideProps) {
	let container!: HTMLDivElement;
	const [box, setBox] = createSignal<{ top: number; height: number } | null>(null);
	const [visible, setVisible] = createSignal(false);

	const moveTo = (target: EventTarget | null) => {
		if (!(target instanceof Element)) return;
		const row = target.closest(props.rowSelector ?? DEFAULT_ROWS);
		if (!(row instanceof HTMLElement) || !container.contains(row)) return;
		const c = container.getBoundingClientRect();
		const r = row.getBoundingClientRect();
		setBox({ top: r.top - c.top, height: r.height });
		setVisible(true);
	};

	return (
		<div
			ref={container}
			class={cx('ui-glide', props.class)}
			onMouseOver={(e) => moveTo(e.target)}
			onMouseLeave={() => setVisible(false)}
			onFocusIn={(e) => moveTo(e.target)}
			onFocusOut={(e) => {
				if (!container.contains(e.relatedTarget as Node | null)) setVisible(false);
			}}
		>
			<span
				aria-hidden="true"
				class={cx('ui-glide-highlight', props.highlightClass)}
				style={{
					top: `${box()?.top ?? 0}px`,
					height: `${box()?.height ?? 0}px`,
					opacity: box() && visible() ? 1 : 0,
				}}
			/>
			{props.children}
		</div>
	);
}
