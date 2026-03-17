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
