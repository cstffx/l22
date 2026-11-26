import { createSignal, For, onCleanup, Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import './tokens.css';
import './flowchart.css';

/* Lienzo de flujo con nodos arrastrables y conectores que los siguen.
 *
 *   <FlowChart
 *     nodes={[
 *       { id: 'a', x: 120, y: 24, badge: { label: 'Trigger', hue: '#9a5cff' }, title: 'Nuevo pedido' },
 *       { id: 'b', x: 120, y: 190, badge: { label: 'If / Else' }, title: 'Condición' },
 *     ]}
 *     edges={[{ from: 'a', to: 'b' }]}
 *   />
 */

export type FlowBadge = {
	label: string;
	/** Color CSS del badge (por defecto `var(--accent)`). */
	hue?: string;
};

export type FlowNode = {
	id: string;
	/** Posición inicial (px) de la esquina superior izquierda, badge incluido. */
	x: number;
	y: number;
	/** Ancho en px (por defecto 300). */
	width?: number;
	/** Etiqueta sobre la tarjeta. */
	badge?: FlowBadge;
	/** Color CSS del ícono del nodo por defecto (si no, el del badge). */
	hue?: string;
	icon?: JSX.Element;
	title?: string;
	description?: string;
	/** Cuerpo propio: reemplaza al ícono + título + descripción. */
	content?: JSX.Element;
};

export type FlowEdge = {
	from: string;
	to: string;
	/** Flecha en el extremo de destino; si se omite, manda `arrows` del lienzo. */
	arrow?: boolean;
};

export type FlowChartProps = {
	nodes: FlowNode[];
	edges?: FlowEdge[];
	/** Flecha en todos los conectores (cada `edge.arrow` puede sobrescribirla). */
	arrows?: boolean;
	/** Alto del lienzo en px (por defecto 420). */
	height?: number;
	/** Id seleccionado (controlado). Sin esta prop el componente lleva su propio estado. */
	selected?: string | null;
	onSelectedChange?: (id: string | null) => void;
	/** Se llama al terminar de arrastrar un nodo. */
	onNodeMove?: (id: string, x: number, y: number) => void;
	class?: string;
};

const DEFAULT_WIDTH = 300;
const EST_HEIGHT = 90;
const BADGE_OFFSET = 30; // badge (24) + gap (6) sobre la tarjeta
const MARGIN = 8;
const DRAG_THRESHOLD = 3;
const ARROW_W = 5; // medio ancho de la punta
const ARROW_H = 9;

type Point = { x: number; y: number };
type DragState = { id: string; startX: number; startY: number; base: Point; moved: boolean };

export function FlowChart(props: FlowChartProps) {
	let canvas: HTMLDivElement | undefined;
	const els = new Map<string, HTMLElement>();
	const [size, setSize] = createSignal({ w: 0, h: 0 });
	const [heights, setHeights] = createSignal<Record<string, number>>({});
	const [moved, setMoved] = createSignal<Record<string, Point>>({});
	const [innerSelected, setInnerSelected] = createSignal<string | null>(null);
	const [hoveredEdge, setHoveredEdge] = createSignal<string | null>(null);
	const [dragging, setDragging] = createSignal<string | null>(null);
	let drag: DragState | null = null;

	const selected = () => (props.selected !== undefined ? props.selected : innerSelected());
	const select = (id: string | null) => {
		setInnerSelected(id);
		props.onSelectedChange?.(id);
	};

	const canvasHeight = () => props.height ?? 420;

	/* medición de lienzo y nodos */
	const measure = () => {
		if (!canvas) return;
		setSize({ w: canvas.clientWidth, h: canvas.clientHeight });
		setHeights((prev) => {
			const next = { ...prev };
			let changed = false;
			els.forEach((el, id) => {
				/* `onCleanup` no vale dentro de un `ref`: se descartan aquí los nodos desmontados */
				if (!el.isConnected) {
					els.delete(id);
					observer.unobserve(el);
					return;
				}
				const h = el.offsetHeight;
				if (h && Math.abs(h - (next[id] ?? 0)) > 0.5) {
					next[id] = h;
					changed = true;
				}
			});
			return changed ? next : prev;
		});
	};
	const observer = new ResizeObserver(measure);
	onCleanup(() => observer.disconnect());

	const registerNode = (id: string, el: HTMLElement) => {
		els.set(id, el);
		observer.observe(el);
	};

	const widthOf = (n: FlowNode) => n.width ?? DEFAULT_WIDTH;
	const heightOf = (id: string) => heights()[id] ?? EST_HEIGHT;
	const posOf = (n: FlowNode): Point => moved()[n.id] ?? { x: n.x, y: n.y };

	/* anclas: la de entrada baja de la tarjeta (el badge queda fuera) */
	const bottomOf = (n: FlowNode): Point => {
		const p = posOf(n);
		return { x: p.x + widthOf(n) / 2, y: p.y + heightOf(n.id) };
	};
	const topOf = (n: FlowNode): Point => {
		const p = posOf(n);
		return { x: p.x + widthOf(n) / 2, y: p.y + (n.badge ? BADGE_OFFSET : 0) };
	};

	const path = (edge: FlowEdge) => {
		const a = props.nodes.find((n) => n.id === edge.from);
		const b = props.nodes.find((n) => n.id === edge.to);
		if (!a || !b) return '';
		const from = bottomOf(a);
		const to = topOf(b);
		const k = Math.min(Math.max(Math.abs(to.y - from.y) * 0.55, 24), 84);
		return `M ${from.x} ${from.y} C ${from.x} ${from.y + k}, ${to.x} ${to.y - k}, ${to.x} ${to.y}`;
	};

	const edgeKey = (edge: FlowEdge) => `${edge.from}->${edge.to}`;
	/* con la flecha fija manda `arrow`/`arrows`; si no, aparece al pasar el cursor */
	const hasArrow = (edge: FlowEdge) => (edge.arrow ?? props.arrows ?? false) || hoveredEdge() === edgeKey(edge);
	const edgeState = (edge: FlowEdge) => {
		if (lit(edge)) return 'lit';
		return hoveredEdge() === edgeKey(edge) ? 'hover' : 'idle';
	};
	/* punta del conector: el trazo siempre entra en vertical, así que apunta hacia abajo */
	const arrowhead = (edge: FlowEdge) => {
		const b = props.nodes.find((n) => n.id === edge.to);
		if (!b) return '';
		const { x, y } = topOf(b);
		return `M ${x - ARROW_W} ${y - ARROW_H} L ${x} ${y} L ${x + ARROW_W} ${y - ARROW_H} Z`;
	};
	const lit = (edge: FlowEdge) => selected() === edge.from || selected() === edge.to;

	/* arrastre */
	const onPointerDown = (node: FlowNode, e: PointerEvent & { currentTarget: HTMLElement }) => {
		if (e.button !== 0 || (e.target as Element).closest('[data-no-drag]')) return;
		drag = { id: node.id, startX: e.clientX, startY: e.clientY, base: posOf(node), moved: false };
		e.currentTarget.setPointerCapture(e.pointerId);
	};

	const onPointerMove = (node: FlowNode, e: PointerEvent) => {
		if (!drag || drag.id !== node.id) return;
		const dx = e.clientX - drag.startX;
		const dy = e.clientY - drag.startY;
		if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
		if (!drag.moved) {
			drag.moved = true;
			setDragging(node.id);
		}
		const { w, h } = size();
		const maxX = Math.max(MARGIN, w - widthOf(node) - MARGIN);
		const maxY = Math.max(MARGIN, h - heightOf(node.id) - MARGIN);
		const x = Math.min(Math.max(drag.base.x + dx, MARGIN), maxX);
		const y = Math.min(Math.max(drag.base.y + dy, MARGIN), maxY);
		setMoved((cur) => ({ ...cur, [node.id]: { x, y } }));
	};

	const onPointerUp = (node: FlowNode) => {
		if (drag?.id !== node.id) return;
		const wasMoved = drag.moved;
		drag = null;
		setDragging(null);
		if (wasMoved) {
			/* el `click` posterior al arrastre no debe alternar la selección */
			suppressClick = node.id;
			setTimeout(() => (suppressClick = null), 0);
			const p = moved()[node.id];
			if (p) props.onNodeMove?.(node.id, p.x, p.y);
		}
	};

	let suppressClick: string | null = null;
	const toggle = (id: string) => {
		if (suppressClick === id) return;
		select(selected() === id ? null : id);
	};

	return (
		<div
			ref={(el) => {
				canvas = el;
				observer.observe(el);
				measure();
			}}
			class={cx('ui-flow', props.class)}
			style={{ height: `${canvasHeight()}px` }}
		>
			<svg class="ui-flow-edges" width={size().w} height={size().h} aria-hidden="true">
				<For each={props.edges ?? []}>
					{(edge) => (
						<>
							<path
								d={path(edge)}
								class="ui-flow-edge"
								data-state={edgeState(edge)}
							/>
							<Show when={hasArrow(edge)}>
								<path d={arrowhead(edge)} class="ui-flow-arrowhead" data-state={edgeState(edge)} />
							</Show>
							{/* zona de impacto ancha e invisible para el hover */}
							<path
								d={path(edge)}
								class="ui-flow-hit"
								onPointerEnter={() => setHoveredEdge(edgeKey(edge))}
								onPointerLeave={() => setHoveredEdge(null)}
							/>
						</>
					)}
				</For>
			</svg>

			<For each={props.nodes}>
				{(node) => (
					<div
						ref={(el) => registerNode(node.id, el)}
						class="ui-flow-node"
						data-dragging={dragging() === node.id ? '' : undefined}
						style={{
							left: `${posOf(node).x}px`,
							top: `${posOf(node).y}px`,
							width: `${widthOf(node)}px`,
							'--flow-hue': node.hue ?? node.badge?.hue ?? 'var(--accent)',
							'--flow-badge': node.badge?.hue ?? 'var(--accent)',
						}}
						onPointerDown={(e) => onPointerDown(node, e)}
						onPointerMove={(e) => onPointerMove(node, e)}
						onPointerUp={() => onPointerUp(node)}
						onPointerCancel={() => onPointerUp(node)}
					>
						<Show when={node.badge}>{(badge) => <span class="ui-flow-badge">{badge().label}</span>}</Show>
						<div
							class="ui-flow-card"
							role="button"
							tabindex="0"
							aria-pressed={selected() === node.id ? 'true' : 'false'}
							onClick={(e) => {
								if (!(e.target as Element).closest('[data-no-drag]')) toggle(node.id);
							}}
							onKeyDown={(e) => {
								if (e.target !== e.currentTarget) return;
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									toggle(node.id);
								}
							}}
						>
							<Show
								when={node.content}
								fallback={
									<div class="ui-flow-body">
										<Show when={node.icon}>
											<span class="ui-flow-icon">{node.icon}</span>
										</Show>
										<span class="ui-flow-text">
											<span class="ui-flow-title">{node.title}</span>
											<Show when={node.description}>
												<span class="ui-flow-desc">{node.description}</span>
											</Show>
										</span>
									</div>
								}
							>
								{node.content}
							</Show>
						</div>
					</div>
				)}
			</For>
		</div>
	);
}
