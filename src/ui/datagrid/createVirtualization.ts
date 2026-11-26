import { createMemo, createSignal, onCleanup } from 'solid-js';
import type { Header, Row, RowData } from '../../grid/core';
import { COLUMN_WINDOW_STEP, DEFAULT_COLUMN_OVERSCAN, DEFAULT_CONTAINER_HEIGHT, DEFAULT_ROW_OVERSCAN, MAX_DOM_DETECT_FROM, MOUNT_ROW_OVERSCAN } from './constants';
import { assignColumnSlots, emptyColumnSlots } from './columnSlots';
import type { ColumnSlotState } from './columnSlots';
import { computeColumnWindow } from './columnWindow';
import type { ColumnWindowState } from './columnWindow';
import type { ColumnLayout } from './createColumnLayout';
import type { GridModel } from './createGridModel';
import { createRowScrollScaling, maxDomHeightFor } from './scrollScaling';
import type { Settings } from './settings';
import { sameSlot } from './types';
import type { DataGridProps, PinSide, Slot } from './types';

/** Scroll, ventana de filas y columnas pintadas y la lista de celdas de cada fila. */
export function createVirtualization<TData extends RowData>(props: DataGridProps<TData>, s: Settings, model: GridModel<TData>, layout: ColumnLayout<TData>) {
	const { rows, columnsVersion } = model;
	const { ordered, widthOf } = layout;

	const EMPTY_VIEW = { top: 0, left: 0, width: 0, height: 0, scrollWidth: 0, scrollHeight: 0 };
	type View = typeof EMPTY_VIEW;
	const [viewport, setViewport] = createSignal<View>(EMPTY_VIEW);
	const sameView = (a: View, b: View) =>
		a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height && a.scrollWidth === b.scrollWidth && a.scrollHeight === b.scrollHeight;
	/*
	 * `viewport` sigue al scroll en cada frame (lo leen las barras propias). Lo que se pinta —ventana de filas y de
	 * columnas— lee `drawn`: con `scrollSettleDelay` > 0 solo se actualiza cuando el scroll lleva ese tiempo quieto,
	 * así un arrastre largo no pinta filas que se van a descartar al instante. Un cambio de tamaño se aplica al momento.
	 */
	const [drawn, setDrawn] = createSignal<View>(EMPTY_VIEW);
	let drawnNow = EMPTY_VIEW;
	/* Hay scroll sin pintar: el cuerpo muestra un esqueleto donde aún no hay filas ni columnas. */
	const [settling, setSettling] = createSignal(false);
	let settleTimer: ReturnType<typeof setTimeout> | undefined;
	/* Sentido y distancia (px) del último desplazamiento vertical pintado: adelanta la ventana (overscanLead). */
	let lastDy = 0;
	let drawnLogical = 0;

	const containerHeight = () => props.containerHeight ?? DEFAULT_CONTAINER_HEIGHT;
	const containerHeightCss = () => (typeof containerHeight() === 'number' ? `${containerHeight()}px` : (containerHeight() as string));
	const numericHeight = () => (typeof containerHeight() === 'number' ? (containerHeight() as number) : DEFAULT_CONTAINER_HEIGHT);

	/*
	 * Scroll scaling: con una altura total (filas × alto de fila) mayor que el tope del navegador el DOM usa una altura
	 * acotada y `drawn().top` (y `viewport().top`, `scrollHeight`) están en el espacio DOM. La virtualización trabaja en
	 * el espacio lógico (el de la lista real): `logicalTop` convierte el `scrollTop` ya confirmado (`drawn`). Por debajo
	 * del tope la conversión es la identidad y nada de esto cuesta más que una comparación. Se asume una sola fila de
	 * cabecera (`headerHeight`) y un pie de una fila (`rowHeight`): el alto visible de las filas es el del área menos ambos.
	 */
	const rowCount = createMemo(() => rows().length);
	const chromeHeight = () => s.headerHeight() + (layout.hasFooter() ? s.rowHeight() : 0);
	const trueTotal = () => rowCount() * s.rowHeight();
	const scalingFor = (viewHeight: number) => createRowScrollScaling(trueTotal(), maxDomHeightFor(trueTotal()), viewHeight - chromeHeight());
	const viewH = createMemo(() => drawn().height || numericHeight());
	const scaling = createMemo(() => scalingFor(viewH()));
	const logicalTop = createMemo(() => scaling().domToLogical(drawn().top));
	/* Desplazamiento lógico de una vista aún no confirmada (la de `commitDrawn`), con su propio alto. */
	const toLogical = (v: View) => (trueTotal() <= MAX_DOM_DETECT_FROM ? v.top : scalingFor(v.height || numericHeight()).domToLogical(v.top));
	/*
	 * px que hay que desplazar las filas lógicas para caer en el espacio DOM acotado (0 sin scaling). Sale del
	 * desplazamiento ya confirmado (`logicalTop`), no del `scrollTop` vivo: espaciadores y ventana salen del mismo
	 * estado y no pueden desfasarse un frame. Redondeado a px enteros para que las filas no caigan en medio píxel.
	 */
	const rowAdjust = createMemo(() => {
		const sc = scaling();
		if (!sc.active) return 0;
		const logical = logicalTop();
		return Math.round(logical - sc.logicalToDom(logical));
	});
	/* Escala del paso de las flechas de la barra: una fila lógica por clic aunque 1 px del DOM valga más de 1 px de lista. */
	const verticalStep = () => {
		const sc = scaling();
		const rowH = s.rowHeight();
		if (!sc.active) return rowH;
		const vp = viewH() - chromeHeight();
		return Math.max(1, (rowH * Math.max(0, sc.domTotal - vp)) / Math.max(1, trueTotal() - vp));
	};

	const commitDrawn = (v: View) => {
		clearTimeout(settleTimer);
		/* Sentido y salto se miden en espacio lógico: con scaling, 1 px del DOM son varios de lista. */
		const logical = toLogical(v);
		if (logical !== drawnLogical) lastDy = logical - drawnLogical;
		/* Salto de al menos una ventana: todas las filas son nuevas, así que se pinta primero lo visible y el overscan llega después. */
		if (drawnNow.height > 0 && Math.abs(logical - drawnLogical) >= drawnNow.height) {
			setFullOverscan(false);
			restoreFullOverscan();
		}
		drawnNow = v;
		drawnLogical = logical;
		setDrawn(v);
		setSettling(false);
	};
	const scheduleDrawn = (next: View) => {
		const delay = props.scrollSettleDelay ?? 0;
		const resized = next.width !== drawnNow.width || next.height !== drawnNow.height || next.scrollWidth !== drawnNow.scrollWidth || next.scrollHeight !== drawnNow.scrollHeight;
		if (delay <= 0 || resized || drawnNow.height === 0) return commitDrawn(next);
		clearTimeout(settleTimer);
		if (next.top === drawnNow.top && next.left === drawnNow.left) return setSettling(false);
		setSettling(true);
		settleTimer = setTimeout(() => commitDrawn(next), delay);
	};
	onCleanup(() => clearTimeout(settleTimer));
	const applyViewport = (el: HTMLElement) => {
		const next: View = { top: el.scrollTop, left: el.scrollLeft, width: el.clientWidth, height: el.clientHeight, scrollWidth: el.scrollWidth, scrollHeight: el.scrollHeight };
		setViewport((v) => (sameView(v, next) ? v : next));
		scheduleDrawn(next);
	};
	/* Un solo cálculo por frame, sin importar cuántos eventos de scroll lleguen. */
	let scrollFrame = 0;
	const measureViewport = (el: HTMLElement) => {
		if (scrollFrame) return;
		scrollFrame = requestAnimationFrame(() => {
			scrollFrame = 0;
			applyViewport(el);
		});
	};
	onCleanup(() => cancelAnimationFrame(scrollFrame));
	/* Se observan el área con scroll y la tabla: el tamaño del contenido cambia sin que el área cambie. */
	const viewportObserver = new ResizeObserver(() => scroller && applyViewport(scroller));
	onCleanup(() => viewportObserver.disconnect());
	let scroller: HTMLDivElement | undefined;
	/*
	 * Primer pintado: solo las filas visibles más MOUNT_ROW_OVERSCAN; el resto del overscan llega dos frames después. Con un
	 * solo frame, el rAF se ejecuta antes del primer pintado y las filas añadidas lo retrasarían.
	 */
	const [fullOverscan, setFullOverscan] = createSignal(false);
	const mountFrames: number[] = [];
	/* Cancela los frames pendientes y vuelve a programar el overscan completo (primer pintado y saltos lejanos). */
	const restoreFullOverscan = () => {
		mountFrames.forEach(cancelAnimationFrame);
		mountFrames[0] = requestAnimationFrame(() => {
			mountFrames[1] = requestAnimationFrame(() => setFullOverscan(true));
		});
	};
	onCleanup(() => mountFrames.forEach(cancelAnimationFrame));
	const bindScroller = (el: HTMLDivElement) => {
		scroller = el;
		restoreFullOverscan();
		queueMicrotask(() => {
			viewportObserver.observe(el);
			applyViewport(el);
		});
	};
	const bindTable = (el: HTMLTableElement) => queueMicrotask(() => viewportObserver.observe(el));
	/*
	 * Las barras propias (Scrollbar) mueven el área con scroll; el resto del scroll sigue siendo nativo. Las barras hablan
	 * en espacio DOM (`viewport()`: top, height y scrollHeight son los del área con scroll, ya acotados), igual que una
	 * barra nativa, así que `value` es un `scrollTop` del DOM y no se convierte; la conversión a lista la hace `logicalTop`.
	 */
	const scrollTo = (axis: 'top' | 'left', value: number) => {
		if (!scroller) return;
		if (axis === 'top') scroller.scrollTop = value;
		else scroller.scrollLeft = value;
	};
	/* Con 1px de margen para no mostrar una barra por redondeos. */
	const overflowY = () => viewport().scrollHeight > viewport().height + 1;
	const overflowX = () => viewport().scrollWidth > viewport().width + 1;

	const overscan = () => {
		const full = props.overscan ?? DEFAULT_ROW_OVERSCAN;
		return fullOverscan() ? full : Math.min(MOUNT_ROW_OVERSCAN, full);
	};
	/*
	 * Overscan con ventaja (`overscanLead`): un scroll más rápido de lo que cubre el overscan mueve filas de detrás hacia
	 * delante, y la ventana conserva su largo. Si el compositor pinta un frame antes de que existan las filas, aún
	 * encuentra filas debajo. Se recalcula con cada ventana pintada (`drawn`), que es cuando cambia el sentido.
	 */
	const rowOverscan = createMemo(() => {
		drawn();
		const ahead = overscan();
		if (props.overscanLead === false || lastDy === 0) return { before: ahead, after: ahead };
		const shift = Math.max(Math.min(Math.ceil(Math.abs(lastDy) / s.rowHeight()) + 1 - ahead, ahead - 2), 0);
		const near = ahead - shift;
		return { before: lastDy > 0 ? near : ahead + shift, after: lastDy < 0 ? near : ahead + shift };
	});

	/* Índices como memos de número: solo se re-renderiza al cruzar un límite de fila. */
	const firstRow = createMemo(() => Math.max(0, Math.floor(logicalTop() / s.rowHeight()) - rowOverscan().before));
	const lastRow = createMemo(() =>
		Math.min(rowCount(), Math.ceil((logicalTop() + viewH()) / s.rowHeight()) + rowOverscan().after),
	);
	/*
	 * Alto (px) de los espaciadores de arriba y abajo. Sin scaling son filas × alto de fila; con scaling suman la altura
	 * DOM acotada (`domTotal`) y se desplazan con `rowAdjust`, para que la fila `firstRow` quede donde el DOM la espera.
	 */
	const topSpace = () => Math.max(0, firstRow() * s.rowHeight() - rowAdjust());
	const bottomSpace = () => {
		const sc = scaling();
		if (!sc.active) return (rowCount() - lastRow()) * s.rowHeight();
		return Math.max(0, sc.domTotal - lastRow() * s.rowHeight() + rowAdjust());
	};
	/* Mismo contenido, misma referencia: un recálculo de `rows()` con las mismas filas no vuelve a recorrer el `<For>`. */
	const visibleRows = createMemo(() => rows().slice(firstRow(), lastRow()), {
		equals: (a, b) => a.length === b.length && a.every((row, i) => row === b[i]),
	});

	/*
	 * Reciclaje de filas (`recycleRows`): cada <tr> pintado es un "slot" con id estable. Al hacer scroll, el slot de una
	 * fila que sale se reasigna a la fila que entra, en vez de destruirla y crear otra: solo cambia el contenido, y el
	 * <For> mueve el nodo a su sitio (el DOM sigue en orden de fila, así que la tabla y la accesibilidad no cambian).
	 * Un slot cuya fila no cambió conserva su objeto, y con él sus celdas sin tocar. Lo que se lleva es estado privado
	 * del memo (no una señal), por eso no hay escrituras reactivas.
	 */
	type RowSlot = { id: number; index: number; row: Row<TData> };
	let slotSeq = 0;
	let slotsPrev: RowSlot[] = [];
	const rowSlots = createMemo<RowSlot[]>(() => {
		const list = rows();
		const from = firstRow();
		const to = Math.min(lastRow(), list.length);
		const byIndex = new Map<number, RowSlot>();
		const free: RowSlot[] = [];
		for (const slot of slotsPrev) {
			if (slot.index >= from && slot.index < to) byIndex.set(slot.index, slot);
			else free.push(slot);
		}
		const out: RowSlot[] = [];
		for (let i = from; i < to; i += 1) {
			const row = list[i]!;
			const held = byIndex.get(i);
			if (held) out.push(held.row === row ? held : { id: held.id, index: i, row });
			else out.push({ id: free.pop()?.id ?? ++slotSeq, index: i, row });
		}
		slotsPrev = out;
		return out;
	});

	/* Ventana de las columnas centrales; las ancladas se pintan siempre. La ventana anterior es estado privado del memo (no una señal). */
	let winPrev: ColumnWindowState | null = null;
	let winCenter: Array<Header<TData>> = [];
	const centerWindow = createMemo(
		() => {
			const { center } = ordered();
			if (props.columnVirtualization === false) return { visible: center, before: 0, after: 0 };
			const { left, width } = drawn();
			// Otra lista de columnas centrales (orden, anclado, versión): la ventana empieza de cero.
			if (center.length !== winCenter.length || center.some((h, i) => h !== winCenter[i])) winPrev = null;
			winCenter = center;
			const widths = center.map(widthOf);
			winPrev = computeColumnWindow(widths, left, width || 1200, Math.max(props.columnOverscan ?? DEFAULT_COLUMN_OVERSCAN, 0), COLUMN_WINDOW_STEP, winPrev);
			const { first, last } = winPrev;
			let before = 0;
			let after = 0;
			for (let i = 0; i < widths.length; i += 1) {
				if (i < first) before += widths[i]!;
				else if (i > last) after += widths[i]!;
			}
			const visible = center.slice(first, last + 1);
			return { visible, before, after };
		},
		{ equals: (a, b) => a.before === b.before && a.after === b.after && a.visible.length === b.visible.length && a.visible.every((h, i) => h === b.visible[i]) },
	);

	/*
	 * Los slots se reutilizan por referencia: si el scroll horizontal creara objetos nuevos para columnas que siguen
	 * visibles, cambiarían de identidad y se recrearía su celda.
	 *
	 * Reciclaje de columnas centrales (como svgrid): en el cuerpo, cada `<td>` central es de un slot con `id` numérico
	 * estable. Una columna que sigue en la ventana conserva slot y `<td>`; una que entra toma el slot de una que salió
	 * (`assignColumnSlots`), así que un salto lejano actualiza las celdas en su sitio en vez de recrearlas. Quedan con
	 * identidad por columna (sin `id`): las ancladas, la columna del árbol (su celda es otra rama, `TreeCell`), los
	 * huecos y `sys`; y no se recicla sin virtualización de columnas ni con `mergedCells` (el `<td>` combinado depende
	 * de su columna y de sus vecinas). La cabecera y el pie leen la misma lista pero no reciclan: su <For> no es
	 * keyed, un slot con otra columna es otro objeto y se recrea su celda (una por columna, con ordenación y
	 * redimensionado atados a ella). El estado entre ventanas es privado del memo (no es una señal).
	 */
	const SYS: Slot<TData> = { kind: 'sys' };
	const GAP_BEFORE: Slot<TData> = { kind: 'gap', side: 'before' };
	const GAP_AFTER: Slot<TData> = { kind: 'gap', side: 'after' };
	const colSlots = new WeakMap<Header<TData>, Slot<TData>>();
	const colSlot = (header: Header<TData>, pin: PinSide | null, version: number): Slot<TData> => {
		const known = colSlots.get(header);
		if (known && sameSlot(known, { kind: 'col', header, pin, version })) return known;
		const slot: Slot<TData> = { kind: 'col', header, pin, version };
		colSlots.set(header, slot);
		return slot;
	};
	/** Columna del árbol (si hay `treeData`): la primera columna visible salvo que se indique otra. */
	const treeColumnId = () => (props.treeData ? (props.treeData.column ?? layout.leafHeaders()[0]?.id) : undefined);
	let colSeq = 0;
	let colPrev: ColumnSlotState<Header<TData>> = emptyColumnSlots();
	let colObjects = new Map<number, Slot<TData>>();
	const slots = createMemo<Array<Slot<TData>>>(
		() => {
			const { left, right } = ordered();
			const version = columnsVersion();
			const visible = centerWindow().visible;
			const recycle = props.columnVirtualization !== false && !props.mergedCells?.length;
			const treeId = recycle ? treeColumnId() : undefined;
			colPrev = recycle ? assignColumnSlots(colPrev, visible.filter((h) => h.id !== treeId), () => ++colSeq) : emptyColumnSlots();
			const { entries } = colPrev;
			const objects = new Map<number, Slot<TData>>();
			const byHeader = new Map<Header<TData>, Slot<TData>>();
			for (const { id, header } of entries) {
				const held = colObjects.get(id);
				const slot: Slot<TData> = held && held.kind === 'col' && held.header === header && held.version === version ? held : { kind: 'col', header, pin: null, version, id };
				objects.set(id, slot);
				byHeader.set(header, slot);
			}
			colObjects = objects;
			const out: Array<Slot<TData>> = [];
			if (s.sysWidth() > 0) out.push(SYS);
			for (const header of left) out.push(colSlot(header, 'left', version));
			out.push(GAP_BEFORE);
			for (const header of visible) out.push(byHeader.get(header) ?? colSlot(header, null, version));
			out.push(GAP_AFTER);
			for (const header of right) out.push(colSlot(header, 'right', version));
			return out;
		},
		{ equals: (a, b) => a.length === b.length && a.every((slot, i) => sameSlot(slot, b[i])) },
	);
	/** Clave de un slot para el <For keyed> del cuerpo: el `id` si es reciclable, y si no el propio objeto (una celda por columna). */
	const slotKey = (slot: Slot<TData>): unknown => (slot.kind === 'col' && slot.id !== undefined ? slot.id : slot);
	/*
	 * Esqueleto por columna: una máscara SVG de una fila de alto, con una barra de esquinas redondeadas por columna, en las
	 * coordenadas de la tabla entera (columna de sistema + ancladas izq. + centrales + ancladas der.). El CSS la repite en
	 * vertical. Solo se calcula mientras hay scroll sin pintar y se recalcula si cambian los anchos o el alto de fila.
	 */
	const SKELETON_PAD = 12;
	const SKELETON_RADIUS = 8;
	const skeleton = createMemo(() => {
		const { left, center, right } = ordered();
		const h = s.rowHeight();
		const barY = Math.round(h * 0.2);
		const barH = Math.round(h * 0.6);
		let x = s.sysWidth();
		let rects = '';
		for (const header of [...left, ...center, ...right]) {
			const w = widthOf(header);
			if (w > SKELETON_PAD * 2) rects += `<rect x="${x + SKELETON_PAD}" y="${barY}" width="${w - SKELETON_PAD * 2}" height="${barH}" rx="${SKELETON_RADIUS}"/>`;
			x += w;
		}
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${h}">${rects}</svg>`;
		return { '--dg-skel-mask': `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, '--dg-skel-w': `${x}px`, '--dg-skel-h': `${h}px` };
	});
	/** Posición x, en la tabla, donde empieza cada hueco de columnas sin pintar. */
	const gapX = (side: 'before' | 'after') => {
		const before = s.sysWidth() + layout.sumWidths(ordered().left);
		return side === 'before' ? before : before + centerWindow().before + layout.sumWidths(centerWindow().visible);
	};
	const slotWidth = (slot: Slot<TData>) => {
		if (slot.kind === 'sys') return s.sysWidth();
		if (slot.kind === 'gap') return slot.side === 'before' ? centerWindow().before : centerWindow().after;
		return widthOf(slot.header);
	};

	return {
		scroller: () => scroller, bindScroller, bindTable, measureViewport, viewport, scrollTo, overflowX, overflowY, containerHeightCss,
		firstRow, lastRow, topSpace, bottomSpace, verticalStep, visibleRows, rowSlots, settling, skeleton, gapX, centerWindow, slots, slotKey, treeColumnId, slotWidth,
	};
}
export type Virtualization<TData extends RowData> = ReturnType<typeof createVirtualization<TData>>;
