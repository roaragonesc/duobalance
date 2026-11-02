# Pruebas de DuoBalance

Playwright vive en `tests/`, separado de `src/` y de las pruebas Vitest. Los specs E2E usan el servidor de Vite en modo mock y no realizan llamadas a Supabase.

## Estructura

- `e2e/auth/`: autenticación, registro, cierre de sesión y recuperación.
- `e2e/onboarding/`: creación de espacios e invitaciones.
- `e2e/expenses/`: visibilidad de gastos compartidos e individuales.
- `pages/`: Page Objects pequeños, limitados a localizadores e interacciones.
- `components/`: controles de desarrollo reutilizables, como el panel mock.
- `fixtures/`: fixtures tipadas, reinicio por test y guardia de peticiones a Supabase.
- `data/`: usuarios y datos ficticios deterministas.
- `helpers/`: creación de escenarios y utilidades de red.
- `api/`: reservado para pruebas de API cuando exista una API propia.

Cada test recibe un contexto de navegador aislado. La fixture reinicia los datos mock mediante la interfaz antes de cada test; los escenarios autenticado, sin sesión, con espacio vacío y con pareja se preparan usando las páginas de login y el panel mock, no manipulando `localStorage`.

## Comandos

- `npm run test:unit`: pruebas unitarias Vitest de `src/`.
- `npm run test:db`: pruebas PostgreSQL de Vitest; no se ejecutan al lanzar Playwright.
- `npm run test:e2e`: suite E2E completa.
- `npm run test:e2e:file -- tests/e2e/auth/auth.spec.ts`: ejecutar un archivo.
- `npm run test:e2e:ui`: abrir el modo interactivo de Playwright.
- `npm run test:e2e:debug`: depurar la suite paso a paso.

Playwright inicia Vite automáticamente en `http://127.0.0.1:4174` con `VITE_DATA_MODE=mock`. Para desarrollo manual, `npm run dev:mock` inicia el modo mock en el puerto habitual de Vite.

Los informes HTML se generan en `playwright-report/` y el resultado JUnit en `test-results/junit.xml`. Se conserva traza en el primer reintento y captura de pantalla cuando falla un test.

## Añadir un test

1. Añade el spec bajo `e2e/<funcionalidad>/`.
2. Importa `test` y `expect` desde `tests/fixtures`; el reinicio de datos y la guardia de red se aplican automáticamente.
3. Usa los datos de `data/`, y extiende o crea un Page Object pequeño si una pantalla necesita interacciones reutilizables.
4. Mantén las expectativas en el spec, con aserciones web-first y `await`.
5. Ejecuta el archivo afectado y después la suite completa cuando corresponda.

No uses XPath, selectores CSS frágiles, `waitForTimeout()`, `force: true` ni accesos a `localStorage` para preparar tests. Añade cuentas de prueba únicamente si son ficticias, deterministas y forman parte de los mocks locales.

## Cobertura pendiente

- Las pruebas de API quedan pendientes hasta que exista una API propia.
- La autenticación real con Supabase queda fuera de esta suite mock.
- Firefox y WebKit se podrán añadir como proyectos cuando se amplíe la matriz de navegadores.
