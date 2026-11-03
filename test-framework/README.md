# Framework de pruebas de DuoBalance

Todas las pruebas viven en `test-framework/`, separadas del código React en
`src/` y del servidor en `backend/src/`. No es otro repositorio: es un paquete
de pruebas claramente delimitado dentro de este monorepositorio.
Playwright tiene aquí su propio `package.json`, lockfile, dependencias,
configuraciones y comandos. Todas las suites usan Playwright Test: logica,
componentes React en navegador, PostgreSQL, API y recorridos web.
`npm run test:e2e` conserva la suite mock. `npm run test:api` valida la API
con MongoDB efímero y `npm run test:e2e:api` ejecuta `recorridoFinancieroApi.spec.ts` con
la UI real y dos sesiones independientes contra ese backend, sin Atlas.
Las tres suites bloquean o excluyen Supabase; las configuraciones son independientes.

## Ver todas las pruebas en VS Code

Playwright puede descubrir las cuatro configuraciones y mantener solo una
activada. No significa que las otras suites hayan desaparecido.

1. Abre **Pruebas** (matraz) y despliega el panel **Playwright**.
2. En **CONFIGS**, pulsa el engranaje **Toggle Playwright Configs**
   (activar/desactivar configuraciones).
3. Marca las **cuatro** configuraciones:

   | Configuración | Grupo/proyecto | Casos |
   | --- | --- | --- |
   | `playwright.api.config.ts` | API REST y seed | 58 |
   | `playwright.mock.config.ts` | Frontend - Mock (Chromium) | 20 |
   | `playwright.api-e2e.config.ts` | Frontend - API real (Chromium) | 1 |
   | `playwright.demo.config.ts` | Frontend - Demo movil (Chromium) | 2 |

4. En el selector del panel Playwright, recorre las configuraciones y activa
   su proyecto; usa **Select All** si está desmarcado.
5. Pulsa **Refresh Tests** en el explorador. Si conserva el árbol anterior,
   ejecuta **Developer: Reload Window** desde la paleta.

Así se descubren **81 casos Playwright**, diferenciando REST de interfaz.
La selección de configuraciones/proyectos es estado local de la extensión:
no hay un ajuste versionable que permita forzarla desde el repositorio.
No se ejecutan tests ni se arrancan servidores al listar los casos.

Las unitarias React (76) y PostgreSQL (83) tambien usan Playwright.
Activa sus configuraciones en **Toggle Playwright Configs**, junto con las
de web y API. No se necesita la extension Vitest. Si conserva el arbol anterior,
ejecuta **Developer: Reload Window**. Las dependencias deben estar instaladas
antes de actualizar la lista.

Ejecuta cada suite por separado con sus comandos de abajo. No uses
**Run All** simultáneamente para API REST y frontend con API: sus servidores
comparten los puertos 4180/27018. Para toda la suite REST usa `npm run test:api`,
que crea cuatro entornos nuevos para respetar el límite de autenticaciones;
el matraz permite ejecutar directamente un caso o una selección pequeña.
La demo requiere haber generado antes `npm run build:demo`.

## Estructura

### Nombres de los casos

Los archivos Playwright usan nombres funcionales sin prefijo TC, como
`loginCorrecto.spec.ts`, `validacionLogin.spec.ts` o `consultarSalud.spec.ts`.
Los IDs TC pertenecen a los tests interiores, no a los archivos del explorador.
En `web/` y `api/` hay un caso por archivo, sin subcarpetas.
Web tiene 23 archivos (TC01–23) y API 58 (TC01–58). En unit y db,
si un archivo contiene varios casos, su nombre resume el grupo.
No se cambia el nombre de fixtures, Page Objects ni utilidades.

Todas las suites usan `TC01_descripcionDelComportamiento`, en camelCase sin
tildes ni nombres de personas. Los pasos describen acciones y distinguen la
primera y segunda cuenta cuando intervienen dos sesiones; los datos ficticios
y las expectativas no cambian.
Cada categoria empieza sus casos en TC01 de forma independiente: web TC01–23,
API TC01–58, unit TC01–76 y db TC01–57 (83 ejecuciones con las variantes).
Los `test.step` continuan el contador de su propia categoria: web TC24–97 y
API TC59–106. No hay un contador global compartido entre categorias.

La numeracion es independiente por suite: los IDs E2E conservan su correspondencia
con el documento de casos, los REST mantienen `TC01_API_...`, y unitarias y
PostgreSQL numeran sus escenarios por separado. Las variantes parametrizadas
comparten ID de escenario y terminan en `Caso0`, `Caso1`, etc., para distinguir
entradas sin incluir SQL, correos o nombres de personas en el titulo.

