import { describe, expect, it } from 'vitest';
import { MAX_DOM_PAINT_HEIGHT, MAX_DOM_SCROLL_HEIGHT_FALLBACK } from './constants';
import { createRowScrollScaling, detectMaxDomHeight, maxDomHeightFor, resolveMaxDomHeight } from './scrollScaling';

const VIEWPORT = 600;

describe('createRowScrollScaling: inerte por debajo del tope', () => {
	const s = createRowScrollScaling(18_000_000, 33_554_400, VIEWPORT);
	it('no está activo y la altura DOM es la real', () => {
		expect(s.active).toBe(false);
		expect(s.domTotal).toBe(18_000_000);
	});
	it('las dos conversiones son la identidad', () => {
		for (const v of [0, 1, 1234, 9_000_000, 17_999_400]) {
			expect(s.domToLogical(v)).toBe(v);
			expect(s.logicalToDom(v)).toBe(v);
		}
	});
	it('justo en el tope sigue inerte', () => {
		const t = createRowScrollScaling(16_000_000, 16_000_000, VIEWPORT);
		expect(t.active).toBe(false);
		expect(t.domTotal).toBe(16_000_000);
	});
});

describe('createRowScrollScaling: activo por encima del tope', () => {
	const trueTotal = 35_000_000; // 1 000 000 de filas × 35 px
	const maxDom = 16_000_000;
	const s = createRowScrollScaling(trueTotal, maxDom, VIEWPORT);
	const domMax = s.domTotal - VIEWPORT;
	const logicalMax = trueTotal - VIEWPORT;

	it('limita la altura DOM al tope', () => {
		expect(s.active).toBe(true);
		expect(s.domTotal).toBe(maxDom);
	});
	it('inicio y final alcanzables: el último scrollTop del DOM es el último desplazamiento lógico', () => {
		expect(s.domToLogical(0)).toBe(0);
		expect(s.logicalToDom(0)).toBe(0);
		expect(s.domToLogical(domMax)).toBeCloseTo(logicalMax, 3);
		expect(s.logicalToDom(logicalMax)).toBeCloseTo(domMax, 3);
	});
	it('recorta lo que se sale de rango', () => {
		expect(s.domToLogical(-100)).toBe(0);
		expect(s.domToLogical(domMax + 10_000)).toBeCloseTo(logicalMax, 3);
		expect(s.logicalToDom(-100)).toBe(0);
		expect(s.logicalToDom(logicalMax + 10_000)).toBeCloseTo(domMax, 3);
	});
	it('son inversas entre sí', () => {
		for (let i = 0; i <= 50; i += 1) {
			const d = (domMax * i) / 50;
			expect(s.logicalToDom(s.domToLogical(d))).toBeCloseTo(d, 2);
			const l = (logicalMax * i) / 50;
			expect(s.domToLogical(s.logicalToDom(l))).toBeCloseTo(l, 2);
		}
	});
	it('son monótonas', () => {
		let prevL = -1;
		let prevD = -1;
		for (let i = 0; i <= 200; i += 1) {
			const l = s.domToLogical((domMax * i) / 200);
			const d = s.logicalToDom((logicalMax * i) / 200);
			expect(l).toBeGreaterThanOrEqual(prevL);
			expect(d).toBeGreaterThanOrEqual(prevD);
			prevL = l;
			prevD = d;
		}
	});
	it('en los extremos un píxel es un píxel', () => {
		for (const d of [1, 35, 350, 3500]) {
			expect(s.domToLogical(d)).toBe(d);
			expect(s.logicalToDom(d)).toBe(d);
			expect(s.domToLogical(domMax - d)).toBeCloseTo(logicalMax - d, 3);
			expect(s.logicalToDom(logicalMax - d)).toBeCloseTo(domMax - d, 3);
		}
	});
	it('el ajuste de espaciadores (lógico - DOM) vale 0 arriba y total real - DOM abajo', () => {
		expect(0 - s.logicalToDom(0)).toBe(0);
		expect(logicalMax - s.logicalToDom(logicalMax)).toBeCloseTo(trueTotal - s.domTotal, 3);
	});
	it('sin saltos donde los extremos enlazan con el centro', () => {
		const ratio = logicalMax / domMax;
		for (let d = 8000; d <= 8400; d += 1) expect(s.domToLogical(d) - s.domToLogical(d - 1)).toBeLessThan(ratio + 0.1);
	});
	it('cada fila es alcanzable por la costura (una fila por encima del tope)', () => {
		const t = createRowScrollScaling(1_000_030, 1_000_000, 500);
		const reach = new Set<number>();
		for (let d = 0; d <= t.domTotal - 500; d += 1) reach.add(Math.floor(t.domToLogical(d) / 30));
		expect(reach.size).toBe(Math.floor((1_000_030 - 500) / 30) + 1);
	});
	it('escala extrema (100M de filas) conserva el final', () => {
		const total = 100_000_000 * 32;
		const e = createRowScrollScaling(total, 33_554_400, VIEWPORT);
		expect(e.domTotal).toBe(33_554_400);
		expect(e.domToLogical(e.domTotal - VIEWPORT)).toBeCloseTo(total - VIEWPORT, 0);
	});
});

