# Parte 2. Diseño de casos de prueba — DuoBalance

## Enfoque

Se diseñan casos de prueba funcionales de interfaz web (E2E) para DuoBalance, una aplicación de finanzas en pareja. El objetivo es comprobar que las personas pueden registrarse, iniciar sesión, crear un espacio compartido, vincular a su pareja y gestionar gastos respetando la visibilidad de cada usuario.

- **Pruebas de datos válidos e inválidos:** cubren registro, acceso y formularios con entradas correctas y erróneas.
- **Cambio de estado:** verifican el comportamiento antes y después de crear espacios, aceptar invitaciones o añadir y editar gastos.
- **Transiciones de estado y permisos:** comprueban rutas protegidas, cierre de sesión, pertenencia al espacio y privacidad de gastos individuales.
- **Tabla de decisión:** compara el tipo de gasto (común o individual) con el usuario que lo consulta y su efecto sobre el balance compartido.
- **Recorridos E2E completos:** reproducen acciones consecutivas de dos personas en sesiones independientes y comprueban persistencia tras recargar.

Cada caso prepara sus propios datos y no depende de otros. **El entorno previsto es `VITE_DATA_MODE=mock`, sin llamadas a Supabase.** Los dos usuarios deben compartir un almacén mock de datos de negocio, pero mantener sesiones independientes; el `localStorage` aislado de cada navegador no basta para simular ese comportamiento.

Los casos son **especificaciones de pruebas, no evidencia de ejecución**. Las rutas, etiquetas y reglas concretas deberán contrastarse con el código de DuoBalance antes de automatizarlos. Las funcionalidades de gastos, balances y edición pueden estar pendientes de desarrollo.

## Cómo elegimos los datos

- **Usuarios ficticios:** Ana (`ana.e2e@example.test`) y Luis (`luis.e2e@example.test`), con identidades y sesiones independientes.
- **Espacio:** `Hogar E2E`, con dos miembros y reparto 50/50 en los casos que lo requieren.
- **Gasto común de Ana:** `Supermercado E2E`, 80 €, pagado por Ana. En reparto 50/50 corresponde 40 € a cada persona.
- **Gasto individual de Ana:** `Peluquería E2E`, 35 €, visible para Ana, pero no para Luis ni en los balances compartidos.
- **Gasto común de Luis:** `Gasolina E2E`, 40 €, pagado por Luis. En reparto 50/50 corresponde 20 € a cada persona.
- **Datos únicos:** los títulos y correos se generan o aíslan por ejecución para evitar colisiones.

### Tabla de decisión: visibilidad de gastos

| Tipo de gasto | Creado por | Lo ve Ana | Lo ve Luis | Afecta al balance compartido |
|---|---|---|---|---|
| Común | Ana | Sí | Sí | Sí |
| Común | Luis | Sí | Sí | Sí |
| Individual | Ana | Sí | No | No |
| Individual | Luis | No | Sí | No |

> **Regla pendiente de confirmar en producto:** esta tabla presupone que los gastos individuales son estrictamente privados y que el reparto 50/50 se calcula sobre el importe total del gasto común. Si el diseño funcional establece otra regla, se deben ajustar las expectativas antes de automatizar.

## Estado de automatización

| Grupo | Alcance | Estado en este documento |
|---|---|---|
| AUTH-001 a AUTH-007 | Registro, login, recuperación y rutas protegidas | Diseñados; ejecución no verificada |
| ONB-001 a ONB-003 | Creación de espacio e invitación | Diseñados; ejecución no verificada |
| EXP-001 a EXP-004 | Gastos comunes, individuales y balances | Diseñados; confirmar implementación |
| E2E-001 a E2E-005 | Recorridos completos con dos usuarios | Diseñados; confirmar implementación |

No se marca ningún caso como **PASS** ni se afirma que esté automatizado sin comprobar el repositorio y ejecutar Playwright.

## Casos

