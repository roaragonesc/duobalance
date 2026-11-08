# ADR 0001: Límites de los workspaces

- Estado: Aceptado
- Fecha: 2026-11-08

## Contexto

DuoBalance mantiene una aplicación React/Vite y una API Express/MongoDB con
ciclos de ejecución y necesidades de seguridad diferentes. Compartir un
repositorio no debe mezclar lógica del navegador con persistencia o secretos.

## Decisión

Separar el código ejecutable en `apps/web` y `apps/api`, gestionados como
workspaces pnpm. Compartir únicamente contratos públicos en `packages/`.
Conservar los tests de QA en su framework externo y los fixtures ficticios en
`shared/`.

## Consecuencias

- Cada aplicación tiene manifiesto, configuración y compilación propias.
- La raíz ofrece comandos coordinadores y CI verifica ambos proyectos.
- Los imports entre aplicaciones están prohibidos, también por nombre de paquete.
  `scripts/checkArchitecture.ts` delega en el análisis AST de
  `scripts/architecture.ts`; los paquetes solo exponen contratos públicos seguros.
- El gobierno conserva un propietario por responsabilidad y contratos de
  asignación/entrega: Fullstack coordina, React y Node implementan archivos
  disjuntos y el revisor solo lee. No se duplican suites QA externas.
- El inventario sincroniza fuentes, exports y consumidores en el mismo cambio.
  Ciclos y límites documentados se comprueban dentro del alcance del validador;
  autorización y semántica de negocio siguen requiriendo revisión.
- No se cambia Express, React ni la persistencia por adoptar esta estructura.
