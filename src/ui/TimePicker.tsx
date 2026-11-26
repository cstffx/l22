import { createSignal } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import { createTimePicker } from './createTimePicker';
import { snapMinute } from './datetime/date-core';
import './tokens.css';
import './timepicker.css';

/* Selector de hora con dos presentaciones:
 *   - `dial` (por defecto): reloj analógico, con arrastre y teclado.
 *   - `list`: columnas de horas y minutos (y AM/PM en 12 horas).
 *
 *   <TimePicker value={fecha()} onChange={setFecha} />
 *   <TimePicker variant="list" format="12-hour" />
 */
export type TimePickerAction = {
	label: JSX.Element;
	/** Recibe la hora actual (`value`) y `set(hora, minuto)` para cambiarla. */
	onClick: (api: { value: Date | null; set: (hour: number, minute?: number) => void }) => void;
	variant?: 'primary';
	disabled?: boolean;
};

export type TimePickerProps = {
	value?: Date | null;
	/** Devuelve una fecha con la hora elegida (el día lo aporta quien llama). */
	onChange?: (time: Date) => void;
	format?: '12-hour' | '24-hour';
	minuteInterval?: number;
	/** `dial` (reloj) o `list` (columnas). */
	variant?: 'dial' | 'list';
	/** Reloj: tras elegir la hora salta a minutos. Por defecto `true`. */
	autoSwitchToMinutes?: boolean;
	/** Reloj: botón «Ahora». */
	footer?: boolean;
	/** Botones personalizados bajo el selector (reloj o lista). */
	actions?: TimePickerAction[];
	disabled?: boolean;
	readonly?: boolean;
	class?: string;
};

