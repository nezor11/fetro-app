# Política de privacidad — FetroApp

**Borrador pendiente de validación legal.** Antes de publicar, completar los datos del responsable y, si procede, revisar con asesoría jurídica.

**Última actualización: 2026-09-15.**

---

## 1. Identidad del responsable

El responsable del tratamiento de los datos personales recogidos a través de la aplicación móvil **FetroApp** es:

> **[Nombre y apellidos del desarrollador]**  
> *(NIF y dirección postal a completar)*  
> Email de contacto: `[email de contacto]` *(usar el mismo email de desarrollador que figura en Google Play Console)*

**FetroApp es un proyecto personal de aprendizaje** desarrollado por una sola persona con fines técnicos y de demostración. No es la app oficial de ninguna empresa ni entidad.

## 2. Naturaleza del proyecto

FetroApp es una aplicación **de pruebas** que consume datos de un backend WordPress de un tercero (Fatro Ibérica) **previa autorización del titular del backend**. El uso de la aplicación se limita a:

- El propio desarrollador y las personas que invite como testers.
- Eventuales colaboradores autorizados durante el desarrollo.

**No está pensada para publicación masiva** ni para uso comercial mientras siga en este estado de proyecto personal. La presencia de esta aplicación en Play Store, si llega, será únicamente en el canal **Internal Testing** o **Closed Testing** con tester whitelisted.

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

Los datos introducidos por el usuario se transmiten a un backend WordPress alojado en **SiteGround** (proveedor cumplidor del RGPD, dentro del Espacio Económico Europeo). Ese backend pertenece a Fatro Ibérica S.L., que en este contexto actúa como **encargado del tratamiento técnico** habiendo autorizado al desarrollador el uso del mismo durante la fase de pruebas.

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
- **Baja de cuenta**: desde la pantalla "Dar de baja mi cuenta" del Perfil. Esta operación desactiva inmediatamente el acceso pero los datos quedan retenidos hasta la limpieza periódica del proyecto.
- **Borrado completo (derecho al olvido)**: enviar correo a `[email de contacto]` solicitándolo expresamente. Atenderemos la solicitud en el plazo máximo de 30 días.
- **Cualquier otro derecho**: enviar correo a `[email de contacto]`.

El tester tiene derecho a presentar una **reclamación ante la Agencia Española de Protección de Datos** (`https://www.aepd.es`) si considera que sus derechos no han sido atendidos correctamente.

## 9. Permisos del dispositivo

FetroApp solicita los siguientes permisos del dispositivo:

- **Cámara**: únicamente cuando el tester inicia el escaneo de un código QR. La cámara no se activa en ningún otro momento ni se almacena ninguna imagen capturada.
- **Conexión a Internet**: para comunicarse con el backend de pruebas.

## 10. Cambios en esta política

Cualquier cambio significativo en esta política de privacidad se notificará al tester a través de la propia aplicación. La fecha de la última actualización se mantiene visible al inicio del documento.

---

## Notas internas (no parte de la política pública)

Antes de publicar este texto en URL pública:

1. **Completar nombre, NIF, dirección postal y email de contacto** en el bloque 1. El email debe coincidir con el de desarrollador de Play Console.
2. **Validar plazo de conservación** (30 días tras baja es una propuesta razonable, pero confirmar con asesoría jurídica si procede).
3. **Confirmar mención del backend de Fatro** (sección 6). Es un hecho técnico que conviene transparentar para Play Store, pero si Fatro prefiere no aparecer, sustituir por "backend WordPress alojado en SiteGround dentro del EEE".
4. **Publicación**: la URL es **obligatoria** para Play Store. Opción más rápida: GitHub Pages del repositorio.
5. **Idioma**: si se publica también en inglés, cuidar la equivalencia jurídica de la traducción.
