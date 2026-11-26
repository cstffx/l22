import { createMemo } from 'solid-js';
import type { RowData } from '../../grid/core';
import type { ColumnLayout } from './createColumnLayout';
import { buildMergeIndex, columnRunOf, mergeAt, mergeDrawAt } from './merges';
import type { MergeDraw, MergeIndex } from './merges';
import type { Virtualization } from './createVirtualization';
import type { DataGridProps } from './types';

/**
 * Celdas combinadas (`mergedCells`): el índice sobre ellas y la pregunta de pintado de cada celda.
 *
 * Sin `mergedCells` (lo habitual) `index()` es `null` y `active()` es false: el cuerpo pinta las celdas por el camino
 * de siempre y esta lógica no corre ni una vez por celda. Una combinación con `rowSpan` > 1 fuerza la
 * maquetación de tabla (ver `isFlex`), que es la única donde un `rowspan` tiene sentido.
 */
export function createMerges<TData extends RowData>(props: DataGridProps<TData>, layout: ColumnLayout<TData>, virt: Virtualization<TData>) {
	const index = createMemo<MergeIndex | null>(() => {
		return buildMergeIndex(props.mergedCells);
	});
	/* Booleano aparte: pasar de una lista de combinaciones a otra no recrea las filas, solo hacerlo de ninguna a alguna. */
	const active = createMemo(() => index() !== null);
	/* Zonas de columnas pintadas: ancladas izq., centrales visibles y ancladas der. Cada una es un tramo contiguo. */
	const runs = createMemo(() => {
		if (!index()) return null;
		const { left, center, right } = layout.ordered();
		const visible = virt.centerWindow().visible;
		const first = visible.length ? left.length + center.indexOf(visible[0]!) : 0;
		return { left: left.length, center: center.length, total: left.length + center.length + right.length, centerFirst: first, centerLast: first + visible.length - 1 };
	});
	/**
	 * Cómo se dibuja la celda (r, c) con la ventana actual de filas y columnas: null si no está en ninguna combinación
	 * (no se lee ninguna señal de ventana, así que esa celda no se suscribe al scroll), `skip` si la cubre otra celda
	 * dibujada, y `origin` / `continuation` con las extensiones recortadas a lo pintado.
	 */
	const drawAt = (r: number, c: number): MergeDraw | null => {
		const idx = index();
		if (!mergeAt(idx, r, c)) return null;
		const run = columnRunOf(runs()!, c);
		return mergeDrawAt(idx, r, c, { firstRow: virt.firstRow(), lastRow: virt.lastRow() - 1, ...run });
	};
	return { index, active, drawAt };
}
export type Merges = ReturnType<typeof createMerges>;
