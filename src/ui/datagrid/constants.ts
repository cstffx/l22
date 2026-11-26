export const DEFAULT_ROW_HEIGHT = 35;
export const DEFAULT_CONTAINER_HEIGHT = 520;
export const DEFAULT_COLUMN_WIDTH = 140;
export const DEFAULT_ROW_OVERSCAN = 10;
export const DEFAULT_COLUMN_OVERSCAN = 3;
export const DEFAULT_ROW_NUMBER_WIDTH = 64;
export const MIN_COLUMN_WIDTH = 50;
/** Filas extra en el primer pintado; el overscan completo llega dos frames después. */
export const MOUNT_ROW_OVERSCAN = 2;
/** Tope de altura DOM que se usa si no se puede medir el del navegador (sin DOM, o una lectura inservible). */
export const MAX_DOM_SCROLL_HEIGHT_FALLBACK = 8_000_000;
/** Por encima de ~2^24 px el pintado pierde píxeles enteros: el tope medido nunca pasa de aquí. */
export const MAX_DOM_PAINT_HEIGHT = 16_000_000;
/** Por debajo de esta altura total ningún navegador conocido recorta: ni siquiera se mide el tope (evita un reflow). */
export const MAX_DOM_DETECT_FROM = 2_000_000;
/** Columnas que avanza de golpe la ventana de columnas centrales al hacer scroll horizontal (histéresis, como svgrid). */
export const COLUMN_WINDOW_STEP = 3;
