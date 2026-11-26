import { describe, expect, it } from 'vitest';
import { computeColumnWindow } from './columnWindow';
import type { ColumnWindowState } from './columnWindow';

const STEP = 3;
const uniform = (n: number, w = 100) => Array.from({ length: n }, () => w);
const run = (widths: number[], left: number, view: number, minAhead: number, prev: ColumnWindowState | null) =>
	computeColumnWindow(widths, left, view, minAhead, STEP, prev);
const range = (w: ColumnWindowState) => [w.first, w.last];

/** Rango realmente visible, calculado a lo bruto. */
const visibleRange = (widths: number[], left: number, view: number) => {
	let x = 0;
	let vs = -1;
	let ve = -1;
	widths.forEach((w, i) => {
		if (x + w > left && x < left + view) {
			if (vs < 0) vs = i;
			ve = i;
		}
		x += w;
	});
	return [vs, ve];
};

describe('computeColumnWindow', () => {
	it('primera ventana: minAhead columnas por cada lado', () => {
		expect(range(run(uniform(50), 1000, 300, 3, null))).toEqual([7, 15]);
	});

	it('no se mueve mientras queden minAhead columnas por delante', () => {
		let w = run(uniform(50), 1000, 300, 3, null);
		w = run(uniform(50), 1101, 300, 3, w); // se mueve: [10, 19]
		expect(range(w)).toEqual([10, 19]);
		// visibles 11-14 ... hasta 16-19: por delante quedan >= 3 mientras last >= ve + 3
		for (const left of [1150, 1300, 1399, 1400]) {
			w = run(uniform(50), left, 300, 3, w);
			expect(range(w)).toEqual([10, 19]);
		}
	});

	it('al bajar de minAhead avanza de golpe: minAhead + STEP - 1 por delante y 1 por detras', () => {
		let w = run(uniform(50), 1000, 300, 3, null);
		w = run(uniform(50), 1101, 300, 3, w); // visibles 11-14, necesita hasta 17 > 15
		// ve=14, delante 3+3-1=5 -> 19; detras 1 -> 10
		expect(range(w)).toEqual([10, 19]);
		// 1401: visibles 14-17, necesita 20 > 19: se mueve otra vez, 3 columnas de golpe
		expect(range(run(uniform(50), 1401, 300, 3, w))).toEqual([13, 22]);
	});

	it('hacia atras es simetrico y deja a lo sumo 1 columna por detras del scroll', () => {
		let w = run(uniform(50), 2000, 300, 3, null);
		w = run(uniform(50), 1990, 300, 3, w); // sentido negativo, visibles 19-22: se mueve
		expect(range(w)).toEqual([14, 23]);
		w = run(uniform(50), 1700, 300, 3, w); // visibles 17-19, necesita 14: se queda
		expect(range(w)).toEqual([14, 23]);
		w = run(uniform(50), 1650, 300, 3, w); // visibles 16-19, necesita 13: se mueve
		expect(w.first).toBe(16 - 5);
		expect(w.last).toBe(19 + 1);
	});

	it('invierte el sentido sin dejar hueco visible', () => {
		let w = run(uniform(50), 1000, 300, 3, null);
		w = run(uniform(50), 1101, 300, 3, w);
		w = run(uniform(50), 1000, 300, 3, w); // vuelve atrás
		const [vs, ve] = visibleRange(uniform(50), 1000, 300);
		expect(w.first).toBeLessThanOrEqual(vs);
		expect(w.last).toBeGreaterThanOrEqual(ve);
	});

	it('salto lejano: ventana en reposo, minAhead por delante', () => {
		let w = run(uniform(100), 0, 300, 3, null);
		w = run(uniform(100), 5000, 300, 3, w); // dir > 0
		expect(range(w)).toEqual([49, 55]);
		const back = run(uniform(100), 100, 300, 3, w); // salto atrás
		expect(back.first).toBe(0);
		expect(back.last).toBeGreaterThanOrEqual(visibleRange(uniform(100), 100, 300)[1]!);
	});

	it('ventana mayor que el contenido: toda la fila, sin salirse', () => {
		const w = run(uniform(4), 0, 1200, 3, null);
		expect(range(w)).toEqual([0, 3]);
		expect(range(run(uniform(4), 50, 1200, 3, w))).toEqual([0, 3]);
	});

	it('sin columnas devuelve una ventana vacía', () => {
		const w = run([], 0, 500, 3, null);
		expect(w.last).toBeLessThan(w.first);
	});

	it('scroll más allá del contenido: queda la última columna', () => {
		const w = run(uniform(5), 9999, 300, 3, null);
		expect(w.last).toBe(4);
		expect(w.first).toBeLessThanOrEqual(4);
	});

	it('redimensionar una columna o la vista reconstruye la ventana en reposo', () => {
		let w = run(uniform(50), 1000, 300, 3, null);
		w = run(uniform(50), 1101, 300, 3, w);
		expect(range(w)).toEqual([10, 19]);
		const wider = uniform(50);
		wider[0] = 400; // el contenido entero se corre 300 px: visibles 8-10
		const r = run(wider, 1101, 300, 3, w);
		const [vs, ve] = visibleRange(wider, 1101, 300);
		expect(r.first).toBeLessThanOrEqual(vs);
		expect(r.last).toBeGreaterThanOrEqual(ve);
		expect(r.last).toBe(ve + 3);
		const resized = run(uniform(50), 1101, 800, 3, w);
		expect(resized.last).toBe(visibleRange(uniform(50), 1101, 800)[1]! + 3);
	});

	it('la lista de columnas más corta no deja índices fuera de rango', () => {
		const w = run(uniform(50), 4000, 300, 3, null);
		const r = run(uniform(10), 4000, 300, 3, w);
		expect(r.last).toBe(9);
	});

	it('minAhead 0 no deja nada de margen por delante', () => {
		const w = run(uniform(50), 1000, 300, 0, null);
		expect(range(w)).toEqual([10, 12]);
	});

	it('invariante: las columnas visibles siempre están en la ventana (barrido aleatorio con semilla)', () => {
		let seed = 12345;
		const rnd = () => {
			seed = (seed * 1664525 + 1013904223) >>> 0;
			return seed / 2 ** 32;
		};
		for (const minAhead of [0, 1, 3, 5]) {
			const widths = Array.from({ length: 200 }, () => (rnd() < 0.05 ? 0 : 40 + Math.floor(rnd() * 300)));
			const total = widths.reduce((a, b) => a + b, 0);
			let w: ColumnWindowState | null = null;
			let left = 0;
			let moves = 0;
			for (let k = 0; k < 4000; k += 1) {
				const r = rnd();
				if (r < 0.03) left = rnd() * total * 1.1; // salto
				else left = Math.max(left + (rnd() - 0.45) * 150, 0); // scroll con vaivén
				const view = r < 0.01 ? 200 + rnd() * 1500 : 900;
				const next: ColumnWindowState = run(widths, left, view, minAhead, w);
				const [vs, ve] = visibleRange(widths, left, view);
				if (vs >= 0) {
					expect(next.first).toBeLessThanOrEqual(vs);
					expect(next.last).toBeGreaterThanOrEqual(ve);
				}
				expect(next.first).toBeGreaterThanOrEqual(0);
				expect(next.last).toBeLessThan(widths.length);
				if (w && (w.first !== next.first || w.last !== next.last)) moves += 1;
				w = next;
			}
			expect(moves).toBeLessThan(4000);
		}
	});

	it('scroll constante hacia delante: menos movimientos que columnas cruzadas', () => {
		const widths = uniform(300);
		let w: ColumnWindowState | null = null;
		let moves = 0;
		for (let left = 0; left < 20000; left += 20) {
			const next: ColumnWindowState = run(widths, left, 600, 3, w);
			if (w && (w.first !== next.first || w.last !== next.last)) moves += 1;
			w = next;
		}
		expect(moves).toBeLessThanOrEqual(Math.ceil(200 / STEP) + 1);
	});
});
