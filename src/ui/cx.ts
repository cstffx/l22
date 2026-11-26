/** Une clases de texto ignorando valores vacíos o no textuales. */
export function cx(...parts: unknown[]) {
	return parts.filter((p): p is string => typeof p === 'string' && p !== '').join(' ');
}
