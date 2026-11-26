import { describe, expect, it } from 'vitest';
import { createCoreRowModel, createSvGridCore, tableFeatures } from './core';
import type { GridColumns } from './core';

type Row = { id: string; a: number; b: string };

/** DataGrid pasa `data` y `columns` como getters: el motor debe ver siempre lo último. */
describe('opciones vivas (getters)', () => {
	const make = () => {
		let data: Row[] = [{ id: '1', a: 1, b: 'x' }];
		let columns: GridColumns<Row> = [{ id: 'a', field: 'a', header: 'A' }];
		const grid = createSvGridCore({
			_features: tableFeatures({}),
			_rowModels: { coreRowModel: createCoreRowModel<Row>() },
			get data() {
				return data;
			},
			get columns() {
				return columns;
			},
		} as never);
		return {
			grid,
			setData: (d: Row[]) => (data = d),
			setColumns: (c: GridColumns<Row>) => (columns = c),
		};
	};

	it('reconstruye las columnas y cabeceras al cambiar `columns`', () => {
		const { grid, setColumns } = make();
		expect(grid.getHeaderGroups()[0].headers.map((h) => h.id)).toEqual(['a']);
		setColumns([
			{ id: 'a', field: 'a', header: 'A' },
			{ id: 'b', field: 'b', header: 'B' },
		]);
		grid.getAllColumns();
		expect(grid.getHeaderGroups()[0].headers.map((h) => h.id)).toEqual(['a', 'b']);
	});

	it('aplica en sitio una plantilla o ancho nuevos si la estructura no cambia', () => {
		const { grid, setColumns } = make();
		const before = grid.getAllColumns()[0];
		setColumns([{ id: 'a', field: 'a', header: 'A', width: 321 }]);
		const after = grid.getAllColumns()[0];
		expect(after).toBe(before);
		expect(after.columnDef.width).toBe(321);
	});

	it('refleja filas nuevas al cambiar `data`', () => {
		const { grid, setData } = make();
		expect(grid.getRowModel().rows).toHaveLength(1);
		setData([
			{ id: '1', a: 1, b: 'x' },
			{ id: '2', a: 2, b: 'y' },
		]);
		expect(grid.getRowModel().rows).toHaveLength(2);
	});
});
