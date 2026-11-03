# Pruebas API

Suite de autenticación, perfiles, espacios, invitaciones, categorías, gastos,
ingresos, balances, liquidaciones y autorización, usando Playwright
`request`/`APIRequestContext`, sin navegador para REST.
`endpoints.spec.ts` contiene TC01_API–TC45_API: un caso independiente para cada
una de las 45 combinaciones endpoint/método HTTP. TC02 compara la lista completa
con OpenAPI para detectar operaciones sin caso, duplicadas o eliminadas.
Los títulos usan `TC01_API_nombreDelTest`, numeración única y camelCase sin tildes.
Las regresiones existentes son TC46–TC57. El seed es TC58 y vive en
`TC58_API_validarSeedIdempotente.spec.ts`.

`npm run test:api` usa la configuración independiente
`test-framework/playwright.api.config.ts`: MongoDB local dedicado en 127.0.0.1:27018,
replica set efímero lanzado automáticamente, base aleatoria por ejecución,
API en 4180 y cuentas únicas. No carga `.env`,
no usa Atlas ni Supabase y elimina únicamente su propia base temporal.
El comando ejecuta cuatro shards secuenciales, con servidor y base nuevos por
shard, para respetar el límite de autenticaciones durante la preparación.
No se amplía ni desactiva el rate limit de la aplicación para pasar los tests.
Los fallos siguen fallando el comando. Al terminar se fusionan HTML y JUnit en
`playwright-report/api/full-suite/` y `test-results/api/junit.xml` de la raíz.
Las trazas de cada shard quedan en `test-results/api/artifacts/shard-N/`.
Las ejecuciones directas sin el runner de shards escriben en las subcarpetas
`api/focused/` para no sobrescribir el informe consolidado.

Desde la raíz:

```powershell
npm run test:api
npm run test:api -- endpoints.spec.ts
npm --prefix test-framework run report:api
```

Para depurar un único caso sin repartirlo en shards:

```powershell
npm --prefix test-framework run test:api:direct -- --grep TC30_API
```

`npm run test:e2e:api` ejecuta la UI real contra API/MongoDB aislado en 4176.
No ejecutar estas dos suites en paralelo: comparten los puertos del entorno.
Véanse
[los contratos y límites del backend](../../backend/README.md).
`npm run test:e2e` conserva exclusivamente los recorridos UI mock existentes.
