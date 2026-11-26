import { describe, expect, it } from 'vitest';
import {
	createCoreRowModel,
	createExpandedRowModel,
	createSortedRowModel,
	createSvGridCore,
	createTreeRowModel,
	rowExpandingFeature,
	rowSortingFeature,
	tableFeatures,
} from './core';

type Node = { id: string; parentId: string | null; name: string };

const data: Node[] = [
	{ id: 'b', parentId: null, name: 'B' },
	{ id: 'a', parentId: null, name: 'A' },
	{ id: 'a2', parentId: 'a', name: 'A2' },
	{ id: 'a1', parentId: 'a', name: 'A1' },
	{ id: 'orphan', parentId: 'missing', name: 'O' },
];

const make = () =>
	createSvGridCore({
		_features: tableFeatures({ rowSortingFeature, rowExpandingFeature }),
		_rowModels: {
			coreRowModel: createCoreRowModel<Node>(),
			sortedRowModel: createSortedRowModel<Node>(),
			groupedRowModel: createTreeRowModel<Node>({ parentField: 'parentId' }),
			expandedRowModel: createExpandedRowModel<Node>(),
		},
		data,
		getRowId: (r: Node) => r.id,
		columns: [{ id: 'name', field: 'name', header: 'N' }],
		state: { sorting: [{ id: 'name', desc: false }] },
	} as never);

describe('pipeline de árbol', () => {
	it('muestra solo las raíces colapsadas, con huérfanas como raíz, y ordena entre hermanos', () => {
		const grid = make();
		const rows = grid.getRowModel().rows;
		expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'orphan']);
		expect(rows[0].getCanExpand()).toBe(true);
		expect(rows[1].getCanExpand()).toBe(false);
	});

	it('al expandir muestra los hijos con su profundidad', () => {
		const grid = make();
		grid.setExpanded(() => ({ a: true }));
		const rows = grid.getRowModel().rows;
		expect(rows.map((r) => [r.id, r.depth])).toEqual([['a', 0], ['a1', 1], ['a2', 1], ['b', 0], ['orphan', 0]]);
	});
});
