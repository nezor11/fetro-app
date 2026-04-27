# Política de privacidad — FetroApp

**Borrador pendiente de validación legal.** Antes de publicar, revisar con DPO de Novicell y, si procede, con asesoría jurídica.

**Última actualización: 2026-04-27.**

---

## 1. Identidad del responsable

El responsable del tratamiento de los datos personales recogidos a través de la aplicación móvil **FetroApp** es:

> **NOVICELL SPAIN, S.L.**  
> *(dirección postal y NIF a completar por Marcelo)*  
> Email de contacto: `dpo@novicell.es` *(verificar buzón real con el equipo de Novicell)*

**FetroApp es un proyecto piloto / I+D del equipo `_labs` de Novicell**, desarrollado dentro del marco del CDS 2026 con fines técnicos de aprendizaje y demostración. No es la app oficial de ninguna otra entidad.

## 2. Naturaleza del proyecto

FetroApp es una aplicación **de pruebas** que consume datos de un backend WordPress de un tercero (Fatro Ibérica) **previa autorización del titular del backend**. El uso de la aplicación se limita a:

- Equipo interno de Novicell para validación técnica.
- Eventuales colaboradores autorizados durante el desarrollo.

**No está pensada para publicación masiva** ni para uso comercial mientras siga en este estado de proyecto piloto. La presencia de esta aplicación en Play Store, si llega, será únicamente en el canal **Internal Testing** o **Closed Testing** con tester whitelisted.

## 3. Datos que recogemos

FetroApp recoge **únicamente los datos estrictamente necesarios** para que el tester registrado pueda probar la funcionalidad:

### 3.1 Datos de identificación y contacto

- Nombre, primer y segundo apellidos
- Dirección de correo electrónico
- Teléfono móvil
- Dirección postal (calle, código postal, provincia, país)
- Empresa o entidad

Estos datos los proporciona voluntariamente el tester al registrarse o al editar su perfil dentro de la aplicación. **No se solicitan datos sensibles** (categorías especiales del RGPD).

### 3.2 Datos de actividad de prueba

Cuando el tester interactúa con las features de la app, se generan registros de:

- Inscripciones a eventos (carreras, formaciones)
- Solicitudes (de merchandising, muestras, etc.)
- Códigos QR escaneados
- Favoritos guardados localmente en el dispositivo

### 3.3 Datos técnicos

- Cookie de sesión (almacenada localmente en el dispositivo, no compartida con terceros).
- En caso de incidencia técnica, podríamos consultar logs de error sin contenido personal asociado.

### 3.4 Datos que NO recogemos

- **No se recogen** datos de geolocalización del dispositivo.
- **No se accede** a contactos, fotografías, micrófono ni a otros datos del dispositivo más allá de la cámara cuando el tester inicia voluntariamente el escaneo de un código QR.
- **No se utilizan** identificadores publicitarios ni se realiza seguimiento publicitario.
- **No se venden** datos a terceros.

## 4. Finalidad del tratamiento

Los datos personales se tratan para las siguientes finalidades:

1. **Gestión de la cuenta** del tester durante el periodo de prueba.
2. **Validación técnica** de las features implementadas en la aplicación.
3. **Comunicación operativa** relacionada con el ciclo de pruebas (no se trata de comunicaciones comerciales).
4. **Cumplimiento de obligaciones legales** que pudieran aplicar.

## 5. Base legal del tratamiento

El tratamiento de los datos se basa en:

- **Consentimiento del interesado** (artículo 6.1.a del RGPD): cualquier persona que se registra en FetroApp acepta participar en este proyecto piloto y consiente el tratamiento.
- **Interés legítimo** (artículo 6.1.f) para el correcto funcionamiento técnico de la aplicación durante las pruebas.

## 6. Almacenamiento y encargados de tratamiento

Los datos introducidos por el usuario se transmiten a un backend WordPress alojado en **SiteGround** (proveedor cumplidor del RGPD, dentro del Espacio Económico Europeo). Ese backend pertenece a Fatro Ibérica S.L., que en este contexto actúa como **encargado del tratamiento técnico** habiendo autorizado a Novicell el uso del mismo durante la fase de pruebas.

Las comunicaciones se realizan **siempre cifradas** mediante HTTPS/TLS. Los datos almacenados en el dispositivo del tester (cookie de sesión, favoritos locales) se guardan en el almacenamiento privado de la aplicación, accesible solo por la propia app.

## 7. Conservación de los datos

- Durante toda la duración del proyecto piloto.
- Tras la baja del tester o el fin del proyecto, los datos se eliminarán o anonimizarán en un plazo máximo de **30 días**, salvo obligación legal de mayor conservación.

## 8. Derechos del tester

De acuerdo con el RGPD, el tester tiene derecho a:

- **Acceder** a sus datos personales.
- **Rectificar** los datos inexactos o incompletos (puede hacerlo directamente desde la pantalla de "Editar perfil" de la app).
- **Suprimir** sus datos personales (derecho al olvido).
- **Limitar** el tratamiento.
- **Portabilidad** de los datos.
- **Oponerse** al tratamiento.
- **Retirar el consentimiento** en cualquier momento.

### 8.1 Cómo ejercer estos derechos

- **Rectificación**: directamente desde la pantalla "Editar perfil" de la app.
- **Baja de cuenta**: desde la pantalla "Dar de baja mi cuenta" del Perfil. Esta operación desactiva inmediatamente el acceso pero los datos quedan retenidos hasta la limpieza periódica del proyecto piloto.
- **Borrado completo (derecho al olvido)**: enviar correo a `dpo@novicell.es` solicitándolo expresamente. Atenderemos la solicitud en el plazo máximo de 30 días.
- **Cualquier otro derecho**: enviar correo a `dpo@novicell.es`.

El tester tiene derecho a presentar una **reclamación ante la Agencia Española de Protección de Datos** (`https://www.aepd.es`) si considera que sus derechos no han sido atendidos correctamente.

## 9. Permisos del dispositivo

FetroApp solicita los siguientes permisos del dispositivo:

- **Cámara**: únicamente cuando el tester inicia el escaneo de un código QR. La cámara no se activa en ningún otro momento ni se almacena ninguna imagen capturada.
- **Conexión a Internet**: para comunicarse con el backend de pruebas.

## 10. Cambios en esta política

Cualquier cambio significativo en esta política de privacidad se notificará al tester a través de la propia aplicación. La fecha de la última actualización se mantiene visible al inicio del documento.

---

## Notas internas para Marcelo (no parte de la política pública)

Antes de publicar este texto en URL pública:

1. **Completar dirección postal y NIF** de Novicell Spain en el bloque 1.
2. **Confirmar email DPO** (`dpo@novicell.es` es una suposición — verificar buzón real).
3. **Validar plazo de conservación** (30 días tras baja es propuesta razonable para piloto, pero confirmar con asesoría jurídica si procede).
4. **Confirmar mención del backend de Fatro** (sección 6) — es un hecho técnico que conviene transparentar para Play Store, pero si Fatro prefiere no aparecer mencionado, se puede sustituir por una descripción genérica tipo "backend WordPress alojado en SiteGround dentro del EEE".
5. **Publicación**: la URL final puede ser `novicell.es/legal/fetroapp-privacy` u otra subpágina de Novicell. La URL es **obligatoria** para Play Store y se introduce en el formulario de creación de la app en Play Console.
6. **Idioma**: si se publica también en versión catalana o inglesa, hay que tener traducción jurada o equivalente.