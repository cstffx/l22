/**
 * createTimePicker — núcleo headless del selector de hora con reloj analógico
 * (puerto a Solid de `createTimePicker.svelte.ts`): 12/24 horas, ajuste de
 * minutos a `minuteInterval`, salto hora → minutos, teclado y la geometría pura
 * del dial. El arrastre con puntero vive en el componente: aquí solo se expone
 * `SIZE`/`C` y `pointerSelect(angle, dist)`.
 *
 * Las entradas reactivas son getters; los callbacks, closures.
 */
import { createSignal } from 'solid-js';

export type TimeValue = Date | string | number | null;
export type TimeSelection = 'hour' | 'minute';
export type TimeFormat = '12-hour' | '24-hour';
export type DialTick = { label: string; x: number; y: number; value: number; ring: 'outer' | 'inner' };

export type TimePickerConfig = {
	value: () => TimeValue | undefined;
	/** Devuelve una fecha (hoy) con la hora elegida. */
	onChange?: (value: Date) => void;
	format?: () => TimeFormat | undefined;
	minuteInterval?: () => number | undefined;
	/** Tras elegir la hora salta a minutos. Por defecto `true`. */
	autoSwitchToMinutes?: () => boolean | undefined;
	disabled?: () => boolean | undefined;
	readonly?: () => boolean | undefined;
	/** Esfera con la que se abre. */
	selection?: () => TimeSelection | undefined;
};

const SIZE = 240;
const C = SIZE / 2;
const OUTER = C - 22;
const INNER = C - 58;

