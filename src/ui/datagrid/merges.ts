/**
 * Celdas combinadas: un rectángulo de celdas dibujado como una sola, al estilo de "Combinar y centrar" de una hoja de
 * cálculo. La rejilla las recibe como `mergedCells`, una lista de orígenes con sus extensiones en índices de pantalla
 * (los de la selección de celdas), y este módulo es la parte pura: un índice sobre ellas y las preguntas que hacen el
 * pintado, la selección y el teclado. No toca el DOM. Portado de `merges.ts` de SvGrid.
 *
 * Una combinación la dibuja su `td` origen, con `rowspan` y `colspan`; las celdas que cubre no se emiten. Los
 * rectángulos de selección crecen hasta contener combinaciones enteras, la celda activa dentro de una combinación es
 * su origen, y una flecha que entra en una combinación aterriza en el origen y una que sale salta más allá de su borde.
 */

export type MergedCell = {
	/** Celda superior izquierda de la combinación, en índices de pantalla. */
	rowIndex: number;
	colIndex: number;
	/** Cuántas filas y columnas cubre, 1 o más. */
	rowSpan: number;
	colSpan: number;
};

export type MergeIndex = {
	readonly list: ReadonlyArray<MergedCell>;
	/** Cada celda que cubre una combinación (origen incluido) -> su combinación. */
	readonly byCell: ReadonlyMap<string, MergedCell>;
};

export type MergeRect = { minRow: number; maxRow: number; minCol: number; maxCol: number };

const key = (r: number, c: number) => `${r}:${c}`;

/** Índice sobre las combinaciones, o null si no hay ninguna (lo habitual). */
export function buildMergeIndex(
	merges: ReadonlyArray<MergedCell> | undefined | null,
): MergeIndex | null {
	if (!merges || merges.length === 0) return null;
	const byCell = new Map<string, MergedCell>();
	const list: MergedCell[] = [];
	for (const raw of merges) {
		const rowSpan = Math.max(1, Math.floor(raw.rowSpan));
		const colSpan = Math.max(1, Math.floor(raw.colSpan));
		if (rowSpan === 1 && colSpan === 1) continue;
		const merge = { rowIndex: raw.rowIndex, colIndex: raw.colIndex, rowSpan, colSpan };
		list.push(merge);
		for (let r = merge.rowIndex; r < merge.rowIndex + rowSpan; r += 1) {
			for (let c = merge.colIndex; c < merge.colIndex + colSpan; c += 1)
				byCell.set(key(r, c), merge);
		}
	}
	return list.length ? { list, byCell } : null;
}

/** La combinación que cubre (r, c), origen incluido, o undefined. */
export function mergeAt(index: MergeIndex | null, r: number, c: number): MergedCell | undefined {
	return index?.byCell.get(key(r, c));
}

/** Si (r, c) está dentro de una combinación sin ser su origen. */
export function isCovered(index: MergeIndex | null, r: number, c: number): boolean {
	const m = mergeAt(index, r, c);
	return !!m && (m.rowIndex !== r || m.colIndex !== c);
}

/** El origen de la combinación donde está (r, c), o el propio (r, c). */
export function originOf(
	index: MergeIndex | null,
	r: number,
	c: number,
): { rowIndex: number; colIndex: number } {
	const m = mergeAt(index, r, c);
	return m ? { rowIndex: m.rowIndex, colIndex: m.colIndex } : { rowIndex: r, colIndex: c };
}

/** La esquina lejana de la combinación donde está (r, c), o el propio (r, c). */
export function endOf(
	index: MergeIndex | null,
	r: number,
	c: number,
): { rowIndex: number; colIndex: number } {
	const m = mergeAt(index, r, c);
	return m
		? { rowIndex: m.rowIndex + m.rowSpan - 1, colIndex: m.colIndex + m.colSpan - 1 }
		: { rowIndex: r, colIndex: c };
}

/**
 * El rectángulo ampliado hasta contener cada combinación que toca, hasta un punto fijo: una combinación que sobresale
 * tira del borde hacia fuera, lo que puede alcanzar otra, y así, como hace la selección de una hoja de cálculo.
 */
