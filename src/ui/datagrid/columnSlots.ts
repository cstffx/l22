/** Un slot reciclable de columna central: su id es estable mientras la celda viva; `header` es la columna que lleva ahora. */
export type ColumnSlotEntry<H> = { id: number; header: H };
/** Estado entre ventanas: los slots en uso (en orden de columna) y los ids libres que se guardan para la siguiente. */
export type ColumnSlotState<H> = { entries: Array<ColumnSlotEntry<H>>; spare: number[] };

export const emptyColumnSlots = <H>(): ColumnSlotState<H> => ({ entries: [], spare: [] });

/**
 * Asigna slots numéricos a las columnas centrales de la ventana (reciclaje de celdas como svgrid).
 * - Una columna que sigue en la ventana conserva su slot (y con él su `<td>`).
 * - Una que entra toma un slot libre: primero los de las columnas que salieron, en el orden en que esas celdas estaban
 *   en la fila, y después los guardados de ventanas anteriores. Si faltan, `newId` entrega uno nuevo.
 * - Los slots libres que sobran no se pintan (el `<For>` destruye su celda) pero se guardan en `spare`, al final del
 *   orden, para que una ventana que vuelva a crecer reutilice esos ids en vez de acuñar otros nuevos.
 * `entries` sale en el orden de `next` (el orden de columna, que es el del DOM). Función pura: el estado entre
 * ventanas (`prev`) lo lleva el llamador.
 */
export function assignColumnSlots<H>(prev: ColumnSlotState<H>, next: ReadonlyArray<H>, newId: () => number): ColumnSlotState<H> {
	const wanted = new Set(next);
	const owner = new Map<H, ColumnSlotEntry<H>>();
	const free: number[] = [];
	for (const entry of prev.entries) {
		if (wanted.has(entry.header) && !owner.has(entry.header)) owner.set(entry.header, entry);
		else free.push(entry.id);
	}
	free.push(...prev.spare);
	let nextFree = 0;
	const entries = next.map((header) => owner.get(header) ?? { id: nextFree < free.length ? free[nextFree++]! : newId(), header });
	return { entries, spare: free.slice(nextFree) };
}
