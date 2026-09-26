# Play Console · Publicación paso a paso

Guía para llevar FetroApp desde el AAB ya generado hasta producción en Google Play, con la cuenta personal de desarrollador **"Jorge Mtnez"** (ID `7549371768525842906`), que cuelga de `contact@nezor.es`, no de `martinezortiz@gmail.com`. Es la misma cuenta que ya tiene publicada "Easy Xtream Football". Redactada el 2026-09-18, actualizada el 2026-09-25.

Qué hay ya listo y dónde está:

| Recurso | Ubicación |
|---|---|
| AAB de producción (versionCode 4, `com.jmtnez.fetroapp`) | Build EAS `04b98962-c01a-47c3-9b4a-b2518d1c6316` |
| Textos de la ficha | `store/listing.md` |
| Icono 512×512 y feature graphic 1024×500 | `store/icon-512.png`, `store/feature-graphic.png` |
| 5 capturas de teléfono (1220×2440) | `store/screenshots/` |
| Respuestas de Data Safety y Content Rating | `docs/play-console-questionnaires.md` |
| Política de privacidad | `https://nezor11.github.io/fetro-app/privacy-policy` |
| Borrado de cuenta | `https://nezor11.github.io/fetro-app/delete-account` |
| Onboarding para testers | `docs/internal-testing-guide.md`, sección 4 |

El recorrido completo tiene siete fases. La más larga es la 5: las cuentas personales nuevas tienen que pasar una prueba cerrada con **12 testers durante 14 días seguidos** antes de poder pedir acceso a producción.

```
0. Cuenta verificada → 1. Crear app → 2. Contenido de la app → 3. Ficha
→ 4. Prueba interna → 5. Prueba cerrada (14 días) → 6. Acceso a producción → 7. Producción
```

---

## Estado a 2026-09-25

La app **FetroApp** (`com.jmtnez.fetroapp`, ID `4972189354201991800`) se creó el 2026-09-24 y está en Borrador. Hecho desde la consola:

- Política de privacidad, Anuncios (no), ID de publicidad (no), Aplicaciones gubernamentales (no), Funciones financieras (ninguna), Salud (ninguna).
- Seguridad de los datos: cuestionario completo y **guardado como borrador**. No se puede enviar hasta rellenar la audiencia objetivo.
- Ficha principal: nombre, descripciones, icono, gráfico de funciones y 5 capturas (en orden 01 → 05). Recursos declarados como no generados por IA.
- Prueba interna publicada (versión 4, 25 sept 21:57) con la lista "Internos". La cuenta tiene además una lista "Testers Community" de 136 correos que sirve para llegar a los 12 de la prueba cerrada.
- Configuración de la tienda: categoría **Economía** (así llama la consola en español a "Business"), email `contact@nezor.es`, web `https://nezor11.github.io/fetro-app/`.

Actualización del 2026-09-26: **todo el contenido de la aplicación está completo** (11 de 11 tareas del panel). Credenciales de demo introducidas (cuenta `jorge.test@novicell.es`, verificada contra el backend), audiencia solo 18+, Seguridad de los datos enviado, IARC completado con resultado **PEGI 3 / Para todos** (la única respuesta "Sí" fue "contenido en línea", porque la app carga noticias y productos de la web de Fatro; sus cuatro preguntas de seguimiento van en "No").

Prueba cerrada (canal **Alpha**) configurada el 2026-09-26: país España, listas de testers "Internos" (3) y "Testers Community" (136), correo de sugerencias `contact@nezor.es`, versión `4 (1.0.0)` añadida desde la biblioteca. Los 14 cambios se **enviaron a revisión el 2026-09-26** (la consola indica que la revisión suele tardar hasta 7 días). Mientras tanto no hay nada que hacer en la consola: cuando Google apruebe, compartir el enlace de la prueba cerrada con los testers y anotar la fecha en que 12 hayan aceptado.

## Fase 0 · Cuenta de desarrollador verificada

1. Entra en `https://play.google.com/console` con `contact@nezor.es` (la URL de la consola lleva `/u/1/` cuando esa cuenta es la segunda de la sesión de Chrome). Con `martinezortiz@gmail.com` la consola muestra el alta de cuenta nueva: esa cuenta no tiene consola de desarrollador.
2. Comprueba en **Panel** que no quede ningún aviso pendiente. Las cuentas personales tienen que completar:
   - Verificación de identidad (DNI/pasaporte).
   - Verificación del teléfono de contacto.
   - Verificación de acceso a un dispositivo Android: se hace instalando la app **Google Play Console** en el móvil e iniciando sesión con la misma cuenta.
