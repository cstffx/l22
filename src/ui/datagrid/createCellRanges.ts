import { createEffect, createMemo, createProjection, createSignal } from 'solid-js';
import type { RowData } from '../../grid/core';
import type { ColumnLayout } from './createColumnLayout';
import type { GridModel } from './createGridModel';
import type { Merges } from './createMerges';
import type { Virtualization } from './createVirtualization';
import { expandRectToMerges } from './merges';
import type { MergeIndex } from './merges';
import type { Settings } from './settings';
import type { CellRangeTuple, DataGridApi, DataGridProps, GridCellCoords, GridSelectedRange } from './types';

/**
 * Selección de celdas con el modelo de SvGrid (ancla + foco por rango, el último es el activo).
 * Cada rango se dibuja como un div absoluto dentro de su celda superior izquierda, no con estilos por celda:
 * así no hay costuras ni líneas discontinuas. Un rango se parte en un div por zona (ancladas izq. / centro /
 * ancladas der.), porque las ancladas son sticky y se mueven distinto al hacer scroll; los lados partidos van
 * abiertos. Si la esquina real no está pintada (virtualización), el host es la primera celda pintada del tramo
 * y el div se desplaza hacia atrás hasta la esquina real.
 * Con celdas combinadas (`mergedCells`) el rectángulo crece hasta contener combinaciones enteras al pintarlo, al
 * informarlo (`getSelected`, `onCellSelectionChange`) y al elegir la celda host; el ancla y el foco guardados no cambian.
 */
type Sel = { anchor: GridCellCoords; focus: GridCellCoords };
export type RangeBox = { left: number; top: number; width: number; height: number; openLeft: boolean; openRight: boolean };

const toTuple = (s: Sel): CellRangeTuple => [
	Math.min(s.anchor.row, s.focus.row),
	Math.min(s.anchor.col, s.focus.col),
	Math.max(s.anchor.row, s.focus.row),
	Math.max(s.anchor.col, s.focus.col),
];
/** El rectángulo normalizado, crecido a las combinaciones que toca (si las hay). */
const toRect = (s: Sel, merges: MergeIndex | null): CellRangeTuple => {
	const [r0, c0, r1, c1] = toTuple(s);
	if (!merges) return [r0, c0, r1, c1];
	const rect = expandRectToMerges(merges, { minRow: r0, maxRow: r1, minCol: c0, maxCol: c1 });
	return [rect.minRow, rect.minCol, rect.maxRow, rect.maxCol];
};
const toRange = (s: Sel): GridSelectedRange => ({ from: { ...s.anchor }, to: { ...s.focus }, highlight: { ...s.anchor } });
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));
const EDGE_SPEED = 40;
/** Distancia del puntero fuera de [lo, hi]; 0 si está dentro. */
const overshoot = (v: number, lo: number, hi: number) => {
	if (v < lo) return v - lo;
	return v > hi ? v - hi : 0;
};
const edgeStep = (delta: number) => Math.sign(delta) * Math.min(EDGE_SPEED, Math.abs(delta) / 3 + 2);

