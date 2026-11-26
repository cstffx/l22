import type { JSX } from '@solidjs/web';

/* Íconos SVG inline (24x24, trazo 2, extremos redondeados). Heredan `currentColor`. */
export type IconProps = { size?: number; class?: string };

function Svg(props: IconProps & { children: JSX.Element; strokeWidth?: number; viewBox?: string }) {
	return (
		<svg
			width={props.size ?? 18}
			height={props.size ?? 18}
			class={props.class}
			viewBox={props.viewBox ?? '0 0 24 24'}
			fill="none"
			stroke="currentColor"
			stroke-width={props.strokeWidth ?? 2}
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			{props.children}
		</svg>
	);
}

export const IconHome = (p: IconProps) => (
	<Svg {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Svg>
);
export const IconUserAdd = (p: IconProps) => (
	<Svg {...p}><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2M19 8v6M16 11h6" /></Svg>
);
export const IconEdit = (p: IconProps) => (
	<Svg {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Svg>
);
export const IconSearch = (p: IconProps) => (
	<Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>
);
export const IconClose = (p: IconProps) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
export const IconChevronDown = (p: IconProps) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const IconCheck = (p: IconProps) => <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>;
export const IconPlus = (p: IconProps) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconSidebar = (p: IconProps) => (
	<Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></Svg>
);
export const IconSettings = (p: IconProps) => (
	<Svg {...p}><path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" /></Svg>
);
export const IconSignOut = (p: IconProps) => (
	<Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Svg>
);
export const IconPopsicle = (p: IconProps) => (
	<Svg {...p}><path d="M18.6 14.4c.8-.8.8-2 0-2.8l-8.1-8.1a4.95 4.95 0 1 0-7.1 7.1l8.1 8.1c.9.7 2.1.7 2.9-.1ZM22 22l-5.5-5.5" /></Svg>
);
export const IconCard = (p: IconProps) => (
	<Svg {...p}><rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" /></Svg>
);
export const IconLayers = (p: IconProps) => (
	<Svg {...p}><path d="m12 2 10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5" /></Svg>
);
export const IconSun = (p: IconProps) => (
	<Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>
);
export const IconMoon = (p: IconProps) => (
	<Svg {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></Svg>
);
export const IconButton = (p: IconProps) => (
	<Svg {...p} strokeWidth={0}>
		<path
			fill="currentColor"
			d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5m0 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h10c1.65 0 3 1.35 3 3s-1.35 3-3 3"
		/>
	</Svg>
);
export const IconCheckbox = (p: IconProps) => (
	<Svg {...p} strokeWidth={0}>
		<path
			fill="currentColor"
			d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m0 2v14H5V5zm-9 12l-4-4l1.41-1.42L10 14.17l6.59-6.59L18 9"
		/>
	</Svg>
);
export const IconSwitch = (p: IconProps) => (
	<Svg {...p} strokeWidth={0} viewBox="0 0 15 15">
		<path
			fill="currentColor"
			d="M10.731 3.006q.225.01.442.044l.085.014q.172.03.34.07l.027.008q.063.016.126.035l.062.017l.09.03q.166.053.325.12l.102.045l.09.04q.066.031.128.064l.06.031l.085.047q.152.086.297.18l.07.049a5 5 0 0 1 .5.402a4 4 0 0 1 .383.402l.052.062a4 4 0 0 1 .253.345l.07.11l.045.071l.047.081a5 5 0 0 1 .116.217l.042.085q.023.048.043.096l.048.111l.02.05a5 5 0 0 1 .094.256l.032.099l.027.096l.03.106q.04.165.07.337q.01.051.018.104a4.5 4.5 0 0 1-.089 1.78l-.025.093l-.031.11l-.016.05l-.059.17q-.014.042-.032.084l-.039.1l-.04.097l-.05.11l-.043.085l-.058.114l-.037.065q-.033.06-.068.119l-.045.07q-.034.057-.07.111l-.052.075l-.062.09a5 5 0 0 1-.139.18l-.052.062q-.04.05-.084.098l-.053.058q-.049.053-.099.104l-.048.047a4 4 0 0 1-.17.16l-.073.063l-.089.075l-.065.05a5 5 0 0 1-.202.15l-.07.047l-.118.076l-.055.034q-.06.037-.124.07q-.042.025-.085.048l-.06.032l-.127.062l-.09.041l-.102.045a5 5 0 0 1-.326.12l-.09.03l-.062.017a5 5 0 0 1-.493.113l-.085.014a5 5 0 0 1-.442.045L10.5 12h-6l-.231-.006a4.5 4.5 0 0 1 0-8.988L4.5 3h6zM4.5 4a3.5 3.5 0 1 0 0 7h3.173A4.49 4.49 0 0 1 6 7.5A4.49 4.49 0 0 1 7.673 4zm6 0a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7"
		/>
	</Svg>
);
export const IconRadio = (p: IconProps) => (
	<Svg {...p} strokeWidth={0} viewBox="0 0 15 15">
		<path
			fill="currentColor"
			d="M7.5.877a6.623 6.623 0 1 1 0 13.246A6.623 6.623 0 0 1 7.5.877m0 .95a5.674 5.674 0 1 0 0 11.343a5.674 5.674 0 0 0-.002-11.345m0 3.673a2 2 0 1 1 0 4a2 2 0 0 1 0-4"
		/>
	</Svg>
);
export const IconTextField = (p: IconProps) => (
	<Svg {...p} strokeWidth={0} viewBox="0 0 256 256">
		<path
			fill="currentColor"
			d="M112 36a12 12 0 0 0-12 12v12H24A20 20 0 0 0 4 80v96a20 20 0 0 0 20 20h76v12a12 12 0 0 0 24 0V48a12 12 0 0 0-12-12M28 172V84h72v88Zm224-92v96a20 20 0 0 1-20 20h-80a12 12 0 0 1 0-24h76V84h-76a12 12 0 0 1 0-24h80a20 20 0 0 1 20 20M88 112a12 12 0 0 1-12 12v20a12 12 0 0 1-24 0v-20a12 12 0 0 1 0-24h24a12 12 0 0 1 12 12"
		/>
	</Svg>
);
export const IconForm = (p: IconProps) => (
	<Svg {...p} strokeWidth={0}>
		<path
			fill="currentColor"
			d="M10 21h9a2 2 0 0 0 2-2v-2H10zm0-6h11v-5H10zm-2-5v5H3v-5zm2-2h11V6a2 2 0 0 0-2-2h-9zM8 4v4H3V6a2 2 0 0 1 2-2zm0 13v4H5a2 2 0 0 1-2-2v-2z"
		/>
	</Svg>
);
export const IconAccordion = (p: IconProps) => (
	<Svg {...p} strokeWidth={0}>
		<g fill="currentColor">
			<path fill-rule="evenodd" clip-rule="evenodd" d="M19.5 9.5h-10V8h10zm0 3.5h-10v-1.5h10zm0 3.4h-10v-1.5h10z" />
			<path d="m4.5 6.25l4 2.5l-4 2.5z" />
		</g>
	</Svg>
);
export const IconTabs = (p: IconProps) => (
	<Svg {...p} strokeWidth={0}>
		<path
			fill="currentColor"
			d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 6v10H4V5h6v3c0 .55.45 1 1 1zm0-2h-8V5h8z"
		/>
	</Svg>
);
export const IconCollapsible = (p: IconProps) => (
	<Svg {...p} strokeWidth={0}>
		<g fill="currentColor">
			<path fill-rule="evenodd" clip-rule="evenodd" d="M19.5 12.75h-10v-1.5h10z" />
			<path d="m4.5 9.5l4 2.5l-4 2.5z" />
		</g>
	</Svg>
);
export const IconAlertDialog = (p: IconProps) => (
	<Svg {...p} strokeWidth={0} viewBox="0 0 32 32">
		<path
			fill="currentColor"
			d="M28 4H10a2.006 2.006 0 0 0-2 2v14a2.006 2.006 0 0 0 2 2h18a2.006 2.006 0 0 0 2-2V6a2.006 2.006 0 0 0-2-2m0 16H10V6h18Z"
		/>
		<path
			fill="currentColor"
			d="M18 26H4V16h2v-2H4a2.006 2.006 0 0 0-2 2v10a2.006 2.006 0 0 0 2 2h14a2.006 2.006 0 0 0 2-2v-2h-2Z"
		/>
	</Svg>
);
export const IconPopover = (p: IconProps) => (
	<Svg {...p}>
		<path d="M10 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0m2-5l-1.707-1.707A1 1 0 0 0 9.586 11H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2.586a1 1 0 0 0-.707.293z" />
	</Svg>
);
export const IconDropdownMenu = (p: IconProps) => (
	<Svg {...p} strokeWidth={0}>
		<path
			fill="currentColor"
			d="m15.066 13.666l1.7-1.7q.192-.193.095-.445t-.369-.252h-3.984q-.272 0-.369.252t.096.445l1.7 1.7q.242.242.565.242t.566-.242M8 18q-2.507 0-4.253-1.745Q2 14.509 2 12.004t1.747-4.255T8 6h8q2.507 0 4.254 1.745T22 11.996t-1.747 4.255T16 18zm0-1h8q2.075 0 3.538-1.463T21 12t-1.463-3.537T16 7H8Q5.925 7 4.463 8.463T3 12t1.463 3.538T8 17"
		/>
	</Svg>
);
export const IconTooltip = (p: IconProps) => (
	<Svg {...p} strokeWidth={0}>
		<path
			fill="currentColor"
			d="M5 4h13a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-3.5l-3 3l-3-3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3m0 1a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3.91l2.59 2.59L14.09 18H18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"
		/>
	</Svg>
);
export const IconLink = (p: IconProps) => (
	<Svg {...p} strokeWidth={0}>
		<path
			fill="currentColor"
			d="M11 17H7q-2.075 0-3.537-1.463T2 12t1.463-3.537T7 7h4v2H7q-1.25 0-2.125.875T4 12t.875 2.125T7 15h4zm-3-4v-2h8v2zm5 4v-2h4q1.25 0 2.125-.875T20 12t-.875-2.125T17 9h-4V7h4q2.075 0 3.538 1.463T22 12t-1.463 3.538T17 17z"
		/>
	</Svg>
);
export const IconSeparator = (p: IconProps) => (
	<Svg {...p}>
		<path d="M8 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h3m8 0h3c1 0 2 1 2 2v10c0 1-1 2-2 2h-3M12 4v16" />
	</Svg>
);
export const IconSidebarPanel = (p: IconProps) => (
	<Svg {...p} strokeWidth={1.5}>
		<path d="M9 3.5v17M3 9.4c0-2.24 0-3.36.436-4.216a4 4 0 0 1 1.748-1.748C6.04 3 7.16 3 9.4 3h5.2c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748C21 6.04 21 7.16 21 9.4v5.2c0 2.24 0 3.36-.436 4.216a4 4 0 0 1-1.748 1.748C17.96 21 16.84 21 14.6 21H9.4c-2.24 0-3.36 0-4.216-.436a4 4 0 0 1-1.748-1.748C3 17.96 3 16.84 3 14.6z" />
	</Svg>
);
export const IconNumberInput = (p: IconProps) => (
	<Svg {...p} strokeWidth={1.5}>
		<path d="M16 6H8c-2.828 0-4.243 0-5.121.879C2 7.757 2 9.172 2 12s0 4.243.879 5.121C3.757 18 5.172 18 8 18h8c2.828 0 4.243 0 5.121-.879C22 16.243 22 14.828 22 12s0-4.243-.879-5.121C20.243 6 18.828 6 16 6" />
		<path d="M6 9h1v6m-1 0h2m3-6h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h2" />
	</Svg>
);
export const IconCalendar = (p: IconProps) => (
	<Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>
);
export const IconDatePicker = (p: IconProps) => (
	<Svg {...p} strokeWidth={1.5}>
		<path d="M16.5 5V3m-9 2V3M3.25 8h17.5M3 10.044c0-2.115 0-3.173.436-3.981a3.9 3.9 0 0 1 1.748-1.651C6.04 4 7.16 4 9.4 4h5.2c2.24 0 3.36 0 4.216.412c.753.362 1.364.94 1.748 1.65c.436.81.436 1.868.436 3.983v4.912c0 2.115 0 3.173-.436 3.981a3.9 3.9 0 0 1-1.748 1.651C17.96 21 16.84 21 14.6 21H9.4c-2.24 0-3.36 0-4.216-.412a3.9 3.9 0 0 1-1.748-1.65C3 18.128 3 17.07 3 14.955z" />
	</Svg>
);
export const IconCombobox = (p: IconProps) => (
	<Svg {...p} strokeWidth={1.5}>
		<path d="M18 4H6c-1.4 0-2.1 0-2.635.272a2.5 2.5 0 0 0-1.093 1.093C2 5.9 2 6.6 2 8s0 2.1.272 2.635a2.5 2.5 0 0 0 1.093 1.092C3.9 12 4.6 12 6 12h12c1.4 0 2.1 0 2.635-.273a2.5 2.5 0 0 0 1.092-1.092C22 10.1 22 9.4 22 8s0-2.1-.273-2.635a2.5 2.5 0 0 0-1.092-1.093C20.1 4 19.4 4 18 4" />
		<path d="M18 7s-1.473 2-2 2s-2-2-2-2M2 16h12M2 20h12" />
	</Svg>
);

/* Relleno (viewBox 2048), no trazo: ignora `strokeWidth`. */
export const IconFlowChart = (p: IconProps) => (
	<svg width={p.size ?? 18} height={p.size ?? 18} class={p.class} viewBox="0 0 2048 2048" aria-hidden="true">
		<path fill="currentColor" d="M1408 256h640v640h-640V640h-120l-449 896H640v256H0v-640h640v256h120l449-896h199zM512 1664v-384H128v384zm1408-896V384h-384v384z" />
	</svg>
);
export const IconDataGrid = (p: IconProps) => (
	<Svg {...p} strokeWidth={1.5}>
		<rect width="18.5" height="16.5" x="2.75" y="3.75" rx="3" />
		<path d="M2.75 7.75h18.5M2.75 14h18.5M8.92 7.75v12.5m6.17-12.5v12.5" />
	</Svg>
);
export const IconStatus = (p: IconProps) => (
	<Svg {...p} viewBox="0 0 32 32">
		<circle cx="16" cy="16" r="14" fill="currentColor" stroke="none" />
	</Svg>
);
export const IconBadge = (p: IconProps) => (
	<Svg {...p} viewBox="0 0 32 32" strokeWidth={0}>
		<path fill="currentColor" d="M23 13h-5v2h5v2h-4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6v-8a2 2 0 0 0-2-2m0 8h-4v-2h4ZM13 9H9a2 2 0 0 0-2 2v12h2v-5h4v5h2V11a2 2 0 0 0-2-2m-4 7v-5h4v5Z" />
		<path fill="currentColor" d="M28 28H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2M4 6v20h24V6Z" />
	</Svg>
);
