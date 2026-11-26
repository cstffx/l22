/**
 * createGrid — adaptador de Solid sobre el núcleo headless (puerto de
 * `createGrid.svelte.ts`). El motor es `createSvGridCore`, sin DOM ni
 * reactividad; aquí solo se le añade `grid.state`, una porción reactiva del
 * store elegida con un selector.
 */
import { createSignal, getOwner, onCleanup } from 'solid-js';
import { createSvGridCore } from './core';
import type { RowData, SvGrid, SvGridOptions, TableFeatures } from './core';

/** Instancia que devuelve `createSvGrid`: el {@link SvGrid} headless más `state` reactivo. */
export type SolidGrid<
	TFeatures extends TableFeatures,
	TData extends RowData,
	TSelected = object,
> = SvGrid<TData> & {
	readonly state: Readonly<TSelected>;
	/** Marca de tipo: las features con las que se creó la instancia. */
	readonly _features?: TFeatures;
};

/**
 * Motor headless para Solid: la misma rejilla sin renderer, para que escribas el
 * marcado. `selector` elige la porción del estado que lee tu plantilla; se
 * reejecuta en cada cambio del store y se expone como `grid.state` (señal), de
 * modo que leer `grid.state.sorting` en JSX o en un efecto reacciona al orden.
 */
export function createSvGrid<
	TFeatures extends TableFeatures,
	TData extends RowData,
	TSelected = object,
>(
	gridOptions: SvGridOptions<TFeatures, TData>,
	selector: (state: Record<string, unknown>) => TSelected = () => ({}) as TSelected,
): SolidGrid<TFeatures, TData, TSelected> {
	const grid = createSvGridCore(gridOptions) as SolidGrid<TFeatures, TData, TSelected>;
	// Se guarda envuelto: un selector que devolviera una función se tomaría por un cómputo.
	const [selected, setSelected] = createSignal({ value: selector(grid.store.state) });
	const unsubscribe = grid.store.subscribe(() =>
		setSelected({ value: selector(grid.store.state) }),
	);
	if (getOwner()) onCleanup(unsubscribe);

	Object.defineProperty(grid, 'state', {
		get: () => selected().value,
		configurable: true,
		enumerable: true,
	});

	return grid;
}

/** Alias de {@link createSvGrid}. */
export const createGrid = createSvGrid;
