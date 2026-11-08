# Arquitectura

## Workspaces

```text
apps/
  web/                 React, Vite, Tailwind y experiencia de usuario
  api/                 Express, autenticación, reglas y persistencia MongoDB
packages/
  shared-types/        Contratos TypeScript públicos usados por más de una app
  shared-schemas/      Validación en runtime de contratos compartidos
shared/
  mockData.json        Fixture ficticia consumida por la demo y el seed
```

El repositorio usa pnpm workspaces. Web y API se pueden ejecutar y compilar por
separado; el paquete raíz conserva comandos que coordinan ambos workspaces.
Node/MongoDB es el único backend; no se conserva una segunda integración de datos.

## Frontend

- `apps/web/src/app/`: composición de la aplicación, providers y router.
- `apps/web/src/features/`: lógica y componentes por funcionalidad.
- `apps/web/src/components/`: UI y layouts compartidos.
- `apps/web/src/services/api/`: transporte HTTP y provider de sesión.
- Los servicios de `src/features/` consumen directamente la API HTTP.
- `apps/web/src/hooks/`, `lib/`, `assets/` y `styles/`: utilidades y recursos
  transversales.
- `apps/web/demo/`: adaptadores de desarrollo y demo estática aislada.

Las páginas se mantienen en `src/pages/` como capa de composición de rutas;
las reglas y piezas propias siguen dentro de `src/features/`. El plugin de Vite
selecciona mocks durante desarrollo/demo sin cambiar los contratos de las features.
En modo API se usan directamente los servicios HTTP de las features, sin
sustitución del backend mediante plugins.

El transporte exige un decoder Zod para cada respuesta consumida, valida JSON,
campos e importes y no muestra valores inválidos. La feature sigue siendo dueña
del mapeo al contrato UI. CSRF se recupera con una petición compartida; solo se
reintenta una vez un `invalid_csrf` rechazado antes de la mutación. Los demás
errores no se reintentan automáticamente. La caducidad invalida la sesión del
provider; respuestas de una sesión anterior no invalidan una sesión nueva.
Los catálogos se consultan una vez por carga, no por movimiento.

La decisión y sus límites están en [ADR 0002](adr/0002-api-runtime-contracts.md).

## API

`apps/api/src/` mantiene capas explícitas: `routes` y `controllers` traducen
HTTP, `validators` comprueba entradas, `services` aplica reglas,
`repositories` accede a persistencia y `models` define MongoDB. La composición
de Express está en `app.ts`; el ciclo de vida de la conexión está en
`server.ts`, reutilizando `config/database.ts` con seed y diagnóstico.
La conexión comprueba soporte de transacciones antes de aceptar peticiones.
`backend:check` consulta conexión/categorías sin crear documentos; requiere la
configuración privada guardada. Atlas no se presupone operativo y producción
sigue bloqueada.

No se introducen módulos vacíos ni se reorganiza por entidad cuando la
responsabilidad ya está cohesionada por capa. Las operaciones financieras
conservan autorización y transacciones en el servidor.

## Dirección de dependencias

```text
apps/web ───────┐
                ├──> packages/shared-*
apps/api ───────┘
```

Las aplicaciones no importan código fuente una de otra. Los paquetes
compartidos solo exponen contratos no sensibles; nunca incluyen secretos,
modelos privados ni lógica exclusiva del servidor. `npm run lint:arch` (también
disponible con el alias `pnpm run check:architecture`) verifica las fronteras
documentadas mediante AST y un grafo de dependencias locales.

`PendingBalance` pertenece a `features/balance/types.ts`; dashboard conserva
su reexport público por compatibilidad. Dashboard y expenses consumen ese tipo
sin una dependencia circular entre sus contratos. No se modifica su forma ni
el comportamiento financiero.

## QA

La QA de aplicación pertenece al framework externo.
Aquí caben pruebas de desarrollador, como unitarias y tests de tooling. El
validador usa `node:test`. `apps/web/tests` contiene unitarias de cliente/servicios
con `node:test` y `tsx` (`test:unit`, `typecheck:unit`), sin conexiones externas.
`apps/api/tests` comprueba el conector con Mongoose simulado; tampoco conecta a
una base real. Los comandos raíz ejecutan las unitarias de ambas aplicaciones.
No duplicar QA ni añadir infraestructura de pruebas por defecto.

## Gobierno y ownership

[AGENTS.md](../AGENTS.md) es la entrada del equipo. Fullstack coordina e integra;
React y Node poseen archivos asignados de su aplicación; Code Reviewer solo
lee. No hay delegación obligatoria, agentes en bucle ni ediciones concurrentes
del mismo archivo. Contratos compartidos, tooling e inventario pertenecen al
coordinador. El [workflow](AI_AGENT_WORKFLOW.md) define asignación y entrega.

El equipo de desarrollo utiliza inventario, ownership y seis fases con evidencia.

### Alcance automático de `lint:arch`

