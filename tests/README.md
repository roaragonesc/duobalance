# Pruebas de DuoBalance

Playwright vive en `tests/`, separado de `src/` y de las pruebas Vitest. Los specs E2E usan el servidor de Vite en modo mock y no realizan llamadas a Supabase.

## Estructura

- `e2e/`: todos los specs juntos, sin subcarpetas (`auth.spec.ts`, `spaces.spec.ts`, `expenses.spec.ts`, `privacy.spec.ts`, `journeys.spec.ts` y `mock-panel.spec.ts`). Los títulos siguen el formato `TC01_nombreDelTest`, con descripción en camelCase sin tildes y numeración según el orden de los casos detallados del documento: AUTH-001–007 corresponden a TC01–07, ONB-001–003 a TC08–10, EXP-001–004 a TC11–14 y E2E-001–005 a TC15–19. TC20 comprueba el panel mock plegable.
- `pages/`: Page Objects pequeños, limitados a localizadores e interacciones.
- `components/`: controles de desarrollo reutilizables, como el panel mock.
- `fixtures/`: fixtures tipadas, reinicio por test y guardia de peticiones a Supabase.
- `data/`: usuarios y datos ficticios deterministas.
- `helpers/`: creación de escenarios y utilidades de red.
- `api/`: reservado para pruebas de API cuando exista una API propia.

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

El backend de escenarios no se instala en el build de producción ni en modo Supabase. No utilizar cuentas, contraseñas ni información financiera real.

Los helpers de `scenarios` ofrecen:

- `unauthenticated()`: sin sesión.
- `authenticated('rocio')`: sesión iniciada con una cuenta seed.
- `withoutSpace()`: Nora, sin espacio, lista para el onboarding.
- `emptySpace()`: Sergio, con un espacio creado, sin pareja ni movimientos.
- `spaceWithPartner()`: Rocío y Pablo, con espacio y movimientos compartidos.

Los cambios del panel esperan la recarga real y los escenarios autenticados esperan a que termine el login antes de continuar. No se reutiliza `storageState` entre tests ni se comparte almacenamiento entre workers. Los service workers están bloqueados para que las peticiones del navegador no eludan la guardia de red.

## Comandos

La demo estática de Pages se valida por separado con `npm run test:demo`
(`playwright.demo.config.ts` y `pages-demo.spec.ts`). Usa el build estático,
viewport móvil, datos locales de cada navegador y guardia contra peticiones
externas o al servidor compartido. No utiliza las fixtures de escenarios E2E
porque ese servidor no existe en GitHub Pages.
Al pasar de login a recuperación, espera el encabezado de recuperación antes de
rellenar el correo: ambas pantallas usan el mismo nombre accesible para el campo.
El estado de confirmación solo aparece tras una solicitud válida completada;
`src/pages/ForgotPassword.test.tsx` comprueba éxito, validación y error.

- `npm run test:unit`: pruebas unitarias Vitest de `src/`.
- `npm run test:db`: pruebas PostgreSQL de Vitest; no se ejecutan al lanzar Playwright.
- `npm run test:e2e`: suite E2E completa.
- `npm run test:e2e:file -- tests/e2e/auth.spec.ts`: ejecutar un archivo.
- `npm run test:e2e:ui`: abrir el modo interactivo de Playwright.
- `npm run test:e2e:debug`: depurar la suite paso a paso.

Playwright inicia Vite automáticamente en `http://127.0.0.1:4174` con `VITE_DATA_MODE=mock`. Para desarrollo manual, `npm run dev:mock` inicia el modo mock en el puerto habitual de Vite.

Los informes HTML se generan en `playwright-report/` y el resultado JUnit en `test-results/junit.xml`. Se conserva traza en el primer reintento y captura de pantalla cuando falla un test.

En un entorno nuevo, instala Chromium con `npx playwright install chromium` (en Linux CI, `npx playwright install --with-deps chromium`). Para abrir el informe usa `npx playwright show-report`; para obtener una traza local en el primer reintento, `npm run test:e2e -- --retries=1`.

La preparación de datos solo utiliza el panel mock, incluido exclusivamente en el servidor de desarrollo. `vite.config.ts` rechaza builds con `VITE_DATA_MODE=mock`; no existe un endpoint de reinicio en producción.

## Añadir un test

1. Añade el spec directamente en `e2e/`, sin subcarpetas, con títulos `TC01_nombreDelTest` (por ejemplo, `TC01_iniciarSesionConCredencialesValidas`), respetando el orden y la correspondencia con el documento de casos.
2. Importa `test` y `expect` desde `tests/fixtures`; el reinicio de datos y la guardia de red se aplican automáticamente.
3. Usa los datos de `data/`, y extiende o crea un Page Object pequeño si una pantalla necesita interacciones reutilizables.
4. Mantén las expectativas en el spec, con aserciones web-first y `await`.
5. Ejecuta el archivo afectado y después la suite completa cuando corresponda.

No uses XPath, selectores CSS frágiles, `waitForTimeout()`, `force: true` ni accesos a `localStorage` para preparar tests. Añade cuentas de prueba únicamente si son ficticias, deterministas y forman parte de los mocks locales.

Los IDs y acciones proceden de `../CASOS_DE_PRUEBA_DUOBALANCE.md`, que se conserva como especificación aportada por la persona usuaria. Cada resultado se escribe explícitamente con `await expect(...)` en el spec y dentro de un `test.step()`; no se admiten métodos `checkEmail()`, `verifyBalance()` ni helpers con aserciones. Los Page Objects solo realizan acciones y exponen localizadores.

El presupuesto por caso es de 90 segundos porque los recorridos incluyen registro y confirmación de dos usuarios, varias navegaciones, recargas y aserciones de persistencia. No se utilizan esperas fijas.

## Cobertura pendiente

- Las pruebas de API quedan pendientes hasta que exista una API propia.
- La autenticación real con Supabase queda fuera de esta suite mock.
- Firefox y WebKit se podrán añadir como proyectos cuando se amplíe la matriz de navegadores.
- No existe pantalla de detalle de gasto de solo lectura ni buscador de texto: se verifican los datos en filas accesibles, filtros disponibles y resúmenes. No se inventan rutas ni resultados para esas acciones del plan.
- La ruta real de edición se prueba directamente desde el usuario no autorizado, tanto para gastos comunes como individuales.
- La API HTTP de edición no existe; no se confunde el almacén técnico de escenarios con una API de gastos.
- La suite comprueba privacidad observable y permisos en los servicios mock, no RLS ni seguridad de Supabase real.