| ID | Regla / funcionalidad | Técnica | Precondiciones | Datos de entrada | Resultado esperado | Prioridad | Nivel | Automatizado |
|---|---|---|---|---|---|---|---|---|
| AUTH-001 | Inicio de sesión | Datos válidos | Usuario mock existente | Correo y contraseña válidos | Se autentica y accede a su ruta correspondiente | Alta | UI | No verificado |
| AUTH-002 | Inicio de sesión | Datos inválidos | Usuario mock existente | Contraseña incorrecta | Error visible, sin sesión | Alta | UI | No verificado |
| AUTH-003 | Validación de login | Campos obligatorios | Sin sesión | Correo y contraseña vacíos | Se muestran errores y no se inicia sesión | Alta | UI | No verificado |
| AUTH-004 | Registro | Datos válidos | Correo no registrado | Nombre, correo y contraseña válidos | Se crea la cuenta mock y continúa el flujo previsto | Alta | UI | No verificado |
| AUTH-005 | Registro | Datos inválidos | Sin sesión | Contraseñas distintas | Se rechaza el formulario sin crear cuenta | Alta | UI | No verificado |
| AUTH-006 | Recuperación de contraseña | Cambio de estado | Usuario mock existente | Correo registrado | Se muestra confirmación simulada sin enviar correo real | Media | UI | No verificado |
| AUTH-007 | Rutas protegidas | Permisos | Sin sesión | URL privada | Redirección al login sin mostrar datos privados | Alta | UI | No verificado |
| ONB-001 | Crear espacio | Datos válidos | Ana sin espacio | Hogar E2E | Se crea un espacio asociado a Ana y persiste | Alta | UI | No verificado |
| ONB-002 | Invitación de pareja | Transición de estado | Ana con espacio; Luis sin espacio | Invitación a Luis | Luis acepta y ambos pertenecen al mismo espacio | Alta | UI | No verificado |
| ONB-003 | Límite de miembros | Valores límite y permisos | Espacio con dos miembros | Intento de añadir un tercero | No se permite incorporar un tercer miembro | Alta | UI | No verificado |
| EXP-001 | Gasto común | Visibilidad compartida | Ana y Luis en un espacio | Supermercado, 80 € | Ambos ven el mismo gasto, sin duplicados | Alta | UI | No verificado |
| EXP-002 | Gasto individual | Privacidad | Ana y Luis en un espacio | Peluquería, 35 € | Ana lo ve; Luis no lo ve; no afecta al balance común | Crítica | UI | No verificado |
| EXP-003 | Balance compartido | Cálculo y tabla de decisión | Reparto 50/50 | Ana paga 80 €; Luis paga 40 € | El saldo neto es de 20 € a favor de Ana, si esa es la regla del producto | Alta | UI | No verificado |
| EXP-004 | Edición de gasto | Cambio de estado | Gasto común existente | Cambiar 80 € a 100 € | El cambio es visible para ambos y actualiza el balance | Media | UI | No verificado |
| E2E-001 | Onboarding completo | Recorrido E2E | Entorno mock limpio | Dos usuarios y una invitación | Ambos quedan vinculados al mismo espacio | Alta | UI | No verificado |
| E2E-002 | Gasto común entre usuarios | Recorrido E2E | Espacio con dos miembros | Gasto común de 80 € | Se consulta desde dos sesiones independientes | Crítica | UI | No verificado |
| E2E-003 | Privacidad de gasto individual | Recorrido E2E | Espacio con dos miembros | Gasto individual de 35 € | Solo su propietario puede verlo | Crítica | UI | No verificado |
| E2E-004 | Gestión financiera completa | Recorrido E2E y persistencia | Dos usuarios en un espacio | Dos gastos comunes y uno privado | Visibilidad, cálculos y persistencia correctos | Crítica | UI | No verificado |
| E2E-005 | Permisos de edición | Control de acceso | Gasto creado por Ana | Luis intenta editarlo | Se aplica la política de permisos definida | Alta | UI | No verificado |

## Casos detallados

### AUTH-001. Iniciar sesión con credenciales válidas

**Por qué elegimos este caso:** el inicio de sesión es la puerta de entrada al resto de funcionalidades.

**Qué nos permite comprobar:** que la identidad mock se reconoce y la navegación posterior corresponde al estado del usuario.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir la pantalla de login sin sesión previa. | Se muestra el formulario de acceso. |
| 2 | Introducir correo y contraseña válidos de Ana. | Los campos aceptan los datos. |
| 3 | Pulsar «Iniciar sesión». | Se inicia sesión y se abre onboarding o la pantalla principal, según el estado de Ana. |
| 4 | Recargar la página. | La sesión continúa activa. |
| 5 | Cerrar sesión. | Vuelve al login y deja de mostrarse el contenido privado. |

