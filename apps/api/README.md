# DuoBalance: API y MongoDB

## Alcance

Backend Express 5, TypeScript estricto, Mongoose, Zod y MongoDB (replica set).
Incluye autenticación, perfiles, espacios, invitaciones, categorías, gastos,
ingresos, balances, resúmenes y liquidaciones. El frontend dispone de adaptadores
HTTP con cookies, modo `api` y proxy Vite; conserva el modo `mock` y Pages.
Node/MongoDB es el único backend del repositorio.

**No se ha conectado ni cargado Atlas**: falta `apps/api/.env` guardado en disco.
El seed y los contratos se han probado contra un MongoDB real efímero local,
no contra Atlas ni producción. No confundir esas dos comprobaciones.

## Arquitectura

- `src/models/`: esquemas Mongoose e índices.
- `src/validators/`: entradas Zod estrictas; identificadores, fechas reales y céntimos.
- `src/repositories/`: acceso a datos, autorización y transacciones del espacio.
- `src/services/`: reglas de negocio, cálculos, autenticación y correo.
- `src/controllers/`: contratos HTTP; `src/routes/`: rutas y middleware.
- `src/config/`: entorno y OpenAPI 3.1.
- `src/seeds/`: carga idempotente desde `../../shared/mockData.json`.
- `src/app.ts`: composición sin conexión implícita; `src/server.ts`: ciclo de vida.
- `../web/src/services/api/`: cliente HTTP y provider de sesión.
- `../web/src/features/`: servicios de cada funcionalidad que consumen la API.

No se añaden repositorios/clases vacíos por cada entidad: se agrupan los
movimientos financieros relacionados y se centraliza el bloqueo transaccional.

## Colecciones e invariantes

| Colección | Datos e índices |
| --- | --- |
| `users` | Nombre, correo único normalizado, hash Argon2id oculto, confirmación, tokens hasheados con caducidad, versión de autenticación, timestamps |
| `sessions` | Hash único de cookie aleatoria de 256 bits, hash CSRF, usuario, versión, expiración e índice TTL |
| `spaces` | Nombre, creador, miembros, reparto global, revisión; índice único multikey sobre miembros impide pertenecer a varios espacios |
| `invitations` | Espacio, remitente, correo destinatario, hash único de token, estado, caducidad; índice por correo/estado |
| `categories` | Nombre, icono, color, propietario o null global; clave global única |
| `expenses` | Espacio, creador, pagador, descripción, céntimos, categoría, tipo, fecha, proporción histórica en puntos básicos; índice espacio/fecha/creación |
| `incomes` | Espacio, propietario, descripción, céntimos y fecha; índice espacio/fecha |
| `settlements` | Espacio, deudor, acreedor, autor del registro, céntimos, fecha, nota; índice espacio/fecha |

Todas tienen timestamps. Las entidades seed disponen de una clave única opcional.
Los balances **no** son una colección: se derivan de gastos y liquidaciones.

### Autorización y negocio

- Cada usuario pertenece como máximo a un espacio; máximo dos miembros.
- Solo el creador cambia el nombre/reparto, invita o borra el espacio.
- Solo se borra un espacio sin gastos, ingresos ni liquidaciones; sus invitaciones
  se eliminan en la misma transacción.
- Invitaciones de siete días, un uso y ligadas al correo; aceptación y límite de
  miembros son atómicos. La respuesta de creación entrega el token una sola vez,
  nunca su hash. La invitación se comparte desde el frontend, no se envía por SMTP.
- Las categorías globales son inmutables. Las personales solo las gestiona su
  propietario; no se borran si hay gastos asociados. Los gastos compartidos pueden
  mostrar el nombre de la categoría de su creador en los resúmenes.
- Los gastos individuales son privados, devuelven 404 al otro usuario incluso
  por ID y no entran en balances/resúmenes. Solo el creador edita o borra sus gastos.
- Cada usuario gestiona solo sus ingresos; su pareja puede consultarlos.
- Los gastos guardan pagador y creador desde la sesión; no aceptan esos campos
  del cliente. El tipo es inmutable al editar.
- Los listados se ordenan por fecha descendente y, a igual fecha, creación e ID
  descendentes. Editar no cambia el timestamp de creación.
- Los pagos son manuales y parciales. Ambos miembros pueden registrar el pago del
  deudor; el servidor deriva deudor/acreedor, nunca acepta usuarios ajenos.
- La deuda se valida a fecha de liquidación; no se permiten pagos futuros ni
  insertar un pago anterior a otro existente. Un exceso devuelve 409.
- Corregir/borrar gastos conserva íntegro el historial de liquidaciones.

Las mutaciones financieras escriben la revisión del espacio en una transacción:
pagos, cambios de ingresos, gastos, miembros y borrado no pueden saltarse las
comprobaciones mediante peticiones concurrentes. El bloqueo de categorías evita
la carrera entre borrado y creación de un gasto que las utiliza.

