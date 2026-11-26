import { createContext, createSignal, omit, useContext } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cx } from './cx';
import { DropdownMenu } from './DropdownMenu';
import { Glide } from './Glide';
import { IconChevronDown, IconClose, IconSearch, IconSidebar } from './icons';
import { Tooltip } from './Tooltip';
import { TextField } from './TextField';
import './tokens.css';
import './field.css';
import './sidebar.css';

/* Partes desacopladas:
 *
 *   <Sidebar>
 *     <Sidebar.Header>
 *       <DropdownMenu>
 *         <Sidebar.WorkspaceTrigger icon={…} name="Mi espacio" />
 *         …menú…
 *       </DropdownMenu>
 *       <Sidebar.Toggle />
 *     </Sidebar.Header>
 *     <Sidebar.Group>
 *       <Sidebar.Item icon={…} label="Inicio" active onClick={…} />
 *     </Sidebar.Group>
 *     <Sidebar.Content>…</Sidebar.Content>
 *     <Sidebar.Footer>…</Sidebar.Footer>
 *   </Sidebar>
 */

type Slot = { class?: string; children?: JSX.Element };

type SidebarContextValue = { collapsed: Accessor<boolean>; toggle: () => void };
const SidebarContext = createContext<SidebarContextValue>();

export function useSidebar() {
	return useContext(SidebarContext);
}

export type SidebarRootProps = Slot & {
	collapsed?: boolean;
	defaultCollapsed?: boolean;
	onCollapsedChange?: (collapsed: boolean) => void;
};

export function SidebarRoot(props: SidebarRootProps) {
	const [internal, setInternal] = createSignal(props.defaultCollapsed ?? false);
	const collapsed = () => props.collapsed ?? internal();
	const toggle = () => {
		const next = !collapsed();
		setInternal(next);
		props.onCollapsedChange?.(next);
	};
	return (
		<SidebarContext value={{ collapsed, toggle }}>
			<aside
				class={cx('ui-sidebar', props.class)}
				data-collapsed={collapsed() ? '' : undefined}
				aria-label="Navegación"
			>
				<div class="ui-sidebar-inner">{props.children}</div>
			</aside>
		</SidebarContext>
	);
}

export function SidebarHeader(props: Slot) {
	return <div class={cx('ui-sidebar-header', props.class)}>{props.children}</div>;
}

/** Botón que colapsa o expande el sidebar. */
export function SidebarToggle(props: { class?: string; label?: string }) {
	const ctx = useSidebar();
	return (
		<button
			type="button"
			class={cx('ui-sidebar-toggle', props.class)}
			aria-label={props.label ?? (ctx.collapsed() ? 'Expandir barra lateral' : 'Colapsar barra lateral')}
			onClick={ctx.toggle}
		>
			<IconSidebar />
		</button>
	);
}

/** Trigger del selector de espacio. Úsalo dentro de `<DropdownMenu>`. */
export function SidebarWorkspaceTrigger(props: { icon: JSX.Element; name: JSX.Element; class?: string }) {
	return (
		<DropdownMenu.Trigger as="button" class={cx('ui-sidebar-workspace', props.class)}>
			<span class="ui-sidebar-workspace-icon">{props.icon}</span>
			<span class="ui-sidebar-workspace-name ui-sidebar-copy">{props.name}</span>
			<span class="ui-sidebar-workspace-chevron ui-sidebar-copy">
				<IconChevronDown size={16} />
			</span>
		</DropdownMenu.Trigger>
	);
}

/** Grupo de filas con el resaltado deslizante (Glide). */
export function SidebarGroup(props: Slot) {
	return (
		<Glide rowSelector="[data-glide-row]" class={props.class}>
			{props.children}
		</Glide>
	);
}

export type SidebarItemProps = {
	icon?: JSX.Element;
	label: JSX.Element;
	/** Texto del tooltip al colapsar; por defecto, `label` si es texto. */
	tooltip?: string;
	count?: JSX.Element;
	active?: boolean;
	href?: string;
	onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>;
	class?: string;
};