### AUTH-002. Rechazar credenciales incorrectas

**Por qué elegimos este caso:** una contraseña incorrecta no debe permitir acceder a datos financieros.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir login sin sesión. | Se muestra el formulario. |
| 2 | Introducir un correo mock válido y una contraseña incorrecta. | Los campos contienen los valores introducidos. |
| 3 | Pulsar «Iniciar sesión». | Se muestra un mensaje de error comprensible. |
| 4 | Intentar abrir una ruta privada. | Se redirige al login; no se muestran datos. |

### AUTH-003. Validar campos obligatorios del login

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir login y dejar los campos vacíos. | El formulario está disponible. |
| 2 | Pulsar «Iniciar sesión». | Se identifican los campos obligatorios; no hay sesión. |
| 3 | Introducir solo el correo y volver a enviar. | Se señala la contraseña pendiente. |
| 4 | Completar la contraseña válida y enviar. | El usuario puede continuar sin quedar bloqueado por los errores anteriores. |

### AUTH-004. Registrar un usuario nuevo

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir registro sin sesión. | Se muestra el formulario. |
| 2 | Completar nombre, correo único y contraseña válida. | Los datos cumplen las validaciones. |
| 3 | Confirmar el registro. | Se crea el usuario en el almacén mock. |
| 4 | Continuar por el flujo de confirmación simulada, si existe. | Se completa sin enviar correo real. |
| 5 | Iniciar sesión con el nuevo usuario. | Se reconoce la cuenta recién creada. |

### AUTH-005. Rechazar contraseñas distintas

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir registro y completar los datos obligatorios. | El formulario contiene datos válidos salvo la confirmación. |
| 2 | Escribir una contraseña diferente en la confirmación. | Los valores no coinciden. |
| 3 | Enviar el formulario. | Aparece un aviso y no se crea la cuenta. |
| 4 | Corregir la confirmación y reenviar. | El formulario permite continuar. |

### AUTH-006. Recuperar contraseña en modo mock

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir «¿Has olvidado tu contraseña?». | Se muestra la pantalla de recuperación. |
| 2 | Introducir el correo de un usuario mock. | Se acepta el formato válido. |
| 3 | Solicitar recuperación. | Se muestra la confirmación simulada; no se envía correo real. |
| 4 | Completar el flujo mock de restablecimiento, si está implementado. | La contraseña nueva permite iniciar sesión y la anterior deja de servir. |

### AUTH-007. Impedir el acceso sin sesión

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir una URL privada en un contexto sin sesión. | Se redirige al login. |
| 2 | Iniciar sesión y abrir esa misma URL. | Se accede si el usuario tiene permisos. |
| 3 | Cerrar sesión y pulsar «Atrás». | No se muestran datos privados. |
| 4 | Abrir directamente la URL privada de nuevo. | Se exige autenticación. |

### ONB-001. Crear un espacio compartido

**Por qué elegimos este caso:** el espacio es la entidad que agrupa los datos financieros de la pareja.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Preparar a Ana autenticada y sin espacio. | Aparece el onboarding de creación. |
| 2 | Introducir `Hogar E2E` y completar los campos requeridos. | El formulario admite los datos. |
| 3 | Crear el espacio. | Se crea un único espacio asociado a Ana. |
| 4 | Recargar la pantalla. | Se mantiene el mismo espacio. |
| 5 | Intentar crear otro espacio con la misma cuenta. | La aplicación impide tener dos espacios si esa es la regla implementada. |

### ONB-002. Invitar y vincular a la pareja

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Iniciar sesión como Ana y crear un espacio propio. | Ana figura como miembro. |
| 2 | Invitar a `luis.e2e@example.test`. | Se genera una invitación mock válida. |
| 3 | Abrir otro BrowserContext e iniciar sesión como Luis. | La sesión de Luis es independiente de la de Ana. |
| 4 | Aceptar la invitación desde Luis. | Luis se incorpora al mismo espacio. |
| 5 | Consultar el espacio desde ambas sesiones. | Ambos ven el mismo espacio y sus dos miembros. |
| 6 | Recargar ambas sesiones. | La pertenencia se conserva. |

