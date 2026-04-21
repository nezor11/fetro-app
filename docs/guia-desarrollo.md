# Guía de Desarrollo - FetroApp

Esta guía documenta paso a paso cómo se construyó FetroApp, explicando las decisiones técnicas, por qué se hace cada cosa y cómo funciona internamente. El objetivo es que sirva como referencia de aprendizaje para construir apps móviles que consuman APIs de WordPress.

---

## Índice

1. [¿Por qué React Native y Expo?](#1-por-qué-react-native-y-expo)
2. [Setup del proyecto](#2-setup-del-proyecto)
3. [Estructura de carpetas](#3-estructura-de-carpetas)
4. [Navegación](#4-navegación)
5. [Servicios: conexión con WordPress REST API](#5-servicios-conexión-con-wordpress-rest-api)
6. [Pantalla Home: listado de posts](#6-pantalla-home-listado-de-posts)
7. [Detalle de Post: renderizado de HTML](#7-detalle-de-post-renderizado-de-html)
8. [Categorías: árbol jerárquico](#8-categorías-árbol-jerárquico)
9. [Lecciones aprendidas](#9-lecciones-aprendidas)

---

## 1. ¿Por qué React Native y Expo?

### El problema
Queremos una app móvil que consuma datos de un WordPress existente (Fatro Ibérica). Las opciones eran:

| Opción | Pros | Contras |
|---|---|---|
| **React Native + Expo** | Una codebase para Android + iOS, reutilizamos JS/TS, Expo simplifica el setup | Performance ligeramente inferior a nativo |
| Flutter | Buen rendimiento, UI bonita | Hay que aprender Dart, stack completamente nuevo |
| Kotlin (Android) | Rendimiento nativo | Solo Android, más curva de aprendizaje |
| Swift (iOS) | Rendimiento nativo | Solo iOS, necesita Mac |

### ¿Por qué elegimos React Native + Expo?
- **JavaScript/TypeScript**: Alineado con el objetivo del CDS de "liderar proyectos en stack JavaScript como full-stack"
- **Cross-platform**: Una sola codebase genera app para Android, iOS y web
- **Expo**: Simplifica enormemente el desarrollo — no necesitas Android Studio ni Xcode para empezar. Con Expo Go puedes probar en tu móvil al instante
- **Ecosistema**: React Navigation, Axios y miles de librerías ya probadas

---

## 2. Setup del proyecto

### Crear el proyecto
```bash
npx create-expo-app@latest FatroApp --template blank-typescript
```

**¿Por qué `blank-typescript`?** Porque TypeScript nos da:
- Autocompletado en el editor
- Errores detectados antes de ejecutar
- Mejor documentación del código (los tipos actúan como documentación)

### Instalar dependencias
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context axios react-native-render-html
```

Cada dependencia tiene un propósito:

| Paquete | Para qué sirve |
|---|---|
| `@react-navigation/native` | Librería base de navegación en React Native |
| `@react-navigation/native-stack` | Navegación tipo "pila" (push/pop de pantallas) |
| `@react-navigation/bottom-tabs` | Barra de pestañas inferior |
| `react-native-screens` | Optimización nativa de pantallas (requerido por React Navigation) |
| `react-native-safe-area-context` | Manejo de áreas seguras (notch, barra de estado) |
| `axios` | Cliente HTTP para llamar a la API de WordPress |
| `react-native-render-html` | Renderizar HTML de WordPress como componentes nativos |

### Dependencias web (para probar en Chrome)
```bash
npx expo install react-dom react-native-web @expo/metro-runtime
```
Expo soporta web como plataforma adicional. Estas dependencias permiten que la app corra en el navegador durante el desarrollo.

---

## 3. Estructura de carpetas

```
src/
├── components/    → Componentes reutilizables (PostCard, etc.)
├── constants/     → Valores constantes (URL de la API, colores, etc.)
├── navigation/    → Configuración de rutas y navegación
├── screens/       → Pantallas de la app (una por vista)
└── services/      → Lógica de conexión con la API
```

### ¿Por qué esta estructura?
Sigue el principio de **separación de responsabilidades**:

- **`services/`** solo hablan con la API. No saben nada de UI.
- **`screens/`** son las vistas. Usan services para obtener datos y components para mostrarlos.
- **`components/`** son piezas de UI reutilizables. No saben de dónde vienen los datos.
- **`constants/`** centraliza valores que se repiten (colores, URLs). Si cambias la URL de la API, solo tocas un archivo.
- **`navigation/`** define cómo el usuario se mueve entre pantallas.

---

## 4. Navegación

### Tipos de navegación usados

**Stack Navigator** (pila): Como una pila de cartas. Cuando abres un detalle, se "apila" encima del listado. El botón "atrás" quita la carta de arriba.

```
[Home] → tap en post → [Home, PostDetail] → atrás → [Home]
```

**Bottom Tabs** (pestañas): Las 4 pestañas inferiores. Siempre visibles, cada una mantiene su propio estado.

### Arquitectura de navegación

```
RootNavigator (Stack)
├── MainTabs (Bottom Tabs)  ← headerShown: false (los tabs manejan su propio header)
│   ├── Home (Noticias)
│   ├── Categories (Categorías)
│   ├── Products (Productos)
│   └── Search (Buscar)
├── PostDetail              ← Se apila sobre cualquier tab
└── CategoryPosts           ← Se apila sobre cualquier tab
```

### ¿Por qué Stack envuelve a Tabs?
Porque queremos que `PostDetail` y `CategoryPosts` se abran "encima" de los tabs, ocultando la barra inferior. Si estuvieran dentro de los tabs, la barra seguiría visible.

### Tipado de navegación (types.ts)
```typescript
export type RootStackParamList = {
  MainTabs: undefined;              // No recibe parámetros
  PostDetail: { postId: number };   // Recibe el ID del post
  CategoryPosts: { categoryId: number; categoryName: string };
};
```

**¿Por qué tipar la navegación?** Para que TypeScript nos avise si:
- Navegamos a una pantalla que no existe
- Olvidamos pasar un parámetro requerido
- Pasamos un parámetro del tipo incorrecto

---

## 5. Servicios: conexión con WordPress REST API

### Instancia de Axios (`services/api.ts`)
```typescript
const api = axios.create({
  baseURL: 'https://fatroibericas.sg-host.com/wp-json/wp/v2',
  timeout: 10000,
});
```

**¿Por qué crear una instancia?** En vez de repetir la URL base en cada llamada, la configuramos una vez. Si mañana cambia el dominio, solo modificamos `constants/api.ts`.

### La REST API de WordPress

WordPress expone automáticamente una API REST en `/wp-json/wp/v2/`. Esto es lo que la hace ideal como **headless CMS**: los datos están separados de la presentación.

#### Endpoints que usamos

**Posts**: `GET /posts`
```
?page=1&per_page=10    → Paginación
?categories=89          → Filtrar por categoría
?search=texto           → Buscar
?_embed=true            → ⭐ Incluir datos relacionados
```

**¿Qué hace `_embed=true`?**
Sin `_embed`, un post devuelve `featured_media: 336341` (solo el ID). Con `_embed`, WordPress incluye los datos completos del media, autor y categorías en `_embedded`. Esto evita hacer llamadas extra por cada post.

#### Paginación
WordPress devuelve info de paginación en los **headers HTTP** (no en el body):
```
X-WP-Total: 45        → Total de posts
X-WP-TotalPages: 5    → Total de páginas
```

Por eso en `posts.ts` leemos:
```typescript
totalPages: parseInt(response.headers['x-wp-totalpages'] || '1', 10),
total: parseInt(response.headers['x-wp-total'] || '0', 10),
```

### Interfaces TypeScript

```typescript
export interface WPPost {
  id: number;
  title: { rendered: string };   // WordPress envuelve strings en { rendered: "" }
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;         // ID de la imagen, no la URL
  categories: number[];           // Array de IDs
  // ...
}
```

**¿Por qué `{ rendered: string }` y no solo `string`?** Porque WordPress puede devolver contenido en formato "raw" (sin HTML) o "rendered" (con HTML). La API por defecto solo devuelve `rendered` a usuarios no autenticados.

---

## 6. Pantalla Home: listado de posts

### Conceptos clave implementados

#### FlatList vs ScrollView
Usamos `FlatList` en vez de `ScrollView` porque:
- **FlatList** solo renderiza los items visibles en pantalla (virtualización)
- **ScrollView** renderiza TODOS los items → con muchos posts, la app se congelaría
- `FlatList` soporta paginación y pull-to-refresh nativamente

#### Pull-to-refresh
```tsx
<FlatList
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
/>
```
El usuario arrastra hacia abajo → se recarga la página 1 → los datos se reemplazan.

#### Scroll infinito (paginación)
```tsx
<FlatList
  onEndReached={onEndReached}     // Se ejecuta al llegar al final
  onEndReachedThreshold={0.5}     // Se activa cuando queda 50% por scrollear
/>
```
Al llegar al final → cargamos `page + 1` → los nuevos posts se **añaden** (no reemplazan).

#### Patrón de estado
```typescript
const [posts, setPosts] = useState<WPPost[]>([]);     // Datos
const [page, setPage] = useState(1);                    // Página actual
const [loading, setLoading] = useState(true);           // Carga inicial
const [refreshing, setRefreshing] = useState(false);    // Pull-to-refresh
const [loadingMore, setLoadingMore] = useState(false);  // Cargando más
```

Cada estado controla una parte diferente de la UI. Esto permite mostrar un spinner grande al inicio, un spinner pequeño al cargar más, y el indicador de refresh al tirar hacia abajo.

### PostCard: componente reutilizable

**¿Por qué un componente separado?** Porque la tarjeta de post se usa en:
- Home (listado general)
- CategoryPosts (listado filtrado por categoría)
- Search (resultados de búsqueda)

Si cambiamos el diseño, solo tocamos `PostCard.tsx`.

#### Decodificación de HTML entities
```typescript
function decodeHtmlEntities(text: string): string {
  return text.replace(/&amp;/g, '&').replace(/&hellip;/g, '…') // ...
}
```
WordPress envía títulos con HTML entities (`&amp;` en vez de `&`). Hay que decodificarlos antes de mostrarlos como texto nativo.

#### Imagen destacada desde `_embedded`
```typescript
function getFeaturedImageUrl(post: WPPost): string | null {
  const embedded = (post as any)._embedded;
  return embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
}
```
Gracias a `_embed=true`, la imagen está en `_embedded['wp:featuredmedia'][0]`. Usamos optional chaining (`?.`) porque no todos los posts tienen imagen.

---

## 7. Detalle de Post: renderizado de HTML

### El reto
WordPress devuelve contenido como **HTML** (`<p>`, `<strong>`, `<img>`, etc.). React Native no tiene un navegador integrado — no entiende HTML directamente.

### Soluciones posibles

| Opción | Pros | Contras |
|---|---|---|
| `react-native-render-html` | Renderiza como componentes nativos, personalizable | Puede fallar con HTML muy complejo |
| `WebView` | Renderiza HTML perfecto (es un mini navegador) | Se siente menos nativo, más pesado |
| Parsear manualmente | Control total | Mucho trabajo, propenso a errores |

Elegimos **react-native-render-html** porque convierte el HTML en componentes nativos de React Native, lo cual es más rápido y se siente más integrado.

```tsx
<RenderHtml
  contentWidth={width - 32}     // Ancho disponible para el contenido
  source={{ html: post.content.rendered }}
  tagsStyles={{                  // Estilos personalizados por tag HTML
    p: { color: '#333', fontSize: 16, lineHeight: 26 },
    a: { color: '#0056A6' },
  }}
/>
```

### Datos adicionales del post
Con `_embed=true`, extraemos:
- **Autor**: `_embedded.author[0].name`
- **Categorías**: `_embedded['wp:term'][0]` (array de categorías)
- **Imagen**: `_embedded['wp:featuredmedia'][0].source_url`

Todo esto evita hacer 3 llamadas extra a la API por cada post.

### Share API
```typescript
await Share.share({
  message: `${title} - ${post.link}`,
});
```
React Native proporciona `Share` para usar el sistema nativo de compartir (WhatsApp, email, etc.).

---

## 8. Categorías: árbol jerárquico

### Cómo WordPress estructura las categorías

Las categorías en WordPress tienen un campo `parent`:
```json
{ "id": 102, "name": "Analgesia", "parent": 400 }
{ "id": 400, "name": "Animales de compañía", "parent": 0 }
```
`parent: 0` = categoría raíz. `parent: 400` = es hija de "Animales de compañía".

### Construir el árbol
La API devuelve una lista plana. Nosotros construimos el árbol:

```typescript
function buildTree(categories): CategoryNode[] {
  // 1. Crear un mapa id → nodo
  // 2. Para cada nodo: si parent=0 → raíz, si no → hijo del parent
  // 3. Filtrar: solo mostrar ramas que tengan posts reales
}
```

### El problema del `count`
WordPress reporta `count: 8` para una categoría, pero ese número incluye **todos los post types** (posts, productos, consultas, etc.). Nosotros solo queremos posts del tipo `post`.

**Solución**: Para cada categoría, hacemos una llamada a `/posts?categories=ID&per_page=1` y leemos el header `X-WP-Total` para saber cuántos posts reales tiene.

```typescript
const result = await getPosts(1, 1, cat.id);  // Solo 1 resultado
return { ...cat, postCount: result.total };     // Pero obtenemos el total real
```

**Trade-off**: Esto hace muchas llamadas a la API (una por categoría). En un proyecto real, crearíamos un endpoint custom en WordPress que devuelva los counts correctos en una sola llamada. Aquí lo aceptamos porque es un proyecto de formación y las categorías no cambian frecuentemente.

---

## 9. Lecciones aprendidas

### WordPress como headless CMS
- La REST API estándar de WordPress es muy completa y bien documentada
- `_embed=true` es esencial para reducir el número de llamadas a la API
- Los headers de paginación (`X-WP-Total`, `X-WP-TotalPages`) son clave
- El `count` de categorías incluye todos los post types, lo cual puede confundir
- El contenido viene como HTML, hay que decidir cómo renderizarlo

### React Native / Expo
- Expo simplifica enormemente el setup inicial
- `FlatList` es fundamental para rendimiento con listas largas
- React Navigation separa bien la navegación por tipos (Stack, Tabs)
- TypeScript + tipos de navegación previenen muchos bugs
- Expo Go permite probar en dispositivo real sin compilar

### Arquitectura
- Separar services, screens y components facilita el mantenimiento
- Los componentes reutilizables (PostCard) ahorran duplicación
- Centralizar constantes (API URL, colores) permite cambios rápidos
- Tipar las respuestas de la API documenta la estructura de datos

---

# Fase 2 — Autenticación

En esta fase ampliamos la app con un sistema de autenticación completo: login, registro, recuperación de contraseña, perfil de usuario y cierre de sesión. También introducimos un proxy local para salvar restricciones de CORS durante el desarrollo en web.

## 10. Elección del mecanismo de autenticación

WordPress ofrece varias alternativas para autenticar peticiones desde una app externa. Las evaluamos antes de elegir:

### Application Passwords
- **Qué es**: Sistema nativo de WordPress (desde 5.6) que genera contraseñas específicas por aplicación.
- **Problema**: Funciona con Basic Auth (usuario + contraseña en cada petición). Está pensado para integraciones server-to-server, no para autenticación de usuarios finales desde un cliente móvil.
- **Descartado**: No queremos exponer credenciales en cada request ni pedir al usuario que genere una app password desde `wp-admin`.

### JWT Authentication (plugin)
- **Qué es**: Plugin que añade endpoints para generar tokens JWT firmados.
- **Problema**: Requiere instalar otro plugin en el WordPress de Fatro, mantener un secreto en el servidor, y gestionar expiración/refresh de tokens.
- **Descartado**: Añadir más dependencias al backend cuando ya existe una alternativa funcionando.

### Plugin `json-api-user` (elegido)
- **Qué es**: Plugin custom editado por el equipo Fatro que expone endpoints REST sobre las funciones de autenticación nativas de WordPress (`wp_authenticate`, `wp_set_auth_cookie`, etc.).
- **Ventajas**:
  - Ya está instalado y mantenido (v3.0.2 a fecha de abril 2026).
  - Devuelve una cookie de WordPress válida que también sirve para futuras funcionalidades server-side (por ejemplo, si en el futuro mostramos contenido restringido).
  - Tiene endpoints específicos para registro, recuperación de contraseña, validación de cookie, datos de usuario (`get_currentuserinfo`, `get_userinfo`).
  - El equipo lo ha estado mejorando para paridad con apps móviles.

**Conclusión**: Usamos `json-api-user` con cookie de sesión persistida en `AsyncStorage`.

---

## 11. Capa de servicios de autenticación

Todo el código de autenticación vive en `src/services/auth.ts`. Es la única capa que habla con el servidor; el resto de la app consume esto a través del `AuthContext`.

### URL base condicional según plataforma

```typescript
const AUTH_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3001'
    : 'https://fatroibericas.sg-host.com';
```

**Por qué**: El navegador bloquea por CORS las peticiones a otro dominio si el servidor no devuelve `Access-Control-Allow-Origin`. El plugin `json-api-user` no envía esa cabecera, así que en web redirigimos por un proxy local. En móvil nativo no hay CORS, así que vamos directos. Esto se explica en detalle más abajo.

### Funciones expuestas

| Función | Endpoint WordPress | Uso |
|---------|-------------------|-----|
| `login(email, password)` | `POST /api/user/generate_auth_cookie/` | Valida credenciales, devuelve cookie + datos del usuario |
| `register(user, email, pass, displayName, nonce)` | `POST /api/user/register/` | Crea un usuario nuevo |
| `getNonce()` | `GET /api/get_nonce/?controller=user&method=register` | Obtiene un nonce WP requerido por `register` |
| `retrievePassword(email)` | `POST /api/user/retrieve_password/` | Envía un email de reseteo con el enlace estándar de WP |
| `validateCookie(cookie)` | `GET /api/user/validate_auth_cookie/?cookie=...` | Comprueba si la cookie guardada sigue siendo válida al iniciar la app |
| `getStoredAuth()` | — | Lee `AsyncStorage` y valida la cookie contra el servidor |
| `clearAuth()` | — | Limpia `AsyncStorage` al hacer logout |

### Persistencia en AsyncStorage

Guardamos dos claves:
- `@fetro_auth_cookie` — la cookie devuelta por WordPress
- `@fetro_auth_user` — los datos del usuario serializados en JSON

```typescript
await AsyncStorage.setItem('@fetro_auth_cookie', response.data.cookie);
await AsyncStorage.setItem('@fetro_auth_user', JSON.stringify(response.data.user));
```

**Por qué AsyncStorage**: Es el almacenamiento estándar en React Native, funciona igual en Android, iOS y web (usa `localStorage` bajo el capó en web). No guardamos la contraseña, solo la cookie de sesión.

### Manejo de errores

Todos los métodos pasan por `handleNetworkError()` que distingue tres casos:
1. **Sin respuesta** (problema de red/CORS) → mensaje específico en web diciendo que prueben desde móvil.
2. **Respuesta con error del servidor** (credenciales inválidas, email duplicado, etc.) → propagamos el mensaje devuelto por el plugin.
3. **Error desconocido** → mensaje genérico.

---

## 12. Estado global con React Context

Para que cualquier pantalla pueda saber si el usuario está autenticado y para poder hacer login/logout desde cualquier sitio, usamos el patrón **Context + Hook personalizado**.

### `src/context/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: UserData | null;
  cookie: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email, password) => Promise<void>;
  logout: () => Promise<void>;
}
```

**Qué hace el `AuthProvider`**:
1. **Al montar**: llama a `getStoredAuth()` que lee la cookie de `AsyncStorage` y la valida contra el servidor. Si es válida, restaura la sesión. Si no, limpia el storage.
2. Durante esa comprobación inicial, `isLoading = true` → el `RootNavigator` muestra un spinner.
3. Expone `login()` y `logout()` que actualizan el estado global.

**Por qué no Redux o Zustand**: Para este caso (estado de auth, pocas actualizaciones, estructura simple), Context es más que suficiente y sin dependencias extra. Si el estado creciera mucho (carrito de productos, preferencias, múltiples contextos), valoraríamos una librería de estado.

### Hook `useAuth()`

```typescript
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

Cualquier pantalla consume el auth así:
```typescript
const { user, isLoggedIn, login, logout } = useAuth();
```

El `throw` si no hay provider es una defensa: si alguien intenta usar el hook fuera del `<AuthProvider>`, falla ruidosamente en desarrollo en vez de devolver `null` y fallar silenciosamente más tarde.

---

## 13. Navegación condicional

El `RootNavigator` decide qué pantallas mostrar según el estado de autenticación:

```tsx
{isLoggedIn ? (
  <>
    <Stack.Screen name="MainTabs" component={BottomTabs} />
    <Stack.Screen name="PostDetail" ... />
    <Stack.Screen name="CategoryPosts" ... />
    <Stack.Screen name="ProductDetail" ... />
  </>
) : (
  <>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </>
)}
```

**Por qué dos stacks separados y no uno solo**:
- **Seguridad**: Si el stack de auth solo contiene Login/Register/ForgotPassword, es imposible navegar a MainTabs sin estar logueado (ni siquiera con un deep link).
- **Claridad de flujo**: Cuando haces `logout()`, React Navigation desmonta automáticamente todas las pantallas del stack anterior y muestra Login. No hay que hacer `reset` manual.
- **Animaciones limpias**: El cambio entre auth y app se anima como un switch de stack, no como un push/pop dentro del mismo stack.

### Pestaña "Perfil"

Cuando `isLoggedIn`, las BottomTabs incluyen cinco pestañas: Noticias, Categorías, Productos, Buscar, **Perfil**. El `ProfileScreen` muestra los datos del usuario (nombre, email, avatar, rol) y el botón de "Cerrar sesión".

---

## 14. Proxy CORS para desarrollo web

### El problema

En el navegador, las peticiones AJAX a otro dominio están sujetas a la política **CORS** (Cross-Origin Resource Sharing). Si el servidor no envía `Access-Control-Allow-Origin`, el navegador cancela la petición antes de que el código JavaScript pueda leer la respuesta.

El endpoint `/api/user/` del plugin `json-api-user` **no tiene CORS habilitado** (está pensado para ser consumido desde el propio WordPress o desde apps nativas).

**En móvil nativo no hay CORS**: Android e iOS no aplican esa restricción porque no es un navegador.

### La solución: proxy local

Creamos un pequeño servidor Node (`proxy-server.js`) que:
1. Escucha en `http://localhost:3001`.
2. Recibe cada petición de la app y la reenvía tal cual a `https://fatroibericas.sg-host.com`.
3. Añade la cabecera `Access-Control-Allow-Origin: *` en la respuesta.
4. Maneja el preflight `OPTIONS` que el navegador envía antes de un POST.

Sin dependencias externas (solo módulos nativos `http` y `https`). Se arranca con:

```bash
node proxy-server.js
```

Y la app, gracias a `Platform.OS === 'web'`, apunta a `localhost:3001` en lugar de al dominio real cuando se ejecuta en Chrome.

### ¿Por qué no añadir CORS al plugin?

Podríamos editar el plugin `json-api-user` y añadir `header('Access-Control-Allow-Origin: *')`. Pero:
- Es código de producción compartido con la web pública.
- Poner `*` en producción es una decisión de seguridad que no corresponde tomar aquí sin consultar al equipo Fatro.
- El proxy es una solución **solo para desarrollo local**; en producción la app móvil se empaqueta para Android/iOS (Expo Build) y no pasa por CORS.

---

## 15. Flujo completo de login paso a paso

1. **Arranque de la app**:
   - `AuthProvider` se monta → `isLoading = true` → `RootNavigator` muestra spinner.
   - `getStoredAuth()` lee cookie y user de `AsyncStorage`.
   - Si hay cookie, llama a `validateCookie()` contra el servidor.
   - Si es válida: `isLoggedIn = true` → se muestran las BottomTabs.
   - Si no: se borra el storage y se muestra LoginScreen.

2. **El usuario introduce email y contraseña y pulsa "Entrar"**:
   - `LoginScreen` llama a `login(email, password)` del context.
   - El context llama a `loginService()` de `auth.ts`.
   - `auth.ts` hace `POST /api/user/generate_auth_cookie/` (a través del proxy si es web).
   - WordPress valida las credenciales y devuelve `{ status: 'ok', cookie: '...', user: {...} }`.
   - `auth.ts` guarda cookie y user en `AsyncStorage`.
   - El context actualiza el estado → `isLoggedIn = true`.
   - React Navigation automáticamente cambia al stack de MainTabs.

3. **El usuario usa la app normalmente** (Home, Perfil, etc.). Los datos del usuario están accesibles desde cualquier pantalla con `useAuth()`.

4. **El usuario pulsa "Cerrar sesión"** en Perfil:
   - Se llama a `logout()` del context.
   - `clearAuth()` borra las dos claves de `AsyncStorage`.
   - El context pone `isLoggedIn = false`.
   - React Navigation muestra LoginScreen automáticamente.

---

## 16. Lecciones aprendidas de la Fase 2

### Autenticación
- WordPress ofrece varias opciones; elegir la adecuada depende del contexto. No siempre es JWT.
- Una cookie de sesión + AsyncStorage es una solución simple y válida para apps móviles que hablan con WordPress.
- Validar la sesión al arranque evita que el usuario vea contenido como logueado si la cookie ha caducado en el servidor.

### CORS
- CORS es una restricción **del navegador**, no del servidor. En móvil nativo no existe.
- En desarrollo web, un proxy local es la forma más limpia de evitarlo sin tocar producción.
- Nunca poner `Access-Control-Allow-Origin: *` en endpoints de auth en producción sin pensarlo.

### React Context
- Es suficiente para estado global pequeño y poco cambiante (auth, tema, idioma).
- Para estado grande o con actualizaciones frecuentes (datos de negocio), mejor una librería especializada.
- El patrón "crear un hook personalizado que valida el context" da muy buenos errores en desarrollo.

### Navegación
- Separar stacks de auth y app principal es más seguro y más claro que un stack único.
- React Navigation maneja automáticamente el swap de stacks cuando cambia el estado condicional.

### TypeScript
- Tipar la respuesta del servidor (`LoginResponse`, `UserData`, etc.) evita accesos a propiedades inexistentes.
- Tipar el `RootStackParamList` evita typos en los `navigation.navigate()`.

---

## 17. Cómo arrancar el entorno completo

```bash
# Terminal 1 — Proxy CORS (solo si pruebas en web)
cd FatroApp
node proxy-server.js

# Terminal 2 — Expo
cd FatroApp
npx expo start

# Desde Expo puedes:
#   w  → abrir en web (requiere proxy activo)
#   a  → abrir en emulador Android
#   i  → abrir en emulador iOS
#   Escanear el QR con Expo Go en tu móvil físico
```

**Credenciales de prueba**:
- Email: `jorge.test@novicell.es`
- Contraseña: `FetroTest2026!`

---

## 18. VetSICS: carreras y eventos deportivos

### El contexto

Fatro patrocina carreras populares (las "VetSICS"). En el WordPress existe el endpoint `/api/user/get_vetsics/` (del plugin `json-api-user`) que devuelve todas las carreras registradas en un post type custom. El equipo quiere que la app muestre:

- Listado dividido en **próximas** y **pasadas**
- Detalle de cada carrera con descripción HTML, fechas, distancias, info práctica
- Un CTA de **inscripción** (placeholder ahora, formulario real más adelante)

### La respuesta del endpoint

Cada carrera viene con la estructura típica de un post de WP ampliada con un array de `meta`:

```json
{
  "ID": "1234",
  "post_title": "Maratón de Zaragoza 2026",
  "post_content": "<p>HTML largo...</p>",
  "post_excerpt": "<p>HTML corto para la tarjeta...</p>",
  "post_date": "2026-01-15 10:00:00",
  "thumb_url": "https://...jpg",
  "app_img": null,
  "meta": [
    { "meta_key": "run_sponsored_select", "meta_value": "15/02/2026" },
    { "meta_key": "distancias", "meta_value": "5k, 10k, 21k" },
    { "meta_key": "texto_boton_formulario", "meta_value": "Inscríbete aquí" },
    { "meta_key": "id_formulario", "meta_value": "7" },
    ...
  ]
}
```

El array `meta` es **caótico**: las fechas pueden estar en 6 campos distintos, con 2 formatos distintos (`DD/MM/YYYY` o `"15 de Febrero de 2026"`). Las distancias vienen como string con comas. El estado "agotadas" hay que detectarlo leyendo el texto del botón y buscando "agotad".

### Helpers para domar el `meta` array

La clave de `src/services/vetsics.ts` son los helpers que normalizan esa estructura:

```typescript
// Busca una clave concreta en el array de meta
export function getMetaValue(meta: VetsicsMeta[], key: string): string {
  const entry = meta.find((m) => m.meta_key === key);
  return entry?.meta_value ?? '';
}

// Extrae la fecha intentando varias fuentes, en orden
export function getRaceDate(race: VetsicsRace): Date | null {
  const sources = [
    getMetaValue(race.meta, 'run_sponsored_select'),
    getMetaValue(race.meta, 'titulo_del_bloque'),
    getMetaValue(race.meta, 'indications'),
    getMetaValue(race.meta, 'more_info'),
    race.post_excerpt,
    race.post_title,
  ];

  for (const source of sources) {
    // DD/MM/YYYY
    const m1 = source.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1]);
    // "15 de Febrero de 2026"
    const m2 = source.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
    if (m2) { /* mapeo de meses en español */ }
  }
  return null;
}

// Separa en futuras/pasadas; si no hay fecha, se considera futura (conservador)
export function categorizeRaces(races: VetsicsRace[]) {
  const now = new Date();
  const future: VetsicsRace[] = [];
  const past: VetsicsRace[] = [];
  for (const r of races) {
    const date = getRaceDate(r);
    if (!date || date >= now) future.push(r);
    else past.push(r);
  }
  return { future, past };
}
```

**Decisión importante**: si no conseguimos parsear ninguna fecha de una carrera, la metemos en "Próximas". Es más seguro que enterrarla en pasadas, porque el usuario al menos la ve.

### Listado con `SectionList` en vez de `FlatList`

Como tenemos dos grupos con cabecera (Próximas / Pasadas), lo idiomático en React Native es usar `SectionList`, no una `FlatList` con un `renderItem` custom que imite grupos:

```tsx
<SectionList
  sections={sections}
  keyExtractor={(item) => item.ID}
  renderItem={({ item }) => (
    <VetsicsCard race={item} onPress={() => navigation.navigate(...)} />
  )}
  renderSectionHeader={({ section }) => (
    <View style={styles.sectionHeader}>
      <Text>{section.emoji} {section.title}</Text>
      <Text>{section.data.length} carreras</Text>
    </View>
  )}
  stickySectionHeadersEnabled={false}
/>
```

`stickySectionHeadersEnabled={false}` porque con el bottom tab bar + el header superior no queremos que la cabecera se pegue mientras se scrollea (ruido visual).

### Render de HTML en el detalle

La descripción, información práctica y otros campos vienen como HTML desde WordPress. Usamos `react-native-render-html`:

```tsx
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

const { width } = useWindowDimensions();

<RenderHtml
  contentWidth={width - SPACING.md * 2}
  source={{ html: description }}
  baseStyle={styles.htmlBase}
/>
```

`contentWidth` es obligatorio para que la librería sepa cuánto ocupan las imágenes.

### Alerts que funcionen en web y en móvil

El CTA de inscripción muestra de momento un mensaje placeholder. `Alert.alert` de `react-native` **no funciona en React Native Web**, silenciosamente. Solución cross-platform:

```tsx
import { Platform, Alert } from 'react-native';

const handleInscribirme = () => {
  const title = 'Inscripción';
  const message = 'Próximamente: inscripción online...';
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};
```

Cuando integremos el formulario real, esto se sustituirá por `navigation.navigate('VetsicsInscripcion', { raceId, formId })`.

### Pendiente para la siguiente iteración

- **Formulario real de inscripción**: el backend expone `id_formulario` por carrera. Hay que investigar qué endpoint del plugin consume ese form y qué campos espera.
- **Refactor del bottom tab bar**: ya tenemos 7 pestañas. Cuando añadamos Consultas y Solicitudes vamos a ir a 9. Hay que agruparlas en un hub "Más" (hay un `TODO` en `navigation/types.ts`).
- **Imágenes fallback**: algunas carreras antiguas no tienen `thumb_url` ni `app_img`. Ahora mostramos un placeholder con emoji 🏃, pero convendría una imagen genérica de marca.

### Lecciones aprendidas

- **No confíes en la estructura del `meta` de WordPress**. Plugins distintos lo escriben con convenciones distintas. Escribe helpers que toleren ausencias y formatos varios.
- **`SectionList` existe por algo**. No reinventes las cabeceras de sección con una `FlatList`.
- **`Alert.alert` no es cross-platform** en React Native Web. Si quieres feedback inmediato, combínalo con `window.alert` vía `Platform.OS`.
- **Parseo de fechas defensivo**: tener una cadena de fallbacks (meta_1 → meta_2 → excerpt → title) es más robusto que fallar si falta un campo concreto. El coste es regex un poco más laxo.

---

## 19. Consultas: directorio de especialistas veterinarios

### El contexto

Fatro tiene un equipo de especialistas (dermatología, oncología, medicina felina, traumatología, parasitología…) al que los profesionales veterinarios pueden plantear consultas técnicas. En WordPress existe un CPT `consulta` (cada post es la **ficha** de un especialista, no una consulta enviada) agrupado por una taxonomía `especialidad`.

El endpoint del plugin que lo expone es `/api/user/get_specialities/`. **Nota importante**: el nombre del endpoint es `get_specialities` pero el CPT se llama `consulta`. Saberlo ahorra media hora de buscar endpoints que no existen (como me pasó a mí).

### Lo que no existe (todavía)

El plugin **no tiene** un endpoint para registrar consultas enviadas por el usuario (algo tipo `post_consulta` o `save_query`). Eso significa que en esta fase del MVP:

- La app actúa como **directorio de contacto**.
- El botón "Contactar con el especialista" abre un `mailto:` al buzón de Fatro con asunto y cuerpo pre-rellenados.
- Cuando el backend exponga un endpoint real, se sustituye el `mailto:` por navegación a una pantalla `ConsultaForm` que POST-ee al endpoint.

Documentamos este placeholder con un TODO claro en `ConsultaDetailScreen.tsx` para que quien lo retome no tenga que arqueologizar.

### Estructura del response

```json
{
  "status": "ok",
  "specialities": {
    "speciality_anico": [ {...}, {...} ],
    "speciality_gan": [ {...} ],
    "speciality_por": [ {...} ],
    "speciality_avicultura": [],
    "speciality_cunicultura": [],
    "speciality_equino": [],
    "speciality_ovino-caprino": [],
    "speciality_vetsics": []
  }
}
```

El backend siempre devuelve **las ocho claves**, pongas o no especialistas dentro. La app filtra las vacías en `buildSpecialityGroups()`.

Cada especialista tiene esta forma (todos los campos son string, incluso los ids):

```typescript
interface Specialist {
  specialist_img: string;   // id de media (como string)
  thumb_url: string;        // URL de la imagen
  speciality: string;       // título del post: "Traumatología", "Oncología"...
  specialist_name: string;  // "Nacho Calvo"
  specialist_cv: string;    // CV corto ("LV, PhD, CertSAS, DipECVS...")
  specialist_slug: string;  // slug único dentro del grupo
  more_info: string;        // opcional, puede venir vacío
  interes: string;          // id de categoría principal
  linea_negocio: 'ANICO' | 'GANADERIA';
  category: string;         // etiqueta legible ("Animales de compañía")
}
```

### Agrupar y ordenar los grupos

Como la API nos devuelve un mapa con claves tipo `speciality_anico`, conviene normalizarlo a una lista de grupos con título humano y emoji. Eso se hace en el servicio, no en la pantalla:

```typescript
const GROUP_PRIORITY: Record<string, number> = {
  speciality_anico: 0,
  speciality_gan: 1,
  speciality_por: 2,
  speciality_equino: 3,
  'speciality_ovino-caprino': 4,
  speciality_avicultura: 5,
  speciality_cunicultura: 6,
};

export function buildSpecialityGroups(map) {
  const groups = [];
  for (const [key, arr] of Object.entries(map)) {
    if (!arr || arr.length === 0) continue;  // filtra vacíos
    groups.push({
      key,
      title: arr[0].category || prettifyKey(key),
      emoji: getCategoryEmoji(arr[0].linea_negocio, arr[0].category),
      specialists: arr,
    });
  }
  groups.sort((a, b) => {
    const pa = GROUP_PRIORITY[a.key] ?? 100;
    const pb = GROUP_PRIORITY[b.key] ?? 100;
    if (pa !== pb) return pa - pb;
    return b.specialists.length - a.specialists.length;
  });
  return groups;
}
```

El título humano y el emoji se deducen del **primer especialista** de cada grupo (campos `category` y `linea_negocio`). Es más robusto que hardcodear un mapa `anico → "Animales de compañía"` porque si el backend cambia la etiqueta la app se entera automáticamente.

### Navegar al detalle sin una petición extra

No hay `get_specialist_by_slug/` en el plugin. Para evitar un endpoint nuevo, la pantalla de detalle **re-pide el mapa completo** y filtra por `groupKey + slug`:

```tsx
// ConsultasScreen.tsx
onPress={() =>
  navigation.navigate('ConsultaDetail', {
    groupKey: section.key,
    slug: item.specialist_slug,
  })
}

// ConsultaDetailScreen.tsx
useEffect(() => {
  (async () => {
    const map = await getSpecialities(cookie);
    const found = findSpecialistBySlug(
      map,
      route.params.groupKey,
      route.params.slug
    );
    // ...
  })();
}, [cookie, route.params.groupKey, route.params.slug]);
```

Esto es aceptable porque:

1. El payload es pequeño (~9 KB con 21 especialistas).
2. El endpoint es rápido y barato.
3. Si mañana se añade un `get_specialist_by_slug/` dedicado, solo hay que cambiar el interior del `useEffect`.

Si creciese mucho, la alternativa sería cachear el map en `AuthContext` o en una capa `SpecialitiesContext` tras la primera petición.

### Patrón de contacto cross-platform

El CTA de "Contactar" abre `mailto:` con asunto y cuerpo pre-rellenados:

```tsx
const handleContactar = () => {
  const subject = `Consulta para ${name} (${speciality})`;
  const body = `Hola,\n\nMe gustaría plantear una consulta...`;
  const mailto = `mailto:consultas@fatroiberica.es?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  if (Platform.OS === 'web') {
    window.alert('Próximamente podrás enviar...');
    window.location.href = mailto;
    return;
  }

  Alert.alert('Contactar con el especialista', '...', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Abrir correo', onPress: () => Linking.openURL(mailto) },
  ]);
};
```

Dos detalles a tener en cuenta:

- **`Linking.openURL()` de React Native** es la forma idiomática de abrir URLs externas (incluidos `mailto:`, `tel:`, `https://`) en móvil.
- **En web basta con `window.location.href`** para disparar `mailto:`.

### El tab bar empieza a apretar

Con Consultas ya vamos **8 pestañas** en el bottom tab bar (Home, Categorías, Productos, Formación, VetSICS, Consultas, Buscar, Perfil). En iPhones pequeños y Androids de gama baja las etiquetas ya se cortan.

Cuando añadamos **Solicitudes** (la 9ª, próxima feature) toca refactorizar a un **hub "Más"**: una pestaña que abre una pantalla tipo menú con todo lo que no cabe en la tab bar principal. Este plan está documentado con un TODO en `src/navigation/types.ts`.

### Lecciones aprendidas

- **No asumas los nombres de endpoints**. Pensé que era `get_consultas` porque la feature se llama "Consultas" y el CPT se llama `consulta`, pero el endpoint se llama `get_specialities`. Abrir el `User.php` del plugin y hacer `grep` por la palabra clave del dominio fue más rápido que adivinar.
- **Un endpoint "inexistente" se distingue de uno "existente con credenciales malas" por el `Content-Type`**. `application/json` = endpoint válido (te devuelve un JSON de error). `text/html` = endpoint inexistente (te devuelve la página de error de WordPress).
- **No meter lógica de UI en la pantalla**. El mapeo de emoji por categoría y el orden de los grupos viven en el servicio, que es reusable desde card + detail + (mañana) tab icon.
- **Cuando falte un endpoint, usa placeholders útiles**. `mailto:` pre-rellenado no es una solución definitiva, pero permite que la feature se libere ya y que el negocio valide el flujo de contacto real con usuarios reales. Documenta claramente el TODO para que el siguiente dev sepa qué sustituir.

---

## 20. Hub "Más": refactor del bottom tab bar

### El contexto

Llegamos a tener **8 pestañas** en el bottom tab bar (Home, Categorías, Productos, Formación, VetSICS, Consultas, Buscar, Perfil). En iPhones pequeños y Androids de gama baja las etiquetas se cortaban y los botones eran incómodos de acertar. Con **Solicitudes** sumando la 9ª pestaña era imposible seguir así.

**Regla empírica**: más de 5 pestañas en un bottom tab bar es mala idea. Material Design y Human Interface Guidelines lo dicen desde hace años, pero es fácil ignorarlo a medida que añades features.

### La solución

Introducimos un hub **"Más"** (una tab más, irónicamente) que agrupa las pantallas secundarias en una rejilla visual. El tab bar queda con **5 tabs visibles**:

| Tab | Emoji | Pantalla |
|---|---|---|
| Noticias | 🏠 | `HomeScreen` |
| Categorías | 📂 | `CategoriesScreen` |
| Productos | 💊 | `ProductsScreen` |
| Más | ⋯ | `MoreScreen` |
| Perfil | 👤 | `ProfileScreen` |

Y dentro de "Más" vive una rejilla 2×N de tiles con: Formación, VetSICS, Consultas, Solicitudes, Buscar.

### Dos formas de esconder tabs en React Navigation

Para mover una pantalla "fuera" del tab bar sin perderla como ruta hay dos opciones:

**Opción A — Sacarla del `Tab.Navigator` a un stack anidado**:
- Pros: limpio arquitectónicamente, cada pantalla decide su propia navegación.
- Contras: **rompe toda llamada a `navigation.navigate('Vetsics')` desde cualquier sitio** (la ruta ya no vive en el mismo navigator). Pierdes persistencia de estado entre tabs. Mucho refactor.

**Opción B — Mantenerla como `Tab.Screen` pero ocultar el botón**:
- Pros: cero regresión. Los `navigation.navigate('Vetsics')` existentes siguen funcionando. El estado de cada pantalla se conserva al saltar entre ellas.
- Contras: aparenta ser hack (lo es, pero es el hack "oficial" soportado por React Navigation).

Elegimos **B** y se implementa con `tabBarButton: () => null`:

```tsx
const VISIBLE_TABS: ReadonlyArray<keyof BottomTabParamList> = [
  'Home',
  'Categories',
  'Products',
  'More',
  'Profile',
];

<Tab.Navigator
  screenOptions={({ route }) => ({
    // ...otros options
    tabBarButton: VISIBLE_TABS.includes(route.name)
      ? undefined
      : () => null,
  })}
>
  {/* Todas las Tab.Screen registradas como siempre */}
</Tab.Navigator>
```

### El MoreScreen

Array de tiles declarativo + renderizado trivial:

```tsx
interface Tile {
  route: keyof BottomTabParamList;
  emoji: string;
  title: string;
  subtitle: string;
}

const TILES: Tile[] = [
  { route: 'Trainings', emoji: '📚', title: 'Formación', subtitle: '...' },
  { route: 'Vetsics', emoji: '🏃', title: 'VetSICS', subtitle: '...' },
  // ...
];

<View style={styles.grid}>
  {TILES.map((tile) => (
    <TouchableOpacity
      key={tile.route}
      onPress={() => navigation.navigate(tile.route as never)}
    >
      <Text>{tile.emoji}</Text>
      <Text>{tile.title}</Text>
      <Text>{tile.subtitle}</Text>
    </TouchableOpacity>
  ))}
</View>
```

Rejilla de 2 columnas con `flexBasis: '48%'`. Añadir un tile nuevo cuando venga la próxima feature es una línea en el array.

### Lecciones aprendidas

- **Piensa el tab bar desde el día 1**. Añadir tabs sin límite funciona hasta que no funciona. El hub "Más" debería haber existido desde la 5ª feature, no la 9ª.
- **`tabBarButton: () => null` es el hack oficial** para esconder rutas del tab bar sin sacarlas del navigator. Está documentado en React Navigation y es idiomático.
- **No busques simetría en el tab bar**. Cinco tabs desiguales (unas visitadas mucho, otras poco) son mejores que ocho iguales. El de "Más" cabe perfectamente como catch-all.

---

## 21. Solicitudes: promociones con formulario web

### El contexto

Fatro ofrece a los profesionales veterinarios acceso a merchandising (carteles, alfombrillas), muestras de producto y sorteos/becas. Cada promoción tiene un formulario Contact Form 7 asociado que recoge datos del usuario (los pre-rellena desde su perfil) y dispara un email a Fatro con la petición.

El endpoint del plugin que lo expone es `/api/user/get_solicitudes/`.

### Estructura del response

Cada solicitud es un post del CPT `solicitudes`. Los campos útiles son:

```typescript
interface Solicitud {
  ID: string;
  post_title: string;        // "Solicitud Alfombrilla Porcino 2026"
  post_name: string;         // slug
  guid: string;              // URL completa del post en WP (útil para Linking)
  thumb_url: string | null;
  app_img: string | null;    // imagen que usamos para hero + card
  custom_form_id: number;    // ID del CF7 asociado
  custom_form_value: string; // MARKUP del CF7 (shortcodes + HTML + JS)
  meta: SolicitudMeta[];
}
```

En el array `meta` vienen:

- `date_promo` → string `YYYYMMDD` (ej. `"20251214"`). Lo parseamos con regex.
- `linea_negocio` → JSON array `'["ANICO","GANADERIA"]'` (post-refactor de `enrich_post_metadata`).
- `user_especie`, `category` → también JSON arrays.
- `more_info` → HTML largo de email marketing (ver sección del bug abajo).
- `no_requiere_direccion` → `"0"` o `"1"`.

### Por qué no renderizamos el formulario nativamente

El `custom_form_value` es un shortcode Contact Form 7 con decenas de campos, pre-fill desde meta de usuario (`default:usermeta_phone`), validaciones, política de privacidad, JavaScript embebido, layout HTML… Ejemplo real:

```
[dynamichidden your-subject]
[dynamichidden form_title]
[text* sm-name default:user_first_name]
[tel* sm-phone default:usermeta_phone]
[countrytext* sm-country default:usermeta_country "España"]
[acceptance sm-optin] He leído y acepto las condiciones...
[submit "Lo quiero"]
```

Replicarlo en React Native sería:

1. **Frágil**: el equipo de backend sigue iterando estos forms (Juan Luis commiteó "fix(cf7): map user metadata to sm- tags for specialist consultation email" tres veces en una semana). Cada refactor rompería la app nativa.
2. **Mucho trabajo**: escribir un parser de CF7, mapear `usermeta_*` a nuestros estados, validar `[acceptance]`, manejar `[countrytext]` con autocomplete de provincias…

**Decisión pragmática**: hacemos handoff al navegador. Tocar "Rellenar solicitud" abre el `guid` del post con `Linking.openURL()`. El usuario ve el formulario web de WP, ya pre-rellenado si tiene sesión activa.

```tsx
const handleSolicitar = () => {
  if (Platform.OS === 'web') {
    window.open(solicitud.guid, '_blank');
    return;
  }
  Alert.alert('Rellenar solicitud', '...', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Abrir formulario', onPress: () => Linking.openURL(solicitud.guid) },
  ]);
};
```

Cuando el backend exponga un endpoint `submit_solicitud` o cuando un producto futuro justifique el esfuerzo, migramos a un formulario nativo. Por ahora el MVP está en la calle y los usuarios pueden solicitar.

### El bug de los "nnnnn" en `more_info`

El campo `more_info` viene del backend con plantillas de email marketing (tipo Mailchimp/Brevo) importadas a WordPress. Tras el import, el HTML tiene tres problemas crónicos que hacen que la pantalla parezca un desastre visual:

1. **Letras `n` sueltas** entre tags y al principio del string. Raw:
   ```
   "n\r\nn\r\n\r\n<center class=\"wrapper\">...</center>\r\nn\r\n\r\nnnnnnn\r\n<table>..."
   ```
   Son claros artefactos de un `str_replace('\\n', "\n", ...)` o similar donde los `\n` literales perdieron el backslash y quedaron como letra `n`.

2. **Spans invisibles** con `font-size: 0`, `visibility: hidden` o `display: none` llenos de caracteres zero-width (`\u200C`, `\u200B`). Son padding invisible de email tracking.

3. **Líneas CRLF** (`\r\n`) en vez de LF.

`react-native-render-html` lo procesa tal cual y pinta todas esas `n` literales como texto, además de ocupar memoria renderizando los spans invisibles.

### El sanitizador (parche temporal)

Función en `services/solicitudes.ts` que se aplica antes de pasar el HTML a `RenderHtml`:

```typescript
export function sanitizeSolicitudHtml(html: string): string {
  if (!html) return '';
  let cleaned = html;

  // 1. Normaliza CRLF a LF.
  cleaned = cleaned.replace(/\r\n/g, '\n');

  // 2. Elimina caracteres zero-width invisibles.
  cleaned = cleaned.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');

  // 3. Elimina elementos con font-size:0, display:none, visibility:hidden
  //    iterativamente (pueden estar anidados).
  const hiddenRegex = /<(span|div|td|tr|table|p)[^>]*style="[^"]*(?:font-size:\s*0|display:\s*none|visibility:\s*hidden)[^"]*"[^>]*>[\s\S]*?<\/\1>/gi;
  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(hiddenRegex, '');
  }

  // 4. Elimina nodos de texto que son solo letras `n` (con espacios
  //    y/o &nbsp; alrededor, entre tags).
  const nSpace = '(?:\\s|&nbsp;)*';
  cleaned = cleaned.replace(new RegExp(`>${nSpace}(?:n${nSpace})+<`, 'g'), '><');

  // 5. Quita las `n` al principio/fin del string.
  cleaned = cleaned.replace(new RegExp(`^${nSpace}(?:n${nSpace})+`, 'i'), '');
  cleaned = cleaned.replace(new RegExp(`${nSpace}(?:n${nSpace})+$`, 'i'), '');

  // 6. Colapsa newlines múltiples.
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}
```

Resultado medido: reducción del **69-78%** del HTML en las 5 solicitudes reales que hay en producción. Texto útil intacto ("FINVIRUS ECO es un desinfectante...", listado de principios activos, CTA), ruido invisible fuera.

Es un parche. Lo correcto es que el backend corrija el pipeline de import de email templates. Mientras tanto, la app pinta limpio.

### Lecciones aprendidas

- **Vista previa realista antes de dar por hecho el HTML**. Cuando un campo se llama `more_info` y es HTML, probarlo con data real de producción es obligatorio — no con el "hello world" que devuelve el endpoint recién creado.
- **Handoff pragmático**. Si un formulario del backend es demasiado dinámico para replicarlo nativamente, `Linking.openURL()` es aceptable como MVP. Documenta el TODO para cuando venga la versión definitiva.
- **Los emails son HTML basura**. Cualquier template sacado de Mailchimp/Brevo/similar va a traer tracking pixels, `font-size: 0`, tablas anidadas y caracteres zero-width. Da por hecho que vas a necesitar un sanitizador.
- **Escribe el sanitizador como función pura y testéalo con data real**. No en la pantalla. Un Node script de tres líneas que lea el JSON de producción y mida el "antes/después" ahorra horas de ciclos con Expo y te permite iterar regex sin recargar la app.
- **Regex backreferences (`\\1`) para tags anidados**. El patrón `<(tag)[^>]*>...</\1>` asume que el cierre es el mismo tag del apertura — suficiente en la mayoría de casos si los ejecutas en bucle hasta que no cambie el output. Para HTML complejo de verdad, un parser (ej. `htmlparser2`) es más robusto.

---

## 22. Perfil editable: leer y escribir `wp_usermeta`

### El contexto

Hasta ahora el perfil era **read-only**: mostraba lo que venía en el `user` del login y punto. Para que la app sea realmente útil el profesional tiene que poder:

- Actualizar su nombre/apellidos
- Mantener sus datos de contacto (teléfono, dirección, clínica)
- Añadir una descripción corta de su perfil profesional

Estos mismos datos se usan más tarde para **pre-rellenar los formularios** de Solicitudes y Consultas en el web (los `[text* sm-name default:user_first_name]` de Contact Form 7 leen directamente de `wp_usermeta`), así que mantener un perfil al día no es cosmético, ahorra tiempo real al usuario.

### Los endpoints del plugin

Juan Luis expone **tres** endpoints de escritura en `json-api-user`:

| Endpoint | Qué hace | Cuándo lo usamos |
|---|---|---|
| `update_user_meta?meta_key=X&meta_value=Y` | Actualiza un campo. **Casos especiales**: `meta_key=name` dispara `wp_update_user(first_name)`, `meta_key=surname` dispara `wp_update_user(last_name)` | Para `first_name`/`last_name` (necesita `wp_update_user` para que WP actualice `display_name`) |
| `update_user_meta_vars?field1=val1&field2=val2` | Itera `$_REQUEST` y hace un `update_user_meta` por cada clave (excepto `cookie`) | Para todos los campos custom en una sola petición |
| `delete_user_meta?meta_key=X&meta_value=Y` | Borra un meta | No lo usamos de momento — vaciar un campo es suficiente |

### La estrategia de escritura

Guardar el formulario entero son **dos peticiones** HTTP:

```typescript
// 1. Todos los campos meta custom en una llamada.
const metaVars = new URLSearchParams();
metaVars.append('cookie', cookie);
metaVars.append('last_name2', profile.lastName2);
metaVars.append('phone', profile.phone);
metaVars.append('company', profile.company);
metaVars.append('direccion', profile.direccion);
metaVars.append('cp', profile.cp);
metaVars.append('city', profile.city);
metaVars.append('description', profile.description);
await axios.post('/api/user/update_user_meta_vars/', metaVars.toString(), { ... });

// 2. Nombre y primer apellido uno a uno, con el "truco" name/surname
//    para que dispare wp_update_user y actualice display_name.
await updateSingleMeta(cookie, 'name', profile.firstName);
await updateSingleMeta(cookie, 'surname', profile.lastName);
```

Se podría optimizar enviando solo los campos que han cambiado, pero para 9 campos es **premature optimization**: el servidor lo absorbe en sub-segundo.

### El truco de `URLSearchParams` para caracteres especiales

Un bug sutil: si el usuario escribe el teléfono como `+34 666 123 456`, el `+` se interpreta como espacio en `application/x-www-form-urlencoded` (así está en el RFC desde hace décadas). Si haces la petición mano-a-mano con `?phone=+34666...`, el backend recibirá `34666...` (el espacio se consume y desaparece).

Solución: **usar `URLSearchParams.append()`** en lugar de concatenar strings. Internamente codifica `+` como `%2B`, `&` como `%26`, etc. Y es cross-platform nativo (no depende de `qs` u otro paquete).

```typescript
// Mal: el + se pierde
const body = `cookie=${cookie}&phone=${phone}`;

// Bien: URLSearchParams encodea correctamente
const body = new URLSearchParams();
body.append('cookie', cookie);
body.append('phone', phone);
// body.toString() === "cookie=...&phone=%2B34666123456"
```

### El patrón `useFocusEffect` para refrescar al volver

Tras editar el perfil, el usuario vuelve a `ProfileScreen`. Si guardas el perfil solo en el estado local de `EditProfileScreen`, `ProfileScreen` no se entera del cambio y sigue mostrando lo viejo.

Tres opciones:
1. **Meter el perfil en `AuthContext`** y exponer un `refreshProfile()` global. Correcto pero invasivo.
2. **Pasar un callback de refresco por navigation params**. Acopla pantallas.
3. **`useFocusEffect` en `ProfileScreen`** que dispara `getProfile()` cada vez que la pantalla gana el foco. Idiomático en React Navigation.

Elegimos **3**. El hook se ejecuta en montaje inicial y también cada vez que navegas de vuelta (con `goBack()` o deep link):

```tsx
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(
  useCallback(() => {
    load();
  }, [load])
);
```

Coste: una petición GET extra al volver al perfil. A cambio, cero estado compartido y cada pantalla es autónoma.

### Formulario con `TextInput` declarativo

El formulario usa un array de `Field` en lugar de picar 9 `<TextInput>` a mano:

```tsx
interface Field {
  key: keyof UserProfile;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  autoComplete?: 'tel' | 'postal-code' | 'street-address';
  multiline?: boolean;
  maxLength?: number;
}

const FIELDS: Field[] = [
  { key: 'firstName', label: 'Nombre', placeholder: 'Tu nombre', autoCapitalize: 'words', autoComplete: 'given-name' },
  { key: 'phone', label: 'Teléfono', placeholder: '+34 600 000 000', keyboardType: 'phone-pad', autoComplete: 'tel' },
  // ...
];

{FIELDS.map((field) => (
  <TextInput
    key={field.key}
    value={profile[field.key]}
    onChangeText={(value) => updateField(field.key, value)}
    keyboardType={field.keyboardType ?? 'default'}
    autoCapitalize={field.autoCapitalize ?? 'sentences'}
    autoComplete={field.autoComplete}
    // ...
  />
))}
```

Pros: añadir un campo nuevo es una línea en el array. Testear validaciones se hace en un solo sitio. Los atributos `autoComplete` activan el autofill del sistema (Android rellena direcciones de Google, iOS rellena del Keychain), dando UX de app de gama alta sin código extra.

### Validaciones: pocas y útiles

Solo validamos dos cosas antes de hacer el POST:

1. **Nombre no vacío** (`profile.firstName.trim()`).
2. **CP de 5 dígitos** (`/^\d{5}$/`) si el usuario lo rellenó.

El resto lo decide el backend. La regla aquí es:

> **No impongas reglas que el usuario no conoce.** Si el backend acepta una dirección con números romanos, deja que lo intente.

Validación agresiva en cliente = formularios frustrantes. Validación en servidor = error claro = el usuario corrige y avanza.

### Lecciones aprendidas

- **Dos endpoints de escritura, dos semánticas distintas**. `update_user_meta` para los casos con lógica especial (`wp_update_user`) y `update_user_meta_vars` para "lista de campos planos". No mezclar.
- **`URLSearchParams` siempre** para bodies `x-www-form-urlencoded`. Nunca concatenes manualmente — los `+`, `&`, espacios en strings te van a morder.
- **`useFocusEffect` > estado global** para pantallas hermanas con el mismo dato. Si la inversión en Context/React Query no está justificada todavía, un simple fetch on focus es idiomático y no añade dependencia.
- **Bug de seguridad del plugin**: `update_user_meta_vars` itera `$_REQUEST` sin filtrar, así que WooCommerce inyecta sus propias nonces al request y acaban como meta del usuario. No es crítico (solo afecta a tu propio user), pero conviene que el backend filtre a una whitelist de campos esperados. Está comentado a Juan Luis.
- **Sanitize del teléfono**: WP elimina el `+` del teléfono si el sanitize es `sanitize_text_field`. En nuestro flujo llega bien al backend (URLSearchParams encodea correctamente), pero el backend lo despoja. Si el negocio lo necesita conservar, hay que parchear el backend con un sanitize específico para teléfonos.

---

## 23. Cache layer: TanStack Query

### El contexto

Tras las 9 pantallas con data-fetching, el patrón empezaba a doler:

```tsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState<string | null>(null);

const load = useCallback(async () => {
  if (!cookie) return;
  try {
    setError(null);
    const result = await getSomething(cookie);
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [cookie]);

useEffect(() => { load(); }, [load]);

const onRefresh = () => {
  setRefreshing(true);
  load();
};
```

Cada pantalla era **~40 líneas de boilerplate** idénticas. Además **no había cache**: salir de una pestaña y volver en 30 segundos re-lanzaba la petición. Multiplica por 9 pestañas y con 100 usuarios activos el servidor de Fatro se llevaba paliza innecesaria.

### Por qué TanStack Query (y no Context manual o SWR)

| Opción | Pros | Contras |
|---|---|---|
| **Context manual** | Cero deps; control total | Hay que escribir cache, retry, invalidación, stale time, refetch on focus nosotros. Reinventar la rueda. |
| **SWR** | Más simple; misma filosofía | Menos traction en RN, integración peor con `RefreshControl`, dev tools menos pulidas. |
| **TanStack Query v5** | Estándar de facto 2024-2026; hooks idiomáticos (`useQuery`, `useInfiniteQuery`); pull-to-refresh plug-and-play; cache por `queryKey`; devtools; soporta offline con persistPlugin si un día lo queremos | Es una dep extra (~20 KB gzipped). No es relevante en una app con imágenes y HTML renderer. |

Elegimos **TanStack Query v5**. Añadir `@tanstack/react-query` + config y envolver `App.tsx` en `QueryClientProvider` son 10 líneas.

### Configuración sensata desde el día uno

```typescript
// src/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min
      gcTime: 10 * 60 * 1000,        // 10 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

Razonamientos:

- **`staleTime: 5 min`** → los datos de Fatro cambian en escala de minutos (carreras publicadas, solicitudes activadas), no de segundos. Durante los 5 min, volver a una pantalla usa el cache sin fetch. Más tiempo sería mostrar datos obsoletos; menos sería pegarle al servidor sin beneficio.
- **`gcTime: 10 min`** → tras 10 min sin que nadie use el query, el cache se borra para no inflar memoria en móviles modestos.
- **`retry: 1`** → un reintento automático cubre timeouts transitorios. Más intentos son ruido (mejor ver el error rápido y hacer pull-to-refresh manual).
- **`refetchOnWindowFocus: false`** → en mobile es irrelevante, pero poner a `true` en web causa fetches al volver a la pestaña del navegador y comportamiento raro. Lo dejamos off por consistencia entre plataformas.

### Convención de `queryKey` en un mapa central

Para evitar typos y saber dónde vive cada query, centralizamos las keys en `queryClient.ts`:

```typescript
export const queryKeys = {
  solicitudes: (cookie: string | null) => ['solicitudes', cookie] as const,
  vetsics: (cookie: string | null) => ['vetsics', cookie] as const,
  consultas: (cookie: string | null) => ['consultas', cookie] as const,
  trainings: (cookie: string | null) => ['trainings', cookie] as const,
  // ...
};
```

Uso en cada pantalla:

```tsx
const { data } = useQuery({
  queryKey: queryKeys.solicitudes(cookie),
  queryFn: () => getSolicitudes(cookie!),
  enabled: !!cookie,
});
```

Ventajas:

- Cuando añadamos una mutación (ej. "enviar solicitud"), podremos invalidar todas las solicitudes con un `queryClient.invalidateQueries({ queryKey: ['solicitudes'] })` y todas las pantallas que las consuman se refrescan solas.
- Si alguien escribe `queryKeys.solicitudse(cookie)` el compilador se queja; si escribe `'solicitudse'` como string literal, no.

### Pagination: `useInfiniteQuery`

`HomeScreen` y `ProductsScreen` tienen scroll infinito. `useInfiniteQuery` lo resuelve con 4 parámetros:

```tsx
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isRefetching,
  refetch,
} = useInfiniteQuery({
  queryKey: ['posts', 'home'],
  queryFn: ({ pageParam }) => getPosts(pageParam, 10),
  initialPageParam: 1,
  getNextPageParam: (lastPage, allPages) => {
    const nextPage = allPages.length + 1;
    return nextPage <= lastPage.totalPages ? nextPage : undefined;
  },
});

const posts = data?.pages.flatMap((p) => p.data) ?? [];
```

- `initialPageParam: 1` → página de arranque.
- `getNextPageParam` → decide si hay siguiente página mirando los metadatos del último payload (`totalPages` del header `X-WP-TotalPages`). Devolver `undefined` dice "ya no hay más", `hasNextPage` se vuelve `false`.
- `data.pages` es un array `[page1, page2, ...]` que aplanamos con `flatMap`.

Engancharlo al `FlatList`:

```tsx
<FlatList
  onEndReached={() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }}
  onEndReachedThreshold={0.5}
  refreshControl={
    <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
  }
/>
```

Comparado con el patrón manual anterior (`page`, `totalPages`, `loadingMore`, `setPage`, etc.), son **~20 líneas menos** por pantalla.

### Debounce + cache en SearchScreen

Búsqueda con cache por término es particularmente satisfactoria. El patrón:

```tsx
const [query, setQuery] = useState('');
const [debounced, setDebounced] = useState('');

useEffect(() => {
  const t = setTimeout(() => setDebounced(query.trim()), 500);
  return () => clearTimeout(t);
}, [query]);

const { data, isLoading } = useQuery({
  queryKey: queryKeys.search(debounced),
  queryFn: () => searchPostsAndProducts(debounced),
  enabled: debounced.length >= 2,
});
```

Lo interesante es que si el usuario escribe "fatrobendan", borra, y vuelve a escribir "fatrobendan" → el segundo resultado es **instantáneo** desde cache. Sin tocar servidor. Sin código extra.

`enabled: debounced.length >= 2` es el patrón idiomático para "no arranques la query hasta que se cumpla X condición". También lo usamos con `enabled: !!cookie` para no disparar fetches antes de que `AuthContext` haya hidratado la sesión.

### `useQuery` vs `useFocusEffect` — cuándo cuál

Tras la migración quedamos con **dos estilos de data-fetching** en la app:

| Escenario | Patrón |
|---|---|
| Pantallas de **lectura** (listados, detalles) | `useQuery` con cache de 5 min |
| Pantallas de **escritura** + lectura que debe reflejarla (ProfileScreen ↔ EditProfileScreen) | `useFocusEffect` + fetch manual |

¿Por qué no migrar también las de escritura a `useQuery` + `useMutation`? Porque el flujo "edita → guarda → navega atrás → el perfil se actualiza" ya funciona muy bien con `useFocusEffect`, y añadir `useMutation` + `queryClient.invalidateQueries` complica un flujo simple sin aportar valor. **Regla de oro**: migrar a `useQuery` solo cuando el cache compensa la complejidad. Para una lectura puntual tras escritura, el patrón manual es más directo.

### Pitfalls que encontré en el camino

1. **`enabled: !!cookie` es obligatorio** en pantallas con auth. Sin él, la primera renderización dispara `queryFn(null)` que lanza error antes de que `AuthContext` termine de leer la cookie de `AsyncStorage`.

2. **`error` es de tipo `unknown` en TS estricto**. Hay que hacer `(error as Error).message` o validar con `error instanceof Error`. Decidimos el cast por pragmatismo — todas nuestras queries lanzan `Error`, nunca strings ni objetos raros.

3. **`isRefetching` vs `isLoading`**. `isLoading` solo es `true` en el primer fetch. `isRefetching` es `true` en cada refetch (incluido pull-to-refresh). Enganchar `RefreshControl.refreshing` a `isRefetching`, no a `isLoading`.

4. **El `queryKey` debe incluir dependencias**. Si tu query depende de `cookie`, el queryKey debe ser `['solicitudes', cookie]` y NO `['solicitudes']`. Si no, logout + login no dispara refetch porque TanStack Query cree que es la misma query.

### Lecciones aprendidas

- **Evalúa cache layer antes de que duela**. Llegar a 9 pantallas con boilerplate duplicado fue tarde; con 4-5 ya se veía venir. La siguiente app, TanStack Query desde el día uno.
- **`useInfiniteQuery` es un regalo** si tienes paginación. El código manual con `page`/`totalPages`/`loadingMore` es famoso por bugs de race condition (doble fetch al llegar al final, `setState` en componente desmontado). Todo eso te lo ahorra.
- **Centraliza `queryKey` en un objeto**. Strings literales esparcidos por la app es una bomba de relojería cuando haces invalidaciones desde mutations.
- **`staleTime` es la configuración que más importa**. Si lo dejas en el default (`0`, lo marca como stale inmediatamente), pierdes gran parte del valor. Piensa cuánto tiempo tus datos son "frescos" y configúralo acorde.
- **No migrar todo a `useMutation`**. Las escrituras tienen flows muy variados (optimistic, offline, retry, forms) y a veces `async/await` manual es más claro. `useMutation` brilla cuando quieres optimistic updates + invalidación de queries relacionadas.

---

## 24. "Mis solicitudes": agregar datos de múltiples endpoints

### El contexto

El backend ya lleva un contador de cuántas veces el usuario ha pedido cada cosa. Está en dos endpoints distintos:

- `get_vetsics` → cada carrera trae `requested` (conteo de inscripciones)
- `get_solicitudes` → cada promoción trae `requested` (conteo de envíos de formulario)

En ambos casos el conteo se resuelve server-side con una SQL contra `flamingo_inbound` (la tabla del plugin Flamingo que guarda todas las submissions de Contact Form 7) filtrando por título del post y email del usuario. Exacto, pero costoso.

La feature "Mis solicitudes" reúne en una sola pantalla todo lo que el usuario ya pidió — útil como histórico personal y para evitar que pida algo varias veces por error.

### Compartir cache entre pantallas distintas

Ésta es la primera feature que aprovecha de verdad el trabajo de TanStack Query. La pantalla necesita datos de VetSICS **y** Solicitudes, pero esas pantallas ya existen y probablemente el usuario las ha visitado antes. Las mismas `queryKey`s que usan ahí (`queryKeys.vetsics(cookie)`, `queryKeys.solicitudes(cookie)`) las reusamos aquí:

```tsx
const vetsicsQuery = useQuery({
  queryKey: queryKeys.vetsics(cookie),
  queryFn: () => getVetsicsRaces(cookie!),
  enabled: !!cookie,
});

const solicitudesQuery = useQuery({
  queryKey: queryKeys.solicitudes(cookie),
  queryFn: () => getSolicitudes(cookie!),
  enabled: !!cookie,
});
```

Resultado: si el usuario ha pasado por VetSICS o Solicitudes en los últimos 5 minutos, entrar en "Mis solicitudes" es **instantáneo** — cero fetches. Si no, los dos se disparan en paralelo.

### Tipo discriminado para un SectionList heterogéneo

El problema: el SectionList tiene que pintar **dos tipos de card distintos** (`VetsicsCard` para carreras y `SolicitudCard` para promociones) en el mismo `renderItem`. En TypeScript la solución es un tipo unión discriminada:

```typescript
type RequestedItem =
  | { kind: 'vetsics'; count: number; race: VetsicsRace }
  | { kind: 'solicitud'; count: number; solicitud: Solicitud };
```

Y en el render hacemos type narrowing con el discriminador:

```tsx
renderItem={({ item }) => (
  item.kind === 'vetsics' ? (
    <VetsicsCard race={item.race} onPress={...} />
  ) : (
    <SolicitudCard solicitud={item.solicitud} onPress={...} />
  )
)}
```

TypeScript entiende perfectamente que dentro del `if (item.kind === 'vetsics')` `item.race` existe y `item.solicitud` no. Zero casts, zero `as`, zero `any`.

### Badge "Solicitado N veces" sin tocar los cards

Para no duplicar las cards o añadirles props que solo esta pantalla usaría, pongo un badge encima-izquierda con un `negative margin`:

```tsx
countBadge: {
  marginTop: SPACING.xs,
  marginBottom: -SPACING.xs, // engancha visualmente con la card de abajo
  alignSelf: 'flex-start',
  zIndex: 1,
  // ...
},
```

El `marginBottom: -SPACING.xs` hace que el badge "abrace" la card (superposición mínima). Alternativa más robusta hubiera sido envolver en un `View` contenedor con `padding-top` extra en la card, pero modificaría el spacing interno de las otras pantallas. El negative margin aquí es localizado y no afecta a nadie más.

### Refetch paralelo con deduplicación automática

Al hacer pull-to-refresh disparamos las dos queries a la vez:

```tsx
const refetchAll = () => {
  vetsicsQuery.refetch();
  solicitudesQuery.refetch();
};
```

No hace falta `Promise.all` ni hacer `await` — TanStack Query maneja cada query de forma independiente y gestiona sus propios estados. Si alguien ya llamó a `vetsicsQuery.refetch()` en otra pantalla hace 100 ms, este segundo `refetch()` se deduplica.

### El mock de desarrollo como técnica

El usuario de test tenía `requested: "0"` en todo, así que sin datos reales la pantalla solo mostraba estado vacío. Para evaluar el diseño en "lleno" añadí temporalmente un mock:

```typescript
// TEMPORAL — quitar antes del commit final
const DEV_MOCK_REQUESTS = __DEV__;

// En el map:
const count = DEV_MOCK_REQUESTS && idx < 2
  ? idx + 1
  : parseRequested(race.requested);
```

Claves del patrón:

- **Respeto `__DEV__`** → Metro define esta constante global (`true` en desarrollo, `false` en builds de producción). Incluso si se me olvidara quitar el toggle, Release no inyectaría nada.
- **Documenté el mock con un comentario TODO** explícito para que cualquiera al revisar el código entendiera que era temporal.
- **Lo eliminé por completo antes del commit**, no lo dejé en `false`. Código muerto es peor que código vivo; el git log guarda la historia si hay que recuperarlo.

### Lecciones aprendidas

- **El cache compartido entre pantallas es el superpoder de TanStack Query**. Una vez tienes las queryKeys centralizadas, componer nuevas vistas a partir de endpoints existentes es casi gratis.
- **Tipos unión discriminada para listas heterogéneas**. Mucho más seguro que un cast `as any` o un `renderItem` con switch-case sobre un campo opcional.
- **Estado vacío bien diseñado es una feature**. El 90% de los usuarios nuevos verán esta pantalla vacía. Si el copy es útil ("aparecerá aquí cuando rellenes una solicitud") y el diseño no se siente roto, la pantalla cumple su función incluso sin datos.
- **Mocks en dev: `__DEV__` + borrado antes del commit**. Usar toggles en `false` que se quedan en el código es una fuente conocida de bugs ("¿por qué la pantalla se comporta raro?" → "ah, el mock estaba en true").

---

## 25. Favoritos locales con AsyncStorage

### El contexto

La app original Android (analizada contra los .dex de `es.swapp.fatrocomunidad`) **no tiene** una feature de favoritos: cero ocurrencias de "favorit" en 25 MB de código decompilado. Así que esto es una **adición** al scope original, justificada como mejora de UX propia de apps modernas: permitir marcar carreras, posts, productos, formaciones, especialistas o promociones para volver a ellos rápido.

### Por qué local y no server-side

Dos razones:

1. **Ningún endpoint del plugin `json-api-user`** expone guardado de favoritos del usuario. Hacerlo server-side implicaría PR al plugin + negociación con el equipo de backend.
2. **No necesitamos sincronización multi-device todavía**. Un usuario veterinario con la app en el móvil y la web no espera que marcar algo en la web aparezca en el móvil (ni tenemos la web tocando favoritos).

Si algún día hace falta sync, basta con:
- Añadir meta `app_favorites` al perfil WP.
- Hacer un `update_user_meta?meta_key=app_favorites&meta_value=<json>` cada vez que cambia el array local.
- Leer ese meta en el login y fusionar con el local.

El diseño actual está preparado para eso (los favoritos son serializables, con un snapshot completo de datos mínimos).

### La arquitectura en tres capas

Para aislar la responsabilidad y que sea fácil migrar al futuro:

```
FavoriteButton.tsx (UI)
       ↓ usa
useFavorites() hook → FavoritesContext.tsx (estado reactivo)
       ↓ usa
services/favorites.ts (lógica pura + AsyncStorage)
```

- **`services/favorites.ts`**: funciones puras (`loadFavorites`, `saveFavorites`, `addToList`, `removeFromList`, `isInList`). Sin hooks, sin React. Testeable como funciones normales.
- **`FavoritesContext.tsx`**: el Provider monta al arranque, carga de AsyncStorage, y mantiene el array reactivo en memoria. Expone `toggleFavorite` que hace optimistic update (mueve el state antes de esperar al disco).
- **`FavoriteButton.tsx`**: componente UI reutilizable. Dos variantes (`icon` solo corazón, `pill` con texto). Animación de "latido" en scale con `Animated.sequence`.

### Snapshot mínimo vs ID-only

Decisión clave: cada favorito guarda **un snapshot** con `title`, `subtitle`, `imageUrl` — no solo el ID.

```typescript
export interface Favorite {
  kind: FavoriteKind;
  id: string;
  routeParams?: Record<string, string | number>;
  addedAt: number;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
}
```

**Trade-off**:

| Enfoque | Pros | Contras |
|---|---|---|
| Snapshot | `FavoritesScreen` renderiza instantáneo, sin red, funciona offline | Si el título/imagen cambian en producción, el favorito muestra el dato viejo hasta que el usuario abra el detalle |
| ID-only | Siempre datos frescos | Abrir Favoritos con 20 ítems son 20 peticiones. Pésimo offline. |

Para la frecuencia con la que Fatro cambia títulos (casi nunca) y para que la app se sienta rápida, el snapshot gana. Si en algún caso concreto un título cambia, el usuario lo verá al tocar el favorito (y el detalle abre con datos frescos).

### Tipo discriminado y dispatcher de navegación

Como Favoritos es **heterogéneo** (6 tipos de recursos distintos), al abrir uno tenemos que ir a la pantalla correcta con los parámetros correctos. Un `switch` sobre `kind` es la solución directa:

```tsx
const openFavorite = (fav: Favorite) => {
  switch (fav.kind) {
    case 'post':
      navigation.navigate('PostDetail', { postId: Number(fav.id) });
      break;
    case 'consulta':
      navigation.navigate('ConsultaDetail', {
        groupKey: String(fav.routeParams?.groupKey ?? ''),
        slug: String(fav.routeParams?.slug ?? fav.id),
      });
      break;
    // ...
  }
};
```

El caso de **Consultas** es especial: los especialistas no tienen un ID entero, sino que se identifican por `groupKey + slug`. Lo guardamos en `routeParams` (un campo flexible del tipo `Favorite`) y el dispatcher lo consume al navegar.

### El corazón "latido" con Animated

`react-native` tiene `Animated` built-in, no hace falta `Reanimated`. La animación es:

```tsx
const [scale] = useState(() => new Animated.Value(1));

const handlePress = async () => {
  Animated.sequence([
    Animated.timing(scale, { toValue: 1.25, duration: 120, useNativeDriver: true }),
    Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
  ]).start();
  await toggleFavorite(data);
};

<Animated.Text style={{ transform: [{ scale }] }}>
  {active ? '❤️' : '🤍'}
</Animated.Text>
```

`useNativeDriver: true` delega la animación al hilo nativo: 60 FPS incluso si el hilo JS está ocupado (ej. guardando en AsyncStorage). Sin `useNativeDriver`, el latido se pausaría unos frames al guardar.

### Lecciones aprendidas

- **Una feature que no está en el "scope oficial" puede seguir siendo válida**. Favoritos no estaba en la app Android original, pero aporta valor real. No confundir "seguir el espejo" con "no poder innovar".
- **Local primero, server después**. Para features que pueden vivir local sin perder utilidad, arrancar sin endpoint acelera el desarrollo y valida la UX antes de pedir cambios al backend.
- **Snapshot + fallback a detalle con datos frescos** es un patrón robusto para listados que deben ser instantáneos.
- **`Animated` nativo sigue siendo suficiente** para micro-interacciones puntuales. `Reanimated` es para animaciones complejas, gestuales o coreografiadas. Elegir según necesidad.
- **Separación clara service → context → UI** hace que el día de mañana migrar a server-side sea tocar solo el service, sin reescribir UI.
