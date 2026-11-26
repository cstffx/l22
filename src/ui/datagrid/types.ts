import type { ExpandedState, GridColumnDef, GridColumns, Header, RowData } from '../../grid/core';
import type { MergedCell } from './merges';

/* Tipos públicos de DataGrid (la API es la de `SvGrid`) y los internos que comparten sus módulos. */

export type { MergedCell };

export type ColumnPinningState = { left: string[]; right: string[] };
export type SortingState = Array<{ id: string; desc: boolean }>;
export type RowSelectionState = Record<string, boolean>;
export type PinSide = 'left' | 'right';

/** Una celda editada en línea. El grid no guarda datos: el llamador aplica `newValue` a su `data`. */
export type CellValueChangeEvent<TData extends RowData> = {
	row: TData;
	rowIndex: number;
	columnId: string;
	field: string | undefined;
	oldValue: unknown;
	newValue: unknown;
};

/** Datos jerárquicos a partir de filas planas: cada fila nombra a su padre (igual que `treeData` de SvGrid). */
export type TreeDataConfig<TData extends RowData> = {
	/** Campo con el id del padre. Una fila sin padre, o con un padre inexistente, es raíz. */
	parentField: string;
	/** Campo con el id de la propia fila. Por defecto `'id'`. */
	idField?: string;
	/** Id de la columna que lleva expansor y sangría. Por defecto, la primera visible. */
	column?: string;
	/** Sangría por nivel en px. Por defecto 12. */
	indentPx?: number;
	/** Si se da, cada fila muestra un "+" al pasar el ratón que la llama con la fila (el grid no añade nada). */
	onAddChild?: (row: TData) => void;
	/** Texto del botón "+". */
	addChildLabel?: string;
};

/** Textos de la rejilla; sustituye los que necesites (i18n). */
export type DataGridText = {
	selectAll: string;
	selectRow: string;
	resizeColumn: (header: string) => string;
	empty: string;
	expandRow: string;
	collapseRow: string;
	addChild: string;
};
export const DEFAULT_TEXT: DataGridText = {
	selectAll: 'Seleccionar todas las filas',
	selectRow: 'Seleccionar fila',
	resizeColumn: (header) => `Redimensionar columna ${header}`,
	empty: 'Sin datos',
	expandRow: 'Expandir fila',
	collapseRow: 'Contraer fila',
	addChild: 'Añadir una fila debajo de esta',
};

/** Una celda en coordenadas de pantalla, base 0 (igual que `SvGridCellCoords`): fila del modelo visible y columna en orden de pantalla. */
export type GridCellCoords = { row: number; col: number };
/** Rectángulo seleccionado con su orientación (igual que `SvGridSelectedRange`): `from` es el ancla, `to` el foco. */
export type GridSelectedRange = { from: GridCellCoords; to: GridCellCoords; highlight: GridCellCoords };
/** `[rowStart, colStart, rowEnd, colEnd]`. */
export type CellRangeTuple = [number, number, number, number];

/** Control imperativo (`onApiReady`). */
export type DataGridApi = {
	getColumnPinning: () => ColumnPinningState;
	setColumnPinning: (state: ColumnPinningState) => void;
	/** Ancla una columna a un borde, o la suelta con `false`. */
	pinColumn: (id: string, side: PinSide | false) => void;
	/** Selecciona rectángulos `[rowStart, colStart, rowEnd, colEnd]`; la última es la activa. Vacío limpia. */
	selectCells: (ranges: ReadonlyArray<readonly [number, number, number, number]>) => void;
	/** Rectángulos normalizados `[minRow, minCol, maxRow, maxCol]`, la activa al final. */
	getSelected: () => CellRangeTuple[];
	/** Último rectángulo como `[startRow, startCol, endRow, endCol]` (con orientación), o `undefined`. */
	getSelectedLast: () => CellRangeTuple | undefined;
	getSelectedRange: () => GridSelectedRange[] | undefined;
	getSelectedRangeLast: () => GridSelectedRange | undefined;
};