### ONB-003. Rechazar un tercer miembro

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Preparar un espacio con Ana y Luis. | El espacio tiene dos miembros. |
| 2 | Intentar generar o aceptar una invitación para un tercero. | Se rechaza la incorporación según las reglas del producto. |
| 3 | Volver a consultar el espacio. | Continúa teniendo exactamente dos miembros. |

### EXP-001. Crear gasto común y comprobarlo desde ambas cuentas

**Por qué elegimos este caso:** que el segundo miembro pueda consultar el gasto es una funcionalidad central; comprobarlo solo desde quien lo crea sería insuficiente.

**Datos:** `Supermercado E2E`, 80 €, común, pagado por Ana, reparto 50/50.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Preparar un espacio con Ana y Luis y abrir la sesión de Ana. | Ana accede a los gastos del espacio. |
| 2 | Crear el gasto común de 80 €. | Se guarda correctamente y aparece una vez para Ana. |
| 3 | Abrir un segundo BrowserContext con Luis. | Luis tiene su propia sesión. |
| 4 | Abrir el listado de gastos comunes desde Luis. | Aparece `Supermercado E2E` una sola vez, con importe 80 €. |
| 5 | Consultar el detalle desde Luis. | Coinciden concepto, importe, tipo, pagador y reparto. |
| 6 | Recargar ambas vistas. | El gasto persiste y sigue siendo visible para ambos. |

### EXP-002. Crear gasto individual y comprobar su privacidad

**Por qué elegimos este caso:** protege la separación entre los gastos privados y los gastos que se comparten con la pareja.

**Datos:** `Peluquería E2E`, 35 €, individual, propiedad de Ana.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Preparar a Ana y Luis en un mismo espacio. | Ambos pueden acceder a sus cuentas. |
| 2 | Ana crea el gasto individual de 35 €. | El gasto se guarda para Ana. |
| 3 | Ana abre su listado de gastos personales. | Aparece `Peluquería E2E` con 35 €. |
| 4 | Luis abre su sesión independiente y consulta sus gastos. | No aparece `Peluquería E2E`. |
| 5 | Luis utiliza búsqueda, filtros y resúmenes disponibles. | El gasto privado de Ana no se revela en ninguna de esas vistas. |
| 6 | Luis consulta el balance compartido. | El gasto individual no altera el balance. |
| 7 | Ana recarga su vista. | El gasto privado sigue disponible para Ana. |

### EXP-003. Comprobar el balance de dos gastos comunes

**Datos:** Ana paga 80 € y Luis paga 40 €, ambos gastos comunes al 50/50.

**Cálculo esperado bajo esa regla:** a Ana le corresponden 40 € de su gasto y 20 € del gasto de Luis; a Luis le corresponden 40 € del gasto de Ana y 20 € del suyo. Por tanto, **Luis debe 20 € netos a Ana**.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Preparar dos miembros y reparto 50/50. | El espacio tiene la configuración prevista. |
| 2 | Ana crea un gasto común de 80 € pagado por Ana. | Se registra una obligación de 40 € de Luis hacia Ana. |
| 3 | Luis crea un gasto común de 40 € pagado por Luis. | Se registra una obligación de 20 € de Ana hacia Luis. |
| 4 | Abrir el balance desde Ana. | Se muestra un saldo neto de 20 € a favor de Ana. |
| 5 | Abrir el balance desde Luis. | Se muestra el mismo saldo desde la perspectiva de Luis: debe 20 €. |
| 6 | Recargar ambos balances. | Se conserva el cálculo sin duplicar operaciones. |

### EXP-004. Modificar un gasto común

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Ana crea un gasto común de 80 €. | Ambos usuarios pueden consultarlo. |
| 2 | Ana modifica el importe a 100 €, si tiene permiso para editar. | El cambio se guarda. |
| 3 | Luis vuelve a consultar el gasto. | Se muestra 100 €, no 80 €. |
| 4 | Consultar los balances de ambos. | Se recalculan conforme a la nueva cantidad. |
| 5 | Recargar las vistas. | El importe actualizado persiste. |

### E2E-001. Recorrido completo de registro, creación de espacio e invitación

