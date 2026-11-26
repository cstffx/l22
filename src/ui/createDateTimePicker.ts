/**
 * createDateTimePicker — núcleo headless del DatePicker (puerto a Solid de
 * `createDateTimePicker.svelte.ts`): campo con máscara (formato/parseo con el
 * motor de tokens de ./datetime), límites min/max, valor nulable, pasos con
 * flechas y estado de apertura/pestaña del desplegable. Lo visual (popover,
 * calendario, refs) vive en el componente.
 *
 * Las entradas reactivas son getters; los callbacks, closures.
 */
import { createMemo, createSignal } from 'solid-js';
import { clampDate, startOfDay, toDate, withTime } from './datetime/date-core';
import type { DateLike } from './datetime/date-core';
import { formatDate, parseDate } from './datetime/date-format';

export type DateTimeValue = Date | string | number | null;
export type DropDownDisplayMode = 'both' | 'inline' | 'calendar' | 'time';
export type DateTimeTab = 'date' | 'time';

export type DateTimePickerConfig = {
	value: () => DateTimeValue | undefined;
	onChange?: (value: Date | null) => void;
	/** Valor finalizado (Enter, blur o elección de fecha única). */
	onCommit?: (value: Date | null) => void;
	/** Escape / cierre sin confirmar. */
	onCancel?: () => void;
	formatString?: () => string | undefined;
	min?: () => DateLike | null | undefined;
	max?: () => DateLike | null | undefined;
	nullable?: () => boolean | undefined;
	locale?: () => string | undefined;
	dropDownDisplayMode?: () => DropDownDisplayMode | undefined;
	spinButtons?: () => boolean | undefined;
	stepMinutes?: () => number | undefined;
	disabled?: () => boolean | undefined;
	readonly?: () => boolean | undefined;
	toggleLabel?: () => string | undefined;
	clearLabel?: () => string | undefined;
};

const defaultLocale = () => (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

export function createDateTimePicker(config: DateTimePickerConfig) {
	const mode = () => config.dropDownDisplayMode?.() ?? 'both';
	const formatString = () => config.formatString?.() ?? 'yyyy-MM-dd HH:mm';
	const nullable = () => config.nullable?.() ?? true;
	const locale = () => config.locale?.() ?? defaultLocale();
	const spinButtons = () => config.spinButtons?.() ?? false;
	const stepMinutes = () => config.stepMinutes?.() ?? 1;
	const isDisabled = () => config.disabled?.() ?? false;
	const isReadonly = () => config.readonly?.() ?? false;

	const isInteractive = () => !isDisabled() && !isReadonly();
	const minD = createMemo(() => toDate(config.min?.() ?? null));
	const maxD = createMemo(() => toDate(config.max?.() ?? null));
	const current = createMemo(() => toDate(config.value() as DateLike | null | undefined));

	const format = (d: Date | null) => (d ? formatDate(d, formatString(), locale()) : '');

	// Texto en edición; `null` = mostrar el valor formateado.
	const [draft, setDraft] = createSignal<string | null>(null);
	const text = () => draft() ?? format(current());
	const setText = (v: string) => setDraft(v);

	const [open, setOpen] = createSignal(false);
	const [tab, setTabSignal] = createSignal<DateTimeTab>('date');
	const showDateTab = () => mode() !== 'time';
	const showTimeTab = () => mode() !== 'calendar';
	/** `both` alterna con pestañas; `inline` muestra calendario y hora a la vez. */
	const showTabs = () => mode() === 'both';

	function commit(next: Date | null) {
		const clamped = next ? clampDate(next, minD(), maxD()) : null;
		setDraft(null);
		config.onChange?.(clamped);
		return clamped;
	}

	function commitFromText() {
		const d = draft();
		if (d === null) return;
		const raw = d.trim();
		if (!raw) {
			if (nullable()) commit(null);
			else setDraft(null);
			return;
		}
		const parsed = parseDate(raw, formatString(), locale(), 2029, current() ?? new Date());
		if (parsed) commit(parsed);
		else setDraft(null); // revierte si el texto no es válido
	}

	function bump(deltaMin: number) {
		const base = current() ?? new Date();
		commit(new Date(base.getTime() + deltaMin * 60000));
	}

	function openPanel() {
		if (!isInteractive() || open()) return;
		setTabSignal(mode() === 'time' ? 'time' : 'date');
		setOpen(true);
	}
	const closePanel = () => setOpen(false);
	const toggle = () => (open() ? closePanel() : openPanel());
	const setTab = (t: DateTimeTab) => setTabSignal(t);

	function onCalendarChange(dates: Date[]) {
		const day = dates[0];
		if (!day) return;
		const next = commit(withTime(day, current() ?? startOfDay(day)));
		// Solo fecha: una elección finaliza el valor.
		if (mode() === 'calendar') {
			closePanel();
			config.onCommit?.(next);
		} else if (mode() === 'both') setTabSignal('time');
	}
	function onTimeChange(t: Date) {
		commit(withTime(current() ?? new Date(), t));
	}

	function onInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commitFromText();
			closePanel();
			config.onCommit?.(current());
		} else if (e.key === 'Escape') {
			if (open()) e.stopPropagation();
			setDraft(null);
			closePanel();
			config.onCancel?.();
		} else if (e.key === 'ArrowDown' && (e.altKey || !text())) {
			e.preventDefault();
			openPanel();
		} else if (spinButtons() && e.key === 'ArrowUp') {
			e.preventDefault();
			bump(stepMinutes());
		} else if (spinButtons() && e.key === 'ArrowDown') {
			e.preventDefault();
			bump(-stepMinutes());
		}
	}

	return {
		current,
		text,
		setText,
		open,
		tab,
		isInteractive,
		showDateTab,
		showTimeTab,
		showTabs,
		commit,
		commitFromText,
		bump,
		onCalendarChange,
		onTimeChange,
		openPanel,
		closePanel,
		toggle,
		setTab,
		onInputKeydown,

		/** El campo de texto. */
		inputProps() {
			return {
				type: 'text' as const,
				get disabled() { return isDisabled(); },
				get readonly() { return isReadonly(); },
				onBlur: commitFromText,
				onKeyDown: onInputKeydown,
			};
		},
		/** Botón que abre el calendario. */
		toggleProps() {
			return {
				type: 'button' as const,
				'aria-label': config.toggleLabel?.() ?? 'Open picker',
				'aria-haspopup': 'dialog' as const,
				get 'aria-expanded'() { return open() ? ('true' as const) : ('false' as const); },
				get disabled() { return !isInteractive(); },
				tabindex: -1,
			};
		},
		/** Botón × (valores nulables). */
		clearProps() {
			return {
				type: 'button' as const,
				'aria-label': config.clearLabel?.() ?? 'Clear',
				onClick: () => commit(null),
			};
		},
		/** Botón de paso ▲/▼ (`stepMinutes`). */
		spinProps(dir: 1 | -1) {
			return {
				type: 'button' as const,
				tabindex: -1,
				'aria-label': dir === 1 ? 'Increment' : 'Decrement',
				get disabled() { return !isInteractive(); },
				onClick: () => bump(dir * stepMinutes()),
			};
		},
		/** Pestaña DATE / TIME. */
		tabProps(which: DateTimeTab) {
			return {
				type: 'button' as const,
				role: 'tab' as const,
				get 'aria-selected'() { return tab() === which ? ('true' as const) : ('false' as const); },
				onClick: () => setTab(which),
			};
		},
	};
}

export type DateTimePicker = ReturnType<typeof createDateTimePicker>;
