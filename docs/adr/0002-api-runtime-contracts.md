# ADR 0002: contratos runtime del cliente API

Estado: aceptado para el MVP de desarrollo.

## Contexto

Los servicios web consumen documentos MongoDB y respuestas adaptadas a UI.
Los tipos estáticos no validan JSON, ni detectan un fallback HTML del proxy.
Compartir modelos privados del servidor rompería la frontera web/API.

## Decisión

Usar Zod en `apps/web/src/services/api/contracts.ts` para validar los campos
realmente consumidos por los servicios. El transporte exige un decoder por
llamada, conserva errores HTTP estándar y sanea fallos de formato. Los campos
adicionales se descartan; no se pretende certificar toda la semántica del backend.

Mantener el mapeo de categorías, permisos e identidad en el servicio de la feature.
Compartir la adquisición CSRF y permitir un único reintento del rechazo explícito
del middleware, nunca de conflictos financieros o errores de red.

Usar `node:test` con `tsx` para unitarias en `apps/web/tests`, fuera del bundle.
Las unitarias del conector usan Mongoose simulado en `apps/api/tests`.
No duplicar la QA externa ni conectar servicios reales desde estos tests.
Inventariar también esas fuentes y mantener la prohibición de Node en el navegador.
Las fuentes de aplicación y demo no pueden importar esos directorios de pruebas.

## Consecuencias

Una modificación de respuesta requiere revisar el esquema y sus consumidores.
Zod añade coste al bundle; no se añaden runners de componentes ni capas genéricas.
Las unitarias no verifican persistencia, transacciones ni conectividad Atlas.
Servidor, seed y diagnóstico comparten una comprobación explícita de topología
MongoDB compatible con transacciones; los secretos permanecen fuera de Git.