export type DataGridProps<TData extends RowData> = {
	data: ReadonlyArray<TData>;
	columns: GridColumns<TData>;
	getRowId?: (row: TData, index: number) => string;
	/** Alto del área con scroll: número en px o cadena CSS. Por defecto 520. */
	containerHeight?: number | string;
	/** Alto de fila y pie en px. Por defecto 35. */
	rowHeight?: number;
	/** Alto de la cabecera en px. Por defecto `rowHeight`. */
	headerHeight?: number;
	/** Filas extra pintadas fuera de la ventana. Por defecto 10. */
	overscan?: number;
	/**
	 * Adelanta la ventana en el sentido del scroll cuando es más rápido de lo que cubre `overscan`: quita filas de detrás
	 * y las pone delante, conservando el largo de la ventana. Por defecto true.
	 */
	overscanLead?: boolean;
	/**
	 * Cómo se maquetan las filas. `flex` (por defecto): cada
	 * fila es un contenedor flex con celdas de ancho fijo, la cabecera y el pie son `sticky` y los anchos viajan en
	 * variables CSS de la tabla, de modo que redimensionar una columna toca un solo estilo. `table`: tabla con `<col>` y celdas
	 * con ancho automático; se activa sola si `mergedCells` trae algún `rowSpan` > 1.
	 */
	rowLayout?: 'table' | 'flex';
	/**
	 * Milisegundos de scroll quieto antes de pintar la nueva ventana de filas y columnas. Con un valor > 0 el arrastre
	 * no pinta lo que va a descartar enseguida (se ve el hueco hasta que se detiene). Por defecto 0: pinta en cada frame.
	 */
	scrollSettleDelay?: number;
	/**
	 * Recicla los nodos de fila: al hacer scroll, la fila que sale cede su `<tr>` a la que entra, en lugar de destruirlo y
	 * crear otro. Apagado por defecto. Se ignora mientras haya `mergedCells`.
	 */
	recycleRows?: boolean;
	/** Pinta solo las columnas visibles (los anclados siempre). Por defecto true. */
	columnVirtualization?: boolean;
	/** Columnas extra pintadas fuera de la ventana. Por defecto 3. */
	columnOverscan?: number;
	/** Ancho de las columnas sin `width`. Por defecto 140. */
	columnWidth?: number;
	/** Columnas ancladas al montar (semilla; no controlado). */
	initialColumnPinning?: { left?: ReadonlyArray<string>; right?: ReadonlyArray<string> };
	onColumnPinningChange?: (state: ColumnPinningState) => void;
	/** Arrastrar el borde de la cabecera cambia el ancho. Apagado por defecto. */
	columnResize?: boolean;
	onColumnResize?: (event: { columnId: string; width: number }) => void;
	/**
	 * Modo árbol (`treegrid`): las filas planas se anidan por `parentField`; la columna del árbol
	 * gana expansor y sangría. Se lee al crear el grid, como en SvGrid.
	 */
	treeData?: TreeDataConfig<TData>;
	/** Filas expandidas por id. Siembra el estado y se reaplica cuando cambia la prop. */
	expanded?: ExpandedState;
	onExpandedChange?: (expanded: ExpandedState) => void;
	/** Ícono antes de la etiqueta de cada cabecera: datos de path SVG en 24×24, o null para ninguno. */
	headerIcon?: (def: GridColumnDef<TData>) => string | null | undefined;
	/** Orden por clic en cabecera. Una columna se excluye con `sortable: false`. Por defecto true. */
	sortable?: boolean;
	initialSorting?: SortingState;
	onSortingChange?: (sorting: SortingState) => void;
	/** Columna de checkbox para seleccionar filas. */
	showRowSelection?: boolean;
	onRowSelectionChange?: (selection: RowSelectionState) => void;
	/**
	 * Selección de celdas: clic selecciona, arrastrar o Shift+clic extiende el rango, Ctrl/Cmd añade otro
	 * rango y Esc limpia. El rango se pinta con un `div` absoluto dentro de su celda superior izquierda
	 * (sin tocar el estilo de cada celda). Por defecto true, como en SvGrid.
	 */
	enableCellSelection?: boolean;
	/** Cambió la selección de celdas: todos los rectángulos `[rowStart, colStart, rowEnd, colEnd]`, el activo al final. */
	onCellSelectionChange?: (ranges: Array<[number, number, number, number]>) => void;
	/**
	 * Celdas combinadas: lista de orígenes `{ rowIndex, colIndex, rowSpan, colSpan }` en índices de pantalla (fila del
	 * modelo visible y columna en orden de pantalla, los mismos de la selección de celdas). El `td` origen lleva
	 * `rowspan`/`colspan`, las celdas que cubre no se emiten y muestran el contenido del origen; los índices valen
	 * para el orden y las columnas actuales, así que se recalculan al ordenar, filtrar, anclar o reordenar columnas.
	 * Los rectángulos de selección crecen hasta contener combinaciones enteras. Si la esquina origen queda fuera de la
	 * ventana virtualizada, la combinación se dibuja desde la primera fila o columna pintada con los datos del origen;
	 * una combinación que cruza el borde de las columnas ancladas se dibuja en un trozo por zona. Una
	 * combinación con `rowSpan` > 1 fuerza la maquetación de tabla aunque `rowLayout` sea flex. No hay navegación por
	 * teclado ni celda activa en la rejilla, así que no hay reglas de teclado que aplicar. Sin lista, nada cambia.
	 */
	mergedCells?: ReadonlyArray<MergedCell>;
	/** Columna con el número de fila. */
	showRowNumbers?: boolean;
	rowNumberWidth?: number;
	zebraRows?: boolean;
	enableRowHover?: boolean;
	rowClass?: (row: TData, index: number) => string | undefined;
	onRowClick?: (event: { row: TData; rowIndex: number; event: MouseEvent }) => void;
	onCellClick?: (event: { row: TData; rowIndex: number; columnId: string; event: MouseEvent }) => void;
	/**
	 * Edición en línea en modo texto: doble clic, Enter o F2 sobre una celda abren una caja de texto;
	 * Enter/Tab/perder foco confirman y Esc cancela. Apagado por defecto. Una columna se excluye con
	 * `editable: false`; las columnas sin `field` (solo `fieldFn`) requieren `editable: true`.
	 */
	enableInlineEditing?: boolean;
	/** Se confirmó una edición. Actualiza `data` aquí: el grid no muta las filas. */
	onCellValueChange?: (event: CellValueChangeEvent<TData>) => void;
	gridLabel?: string;
	localization?: { text?: Partial<DataGridText> };
	onApiReady?: (api: DataGridApi) => void;
};


/**
 * Una celda de la fila: la columna de sistema (número/checkbox), una columna de datos o el hueco de las que no se pintan.
 * Una columna central con `id` es un slot reciclable del cuerpo: el `<td>` es del slot y la columna que lleva puede cambiar
 * (ver `assignColumnSlots`). Sin `id` la celda es de la columna (ancladas, la del árbol, sin virtualización de columnas).
 */
export type Slot<T extends RowData> =
	| { kind: 'sys' }
	| { kind: 'col'; header: Header<T>; pin: PinSide | null; version: number; id?: number }
	| { kind: 'gap'; side: 'before' | 'after' };

export const sameSlot = <T extends RowData>(a: Slot<T>, b: Slot<T>) =>
	a.kind === b.kind &&
	(a.kind !== 'col' || (b.kind === 'col' && a.header === b.header && a.pin === b.pin && a.version === b.version && a.id === b.id)) &&
	(a.kind !== 'gap' || (b.kind === 'gap' && a.side === b.side));