function pointAt(angleDeg: number, r: number) {
	const rad = ((angleDeg - 90) * Math.PI) / 180;
	return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

/** Hora y minuto de un valor; sin valor, la hora actual. */
export function parseTimeValue(v: TimeValue | undefined): { h: number; m: number } {
	const now = () => {
		const n = new Date();
		return { h: n.getHours(), m: n.getMinutes() };
	};
	if (v == null) return now();
	if (typeof v === 'string') {
		const mt = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
		if (mt) return { h: Math.min(23, +mt[1]!), m: Math.min(59, +mt[2]!) };
		const d = new Date(v);
		return isNaN(d.getTime()) ? now() : { h: d.getHours(), m: d.getMinutes() };
	}
	const d = new Date(v);
	return isNaN(d.getTime()) ? now() : { h: d.getHours(), m: d.getMinutes() };
}

export function createTimePicker(config: TimePickerConfig) {
	const format = () => config.format?.() ?? '24-hour';
	const interval = () => Math.max(1, Math.floor(config.minuteInterval?.() ?? 1));
	const isDisabled = () => config.disabled?.() ?? false;
	const isReadonly = () => config.readonly?.() ?? false;
	const is12 = () => format() === '12-hour';
	const isInteractive = () => !isDisabled() && !isReadonly();

	const [sel, setSel] = createSignal<TimeSelection>(config.selection?.() ?? 'hour');
	const time = () => parseTimeValue(config.value());
	const hours = () => time().h;
	const minutes = () => time().m;
	const displayHour = () => (is12() ? (hours() % 12 === 0 ? 12 : hours() % 12) : hours());
	const isPm = () => hours() >= 12;
	const mm = () => String(minutes()).padStart(2, '0');

	const hourTicks = (): DialTick[] => {
		const ticks: DialTick[] = [];
		for (let i = 0; i < 12; i++) {
			if (is12()) {
				const p = pointAt(i * 30, OUTER);
				ticks.push({ label: String(i === 0 ? 12 : i), x: p.x, y: p.y, value: i === 0 ? 12 : i, ring: 'outer' });
			} else {
				const o = pointAt(i * 30, OUTER); // 12..23
				const n = pointAt(i * 30, INNER); // 00..11
				ticks.push({ label: String(i + 12), x: o.x, y: o.y, value: i + 12, ring: 'outer' });
				ticks.push({ label: String(i).padStart(2, '0'), x: n.x, y: n.y, value: i, ring: 'inner' });
			}
		}
		return ticks;
	};
	const minuteTicks = (): DialTick[] =>
		Array.from({ length: 12 }, (_, i) => {
			const p = pointAt(i * 30, OUTER);
			return { label: String(i * 5).padStart(2, '0'), x: p.x, y: p.y, value: i * 5, ring: 'outer' as const };
		});

	const handAngle = () => (sel() === 'hour' ? (hours() % 12) * 30 : minutes() * 6);
	const handRadius = () => (sel() === 'hour' && !is12() && hours() < 12 ? INNER : OUTER);
	const handEnd = () => pointAt(handAngle(), handRadius());

	const emit = (h: number, m: number) => {
		const d = new Date();
		d.setHours(h, m, 0, 0);
		config.onChange?.(d);
	};
	const snap = (m: number) => (Math.round(m / interval()) * interval()) % 60;

	function setMinute(m: number) {
		emit(hours(), snap(m));
	}
	function setAmPm(pm: boolean) {
		if (pm === isPm()) return;
		emit(pm ? (hours() % 12) + 12 : hours() % 12, minutes());
	}
	/** Aplica un ángulo del dial (0..360, las 12 = 0) y la distancia al centro. */
	function pointerSelect(angle: number, dist: number) {
		if (!isInteractive()) return;
		if (sel() === 'hour') {
			const idx = Math.round(angle / 30) % 12;
			if (is12()) emit(isPm() ? (idx % 12) + 12 : idx % 12, minutes());
			else emit(dist < (OUTER + INNER) / 2 ? idx : idx + 12, minutes());
		} else setMinute(Math.round(angle / 6) % 60);
	}
	/** Al soltar el puntero: pasa de hora a minutos. */
	function endPointer() {
		if (sel() === 'hour' && (config.autoSwitchToMinutes?.() ?? true)) setSel('minute');
	}
	function onKeydown(e: KeyboardEvent) {
		if (!isInteractive()) return;
		const up = e.key === 'ArrowUp' || e.key === 'ArrowRight';
		const down = e.key === 'ArrowDown' || e.key === 'ArrowLeft';
		if (up || down) {
			e.preventDefault();
			const dir = up ? 1 : -1;
			if (sel() === 'hour') emit((hours() + dir + 24) % 24, minutes());
			else emit(hours(), (minutes() + dir * interval() + 60) % 60);
		} else if (e.key === 'Tab' && !e.shiftKey && sel() === 'hour') setSel('minute');
	}
	function now() {
		const n = new Date();
		emit(n.getHours(), n.getMinutes());
	}
	const isActiveHour = (t: DialTick) => (is12() ? t.value === displayHour() : t.value === hours());

	return {
		SIZE,
		C,
		hours,
		minutes,
		selection: sel,
		is12,
		isInteractive,
		displayHour,
		isPm,
		mm,
		hourTicks,
		minuteTicks,
		handEnd,
		isActiveHour,
		setSelection: setSel,
		setMinute,
		setAmPm,
		pointerSelect,
		endPointer,
		onKeydown,
		now,

		segProps(which: TimeSelection) {
			return { type: 'button' as const, get disabled() { return isDisabled(); }, onClick: () => setSel(which) };
		},
		ampmProps(pm: boolean) {
			return { type: 'button' as const, get disabled() { return isDisabled(); }, onClick: () => setAmPm(pm) };
		},
		dialProps() {
			return {
				role: 'slider' as const,
				get tabindex() { return isDisabled() ? -1 : 0; },
				get 'aria-label'() { return sel() === 'hour' ? 'Hora' : 'Minutos'; },
				get 'aria-valuenow'() { return sel() === 'hour' ? hours() : minutes(); },
				'aria-valuemin': 0,
				get 'aria-valuemax'() { return sel() === 'hour' ? 23 : 59; },
				onKeyDown: onKeydown,
			};
		},
		nowProps() {
			return { type: 'button' as const, get disabled() { return isDisabled(); }, onClick: now };
		},
	};
}

export type TimePicker = ReturnType<typeof createTimePicker>;
