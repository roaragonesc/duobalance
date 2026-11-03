# Informe de ejecución E2E — DuoBalance

Fecha: 2 de noviembre de 2026.

Informe histórico anterior al traslado del framework. Las rutas `tests/` y
`playwright.config.ts` de este informe corresponden ahora a `test-framework/`
y `test-framework/playwright.mock.config.ts`. Los resultados actuales y la
cobertura API se documentan en [README.md](README.md) y [api/README.md](api/README.md).

## Resumen

- Chromium, Vite en `127.0.0.1:4174`, datos exclusivamente mock.
- Suite completa: **19 ejecutados, 19 PASS, 0 FAIL**, en **209,55 segundos**.
- Tres workers, escenarios aislados, sin dependencia del orden.
- Recorridos de pareja con dos BrowserContexts, almacenamiento de negocio compartido por escenario y sesiones separadas.
- Todas las comprobaciones de interfaz son `await expect(...)` visibles en los specs. Los Page Objects y helpers no contienen aserciones.
- Las fixtures comprueban únicamente sus contratos técnicos y la ausencia de peticiones externas.
- El documento original `../CASOS_DE_PRUEBA_DUOBALANCE.md` se conserva sin alterar su contenido.

Los resultados PASS corresponden al alcance ejecutable descrito a continuación. No acreditan funciones inexistentes ni seguridad de Supabase.

## Resultado por escenario

Duraciones obtenidas del JUnit de la última ejecución completa; incluyen la preparación del caso.

| ID | Nombre ejecutado | Resultado | Tiempo |
|---|---|---|---|
| AUTH-001 | Login válido, persistencia y cierre de sesión | PASS | 25,467 s |
| AUTH-002 | Credenciales incorrectas sin acceso privado | PASS | 21,990 s |
| AUTH-003 | Obligatorios y recuperación de errores de login | PASS | 21,779 s |
| AUTH-004 | Registro, confirmación mock y nuevo login | PASS | 15,474 s |
| AUTH-005 | Contraseñas distintas y corrección del formulario | PASS | 9,620 s |
| AUTH-006 | Recuperación mock e invalidación de contraseña anterior | PASS | 16,663 s |
| AUTH-007 | Ruta protegida, logout y navegación Atrás | PASS | 10,485 s |
| ONB-001 | Crear espacio, persistir e impedir segundo espacio | PASS | 19,364 s |
| ONB-002 | Invitación desde otra sesión y persistencia de miembros | PASS | 25,750 s |
| ONB-003 | Rechazo de un tercer miembro | PASS | 25,243 s |
| EXP-001 | Supermercado compartido desde sesiones independientes | PASS | 50,383 s |
| EXP-002 | Gasto individual privado en vistas y URL | PASS | 39,545 s |
| EXP-003 | Balance neto de 20 euros a favor de Ana | PASS | 42,300 s |
| EXP-004 | Editar 80 a 100 euros actualiza ambos balances | PASS | 44,135 s |
| E2E-001 | Registro, espacio e invitación con dos contextos | PASS | 49,122 s |
| E2E-002 | Consulta del gasto compartido desde dos sesiones | PASS | 48,238 s |
| E2E-003 | Privacidad en listados, filtros, resúmenes y URL | PASS | 37,064 s |
| E2E-004 | Recorrido financiero, persistencia y sesiones independientes | PASS | 61,558 s |
| E2E-005 | Permisos de edición y protección de acceso privado | PASS | 30,408 s |

EXP-001/E2E-002 y EXP-002/E2E-003 reutilizan definiciones parametrizadas para no duplicar lógica, pero cada ID se ejecuta con un escenario nuevo e independiente.

## Validaciones adicionales ejecutadas

| Validación | Resultado |
|---|---|
| `npm run build` | PASS; incluye comprobación TypeScript |
| `npm run lint` | PASS |
| `npm run test:unit` | PASS: 70 pruebas en 14 archivos |
| Producción con `VITE_MOCK_SHARED=1` | PASS: no instala ninguno de los plugins mock |
| Aislamiento entre dos escenarios del backend mock | PASS |
| Dos escrituras concurrentes con la misma revisión | PASS: una responde 200 y otra 409 |
| Origen ajeno o inválido | PASS: responde 403 |
| Eliminación de escenarios y acceso posterior | PASS: eliminación 200; acceso posterior 404 |
| ONB-002 tras el ajuste final del control de revisiones | PASS: 31,7 s |
| EXP-004 tras el ajuste final del control de revisiones | PASS: 36,7 s |

El ajuste final valida la revisión después de leer el cuerpo de la petición, evitando que dos escrituras concurrentes acepten una revisión obsoleta. Después se ejecutaron los dos casos enfocados anteriores y se repitieron build y lint. La tabla principal conserva las duraciones de la ejecución completa, no mezcla ejecuciones.

PostgreSQL no se ha ejecutado en esta tarea; su configuración y las migraciones no se han modificado. No se ha conectado Supabase.

## Defectos encontrados y tratamiento