3. Hasta que no esté todo verificado, Play Console deja preparar la app pero no publicar.

## Fase 1 · Crear la app

1. **Inicio → Crear aplicación**.
2. Rellena:
   - Nombre: `FetroApp`
   - Idioma predeterminado: `Español (España) – es-ES`
   - Aplicación o juego: **Aplicación**
   - Gratuita o de pago: **Gratuita** (no se puede pasar a de pago después)
3. Acepta las declaraciones (políticas del programa para desarrolladores y leyes de exportación de EE. UU.) y pulsa **Crear aplicación**.

## Fase 2 · Contenido de la aplicación

Menú lateral: **Política y programas → Contenido de la aplicación**. Cada bloque se guarda por separado; el Panel va tachando las tareas.

| Bloque | Qué responder |
|---|---|
| **Política de privacidad** | `https://nezor11.github.io/fetro-app/privacy-policy` |
| **Acceso a la aplicación** | "Todas o algunas funciones están restringidas". Añade instrucciones con una cuenta de demo de la Comunidad FATRO que funcione y no caduque (ver nota 1). |
| **Anuncios** | No, la app no contiene anuncios. |
| **Clasificación de contenido** | Cuestionario IARC. Email de contacto: el de la cuenta. Categoría y respuestas en `docs/play-console-questionnaires.md` §2. Esperado: PEGI 3. |
| **Público objetivo** | Solo **18 años o más**. A la pregunta de si atrae a niños: No. |
| **Aplicación de noticias** | No. |
| **Seguridad de los datos** | Copiar `docs/play-console-questionnaires.md` §1. Todos los tipos se marcan como **compartidos** (nota A de ese documento). URL de borrado de cuenta: `https://nezor11.github.io/fetro-app/delete-account`. |
| **ID de publicidad** | **No**. Comprobado en el manifest del AAB v4: no incluye el permiso `com.google.android.gms.permission.AD_ID`. |
| **Aplicaciones gubernamentales** | No. |
| **Funciones financieras** | Ninguna. |
| **Salud** | Ninguna (ver nota B del documento de cuestionarios). |

Si aparece algún bloque más que no esté en esta tabla (Google añade alguno de vez en cuando), la respuesta casi siempre es "No": la app no usa ubicación, contactos, SMS, accesibilidad ni servicios en primer plano.

## Fase 3 · Ficha de Play Store

1. **Crecer → Presencia en Play Store → Ficha principal**.
2. Copia de `store/listing.md`:
   - Nombre de la app
   - Descripción breve
   - Descripción completa
3. Gráficos:
   - Icono de la aplicación: `store/icon-512.png`
   - Gráfico de funciones: `store/feature-graphic.png`
   - Capturas de pantalla del teléfono: los 5 PNG de `store/screenshots/`, en orden (01 → 05)
   - Capturas de tablet: se pueden dejar vacías. La app es solo vertical y no hace falta declarar soporte de tablet.
4. **Guardar**.
5. **Presencia en Play Store → Configuración de la ficha de Play Store**:
   - Categoría: **Economía**. Es como la consola en español (es-ES) llama a la categoría "Business"; no existe "Empresa" ni "Negocios" en la lista.
   - Etiquetas: veterinaria, formación, comunidad (si las ofrece)
   - Email: `contact@nezor.es` (el de la cuenta de desarrollador; se muestra en la ficha)
   - Sitio web: `https://nezor11.github.io/fetro-app/`
   - Teléfono: opcional, mejor dejarlo vacío
6. **Guardar**.

## Fase 4 · Prueba interna (primera subida del AAB)

### 4.1 Descargar el AAB

Desde `https://expo.dev/accounts/nezor/projects/FetroApp/builds/04b98962-c01a-47c3-9b4a-b2518d1c6316` → **Download**. O en la terminal:

```bash
npx eas-cli build:list --platform android --limit 1
```

y descargar la URL del artefacto `.aab` que aparece. Pesa unos 63 MB. El 2026-09-25 quedó copiado en `~/Downloads/fetroapp-v4-versionCode4.aab`.

### 4.2 Crear la versión

