# DuoBalance

Frontend de la PWA de gastos compartidos de Órbita Nexo. React, TypeScript,
Vite y Tailwind CSS v4, con React Router en modo de datos
(`createBrowserRouter` y `RouterProvider`).

## Desarrollo

- `npm install`: instalar las dependencias del proyecto.
- `npm run dev`: iniciar Vite en modo mock (sin llamadas a Supabase).
- `npm run dev:mock`: alias explícito del modo mock.
- `npm run dev:demo`: iniciar la demo en `http://localhost:5173` con `.env.demo`
  (`VITE_DATA_MODE=mock`), sin conectar a Supabase.
- `npm run test:e2e`: ejecutar los flujos Playwright en Chromium.
- `npm run build`: comprobar TypeScript y generar la aplicación en `dist/`.
- `npm run lint`: ejecutar Oxlint.
- `npm run preview`: servir la compilación localmente.

### Modo de datos

El modo de desarrollo se configura con `VITE_DATA_MODE`:

- `mock` (predeterminado): sustituye el proveedor de autenticación y todos los
  servicios de datos por mocks locales. No inicia el cliente de Supabase ni
  realiza peticiones a Auth, PostgREST o RPC.
- `supabase`: usa los servicios reales. Requiere `VITE_SUPABASE_URL` y
  `VITE_SUPABASE_PUBLISHABLE_KEY` en `.env.local`.

Para volver temporalmente a Supabase, cambia `VITE_DATA_MODE=supabase` en
`.env.local` y reinicia Vite. También puedes definir esa variable antes de
`npm run dev`. Para compilar producción, el modo debe ser `supabase`; Vite
rechaza explícitamente una compilación configurada con `mock`.

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

La primera vez, instala Chromium para Playwright con
`npx playwright install chromium`. Los E2E arrancan una instancia Vite aislada en el puerto `4174`,
restablecen su escenario y comprueban que no se envíen peticiones a Supabase.

## Arquitectura

### Demo estática en GitHub Pages

La demo se compila por separado con `npm run build:demo` en `dist-demo/`.
Para probarla localmente: `npm run preview:demo` y abrir
`http://127.0.0.1:4175/duobalance/`. Usa rutas hash (`#/login`) para permitir
recargas en GitHub Pages. No carga archivos `.env`, no usa Supabase y nunca
habilita el servidor compartido E2E. El build normal conserva su bloqueo de mocks.
`npm run test:demo` compila y comprueba la demo estática en Chromium con viewport
móvil, recarga de rutas, persistencia, confirmación y recuperación simuladas.

Solo deben introducirse datos ficticios: las cuentas y contraseñas mock se
guardan en el navegador, sin protección para datos reales. Cada dispositivo
tiene su propia demo; las invitaciones solo funcionan en el navegador donde se
crearon y no envían correos. El panel permite cambiar entre usuarios.

Para publicar (el repositorio puede permanecer privado, con un plan compatible):

1. En GitHub, Settings → Pages → Source: **GitHub Actions**.
2. Si el entorno `github-pages` restringe ramas, autorizar `ro-dev`.
3. Subir los cambios a `ro-dev`. El workflow `demo-pages.yml` compila y publica
   únicamente `dist-demo/`, sin código fuente ni mapas de fuentes.
4. Consultar el resultado en Actions. URL prevista:
   `https://roaragonesc.github.io/duobalance/`.

La web puede ser pública aunque el repositorio sea privado. No cambiar la
visibilidad del repositorio para habilitar Pages. Este despliegue no es la
aplicación de producción ni certifica el backend financiero.

```text
src/
  assets/               Logotipos DuoBalance (fondo oscuro y claro)
  components/
    layout/             AppLayout, AuthLayout, AuthLightLayout,
                        OnboardingLayout, SimpleLayout y marca compartida
    ui/                 TextField, SubmitButton, FormAlert, MintWave e iconos
  pages/                Pantallas enrutables y páginas provisionales
  features/
    auth/               Servicio, validaciones y componentes de autenticación
    spaces/             Servicio, validaciones y componentes de espacios
    expenses/
    incomes/
    balance/
  hooks/                useValidatedForm (validación, foco y envío único)
  lib/supabase/         Cliente de Supabase y tipos de la base de datos
  routes/               Router y catálogo de navegación de la aplicación
  types/                Reservada para tipos compartidos
demo/                   Adaptadores mock solo para desarrollo
tests/e2e/              Flujos E2E independientes con Playwright
```

`App.tsx` monta el router y el enlace accesible para saltar al contenido.
Los layouts definen la estructura y renderizan las páginas mediante `Outlet`.
La lógica de cada formulario vive en `features/` (validación y servicio) y en
`hooks/useValidatedForm`; las páginas solo componen la interfaz.

`routes/screens.ts` centraliza las rutas de la aplicación privada para que la
navegación y el router no diverjan. Los servicios mantienen contratos
TypeScript comunes; durante desarrollo, el plugin de Vite sustituye sus
implementaciones y el proveedor de autenticación por los adaptadores mock de
`demo/`. El plugin solo se habilita con `VITE_DATA_MODE=mock` y con el servidor
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

## Backend (Supabase)

