import { Popover as KPopover } from '@kobalte/core/popover';
import { createSignal } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { Calendar } from './Calendar';
import { TimePicker } from './TimePicker';
import { createDateTimePicker } from './createDateTimePicker';
import type { DateTimeValue, DropDownDisplayMode } from './createDateTimePicker';
import type { DateLike } from './datetime/date-core';
import { formatDate } from './datetime/date-format';
import { IconCalendar, IconChevronDown, IconClose } from './icons';
import { cx } from './cx';
import './tokens.css';
import './motion.css';
import './popover.css';
import './field.css';
import './datepicker.css';

/* Selector de fecha (y hora) basado en el núcleo headless `createDateTimePicker`:
 * campo de texto con máscara + desplegable con calendario y/o selector de hora.
 *
 *   <DatePicker label="Fecha" value={fecha()} onChange={setFecha} />
 *   <DatePicker dropDownDisplayMode="both" formatString="dd/MM/yyyy HH:mm" />
 */
type Messages = { dialog: string; date: string; time: string; clear: string; open: string };
const DEFAULT_MESSAGES: Messages = { dialog: 'Elegir fecha y hora', date: 'FECHA', time: 'HORA', clear: 'Borrar', open: 'Abrir calendario' };

/** Lo que recibe un botón personalizado para actuar sobre el selector. */
export type DatePickerActionApi = {
	value: () => Date | null;
	/** Cambia el valor (ajustado a `min`/`max`). */
	set: (value: Date | null) => Date | null;
	close: () => void;
	/** Notifica `onCommit` con el valor actual. */
	commit: () => void;
};
export type DatePickerAction = {
	label: JSX.Element;
	onClick: (api: DatePickerActionApi) => void;
	variant?: 'primary';
	disabled?: boolean;
	class?: string;
};

export type DatePickerProps = {
	/** Botones personalizados en el pie del desplegable. */
	actions?: DatePickerAction[];
	/** Valor controlado. */
	value?: DateTimeValue;
	/** Valor inicial (no controlado). */
	defaultValue?: DateTimeValue;
	onChange?: (value: Date | null) => void;
	/** Valor finalizado (Enter, blur o elección de fecha única). */
	onCommit?: (value: Date | null) => void;
	onCancel?: () => void;
	/** Máscara de visualización y parseo. Por defecto según `dropDownDisplayMode`. */
	formatString?: string;
	min?: DateLike | null;
	max?: DateLike | null;
	nullable?: boolean;
	placeholder?: string;
	locale?: string;
	firstDayOfWeek?: number;
	hourFormat?: '12-hour' | '24-hour';
	minuteInterval?: number;
	/** Selector de hora: `dial` (reloj) o `list` (columnas). */
	timeVariant?: 'dial' | 'list';
	/** Pestañas del desplegable: `calendar` (solo fecha), `time`, `both` (pestañas) o `inline` (fecha y hora a la vez). */
	dropDownDisplayMode?: DropDownDisplayMode;
	/** Botones ▲/▼ que cambian el valor en `stepMinutes`. */
	spinButtons?: boolean;
	stepMinutes?: number;
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	name?: string;
	label?: JSX.Element;
	hint?: JSX.Element;
	error?: JSX.Element;
	invalid?: boolean;
	'aria-label'?: string;
	messages?: Partial<Messages>;
	class?: string;
};

const defaultMask = (mode: DropDownDisplayMode) => (mode === 'calendar' ? 'yyyy-MM-dd' : mode === 'time' ? 'HH:mm' : 'yyyy-MM-dd HH:mm');

