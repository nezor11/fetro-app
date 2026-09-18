# Play Console · Respuestas preparadas para Data Safety y Content Rating

Preparado el 2026-09-15 a partir del código de la app (`src/services/*`, permisos de `app.json`). Copiar y pegar al rellenar los formularios de Play Console. Revisar antes las dos notas del final.

---

## 1. Data Safety (Seguridad de los datos)

### Preguntas generales

| Pregunta | Respuesta | Por qué |
|---|---|---|
| ¿La app recoge o comparte alguno de los tipos de datos requeridos? | **Sí** | Registro y perfil envían datos personales al backend. |
| ¿Todos los datos del usuario se cifran en tránsito? | **Sí** | Todo va por HTTPS (`https://fatroiberica.es`). El proxy `localhost:3001` es solo desarrollo web. |
| ¿Ofrece la app una forma de solicitar el borrado de datos? | **Sí** | Pantalla "Baja de cuenta" dentro de la app (`unsubscribe_account`) y contacto por email. Play pide además una URL pública donde se explique: `https://nezor11.github.io/fetro-app/delete-account`. |
| ¿La app ha pasado una revisión de seguridad independiente (MASA)? | **No** | |

### Tipos de datos

Marcar solo estos. Para cada uno: **Recogido: Sí · Compartido: ver nota A · Procesamiento efímero: No · Obligatorio u opcional: según tabla · Finalidad: según tabla**.

| Categoría | Tipo | Obligatorio | Finalidad |
|---|---|---|---|
| Información personal | Nombre | Sí (registro) | Gestión de la cuenta |
| Información personal | Dirección de correo electrónico | Sí (registro) | Gestión de la cuenta, comunicaciones de la app |
| Información personal | Número de teléfono | Opcional (perfil) | Gestión de la cuenta, funciones de la app (formularios pre-rellenados) |
| Información personal | Dirección | Opcional (perfil) | Funciones de la app (envío de solicitudes de material) |
| Información personal | Otra información (empresa/entidad) | Opcional (perfil) | Funciones de la app |
| Actividad en la app | Otras acciones del usuario (inscripciones, solicitudes, QR escaneados) | Sí | Funciones de la app |

**No marcar**: ubicación, información financiera, salud, mensajes, fotos/vídeos, audio, archivos, calendario, contactos, historial de navegación, identificadores del dispositivo, datos de fallos/diagnóstico (no hay SDK de analítica ni de crashes).

### Datos que NO se recogen y por qué conviene saberlo

- **Cámara**: se usa para escanear QR, pero la imagen no se guarda ni se envía. En Data Safety no se declara "Fotos y vídeos".
- **Favoritos**: se guardan solo en el dispositivo (AsyncStorage). No salen del teléfono, no se declaran.
- **Cookie de sesión**: se guarda cifrada en el dispositivo (SecureStore). Es un identificador de sesión, no un identificador del dispositivo ni publicitario.

---

## 2. Content Rating (Clasificación de contenido)

Cuestionario IARC. Categoría de la app: **Utilidad, productividad, comunicación u otro**.

| Pregunta | Respuesta |
|---|---|
| ¿Violencia, sangre, contenido sexual, desnudos? | No |
| ¿Lenguaje soez o humor grosero? | No |
| ¿Referencias a drogas, alcohol o tabaco? | No |
| ¿Juegos de azar, apuestas simuladas? | No |
| ¿Contenido generado por usuarios visible para otros? | No (los formularios van a Fatro, no se publican) |
| ¿Interacción entre usuarios (chat, mensajería)? | No |
| ¿Comparte la ubicación del usuario con otros? | No |
| ¿Permite comprar bienes digitales? | No |
| ¿Contiene anuncios? | No |
| ¿Contenido médico o sanitario? | Ver nota B |

Resultado esperado: **PEGI 3 / Everyone**.

---

## 3. Otros campos de la ficha que piden lo mismo

- **Categoría de la app**: Negocios (o Medicina, ver nota B).
- **Público objetivo**: 18 y más. No marcar ninguna franja infantil; así se evita el cuestionario de "Familias".
- **Anuncios**: No contiene anuncios.
- **App de noticias**: No (aunque muestre noticias de Fatro, no es un medio).
- **Aplicaciones de salud**: declarar "No" salvo que se elija la categoría Medicina.

---

## Notas a revisar antes de enviar

**Nota A · "Compartido con terceros" → Sí.** Los datos los recibe el WordPress de Fatro Ibérica, y la política de privacidad publicada nombra a Fatro Ibérica como responsable del tratamiento, no como proveedor que actúa en nombre del desarrollador. Para Google eso es transferir datos a otra organización, así que en cada tipo de dato hay que marcar **Compartido: Sí** con finalidad "Funciones de la app". Así Data Safety y la política dicen lo mismo.

**Nota B · Contenido veterinario.** La app muestra productos veterinarios y consultas a especialistas. No es contenido médico para humanos ni ofrece diagnóstico, así que responder "No" a contenido sanitario y usar la categoría Negocios evita la revisión extra de apps de salud.
