import { For, Show } from 'solid-js';
import type { RowData } from '../grid/core';
import { Scrollbar } from './Scrollbar';
import { createCellRanges } from './datagrid/createCellRanges';
import { createCells } from './datagrid/createCells';
import { createColumnLayout } from './datagrid/createColumnLayout';
import { createMerges } from './datagrid/createMerges';
import { createGridModel } from './datagrid/createGridModel';
import { createVirtualization } from './datagrid/createVirtualization';
import { GridBody } from './datagrid/GridBody';
import { GridFooter } from './datagrid/GridFooter';
import { GridHeader } from './datagrid/GridHeader';
import { createSettings } from './datagrid/settings';
import type { DataGridProps } from './datagrid/types';
import './tokens.css';
import './motion.css';
import './datagrid.css';

export * from './datagrid/types';

/* ─────────────────────────────────────────────────────────
 * DataGrid — rejilla configurable sobre el núcleo headless
 * (`createGrid`), con la API de `SvGrid` (referencia Svelte).
 * Este archivo solo ensambla: el estado vive en `datagrid/create*`
 * y el marcado en `GridHeader` / `GridBody` / `GridFooter`.
 * Nada de aquí conoce el dominio de los datos.
 * ───────────────────────────────────────────────────────── */
export function DataGrid<TData extends RowData>(props: DataGridProps<TData>) {
	const s = createSettings(props);
	const model = createGridModel(props);
	const layout = createColumnLayout(props, s, model);
	const virt = createVirtualization(props, s, model, layout);
	const merges = createMerges(props, layout, virt);
	const ranges = createCellRanges(props, s, model, layout, virt, merges);
	const cells = createCells(props, model);
	const ctx = { props, s, model, layout, virt, ranges, merges, cells };
	props.onApiReady?.({ ...layout.pinApi, ...ranges.api });

	return (
		<div class="ui-dg-shell">
			<div
				ref={virt.bindScroller}
				onScroll={(e) => virt.measureViewport(e.currentTarget)}
				onKeyDown={ranges.onKeyDown}
				class="ui-dg-scroll"
				tabindex={0}
				style={{ '--dg-max-height': virt.containerHeightCss(), '--dg-row-h': `${s.rowHeight()}px`, '--dg-head-h': `${s.headerHeight()}px` }}
				aria-label={props.gridLabel}
			>
				<table
					class={`ui-dg-table${layout.isFlex() ? ' is-flex' : ''}${props.enableRowHover === false ? ' no-hover' : ''}${ranges.enabled() ? ' is-selectable' : ''}`}
					ref={virt.bindTable}
					role={props.treeData ? 'treegrid' : 'grid'}
					aria-rowcount={model.rows().length + 1 + (layout.hasFooter() ? 1 : 0)}
					aria-colcount={layout.leafHeaders().length + (s.sysWidth() > 0 ? 1 : 0)}
					style={{
						width: `${layout.totalWidth()}px`,
						...(layout.isFlex() ? { ...layout.widthVars(), '--dg-gap-before': `${virt.centerWindow().before}px`, '--dg-gap-after': `${virt.centerWindow().after}px` } : {}),
					}}
				>
					<Show when={!layout.isFlex()}>
						<colgroup>
							<For each={virt.slots()}>{(slot) => <col style={{ width: `${virt.slotWidth(slot)}px` }} />}</For>
						</colgroup>
					</Show>
					<GridHeader ctx={ctx} />
					<GridBody ctx={ctx} />
					<Show when={layout.hasFooter()}>
						<GridFooter ctx={ctx} />
					</Show>
				</table>
			</div>
			<Show when={virt.overflowY()}>
				<Scrollbar
					class="ui-dg-vbar"
					orientation="vertical"
					viewportSize={virt.viewport().height}
					contentSize={virt.viewport().scrollHeight}
					value={virt.viewport().top}
					step={virt.verticalStep()}
					onScrollChange={(v) => virt.scrollTo('top', v)}
				/>
			</Show>
			<Show when={virt.overflowX()}>
				<Scrollbar
					class="ui-dg-hbar"
					orientation="horizontal"
					viewportSize={virt.viewport().width}
					contentSize={virt.viewport().scrollWidth}
					value={virt.viewport().left}
					onScrollChange={(v) => virt.scrollTo('left', v)}
				/>
			</Show>
			<Show when={virt.overflowX() && virt.overflowY()}>
				<div class="ui-dg-corner" />
			</Show>
		</div>
	);
}
