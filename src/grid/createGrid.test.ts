import { createRoot } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { createGrid, createSvGrid } from './createGrid';
import {
	createCoreRowModel,
	createSortedRowModel,
	rowSortingFeature,
	tableFeatures,
	type ColumnDef,
} from './core';

type Repo = { name: string; stars: number };
const data: Repo[] = [
	{ name: 'a', stars: 1 },
	{ name: 'b', stars: 3 },
	{ name: 'c', stars: 2 },
];
const features = tableFeatures({ rowSortingFeature });
const columns = [{ field: 'name' }, { field: 'stars' }] as unknown as Array<
	ColumnDef<typeof features, Repo>
>;

function build<S>(selector?: (state: Record<string, unknown>) => S) {
	return createSvGrid(
		{
			_features: features,
			_rowModels: {
				coreRowModel: createCoreRowModel<Repo>(),
				sortedRowModel: createSortedRowModel<Repo>(),
			},
			data,
			columns,
		},
		selector,
	);
}

describe('createGrid (adaptador Solid)', () => {
	it('createGrid es alias de createSvGrid', () => {
		expect(createGrid).toBe(createSvGrid);
	});

	it('sin selector, state es un objeto vacío', () => {
		createRoot((dispose) => {
			expect(build().state).toEqual({});
			dispose();
		});
	});

	it('funciona fuera de un owner (sin limpieza automática)', () => {
		expect(build((s) => ({ sorting: s.sorting })).state.sorting).toEqual([]);
	});

	it('state refleja el store tras cambiar el orden', () => {
		createRoot((dispose) => {
			const grid = build((s) => ({ sorting: s.sorting }));
			grid
				.getAllColumns()
				.find((c) => c.id === 'stars')!
				.getToggleSortingHandler()();
			expect(grid.state.sorting).toEqual([{ id: 'stars', desc: false }]);
			dispose();
		});
	});
});
