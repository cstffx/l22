import { createRoot, createSignal, flush } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { createDateTimePicker } from './createDateTimePicker';

function setup(over: Partial<Parameters<typeof createDateTimePicker>[0]> = {}) {
	const changes: (Date | null)[] = [];
	return createRoot(() => {
		const [value, setValue] = createSignal<Date | null>(new Date(2026, 5, 15, 10, 30));
		const dtp = createDateTimePicker({
			value,
			onChange: (d) => {
				changes.push(d);
				setValue(d);
			},
			formatString: () => 'yyyy-MM-dd HH:mm',
			...over,
		});
		return { dtp, changes, setValue };
	});
}

describe('createDateTimePicker', () => {
	it('formatea el valor', () => {
		expect(setup().dtp.text()).toBe('2026-06-15 10:30');
	});

	it('parsea el texto al confirmar e ignora el texto inválido', () => {
		const { dtp, changes } = setup();
		dtp.setText('2027-01-02 03:04');
		dtp.commitFromText();
		flush();
		expect(changes.at(-1)?.getFullYear()).toBe(2027);
		const n = changes.length;
		dtp.setText('basura');
		dtp.commitFromText();
		expect(changes).toHaveLength(n); // texto inválido: no emite cambio
	});

	it('respeta min/max', () => {
		const { dtp, changes } = setup({ max: () => new Date(2026, 5, 20) });
		dtp.commit(new Date(2030, 0, 1));
		expect(changes.at(-1)?.getFullYear()).toBe(2026);
	});

	it('no admite vacío si nullable=false', () => {
		const { dtp, changes } = setup({ nullable: () => false });
		dtp.setText('');
		dtp.commitFromText();
		expect(changes).toHaveLength(0);
	});

	it('elegir un día solo-fecha cierra y conserva la hora', () => {
		const { dtp, changes } = setup({ dropDownDisplayMode: () => 'calendar' });
		dtp.openPanel();
		expect(dtp.open()).toBe(true);
		dtp.onCalendarChange([new Date(2026, 6, 4)]);
		expect(dtp.open()).toBe(false);
		expect(changes.at(-1)?.getHours()).toBe(10);
		expect(changes.at(-1)?.getDate()).toBe(4);
	});
});