export function expandRectToMerges(index: MergeIndex | null, rect: MergeRect): MergeRect {
	if (!index) return rect;
	let { minRow, maxRow, minCol, maxCol } = rect;
	for (let guard = 0; guard < 64; guard += 1) {
		let grew = false;
		for (const m of index.list) {
			const r2 = m.rowIndex + m.rowSpan - 1;
			const c2 = m.colIndex + m.colSpan - 1;
			const touches = m.rowIndex <= maxRow && r2 >= minRow && m.colIndex <= maxCol && c2 >= minCol;
			if (!touches) continue;
			if (m.rowIndex < minRow) {
				minRow = m.rowIndex;
				grew = true;
			}
			if (r2 > maxRow) {
				maxRow = r2;
				grew = true;
			}
			if (m.colIndex < minCol) {
				minCol = m.colIndex;
				grew = true;
			}
			if (c2 > maxCol) {
				maxCol = c2;
				grew = true;
			}
		}
		if (!grew) break;
	}
	return minRow === rect.minRow &&
		maxRow === rect.maxRow &&
		minCol === rect.minCol &&
		maxCol === rect.maxCol
		? rect
		: { minRow, maxRow, minCol, maxCol };
}

/**
 * Dónde aterriza de verdad un movimiento de `from` a `next`. Un paso hacia una combinación aterriza en su origen; un
 * paso que se queda dentro de la combinación donde empezó sigue más allá de su borde lejano (derecha desde una de tres
 * columnas llega a la columna siguiente), recortado a los límites; si ese paso cae en otra combinación, toma su origen.
 */
export function stepPastMerge(
	index: MergeIndex | null,
	from: { rowIndex: number; colIndex: number },
	next: { rowIndex: number; colIndex: number },
	bounds: { maxRow: number; maxCol: number },
): { rowIndex: number; colIndex: number } {
	if (!index) return next;
	const target = mergeAt(index, next.rowIndex, next.colIndex);
	if (!target) return next;
	const source = mergeAt(index, from.rowIndex, from.colIndex);
	if (source !== target) return { rowIndex: target.rowIndex, colIndex: target.colIndex };
	// Sigue dentro de la combinación donde empezó el movimiento: continúa en esa dirección.
	const dr = Math.sign(next.rowIndex - from.rowIndex);
	const dc = Math.sign(next.colIndex - from.colIndex);
	if (dr === 0 && dc === 0) return { rowIndex: target.rowIndex, colIndex: target.colIndex };
	let rowIndex = next.rowIndex;
	let colIndex = next.colIndex;
	if (dr > 0) rowIndex = target.rowIndex + target.rowSpan;
	else if (dr < 0) rowIndex = target.rowIndex - 1;
	if (dc > 0) colIndex = target.colIndex + target.colSpan;
	else if (dc < 0) colIndex = target.colIndex - 1;
	if (rowIndex < 0 || rowIndex > bounds.maxRow || colIndex < 0 || colIndex > bounds.maxCol) {
		// No hay más adelante: la propia combinación sigue siendo la actual.
		return { rowIndex: target.rowIndex, colIndex: target.colIndex };
	}
	const landed = mergeAt(index, rowIndex, colIndex);
	return landed ? { rowIndex: landed.rowIndex, colIndex: landed.colIndex } : { rowIndex, colIndex };
}

/**
 * Cómo dibuja un td en (r, c) dentro de una ventana de filas y columnas pintadas. Una combinación se dibuja una vez por
 * ventana, con la celda superior izquierda de la parte que la ventana contiene: el origen si está en la ventana
 * (`origin`), si no la primera celda cubierta que la ventana muestra (`continuation`, que dibuja el contenido del
 * origen), con las extensiones recortadas a la ventana para que la tabla no abarque filas sin pintar. El resto de
 * celdas de la combinación son `skip`: no hay td, el dibujado cubre su hueco.
 */
export type MergeDraw =
	| { kind: 'skip' }
	| { kind: 'origin' | 'continuation'; merge: MergedCell; rowSpan: number; colSpan: number };

