# Mensaje a Marcelo · Compartir el primer APK de FetroApp

Borrador para enviar a Marcelo cuando el primer build de preview esté disponible. Tres versiones según canal — usa la que mejor encaje.

---

## Versión A · Slack / DM directo (corto, informal)

> **Marcelo, primer APK de FetroApp listo para probar 📱**
>
> Es un build interno del proyecto piloto del CDS — el equipo `_labs` ha cubierto todas las fases planificadas (MVP, auth, formaciones, VetSICS, consultas, solicitudes) más paridad con la app Android que ya hay (calendario, baja GDPR, escaneo QR) y tres extras (favoritos, asistencias, mis solicitudes). 29 secciones documentadas en el repo.
>
> APK descargable: https://expo.dev/accounts/jmtnez/projects/FetroApp/builds/<BUILD_ID>
> Repo: https://github.com/nezor11/fetro-app
>
> **Para instalar (Android)**:
> 1. Abre el link desde el móvil.
> 2. "Install" → descarga `.apk`.
> 3. Permite "Instalar de origen desconocido" si lo pide.
> 4. Login con tu cuenta de Fatro o crea una de prueba.
>
> Cuando puedas, me confirmas:
> - ¿Validamos "FetroApp" como nombre comercial para Play Store?
> - ¿Creamos cuenta Google Play Console de Novicell (25 USD una vez)?
> - URL pública para política de privacidad → tengo borrador en `docs/privacy-policy-draft.md`.
>
> Cualquier feedback al APK también bienvenido. ¡Gracias!

---

## Versión B · Email (formal, con contexto)

**Asunto**: FetroApp — Primer build disponible para revisión

> Hola Marcelo,
>
> Te escribo para informarte de que el proyecto FetroApp del entorno `_labs` ya tiene su primer build de preview listo para revisión. Es la app móvil React Native + Expo que se ha desarrollado dentro del marco del CDS 2026 como ejercicio de I+D para reforzar el dominio de la integración de WordPress con clientes nativos.
>
> ### Estado del proyecto
>
> Funcionalmente completo respecto al alcance original:
>
> - **Fase 1 (MVP)** — listado de noticias, categorías jerárquicas, productos, búsqueda global.
> - **Fase 2 (Autenticación)** — login/registro con plugin `json-api-user`, recuperación de contraseña, perfil.
> - **Fase 2 (Funcionalidades avanzadas)** — formaciones, carreras VetSICS, directorio de especialistas, gestión de solicitudes.
> - **Fase 3 (Mejoras arquitectónicas)** — hub "Más" en la tab bar, capa de cache con TanStack Query, perfil editable contra `wp_usermeta`.
> - **Fase 3 (Paridad con la app Android original)** — calendario agregador, baja de cuenta GDPR, escaneo QR de compromisos.
> - **Tres añadidos al scope original** — favoritos locales, asistencias, mis solicitudes.
>
> Documentación: 29 secciones en `docs/guia-desarrollo.md` cubriendo todas las decisiones técnicas.
>
> ### Cómo probarlo
>
> APK descargable desde Expo: https://expo.dev/accounts/jmtnez/projects/FetroApp/builds/<BUILD_ID>
>
> Pasos:
>
> 1. Abre el enlace desde un Android.
> 2. Botón "Install" → descarga el `.apk`.
> 3. Acepta "Instalar de origen desconocido" si lo pide.
> 4. Login con tus credenciales de Fatro o registra una cuenta de prueba.
>
> Para iOS necesitamos pasos adicionales (TestFlight) que no están aún configurados; lo dejaríamos para después.
>
> ### Decisiones que necesito de ti
>
> Para mover esto a Play Store en internal testing necesito tres puntos validados:
>
> 1. **Nombre comercial final**. Mi propuesta: mantener "FetroApp". El package ID Android está en `com.novicell.labs.fetroapp` para reflejar que es proyecto piloto de Novicell, no la app oficial corporativa.
> 2. **Cuenta Google Play Console**. Coste único de 25 USD. Mejor desde una cuenta de empresa de Novicell para que la titularidad sea clara.
> 3. **Política de privacidad pública**. Tengo un borrador en `docs/privacy-policy-draft.md` con Novicell Spain como responsable. Necesito que el DPO de Novicell lo valide y se publique en alguna subpágina del dominio (sugerido `novicell.es/legal/fetroapp-privacy`).
>
> ### Pendiente del proyecto (no bloqueante para el APK)
>
> - **Sesión interna de knowledge sharing** con el equipo. Te propongo agendarla cuando hayas tenido tiempo de revisar el APK.
> - Dos bugs de backend detectados en el plugin de Fatro durante el desarrollo (más detalle en `docs/` cuando los reportemos al equipo de Fatro).
> - Aclarar con Juan Luis qué son los "Registros" en su modelo, antes de implementar la última feature pendiente.
>
> ### Repo
>
> https://github.com/nezor11/fetro-app
>
> Cualquier feedback sobre la app, el flujo de despliegue o las decisiones técnicas es bienvenido.
>
> Un saludo,
> Jorge

---

## Versión C · Comentario en Productive (compacto, contexto del training)

Para añadir como comentario en la tarea **17099803 — WordPress backend training**.

```html
<h3>Primer APK de preview disponible</h3>

<p>El primer build interno de FetroApp ya está listo para revisión. Empaquetado con EAS Build, package <code>com.novicell.labs.fetroapp</code>.</p>

<h3>Descarga e instalación</h3>

<p>APK: <a href="https://expo.dev/accounts/jmtnez/projects/FetroApp/builds/<BUILD_ID>">expo.dev/.../builds/<BUILD_ID></a></p>
<ol>
<li>Abrir desde un Android.</li>
<li>Botón "Install" → descargar <code>.apk</code>.</li>
<li>Permitir "Instalar de origen desconocido".</li>
<li>Login con cuenta Fatro o crear una de prueba.</li>
</ol>

<h3>Estado del proyecto</h3>
<p>Todas las fases del scope original están ☑. Quedan abiertos solo:</p>
<ul>
<li>☐ Sesión interna de knowledge sharing</li>
<li>☐ Registros (pendiente de aclarar scope con Juan Luis)</li>
<li>☐ Reportar 2 bugs detectados en el backend</li>
</ul>

<h3>Decisiones que necesitamos de Marcelo</h3>
<ul>
<li>Validar nombre comercial "FetroApp" para Play Store</li>
<li>Crear cuenta Google Play Console (25 USD una vez) — sugerido en cuenta empresa Novicell</li>
<li>Publicar política de privacidad en URL pública (borrador en <code>docs/privacy-policy-draft.md</code>)</li>
</ul>

<p>Documentación completa: 29 secciones en <code>docs/guia-desarrollo.md</code>. Repo: <a href="https://github.com/nezor11/fetro-app">github.com/nezor11/fetro-app</a>.</p>
```

---

## Notas de uso

- **Sustituir `<BUILD_ID>` por el ID real** del build (ej. `b055c3d2-09c2-4202-8d19-f109afc26cac`) cuando esté disponible.
- Si el build #5 (`b055c3d2`) sigue en curso, espera a que termine antes de enviar.
- La versión A (Slack) es la más rápida y casual — usa esa si Marcelo es de Slack-DM rápido.
- La versión B (Email) es para dejar todo por escrito; útil si quieres documentación fuerte.
- La versión C (Productive) es para mantener la trazabilidad en la tarea del training.