### Regla de cálculo aprobada

Importes en céntimos enteros seguros; máximo por movimiento: 1.000.000.000 céntimos.
Reparto global 50/50 o proporcional a ingresos del mes. Sin ingresos se usa 50/50.
La proporción se guarda **en cada gasto** al crearlo y se conserva al editarlo.
Cambiar ingresos/reparto no recalcula gastos anteriores.

La parte del creador del espacio se redondea al céntimo más cercano (mitades hacia
arriba) y el resto corresponde a la pareja. Se usa aritmética BigInt en la
asignación para evitar errores de coma flotante. En reparto proporcional, la
proporción se expresa redondeada en puntos básicos, compatible con el frontend.

La deuda a favor del creador es lo que pagó menos la suma de sus partes por gasto.
Se resta lo que le ha pagado la pareja y se suma lo que él ha pagado a la pareja.
Ana paga 80 €, Luis 40 €, al 50/50: Luis debe 20 € a Ana.
Los porcentajes del resumen son una media ponderada de los snapshots del mes.

## Endpoints

Prefijo `/api/v1`. OpenAPI JSON en `GET /api/v1/api-docs`, generado desde los
validadores Zod para los cuerpos financieros. No se usa un CDN Swagger externo.

| Recurso | Endpoints |
| --- | --- |
| Autenticación | `POST /auth/register`, `/login`, `/logout`, `/confirm-email`, `/resend-confirmation`, `/forgot-password`, `/reset-password`; `GET /auth/me`, `/auth/csrf` |
| Perfiles | `GET/PATCH /users/me`; `GET /users?email=…` (correo exacto, sin directorio global) |
| Espacios | `POST/GET /spaces`; `GET/PATCH/DELETE /spaces/{id}`; `GET /spaces/{id}/members` |
| Invitaciones | `POST /spaces/{id}/invitations`; `GET /invitations`; `POST /invitations/{token}/accept`, `/reject` |
| Categorías | `GET/POST /categories`; `PATCH/DELETE /categories/{id}` |
| Gastos | `GET/POST /expenses`; `GET/PATCH/DELETE /expenses/{id}`; `GET /spaces/{id}/expenses` |
| Ingresos | `GET/POST /incomes`; `GET/PATCH/DELETE /incomes/{id}`; `GET /spaces/{id}/incomes` |
| Balances | `GET /spaces/{id}/balance?month=YYYY-MM`; `GET /spaces/{id}/summary?month=YYYY-MM` |
| Liquidaciones | `POST/GET /spaces/{id}/settlements`; `GET /settlements/{id}` |
| Sistema | `GET /health`; `GET /api-docs` |

Listados de gastos/ingresos globales requieren `spaceId` y `month`; los del
espacio requieren `month`. Los gastos admiten `kind` y `categoryId`.
Los PATCH de movimientos y categorías esperan todos los campos editables;
PATCH de espacios acepta nombre y/o método. Las escrituras devuelven el documento
en `{expense}`, `{income}`, `{category}`, `{space}` o `{settlement}`.
Las lecturas mensuales se adaptan a los contratos `ExpenseMonth`, `IncomeMonth`,
`BalanceMonth` y `DashboardSummary` del frontend.

Ejemplo crear gasto (después de login, con cookie y token CSRF):

```http
POST /api/v1/expenses
Origin: http://localhost:5173
Content-Type: application/json
X-CSRF-Token: <token de la sesión>

{"spaceId":"<ObjectId>","description":"Supermercado","amountCents":8000,"date":"2026-11-03","categoryId":"<ObjectId>","kind":"shared"}
```

Devuelve 201 y `{"expense":{"_id":"…","amountCents":8000,"ownerBasisPoints":5000,…}}`.
Los privados ajenos devuelven 404, no un documento parcialmente oculto.
Liquidar: `POST /spaces/{id}/settlements` con
`{"amountCents":1000,"date":"2026-11-03","note":"Bizum"}`.

Errores: `{"error":{"code":"invalid_input","message":"Revisa los campos enviados.","fields":["amountCents"]}}`.
400 validación, 401 sesión, 403 permisos/origen/CSRF, 404 recurso no visible,
409 conflicto/regla de negocio, 415 formato, 422 acumulado inseguro, 429 límite,
500 error interno. No se incluyen detalles internos, contraseñas ni tokens.

## Configuración privada y arranque

```powershell
pnpm install --frozen-lockfile
Copy-Item apps\api\.env.example apps\api\.env
# Edita apps\api\.env con la URI privada NUEVA de desarrollo y SEED_PASSWORD.
pnpm run backend:build
pnpm run backend:seed
pnpm run backend:dev
# En otra terminal:
$env:VITE_DATA_MODE='api'
pnpm run dev
```

Frontend: `http://localhost:5173`; API: `http://127.0.0.1:3001/api/v1`.
Vite proxifica `/api` al backend. Producción necesita un reverse proxy equivalente.
No se deben servir páginas HTML como fallback para rutas `/api`.

