import { createSignal, For, Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { DropdownMenu } from './DropdownMenu';
import { IconCheck } from './icons';
import './tokens.css';
import './flowcondition.css';

/* Cuerpo If / Else para un nodo de FlowChart (`content`). Cada regla es una fila:
 *
 *   If [origen] [propiedad ▾] is [valor ▾]
 *   and [origen] [propiedad ▾] is [valor ▾]
 *
 * Las fichas abren un DropdownMenu real. Se marcan con `data-no-drag`,
 * así que no inician el arrastre del nodo.
 */

export type FlowOption = { name: string; tag?: string };
export type FlowRule = { property: string; value: string };

export type FlowConditionProps = {
	/** Etiqueta del origen de datos (ficha fija a la izquierda de cada regla). */
	source: string;
	sourceIcon?: JSX.Element;
	/** Propiedades elegibles. */
	properties: string[];
	/** Valores elegibles para una propiedad. */
	options: (property: string) => FlowOption[];
	rules?: FlowRule[];
	defaultRules?: FlowRule[];
	onRulesChange?: (rules: FlowRule[]) => void;
	/** Color del punto en la ficha de valor (por defecto `var(--accent)`). */
	dot?: string;
};

function Chevron() {
	return (
		<svg class="ui-flow-chip-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

function Handle() {
	return (
		<svg class="ui-flow-handle" width="10" height="16" viewBox="0 0 10 16" aria-hidden="true">
			<For each={[3, 8, 13]}>
				{(y) => (
					<>
						<circle cx="3" cy={y} r="1.1" fill="currentColor" />
						<circle cx="7.5" cy={y} r="1.1" fill="currentColor" />
					</>
				)}
			</For>
		</svg>
	);
}

function SelectChip(props: { value: string; items: FlowOption[]; width: number; dot?: string; onPick: (name: string) => void }) {
	return (
		<DropdownMenu placement="bottom-start">
			<DropdownMenu.Trigger as="button" type="button" class="ui-flow-chip" data-no-drag>
				<Show when={props.dot}>{(dot) => <span class="ui-flow-chip-dot" style={{ background: dot() }} />}</Show>
				<span class="ui-flow-chip-text">{props.value}</span>
				<Chevron />
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content data-no-drag style={{ width: `${props.width}px` }}>
					<DropdownMenu.RadioGroup value={props.value} onChange={props.onPick}>
						<For each={props.items}>
							{(item) => (
								<DropdownMenu.RadioItem value={item.name}>
									<DropdownMenu.Label>{item.name}</DropdownMenu.Label>
									<Show when={item.tag}>
										<span class="ui-flow-chip-tag">{item.tag}</span>
									</Show>
									<DropdownMenu.ItemIndicator><IconCheck /></DropdownMenu.ItemIndicator>
								</DropdownMenu.RadioItem>
							)}
						</For>
					</DropdownMenu.RadioGroup>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu>
	);
}

export function FlowCondition(props: FlowConditionProps) {
	const [inner, setInner] = createSignal<FlowRule[]>(props.defaultRules ?? []);
	const rules = () => props.rules ?? inner();
	const update = (index: number, patch: Partial<FlowRule>) => {
		const next = rules().map((r, i) => (i === index ? { ...r, ...patch } : r));
		setInner(next);
		props.onRulesChange?.(next);
	};
	const pickProperty = (index: number, property: string) => {
		const values = props.options(property);
		const keep = values.some((o) => o.name === rules()[index].value);
		update(index, { property, value: keep ? rules()[index].value : (values[0]?.name ?? '') });
	};

	return (
		<div class="ui-flow-condition">
			<For each={rules()}>
				{(rule, i) => (
					<div class="ui-flow-rule">
						<Handle />
						<span class="ui-flow-keyword">{i() === 0 ? 'If' : 'and'}</span>
						<span class="ui-flow-source" data-no-drag>
							<Show when={props.sourceIcon}>
								<span class="ui-flow-source-icon">{props.sourceIcon}</span>
							</Show>
							{props.source}
						</span>
						<SelectChip
							value={rule.property}
							items={props.properties.map((name) => ({ name }))}
							width={144}
							onPick={(name) => pickProperty(i(), name)}
						/>
						<span class="ui-flow-is">is</span>
						<SelectChip
							value={rule.value}
							items={props.options(rule.property)}
							width={224}
							dot={props.dot ?? 'var(--accent)'}
							onPick={(name) => update(i(), { value: name })}
						/>
					</div>
				)}
			</For>
		</div>
	);
}
