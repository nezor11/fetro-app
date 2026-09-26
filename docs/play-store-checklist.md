# Play Store · Checklist de publicación

Estado de los pasos necesarios para publicar **FetroApp** en Google Play Store. Marcado al **2026-04-23**.

El recorrido en Play Console, pantalla a pantalla, está en [`play-console-paso-a-paso.md`](play-console-paso-a-paso.md).

---

## ✅ Hecho

- [x] **Cuenta Expo** `nezor` (`contact@nezor.es`).
- [x] **`eas-cli` instalado** localmente (v18.8.1).
- [x] **Proyecto vinculado** a Expo (`@nezor/FetroApp`, projectId `26bc6bdf-4fc0-437d-98bc-2aec27715629`, revinculado el 2026-09-15).
- [x] **`app.json` configurado** con `package: "com.fatroibericas.app"` (provisional) y `versionCode: 1`.
- [x] **`eas.json` creado** con tres perfiles: `development`, `preview` (APK descargable), `production` (AAB).
- [x] **Plugin `expo-camera` configurado** con descripción de permiso en español.
- [x] **Permisos Android limpios** (solo CAMERA). RECORD_AUDIO se había vuelto a colar en `app.json` y lo añade expo-camera por defecto; desde el 2026-09-18 se bloquea con `recordAudioAndroid: false` y `blockedPermissions`. El AAB versionCode 3 aún lo pedía; el versionCode 4 ya no.
- [x] **Primer build de preview lanzado** (build `431dd944-8bbb-4164-9cbf-2106fd7d4c70`).
- [x] **Política de privacidad** redactada en `docs/privacy-policy.md` y publicada en GitHub Pages.

---

## 🟡 Pendiente — sin bloqueo (avanzable cuando dé la gana)

### Iconos finales (branding real)

Los iconos actuales son los **defaults del template de Expo**. Para Play Store hay que sustituir por un identificador propio de FetroApp. Necesitamos:

- **`assets/icon.png`** — 1024×1024 PNG sin transparencia.
- **`assets/android-icon-foreground.png`** — 512×512 PNG, capa frontal del adaptive icon (logo recortado, fondo transparente).
- **`assets/android-icon-background.png`** — 512×512 PNG, capa de fondo del adaptive icon (color o textura plana).
- **`assets/android-icon-monochrome.png`** — 512×512 PNG en escala de grises (Android 13+ themed icons).
- **`assets/splash-icon.png`** — 1024×1024 PNG para la pantalla de splash.

Crear un identificador propio para FetroApp que no use marca de Fatro. Si no hay diseñador disponible, se puede generar con **`https://icon.kitchen`** a partir de un SVG/PNG del logo en alta resolución.

### Screenshots para la ficha de Play Store

Mínimo **2 screenshots de móvil** para la ficha. Recomendado: **8 screenshots** mostrando las features clave:

1. Pantalla de Login con branding
2. Listado Home (noticias)
3. Detalle de carrera VetSICS
4. Hub "Más" con todos los tiles
5. Calendario con eventos
6. Asistencias
7. Detalle de un compromiso QR escaneado
8. Pantalla de Perfil con datos rellenos

**Resolución mínima Play Store**: 320×480 px. **Recomendado**: 1080×1920 (Full HD vertical) o 1080×2400 (móvil moderno).

Se pueden capturar desde el APK instalado en un móvil real, desde el emulador Android Studio, o desde Expo web (con DevTools simulando viewport móvil).

### Feature graphic

**1024×500 px PNG/JPG**. Es el banner que aparece arriba de la ficha en Play Store. Suele incluir el logo de la app + 1 frase corta + visual atractivo. Puede hacerlo el mismo diseñador que los iconos.

### Vídeo (opcional)

Vídeo en YouTube (público o no listado) con un walkthrough de 30-60s de la app. **No es obligatorio** pero suele subir el CTR de la ficha en un 15-20%.

---

## 🟢 Decisiones tomadas (2026-04-23)

### Decisión 1 · Nombre comercial → ✅ "FetroApp"

Mantenemos el nombre actual de proyecto. En Play Console se introducirá tal cual.

### Decisión 2 · Package ID → ✅ `com.jmtnez.fetroapp` (cambiado el 2026-09-15)

App nueva, no hereda la `es.swapp.fatrocomunidad` original. Razones:

- Identifica al desarrollador (cuenta personal `jmtnez`, la misma que en Expo) y deja claro que no es la app oficial de Fatro.
- No suplanta a Fatro ni a SwApp.
- Sigue la convención `com.<desarrollador>.<proyecto>`. Antes era `com.novicell.labs.fetroapp`; como la app nunca llegó a subirse a Play Console con ese ID, el cambio no tiene coste.
- Si en el futuro Fatro decide adoptar la app como oficial corporativa, lo limpio será publicar entonces una **app distinta** con package `com.fatroibericas.app` o equivalente — la actual queda como histórico de I+D. Cambiar el package ID después del primer release público es publicar app nueva en Play Store, perdiendo descargas y reviews acumulados.

### Decisión 3 · ¿Sustituir la Android original? → ✅ No, app nueva

