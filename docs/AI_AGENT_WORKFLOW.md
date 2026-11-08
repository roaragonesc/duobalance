# Procedimiento de trabajo con agentes

**Entender → Planificar → Implementar → Verificar → Corregir → Reportar.**

## 1. Entender

Consultar [el inventario](COMPONENT_INVENTORY.md), [la arquitectura](ARCHITECTURE.md),
[README](../README.md) y las instrucciones aplicables. Identificar el propietario,
exports públicos, consumidores, contratos, datos y pruebas de desarrollador
existentes. Comprobar el comportamiento real antes de proponer cambios.
El bloque generado cubre las fuentes documentadas; las tablas manuales explican
responsabilidades y APIs relevantes. Contrastar ambas partes con el código.

## Equipo y asignación

El equipo fullstack de [AGENTS](../AGENTS.md) utiliza inventario primero,
propietario único, APIs públicas y seis fases con evidencia.

Fullstack es la entrada recomendada. Puede trabajar directamente; delegar no es
una fase obligatoria. React y Node pueden seleccionarse manualmente para tareas
de su área. El revisor no edita ni ejecuta comandos.

Antes de delegar, entregar:

```text
Objetivo y comportamiento esperado:
Fuentes canónicas y propietario existente:
Archivos autorizados para editar:
Fuera de alcance:
APIs/contratos acordados y consumidores:
Dependencias previas / tareas independientes:
Criterios de aceptación:
Comandos autorizados:
Entrega: cambios, contratos, evidencia, inventario, riesgos y estados reales.
```

Asignar archivos disjuntos; el coordinador posee contratos compartidos, tooling
y documentación transversal salvo reasignación explícita. Los especialistas
proponen cambios externos a su asignación y no vuelven a delegar.
Paralelizar solo tareas independientes. No repetir una investigación delegada;
pedir aclaraciones al mismo agente si su entrega es incompleta.

## 2. Planificar

Describir objetivo, alcance, archivos afectados, reutilización, compatibilidad,
riesgos, seguridad y estrategia de verificación. Justificar cada nueva capa o
dependencia frente a una alternativa sencilla.

Solicitar aprobación cuando corresponda. Instalar dependencias, mover o eliminar
archivos y cambiar infraestructura o workflows requiere permiso
explícito. La autorización de un comando no amplía el alcance del desarrollo.

## 3. Implementar

Respetar propietarios y fronteras. Seguir las dependencias reales: modificar
contratos o dominio antes de sus consumidores cuando sea necesario, sin imponer
un orden fijo a cambios independientes.

Actualizar imports, documentación y entradas del inventario en el mismo cambio
al crear, mover, renombrar o eliminar piezas. No inventar entradas ni resultados.
Ejecutar `npm run inventory:update` para regenerar el bloque automático al
cambiar fuentes, imports o exports. Revisar su diff y actualizar el contexto
manual en el mismo cambio.
Preservar cambios ajenos y evitar modificaciones funcionales fuera del alcance.

## 4. Verificar

Ejecutar solo comprobaciones existentes, autorizadas y relevantes. Elegir la
menor selección que cubra el cambio. No ejecutar despliegues o suites completas
por defecto.

| Comprobación actual | Alcance |
| --- | --- |
| `npm run lint:arch` / `pnpm run check:architecture` | Inventario, AST, imports locales, fronteras públicas/capas y ciclos; alcance en arquitectura |
| `npm run inventory:update` | Regenerar tabla de fuentes; modifica el inventario y también devuelve infracciones |
| `npm run test:architecture` | Unitarias positivas/negativas del validador con node:test |
| `npm run typecheck:tooling` | TypeScript estricto del validador y sus pruebas |
| `npm run test:unit` | Unitarias de cliente/servicios HTTP y conector MongoDB con node:test/tsx, sin conexiones externas |
| `npm run typecheck:unit` | TypeScript estricto de las unitarias web/API y consumidores |
| `npm run backend:check` | Conexión, transacciones y categorías; solo con configuración privada y permiso de conexión |
| `pnpm run lint` | Oxlint en web y API |
| `pnpm run build` | TypeScript y compilación web/API |
| `pnpm run build:demo` | TypeScript y bundle mock estático |

No existen comandos generales `typecheck`, `format:check` ni `test` para la
aplicación. `test:architecture` no es QA de producto ni un runner de unitarias UI.
La QA de aplicación reside en el framework externo. Aquí caben pruebas de
desarrollador, como unitarias y tests del tooling, sin duplicar QA.

## 5. Corregir

Buscar la causa raíz en UI, estado, contrato, API, dominio, persistencia, datos
o entorno. No ocultar defectos con mocks engañosos, skips, casts inseguros o
reglas desactivadas. Separar problemas previos de regresiones del cambio.

## 6. Reportar

Entregar archivos afectados, decisiones, inventario actualizado, comandos
ejecutados, riesgos y pendientes. Usar los siguientes estados:

- `PASS`: se ejecutó y cumplió el criterio indicado.
- `FAIL`: se ejecutó y no lo cumplió; aportar diagnóstico.
- `BLOCKED`: un requisito o entorno impidió la comprobación.
- `NOT_RUN`: no se ejecutó; indicar motivo.

Leer un archivo no demuestra que el build, los tests o la accesibilidad pasen.
No hacer commit ni push sin petición expresa.

La entrega de cada especialista incluye archivos editados, API pública afectada,
consumidores, cambios necesarios en inventario/documentación, comandos exactos
y sus resultados, riesgos y bloqueos. El coordinador integra solo cuando las
dependencias necesarias estén resueltas; no convierte una recomendación del
revisor ni una afirmación sin evidencia en `PASS`.

## Compatibilidad de Copilot

Los agentes usan aliases de herramientas `read`, `search`, `edit`, `execute` y
`agent`; solo el coordinador declara delegación y una lista de especialistas.
No fijan modelo ni simulan hooks de bloqueo. La instalación debe admitir estas
capacidades y descubrir los archivos `.agent.md`. Si no ofrece delegación,
seleccionar el agente manualmente o trabajar con Fullstack de forma directa
y reportar la limitación. No asumir que una edición de archivos recarga
automáticamente agentes en una conversación ya iniciada.
