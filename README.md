# DuoBalance

Frontend de la PWA de gastos compartidos de Órbita Nexo. React, TypeScript,
Vite y Tailwind CSS v4, con React Router en modo de datos
(`createBrowserRouter` y `RouterProvider`).

## Desarrollo

- `pnpm install`: instalar las dependencias de todos los workspaces.
- `pnpm run dev`: iniciar Vite en modo mock (sin conectar al backend).
- `pnpm run dev:mock`: alias explícito del modo mock.
- `pnpm run dev:demo`: iniciar la demo en `http://localhost:5173` con `.env.demo`
  (`VITE_DATA_MODE=mock`), sin conectar al backend.
- `pnpm run backend:dev`: iniciar la API Express en `http://127.0.0.1:3001`.
- `pnpm run build`: comprobar TypeScript y compilar web y API.
- `pnpm run lint`: ejecutar Oxlint en ambas aplicaciones.
- `pnpm run preview`: servir la compilación localmente.

### Modo de datos

El modo de desarrollo se configura con `VITE_DATA_MODE`:

- `mock` (predeterminado): sustituye el proveedor de autenticación y todos los
  servicios de datos por mocks locales, sin peticiones a servicios externos.
- `api`: usa el backend Express/MongoDB con cookies HttpOnly. Requiere iniciar
  la API y cargar sus datos seed según [apps/api/README.md](apps/api/README.md).

Para usar el backend, define `VITE_DATA_MODE=api` y reinicia Vite. El build normal
usa API por defecto y rechaza empaquetar el modo mock. Node/MongoDB es el único
backend del repositorio.
La URI MongoDB solo se configura en `apps/api/.env`, nunca como variable `VITE_`.

Las cuentas seed del modo mock (contraseña común `Demo1234!`) son:

| Correo | Escenario |
| --- | --- |
| `nuevo@duobalance.test` | Sin espacio |
| `solo@duobalance.test` | Espacio con un miembro |
| `rocio@duobalance.test` | Espacio compartido, creadora |
| `pablo@duobalance.test` | Espacio compartido, invitado |
| `ines@duobalance.test` | Disponible para invitaciones |
| `mateo@duobalance.test` | Disponible para invitaciones |

El panel «Modo mock» permite cambiar de cuenta, abrir los enlaces simulados de
confirmación/recuperación y restablecer usuarios, espacios e interacciones. Los
datos se guardan en `localStorage` de este navegador; no se sincronizan entre
dispositivos. Las contraseñas registradas en este modo son solo credenciales
ficticias de desarrollo.

Los gastos se muestran por fecha, del más reciente al más antiguo, tanto en
la lista como en los últimos movimientos del dashboard. Si coinciden en fecha,
aparece primero el último añadido; editarlo no cambia su orden de creación.

## Pruebas de QA

La QA de aplicación vive en un framework específico
separado. Aquí pueden vivir pruebas de desarrollador, como unitarias y tests
de tooling. El validador arquitectónico tiene pruebas con `node:test`; no hay
actualmente un runner de unitarias de aplicación declarado.
No duplicar las suites del framework externo.
Este repositorio mantiene los principios Accessibility First y
Testability First para que la aplicación siga siendo automatizable desde ese
framework externo.

## Trabajo con agentes

Consultar [inventario](docs/COMPONENT_INVENTORY.md),
[workflow de seis fases](docs/AI_AGENT_WORKFLOW.md),
[arquitectura](docs/ARCHITECTURE.md) y
[buenas prácticas](docs/BEST_PRACTICES.md) antes de modificar código.
El punto de entrada es [AGENTS.md](AGENTS.md). Selecciona **DuoBalance Fullstack
Engineer** en Copilot Chat para cambios fullstack: coordina **React Frontend**,
**Node Backend** y **Code Reviewer** cuando una tarea independiente lo justifica.
También puedes seleccionar React o Node directamente. El revisor es de solo
lectura. No se lanza todo el equipo por defecto ni se delegan archivos en conflicto.