[architecture.ts](../scripts/architecture.ts) utiliza el AST nativo de
TypeScript 7 ya instalado por `apps/web`, con proyecto virtual de solo lectura.
No usa regex para analizar imports. La API `typescript/unstable/*` es inestable:
una actualización de TypeScript requiere ejecutar las pruebas del validador.
Si faltan TypeScript, su API o el binario nativo, el comando falla explícitamente,
no cae a un parser incompleto ni instala dependencias.

Fuentes inventariables:

- TS/TSX/JS/JSX/MJS/CJS/MTS/CTS, CSS y JSON en `apps/web/src`, `apps/web/demo`, `apps/web/tests`,
  `apps/api/src`, `apps/api/tests`, `packages`, `scripts` y `shared`.
- Configs de esas extensiones directamente en raíz, `apps/web` y `apps/api`.
- Excluidos `node_modules`, `.git`, `.tmp`, `dist`, `dist-demo`, `coverage` y
  enlaces simbólicos.
- Recursos binarios/SVG, HTML, lockfiles, docs/UX y YAML de workflows
  no son fuentes del grafo. Gobierno y workflows se documentan
  manualmente en el inventario. Imports a recursos existentes no son ciclos de código.
- Las unitarias web se inventarían y sus imports se analizan, pero no forman
  parte del bundle: los builtins Node son legítimos allí, no en `apps/web/src`.

| Regla | Qué verifica |
| --- | --- |
| `inventory-missing/orphan/duplicate/drift` | Cada fuente tiene una fila; no sobran rutas; exports, consumidores y dependencias coinciden con la generación |
| `syntax` | El parser no encuentra errores sintácticos en fuentes analizadas |
| `unresolved-import` | Resolución de rutas relativas, sustitución `.js` → `.ts`, archivos índice, aliases explícitos de tsconfig y exports compartidos |
| `workspace-boundary` | Web y API no se importan, ni por nombre de paquete; paquetes compartidos no dependen de aplicaciones |
| `public-import` | Consumidores de paquetes compartidos usan destinos/subpaths declarados en `exports`; los internos del mismo paquete son legítimos |
| `api-layer` | Servicios/repositorios/modelos no importan rutas/controllers/middlewares HTTP |
| `web-composition` | Features/UI no dependen de páginas ni bootstrap/providers/router; `app/router/screens.ts` es metadata pública de navegación consumida legítimamente por layouts |
| `developer-test-boundary` | Las fuentes de aplicación y demo no importan las unitarias de desarrollador; las unitarias sí consumen su propia aplicación |
| `shared-safe` | Paquetes compartidos no importan tooling; contratos y fuentes de navegador no importan builtins Node ni dependencias de servidor explícitas (`express`, `mongoose`, `argon2`) |
| `source-scope` | Una dependencia local inventariable no desaparece del análisis por quedar fuera de los directorios acordados |
| `dependency-cycle` | Ciclos, incluidos self-imports y dependencias solo de tipos, dentro del grafo analizado |

El AST se aplica a las extensiones de código; CSS/JSON se inventarían sin
interpretar imports internos de CSS ni el significado de los datos.
Se analizan imports estáticos, reexports, `import type`, `import()`/`require()`
con literales y referencias de tipos `import('...')`. La resolución soporta los
`paths` de los tsconfig de web/API (con herencia procesada por TypeScript) y los
exports concretos/condicionales de los paquetes actuales. El grafo local incluye
los destinos de tipos y runtime de esos contratos, no dependencias de terceros.

### Límites y revisión manual

No es un resolvedor universal de Node/Vite: no interpreta plugins que reemplazan
módulos, imports calculados, glob imports, aliases de Vite distintos de tsconfig,
wildcards de package exports ni carga CommonJS indirecta. Las sustituciones
API/mock de Vite se revisan también en sus plugins inventariados.
La lista de dependencias de servidor no identifica semánticamente todas las
librerías posibles. Los contratos públicos de features no tienen barrels
obligatorios; sus imports internos y cruces existentes siguen siendo legítimos.

No impone nombres/carpetas nuevos ni valida DTOs semánticamente, autorización,
datos, endpoints, accesibilidad o comportamiento. Exports declarados no son
sinónimo de API semánticamente estable. Responsabilidad de negocio, consumidores
externos y compatibilidad requieren revisar código/documentación y QA autorizada.

`npm run inventory:update` regenera únicamente el bloque delimitado del inventario,
preserva su texto manual y devuelve código no cero si detecta infracciones.
`npm run lint:arch` no escribe archivos. Los diagnósticos indican ruta, regla y
corrección; excepciones nuevas requieren documentación y pruebas, no skips.

Las pruebas del validador usan `node:test`, sin QA de aplicación ni dependencias
nuevas. `npm run typecheck:tooling` comprueba tooling con el compilador del workspace
web. CI ejecuta `typecheck:tooling`, `test:architecture`, `typecheck:unit`,
`test:unit` de web/API sin conexiones externas, `lint:arch`, lint y
los builds normal y demo tras la instalación reproducible. El alias
`check:architecture` sigue disponible para consumidores existentes. No afirmar
ejecución remota por una validación local.
