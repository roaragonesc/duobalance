# DuoBalance

Frontend de la PWA de gastos compartidos de Órbita Nexo. React, TypeScript,
Vite y Tailwind CSS v4, con React Router en modo de datos
(`createBrowserRouter` y `RouterProvider`).

## Desarrollo

- `npm install`: instalar las dependencias del proyecto.
- `npm run dev`: iniciar Vite.
- `npm run build`: comprobar TypeScript y generar la aplicación en `dist/`.
- `npm run lint`: ejecutar Oxlint.
- `npm run preview`: servir la compilación localmente.

## Arquitectura

```text
src/
  assets/               Recursos estáticos existentes
  components/
    layout/             AppLayout, AuthLayout, SimpleLayout y marca compartida
    ui/                 Reservada para controles visuales reutilizables
  pages/                Página provisional reutilizable y página no encontrada
  features/
    auth/
    expenses/
    incomes/
    balance/
    spaces/
  hooks/                Reservada para hooks compartidos
  lib/                  Reservada para utilidades e integraciones
  routes/               Router y catálogo de pantallas/navegación
  types/                Reservada para tipos compartidos
```

`App.tsx` monta el router y el enlace accesible para saltar al contenido.
Los layouts definen la estructura y renderizan las páginas mediante `Outlet`.
`PlaceholderPage` muestra únicamente el nombre de cada pantalla: no hay
formularios, datos ficticios ni lógica financiera.

`routes/screens.ts` centraliza las rutas y los nombres de las pantallas de
autenticación y de la aplicación. La navegación y las rutas de la aplicación
usan el mismo catálogo para evitar divergencias. Al implementar una pantalla,
se podrá sustituir su elemento provisional en `routes/router.tsx` y colocar
su lógica específica en la carpeta correspondiente de `features/`.

Las carpetas reservadas permanecen vacías intencionadamente; no contienen
componentes ni archivos de relleno.

## Rutas

| Ruta | Pantalla | Layout |
| --- | --- | --- |
| `/` | Inicio provisional | SimpleLayout |
| `/login` | Inicio de sesión | AuthLayout |
| `/register` | Registro | AuthLayout |
| `/forgot-password` | Recuperar contraseña | AuthLayout |
| `/onboarding` | Crear o unirse a un espacio | SimpleLayout |
| `/dashboard` | Dashboard | AppLayout |
| `/expenses` | Gastos | AppLayout |
| `/incomes` | Ingresos | AppLayout |
| `/balance` | Balance | AppLayout |
| `/space` | Espacio compartido | AppLayout |
| `/profile` | Mi perfil | AppLayout |
| Cualquier otra ruta | Página no encontrada | SimpleLayout |

Todas las rutas son públicas. `AuthLayout` es exclusivamente visual: no hay
autenticación, protección de rutas, backend ni Supabase.

`AppLayout` muestra una sidebar en escritorio y una navegación en cuadrícula
en móvil, sin ocultar enlaces tras interacciones adicionales. `NavLink` marca
la ruta activa visualmente y con `aria-current="page"`. Hay foco visible,
regiones semánticas y un enlace para saltar al contenido.

Se conservan el plugin de Tailwind v4 y los colores definidos en `src/index.css`:
Navy `#0B2038`, Mint `#47DDB9` e Ice `#EAF6FA`.

## Despliegue

El router utiliza URLs limpias con el historial del navegador. El alojamiento
debe servir `index.html` para rutas de la aplicación como `/expenses` cuando
se abren directamente o se recargan, sin reescribir los recursos estáticos.
Vite ya proporciona este comportamiento durante desarrollo y preview.

Esta tarea no incorpora service worker, instalación PWA, funcionamiento offline
ni Playwright.

## Accessibility First + Testability First

El contrato obligatorio para el desarrollo actual y futuro está en
[las instrucciones del proyecto](.github/copilot-instructions.md).
Incluye localizadores semánticos, HTML nativo, etiquetas y errores asociados,
gestión del foco, estados observables y validación por teclado.

Las pantallas actuales son provisionales y no tienen formularios, peticiones
ni modales: sus estados se incorporarán cuando exista la funcionalidad real.
Los controles existentes se localizan mediante roles y nombres accesibles;
no requieren `data-testid` ni selectores especiales. Playwright sigue sin
instalarse ni configurarse.