**Por qué elegimos este caso:** reproduce el proceso que debe completar una pareja antes de utilizar DuoBalance conjuntamente.

**Preparación:** entorno mock limpio, dos correos ficticios únicos y dos BrowserContexts independientes.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir la web sin sesión y registrar a Ana. | La cuenta mock se crea correctamente. |
| 2 | Completar la confirmación simulada si existe e iniciar sesión como Ana. | Se abre el onboarding. |
| 3 | Crear el espacio `Hogar E2E`. | Ana queda asociada al espacio. |
| 4 | Abrir la sección de invitaciones e introducir el correo de Luis. | Se crea una invitación mock. |
| 5 | Abrir otro contexto de navegador y registrar a Luis. | Luis tiene su propia identidad y sesión. |
| 6 | Aceptar desde Luis la invitación al espacio de Ana. | Luis se incorpora a `Hogar E2E`. |
| 7 | Consultar el espacio desde Ana y desde Luis. | Ambos ven el mismo espacio con dos miembros. |
| 8 | Recargar ambos navegadores. | La vinculación permanece. |
| 9 | Intentar añadir un tercer usuario. | Se respeta el límite de dos miembros. |
| 10 | Cerrar ambas sesiones y abrir rutas privadas. | Se exige volver a iniciar sesión. |

### E2E-002. Un usuario crea un gasto común y el otro lo consulta

**Preparación:** Ana y Luis ya pertenecen al mismo espacio mock, con sesiones independientes.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Iniciar sesión como Ana. | Se abre su espacio. |
| 2 | Acceder a la creación de gastos. | Se muestra el formulario. |
| 3 | Introducir `Supermercado E2E`, 80 €, tipo común y pagador Ana. | El formulario refleja los datos. |
| 4 | Guardar el gasto. | Aparece una vez en el listado de Ana. |
| 5 | Abrir la sesión de Luis en otro BrowserContext. | Luis accede al mismo espacio. |
| 6 | Consultar los gastos comunes. | Aparece `Supermercado E2E` con 80 €. |
| 7 | Abrir el detalle del gasto. | Los datos coinciden con los introducidos por Ana. |
| 8 | Comprobar el reparto 50/50 si está implementado. | Se atribuyen 40 € a cada miembro. |
| 9 | Recargar ambas sesiones. | El gasto continúa visible, sin duplicados. |

### E2E-003. Un usuario crea un gasto individual que el otro no puede ver

**Preparación:** Ana y Luis pertenecen al mismo espacio.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Iniciar sesión como Ana. | Accede a su espacio. |
| 2 | Crear `Peluquería E2E`, 35 €, como gasto individual. | El gasto se guarda para Ana. |
| 3 | Consultar los gastos individuales de Ana. | Aparece el gasto con su importe correcto. |
| 4 | Iniciar sesión como Luis en otro contexto. | Luis accede con su propia identidad. |
| 5 | Consultar gastos individuales, gastos comunes y búsquedas. | No aparece el gasto privado de Ana. |
| 6 | Comprobar el balance compartido. | Los 35 € no modifican el saldo compartido. |
| 7 | Volver a Ana y recargar. | El gasto sigue existiendo para su propietaria. |
| 8 | Si existe acceso a detalle por URL, intentar abrirlo desde Luis. | Se deniega el acceso y no se revela la información privada. |

### E2E-004. Recorrido financiero completo con dos usuarios

**Por qué elegimos este caso:** valida conjuntamente los recorridos más importantes de DuoBalance: identidad, gastos comunes, privacidad, reparto y persistencia. Es el caso E2E principal de la suite.

