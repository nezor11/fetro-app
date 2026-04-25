# Play Store · Checklist de publicación

Estado de los pasos necesarios para publicar **FetroApp** en Google Play Store. Marcado al **2026-04-23**.

---

## ✅ Hecho

- [x] **Cuenta Expo creada** (`jmtnez` / `martinezortiz@gmail.com`).
- [x] **`eas-cli` instalado** localmente (v18.8.1).
- [x] **Proyecto vinculado** a Expo (`@jmtnez/FetroApp`, projectId `4ed28b79-ddbe-4d1d-bc63-b960583f9863`).
- [x] **`app.json` configurado** con `package: "com.fatroibericas.app"` (provisional) y `versionCode: 1`.
- [x] **`eas.json` creado** con tres perfiles: `development`, `preview` (APK descargable), `production` (AAB).
- [x] **Plugin `expo-camera` configurado** con descripción de permiso en español.
- [x] **Permisos Android limpios** (solo CAMERA, sin RECORD_AUDIO accidental).
- [x] **Primer build de preview lanzado** (build `431dd944-8bbb-4164-9cbf-2106fd7d4c70`).
- [x] **Borrador de política de privacidad** redactado en `docs/privacy-policy-draft.md`.

---

## 🟡 Pendiente — sin bloqueo (avanzable cuando dé la gana)

### Iconos finales (branding real)

Los iconos actuales son los **defaults del template de Expo**. Para Play Store hay que sustituir por iconos con branding real de Fatro / Novicell. Necesitamos:

- **`assets/icon.png`** — 1024×1024 PNG sin transparencia.
- **`assets/android-icon-foreground.png`** — 512×512 PNG, capa frontal del adaptive icon (logo recortado, fondo transparente).
- **`assets/android-icon-background.png`** — 512×512 PNG, capa de fondo del adaptive icon (color o textura plana).
- **`assets/android-icon-monochrome.png`** — 512×512 PNG en escala de grises (Android 13+ themed icons).
- **`assets/splash-icon.png`** — 1024×1024 PNG para la pantalla de splash.

Diseñador puede partir del logo oficial de Fatro o crear una variante específica para la app móvil. Si no hay diseñador disponible, se puede generar con **`https://icon.kitchen`** a partir de un SVG/PNG del logo en alta resolución.

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

### Decisión 2 · Package ID → ✅ `com.novicell.fetroapp`

App nueva, no hereda la `es.swapp.fatrocomunidad` original. Razones:

- Deja claro que el origen es **Novicell** (es un proyecto piloto/training, no la app oficial corporativa de Fatro).
- No suplanta a Fatro ni a SwApp.
- Si en el futuro Fatro decide adoptar la app como oficial, se puede **transferir la titularidad** en Play Console sin cambiar el package ID — solo cambia quién la mantiene.
- Sigue la convención `com.<empresa>.<proyecto>`.

### Decisión 3 · ¿Sustituir la Android original? → ✅ No, app nueva

La Android original `es.swapp.fatrocomunidad` (publicada por SwApp) sigue su camino. FetroApp coexiste como app independiente. Los usuarios actuales no reciben "actualización" automática — descargarían la nueva si así lo deciden.

---

## 🔴 Bloqueado — sigue pendiente con Marcelo

### Decisión 4 · Política de privacidad publicada

Validar el borrador (`docs/privacy-policy-draft.md`) con DPO de Fatro y publicar en una URL pública. Posibles ubicaciones:

- `fatroiberica.es/politica-privacidad-app`
- `novicell.es/politica-privacidad-fetroapp`
- Cualquier subpágina pública con TLS

La URL es **obligatoria** para Play Store y se introduce al crear la app en Play Console.

### Decisión 5 · Cuenta Google Play Console

Coste **una sola vez de 25 USD**. Requiere:

- Verificación de identidad (DNI/pasaporte) desde 2023.
- Cuenta de empresa o personal.
- Datos fiscales si se va a publicar app de pago (no es nuestro caso).

Mejor **cuenta de empresa** (Fatro o Novicell) en lugar de personal — facilita la transferencia futura si Jorge cambia de proyecto.

---

## 🟢 Antes de subir el AAB de producción

- [ ] Iconos finales (branding real).
- [ ] Screenshots y feature graphic.
- [ ] Política de privacidad publicada en URL pública.
- [ ] Cuenta de Google Play Console creada y verificada.
- [ ] Cuestionario **Data Safety** completado en Play Console (qué datos recoges, si los compartes, si los cifras en tránsito).
- [ ] Cuestionario **Content Rating** completado (PEGI 3 esperado para esta app).
- [ ] Build de **producción** lanzado: `eas build --profile production --platform android` → genera AAB.
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

## 📅 Timeline estimado (sin tener todavía las decisiones de Marcelo)

| Fase | Duración estimada | Bloqueante |
|---|---|---|
| Reunión Marcelo + decisiones | 1 hora | ⚠️ falta agendar |
| Iconos finales | 1-2 días | Diseñador |
| Política de privacidad publicada | 1 día | DPO + diseño página |
| Cuenta Play Console + verificación | 1-3 días | Marcelo administrativo |
| Screenshots + feature graphic | 2-4 horas | Tras tener iconos |
| Configuración Play Console + Data Safety | 2-3 horas | Tras cuenta creada |
| Subida internal testing | 30 min | Tras todo lo anterior |
| Closed testing (Google requiere 14 días) | 14 días | Tester pool |
| Producción | 1-3 días review Google | Tras closed testing |

**Total realista hasta tener la app en producción**: 3-4 semanas desde hoy si nadie se duerme.