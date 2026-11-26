// Declaración de la etiqueta `<sv-grid-scrollbar>` que define `sv-grid-scrollbar.ts`.
// El proyecto usa `jsxImportSource: @solidjs/web`, así que el namespace JSX se amplía
// en `@solidjs/web/jsx-runtime` (ampliar `solid-js` no surte efecto).
import '@solidjs/web/jsx-runtime';

declare module '@solidjs/web/jsx-runtime' {
	namespace JSX {
		interface IntrinsicElements {
			'sv-grid-scrollbar': {
				class?: string;
				style?: string;
				ref?: (el: HTMLElement) => void;
				orientation?: 'horizontal' | 'vertical';
				'viewport-size'?: number;
				'content-size'?: number;
				value?: number;
				step?: number;
			};
		}
	}
}
