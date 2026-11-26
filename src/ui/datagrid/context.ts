import type { RowData } from '../../grid/core';
import type { Cells } from './createCells';
import type { CellRanges } from './createCellRanges';
import type { ColumnLayout } from './createColumnLayout';
import type { Merges } from './createMerges';
import type { GridModel } from './createGridModel';
import type { Virtualization } from './createVirtualization';
import type { Settings } from './settings';
import type { DataGridProps } from './types';

/** Todo lo que comparten cabecera, cuerpo y pie: las props y los módulos de estado del grid. */
export type GridCtx<TData extends RowData> = {
	props: DataGridProps<TData>;
	s: Settings;
	model: GridModel<TData>;
	layout: ColumnLayout<TData>;
	virt: Virtualization<TData>;
	ranges: CellRanges;
	merges: Merges;
	cells: Cells<TData>;
};
