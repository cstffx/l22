import { DEFAULT_ROW_HEIGHT, DEFAULT_ROW_NUMBER_WIDTH, DEFAULT_COLUMN_WIDTH } from './constants';
import { DEFAULT_TEXT } from './types';
import type { DataGridProps, DataGridText } from './types';
import type { RowData } from '../../grid/core';

/** Lecturas derivadas de las props que casi todos los módulos necesitan. */
export function createSettings<TData extends RowData>(props: DataGridProps<TData>) {
	const rowHeight = () => props.rowHeight ?? DEFAULT_ROW_HEIGHT;
	const showNumbers = () => props.showRowNumbers ?? false;
	const selectable = () => props.showRowSelection ?? false;
	return {
		rowHeight,
		headerHeight: () => props.headerHeight ?? rowHeight(),
		columnWidthDefault: () => props.columnWidth ?? DEFAULT_COLUMN_WIDTH,
		text: (): DataGridText => ({ ...DEFAULT_TEXT, ...props.localization?.text }),
		showNumbers,
		selectable,
		sysWidth: () => (showNumbers() || selectable() ? (props.rowNumberWidth ?? DEFAULT_ROW_NUMBER_WIDTH) : 0),
	};
}
export type Settings = ReturnType<typeof createSettings>;
