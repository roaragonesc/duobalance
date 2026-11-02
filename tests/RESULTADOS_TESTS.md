# Resultados de pruebas — DuoBalance

Fecha: 2 de noviembre de 2026.

## Resumen

| Validación | Resultado |
|---|---|
| Suite completa Playwright | **20 aprobados, 0 fallidos** |
| Duración de la suite completa | Aproximadamente 4,5 minutos |
| Pruebas unitarias | **70 aprobadas en 14 archivos** |
| Build y comprobación TypeScript | Correctos |
| Lint | Correcto |
| Pruebas PostgreSQL | No ejecutadas en esta validación |

La suite completa corresponde a la ejecución verificada después de renombrar los títulos y añadir el panel mock plegable. Este informe se ha elaborado sin volver a ejecutar los tests.

**Fuentes:** salida de consola de la ejecución completa y de las validaciones de build, lint y Vitest. Las duraciones por caso son las mostradas por Playwright, redondeadas; incluyen la preparación del escenario. No deben sumarse para calcular el tiempo total, porque hubo tres workers en paralelo.

## Resultado por test E2E

| Caso del documento | Título actual en Playwright | Resultado | Tiempo aproximado |
|---|---|---|---|
| AUTH-001 | TC01_iniciarSesionConCredencialesValidas | Aprobado | 52,1 s |
| AUTH-002 | TC02_rechazarCredencialesIncorrectas | Aprobado | 31,0 s |
| AUTH-003 | TC03_validarCamposObligatoriosDelLogin | Aprobado | 30,7 s |
| AUTH-004 | TC04_registrarUnUsuarioNuevo | Aprobado | 19,4 s |
| AUTH-005 | TC05_rechazarContrasenasDistintas | Aprobado | 13,8 s |
| AUTH-006 | TC06_recuperarContrasenaEnModoMock | Aprobado | 21,8 s |
| AUTH-007 | TC07_impedirElAccesoSinSesion | Aprobado | 14,9 s |
| ONB-001 | TC08_crearUnEspacioCompartido | Aprobado | 22,1 s |
| ONB-002 | TC09_invitarYVincularALaPareja | Aprobado | 30,0 s |
| ONB-003 | TC10_rechazarUnTercerMiembro | Aprobado | 22,6 s |
| EXP-001 | TC11_crearGastoComunYComprobarloDesdeAmbasCuentas | Aprobado | 1,0 min |
| EXP-002 | TC12_crearGastoIndividualYComprobarSuPrivacidad | Aprobado | 41,9 s |
| EXP-003 | TC13_comprobarElBalanceDeDosGastosComunes | Aprobado | 47,9 s |
| EXP-004 | TC14_modificarUnGastoComun | Aprobado | 52,3 s |
| E2E-001 | TC15_recorridoCompletoDeRegistroCreacionDeEspacioEInvitacion | Aprobado | 53,2 s |
| E2E-002 | TC16_unUsuarioCreaUnGastoComunYElOtroLoConsulta | Aprobado | 51,0 s |
| E2E-003 | TC17_unUsuarioCreaUnGastoIndividualQueElOtroNoPuedeVer | Aprobado | 48,2 s |
| E2E-004 | TC18_recorridoFinancieroCompletoConDosUsuarios | Aprobado | 1,2 min |
| E2E-005 | TC19_respetarPermisosDeEdicionYAccesoAGastos | Aprobado | 44,1 s |
| Adicional: panel mock | TC20_plegarYDesplegarElPanelMockConTeclado | Aprobado | 5,4 s |

TC20 también se ejecutó por separado antes de la suite completa: aprobado en 4,3 segundos. Comprueba plegado con Enter, despliegue con Espacio, foco, `aria-expanded` y visibilidad de los controles mediante `await expect(...)`.

## Ejecución enfocada posterior

Al preparar este documento, el JUnit disponible en `test-results/junit.xml` ya contenía **otra ejecución de un único caso**, no los 20 anteriores:

| Título | Resultado | Tiempo del caso |
|---|---|---|
| TC08_crearUnEspacioCompartido | Aprobado | 24,475 s |

El JUnit declara 1 test, 0 fallos, 0 errores y 0 omitidos, con una duración total de 33,129 segundos. No se han mezclado sus tiempos con los de la suite completa.

Los informes HTML/JUnit se actualizan con cada ejecución; ejecutar un único test puede sustituir el informe anterior. Si la UI o un HTML abierto muestran otros nombres o menos casos, hay que comprobar qué ejecución se está visualizando. El listado de descubrimiento verificado contiene los 20 títulos `TC01_…` a `TC20_…`.

## Entorno y alcance

- Chromium y Vite en `127.0.0.1:4174`, exclusivamente con datos mock ficticios.
- Escenarios aislados por test; los recorridos de pareja usan dos BrowserContexts con sesiones independientes y datos de negocio compartidos por escenario.
- Aserciones de interfaz explícitas en los specs; guardia de red para detectar peticiones externas.
- Login, registro, recuperación mock, rutas protegidas, espacios, invitaciones, gastos compartidos y privados, balance, permisos de edición y panel plegable.
- Sin conexión a Supabase real. Estos resultados no certifican RLS ni una API de producción.

## Avisos y cobertura pendiente

- El build mantiene el aviso de Vite por un bundle JavaScript superior a 500 kB; no es un error de compilación.
- Solo se ha validado Chromium, no Firefox ni WebKit.
- No existen pantalla de detalle de gasto de solo lectura, buscador por texto ni API HTTP de edición de gastos; no se consideran funcionalidades probadas.
- La edición de gastos se sigue realizando por teclado en el test. Se ha comprobado el plegado del panel, pero no se ha añadido una comprobación específica del clic de edición después de plegarlo.
- No se ha verificado persistencia del plegado entre recargas: el panel se abre inicialmente al cargar la página.

El documento original [CASOS_DE_PRUEBA_DUOBALANCE.md](../CASOS_DE_PRUEBA_DUOBALANCE.md) no se ha modificado. El [informe anterior](./INFORME_E2E.md) conserva resultados históricos de una suite de 19 casos; este documento recoge la ejecución completa posterior de 20.