describe('createRowScrollScaling: casos límite', () => {
	it('rejilla vacía', () => {
		const s = createRowScrollScaling(0, 8_000_000, VIEWPORT);
		expect(s.active).toBe(false);
		expect(s.domTotal).toBe(0);
		expect(s.domToLogical(0)).toBe(0);
		expect(s.logicalToDom(0)).toBe(0);
	});
	it('contenido más bajo que el viewport', () => {
		const s = createRowScrollScaling(200, 8_000_000, VIEWPORT);
		expect(s.active).toBe(false);
		expect(s.domToLogical(0)).toBe(0);
	});
	it('viewport mayor que el tope activo no produce NaN ni negativos', () => {
		const s = createRowScrollScaling(10_000_000, 500, 1000);
		expect(s.active).toBe(true);
		for (const v of [-5, 0, 10, 1e9]) {
			expect(s.domToLogical(v)).toBe(0);
			expect(s.logicalToDom(v)).toBe(0);
		}
	});
	it('rango pequeño: los extremos caben', () => {
		const s = createRowScrollScaling(1_000_000, 100_000, VIEWPORT);
		expect(s.domToLogical(s.domTotal - VIEWPORT)).toBeCloseTo(1_000_000 - VIEWPORT, 3);
		expect(s.domToLogical(50_000)).toBeGreaterThan(50_000);
	});
	it('monótona, inversa y con los extremos unidos a ambos lados de la costura (aleatorio con semilla)', () => {
		const bad: string[] = [];
		let seed = 7;
		const rnd = () => {
			seed = (seed * 1103515245 + 12345) & 0x7fffffff;
			return seed / 0x7fffffff;
		};
		for (let c = 0; c < 300; c += 1) {
			const max = 100_000 + Math.floor(rnd() * 33_000_000);
			const viewport = 100 + Math.floor(rnd() * 2000);
			const offsets = [1, 2, 30, viewport, 8192, 16_384, 20_000, Math.floor(max * 0.5), max * 3];
			const total = max + offsets[c % offsets.length]!;
			const s = createRowScrollScaling(total, max, viewport);
			const domMax = s.domTotal - viewport;
			const logMax = total - viewport;
			if (s.domToLogical(0) !== 0 || Math.abs(s.domToLogical(domMax) - logMax) > 1e-6) bad.push(`ends ${total}/${max}/${viewport}`);
			let last = -1;
			for (let i = 0; i <= 500; i += 1) {
				const d = (domMax * i) / 500;
				const l = s.domToLogical(d);
				if (l + 1e-6 < last) bad.push(`down ${d} ${total}/${max}/${viewport}`);
				last = l;
				if (Math.abs(s.logicalToDom(l) - d) > 1e-3) bad.push(`inverse ${d} ${total}/${max}/${viewport}`);
			}
		}
		expect(bad).toEqual([]);
	});
});

describe('resolveMaxDomHeight', () => {
	it('conserva el tope de escritorio con un margen de seguridad', () => {
		const cap = resolveMaxDomHeight(33_554_400, 33_554_400, MAX_DOM_SCROLL_HEIGHT_FALLBACK);
		expect(cap).toBeLessThan(33_554_400);
		expect(cap).toBeGreaterThan(33_000_000);
	});
	it('usa la lectura de scroll si el móvil exagera la de layout', () => {
		const cap = resolveMaxDomHeight(24_000_000, 6_000_000, MAX_DOM_SCROLL_HEIGHT_FALLBACK);
		expect(cap).toBeLessThanOrEqual(6_000_000);
		expect(cap).toBeGreaterThan(5_900_000);
	});
	it('cae al fallback con lecturas basura (0 o ~1e9)', () => {
		expect(resolveMaxDomHeight(0, 0, MAX_DOM_SCROLL_HEIGHT_FALLBACK)).toBe(MAX_DOM_SCROLL_HEIGHT_FALLBACK);
		expect(resolveMaxDomHeight(1e9, 1e9, MAX_DOM_SCROLL_HEIGHT_FALLBACK)).toBe(MAX_DOM_SCROLL_HEIGHT_FALLBACK);
	});
	it('ignora una lectura basura y confía en la válida', () => {
		const cap = resolveMaxDomHeight(1e9, 5_000_000, MAX_DOM_SCROLL_HEIGHT_FALLBACK);
		expect(cap).toBeLessThanOrEqual(5_000_000);
		expect(cap).toBeGreaterThan(4_900_000);
	});
});

describe('detección del tope sin DOM (entorno node)', () => {
	it('devuelve el fallback sin romperse', () => {
		expect(detectMaxDomHeight()).toBe(MAX_DOM_SCROLL_HEIGHT_FALLBACK);
	});
	it('no mide nada para alturas pequeñas y usa el fallback para las grandes', () => {
		expect(maxDomHeightFor(1_000_000)).toBe(MAX_DOM_SCROLL_HEIGHT_FALLBACK);
		expect(maxDomHeightFor(35_000_000)).toBe(MAX_DOM_SCROLL_HEIGHT_FALLBACK);
		expect(MAX_DOM_SCROLL_HEIGHT_FALLBACK).toBeLessThanOrEqual(MAX_DOM_PAINT_HEIGHT);
	});
});
