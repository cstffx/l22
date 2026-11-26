import { createMemo, createSignal } from 'solid-js';
import { addMonths, compareDay, isSameDay, monthMatrix, startOfDay, toDate, weekdayOrder } from './datetime/date-core';
import type { DateLike } from './datetime/date-core';
import { IconChevronDown } from './icons';
import { cx } from './cx';
import './tokens.css';
import './calendar.css';

/* Calendario de un mes con navegación.
 *
 *   <Calendar value={fecha()} onChange={(d) => setFecha(d[0])} />
 */
export type CalendarProps = {
	value?: Date | null;
	/** Se llama con la fecha elegida (arreglo de un elemento, igual que el núcleo). */
	onChange?: (dates: Date[]) => void;
	min?: DateLike | null;
	max?: DateLike | null;
	firstDayOfWeek?: number;
	locale?: string;
	class?: string;
};

export function Calendar(props: CalendarProps) {
	const locale = () => props.locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
	const today = startOfDay(new Date());
	// Mes visible: sigue al valor hasta que el usuario navega.
	const [view, setView] = createSignal<Date | null>(null);
	const shown = createMemo(() => view() ?? props.value ?? today);
	const min = () => toDate(props.min ?? null);
	const max = () => toDate(props.max ?? null);
	const first = () => props.firstDayOfWeek ?? 0;

	const title = () => new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(shown());
	const weekdays = () => {
		const f = new Intl.DateTimeFormat(locale(), { weekday: 'short' });
		// 2023-01-01 fue domingo.
		return weekdayOrder(first()).map((i) => f.format(new Date(2023, 0, 1 + i)).slice(0, 2));
	};
	const rows = () => monthMatrix(shown(), first());
	const blocked = (d: Date) => {
		const lo = min();
		const hi = max();
		return (lo !== null && compareDay(d, lo) < 0) || (hi !== null && compareDay(d, hi) > 0);
	};
	// Vista: días → meses del año → años de la década (al pulsar el título).
	const [mode, setMode] = createSignal<'month' | 'year' | 'decade'>('month');
	const decadeStart = () => Math.floor(shown().getFullYear() / 10) * 10;
	const go = (n: number) => {
		if (mode() === 'month') setView(addMonths(shown(), n));
		else if (mode() === 'year') setView(addMonths(shown(), n * 12));
		else setView(addMonths(shown(), n * 120));
	};
	const headTitle = () => (mode() === 'month' ? title() : mode() === 'year' ? String(shown().getFullYear()) : `${decadeStart()} – ${decadeStart() + 9}`);
	const drillUp = () => setMode(mode() === 'month' ? 'year' : 'decade');
	const monthNames = () => {
		const f = new Intl.DateTimeFormat(locale(), { month: 'short' });
		return Array.from({ length: 12 }, (_, i) => f.format(new Date(2023, i, 1)));
	};
	const pickMonth = (i: number) => {
		const d = shown();
		setView(new Date(d.getFullYear(), i, 1));
		setMode('month');
	};
	const pickYear = (y: number) => {
		const d = shown();
		setView(new Date(y, d.getMonth(), 1));
		setMode('year');
	};

	return (
		<div class={cx('ui-calendar', props.class)}>
			<div class="ui-calendar-head">
				<button type="button" class="ui-calendar-nav ui-calendar-prev" aria-label={mode() === 'month' ? 'Mes anterior' : mode() === 'year' ? 'Año anterior' : 'Década anterior'} onClick={() => go(-1)}>
					<IconChevronDown size={14} />
				</button>
				<button type="button" class="ui-calendar-title" aria-live="polite" disabled={mode() === 'decade'} onClick={drillUp}>{headTitle()}</button>
				<button type="button" class="ui-calendar-nav ui-calendar-next" aria-label={mode() === 'month' ? 'Mes siguiente' : mode() === 'year' ? 'Año siguiente' : 'Década siguiente'} onClick={() => go(1)}>
					<IconChevronDown size={14} />
				</button>
			</div>
			{mode() === 'year' && (
				<div class="ui-calendar-cells">
					{monthNames().map((n, i) => (
						<button
							type="button"
							class="ui-calendar-cell"
							data-selected={props.value && props.value.getFullYear() === shown().getFullYear() && props.value.getMonth() === i ? '' : undefined}
							data-today={today.getFullYear() === shown().getFullYear() && today.getMonth() === i ? '' : undefined}
							onClick={() => pickMonth(i)}
						>
							{n}
						</button>
					))}
				</div>
			)}
			{mode() === 'decade' && (
				<div class="ui-calendar-cells">
					{Array.from({ length: 12 }, (_, i) => decadeStart() - 1 + i).map((y) => (
						<button
							type="button"
							class="ui-calendar-cell"
							data-outside={y < decadeStart() || y > decadeStart() + 9 ? '' : undefined}
							data-selected={props.value && props.value.getFullYear() === y ? '' : undefined}
							data-today={today.getFullYear() === y ? '' : undefined}
							onClick={() => pickYear(y)}
						>
							{y}
						</button>
					))}
				</div>
			)}
			{mode() === 'month' && <div class="ui-calendar-grid" role="grid">
				<div class="ui-calendar-row" role="row">
					{weekdays().map((w) => <span class="ui-calendar-weekday" role="columnheader">{w}</span>)}
				</div>
				{rows().map((row) => (
					<div class="ui-calendar-row" role="row">
						{row.map((cell) => (
							<button
								type="button"
								role="gridcell"
								class="ui-calendar-day"
								tabindex={-1}
								data-outside={cell.inMonth ? undefined : ''}
								data-today={isSameDay(cell.date, today) ? '' : undefined}
								data-selected={isSameDay(cell.date, props.value ?? null) ? '' : undefined}
								aria-selected={isSameDay(cell.date, props.value ?? null) ? 'true' : 'false'}
								disabled={blocked(cell.date)}
								onClick={() => {
									setView(null);
									props.onChange?.([cell.date]);
								}}
							>
								{cell.date.getDate()}
							</button>
						))}
					</div>
				))}
			</div>}
		</div>
	);
}
