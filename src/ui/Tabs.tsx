import { Tabs as KTabs } from '@kobalte/core/tabs';
import type {
	TabsContentProps,
	TabsIndicatorProps,
	TabsListProps,
	TabsRootProps,
	TabsTriggerProps,
} from '@kobalte/core/tabs';
import { omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import './tokens.css';
import './motion.css';
import './tabs.css';

/* Partes desacopladas, igual que Kobalte:
 *
 *   <Tabs defaultValue="a">
 *     <Tabs.List>
 *       <Tabs.Trigger value="a">A</Tabs.Trigger>
 *       <Tabs.Trigger value="b">B</Tabs.Trigger>
 *       <Tabs.Indicator />
 *     </Tabs.List>
 *     <Tabs.Content value="a">…</Tabs.Content>
 *     <Tabs.Content value="b">…</Tabs.Content>
 *   </Tabs>
 */

type Slot = { class?: string; children?: JSX.Element };

export type TabsVariant = 'pill' | 'line';

/* Función nueva: Object.assign de abajo no debe pisar las partes del objeto de Kobalte. */
/** `variant`: 'pill' (por defecto, segmented control) o 'line' (subrayado inferior). */
export function TabsRoot(props: TabsRootProps & Slot & { variant?: TabsVariant }) {
	const rest = omit(props, 'class', 'variant');
	return <KTabs {...rest} class={cx('ui-tabs', props.variant === 'line' && 'ui-tabs--line', props.class)} />;
}

export function TabsList(props: TabsListProps & Slot) {
	const rest = omit(props, 'class');
	return <KTabs.List {...rest} class={cx('ui-tabs-list', props.class)} />;
}

export function TabsTrigger(props: TabsTriggerProps & Slot) {
	const rest = omit(props, 'class');
	return <KTabs.Trigger {...rest} class={cx('ui-tabs-trigger', props.class)} />;
}

/** Pulgar deslizante; colócalo dentro de `Tabs.List`, después de los triggers. */
export function TabsIndicator(props: TabsIndicatorProps & { class?: string }) {
	const rest = omit(props, 'class');
	return <KTabs.Indicator {...rest} class={cx('ui-tabs-indicator', props.class)} />;
}

export function TabsContent(props: TabsContentProps & Slot) {
	const rest = omit(props, 'class');
	return <KTabs.Content {...rest} class={cx('ui-tabs-content', props.class)} />;
}

export const Tabs = Object.assign(TabsRoot, {
	List: TabsList,
	Trigger: TabsTrigger,
	Indicator: TabsIndicator,
	Content: TabsContent,
});