```text
Fullstack → entender e inventariar → acordar contratos/asignaciones
          → React / Node (solo trabajo independiente)
          → revisión cuando aporte valor → integrar y verificar → reportar
```

Después de cambiar fuentes, imports o exports:

- `npm run inventory:update`: actualizar el bloque generado y revisar el diff.
- `npm run lint:arch`: verificar inventario, imports AST, fronteras acordadas
  y ciclos locales, incluidos los de tipos.
- `npm run test:architecture`: ejecutar unitarias del propio validador.
- `npm run typecheck:tooling`: comprobar TypeScript estricto del tooling.

No requieren dependencias nuevas: se usa el TypeScript instalado en web y el
runner de Node. [Arquitectura](docs/ARCHITECTURE.md) documenta exclusiones y
limitaciones; estos controles no certifican QA, accesibilidad ni seguridad.
El alias `check:architecture` sigue disponible. CI ejecuta el typecheck y las
unitarias del tooling, `lint:arch`, lint y los builds normal y demo.
Si Copilot no ofrece delegación, usa selección manual o Fullstack directamente
y comunica la limitación; no simules ejecuciones de agentes.

## Arquitectura

### Backend propio con MongoDB

La implementación modular y su estado real están en
[apps/api/README.md](apps/api/README.md): inventario, mapa de endpoints,
OpenAPI, configuración privada y ejecución local.
Incluye autenticación, perfiles, espacios, invitaciones, categorías, gastos,
ingresos, balances y liquidaciones, seed idempotente y adaptadores React API.
Los mocks de desarrollo se conservan. La conexión/carga Atlas
no se presupone: requiere `apps/api/.env` guardado y verificación real.
No definir una URI MongoDB como variable `VITE_` ni compartir sus credenciales.

### Demo estática en GitHub Pages

La demo se compila por separado con `pnpm run build:demo` en
`apps/web/dist-demo/`.
Para probarla localmente: `pnpm run preview:demo` y abrir
`http://127.0.0.1:4175/duobalance/`. Usa rutas hash (`#/login`) para permitir
recargas en GitHub Pages. No carga archivos `.env` ni habilita el servidor
compartido de mocks. El build normal conserva su bloqueo de mocks.

Solo deben introducirse datos ficticios: las cuentas y contraseñas mock se
guardan en el navegador, sin protección para datos reales. Cada dispositivo
tiene su propia demo; las invitaciones solo funcionan en el navegador donde se
crearon y no envían correos. El panel permite cambiar entre usuarios.

Para publicar (el repositorio puede permanecer privado, con un plan compatible):

1. En GitHub, Settings → Pages → Source: **GitHub Actions**.
2. Si el entorno `github-pages` restringe ramas, autorizar `ro-dev`.
3. Subir los cambios a `ro-dev`. El workflow `demo-pages.yml` compila y publica
   únicamente `apps/web/dist-demo/`, sin código fuente ni mapas de fuentes.
4. Consultar el resultado en Actions. URL prevista:
   `https://roaragonesc.github.io/duobalance/`.

La web puede ser pública aunque el repositorio sea privado. No cambiar la
visibilidad del repositorio para habilitar Pages. Este despliegue no es la
aplicación de producción ni certifica el backend financiero.

```text
.github/
  agents/               Coordinador fullstack, React, Node y revisor de lectura
  instructions/          Reglas de React, Node, arquitectura y QA
  workflows/             CI y publicación de la demo
AGENTS.md                Entrada del gobierno y ownership del equipo
docs/                    Inventario, workflow, arquitectura, buenas prácticas, ADRs y UX
apps/
  web/
    src/app/             Providers y router
    src/features/        Lógica y componentes por funcionalidad
    src/components/      UI y layouts compartidos
    src/services/api/    Transporte y adaptadores HTTP
  api/src/               Express + MongoDB, capas de API
packages/
  shared-types/          Contratos públicos entre aplicaciones
  shared-schemas/        Validación compartida en runtime
scripts/                 Comprobaciones de límites entre workspaces
shared/
  mockData.json         Fixtures usados por la demo y el seed de la API
```

