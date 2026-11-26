# l22

Sistema de diseño UI para SolidJS: componentes accesibles (basados en Kobalte) con estilos propios, tokens CSS y una rejilla de datos (`DataGrid`).

## Instalación

```bash
npm install @cstffx/l22 solid-js @solidjs/web
```

`solid-js` y `@solidjs/web` son peer dependencies (`^2.0.3`) y deben instalarse en el proyecto que consume la librería.

El proyecto consumidor necesita el plugin de Solid para compilar JSX (`@solidjs/vite-plugin`, o la configuración equivalente de `jsxImportSource: "@solidjs/web"`).

## Uso

Importa los estilos una sola vez, en el punto de entrada de la aplicación:

```tsx
import '@cstffx/l22/l22.css';
import { Button } from '@cstffx/l22';

export function Guardar() {
  return <Button variant="primary">Guardar</Button>;
}
```

Variantes de `Button`: `primary`, `secondary` (por defecto), `ghost`, `accent`, `success`, `danger`, `quiet`. Tamaños: `xs`, `sm`, `md` (por defecto).

Si TypeScript no reconoce el import del CSS, declara los módulos `.css` en el proyecto consumidor (Vite ya lo hace con `vite/client`):

```ts
declare module '*.css';
```

## Componentes

Botones y acciones: `Button`, `Link`, `DropdownMenu`.

Formularios: `TextField`, `NumberInput`, `Checkbox`, `Switch`, `RadioGroup`, `Combobox`, `Calendar`, `DatePicker`, `TimePicker`, `Form`.

Navegación y contenedores: `Tabs`, `Sidebar`, `Accordion`, `Collapsible`, `Card`, `Separator`, `Scrollbar`.

Superposiciones: `Popover`, `Tooltip`, `AlertDialog`.

Datos y visualización: `DataGrid`, `FlowChart`, `FlowCondition`, `Glide`, `Badge`, `Status`, `icons`.

## Desarrollo

```bash
npm install
npm run check   # tsc --noEmit
npm test        # vitest
npm run build   # genera dist/ con JS, tipos y l22.css
```

Publicación: `npm publish` ejecuta antes `check`, `test` y `build` gracias a `prepublishOnly`.

## Licencia

MIT. Ver [LICENSE](./LICENSE).