export function createCellRanges<TData extends RowData>(
	props: DataGridProps<TData>,
	s: Settings,
	model: GridModel<TData>,
	layout: ColumnLayout<TData>,
	virt: Virtualization<TData>,
	merges: Merges,
) {
	const enabled = () => props.enableCellSelection ?? true;
	const [ranges, setRanges] = createSignal<Sel[]>([]);
	/* Espejo síncrono: los manejadores y el API leen aquí, no el signal (que se actualiza al vaciar la cola). */
	let current: Sel[] = [];
	const commit = (next: Sel[]) => {
		current = next;
		setRanges(next);
	};
	const replaceLast = (focus: GridCellCoords) => {
		const last = current.at(-1);
		if (last) commit([...current.slice(0, -1), { anchor: last.anchor, focus }]);
	};

	let notified = false;
	createEffect(
		() => ranges(),
		(list) => {
			if (list.length === 0 && !notified) return;
			notified = true;
			const index = merges.index();
			props.onCellSelectionChange?.(list.map((sel) => toRect(sel, index)));
		},
	);
	/* Los índices dejan de valer si cambia el orden de filas o de columnas. */
	createEffect(
		() => [model.sortKey(), layout.pinning()],
		() => {
			if (current.length) commit([]);
		},
	);

	const api: Pick<DataGridApi, 'selectCells' | 'getSelected' | 'getSelectedLast' | 'getSelectedRange' | 'getSelectedRangeLast'> = {
		selectCells: (list) =>
			commit(
				list
					.filter(([r0, c0, r1, c1]) => Math.min(r0, c0, r1, c1) >= 0)
					.map(([r0, c0, r1, c1]) => ({ anchor: { row: r0, col: c0 }, focus: { row: r1, col: c1 } })),
			),
		getSelected: () => current.map((sel) => toRect(sel, merges.index())),
		getSelectedLast: () => {
			const last = current.at(-1);
			return last && [last.anchor.row, last.anchor.col, last.focus.row, last.focus.col];
		},
		getSelectedRange: () => (current.length ? current.map(toRange) : undefined),
		getSelectedRangeLast: () => {
			const last = current.at(-1);
			return last && toRange(last);
		},
	};

	/* ── divs de rango, indexados por su celda host "fila:columna" ── */
	const colIndexById = createMemo(() => new Map(layout.displayCols().map((h, i) => [h.id, i])));
	/* Clave numérica (sin crear un string por celda y por evaluación): fila * (columnas + 1) + columna. */
	const hostKey = (row: number, col: number) => row * (layout.displayCols().length + 1) + col;
	const boxes = createMemo(() => {
		const byHost = new Map<number, RangeBox[]>();
		const list = ranges();
		if (list.length === 0) return byHost;
		const o = layout.ordered();
		const cols = layout.displayCols();
		const nL = o.left.length;
		const nC = o.center.length;
		const zones = [
			{ from: 0, to: nL - 1, pinned: true },
			{ from: nL, to: nL + nC - 1, pinned: false },
			{ from: nL + nC, to: cols.length - 1, pinned: true },
		];
		const visibleCenter = new Set(virt.centerWindow().visible);
		const rh = s.rowHeight();
		const mergeIndex = merges.index();
		for (const sel of list) {
			const [r0, c0, r1, c1] = toRect(sel, mergeIndex);
			const hostRow = Math.max(r0, virt.firstRow());
			if (hostRow > r1 || hostRow >= virt.lastRow()) continue;
			for (const zone of zones) {
				const start = Math.max(c0, zone.from);
				const end = Math.min(c1, zone.to);
				let host = start;
				while (host <= end && !zone.pinned && !visibleCenter.has(cols[host])) host += 1;
				if (host > end) continue;
				const offset = layout.sumWidths(cols.slice(start, host));
				const key = hostKey(hostRow, host);
				const box: RangeBox = {
					left: -offset,
					top: -(hostRow - r0) * rh,
					width: offset + layout.sumWidths(cols.slice(host, end + 1)),
					height: (r1 - r0 + 1) * rh,
					openLeft: start > c0,
					openRight: end < c1,
				};
				const bucket = byHost.get(key);
				if (bucket) bucket.push(box);
				else byHost.set(key, [box]);
			}
		}
		return byHost;
	});
	/*
	 * Cada celda lee solo su clave de host (como `editingFlags` con la edición), no el `Map` entero: `boxes` se
	 * recalcula con cada paso de scroll o cambio del rango y entrega un `Map` nuevo, y si las celdas lo leyeran
	 * directamente se reejecutarían todas aunque casi ninguna sea host. Aquí solo cambian las claves que cambian.
	 */
	let hostPrev: number[] = [];
	const hostBoxes = createProjection<Record<number, RangeBox[]>>((draft) => {
		const next = boxes();
		for (const key of hostPrev) if (!next.has(key)) delete draft[key];
		for (const [key, list] of next) draft[key] = list;
		hostPrev = [...next.keys()];
	}, {});
	/* Booleano compartido: sin rangos (lo habitual) las celdas no tocan el proyecto ni crean un nodo por clave. */
	const hasRanges = createMemo(() => ranges().length > 0);
	const boxesAt = (row: number, col: number) => (hasRanges() ? hostBoxes[hostKey(row, col)] : undefined);

	/* ── ratón ── */
	/**
	 * Límites de la zona de la que sale la celda bajo el puntero. Si el rango nació en las columnas centrales y
	 * aún queda contenido central oculto bajo las ancladas de ese lado, el puntero se recorta a la zona central:
	 * sobre una columna anclada se sigue desplazando y eligiendo las centrales. Al llegar al tope de ese lado ya
	 * no hay nada oculto y el puntero puede elegir la propia columna anclada. Si el rango nació en una zona
	 * anclada, todo el ancho cuenta.
	 */
	const dragBounds = (el: HTMLElement, anchorCol: number) => {
		const rect = el.getBoundingClientRect();
		const { left, center, right } = layout.ordered();
		const inCenter = anchorCol >= left.length && anchorCol < left.length + center.length;
		const hiddenLeft = inCenter && el.scrollLeft > 0;
		const hiddenRight = inCenter && el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
		return {
			top: rect.top + s.headerHeight(),
			bottom: rect.top + el.clientHeight - (layout.hasFooter() ? s.rowHeight() : 0),
			left: rect.left + s.sysWidth() + (hiddenLeft ? layout.sumWidths(left) : 0),
			right: rect.left + el.clientWidth - (hiddenRight ? layout.sumWidths(right) : 0),
		};
	};
	/** Seleccionar no activa enlaces: el clic que sigue a un arrastre (o a Shift/Ctrl+clic) se descarta. */
	const swallowNextClick = () => {
		const block = (e: MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
		};
		window.addEventListener('click', block, { capture: true, once: true });
		setTimeout(() => window.removeEventListener('click', block, { capture: true }), 0);
	};
	const dragSelect = (event: PointerEvent, modified: boolean) => {
		const el = virt.scroller();
		const anchorCol = current.at(-1)?.anchor.col;
		if (!el || anchorCol === undefined) return;
		let x = event.clientX;
		let y = event.clientY;
		let frame = 0;
		/* Sin texto seleccionable durante el arrastre, ni siquiera al salir de la tabla. */
		const prevSelect = document.body.style.userSelect;
		document.body.style.userSelect = 'none';
		window.getSelection()?.removeAllRanges();
		const move = (e: PointerEvent) => {
			x = e.clientX;
			y = e.clientY;
		};
		const tick = () => {
			const b = dragBounds(el, anchorCol);
			const dy = overshoot(y, b.top, b.bottom);
			const dx = overshoot(x, b.left, b.right);
			/* Autoscroll en px del DOM (como la rueda): con scaling cada px recorre más lista, pero es el único paso que el navegador no redondea a 0. */
			if (dy) el.scrollTop += edgeStep(dy);
			if (dx) el.scrollLeft += edgeStep(dx);
			const target = document.elementFromPoint(clamp(x, b.left + 1, b.right - 2), clamp(y, b.top + 1, b.bottom - 2))?.closest<HTMLElement>('td[data-c]');
			const last = current.at(-1);
			if (target && last) {
				const focus = { row: Number(target.dataset.r), col: Number(target.dataset.c) };
				if (focus.row !== last.focus.row || focus.col !== last.focus.col) replaceLast(focus);
			}
			frame = requestAnimationFrame(tick);
		};
		const finish = () => {
			cancelAnimationFrame(frame);
			document.body.style.userSelect = prevSelect;
			const last = current.at(-1);
			const moved = !!last && (last.focus.row !== last.anchor.row || last.focus.col !== last.anchor.col);
			if (moved || modified) swallowNextClick();
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', finish);
			window.removeEventListener('pointercancel', finish);
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', finish);
		window.addEventListener('pointercancel', finish);
		frame = requestAnimationFrame(tick);
	};
	/** Clic, Shift+clic (extiende el último), Ctrl/Cmd+clic (añade otro) y arrastre. */
	const onCellPointerDown = (event: PointerEvent, row: number, col: number) => {
		if (!enabled() || event.button !== 0) return;
		if ((event.target as HTMLElement).closest('input, button, label, textarea')) return;
		const point = { row, col };
		if (event.shiftKey && current.length) replaceLast(point);
		else commit([...(event.ctrlKey || event.metaKey ? current : []), { anchor: point, focus: point }]);
		dragSelect(event, event.shiftKey || event.ctrlKey || event.metaKey);
	};
	/** Sin el arrastre nativo de enlaces/imágenes, que cancelaría el arrastre de selección. */
	const onDragStart = (event: DragEvent) => {
		if (enabled()) event.preventDefault();
	};
	const onKeyDown = (event: KeyboardEvent) => {
		if (enabled() && event.key === 'Escape' && current.length) commit([]);
	};

	return { enabled, api, colIndexById, boxesAt, onCellPointerDown, onDragStart, onKeyDown };
}
export type CellRanges = ReturnType<typeof createCellRanges>;