| Variable en `apps/api/.env` | Uso |
| --- | --- |
| `NODE_ENV` | `development` o `test`; producción sigue bloqueada |
| `MONGODB_URI` | Única URI MongoDB usada por servidor/seed de desarrollo |
| `MONGODB_DATABASE` | `duobalance_dev` (o sufijo); tests solo `duobalance_test_<uuid>` |
| `FRONTEND_ORIGIN` | Origen exacto sin barra final; por defecto de ejemplo `http://localhost:5173` |
| `HOST`, `PORT` | Por defecto 127.0.0.1 y 3001 |
| `MAIL_DIRECTORY` | Buzón local ignorado por Git, `.local-mail` |
| `SEED_PASSWORD` | Contraseña ficticia elegida localmente; Argon2id al almacenar |

El servidor/seed no leen `.env.local` de la raíz. No colocar valores privados en
`.env.example`, que es una plantilla versionable, ni usar prefijo `VITE_`.
La plantilla se ha limpiado de credenciales. Cualquier credencial expuesta debe
rotarse antes de usarla. Se valida configuración sin imprimir sus valores.
MongoDB requiere replica set para transacciones (Atlas lo proporciona).

## Seed idempotente

Fuente única `../../shared/mockData.json`, también utilizada por los mocks de usuarios
y movimientos. Se conservan los seis usuarios actuales sin apellidos:

| Nombre | Correo | Escenario |
| --- | --- | --- |
| Isabel | nuevo@duobalance.test | Sin espacio |
| Juan | solo@duobalance.test | Piso Centro, un miembro |
| Rocío | rocio@duobalance.test | Casa, creadora |
| Pablo | pablo@duobalance.test | Casa, invitado |
| Maria | ines@duobalance.test | Disponible |
| Curro | mateo@duobalance.test | Disponible |

En una base vacía: 6 usuarios, 2 espacios, 7 categorías, 14 gastos, 6 ingresos,
1 liquidación histórica. Invitaciones está vacía como en el mock original:
se crea su colección/índices, no se inventan invitaciones aceptadas.
Los balances se calculan al consultar. `sessions` solo contiene sesiones reales.

Se usan IDs y claves seed deterministas e inserciones `$setOnInsert`. Repetir
el seed no duplica ni modifica documentos existentes o sus contraseñas.
Un conflicto con cuentas/categorías ajenas al seed bloquea la carga, no sobrescribe.
La transacción revierte los inserts si hay un conflicto. Nunca borra datos.
Al cambiar de mes añade los meses que aún no existan, como los datos móviles del mock.
El comando CLI solo permite `development` y una base `duobalance_dev…`.
No ejecutar el seed sobre datos reales aunque la base tenga ese nombre.
Ana/Luis son escenarios únicos por test, no cuentas seed mutables compartidas.

## Seguridad y correo

Contraseñas Argon2id (64 MiB, tres iteraciones); tokens SHA-256, aleatorios y de
un uso. Cookie HttpOnly, SameSite=Lax, sin Domain, ruta `/api/v1`, siete días;
Secure con origen HTTPS. Sesiones comprobadas en cada petición y revocadas al
logout; cambiar contraseña invalida todas por versión de autenticación.
El índice TTL no sustituye la comprobación explícita de expiración.

Mutaciones exigen Origin exacto y JSON; las autenticadas, `X-CSRF-Token`.
`GET /auth/csrf` rota el token para restaurar el frontend al recargar.
Los límites se aplican por IP. En test se amplía solo el cupo para cuentas
aisladas; desarrollo conserva sus límites. CORS restringido y Helmet.
Los errores internos se notifican sin imprimir datos sensibles.

El adaptador de correo de desarrollo escribe JSON con enlaces reales al frontend
en `.local-mail`. **Contiene tokens temporales**: no publicarlo ni adjuntarlo.
Los fallos de escritura producen error; se puede reenviar la confirmación.
La confirmación no inicia sesión automáticamente: redirige al login.

Producción permanece bloqueada hasta integrar SMTP real, HTTPS/proxy, almacén
distribuido de rate limiting, backups y validar la operación.
Las categorías personales tienen API, pero no se ha inventado una pantalla nueva
de gestión fuera de los diseños existentes.

## Tests y CI

La QA de aplicación vive en un framework separado. Aquí pueden añadirse
pruebas de desarrollador, como unitarias de reglas puras, cuando sean necesarias;
actualmente no hay un runner de unitarias de aplicación declarado.
El tooling arquitectónico dispone de pruebas con `node:test`.

## Verificación y límites

Ejecutar los builds, lint y checks de arquitectura existentes según el alcance
autorizado. Compilar no certifica Atlas ni sustituye comprobar el comportamiento.
La carga de desarrollo requiere un `apps/api/.env` real y configuración privada.
No conectar ni ejecutar seeds contra bases reales sin autorización.
