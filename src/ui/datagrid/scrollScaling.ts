/*
 * "Scroll scaling" vertical (portado de createRowScrollScaling de svgrid): los navegadores limitan la altura de un
 * elemento (Chrome/Safari ~33,5M px, Firefox ~17,9M) y el pintado pierde píxeles enteros por encima de 2^24 (16,7M).
 * Con 1 000 000 de filas × 35 px el final de la lista sería inalcanzable. Aquí el DOM usa una altura total acotada
 * (`domTotal`) y se convierte entre el `scrollTop` del DOM y el desplazamiento lógico (el de la lista real).
 * Por debajo del tope todo es la identidad y el comportamiento es el de siempre.
 */
import { MAX_DOM_DETECT_FROM, MAX_DOM_PAINT_HEIGHT, MAX_DOM_SCROLL_HEIGHT_FALLBACK } from './constants';

export type RowScrollScaling = {
	/** La altura real supera el tope y la conversión se aplica. */
	readonly active: boolean;
	/** Altura (px) del contenido en el DOM: la real, o el tope si lo supera. */
	readonly domTotal: number;
	/** `scrollTop` del DOM a desplazamiento lógico. */
	domToLogical(domTop: number): number;
	/** Desplazamiento lógico a `scrollTop` del DOM. */
	logicalToDom(logical: number): number;
};

/** Debajo de esto una lectura es basura (0 en jsdom, una rareza de layout...). */
const SANITY_FLOOR = 100_000;
/** Desde aquí el navegador no recortó (devolvió ~el 1e9 pedido). */
const SANITY_CEIL = 900_000_000;
/** Se quita un 0,5 % al tope medido para no apoyar el espaciador en el borde físico, donde un redondeo deja la última fila fuera. */
const SAFETY = 0.995;

/**
 * Tope utilizable a partir de dos lecturas: la altura de layout de una sonda altísima y el `scrollHeight` que expone un
 * contenedor `overflow:auto` con esa sonda. En móviles/DPR alto la segunda es menor y es la que cuenta, así que se toma
 * la menor. Las lecturas basura se descartan; si no queda ninguna se devuelve `fallback`.
 */
export function resolveMaxDomHeight(layoutCap: number, scrollCap: number, fallback: number): number {
	const usable = [layoutCap, scrollCap].filter((v) => Number.isFinite(v) && v > SANITY_FLOOR && v < SANITY_CEIL);
	if (usable.length === 0) return fallback;
	return Math.floor(Math.min(...usable) * SAFETY);
}

/**
 * Conversión de una dimensión.
 *
 * @param trueTotal    Altura real del contenido (filas × alto de fila).
 * @param maxDomHeight Tope de altura del DOM.
 * @param viewport     Alto visible de las filas (el área con scroll menos cabecera y pie).
 *
 * Invariantes (ver scrollScaling.test.ts): identidad si `trueTotal <= maxDomHeight`; `domTotal <= maxDomHeight`; el
 * rango DOM `[0, domTotal - viewport]` se corresponde con el lógico `[0, trueTotal - viewport]` (la última fila es
 * alcanzable); las dos conversiones son inversas, monótonas y recortan lo que se sale de rango. En los extremos
 * (`edge` px) un píxel es un píxel, para que las filas pintadas alrededor de la vista no se salgan del espaciador.
 */
export function createRowScrollScaling(trueTotal: number, maxDomHeight: number, viewport: number): RowScrollScaling {
	const active = trueTotal > maxDomHeight;
	const domTotal = active ? maxDomHeight : trueTotal;
	const domRange = Math.max(0, domTotal - viewport);
	const logicalRange = Math.max(0, trueTotal - viewport);
	/* Más que el overscan y una vista de las filas más altas; a lo sumo un tercio del rango. */
	const edge = Math.min(8192, domRange / 3);
	const map = (value: number, from: number, to: number): number => {
		const v = Math.min(Math.max(value, 0), from);
		if (v <= edge) return v;
		if (v >= from - edge) return to - from + v;
		return edge + ((v - edge) * (to - 2 * edge)) / (from - 2 * edge);
	};
	return {
		active,
		domTotal,
		domToLogical: (domTop) => (active ? map(domTop, domRange, logicalRange) : domTop),
		logicalToDom: (logical) => (active ? map(logical, logicalRange, domRange) : logical),
	};
}

let detected: number | undefined;
let detectedAtDpr = 0;
const currentDpr = () => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

/**
 * Mide el tope de altura del navegador con una sonda de 1e9 px dentro de un contenedor `overflow:auto` fuera de pantalla
 * (una sola vez, se guarda por DPR). Sin DOM (SSR, tests en node) o ante cualquier fallo devuelve el fallback
 * conservador. `window.__dgMaxDomHeight` fija el valor a mano (reproducir un móvil en escritorio, o corregir una
 * lectura mala). Nunca pasa de MAX_DOM_PAINT_HEIGHT.
 */
export function detectMaxDomHeight(): number {
	if (typeof window !== 'undefined') {
		const forced = (window as unknown as { __dgMaxDomHeight?: unknown }).__dgMaxDomHeight;
		if (typeof forced === 'number' && Number.isFinite(forced) && forced > 0) return forced;
	}
	if (detected !== undefined && detectedAtDpr === currentDpr()) return detected;
	if (typeof document === 'undefined' || !document.body) return MAX_DOM_SCROLL_HEIGHT_FALLBACK;
	try {
		const wrap = document.createElement('div');
		wrap.style.cssText = 'position:fixed;top:0;left:-9999px;width:1px;height:100px;overflow:auto;visibility:hidden;pointer-events:none;';
		const probe = document.createElement('div');
		probe.style.cssText = 'width:1px;height:1000000000px;';
		wrap.appendChild(probe);
		document.body.appendChild(wrap);
		const layoutCap = probe.offsetHeight;
		const scrollCap = wrap.scrollHeight;
		document.body.removeChild(wrap);
		detected = Math.min(resolveMaxDomHeight(layoutCap, scrollCap, MAX_DOM_SCROLL_HEIGHT_FALLBACK), MAX_DOM_PAINT_HEIGHT);
	} catch {
		detected = MAX_DOM_SCROLL_HEIGHT_FALLBACK;
	}
	detectedAtDpr = currentDpr();
	return detected;
}

/** Tope para una altura total dada: por debajo de MAX_DOM_DETECT_FROM no se mide nada (ningún navegador recorta ahí). */
export const maxDomHeightFor = (trueTotal: number): number => (trueTotal <= MAX_DOM_DETECT_FROM ? MAX_DOM_SCROLL_HEIGHT_FALLBACK : detectMaxDomHeight());