export function TimePicker(props: TimePickerProps) {
	// Sin `value` controlado, recuerda lo último elegido.
	const [internal, setInternal] = createSignal<Date | null>(null);
	const merged = {
		get value() { return props.value !== undefined ? props.value : internal(); },
		onChange: (d: Date) => {
			if (props.value === undefined) setInternal(d);
			props.onChange?.(d);
		},
	};
	return (
		<div class="ui-timepicker-wrap">
			{props.variant === 'list' ? (
				<TimeList {...props} value={merged.value} onChange={merged.onChange} />
			) : (
				<TimeDial {...props} value={merged.value} onChange={merged.onChange} />
			)}
			{props.actions && props.actions.length > 0 && (
				<div class="ui-timepicker-actions">
					{props.actions.map((a) => (
						<button type="button" class="ui-timepicker-action" data-variant={a.variant} disabled={a.disabled} onClick={() =>
								a.onClick({
									value: merged.value ?? null,
									set: (h, m = 0) => {
										const d = new Date();
										d.setHours(h, m, 0, 0);
										merged.onChange(d);
									},
								})
							}>
							{a.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

function TimeDial(props: TimePickerProps) {
	const tp = createTimePicker({
		value: () => props.value,
		onChange: (d) => props.onChange?.(d),
		format: () => props.format,
		minuteInterval: () => props.minuteInterval,
		autoSwitchToMinutes: () => props.autoSwitchToMinutes,
		disabled: () => props.disabled,
		readonly: () => props.readonly,
	});
	let dial: SVGSVGElement | undefined;
	let dragging = false;
	const angleFrom = (e: PointerEvent) => {
		const rect = dial!.getBoundingClientRect();
		const k = tp.SIZE / rect.width;
		const x = (e.clientX - rect.left) * k - tp.C;
		const y = (e.clientY - rect.top) * k - tp.C;
		let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
		if (deg < 0) deg += 360;
		return { angle: deg, dist: Math.hypot(x, y) };
	};
	const select = (e: PointerEvent) => {
		const { angle, dist } = angleFrom(e);
		tp.pointerSelect(angle, dist);
	};
	const ticks = () => (tp.selection() === 'hour' ? tp.hourTicks() : tp.minuteTicks());

	return (
		<div class={cx('ui-timedial', props.class)} role="group" aria-label="Selector de hora" data-disabled={props.disabled ? '' : undefined}>
			<div class="ui-timedial-head">
				<button class="ui-timedial-seg" data-active={tp.selection() === 'hour' ? '' : undefined} {...tp.segProps('hour')}>
					{String(tp.displayHour()).padStart(2, '0')}
				</button>
				<span class="ui-timedial-colon">:</span>
				<button class="ui-timedial-seg" data-active={tp.selection() === 'minute' ? '' : undefined} {...tp.segProps('minute')}>
					{tp.mm()}
				</button>
				{tp.is12() && (
					<div class="ui-timedial-ampm">
						<button data-active={!tp.isPm() ? '' : undefined} {...tp.ampmProps(false)}>AM</button>
						<button data-active={tp.isPm() ? '' : undefined} {...tp.ampmProps(true)}>PM</button>
					</div>
				)}
			</div>
			<svg
				ref={dial}
				class="ui-timedial-dial"
				viewBox={`0 0 ${tp.SIZE} ${tp.SIZE}`}
				width="100%"
				{...tp.dialProps()}
				onPointerDown={(e: PointerEvent) => {
					if (!tp.isInteractive()) return;
					dragging = true;
					dial?.setPointerCapture(e.pointerId);
					select(e);
				}}
				onPointerMove={(e: PointerEvent) => dragging && select(e)}
				onPointerUp={(e: PointerEvent) => {
					if (!dragging) return;
					dragging = false;
					dial?.releasePointerCapture(e.pointerId);
					tp.endPointer();
				}}
				onPointerCancel={() => { dragging = false; }}
			>
				<circle class="ui-timedial-face" cx={tp.C} cy={tp.C} r={tp.C - 4} />
				<line class="ui-timedial-hand" x1={tp.C} y1={tp.C} x2={tp.handEnd().x} y2={tp.handEnd().y} />
				<circle class="ui-timedial-hub" cx={tp.C} cy={tp.C} r="3" />
				<circle class="ui-timedial-knob" cx={tp.handEnd().x} cy={tp.handEnd().y} r="15" />
				{ticks().map((t) => (
					<text
						class="ui-timedial-num"
						data-inner={t.ring === 'inner' ? '' : undefined}
						data-active={(tp.selection() === 'hour' ? tp.isActiveHour(t) : t.value === tp.minutes()) ? '' : undefined}
						x={t.x}
						y={t.y}
						dominant-baseline="central"
						text-anchor="middle"
					>
						{t.label}
					</text>
				))}
			</svg>
			{props.footer && (
				<div class="ui-timedial-footer">
					<button class="ui-timedial-now" {...tp.nowProps()}>Ahora</button>
				</div>
			)}
		</div>
	);
}

function TimeList(props: TimePickerProps) {
	const is12 = () => props.format === '12-hour';
	const base = () => props.value ?? new Date(new Date().setHours(0, 0, 0, 0));
	const hour24 = () => base().getHours();
	const minute = () => base().getMinutes();
	const pm = () => hour24() >= 12;
	const interval = () => Math.max(1, Math.floor(props.minuteInterval ?? 1));

	const emit = (h: number, m: number) => {
		const d = new Date(base());
		d.setHours(h, m, 0, 0);
		props.onChange?.(d);
	};
	const setHour = (h: number) => emit(is12() ? (h % 12) + (pm() ? 12 : 0) : h, minute());
	const hours = () => (is12() ? Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i)) : Array.from({ length: 24 }, (_, i) => i));
	const shownHour = () => (is12() ? (hour24() % 12 === 0 ? 12 : hour24() % 12) : hour24());
	const minutes = () => Array.from({ length: Math.ceil(60 / interval()) }, (_, i) => i * interval());
	const pad = (n: number) => String(n).padStart(2, '0');

	const column = (label: string, items: number[], selected: number, pick: (n: number) => void) => (
		<div class="ui-timepicker-col" role="listbox" aria-label={label}>
			{items.map((n) => (
				<button
					type="button"
					role="option"
					class="ui-timepicker-item"
					aria-selected={n === selected ? 'true' : 'false'}
					data-selected={n === selected ? '' : undefined}
					tabindex={-1}
					ref={(el) => {
						// Al montar, deja visible el valor seleccionado.
						if (n === selected)
							queueMicrotask(() => {
								// Solo la columna: scrollIntoView también desplazaba el popover y la página.
								const col = el.parentElement;
								if (col) col.scrollTop = el.offsetTop - (col.clientHeight - el.offsetHeight) / 2;
							});
					}}
					onClick={() => pick(n)}
				>
					{pad(n)}
				</button>
			))}
		</div>
	);

	return (
		<div class={cx('ui-timepicker', props.class)}>
			{column('Horas', hours(), shownHour(), setHour)}
			{column('Minutos', minutes(), snapMinute(minute(), interval()), (m) => emit(hour24(), m))}
			{is12() && (
				<div class="ui-timepicker-col ui-timepicker-ampm" role="listbox" aria-label="AM/PM">
					{['AM', 'PM'].map((l, i) => (
						<button
							type="button"
							role="option"
							class="ui-timepicker-item"
							aria-selected={pm() === (i === 1) ? 'true' : 'false'}
							data-selected={pm() === (i === 1) ? '' : undefined}
							tabindex={-1}
							onClick={() => emit((hour24() % 12) + (i === 1 ? 12 : 0), minute())}
						>
							{l}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
