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
