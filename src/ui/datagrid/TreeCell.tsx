import { Show } from 'solid-js';
import type { Column, Row, RowData } from '../../grid/core';
import type { GridCtx } from './context';

/** Celda de la columna del árbol: sangría, expansor, contenido y botón "+" opcional. */
export function TreeCell<TData extends RowData>(p: { ctx: GridCtx<TData>; row: Row<TData>; column: Column<TData> }) {
	const { props, s, model, cells } = p.ctx;
	const add = () => props.treeData?.addChildLabel ?? s.text().addChild;
	return (
		<div class="ui-dg-tree-cell">
			<span class="ui-dg-tree-indent" style={{ width: `${p.row.depth * (props.treeData?.indentPx ?? 12)}px` }} aria-hidden="true" />
			<Show when={p.row.getCanExpand()} fallback={<span class="ui-dg-tree-spacer" aria-hidden="true" />}>
				<button
					type="button"
					class={['ui-dg-tree-toggle', { 'is-open': model.isExpanded(p.row.id) }]}
					aria-expanded={model.isExpanded(p.row.id) ? 'true' : 'false'}
					aria-label={model.isExpanded(p.row.id) ? s.text().collapseRow : s.text().expandRow}
					onClick={(event) => {
						event.stopPropagation();
						model.toggleExpanded(p.row);
					}}
				>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
				</button>
			</Show>
			<div class="ui-dg-tree-body">{cells.renderPlain(p.row, p.column)}</div>
			<Show when={props.treeData?.onAddChild}>
				<button
					type="button"
					class="ui-dg-tree-add"
					tabindex={-1}
					aria-label={add()}
					title={add()}
					onClick={(event) => {
						event.stopPropagation();
						props.treeData?.onAddChild?.(p.row.original);
					}}
				>
					+
				</button>
			</Show>
		</div>
	);
}
