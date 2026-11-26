import { describe, expect, it } from 'vitest';
import { assignColumnSlots } from './columnSlots';
import { emptyColumnSlots } from './columnSlots';
import type { ColumnSlotEntry } from './columnSlots';

const counter = (start = 0) => {
	let n = start;
	return () => ++n;
};
const ids = (list: Array<ColumnSlotEntry<string>>) => list.map((e) => e.id);
const heads = (list: Array<ColumnSlotEntry<string>>) => list.map((e) => e.header);

describe('assignColumnSlots', () => {
	it('crea un slot por columna en la primera ventana, en orden', () => {
		const out = assignColumnSlots<string>(emptyColumnSlots(), ['a', 'b', 'c'], counter());
		expect(ids(out.entries)).toEqual([1, 2, 3]);
		expect(heads(out.entries)).toEqual(['a', 'b', 'c']);
	});

	it('las columnas que siguen conservan su slot y la entrante toma el de la que salió', () => {
		const first = assignColumnSlots<string>(emptyColumnSlots(), ['a', 'b', 'c'], counter());
		const out = assignColumnSlots(first, ['b', 'c', 'd'], counter(10));
		expect(heads(out.entries)).toEqual(['b', 'c', 'd']);
		expect(ids(out.entries)).toEqual([2, 3, 1]);
	});

	it('varias entrantes toman los slots libres en el orden en que estaban en la fila', () => {
		const first = assignColumnSlots<string>(emptyColumnSlots(), ['a', 'b', 'c', 'd'], counter());
		const out = assignColumnSlots(first, ['c', 'x', 'y', 'z'], counter(10));
		expect(heads(out.entries)).toEqual(['c', 'x', 'y', 'z']);
		expect(ids(out.entries)).toEqual([3, 1, 2, 4]);
	});

	it('un salto lejano actualiza cada celda en su sitio: mismos ids, otras columnas', () => {
		const first = assignColumnSlots<string>(emptyColumnSlots(), ['a', 'b', 'c'], counter());
		const out = assignColumnSlots(first, ['x', 'y', 'z'], counter(10));
		expect(ids(out.entries)).toEqual([1, 2, 3]);
	});

	it('si faltan slots libres crea nuevos y si sobran los guarda', () => {
		const first = assignColumnSlots<string>(emptyColumnSlots(), ['a', 'b'], counter());
		const grown = assignColumnSlots(first, ['a', 'b', 'c', 'd'], counter(10));
		expect(ids(grown.entries)).toEqual([1, 2, 11, 12]);
		const shrunk = assignColumnSlots(grown, ['d'], counter(20));
		expect(ids(shrunk.entries)).toEqual([12]);
		expect(shrunk.spare).toEqual([1, 2, 11]);
	});

	it('una ventana que vuelve a crecer reutiliza los ids guardados en vez de acuñar otros', () => {
		const wide = assignColumnSlots<string>(emptyColumnSlots(), ['a', 'b', 'c', 'd'], counter());
		const narrow = assignColumnSlots(wide, ['a'], counter(10));
		expect(narrow.entries.map((e) => e.id)).toEqual([1]);
		const again = assignColumnSlots(narrow, ['w', 'x', 'y', 'a'], counter(10));
		expect(heads(again.entries)).toEqual(['w', 'x', 'y', 'a']);
		expect(ids(again.entries)).toEqual([2, 3, 4, 1]);
		expect(again.spare).toEqual([]);
	});

	it('los guardados van detrás de los liberados por columnas que salen', () => {
		const wide = assignColumnSlots<string>(emptyColumnSlots(), ['a', 'b', 'c'], counter());
		const narrow = assignColumnSlots(wide, ['c'], counter(10));
		expect(narrow.spare).toEqual([1, 2]);
		const out = assignColumnSlots(narrow, ['x', 'y'], counter(10));
		expect(ids(out.entries)).toEqual([3, 1]);
		expect(out.spare).toEqual([2]);
	});

	it('los ids son únicos aunque el orden de las columnas cambie', () => {
		const first = assignColumnSlots<string>(emptyColumnSlots(), ['a', 'b', 'c'], counter());
		const out = assignColumnSlots(first, ['c', 'a', 'q'], counter(10));
		expect(heads(out.entries)).toEqual(['c', 'a', 'q']);
		expect(ids(out.entries)).toEqual([3, 1, 2]);
		expect(new Set(ids(out.entries)).size).toBe(3);
	});

	it('la misma ventana devuelve las mismas entradas (referencia incluida)', () => {
		const first = assignColumnSlots<string>(emptyColumnSlots(), ['a', 'b'], counter());
		const again = assignColumnSlots(first, ['a', 'b'], counter(10));
		expect(again.entries[0]).toBe(first.entries[0]);
		expect(again.entries[1]).toBe(first.entries[1]);
	});
});