export function mergeDrawAt(
	index: MergeIndex | null,
	r: number,
	c: number,
	window: { firstRow: number; lastRow: number; firstCol: number; lastCol: number },
): MergeDraw | null {
	const m = mergeAt(index, r, c);
	if (!m) return null;
	const anchorRow = Math.max(m.rowIndex, window.firstRow);
	const anchorCol = Math.max(m.colIndex, window.firstCol);
	if (r !== anchorRow || c !== anchorCol) return { kind: 'skip' };
	const isOrigin = anchorRow === m.rowIndex && anchorCol === m.colIndex;
	const rowSpan = Math.max(1, Math.min(m.rowIndex + m.rowSpan - r, window.lastRow - r + 1));
	const colSpan = Math.max(1, Math.min(m.colIndex + m.colSpan - c, window.lastCol - c + 1));
	return { kind: isOrigin ? 'origin' : 'continuation', merge: m, rowSpan, colSpan };
}

/** Lo mínimo que `spansToMerges` necesita de una columna (un subconjunto de `ColumnDef`). */
export type SpanColumn<TData> = {
	id: string;
	field?: string;
	colSpan?: (params: { data: TData; rowIndex: number; columnId: string; value: unknown }) => number;
	rowSpan?: (params: { data: TData; rowIndex: number; columnId: string; value: unknown }) => number;
};

/**
 * Convierte los `colSpan` / `rowSpan` declarativos de las columnas en `MergedCell[]`. `rows` son los datos en orden de
 * pantalla (tras filtrar y ordenar) y `columns` las columnas en orden de pantalla: los índices de la salida son esos.
 * Se recalcula tras ordenar o filtrar. Una celda ya cubierta por una combinación anterior no abre otra.
 */
export function spansToMerges<TData = Record<string, unknown>>(
	rows: ReadonlyArray<TData>,
	columns: ReadonlyArray<SpanColumn<TData>>,
): MergedCell[] {
	const merges: MergedCell[] = [];
	const covered = new Set<string>();
	for (let r = 0; r < rows.length; r += 1) {
		const row = rows[r]!;
		for (let ci = 0; ci < columns.length; ci += 1) {
			const col = columns[ci]!;
			if (!col.colSpan && !col.rowSpan) continue;
			if (covered.has(key(r, ci))) continue;
			const value = (row as Record<string, unknown>)[col.field ?? col.id];
			const params = { data: row, rowIndex: r, columnId: col.id, value };
			const colSpan = Math.max(1, Math.floor(col.colSpan?.(params) ?? 1));
			const rowSpan = Math.max(1, Math.floor(col.rowSpan?.(params) ?? 1));
			if (colSpan <= 1 && rowSpan <= 1) continue;
			merges.push({ rowIndex: r, colIndex: ci, rowSpan, colSpan });
			for (let dr = 0; dr < rowSpan; dr += 1) {
				for (let dc = 0; dc < colSpan; dc += 1) covered.add(key(r + dr, ci + dc));
			}
		}
	}
	return merges;
}

/** Ventana de columnas pintadas de la zona de una columna (ancladas izq., centro visible o ancladas der.). */
export type ColumnRuns = {
	left: number;
	center: number;
	total: number;
	centerFirst: number;
	centerLast: number;
};

/** Primera y última columna pintadas, contiguas, de la zona donde está la columna `c`. */
export function columnRunOf(runs: ColumnRuns, c: number): { firstCol: number; lastCol: number } {
	if (c < runs.left) return { firstCol: 0, lastCol: runs.left - 1 };
	if (c < runs.left + runs.center) return { firstCol: runs.centerFirst, lastCol: runs.centerLast };
	return { firstCol: runs.left + runs.center, lastCol: runs.total - 1 };
}

/** Dos resultados de `mergeDrawAt` que pintan lo mismo (para no reevaluar una celda si no cambió). */
export function sameDraw(a: MergeDraw | null, b: MergeDraw | null): boolean {
	if (!a || !b) return a === b;
	if (a.kind !== b.kind) return false;
	if (a.kind === 'skip') return true;
	const o = b as Exclude<MergeDraw, { kind: 'skip' }>;
	return a.merge === o.merge && a.rowSpan === o.rowSpan && a.colSpan === o.colSpan;
}
