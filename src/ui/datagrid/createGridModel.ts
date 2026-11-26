import { createEffect, createMemo } from 'solid-js';
import { createGrid } from '../../grid/createGrid';
import {
	createCoreRowModel,
	createExpandedRowModel,
	createSortedRowModel,
	createTreeRowModel,
	rowExpandingFeature,
	rowSelectionFeature,
	rowSortingFeature,
	tableFeatures,
} from '../../grid/core';
import type { Column, ExpandedState, Row, RowData } from '../../grid/core';
import type { DataGridProps, RowSelectionState, SortingState } from './types';

/** Lee valores solo para que el memo dependa de ellos. */
const track = (...deps: unknown[]) => deps.length;

const features = tableFeatures({ rowSortingFeature, rowSelectionFeature, rowExpandingFeature });

/** Motor headless + lo que deriva de él: filas ordenadas, selección de filas, orden y expansión del árbol. */
export function createGridModel<TData extends RowData>(props: DataGridProps<TData>) {
	const grid = createGrid(
		{
			_features: features,
			_rowModels: {
				coreRowModel: createCoreRowModel<TData>(),
				sortedRowModel: createSortedRowModel<TData>(),
				...(props.treeData
					? {
							groupedRowModel: createTreeRowModel<TData>({ parentField: props.treeData.parentField, idField: props.treeData.idField }),
							expandedRowModel: createExpandedRowModel<TData>(),
						}
					: {}),
			},
			/* Getters: el motor lee `options.*` en cada consulta, así que ve siempre lo último. */
			get data() {
				return props.data;
			},
			get columns() {
				return props.columns;
			},
			get getRowId() {
				return props.getRowId ?? ((_row: TData, index: number) => String(index));
			},
			state: { sorting: props.initialSorting ?? [], expanded: props.expanded ?? {} },
		},
		(s) => ({ sorting: s.sorting, rowSelection: s.rowSelection, expanded: s.expanded }),
	);

	createEffect(
		() => grid.state.sorting,
		(sorting) => {
			props.onSortingChange?.((sorting ?? []) as SortingState);
		},
	);
	createEffect(
		() => grid.state.expanded,
		(expanded) => {
			props.onExpandedChange?.((expanded ?? {}) as ExpandedState);
		},
	);
	createEffect(
		() => props.expanded,
		(expanded) => {
			if (expanded && expanded !== grid.state.expanded) grid.setExpanded(() => expanded);
		},
	);
	createEffect(
		() => grid.state.rowSelection,
		(selection) => {
			props.onRowSelectionChange?.((selection ?? {}) as RowSelectionState);
		},
	);

	/* El motor ya ordena: se reconstruye la lista solo cuando cambia el orden. */
	const sortKey = createMemo(() => JSON.stringify(grid.state.sorting ?? []));
	/* Cambia con cada `columns` nuevo: una definición editada en sitio (ancho, plantilla, visible…) también cuenta. */
	let columnsRevision = 0;
	const columnsVersion = createMemo(() => {
		track(props.columns);
		columnsRevision += 1;
		return columnsRevision;
	});
	const rows = createMemo(() => {
		sortKey();
		track(props.data, grid.state.expanded);
		columnsVersion();
		return grid.getRowModel().rows as Array<Row<TData>>;
	});

	/* ── selección de filas ── */
	const isSelected = (id: string) => !!(grid.state.rowSelection as RowSelectionState | undefined)?.[id];
	const selectedCount = createMemo(() => rows().filter((r) => isSelected(r.id)).length);
	const allSelected = () => rows().length > 0 && selectedCount() === rows().length;
	const someSelected = () => selectedCount() > 0 && !allSelected();
	const toggleRow = (id: string) =>
		grid.setRowSelection((prev) => {
			const next = { ...prev };
			if (next[id]) delete next[id];
			else next[id] = true;
			return next;
		});
	const toggleAll = () =>
		grid.setRowSelection(() => (allSelected() ? {} : Object.fromEntries(rows().map((r) => [r.id, true]))));

	/* ── orden ── */
	const sortDir = (id: string) => (grid.state.sorting as SortingState | undefined)?.find((s) => s.id === id);
	const ariaSort = (id: string) => {
		const dir = sortDir(id);
		if (!dir) return undefined;
		return dir.desc ? 'descending' : 'ascending';
	};
	const canSort = (column: Column<TData>) => (props.sortable ?? true) && column.getCanSort();
	const toggleSort = (id: string) =>
		grid.store.setState((s) => ({ ...s, sorting: [{ id, desc: sortDir(id) ? !sortDir(id)!.desc : false }] }));

	/* ── árbol ── */
	const isExpanded = (id: string) => !!(grid.state.expanded as ExpandedState | undefined)?.[id];
	const rowAriaExpanded = (row: Row<TData>) => {
		if (!props.treeData || !row.getCanExpand()) return undefined;
		return isExpanded(row.id) ? 'true' : 'false';
	};
	const toggleExpanded = (row: Row<TData>) => grid.setExpanded((prev) => ({ ...prev, [row.id]: !prev[row.id] }));

	return {
		grid, sortKey, columnsVersion, rows,
		isSelected, allSelected, someSelected, toggleRow, toggleAll,
		sortDir, ariaSort, canSort, toggleSort,
		isExpanded, rowAriaExpanded, toggleExpanded,
	};
}
export type GridModel<TData extends RowData> = ReturnType<typeof createGridModel<TData>>;
