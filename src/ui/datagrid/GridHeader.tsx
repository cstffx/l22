import { For, Show } from 'solid-js';
import type { Column, Header, RowData } from '../../grid/core';
import type { GridCtx } from './context';
import { GridCheckbox, renderTemplate } from './parts';

export function GridHeader<TData extends RowData>(p: { ctx: GridCtx<TData> }) {
	const { props, s, model, layout, virt } = p.ctx;
	const headerLabel = (header: Header<TData>) => renderTemplate(header.column.columnDef.header, () => header.getContext(), () => header.id);
	const headerText = (header: Header<TData>) => {
		const tpl = header.column.columnDef.header;
		return typeof tpl === 'string' ? tpl : header.id;
	};
	return (
		<thead role="rowgroup">
			<tr role="row" aria-rowindex={1}>
				<For each={virt.slots()}>
					{(slot) => {
						if (slot.kind === 'gap') return <th class="ui-dg-th ui-dg-spacer" aria-hidden="true" style={layout.cellStyle(slot)} />;
						if (slot.kind === 'sys') {
							return (
								<th role="columnheader" class={`ui-dg-th ui-dg-sys${layout.pinClass(slot)}`} style={layout.cellStyle(slot)}>
									<div class="ui-dg-sysbox">
										<Show when={s.selectable()}>
											<GridCheckbox checked={model.allSelected()} mixed={model.someSelected()} onChange={model.toggleAll} label={s.text().selectAll} />
										</Show>
									</div>
								</th>
							);
						}
						const header = slot.header;
						const column = header.column as Column<TData>;
						const sortable = model.canSort(column);
						const body = (
							<>
								<Show when={props.headerIcon?.(column.columnDef)}>
									{(path) => (
										<span class="ui-dg-head-icon">
											<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={path()} /></svg>
										</span>
									)}
								</Show>
								<span class="ui-dg-truncate">{headerLabel(header)}</span>
								<Show when={sortable}>
									<span class={`ui-dg-sort${model.sortDir(header.id) ? ' is-active' : ''}`} style={{ transform: model.sortDir(header.id)?.desc ? 'rotate(180deg)' : undefined }} aria-hidden="true">
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
									</span>
								</Show>
							</>
						);
						return (
							<th
								role="columnheader"
								class={`ui-dg-th${layout.pinClass(slot)}${layout.alignClass(column)}`}
								style={layout.cellStyle(slot)}
								aria-sort={model.ariaSort(header.id)}
							>
								<Show when={sortable} fallback={<div class="ui-dg-head-btn is-static">{body}</div>}>
									<button type="button" class="ui-dg-head-btn" onClick={() => model.toggleSort(header.id)}>{body}</button>
								</Show>
								<Show when={layout.canResize(column)}>
									<span role="separator" aria-orientation="vertical" aria-label={s.text().resizeColumn(headerText(header))} class={`ui-dg-resize${layout.resizing() === header.id ? ' is-resizing' : ''}`} onPointerDown={layout.startResize(header)} />
								</Show>
							</th>
						);
					}}
				</For>
			</tr>
		</thead>
	);
}