1. **Probar y publicar → Pruebas → Prueba interna → Crear nueva versión**.
2. **Firma de aplicaciones de Google Play**: la primera vez pregunta por la clave de firma. Deja la opción por defecto, **"Google genera y protege la clave de firma de la app"**. El keystore que guarda EAS pasa a ser la *clave de subida*; no hay que tocar nada en EAS.
3. **Subir** el `.aab`. La primera subida tiene que ser manual; la API de Google Play no acepta builds de una app que no tenga al menos una subida desde la consola.
4. Nombre de la versión: lo rellena solo (`4 (1.0.0)`).
5. Notas de la versión: el bloque de `store/listing.md`, dentro de las etiquetas `<es-ES>` que pone la consola.
6. **Siguiente**. Si salen advertencias (no errores), léelas. Las habituales en Expo, como "sin archivo de desofuscación", no bloquean.
7. **Guardar y publicar**.

### 4.3 Testers internos

1. Pestaña **Testers** → crea una lista de emails (por ejemplo, "Equipo FetroApp") con tu cuenta y la de quien quieras.
2. **Copiar enlace** de participación y abrirlo desde el móvil Android con esa cuenta → **Hacerse tester** → instalar desde Play Store.
3. Haz una pasada rápida con `docs/qa-checklist.md` sobre la versión instalada desde Play. Es la primera vez que se prueba el binario firmado por Google.

Tras unos días, Play Console genera el **informe previo al lanzamiento** (Probar y publicar → Pruebas → Informe previo al lanzamiento). Google abre la app en dispositivos reales con la cuenta de demo de "Acceso a la aplicación". Si hay crashes, se arreglan antes de la fase 5.

## Fase 5 · Prueba cerrada (12 testers, 14 días)

Requisito de Google para cuentas personales creadas después de noviembre de 2023: al menos **12 testers** con el opt-in activo durante **14 días seguidos** en una prueba cerrada. Google cuenta a quienes llevan 14 días seguidos con el opt-in, así que si alguien se da de baja y se queda por debajo de 12, hay que esperar a que otro complete sus 14 días. Conviene invitar a unos 15 para tener margen.

1. **Probar y publicar → Pruebas → Prueba cerrada → Alpha** (el canal que viene creado) **→ Gestionar canal**.
2. **Países/regiones**: España (y Portugal si hay testers allí).
3. **Testers**: crea una lista de emails o usa un Google Group. El grupo es más cómodo: la gente se une sola y no hay que tocar la consola.
4. **Crear nueva versión → Añadir desde biblioteca** → elige el AAB versionCode 4 que ya subiste en la fase 4. No hace falta volver a subirlo.
5. **Guardar → Enviar a revisión**. La prueba cerrada **sí pasa revisión de Google**: normalmente horas, a veces hasta unos días. Es la primera revisión real de la ficha y del contenido.
6. Cuando se apruebe, comparte el enlace de participación con los testers. El texto listo para enviar está en `docs/internal-testing-guide.md` §4 (sustituye `<TESTER_OPTIN_LINK>` por el enlace de la prueba cerrada).
7. Apunta la fecha en que llegas a 12 testers con opt-in. Sin ella no sabes cuándo se cumplen los 14 días.

Durante esos 14 días:

- Los testers tienen que tener la app **instalada** y, a ser posible, usarla. Google pregunta después por la participación.
- Guarda el feedback que llegue (capturas, emails). Te hará falta en la fase 6.
- Si hay que arreglar algo: si el cambio es solo JS, basta con `eas update --channel production`. Si toca código nativo o permisos, hay que sacar un build nuevo (`npx eas-cli build --profile production --platform android`; el versionCode sube solo) y crear una versión nueva en el mismo canal. El contador de 14 días no se reinicia por subir versiones.

## Fase 6 · Solicitar acceso a producción

Al cumplirse los 14 días aparece en el **Panel** el botón **Solicitar acceso a producción**. Es un formulario con tres bloques:

1. **Sobre la prueba cerrada**: cómo reclutaste a los testers, cuánto la usaron, qué feedback dieron y qué cambiaste a raíz de él. Respuestas concretas: número de testers, fallos encontrados y arreglados.
2. **Sobre la app**: público objetivo (profesionales veterinarios de la Comunidad FATRO), valor que aporta, número de instalaciones esperado el primer año (un rango bajo y realista).
3. **Preparación para producción**: cómo sabes que está lista (QA con `docs/qa-checklist.md`, informe previo al lanzamiento sin crashes, etc.).

Google responde en unos 7 días o menos. Si lo rechaza, suele pedir otros 14 días de prueba cerrada con más participación.

