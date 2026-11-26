import { For } from 'solid-js';
import { applyGroupAggregate } from '../../grid/core';
import type { Column, Header, RowData } from '../../grid/core';
import type { GridCtx } from './context';
import { asText, renderTemplate } from './parts';

export function GridFooter<TData extends RowData>(p: { ctx: GridCtx<TData> }) {
	const { model, layout, virt } = p.ctx;
	const renderFooter = (header: Header<TData>) => {
		const def = header.column.columnDef;
		if (def.footer !== undefined) return renderTemplate(def.footer, () => header.getContext(), () => '');
		if (def.summary !== undefined && def.summary !== false) return asText(applyGroupAggregate(def.summary, header.id, model.rows()));
		return '';
	};
	return (
		<tfoot class="ui-dg-tf" role="rowgroup">
			<tr role="row" aria-rowindex={model.rows().length + 2}>
				<For each={virt.slots()}>
					{(slot) => {
						if (slot.kind === 'gap') return <td class="ui-dg-td ui-dg-spacer" aria-hidden="true" style={layout.cellStyle(slot)} />;
						if (slot.kind === 'sys') return <td role="gridcell" class={`ui-dg-td ui-dg-sys${layout.pinClass(slot)}`} style={layout.cellStyle(slot)} />;
						const column = slot.header.column as Column<TData>;
						return <td role="gridcell" class={`ui-dg-td${layout.pinClass(slot)}${layout.alignClass(column)}`} style={layout.cellStyle(slot)}>{renderFooter(slot.header)}</td>;
					}}
				</For>
			</tr>
		</tfoot>
	);
}
