/**
 * Ventana de columnas centrales con histéresis (como el virtualizador de columnas de svgrid: `overscan`,
 * `overscanBehind` y `overscanMin`). Función pura: el estado entre llamadas lo lleva quien la usa.
 *
 * - La ventana se queda quieta mientras cubra las columnas visibles más `minAhead` columnas por delante del borde
 *   visible en el sentido del scroll.
 * - Al bajar de ahí se mueve de golpe y deja `minAhead + step - 1` columnas por delante y a lo sumo
 *   `min(1, minAhead)` por detrás. Un movimiento cuesta casi lo mismo entren 1 o 3 columnas, así que menos movimientos
 *   es menos trabajo.
 * - Si las columnas visibles no están en la ventana (salto lejano), o cambian los anchos o el ancho de la vista, se
 *   reconstruye "en reposo": solo `minAhead` por delante (y `min(1, minAhead)` por detrás), sin el paso extra.
 * - Sin sentido conocido (primera ventana) se deja `minAhead` por cada lado.
 * - Invariante: las columnas realmente visibles siempre están dentro de `[first, last]`.
 *
 * El margen es en columnas y no en px: el trabajo por celda depende de cuántas columnas se pintan, no de lo anchas que
 * sean, y es lo que mide el paso. Con las columnas por defecto equivale al margen en px de antes.
 */
export type ColumnWindowState = {
	first: number;
	last: number;
	/** Último `left` visto y el sentido del scroll (-1, 0, 1), que se conserva mientras `left` no cambie. */
	left: number;
	dir: -1 | 0 | 1;
	viewWidth: number;
	widths: readonly number[];
};

const sameWidths = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((w, i) => w === b[i]);

export function computeColumnWindow(
	widths: readonly number[],
	left: number,
	viewWidth: number,
	minAhead: number,
	step: number,
	prev: ColumnWindowState | null,
): ColumnWindowState {
	const n = widths.length;
	const min = Math.max(Math.floor(minAhead), 0);
	const full = min + Math.max(Math.floor(step), 1) - 1;
	const behind = Math.min(1, min);
	let dir: -1 | 0 | 1 = prev?.dir ?? 0;
	if (prev && left !== prev.left) dir = left > prev.left ? 1 : -1;
	const done = (first: number, last: number): ColumnWindowState => ({ first, last, left, dir, viewWidth, widths });
	if (n === 0) return done(0, -1);

	// Primera columna con fin > left y primera con inicio >= left + viewWidth (la última visible es la anterior).
	let x = 0;
	let vs = -1;
	let ve = n - 1;
	const right = left + viewWidth;
	for (let i = 0; i < n; i += 1) {
		const end = x + widths[i]!;
		if (vs < 0 && end > left) vs = i;
		if (x >= right && vs >= 0) {
			ve = Math.max(i - 1, vs);
			break;
		}
		x = end;
	}
	if (vs < 0) vs = n - 1; // scroll más allá del contenido: la última columna
	if (ve < vs) ve = vs;

	const around = (ahead: number, back: number) => {
		const before = dir > 0 ? back : ahead;
		const after = dir < 0 ? back : ahead;
		return done(Math.max(vs - before, 0), Math.min(ve + after, n - 1));
	};

	if (prev && prev.viewWidth === viewWidth && sameWidths(prev.widths, widths) && prev.last < n && prev.first <= ve && prev.last >= vs) {
		const needStart = Math.max(vs - (dir < 0 ? min : 0), 0);
		const needEnd = Math.min(ve + (dir > 0 ? min : 0), n - 1);
		if (prev.first <= needStart && prev.last >= needEnd) return done(prev.first, prev.last);
		return around(full, behind);
	}
	return around(min, behind);
}