## Fase 7 · Producción

1. **Probar y publicar → Producción → Países/regiones**: España (y los que quieras).
2. **Crear nueva versión → Añadir desde biblioteca** → la última versión probada en la prueba cerrada. También se puede **promocionar** desde la prueba cerrada.
3. Notas de la versión: las de `store/listing.md` o las del último cambio.
4. **Lanzamiento progresivo**: para una primera versión con pocos usuarios se puede ir al 100 % directamente.
5. **Guardar → Enviar a revisión**. La revisión de producción suele tardar entre 1 y 7 días.
6. Cuando esté publicada:
   - Marca la tarea en `docs/play-store-checklist.md` y en el `README.md`.
   - Añade el enlace `https://play.google.com/store/apps/details?id=com.jmtnez.fetroapp` a `docs/index.md`.
   - Avisa a Fatro (la política de privacidad les nombra responsables del tratamiento).

---

## Después de publicar: actualizaciones

**Cambios solo en JS/TS o assets** → actualización OTA, sin pasar por Google:

```bash
eas update --channel production --message "Descripción del cambio"
```

`runtimeVersion` sigue la política `appVersion`: la OTA solo llega a los binarios con la misma `version` de `app.json` (ahora `1.0.0`).

**Cambios nativos** (dependencias con código nativo, permisos, `app.json`, SDK de Expo) → build nuevo:

1. Sube `version` en `app.json` (p. ej. `1.0.1`), para que las OTAs de la versión anterior no lleguen al binario nuevo ni al revés.
2. `npx eas-cli build --profile production --platform android` (el versionCode se incrementa en remoto).
3. Nueva versión en Producción con ese AAB, o con `eas submit` (siguiente apartado).

Las OTAs no pueden cambiar la finalidad principal de la app. Para Google, una funcionalidad nueva de peso tiene que llegar en un build revisado.

## Opcional · Subidas automáticas con `eas submit`

Solo después de la primera subida manual (fase 4).

1. En Google Cloud Console, crea un proyecto (o usa uno existente) y activa **Google Play Android Developer API**.
2. **IAM → Cuentas de servicio → Crear cuenta de servicio**. Sin roles de Cloud. Después: **Claves → Añadir clave → JSON**.
3. Guarda el JSON **fuera del repo**, o dentro con un nombre que ignore `.gitignore` (hoy no hay ninguna regla que cubra `*.json`, así que conviene añadir la ruta concreta antes de copiarlo).
4. En Play Console: **Usuarios y permisos → Invitar a nuevos usuarios** → el email de la cuenta de servicio → permisos de la app FetroApp: publicar en canales de prueba (y de producción si quieres automatizarla).
5. En `eas.json`:

   ```json
   "submit": {
     "production": {
       "android": {
         "serviceAccountKeyPath": "../secrets/fetroapp-play.json",
         "track": "internal"
       }
     }
   }
   ```

6. `npx eas-cli submit --profile production --platform android --latest`. Alternativa: subir el JSON como credencial a EAS (`eas credentials`) y no tenerlo en local.

---

## Notas

**1 · Cuenta de demo para Google.** El revisor inicia sesión con la cuenta que pongas en "Acceso a la aplicación". La que aparece en `docs/internal-testing-guide.md` (`jorge.test@novicell.es`) es de la etapa en Novicell: comprueba que sigue activa en `fatroiberica.es` o crea una nueva de la Comunidad FATRO solo para esto. La contraseña va en el formulario de Play Console, nunca en el repo (es público). Si el login falla durante la revisión, Google rechaza la versión.

**2 · Permisos que añade Expo por defecto.** Además de `CAMERA` e `INTERNET`, el manifest del AAB v4 declara `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `VIBRATE`, `USE_BIOMETRIC` y `USE_FINGERPRINT`, que vienen de la plantilla y de las librerías de Expo. Ninguno exige declaración en Play Console ni bloquea la publicación, pero la app no los usa. Se pueden añadir a `blockedPermissions` en el próximo build nativo para dejar la ficha más limpia; no merece la pena hacer un build solo por eso.

**3 · Si Google rechaza algo.** El motivo llega por email y aparece en **Panel → Estado de la publicación**. Los rechazos típicos de una primera app son: login de demo que no funciona, Data Safety que no cuadra con la política de privacidad, o capturas que no se corresponden con la app. Todo eso se corrige desde la consola y se vuelve a enviar, sin build nuevo.