Estado: **integración conservada**. En desarrollo el modo predeterminado es mock;
ningún servicio real de Supabase se usa mientras `VITE_DATA_MODE=mock`. Al
seleccionar `supabase`, Login, registro,
recuperación y cambio de contraseña usan Supabase Auth. Las rutas de la app
y el onboarding exigen sesión (`ProtectedRoute`); login y registro redirigen
si ya hay sesión (`PublicOnlyRoute`). «Crea tu espacio» llama a la función
`create_space` (espacio + creador en una transacción). «Invitar pareja» llama a
`create_invitation`, que devuelve un enlace `/join?token=…` de un solo uso
(7 días, ligado al correo invitado; solo se guarda el hash SHA-256 del token).
Supabase no envía ese correo: se copia o se abre en el cliente de correo.
En `/join` el invitado inicia sesión o se registra y pulsa «Aceptar
invitación» (`accept_invitation`, idempotente y transaccional).

### Proyecto en la nube (pasos manuales)

1. SQL Editor: ejecutar, en orden, las migraciones de `supabase/migrations/`
   que aún no estén aplicadas, o mejor `npx supabase db push --remote` con el proyecto
   enlazado (`npx supabase login` + `npx supabase link`). Si una migración ya se
   ejecutó a mano, registrarla sin volver a ejecutarla con
   `npx supabase migration repair --status applied <versión> --remote`.
2. Authentication → URL Configuration: Site URL `http://localhost:5173` y
   Redirect URLs `http://localhost:5173/**` y `http://127.0.0.1:5173/**`.
   Selecciona `VITE_DATA_MODE=supabase` y abre la app en
   `http://localhost:5173` (`npm run dev` ya usa ese origen):
   con PKCE el enlace del correo solo funciona en el mismo navegador y origen
   donde te registraste. Los enlaces de confirmación llegan a `/auth/callback`,
   que inicia la sesión, gestiona los errores (`otp_expired`…) y permite reenviar
   el correo. `npm run test:unit` prueba este flujo con Vitest y jsdom.
3. Authentication → Providers → Email: mínimo 8 caracteres con minúsculas,
   mayúsculas y números; confirmación de correo activada.
4. Probar el registro con el correo de la cuenta de Supabase (el SMTP
   incluido solo envía a miembros del equipo).

- `src/lib/supabase/client.ts`: cliente único (`getSupabaseClient`) con
  sesión persistente y flujo PKCE. Solo usa la clave pública.
- `src/lib/supabase/database.types.ts`: tipos de la base de datos
  (regenerar con `npm run db:types`).
- `src/features/*/services` y `src/features/*/types`: servicios y tipos por
  funcionalidad.
- `supabase/config.toml`: Auth local con confirmación de correo, contraseña
  de 8 caracteres con mayúscula, minúscula y número, y URLs de redirección
  de Vite (`5173` y `4173`).
- `supabase/migrations/`: esquema versionado. Primera migración: `profiles`
  con RLS (cada usuario solo lee y edita su perfil) y alta automática al
  registrarse.

### Pruebas de base de datos

`npm run test:db` arranca un PostgreSQL 17 real sin Docker (`embedded-postgres`),
simula lo mínimo de Supabase (roles `anon`/`authenticated`, `auth.users`,
`auth.uid()` y sus privilegios por defecto), aplica las migraciones en orden y
comprueba esquema, permisos, RLS, funciones RPC, triggers, invitaciones y
concurrencia real con dos conexiones simultáneas. No sustituye a una prueba
final en un Supabase local (`npm run db:start`, requiere Docker).

### Puesta en marcha local

Requiere Docker Desktop (gratuito para uso personal) para la pila local.

```bash
npm run db:start      # levanta Postgres, Auth y Mailpit
npm run db:status     # muestra API URL y publishable key
cp .env.example .env.local   # y pega esos valores
npm run db:reset      # aplica migraciones y seed.sql
npm run db:types      # regenera los tipos TypeScript
```

Los correos locales no se envían de verdad: se ven en Mailpit
(`http://127.0.0.1:54324`).

### Plan gratuito de Supabase (comprobado en la documentación oficial)

- El SMTP incluido solo envía **2 correos por hora** y únicamente a miembros
  del equipo del proyecto; no es apto para usuarios reales. Para producción
  hace falta un SMTP propio (hay proveedores con plan gratuito).
- Supabase Auth no envía correos de invitación personalizados a terceros:
  las invitaciones de pareja se compartirán mediante un enlace seguro.
- Otros límites del plan Free (cuotas de base de datos, usuarios activos,
  pausa por inactividad) pueden cambiar: consúltalos en
  <https://supabase.com/pricing> antes de crear el proyecto.

### URLs de redirección

- Local: `http://127.0.0.1:5173/**`, `http://localhost:5173/**` y las de
  `vite preview` (`4173`).
- Producción: añadir `https://<dominio>/**` en Authentication → URL
  Configuration y fijarlo como Site URL.
## Despliegue

El router utiliza URLs limpias con el historial del navegador. El alojamiento
debe servir `index.html` para rutas de la aplicación como `/expenses` cuando
se abren directamente o se recargan, sin reescribir los recursos estáticos.
Vite ya proporciona este comportamiento durante desarrollo y preview.

Todavía no hay service worker, instalación PWA ni funcionamiento offline.
Playwright cubre los principales flujos de autenticación y espacios en modo mock.

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

Notas para Playwright: `getByLabel` busca por subcadena, así que se necesita
`exact: true` en `getByLabel('Contraseña', { exact: true })` (Registro) y
`getByLabel('Nueva contraseña', { exact: true })` (nueva contraseña).