export function DatePicker(props: DatePickerProps) {
	const mode = () => props.dropDownDisplayMode ?? 'calendar';
	const M = () => ({ ...DEFAULT_MESSAGES, ...props.messages });
	const [internal, setInternal] = createSignal<DateTimeValue>(props.defaultValue ?? null);
	const value = () => (props.value !== undefined ? props.value : internal());

	const dtp = createDateTimePicker({
		value,
		onChange: (d) => {
			if (props.value === undefined) setInternal(d);
			props.onChange?.(d);
		},
		onCommit: (d) => props.onCommit?.(d),
		onCancel: () => props.onCancel?.(),
		formatString: () => props.formatString ?? defaultMask(mode()),
		min: () => props.min,
		max: () => props.max,
		nullable: () => props.nullable ?? true,
		locale: () => props.locale,
		dropDownDisplayMode: mode,
		spinButtons: () => props.spinButtons,
		stepMinutes: () => props.stepMinutes,
		disabled: () => props.disabled,
		readonly: () => props.readonly,
		toggleLabel: () => M().open,
		clearLabel: () => M().clear,
	});

	/** Lo que postea un formulario: día local, hora local o instante ISO. */
	const formValue = () => {
		const d = dtp.current();
		if (!d) return '';
		if (mode() === 'calendar') return formatDate(d, 'yyyy-MM-dd');
		if (mode() === 'time') return formatDate(d, 'HH:mm');
		return d.toISOString();
	};

	const actionApi: DatePickerActionApi = {
		value: () => dtp.current(),
		set: (d) => dtp.commit(d),
		close: () => dtp.closePanel(),
		commit: () => props.onCommit?.(dtp.current()),
	};

	let rootEl: HTMLDivElement | undefined;
	const showError = () => props.invalid || !!props.error;

	return (
		<div
			ref={rootEl}
			class={cx('ui-textfield ui-dtp', props.class)}
			data-disabled={props.disabled ? '' : undefined}
			onFocusOut={(e: FocusEvent) => {
				const next = e.relatedTarget as Node | null;
				// Ignora el foco que se mueve dentro del campo o hacia el panel.
				if (next && (rootEl?.contains(next) || (next as HTMLElement).closest?.('.ui-dtp-panel'))) return;
				props.onCommit?.(dtp.current());
			}}
		>
			{props.label && <span class="ui-textfield-label">{props.label}</span>}
			<KPopover
				open={dtp.open()}
				onOpenChange={(o: boolean) => (o ? dtp.openPanel() : dtp.closePanel())}
				gutter={8}
				placement="bottom-start"
			>
				<KPopover.Anchor class="ui-dtp-field" data-invalid={showError() ? '' : undefined}>
					{props.spinButtons && (
						<div class="ui-dtp-spin">
							<button {...dtp.spinProps(1)}><IconChevronDown size={9} class="ui-dtp-up" /></button>
							<button {...dtp.spinProps(-1)}><IconChevronDown size={9} /></button>
						</div>
					)}
					<input
						class="ui-dtp-input"
						value={dtp.text()}
						placeholder={props.placeholder ?? (mode() === 'calendar' ? 'Selecciona una fecha' : 'Selecciona fecha y hora')}
						aria-label={props['aria-label']}
						aria-invalid={showError() ? 'true' : undefined}
						required={props.required}
						onInput={(e) => dtp.setText(e.currentTarget.value)}
						{...dtp.inputProps()}
					/>
					{(props.nullable ?? true) && dtp.current() && dtp.isInteractive() && (
						<button class="ui-dtp-btn" {...dtp.clearProps()}><IconClose size={12} /></button>
					)}
					<KPopover.Trigger class="ui-dtp-btn" {...dtp.toggleProps()}>
						<IconCalendar size={14} />
					</KPopover.Trigger>
				</KPopover.Anchor>
				<KPopover.Portal>
					<KPopover.Content
						class="ui-popover ui-dtp-panel"
						aria-label={M().dialog}
						// El foco se queda en el campo para poder seguir escribiendo.
						onOpenAutoFocus={(e: Event) => e.preventDefault()}
					>
						{dtp.showTabs() && (
							<div class="ui-dtp-tabs" role="tablist">
								<button class="ui-dtp-tab" data-active={dtp.tab() === 'date' ? '' : undefined} {...dtp.tabProps('date')}>{M().date}</button>
								<button class="ui-dtp-tab" data-active={dtp.tab() === 'time' ? '' : undefined} {...dtp.tabProps('time')}>{M().time}</button>
							</div>
						)}
						<div class="ui-dtp-body" data-inline={mode() === 'inline' ? '' : undefined}>
						{(dtp.showDateTab() && (dtp.tab() === 'date' || !dtp.showTabs())) && (
							<Calendar
								value={dtp.current()}
								min={props.min}
								max={props.max}
								firstDayOfWeek={props.firstDayOfWeek}
								locale={props.locale}
								onChange={dtp.onCalendarChange}
							/>
						)}
						{dtp.showTimeTab() && (dtp.tab() === 'time' || !dtp.showTabs()) && (
							<TimePicker
								value={dtp.current()}
								format={props.hourFormat}
								minuteInterval={props.minuteInterval}
								variant={props.timeVariant}
								onChange={dtp.onTimeChange}
							/>
						)}
						</div>
						{props.actions && props.actions.length > 0 && (
							<div class="ui-dtp-actions">
								{props.actions.map((a) => (
									<button
										type="button"
										class={cx('ui-dtp-action', a.class)}
										data-variant={a.variant}
										disabled={a.disabled}
										onClick={() => a.onClick(actionApi)}
									>
										{a.label}
									</button>
								))}
							</div>
						)}
					</KPopover.Content>
				</KPopover.Portal>
			</KPopover>
			{props.error && showError() ? <span class="ui-textfield-error">{props.error}</span> : props.hint && <span class="ui-textfield-description">{props.hint}</span>}
			{props.name && <input type="hidden" name={props.name} value={formValue()} />}
		</div>
	);
}