- `playwright.*.config.ts`: configuraciones API, UI mock, UI API y demo Pages.
- `tsconfig.json`: comprobación estricta de tipos del framework.
- `unit/`: pruebas unitarias React y de lógica, con su setup.
- `db/`: pruebas históricas PostgreSQL, helpers y arranque local efímero.
- `integration/`: utilidades del servidor MongoDB efímero y teardown, sin specs.
- `web/`: 23 specs de interfaz juntos y un caso por archivo: TC01–20 mock, TC21–22 demo y TC23 API real. Los títulos siguen el formato `TC01_nombreDelTest`, con descripción en camelCase sin tildes y numeración según el orden de los casos detallados del documento: AUTH-001–007 corresponden a TC01–07, ONB-001–003 a TC08–10, EXP-001–004 a TC11–14 y E2E-001–005 a TC15–19. TC20 comprueba el panel mock plegable.
- `pages/`: Page Objects pequeños, limitados a localizadores e interacciones.
- `components/`: controles de desarrollo reutilizables, como el panel mock.
- `fixtures/`: fixtures tipadas, reinicio por test y guardia de peticiones a Supabase.
- `data/`: usuarios y datos ficticios deterministas.
- `helpers/`: creación de escenarios y utilidades de red.
- `api/`: TC01–45, un caso independiente por operación HTTP, y TC46–57
  de regresión; TC58 comprueba el seed en `api/seedIdempotente.spec.ts`. Todos siguen
  `TC01_API_nombreDelTest`, con numeración única y camelCase sin tildes.
  Véase [api/README.md](api/README.md).

Cada test recibe un contexto de navegador aislado. La fixture crea un escenario nuevo en el servidor mock y reinicia sus datos mediante la interfaz. Las cuentas, espacios e invitaciones se preparan con la UI; no se copia ni modifica `localStorage` desde los tests.

## Sesiones independientes y datos compartidos

El panel mock se abre inicialmente y puede plegarse con «Ocultar panel mock» y desplegarse con «Mostrar panel mock», mediante ratón, Enter o Espacio. Plegado solo muestra el botón; sus controles quedan ocultos y fuera de la navegación por teclado. El estado se conserva durante la navegación interna y se reinicia al recargar la página.

Playwright activa `VITE_MOCK_SHARED=1` además de `VITE_DATA_MODE=mock`. Únicamente esa combinación en un servidor de desarrollo habilita el almacén temporal de `demo/sharedServer.ts`.

- Cada test crea un escenario con identificador aleatorio y lo elimina al finalizar.
- Una cookie HttpOnly identifica el escenario en cada contexto; no identifica al usuario.
- Las sesiones permanecen en el almacenamiento aislado de cada contexto. El campo de sesión no se guarda en el servidor compartido.
- `partnerPage` proporciona otro BrowserContext con el mismo escenario y distinta sesión.
- `couple` registra a Ana y Luis mediante la interfaz, crea `Hogar E2E` al 50/50 y acepta la invitación.
- Los servicios sincronizan los documentos de cuentas/espacios y movimientos antes de operar. Las escrituras incluyen revisión: un conflicto devuelve 409, no sobrescribe silenciosamente los datos.
- El servidor solo acepta conexiones loopback; rechaza solicitudes de otro origen. Es un almacén de pruebas ficticias, **no una API de negocio ni una barrera de seguridad para datos reales**.
- La sincronización se comprueba al navegar o recargar, no se afirma que exista actualización en tiempo real.
- `npm run dev:demo` conserva el modo local habitual sin habilitar este almacén compartido. No activar la variable compartida en una demo con datos que se quieran conservar.

El backend de escenarios no se instala en el build de producción ni en modo API. No utilizar cuentas, contraseñas ni información financiera real.

Los helpers de `scenarios` ofrecen:

- `unauthenticated()`: sin sesión.
- `authenticated('rocio')`: sesión iniciada con una cuenta seed.
- `withoutSpace()`: Isabel, sin espacio, lista para el onboarding.
- `emptySpace()`: Juan, con un espacio creado, sin pareja ni movimientos.
- `spaceWithPartner()`: Rocío y Pablo, con espacio y movimientos compartidos.

Los cambios del panel esperan la recarga real y los escenarios autenticados esperan a que termine el login antes de continuar. No se reutiliza `storageState` entre tests ni se comparte almacenamiento entre workers. Los service workers están bloqueados para que las peticiones del navegador no eludan la guardia de red.

## Comandos

Desde la raíz, instala `npm ci`, `npm --prefix backend ci` y
`npm --prefix test-framework ci`. Solo las suites API necesitan el backend
instalado; ninguna utiliza Atlas ni credenciales de desarrollo.
Los siguientes scripts de la raíz delegan en este paquete:

La demo estática de Pages se valida por separado con `npm run test:demo`
(`playwright.demo.config.ts` y los specs TC21–22 de `web/`). Usa el build estático,
viewport móvil, datos locales de cada navegador y guardia contra peticiones
externas o al servidor compartido. No utiliza las fixtures de escenarios E2E
porque ese servidor no existe en GitHub Pages.
Al pasar de login a recuperación, espera el encabezado de recuperación antes de
rellenar el correo: ambas pantallas usan el mismo nombre accesible para el campo.
El estado de confirmación solo aparece tras una solicitud válida completada;
`unit/pages/TC68_muestraLaConfirmacionComoEstadoAccesibleAlCompletarLaSolicitud.test.tsx` comprueba éxito, validación y error.

- `npm run test:api`: 58 casos API/seed mediante `APIRequestContext`.
- `npm run test:e2e:api`: recorrido UI real multiusuario contra API local.
- `npm run test:fw:typecheck`: tipos de todas las suites y configuraciones.
- `npm run test:unit`: pruebas de logica y componentes React con Playwright.
- `npm run test:db`: pruebas PostgreSQL con Playwright y base local efimera; no se ejecutan desde la configuracion E2E mock.
- `npm run test:e2e`: suite E2E completa.
- `npm run test:e2e:file -- web/loginCorrecto.spec.ts`: ejecutar un archivo.
- `npm run test:e2e:ui`: abrir el modo interactivo de Playwright.
- `npm run test:e2e:debug`: depurar la suite paso a paso.

Playwright inicia Vite automáticamente en `http://127.0.0.1:4174` con `VITE_DATA_MODE=mock`. Para desarrollo manual, `npm run dev:mock` inicia el modo mock en el puerto habitual de Vite.

Los informes HTML mock se generan en `playwright-report/mock/` y su JUnit
en `test-results/junit.xml`. API usa `playwright-report/api/full-suite/` y
`test-results/api/junit.xml`; una ejecución API directa sin shards usa
subcarpetas `api/focused/` para no sobrescribir el consolidado.
Se conserva traza en el primer reintento mock y captura de pantalla al fallar.

En un entorno nuevo, instala Chromium con `npm --prefix test-framework run browsers`
(en Linux CI, `npm --prefix test-framework exec -- playwright install --with-deps chromium`).
Abre el informe mock con `npm --prefix test-framework run report:e2e` y el API
con `npm --prefix test-framework run report:api`. Para obtener una traza local
en el primer reintento: `npm run test:e2e -- --retries=1`.

La preparación de datos solo utiliza el panel mock, incluido exclusivamente en el servidor de desarrollo. `vite.config.ts` rechaza builds con `VITE_DATA_MODE=mock`; no existe un endpoint de reinicio en producción.

## Añadir un test

1. Añade el spec de interfaz directamente en `web/` o el REST en `api/`, sin subcarpetas, con títulos `TC01_nombreDelTest` (por ejemplo, `TC01_iniciarSesionConCredencialesValidas`), respetando el orden y la correspondencia con el documento de casos.
2. Importa `test` y `expect` desde `../fixtures`; el reinicio de datos y la guardia de red se aplican automáticamente.
3. Usa los datos de `data/`, y extiende o crea un Page Object pequeño si una pantalla necesita interacciones reutilizables.
4. Mantén las expectativas en el spec, con aserciones web-first y `await`.
5. Ejecuta el archivo afectado y después la suite completa cuando corresponda.

No uses XPath, selectores CSS frágiles, `waitForTimeout()`, `force: true` ni accesos a `localStorage` para preparar tests. Añade cuentas de prueba únicamente si son ficticias, deterministas y forman parte de los mocks locales.

Los IDs y acciones proceden de `../CASOS_DE_PRUEBA_DUOBALANCE.md`, que se conserva como especificación aportada por la persona usuaria. Cada resultado se escribe explícitamente con `await expect(...)` en el spec y dentro de un `test.step()`; no se admiten métodos `checkEmail()`, `verifyBalance()` ni helpers con aserciones. Los Page Objects solo realizan acciones y exponen localizadores.

El presupuesto por caso es de 90 segundos porque los recorridos incluyen registro y confirmación de dos usuarios, varias navegaciones, recargas y aserciones de persistencia. No se utilizan esperas fijas.

## Cobertura pendiente

- Las pruebas API y UI API se ejecutan por separado contra MongoDB efímero.
- La autenticación real con Supabase queda fuera de esta suite mock.
- Firefox y WebKit se podrán añadir como proyectos cuando se amplíe la matriz de navegadores.
- No existe pantalla de detalle de gasto de solo lectura ni buscador de texto: se verifican los datos en filas accesibles, filtros disponibles y resúmenes. No se inventan rutas ni resultados para esas acciones del plan.
- La ruta real de edición se prueba directamente desde el usuario no autorizado, tanto para gastos comunes como individuales.
- La API HTTP de edición no existe; no se confunde el almacén técnico de escenarios con una API de gastos.
- La suite comprueba privacidad observable y permisos en los servicios mock, no RLS ni seguridad de Supabase real.