1. **Movimientos ocultos en espacios nuevos — corregido.** Los servicios mock estaban limitados al espacio seed. Ahora contemplan cualquier espacio existente al que pertenece la sesión.
2. **Datos no compartidos entre contextos — resuelto para E2E.** Se añadió un almacén temporal de pruebas con escenario por test; la sesión nunca se comparte con el otro usuario.
3. **Permisos insuficientemente acotados por espacio — corregido en gastos.** La consulta y edición comprueban pertenencia al espacio y la edición exige al creador.
4. **Ingresos de otros espacios en el listado mock — corregido.** El listado filtra por espacio además de por mes.
5. **Navegaciones antes de completar la inicialización mock — corregido en preparación.** El reinicio y el cambio de cuenta esperan al panel renderizado; los escenarios esperan la pantalla correspondiente. La última ejecución completa no produjo los errores de sincronización observados al principio.
6. **Panel demo superpuesto al enlace de edición — pendiente.** El panel fijo puede interceptar el clic del ratón en la fila de gastos. EXP-004 abre el enlace por teclado mediante foco y Enter, sin `force: true`. Esto valida la edición accesible, pero no declara corregida la interacción por ratón. No se modificó el diseño.

Las primeras ejecuciones también detectaron una expectativa incorrecta del test: el reparto visible es «50 % / 50 %», no «50/50». Se corrigió el spec, no la aplicación.

## Cobertura pendiente y límites

| Funcionalidad | Estado | Motivo |
|---|---|---|
| Detalle de gasto de solo lectura para el otro miembro | PENDING | No existe esa pantalla; se verifican concepto, importe, tipo y pagador en la fila, y reparto en espacio/balance |
| Búsqueda de gastos por texto | PENDING | No existe buscador; se comprueban los filtros disponibles de tipo y categoría |
| Rechazo por API HTTP de edición de gastos | PENDING | No existe una API HTTP de gastos; no se inventa una ni se utiliza el almacén técnico como sustituto |
| Edición por ratón cuando el panel demo tapa la acción | PENDING | Solapamiento del panel de desarrollo; la edición ejecutada es por teclado |
| Firefox y WebKit | PENDING | Matriz inicial de Chromium |
| Supabase real y sus permisos RLS | PENDING | Fuera de la suite mock; no se realizan conexiones remotas |

Ana y Luis se registran mediante UI en sus propios escenarios. AUTH-007 utiliza la pareja seed para probar una ruta financiera protegida sin añadir creación de espacio al caso de acceso.

El formulario actual no tiene selector de pagador: paga quien crea el gasto. El reparto pertenece al espacio. El test no inventa esos controles.

El almacén técnico de pruebas maneja datos ficticios y no representa una API de producción ni garantiza confidencialidad frente a quien inspecciona el tráfico de la demo. Los tests verifican la visibilidad y permisos funcionales a través de los servicios mock y la UI.

## Archivos creados o modificados en esta implementación

- `.github/agents/qa-web-playwright.agent.md`: regla explícita de expectativas visibles, IDs y contextos independientes.
- `playwright.config.ts`: backend compartido de pruebas y presupuesto de ejecución.
- `vite.config.ts`, `tsconfig.app.json`: instalación del backend solo en desarrollo mock y separación del código Node.
- `demo/sharedServer.ts`, `demo/sharedClient.ts`: almacenamiento por escenario, sincronización y control de revisiones.
- `demo/demoStore.ts`, `demo/sampleData.ts`, `demo/main.tsx`: integración del almacenamiento compartido y gestión del arranque.
- `demo/authService.ts`, `demo/profileService.ts`, `demo/spaceService.ts`: persistencia esperada antes de continuar.
- `demo/expenseService.ts`, `demo/incomeService.ts`, `demo/balanceService.ts`: movimientos en espacios nuevos, permisos y persistencia.
- `demo/DemoPanel.tsx`: reinicio asíncrono con error explícito.
- `tests/fixtures/index.ts`: escenario, segundo contexto, cuentas y pareja.
- `tests/components/DemoPanel.ts`: sincronización de recargas del panel.
- `tests/data/journeyUsers.ts`: datos ficticios de Ana y Luis.
- `tests/helpers/sharedSpace.ts`, `tests/helpers/networkGuard.ts`, `tests/helpers/demoScenarios.ts`: preparación y aislamiento.
- `tests/pages/RegisterPage.ts`, `tests/pages/ExpensesPage.ts`: acciones y localizadores reutilizables, sin expectativas.
- `tests/e2e/auth.spec.ts`, `tests/e2e/spaces.spec.ts`, `tests/e2e/expenses.spec.ts`: casos básicos y financieros.
- `tests/e2e/privacy.spec.ts`, `tests/e2e/journeys.spec.ts`: privacidad y recorridos completos.
- `tests/README.md`, `tests/INFORME_E2E.md`: documentación técnica e informe.

Los cambios previos del comando `dev:demo` y su configuración se conservaron. No se hicieron commits ni pushes.

## Consultar las evidencias automáticas

- `playwright-report/index.html`: abrir con `npx playwright show-report`.
- `test-results/junit.xml`: resultados por caso para CI.
- Trazas en el primer reintento y capturas en fallos según `playwright.config.ts`.
- No se generaron capturas de fallo en la última ejecución completa: todos los casos pasaron.
