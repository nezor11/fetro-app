# Internal testing · Guía operativa

Cómo gestionar el grupo de testers internos de FetroApp en Google Play Console y qué tienen que hacer ellos para acceder, probar y reportar.

Documento orientado a la **persona responsable de testing** (Jorge actualmente). Los testers no necesitan leer este documento entero — para ellos hay un onboarding más corto al final.

---

## 1. Qué es Internal Testing en Play Store

Es uno de los **cuatro tracks** que Play Console ofrece para distribuir una app:

| Track | Audiencia | Tiempo de aprobación | Para qué sirve |
|---|---|---|---|
| **Internal** | Hasta 100 testers a dedo | 10 min tras subir | Validar build con equipo |
| **Closed** | Lista cerrada con grupos | 1-3 días | Ronda mayor antes de abrir |
| **Open** | Cualquiera con el link | 1-3 días | Pre-lanzamiento beta abierta |
| **Production** | Todo el mundo | 1-7 días review Google | Lanzamiento público |

Para FetroApp **vamos a usar Internal** por ahora — es app piloto, no necesita audiencia masiva.

## 2. Setup en Play Console (una sola vez)

Pasos a hacer cuando tengas la cuenta Play Console creada (los 25 USD ya pagados):

### 2.1 Crear la app en Play Console

1. Login en `https://play.google.com/console`.
2. **All apps → Create app**.
3. Datos básicos:
   - **App name**: `FetroApp`
   - **Default language**: `Español (España) – es-ES`
   - **App or game**: App
   - **Free or paid**: Free
   - Aceptar las dos casillas de declaration.
4. **Create app**.

### 2.2 Datos obligatorios mínimos para Internal Testing

Play Console te pide cubrir varias secciones antes de dejar publicar siquiera en Internal. Las mínimas son:

- **App access** — declarar si la app necesita login. Para FetroApp: sí, login con email+password contra el backend de pruebas. Hay que dar credenciales de demostración a Google para que el revisor pueda probar.
  - Username: `jorge.test@novicell.es`
  - Password: `FetroTest2026!`
  - Notas: "App de pruebas internas de Novicell. Login contra backend WordPress de Fatro Ibérica con autorización."

- **Ads** — "No, my app does not contain ads".

- **Content rating** — cuestionario de ~5 min. Para esta app esperamos rating PEGI 3 / Everyone (no hay violencia, contenido sexual, ni sustancias).

- **Target audience and content** — declarar audiencia (>18 años, profesionales veterinarios) y que la app no está dirigida a niños.

- **News app** — No.

- **COVID-19 contact tracing or status app** — No.

- **Data safety** — formulario detallado sobre qué datos recoge, si los comparte, si los cifra. Para FetroApp:
  - Datos recogidos: Personal info (Name, Email, Address, Phone), App activity (in-app actions), App info & performance (Crash logs).
  - Data is encrypted in transit: Yes (HTTPS/TLS).
  - Users can request data deletion: Yes (vía pantalla "Dar de baja mi cuenta" + email a `dpo@novicell.es`).
  - Data shared with third parties: No.

- **Government apps** — No.

- **Financial features** — No.

- **Health features** — No.

### 2.3 Subir el primer AAB / APK

Para Internal Testing concretamente, Play Console acepta tanto APK (más simple para testers) como AAB. Pero si vas a pasar a Production después, ahí ya solo es AAB.

Recomendación: subir directamente el AAB que generaríamos con `eas build --profile production --platform android`.

Pasos:

1. **Testing → Internal testing → Create new release**.
2. **Upload** → seleccionar el AAB que descargaste de EAS (o usar `eas submit --platform android --profile production` para que EAS lo suba automáticamente).
3. Rellenar **Release notes** (qué hay nuevo en este build, en español).
4. **Save → Review release → Start rollout**.

Tras el rollout, Google tarda ~10 min en validar y dejarlo accesible.

## 3. Crear el grupo de testers

### 3.1 Lista de testers

En **Testing → Internal testing → Testers** hay dos formas:

- **Email list dentro de Play Console**: añades emails sueltos. Hasta 100.
- **Google Group**: creas un grupo en `groups.google.com` y añades el email del grupo a Play Console. Ventaja: gestionas altas/bajas en un sitio externo, sin tocar Play Console cada vez.

Para FetroApp, dado que somos pocos testers iniciales (~5-10 personas), la **lista directa** vale.

### 3.2 Lista inicial sugerida de testers

