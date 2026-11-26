/** Tipos de configuración de sparklines en celda (la geometría vive en el renderer). */
export type SparklineType = 'line' | 'area' | 'bar' | 'winloss';

export type SparklineConfig = {
	type?: SparklineType;
	/** Trazo (line/area) o relleno positivo (bar/winloss). */
	color?: string;
	/** Relleno de barras negativas / pérdidas. */
	negativeColor?: string;
	width?: number;
	height?: number;
	/** Fija la escala de valores en vez de derivarla de los datos de la fila. */
	min?: number;
	max?: number;
	lineWidth?: number;
	/** Dibuja un punto en el último valor (line/area). Por defecto true. */
	lastPoint?: boolean;
};