/** Fila de navegación: ícono, etiqueta y contador. Con el sidebar colapsado muestra un tooltip. */
export function SidebarItem(props: SidebarItemProps) {
	const ctx = useSidebar();
	const tip = () => props.tooltip ?? (typeof props.label === 'string' ? props.label : undefined);
	return (
		<Tooltip placement="right" disabled={!ctx.collapsed() || !tip()}>
			<Tooltip.Trigger
				as={props.href ? 'a' : 'button'}
				href={props.href}
				type={props.href ? undefined : 'button'}
				data-glide-row=""
				data-active={props.active ? '' : undefined}
				aria-current={props.active ? 'page' : undefined}
				aria-label={tip()}
				class={cx('ui-sidebar-item', props.class)}
				onClick={props.onClick}
			>
				<span class="ui-sidebar-item-icon">{props.icon}</span>
				<span class="ui-sidebar-item-label ui-sidebar-copy">{props.label}</span>
				{props.count && <span class="ui-sidebar-item-count ui-sidebar-copy">{props.count}</span>}
			</Tooltip.Trigger>
			<Tooltip.Portal>
				<Tooltip.Content>{tip()}</Tooltip.Content>
			</Tooltip.Portal>
		</Tooltip>
	);
}

/** Texto que se oculta al colapsar. Úsalo dentro de botones del pie o contenido propio. */
export function SidebarCopy(props: Slot) {
	return <span class={cx('ui-sidebar-copy', props.class)}>{props.children}</span>;
}

/** Zona central con scroll. */
export function SidebarContent(props: Slot) {
	return <div class={cx('ui-sidebar-content', props.class)}>{props.children}</div>;
}

export function SidebarFooter(props: Slot) {
	return <div class={cx('ui-sidebar-footer', props.class)}>{props.children}</div>;
}

/** Título de sección (12.5px, `ink-3`). */
export function SidebarLabel(props: Slot) {
	return <div class={cx('ui-sidebar-label ui-sidebar-copy', props.class)}>{props.children}</div>;
}

export function SidebarEmpty(props: Slot) {
	return <div class={cx('ui-sidebar-empty ui-sidebar-copy', props.class)}>{props.children}</div>;
}

export type SidebarSearchProps = {
	/** Título visible mientras el buscador está cerrado (p. ej. «Chats»). */
	title: JSX.Element;
	value?: string;
	onValueChange?: (value: string) => void;
	placeholder?: string;
	label?: string;
	class?: string;
};

/** Buscador que crece desde el botón de lupa hasta ocupar la fila. */
export function SidebarSearch(props: SidebarSearchProps) {
	const [open, setOpen] = createSignal(false);
	let input!: HTMLInputElement;
	const show = () => {
		setOpen(true);
		setTimeout(() => input.focus(), 0);
	};
	const hide = () => {
		setOpen(false);
		props.onValueChange?.('');
	};
	return (
		<div class={cx('ui-sidebar-search ui-sidebar-copy', props.class)} data-open={open() ? '' : undefined}>
			<div class="ui-sidebar-search-title">{props.title}</div>
			<button type="button" class="ui-sidebar-search-button" aria-label={props.label ?? 'Buscar'} aria-expanded={open() ? 'true' : 'false'} onClick={show}>
				<IconSearch size={16} />
			</button>
			<div class="ui-sidebar-search-field">
				<span class="ui-sidebar-search-icon"><IconSearch size={15} /></span>
				<TextField value={props.value ?? ''} onChange={(v) => props.onValueChange?.(v)}>
					<TextField.Input
						ref={input}
						placeholder={props.placeholder ?? 'Buscar'}
						aria-label={props.label ?? 'Buscar'}
						onKeyDown={(e: KeyboardEvent) => {
							if (e.key === 'Escape') hide();
						}}
					/>
				</TextField>
				<button type="button" class="ui-sidebar-search-close" aria-label="Cerrar búsqueda" onClick={hide}>
					<IconClose size={16} />
				</button>
			</div>
		</div>
	);
}

export const Sidebar = Object.assign(SidebarRoot, {
	Header: SidebarHeader,
	Toggle: SidebarToggle,
	WorkspaceTrigger: SidebarWorkspaceTrigger,
	Group: SidebarGroup,
	Item: SidebarItem,
	Copy: SidebarCopy,
	Content: SidebarContent,
	Footer: SidebarFooter,
	Label: SidebarLabel,
	Empty: SidebarEmpty,
	Search: SidebarSearch,
});