`apps/web/src/app/App.tsx` monta el router y el enlace accesible para saltar al contenido.
Los layouts definen la estructura y renderizan las páginas mediante `Outlet`.
La lógica de cada formulario vive en `features/` (validación y servicio) y en
`hooks/useValidatedForm`; las páginas solo componen la interfaz.

`apps/web/src/app/router/screens.ts` centraliza las rutas de la aplicación privada para que la
navegación y el router no diverjan. Los servicios mantienen contratos
TypeScript comunes; durante desarrollo, el plugin de Vite sustituye sus
implementaciones y el proveedor de autenticación por los adaptadores mock de
`apps/web/demo/`. El plugin solo se habilita con `VITE_DATA_MODE=mock` y con el servidor
de desarrollo; el build de producción nunca empaqueta los mocks.

## Rutas

| Ruta | Pantalla | Layout | Estado |
| --- | --- | --- | --- |
| `/` | Redirige a `/login` | — | Redirección |
| `/login` | Login | AuthLayout | Diseño implementado |
| `/register` | Registrarse | AuthLayout | Diseño implementado |
| `/forgot-password` | ¿Has olvidado tu contraseña? | AuthLightLayout | Diseño implementado |
| `/reset-password` | Establecer nueva contraseña | AuthLightLayout | Diseño implementado |
| `/onboarding` | Crea tu espacio (paso 1) | OnboardingLayout | Diseño implementado |
| `/onboarding/invite` | Invita a tu pareja (paso 2) | OnboardingLayout | Diseño implementado |
| `/dashboard` | Dashboard | AppLayout | Implementado |
| `/expenses` | Gastos | AppLayout | Implementado |
| `/incomes` | Ingresos | AppLayout | Implementado |
| `/balance` | Balance | AppLayout | Implementado |
| `/space` | Espacio compartido | AppLayout | Implementado |
| `/profile` | Mi perfil | AppLayout | Implementado |
| Cualquier otra ruta | Página no encontrada | SimpleLayout | — |

Los diseños de referencia están en `docs/ux/`. Pendientes de diseño: paso
«Invitar pareja» (la imagen actual es una copia de «Crea tu espacio»), paso
«Listo» y las pantallas de la aplicación.

`AppLayout` muestra una sidebar en escritorio y una navegación en cuadrícula
en móvil. `NavLink` marca la ruta activa con `aria-current="page"`.

Se conservan el plugin de Tailwind v4 y los colores definidos en `src/index.css`:
Navy `#0B2038`, Mint `#47DDB9` e Ice `#EAF6FA`.

## Despliegue

El router utiliza URLs limpias con el historial del navegador. El alojamiento
debe servir `index.html` para rutas de la aplicación como `/expenses` cuando
se abren directamente o se recargan, sin reescribir los recursos estáticos.
Vite ya proporciona este comportamiento durante desarrollo y preview.

Todavía no hay service worker, instalación PWA ni funcionamiento offline.

## Accessibility First + Testability First

El contrato obligatorio está en
[las instrucciones del proyecto](.github/copilot-instructions.md).

- Todos los campos tienen `label` asociado. En Login y Registro la etiqueta es
  visualmente oculta porque el diseño solo muestra placeholders.
- Los errores de campo usan `role="alert"`, `aria-invalid` y
  `aria-describedby`; al enviar un formulario inválido se enfoca el primer
  campo con error. El botón de envío se deshabilita durante la petición.
- Los requisitos de contraseña son una lista accesible
  («Requisitos de la contraseña») vinculada al campo con `aria-describedby`.
- El método de reparto usa radios nativos dentro de un `fieldset`.
- El paso actual del onboarding se marca con `aria-current="step"`; los pasos completados son enlaces y el botón «Volver» es un enlace definido por `handle.backTo` en la ruta.
- Todas las pantallas comparten tamaños (campos 52 px, botón 54 px, títulos 34 px) y el componente `Logo` en alta resolución.
- Ningún control necesita `data-testid`.
