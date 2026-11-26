import { createMemo, createSignal } from 'solid-js';
import type { JSX } from '@solidjs/web';
import type { Column, Header, RowData } from '../../grid/core';
import { MIN_COLUMN_WIDTH } from './constants';
import type { GridModel } from './createGridModel';
import type { Settings } from './settings';
import type { ColumnPinningState, DataGridProps, PinSide, Slot } from './types';

/** Columnas: anclado, anchos y redimensionado, orden [ancladas izq., centrales, ancladas der.] y clases sticky. */
export function createColumnLayout<TData extends RowData>(props: DataGridProps<TData>, s: Settings, model: GridModel<TData>) {
	const { grid, columnsVersion } = model;

	/* ── anclado ── */
	const [pinning, setPinning] = createSignal<ColumnPinningState>({
		left: [...(props.initialColumnPinning?.left ?? [])],
		right: [...(props.initialColumnPinning?.right ?? [])],
	});
	const updatePinning = (next: ColumnPinningState) => {
		setPinning(next);
		props.onColumnPinningChange?.(next);
	};
	const pinApi = {
		getColumnPinning: () => pinning(),
		setColumnPinning: updatePinning,
		pinColumn: (id: string, side: PinSide | false) => {
			const current = pinning();
			const left = current.left.filter((c) => c !== id);
			const right = current.right.filter((c) => c !== id);
			if (side === 'left') left.push(id);
			if (side === 'right') right.unshift(id);
			updatePinning({ left, right });
		},
	};

	/* ── anchos y redimensionado ── */
	const [widths, setWidths] = createSignal<Record<string, number>>({});
	const [resizing, setResizing] = createSignal<string | null>(null);
	const widthOf = (header: Header<TData>) => (columnsVersion(), widths()[header.id]) ?? header.column.columnDef.width ?? s.columnWidthDefault();
	const canResize = (column: Column<TData>) => !!props.columnResize && column.columnDef.resizable !== false;

	const startResize = (header: Header<TData>) => (event: PointerEvent) => {
		event.preventDefault();
		event.stopPropagation();
		const startX = event.clientX;
		const startWidth = widthOf(header);
		const prevCursor = document.body.style.cursor;
		const prevSelect = document.body.style.userSelect;
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
		setResizing(header.id);
		let frame = 0;
		let lastX = startX;
		const next = () => Math.max(MIN_COLUMN_WIDTH, startWidth + lastX - startX);
		const apply = () => setWidths((w) => ({ ...w, [header.id]: next() }));
		const move = (e: PointerEvent) => {
			lastX = e.clientX;
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				apply();
			});
		};
		const finish = () => {
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', finish);
			window.removeEventListener('pointercancel', finish);
			cancelAnimationFrame(frame);
			apply();
			document.body.style.cursor = prevCursor;
			document.body.style.userSelect = prevSelect;
			setResizing(null);
			props.onColumnResize?.({ columnId: header.id, width: next() });
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', finish);
		window.addEventListener('pointercancel', finish);
	};

	/* ── columnas ── */
	const leafHeaders = createMemo(() => (columnsVersion(), grid.getAllColumns(), grid.getHeaderGroups().at(-1)?.headers ?? []).filter((h) => !h.isPlaceholder && h.column.columnDef.visible !== false) as Array<Header<TData>>);
	const ordered = createMemo(() => {
		const byId = new Map(leafHeaders().map((h) => [h.id, h]));
		const { left, right } = pinning();
		const leftHeaders = left.map((id) => byId.get(id)).filter((h): h is Header<TData> => !!h);
		const rightHeaders = right.map((id) => byId.get(id)).filter((h): h is Header<TData> => !!h);
		const pinned = new Set([...leftHeaders, ...rightHeaders]);
		return { left: leftHeaders, center: leafHeaders().filter((h) => !pinned.has(h)), right: rightHeaders };
	});
	/** Orden de pantalla: el índice de columna que usa la selección de celdas. */
	const displayCols = createMemo(() => {
		const o = ordered();
		return [...o.left, ...o.center, ...o.right];
	});
	const sumWidths = (list: ReadonlyArray<Header<TData>>) => list.reduce((total, h) => total + widthOf(h), 0);

	/* Desplazamientos sticky acumulados de cada borde. */
	const pinOffsets = createMemo(() => {
		const { left, right } = ordered();
		const offsets = new Map<string, number>();
		let x = s.sysWidth();
		for (const h of left) {
			offsets.set(h.id, x);
			x += widthOf(h);
		}
		let r = 0;
		for (let i = right.length - 1; i >= 0; i -= 1) {
			offsets.set(right[i].id, r);
			r += widthOf(right[i]);
		}
		return offsets;
	});
	const totalWidth = createMemo(() => s.sysWidth() + sumWidths(displayCols()));

	/* Estilo y clases de anclado de una celda (cabecera, cuerpo y pie comparten). */
	const lastLeftId = () => ordered().left.at(-1)?.id;
	const firstRightId = () => ordered().right[0]?.id;
	const pinClass = (slot: Slot<TData>) => {
		if (slot.kind === 'sys') return lastLeftId() === undefined ? ' is-pinned is-edge-left' : ' is-pinned';
		if (slot.kind !== 'col' || !slot.pin) return '';
		const edge = slot.pin === 'left' ? slot.header.id === lastLeftId() : slot.header.id === firstRightId();
		if (!edge) return ' is-pinned';
		return slot.pin === 'left' ? ' is-pinned is-edge-left' : ' is-pinned is-edge-right';
	};
	const pinStyle = (slot: Slot<TData>): JSX.CSSProperties | undefined => {
		if (slot.kind === 'sys') return { left: '0px' };
		if (slot.kind !== 'col' || !slot.pin) return undefined;
		const offset = `${pinOffsets().get(slot.header.id) ?? 0}px`;
		return slot.pin === 'left' ? { left: offset } : { right: offset };
	};
	/*
	 * Maquetación flex (por defecto, salvo `rowLayout="table"` o `mergedCells` con `rowSpan` > 1): el ancho de cada celda sale de una variable CSS de la tabla. Redimensionar una
	 * columna o desplazar la ventana de columnas cambia una variable, no el estilo de cada celda pintada.
	 */
	const hasRowSpan = createMemo(() => (props.mergedCells ?? []).some((m) => m.rowSpan > 1));
	/* Como svgrid: flex por defecto; una combinación que abarque filas necesita el algoritmo de tabla y lo fuerza. */
	const isFlex = () => props.rowLayout !== 'table' && !hasRowSpan();
	const colIndexByHeader = createMemo(() => new Map(displayCols().map((h, i) => [h.id, i])));
	const widthVars = createMemo(() => {
		const vars: Record<string, string> = { '--dg-w-sys': `${s.sysWidth()}px` };
		displayCols().forEach((h, i) => {
			vars[`--dg-w-${i}`] = `${widthOf(h)}px`;
		});
		return vars;
	});
	const cellWidth = (slot: Slot<TData>) => {
		if (slot.kind === 'sys') return 'var(--dg-w-sys)';
		if (slot.kind === 'gap') return `var(--dg-gap-${slot.side})`;
		return `var(--dg-w-${colIndexByHeader().get(slot.header.id) ?? 0})`;
	};
	/** Estilo de una celda: el de anclado y, en maquetación flex, su ancho. */
	const cellStyle = (slot: Slot<TData>): JSX.CSSProperties | undefined => {
		const pin = pinStyle(slot);
		return isFlex() ? ({ ...pin, width: cellWidth(slot) } as JSX.CSSProperties) : pin;
	};
	const alignClass = (column: Column<TData>) => {
		const align = column.columnDef.align;
		if (align === 'right') return ' is-right';
		return align === 'center' ? ' is-center' : '';
	};

	const hasFooter = createMemo(() => leafHeaders().some((h) => h.column.columnDef.footer !== undefined || (h.column.columnDef.summary !== undefined && h.column.columnDef.summary !== false)));

	return {
		pinning, pinApi, widthOf, resizing, canResize, startResize,
		leafHeaders, ordered, displayCols, sumWidths, totalWidth,
		pinClass, pinStyle, alignClass, hasFooter, isFlex, widthVars, cellStyle,
	};
}
export type ColumnLayout<TData extends RowData> = ReturnType<typeof createColumnLayout<TData>>;
