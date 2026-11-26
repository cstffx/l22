import { createMemo, For, Show, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import type { Column, Row, RowData } from '../../grid/core';
import type { RangeBox } from './createCellRanges';
import type { GridCtx } from './context';
import { sameDraw } from './merges';
import { GridCheckbox } from './parts';
import { TreeCell } from './TreeCell';
import type { Slot } from './types';

export function GridBody<TData extends RowData>(p: { ctx: GridCtx<TData> }) {
	const { props, s, model, layout, virt, ranges, merges, cells } = p.ctx;
	const treeColumnId = virt.treeColumnId;
	const rowCount = () => model.rows().length;
	/* Cajas de rango de una celda host: el <For> solo existe mientras la celda es host. */
	const renderBoxes = (list: RangeBox[] | undefined) =>
		list && (
			<For each={list}>
				{(box) => (
					<div
						class={['ui-dg-range', { 'is-open-left': box.openLeft, 'is-open-right': box.openRight }]}
						style={{ left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` }}
						aria-hidden="true"
					/>
				)}
			</For>
		);
	/*
	 * Los eventos de celda y fila se atienden en el <tbody> y no en cada <td>/<tr>: la celda sale de data-r/data-c.
	 * Así cada celda pintada no crea ni conserva sus propios manejadores.
	 */
	const cellAt = (event: Event) => {
		const td = (event.target as Element | null)?.closest<HTMLElement>('td[data-c]');
		if (!td) return undefined;
		const rowIdx = Number(td.dataset.r);
		const column = layout.displayCols()[Number(td.dataset.c)]?.column as Column<TData> | undefined;
		const row = model.rows()[rowIdx];
		return row && column ? { td, row, column, rowIdx } : undefined;
	};
	const onBodyPointerDown = (event: PointerEvent) => {
		const cell = cellAt(event);
		if (cell) ranges.onCellPointerDown(event, cell.rowIdx, Number(cell.td.dataset.c));
	};
	const onBodyDblClick = (event: MouseEvent) => {
		const cell = cellAt(event);
		if (cell) cells.startEdit(cell.row, cell.column);
	};
	const onBodyKeyDown = (event: KeyboardEvent) => {
		const cell = cellAt(event);
		if (cell && event.target === cell.td && (event.key === 'Enter' || event.key === 'F2')) {
			event.preventDefault();
			cells.startEdit(cell.row, cell.column);
		}
	};
	const onBodyClick = (event: MouseEvent) => {
		if (!props.onCellClick && !props.onRowClick) return;
		const cell = cellAt(event);
		if (cell) props.onCellClick?.({ row: cell.row.original, rowIndex: cell.rowIdx, columnId: cell.column.id, event });
		const tr = (event.target as Element).closest<HTMLElement>('tr[data-r]');
		const row = tr && model.rows()[Number(tr.dataset.r)];
		if (row) props.onRowClick?.({ row: row.original, rowIndex: Number(tr.dataset.r), event });
	};
	/*
	 * Celda de datos con `mergedCells` activo (solo se usa entonces; las celdas normales no pasan por aquí). Cada celda
	 * pregunta cómo se dibuja en la ventana actual: sin combinación es una celda normal; una cubierta no emite `<td>`; el
	 * origen o la continuación lleva `rowspan`/`colspan` y el contenido, el estado de edición y los `data-r`/`data-c` de
	 * la celda ORIGEN, de modo que clic, doble clic, edición y selección actúan sobre la combinación entera. Las cajas de
	 * rango se cuelgan de la celda dibujada (su esquina superior izquierda), con sus propias coordenadas.
	 */
	const renderMergedCell = (slot: Extract<Slot<TData>, { kind: 'col' }>, rowOf: () => Row<TData>, rowIdx: () => number) => {
		const column = slot.header.column as Column<TData>;
		const colIdx = () => ranges.colIndexById().get(column.id) ?? -1;
		const draw = createMemo(() => merges.drawAt(rowIdx(), colIdx()), { equals: sameDraw });
		const origin = createMemo(() => {
			const d = draw();
			if (!d || d.kind === 'skip') return { row: rowOf(), column, r: rowIdx(), c: colIdx() };
			const { rowIndex: r, colIndex: c } = d.merge;
			return { row: model.rows()[r] ?? rowOf(), column: (layout.displayCols()[c]?.column as Column<TData> | undefined) ?? column, r, c };
		});
		const colSpan = () => {
			const d = draw();
			return d && d.kind !== 'skip' ? d.colSpan : 1;
		};
		const rowSpan = () => {
			const d = draw();
			return d && d.kind !== 'skip' ? d.rowSpan : 1;
		};
		const boxes = () => ranges.boxesAt(rowIdx(), colIdx());
		const treeId = untrack(treeColumnId);
		/* El borde de anclado lo marca la última columna que abarca la celda. */
		const pinClass = () => {
			const last = layout.displayCols()[colIdx() + colSpan() - 1];
			return layout.pinClass(last && colSpan() > 1 ? { ...slot, header: last } : slot);
		};
		const style = (): JSX.CSSProperties | undefined => {
			if (!layout.isFlex() || colSpan() === 1) return layout.cellStyle(slot);
			const width = layout.sumWidths(layout.displayCols().slice(colIdx(), colIdx() + colSpan()));
			return { ...layout.pinStyle(slot), width: `${width}px` } as JSX.CSSProperties;
		};
		return (
			<Show when={draw()?.kind !== 'skip'}>
				<td
					role="gridcell"
					class={['ui-dg-td', pinClass(), layout.alignClass(origin().column), { 'is-editing': cells.isEditing(origin().row, origin().column), 'is-range-host': !!boxes() }]}
					style={style()}
					rowspan={rowSpan() > 1 ? rowSpan() : undefined}
					colspan={colSpan() > 1 ? colSpan() : undefined}
					data-r={origin().r}
					data-c={origin().c}
					tabindex={cells.canEdit(origin().row, origin().column) ? -1 : undefined}
				>
					<div class="ui-dg-cell">
						{origin().column.id === treeId ? <TreeCell ctx={p.ctx} row={origin().row} column={origin().column} /> : cells.renderPlain(origin().row, origin().column)}
					</div>
					{renderBoxes(boxes())}
				</td>
			</Show>
		);
	};
	const renderRow = (rowOf: () => Row<TData>, absIndex: () => number, merged: boolean) => (
		<tr
			role="row"
			class={['ui-dg-row', { 'is-selected': model.isSelected(rowOf().id), 'is-zebra': !!props.zebraRows && absIndex() % 2 === 1 }, props.rowClass?.(rowOf().original, absIndex())]}
			data-r={absIndex()}
			aria-rowindex={absIndex() + 2}
			aria-level={props.treeData ? rowOf().depth + 1 : undefined}
			aria-expanded={model.rowAriaExpanded(rowOf())}
		>
			{/*
			 * keyed por slot (`virt.slotKey`): una celda central reciclable es de su slot y `slotOf()` cambia de columna al
			 * hacer scroll horizontal (el <For> la conserva y la mueve a su sitio); el resto (ancladas, árbol, sys,
			 * huecos, y todo sin virtualización de columnas) tiene como clave el propio objeto y no cambia nunca.
			 */}
			<For each={virt.slots()} keyed={virt.slotKey}>
				{(slotOf) => {
					const slot = untrack(slotOf);
					if (slot.kind === 'gap') return <td class="ui-dg-td ui-dg-spacer" aria-hidden="true" style={virt.settling() ? ({ ...layout.cellStyle(slot), '--dg-skel-x': `${-virt.gapX(slot.side)}px` } as JSX.CSSProperties) : layout.cellStyle(slot)} />;
					if (slot.kind === 'sys') {
						return (
							<td role="gridcell" class={`ui-dg-td ui-dg-sys${layout.pinClass(slot)}`} style={layout.cellStyle(slot)}>
								<div class="ui-dg-sysbox">
									<span class={`ui-dg-rowslot${s.showNumbers() && s.selectable() ? ' is-swap' : ''}`}>
										<Show when={s.showNumbers()}>
											<span class="ui-dg-rownum">{absIndex() + 1}</span>
										</Show>
										<Show when={s.selectable()}>
											<GridCheckbox class="ui-dg-rowcheck" checked={model.isSelected(rowOf().id)} onChange={() => model.toggleRow(rowOf().id)} label={s.text().selectRow} />
										</Show>
									</span>
								</div>
							</td>
						);
					}
					if (merged) return renderMergedCell(slot, rowOf, absIndex);
					/* Slot actual de la celda: constante salvo en las reciclables, donde cambia al entrar otra columna. */
					const cur = slotOf as () => Extract<Slot<TData>, { kind: 'col' }>;
					const column = () => cur().header.column as Column<TData>;
					const rowIdx = absIndex;
					const colIdx = () => ranges.colIndexById().get(column().id) ?? -1;
					const boxes = () => ranges.boxesAt(rowIdx(), colIdx());
					/*
					 * Se resuelve una vez al crear la celda, no por celda ni de forma reactiva: una celda reciclable (con `id`)
					 * nunca lleva la columna del árbol (`createVirtualization` le da identidad por columna), así que su rama
					 * `renderPlain` no cambia y `column()` es lo único que se reevalúa. Un cambio de columnas crea celdas nuevas
					 * y lo reevalúa; activar o desactivar `treeData` en vivo no cambia las celdas ya pintadas.
					 */
					const isTreeCol = slot.id === undefined && slot.header.id === untrack(treeColumnId);
					return (
						<td
							role="gridcell"
							class={`ui-dg-td${layout.pinClass(cur())}${layout.alignClass(column())}${cells.isEditing(rowOf(), column()) ? ' is-editing' : ''}${boxes() ? ' is-range-host' : ''}`}
							style={layout.cellStyle(cur())}
							data-r={rowIdx()}
							data-c={colIdx()}
							tabindex={cells.canEdit(rowOf(), column()) ? -1 : undefined}
						>
							<div class="ui-dg-cell">
								{isTreeCol ? <TreeCell ctx={p.ctx} row={rowOf()} column={column()} /> : cells.renderPlain(rowOf(), column())}
							</div>
							{renderBoxes(boxes())}
						</td>
					);
				}}
			</For>
		</tr>
	);
	/* Con combinaciones activas se ignora `recycleRows`: el `<td>` de una combinación depende de su fila y no sobrevive a reasignar el slot. */
	const renderRows = (merged: boolean) => (
		<Show
			when={props.recycleRows && !merged}
			fallback={<For each={virt.visibleRows()}>{(row, index) => renderRow(() => row, () => virt.firstRow() + index(), merged)}</For>}
		>
			<For each={virt.rowSlots()} keyed={(slot) => slot.id}>{(slot) => renderRow(() => slot().row, () => slot().index, merged)}</For>
		</Show>
	);
	return (
		<tbody role="rowgroup" class={virt.settling() ? 'is-settling' : undefined} style={virt.settling() ? virt.skeleton() : undefined} onPointerDown={onBodyPointerDown} onDragStart={ranges.onDragStart} onDblClick={onBodyDblClick} onKeyDown={onBodyKeyDown} onClick={onBodyClick}>
			<Show when={virt.firstRow() > 0}>
				<tr aria-hidden="true" style={{ height: `${virt.topSpace()}px` }}><td class="ui-dg-vspacer" colspan={virt.slots().length} /></tr>
			</Show>
			{/* Con o sin combinaciones: solo pasar de ninguna a alguna (o al revés) recrea las filas. */}
			<Show when={merges.active()} fallback={renderRows(false)}>
				{renderRows(true)}
			</Show>
			<Show when={rowCount() === 0}>
				<tr role="row"><td role="gridcell" class="ui-dg-empty" colspan={virt.slots().length}>{s.text().empty}</td></tr>
			</Show>
			<Show when={rowCount() - virt.lastRow() > 0}>
				<tr aria-hidden="true" style={{ height: `${virt.bottomSpace()}px` }}><td class="ui-dg-vspacer" colspan={virt.slots().length} /></tr>
			</Show>
		</tbody>
	);
}