| Persona | Email | Rol |
|---|---|---|
| Marcelo | (su email Novicell) | Product owner |
| Jorge | (tu email Novicell) | Dev / responsable testing |
| (Tester Novicell 1) | | QA |
| (Tester Novicell 2) | | QA |
| Juan Luis | (su email Fatro) | Backend developer (opcional) |

Mínimo 2-3 testers reales — Google Play obliga (en algún momento; durante Internal no es estricto, pero para Closed Testing exige 12 testers durante 14 días).

### 3.3 Compartir el opt-in link

Una vez añadidos los emails:

1. **Testing → Internal testing → Testers → Copy link**.
2. Compartes ese link a cada tester.
3. El tester abre el link en su Android, acepta el opt-in, y desde ese momento la app aparece en Play Store **solo para él** (no es pública).

## 4. Qué tienen que hacer los testers (onboarding rápido)

Este bloque es lo que les copy-pegas a los testers vía email/Slack.

---

> **¡Hola! Te invito a probar FetroApp en internal testing.**
>
> Es una app móvil que estamos desarrollando como proyecto piloto en Novicell. Necesito tu ayuda durante un par de semanas para validar que funciona en distintos móviles.
>
> ### Cómo acceder
>
> 1. Abre este link desde tu **móvil Android**: `<TESTER_OPTIN_LINK>`
> 2. Pulsa **"Become a tester"**.
> 3. Espera unos minutos. Después, abre Google Play y busca "FetroApp" — debería salir como app instalable solo para ti.
> 4. Instala como cualquier otra app.
>
> ### Cómo entrar en la app
>
> Hay dos opciones:
>
> - **Crear una cuenta de prueba** desde la pantalla de registro (recomendado).
> - O usar las credenciales compartidas: `jorge.test@novicell.es` / `FetroTest2026!` (solo para ti, no compartir).
>
> ### Qué probar
>
> Cualquier cosa, pero especialmente:
> - Login y registro
> - Hub "Más" → Formación, VetSICS, Consultas, Solicitudes, Favoritos, Asistencias, Calendario, Escaneo QR, Buscar
> - Editar perfil
> - Marcar/desmarcar favoritos
> - Escanear un QR (puedes usar [https://api.qrserver.com/v1/create-qr-code/?data=0001](https://api.qrserver.com/v1/create-qr-code/?data=0001) para generar uno desde el ordenador)
>
> ### Cómo reportar
>
> Para cualquier bug, error o sugerencia:
> - **Slack** del proyecto piloto (canal `#fetroapp-testing`), o
> - **Email** a `<JORGE_EMAIL>` con captura de pantalla
>
> Indica siempre:
> - Modelo de móvil + versión Android
> - Pasos para reproducir
> - Qué esperabas que pasara vs qué pasó
>
> Gracias por participar.

---

## 5. Política de feedback (interna)

Los reportes de testers se priorizan en 4 niveles:

| Nivel | Definición | SLA respuesta |
|---|---|---|
| **P0 · Crítico** | App crashea, login no funciona, pierde datos | <24h |
| **P1 · Alto** | Feature principal rota o bloqueada | <3 días |
| **P2 · Medio** | Feature secundaria con problemas, UX rota | <1 semana |
| **P3 · Bajo** | Mejoras, comentarios, typos | Sin SLA, se acumulan |

Cada reporte se traduce a un to-do en la tarea madre de Productive (`17099803`) o en un issue de GitHub si lo abrimos.

## 6. Ciclo de vida del internal testing

1. **Sprint 0** — Build y subida inicial. Testers reciben opt-in link.
2. **Sprint 1 · Semana 1** — Testers prueban casos básicos. Se priorizan P0/P1.
3. **Sprint 2 · Semana 2** — Build #2 con fixes. Testers re-prueban. Se priorizan P2.
4. **Decisión semana 3** — ¿Pasamos a Closed Testing (apertura controlada) o nos quedamos en Internal por más tiempo?

Cada nuevo build sube como **release nueva** en Play Console (no se sobreescribe). Los testers reciben actualización automática si tienen Play Store en auto-update.

## 7. Cuándo salir de Internal Testing

Estos son los criterios mínimos para pasar a Closed Testing:

- 0 bugs P0 abiertos.
- ≤2 bugs P1 abiertos.
- Al menos 5 testers únicos han instalado y usado la app durante 7+ días.
- Política de privacidad publicada en URL pública (obligatorio para Closed/Production).
- Cuestionario de Data Safety completo y validado por Google.
- Iconos finales (no defaults Expo).

Cuando se cumplan, una conversación corta con Marcelo y se mueve a Closed.