La Android original `es.swapp.fatrocomunidad` (publicada por SwApp) sigue su camino. FetroApp coexiste como app independiente. Los usuarios actuales no reciben "actualización" automática — descargarían la nueva si así lo deciden.

---

## 🔴 Pendiente de Jorge

### Decisión 4 · Política de privacidad publicada

✅ Redactada (`docs/privacy-policy.md`) con Fatro Ibérica como responsable del tratamiento (los datos van a sus servidores; el desarrollador no los recibe) y publicada vía GitHub Pages en `https://nezor11.github.io/fetro-app/privacy-policy`. Pendiente: avisar a Fatro de que se les nombra como responsables.

La URL es **obligatoria** para Play Store y se introduce al crear la app en Play Console.

### Decisión 5 · Cuenta Google Play Console → ✅ cuenta personal de Jorge (2026-09-15)

Se publica desde la cuenta personal de Jorge, "Jorge Mtnez", que cuelga de `contact@nezor.es` (comprobado el 2026-09-25: `martinezortiz@gmail.com` no tiene consola de desarrollador). La cuenta ya estaba creada, verificada y con otra app en producción, así que no hubo que pagar ni verificar nada.

Consecuencias a tener en cuenta:

- El "desarrollador" visible en la ficha será el nombre de esa cuenta.
- La política de privacidad nombra a Jorge como responsable del tratamiento (bloque 1 del borrador, con placeholders por completar).
- Google permite transferir la app a otra cuenta más adelante (formulario de transferencia), así que no es una decisión irreversible.

---

## 🟢 Antes de subir el AAB de producción

- [x] Icono definitivo: F blanca sobre morado `#460032` (decidido el 2026-09-15). `store/icon-512.png` para la ficha.
- [x] Feature graphic: `store/feature-graphic.png` (1024×500).
- [x] Screenshots de teléfono: 5 capturas en `store/screenshots/` (Redmi Note 13 Pro+, recortadas a 1220×2440 para cumplir el máximo 2:1). Hechas el 2026-09-16.
- [x] Textos de la ficha (nombre, descripción breve y completa, notas de versión): `store/listing.md`.
- [x] URL de borrado de cuenta (obligatoria para apps con registro): `https://nezor11.github.io/fetro-app/delete-account`.
- [x] Política de privacidad publicada en URL pública (`https://nezor11.github.io/fetro-app/privacy-policy`).
- [x] Cuenta de Google Play Console: la personal de Jorge bajo `contact@nezor.es`, ya verificada (ver Decisión 5).
- [x] App creada en Play Console el 2026-09-24 (`com.jmtnez.fetroapp`, ID `4972189354201991800`).
- [x] Ficha principal y configuración de la tienda rellenadas el 2026-09-25.
- [x] AAB versionCode 4 subido a mano y publicado en **prueba interna** el 2026-09-25 (lista de testers "Internos").
- [x] Prueba cerrada (Alpha) configurada y **enviada a revisión** junto con la ficha y el contenido el 2026-09-26.
- [x] Cuestionario **Data Safety** completado y guardado (2026-09-26).
- [x] Cuestionario **Content Rating** completado el 2026-09-26: PEGI 3 / Para todos.
- [x] Build de **producción** definitivo el 2026-09-18 (build `04b98962`, versionCode 4, `com.jmtnez.fetroapp`, con expo-updates y sin RECORD_AUDIO; sustituye al `1a13a110`, que pedía micrófono): `npx eas-cli build --profile production --platform android`.
- [ ] Subida automática del AAB con `eas submit --profile production --platform android` (requiere configurar service account de Google Play Developer API).

---

## 🚦 Tracks de prueba antes de producción

Google Play Console tiene 4 canales:

1. **Internal testing** — hasta 100 testers, disponible en 10 min tras subir. Para Marcelo, Jorge y el equipo.
2. **Closed testing** — grupo cerrado mayor. Google exige mínimo 12 testers durante 14 días para apps nuevas (regla introducida en 2023).
3. **Open testing** — cualquiera con el link, todavía no en búsquedas.
4. **Production** — público general.

**Flujo recomendado**: internal → closed (2 semanas) → production. Saltarse closed con apps nuevas puede provocar rechazo de Google.

---

## 📅 Timeline estimado (actualizado 2026-09-15, cuenta personal)

| Fase | Duración estimada | Bloqueante |
|---|---|---|
| Iconos finales | 1-2 días | Diseñador |
| Política de privacidad publicada | 1 hora | Decidir responsable y completar placeholders; puede servirse desde GitHub Pages del repo |
| Cuenta Play Console + verificación | 1-3 días | Jorge (verificación de identidad de Google) |
| Screenshots + feature graphic | 2-4 horas | Tras tener iconos |
| Configuración Play Console + Data Safety | 2-3 horas | Tras cuenta creada |
| Subida internal testing | 30 min | Tras todo lo anterior |
| Closed testing (Google requiere 14 días) | 14 días | Tester pool |
| Producción | 1-3 días review Google | Tras closed testing |

**Total realista hasta tener la app en producción**: 3-4 semanas desde hoy si nadie se duerme.