import { createSignal } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import './tokens.css';
import './numberinput.css';

/* Campo numérico "scrub": arrastra la etiqueta (cursor ↔), usa ↑/↓ (⇧ ×10) o escribe.
 *
 *   <NumberInput label="W" value={w()} onChange={setW} min={0} max={999} />
 *   <NumberInput label="Opacidad" suffix="%" defaultValue={100} min={0} max={100} />
 */
export type NumberInputProps = {
	/** Etiqueta corta; también es el control de arrastre. */
	label: JSX.Element;
	/** Valor controlado. */
	value?: number;
	/** Valor inicial (no controlado). */
	defaultValue?: number;
	onChange?: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	/** Texto fijo tras el valor (p. ej. `%`, `px`). */
	suffix?: string;
	/** Resalta el campo (p. ej. cuando difiere de su valor por defecto). */
	active?: boolean;
	disabled?: boolean;
	name?: string;
	/** Nombre accesible; por defecto, `label` si es texto. */
	'aria-label'?: string;
	class?: string;
};

const decimals = (n: number) => (String(n).split('.')[1] ?? '').length;

export function NumberInput(props: NumberInputProps) {
	const [internal, setInternal] = createSignal(props.defaultValue ?? props.min ?? 0);
	const [draft, setDraft] = createSignal<string | null>(null);
	const value = () => props.value ?? internal();
	const step = () => props.step ?? 1;
	const min = () => props.min ?? -Infinity;
	const max = () => props.max ?? Infinity;
	const name = () => props['aria-label'] ?? (typeof props.label === 'string' ? props.label : undefined);

	const clamp = (v: number) => {
		const s = step();
		const snapped = Number((Math.round(v / s) * s).toFixed(decimals(s)));
		return Math.min(max(), Math.max(min(), snapped));
	};
	const commit = (v: number) => {
		const next = clamp(v);
		if (props.value === undefined) setInternal(next);
		if (next !== value()) props.onChange?.(next);
	};

	let drag: { x: number; v: number } | null = null;

	const onKeyDown = (e: KeyboardEvent) => {
		const mult = e.shiftKey ? 10 : 1;
		if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
			e.preventDefault();
			commit(value() + step() * mult);
		} else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
			e.preventDefault();
			commit(value() - step() * mult);
		}
	};

	const finish = () => {
		const d = draft();
		if (d !== null) {
			const n = Number(d.replace(',', '.'));
			if (d.trim() !== '' && !Number.isNaN(n)) commit(n);
			setDraft(null);
		}
	};

	return (
		<label
			class={cx('ui-numinput', props.class)}
			data-active={props.active ? '' : undefined}
			data-disabled={props.disabled ? '' : undefined}
		>
			<span
				class="ui-numinput-handle"
				role="slider"
				aria-label={name()}
				aria-valuenow={value()}
				aria-valuemin={props.min}
				aria-valuemax={props.max}
				aria-disabled={props.disabled ? 'true' : undefined}
				tabindex={props.disabled ? -1 : 0}
				onPointerDown={(e) => {
					if (props.disabled) return;
					e.preventDefault();
					(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
					drag = { x: e.clientX, v: value() };
				}}
				onPointerMove={(e) => {
					if (drag) commit(drag.v + ((e.clientX - drag.x) / 2) * step());
				}}
				onPointerUp={() => (drag = null)}
				onPointerCancel={() => (drag = null)}
				onKeyDown={props.disabled ? undefined : onKeyDown}
			>
				{props.label}
			</span>
			<input
				class="ui-numinput-input"
				inputmode={step() % 1 === 0 && min() >= 0 ? 'numeric' : 'decimal'}
				name={props.name}
				disabled={props.disabled}
				aria-label={name() ? `${name()} valor` : undefined}
				value={draft() ?? String(value())}
				onInput={(e) => setDraft(e.currentTarget.value)}
				onBlur={finish}
				onKeyDown={(e) => {
					if (e.key === 'Enter') finish();
					else if (e.key === 'Escape') setDraft(null);
					else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
						finish();
						onKeyDown(e);
					}
				}}
			/>
			{props.suffix && <span class="ui-numinput-suffix">{props.suffix}</span>}
		</label>
	);
}
