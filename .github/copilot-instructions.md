# DuoBalance — Instrucciones para GitHub Copilot

## Contexto del proyecto
DuoBalance es una PWA para gestionar gastos compartidos entre dos personas, desarrollada bajo la marca Órbita Nexo.

Tecnologías: React, TypeScript, Vite, Tailwind CSS v4. Próximamente: React Router, Supabase, Vitest y Playwright.

Colores:
- Navy: #0B2038
- Mint: #47DDB9
- Ice: #EAF6FA

Toda la interfaz debe estar en español de España.

## Arquitectura
- Utilizar TypeScript con tipado estricto.
- Separar páginas, componentes, rutas, lógica de negocio y servicios.
- Crear componentes reutilizables.
- Evitar código duplicado y dependencias innecesarias.
- Respetar los diseños y requisitos aprobados en Confluence.
- No implementar funcionalidades fuera del MVP.
- Nunca incluir credenciales ni secretos en el repositorio.

## Accesibilidad y Playwright

Toda la aplicación debe desarrollarse siguiendo los principios Accessibility First y Testability First.

### HTML semántico
- Utilizar button para acciones y enlaces para navegación.
- Utilizar correctamente main, nav, header, form y table.
- Todos los inputs deben tener labels visibles y asociados.
- Los botones con iconos deben tener nombres accesibles.
- Utilizar aria-current="page" en navegación activa.
- Asociar errores a campos mediante aria-describedby y aria-invalid.
- Utilizar role="alert" para errores importantes y role="status" para mensajes informativos.
- Los diálogos deben gestionar correctamente el foco y el teclado.
- Mantener contraste suficiente y foco visible.

### Localizadores Playwright
Priorizar:
1. getByRole()
2. getByLabel()
3. getByPlaceholder()
4. getByText()
5. getByTestId() únicamente cuando sea necesario.

Evitar:
- XPath.
- Selectores basados en clases CSS o Tailwind.
- Índices y posiciones del DOM.
- Identificadores dinámicos.
- data-testid innecesarios.

Ejemplo:

```typescript
await page.getByLabel('Correo electrónico').fill('test@example.com')

await page.getByRole('button', {
  name: 'Iniciar sesión'
}).click()

await expect(
  page.getByRole('heading', { name: 'Dashboard' })
).toBeVisible()
```

### Aserciones
Utilizar aserciones web-first:
- toBeVisible()
- toHaveText()
- toHaveURL()
- toBeEnabled()
- toHaveValue()

Evitar waitForTimeout() y comprobaciones genéricas como toBeTruthy() para validar elementos de interfaz.

## Formularios
- Mostrar validaciones claras y accesibles.
- Evitar envíos duplicados.
- Gestionar estados de carga, éxito y error.
- Permitir navegación por teclado.
- Confirmar las operaciones destructivas.
- Mantener nombres accesibles consistentes.

## Reglas funcionales del MVP
- Máximo dos miembros por espacio.
- Reparto global 50/50 o proporcional a ingresos.
- Conservar el reparto histórico de gastos existentes.
- Los gastos individuales son privados y no afectan al balance.
- Cada usuario gestiona únicamente sus ingresos.
- Los gastos compartidos pueden consultarlos ambos, pero solo su creador puede modificarlos o eliminarlos.
- Las liquidaciones son manuales, pueden ser parciales y no deben superar la deuda pendiente.
- Conservar el historial de liquidaciones al corregir gastos.
- Permitir consultar meses anteriores.
- Utilizar céntimos enteros para los cálculos monetarios.
- No inventar decisiones de negocio pendientes.

## Estrategia de testing
- Vitest para pruebas unitarias.
- Playwright Test con TypeScript para E2E y API.
- Tests aislados, repetibles y sin datos reales.
- Utilizar fixtures y Page Object Model cuando aporten valor.
- Comprobar permisos, privacidad, repartos, liquidaciones y cálculos.
- Preparar integración con GitHub Actions.
- Aplicar las restricciones de seguridad también en Supabase, no solo en la interfaz.

## Definition of Done
Antes de finalizar cualquier desarrollo:
1. Comprobar accesibilidad y HTML semántico.
2. Verificar que los elementos pueden localizarse con Playwright.
3. Añadir o actualizar los tests correspondientes.
4. Ejecutar npm run build.
5. Corregir errores de compilación.
6. Resumir los archivos modificados y las pruebas ejecutadas.
