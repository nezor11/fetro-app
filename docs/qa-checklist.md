# QA checklist · Validación post-instalación del APK

Lista navegable de **15 minutos** para validar que el APK descargado de EAS Build funciona bien antes de pasarlo a Marcelo o a más testers.

Diseñada para hacerse de un tirón. Si encuentras algo roto, marca el bullet con ⚠️ y describe brevemente al final del documento. No es necesario ejecutar todo — los **bullets ⭐ son críticos** y los demás son nice-to-have.

---

## 1. Instalación · 1 min

- ⭐ El APK se descarga sin error desde el link de EAS.
- ⭐ Android no bloquea la instalación (puede pedir "Permitir orígenes desconocidos" — concedido).
- ⭐ La app aparece en el cajón de aplicaciones con **icono morado y "F" blanca** (no el icono Expo genérico).
- ⭐ El nombre que aparece debajo del icono es **"FetroApp"** (el `name` de `app.json`).

## 2. Splash y arranque · 30s

- ⭐ Al abrir, splash screen morado con la "F" blanca centrada (~3s).
- ⭐ Tras el splash, aparece la pantalla de Login (usuario no logueado todavía).
- No hay errores de JavaScript visibles ni pantalla blanca prolongada.

## 3. Login · 1 min

- ⭐ El formulario acepta input. Probar con `jorge.test@novicell.es` / `FetroTest2026!`.
- ⭐ Tras pulsar "Entrar", la app navega a Home (Noticias) sin error.
- Botón "Olvidaste tu contraseña" lleva a la pantalla correspondiente.
- Botón "Crear cuenta" lleva al formulario de registro.

## 4. Bottom tab bar · 30s

- ⭐ Hay 5 pestañas visibles: 🏠 Noticias · 📂 Categorías · 💊 Productos · ⋯ Más · 👤 Perfil.
- ⭐ La pestaña activa cambia de color (morado).
- ⭐ Al tocar cada una, su pantalla carga sin errores.

## 5. Hub "Más" · 1 min

- ⭐ Tocar "⋯ Más" muestra **9 tiles**: 📚 Formación, 🏃 VetSICS, 👨‍⚕️ Consultas, 📝 Solicitudes, ❤️ Favoritos, 🎟️ Asistencias, 🗓️ Calendario, 📷 Escanear QR, 🔍 Buscar.
- Cada tile, al tocarlo, lleva a su pantalla correspondiente.
- El botón "atrás" del sistema vuelve al hub.

## 6. Detalle de noticia · 1 min

- ⭐ Desde Home, tocar cualquier noticia abre el detalle.
- El HTML del cuerpo se renderiza (texto, imágenes, etc.).
- Botón "Compartir" abre el share sheet del sistema.
- Botón ❤️ "Añadir a favoritos" funciona y la animación de "latido" se aprecia.

## 7. Detalle de carrera VetSICS · 1 min

- ⭐ Desde 🏃 VetSICS, tocar una carrera abre el detalle.
- Hero con imagen + chips de fecha/distancia visibles.
- HTML de descripción se renderiza.
- Botón ❤️ funciona.
- Botón "Inscríbete aquí" abre el alert pre-rellenado con la info de la carrera.

## 8. Calendario · 1 min

- ⭐ El calendario muestra el mes actual en español (lunes como primer día).
- ⭐ Días con eventos tienen dots de colores.
- ⭐ Tocar un día con dot rellena la lista inferior con esos eventos.
- ⭐ Tocar un evento de la lista navega al detalle correspondiente.

## 9. Escaneo QR · 2 min

- ⭐ Tocar 📷 Escanear QR pide permiso de cámara la primera vez.
- ⭐ El texto del prompt dice "FetroApp necesita acceso a la cámara para escanear códigos QR durante las pruebas." (no menciona "Fatro").
- ⭐ Concedido el permiso: cámara en vivo + marco blanco overlay.
- ⭐ Sin cámara, la entrada manual abajo: escribir `0001` y pulsar "Buscar" → navega a detalle de "taller gatos".
- Probar con código inexistente (`XYZ999`) → muestra alert "QR no reconocido".

## 10. Perfil · 1 min

- ⭐ Tab 👤 Perfil muestra los datos del user (nombre, email, etc.).
- Botón "✏️ Editar perfil" lleva al formulario.
- Botón "📦 Mis solicitudes" abre la pantalla de histórico.
- ⭐ Al final, debajo del botón "Cerrar sesión", hay enlace gris "Dar de baja mi cuenta".
- ⭐ Tocar ese enlace abre la pantalla de baja con icono ⚠️ y la fricción de escribir "BAJA".

## 11. Editar perfil · 2 min

- ⭐ El formulario carga los datos actuales.
- Modificar el nombre, pulsar "Guardar cambios".
- ⭐ Aparece alert "Perfil actualizado correctamente".
- ⭐ Al volver al Perfil, el nombre nuevo aparece en el header.

## 12. Favoritos · 30s

- En el detalle de cualquier noticia/producto/carrera tocar ❤️.
- ⭐ Ir a ⋯ Más → ❤️ Favoritos → el ítem marcado aparece con su tipo correcto.

## 13. Asistencias · 30s

- ⭐ Si el user no está inscrito en nada → empty state explicativo (📭 emoji).
- (Si tiene inscripciones reales) → secciones con cards.

## 14. Mis solicitudes · 30s

- ⭐ Igual que Asistencias: empty state si user es nuevo, listado si tiene actividad.

## 15. Logout · 30s

- ⭐ Botón "Cerrar sesión" lleva de vuelta a Login.
- ⭐ Volver a entrar con las mismas credenciales funciona.

---

## Notas

Si algo está marcado ⚠️, descríbelo aquí:

```
[ ] Lugar:
[ ] Qué pasa:
[ ] Qué esperabas:
[ ] Pasos para reproducir:
[ ] Modelo del móvil + Android version:
```

Si hay 0 bullets ⚠️ → la app está lista para enviar a Marcelo.

Si hay ⚠️ críticos (en bullets ⭐) → fix y volver a build antes de mandar.

Si hay ⚠️ no críticos → mandar el APK con nota "tengo X cosas pequeñas para arreglar en próxima iteración".