**Datos:** Ana paga supermercado común de 80 €; Ana registra peluquería individual de 35 €; Luis paga gasolina común de 40 €. Reparto 50/50 para los gastos comunes.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Preparar a Ana y Luis vinculados a `Hogar E2E`. | Comparten espacio, pero no sesión. |
| 2 | Iniciar sesión como Ana desde el navegador A. | Se muestra el espacio correcto. |
| 3 | Crear `Supermercado E2E`, 80 €, común, pagado por Ana. | El gasto se guarda y aparece para Ana. |
| 4 | Crear `Peluquería E2E`, 35 €, individual, de Ana. | El gasto aparece únicamente en sus vistas personales. |
| 5 | Comprobar los gastos de Ana. | Puede consultar el supermercado y su gasto privado en sus secciones correspondientes. |
| 6 | Iniciar sesión como Luis desde el navegador B. | Luis accede al mismo espacio con una sesión independiente. |
| 7 | Consultar los gastos comunes desde Luis. | Aparece el supermercado de 80 €. |
| 8 | Consultar las vistas personales y búsquedas de Luis. | No aparece `Peluquería E2E`. |
| 9 | Crear desde Luis `Gasolina E2E`, 40 €, común, pagado por Luis. | El gasto se guarda correctamente. |
| 10 | Volver a Ana y actualizar la vista. | Ana ve los dos gastos comunes y conserva su gasto individual. |
| 11 | Volver a Luis y actualizar la vista. | Luis ve los dos comunes, pero no el gasto individual de Ana. |
| 12 | Consultar el balance desde Ana. | Si se aplica reparto 50/50, Ana tiene 20 € netos a su favor. |
| 13 | Consultar el balance desde Luis. | Si se aplica reparto 50/50, Luis debe 20 € netos a Ana. |
| 14 | Recargar ambos navegadores. | Gastos y saldos persisten sin duplicarse. |
| 15 | Cerrar la sesión de Luis e intentar abrir una URL privada. | No puede consultar información financiera sin iniciar sesión. |
| 16 | Mantener la sesión de Ana y consultar sus gastos. | El cierre de sesión de Luis no afecta a Ana. |

### E2E-005. Respetar permisos de edición y acceso a gastos

**Regla pendiente de confirmación:** este caso asume que quien no es propietario de un gasto individual nunca puede verlo ni modificarlo, y que los permisos de edición de gastos comunes están definidos explícitamente en el producto.

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Ana crea un gasto individual y otro común. | Ambos quedan asociados a sus tipos y propietario. |
| 2 | Luis abre sus listados. | Solo encuentra el gasto común. |
| 3 | Luis intenta acceder por URL al gasto individual de Ana, si hay ruta de detalle. | Acceso denegado sin revelar el gasto. |
| 4 | Luis consulta el gasto común. | Puede verlo. |
| 5 | Luis intenta editar el gasto común. | La aplicación permite o rechaza la acción conforme a la política de edición documentada. |
| 6 | Consultar el gasto desde Ana. | No hay modificaciones no autorizadas. |
| 7 | Recargar ambos navegadores. | Los permisos y el estado se mantienen. |

## Criterios para automatizar con Playwright

1. Cada fila de los recorridos detallados puede convertirse en un `test.step()` con un título que indique acción y resultado esperado.
2. Los Page Objects deben exponer acciones y localizadores; las aserciones `await expect(...)` deben permanecer visibles en los specs.
3. Priorizar `getByRole()` y `getByLabel()`, sin depender de XPath, esperas fijas o selectores frágiles.
4. Utilizar dos `BrowserContext` independientes para los recorridos de pareja.
5. Preparar y restablecer los datos mock por caso, sin depender del orden de ejecución.
6. Evitar que los datos de negocio mock se limiten al `localStorage` de un solo navegador; debe existir un mecanismo compartido y aislado por prueba.
7. Comprobar la ausencia de gastos privados tanto en listados como en detalles, filtros y resúmenes disponibles; no confundir ocultar un botón con proteger los datos.
8. No utilizar `test.fail()` ni `test.skip()` para declarar como superadas funcionalidades que todavía no existen. Para escenarios pendientes de implementación, documentarlos y, si se incorporan al código, marcarlos explícitamente con `test.fixme()` y una razón verificable.
9. No ejecutar ni modificar Supabase durante las pruebas mock.
10. Informar por separado de casos **diseñados**, **automatizados**, **ejecutados** y **superados**.

## Validación y límites

Este documento se ha elaborado como **plan de pruebas** tomando como referencia el formato de casos proporcionado. **No se ha inspeccionado el código actual de DuoBalance ni ejecutado Playwright** para elaborar este archivo. Por ello, no se atribuyen resultados reales a ningún caso y las reglas de privacidad, reparto, rutas y edición deben verificarse frente a la especificación funcional y la implementación antes de convertirlas en aserciones automatizadas.
