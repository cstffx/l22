import { createMemo, createProjection, createSignal, Show } from 'solid-js';
import type { CellContext, Column, Row, RowData } from '../../grid/core';
import type { GridModel } from './createGridModel';
import { asText, renderTemplate } from './parts';
import type { DataGridProps } from './types';

/** Contenido de las celdas: render de la plantilla y edición en línea en modo texto. */
export function createCells<TData extends RowData>(props: DataGridProps<TData>, model: GridModel<TData>) {
	/* Posición de cada columna en las celdas de la fila (orden del motor), para pedir solo la celda que se pinta. */
	const columnIndex = createMemo(() => (model.columnsVersion(), new Map(model.grid.getAllColumns().map((c, i) => [c.id, i]))));
	/* Un contexto por celda, creado al pintarla: con la virtualización de columnas no se crean los de las ocultas. */
	const cellContexts = new WeakMap<Row<TData>, { version: number; list: Array<CellContext<TData> | undefined> }>();
	const cellContext = (row: Row<TData>, column: Column<TData>): CellContext<TData> => {
		const version = model.columnsVersion();
		let entry = cellContexts.get(row);
		if (!entry || entry.version !== version) {
			entry = { version, list: [] };
			cellContexts.set(row, entry);
		}
		const cells = row.getAllCells();
		let idx = columnIndex().get(column.id) ?? -1;
		if (cells[idx]?.column.id !== column.id) idx = cells.findIndex((c) => c.column.id === column.id);
		if (idx < 0) return undefined as never;
		const known = entry.list[idx];
		if (known) return known;
		const created = cells[idx]!.getContext();
		entry.list[idx] = created;
		return created;
	};
	const renderDisplay = (row: Row<TData>, column: Column<TData>) =>
		renderTemplate(column.columnDef.cell, () => cellContext(row, column), () => asText(row.getCellValueByColumnId(column.id)));

	const [editKey, setEditKey] = createSignal<string | null>(null);
	const keyOf = (rowId: string, columnId: string) => `${rowId}\u0000${columnId}`;
	const setEditing = (target: { rowId: string; columnId: string } | null) => setEditKey(target && keyOf(target.rowId, target.columnId));
	/* Selector: cada celda lee solo su clave, así empezar o terminar una edición reevalúa dos celdas y no todas. */
	let editingPrev: string | null = null;
	const editingFlags = createProjection<Record<string, boolean>>((draft) => {
		const next = editKey();
		if (editingPrev !== null) delete draft[editingPrev];
		if (next !== null) draft[next] = true;
		editingPrev = next;
	}, {});
	const isEditing = (row: Row<TData>, column: Column<TData>) => !!editingFlags[keyOf(row.id, column.id)];
	const canEdit = (row: Row<TData>, column: Column<TData>) => {
		if (!props.enableInlineEditing) return false;
		const editable = column.columnDef.editable;
		if (editable === undefined) return column.columnDef.field !== undefined;
		return typeof editable === 'function' ? editable(cellContext(row, column)) : editable;
	};
	const startEdit = (row: Row<TData>, column: Column<TData>) => {
		if (canEdit(row, column)) setEditing({ rowId: row.id, columnId: column.id });
	};
	const isNumeric = (column: Column<TData>) => column.columnDef.cellDataType === 'number' || column.columnDef.editorType === 'number';
	const commitEdit = (row: Row<TData>, column: Column<TData>, raw: string) => {
		setEditing(null);
		const def = column.columnDef;
		const oldValue = row.getCellValueByColumnId(column.id);
		let newValue: unknown = raw;
		if (isNumeric(column)) {
			const n = raw.trim() === '' ? null : Number(raw);
			if (n !== null && Number.isNaN(n)) return;
			newValue = n;
		}
		if (def.valueParser) newValue = def.valueParser({ newValue, oldValue, rawInput: raw, data: row.original, columnId: column.id });
		if (Object.is(newValue, oldValue) || asText(newValue) === asText(oldValue)) return;
		if (def.rejectInvalid && def.validate) {
			const verdict = def.validate({ value: newValue, row: row.original, rowIndex: row.index, column });
			if (verdict === false || (typeof verdict === 'string' && verdict !== '')) return;
		}
		props.onCellValueChange?.({ row: row.original, rowIndex: row.index, columnId: column.id, field: def.field, oldValue, newValue });
	};
	const CellEditor = (p: { row: Row<TData>; column: Column<TData> }) => {
		let done = false;
		const finish = (input: HTMLInputElement, save: boolean) => {
			if (done) return;
			done = true;
			if (save) commitEdit(p.row, p.column, input.value);
			else setEditing(null);
		};
		return (
			<input
				class="ui-dg-edit"
				type="text"
				value={asText(p.row.getCellValueByColumnId(p.column.id))}
				aria-label={typeof p.column.columnDef.header === 'string' ? p.column.columnDef.header : p.column.id}
				ref={(el: HTMLInputElement) =>
					queueMicrotask(() => {
						el.focus();
						el.select();
					})
				}
				onClick={(e) => e.stopPropagation()}
				onDblClick={(e) => e.stopPropagation()}
				onBlur={(e) => finish(e.currentTarget, true)}
				onKeyDown={(e) => {
					e.stopPropagation();
					if (e.key === 'Enter') {
						e.preventDefault();
						finish(e.currentTarget, true);
					} else if (e.key === 'Tab') {
						finish(e.currentTarget, true);
					} else if (e.key === 'Escape') {
						e.preventDefault();
						finish(e.currentTarget, false);
					}
				}}
			/>
		);
	};
	/*
	 * Sin edición en línea devuelve el contenido directo: ni <Show> ni editor por celda. Se lee `enableInlineEditing`
	 * dentro de la expresión reactiva del llamador, así que activarlo o apagarlo en vivo rehace el contenido.
	 */
	const renderPlain = (row: Row<TData>, column: Column<TData>) =>
		props.enableInlineEditing ? (
			<Show when={isEditing(row, column)} fallback={renderDisplay(row, column)}>
				<CellEditor row={row} column={column} />
			</Show>
		) : (
			renderDisplay(row, column)
		);

	return { isEditing, canEdit, startEdit, renderPlain };
}
export type Cells<TData extends RowData> = ReturnType<typeof createCells<TData>>;
