# FetroApp - WordPress Mobile App

Aplicación móvil desarrollada con React Native y Expo que consume la REST API de WordPress del entorno de Fatro Ibérica. "Fetro" es la versión independiente y no oficial — un proyecto de formación para la especialización en WordPress back-end y desarrollo full-stack JavaScript.

## Stack tecnológico

- **React Native** con **Expo** (SDK 55)
- **TypeScript**
- **React Navigation** (Stack + Bottom Tabs)
- **Axios** para consumo de API REST
- **react-native-render-html** para renderizado de contenido WordPress

## Requisitos

- Node.js >= 20.19.4
- npm >= 10
- [Expo Go](https://expo.dev/go) en tu dispositivo móvil (para desarrollo)

## Instalación

```bash
git clone https://github.com/nezor11/fetro-app.git
cd fetro-app
npm install
```

## Desarrollo

```bash
npx expo start
```

Opciones disponibles:
- Pulsa `w` para abrir en el navegador
- Pulsa `a` para abrir en emulador Android
- Escanea el QR con Expo Go en tu móvil

## Estructura del proyecto

```
FatroApp/
├── App.tsx                          # Entry point
├── src/
│   ├── components/
│   │   └── PostCard.tsx             # Tarjeta de noticia reutilizable
│   ├── constants/
│   │   ├── api.ts                   # Base URL de la API
│   │   └── theme.ts                 # Colores, fuentes, espaciados
│   ├── navigation/
│   │   ├── types.ts                 # Tipos TypeScript para navegación
│   │   ├── RootNavigator.tsx        # Stack Navigator principal
│   │   └── BottomTabs.tsx           # Barra de navegación inferior
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Listado de noticias
│   │   ├── CategoriesScreen.tsx     # Árbol de categorías
│   │   ├── CategoryPostsScreen.tsx  # Posts filtrados por categoría
│   │   ├── PostDetailScreen.tsx     # Detalle de noticia
│   │   ├── ProductsScreen.tsx       # Listado de productos
│   │   └── SearchScreen.tsx         # Búsqueda global
│   └── services/
│       ├── api.ts                   # Instancia Axios configurada
│       ├── posts.ts                 # Servicio de posts con paginación
│       ├── categories.ts            # Servicio de categorías
│       └── media.ts                 # Servicio de media
```

## API de WordPress

La app consume la REST API estándar de WordPress:

| Endpoint | Descripción |
|---|---|
| `GET /wp-json/wp/v2/posts` | Listado de noticias |
| `GET /wp-json/wp/v2/posts/:id` | Detalle de noticia |
| `GET /wp-json/wp/v2/categories` | Categorías |
| `GET /wp-json/wp/v2/media/:id` | Media/imágenes |
| `GET /wp-json/wp/v2/product` | Productos (CPT) |

### Parámetros comunes
- `_embed=true` — Incluye datos relacionados (autor, imagen destacada, categorías)
- `per_page` / `page` — Paginación
- `categories` — Filtrar por categoría
- `search` — Búsqueda por texto

### Headers de paginación
- `X-WP-Total` — Total de items
- `X-WP-TotalPages` — Total de páginas

## Funcionalidades

### MVP (Fase 1)
- [x] Home con listado de noticias (pull-to-refresh + scroll infinito)
- [x] Detalle de post con renderizado HTML nativo
- [x] Categorías con jerarquía y filtrado de posts
- [ ] Listado de productos (CPT)
- [ ] Búsqueda global

### Fase 2
- [ ] Registro/Login de usuarios (JWT)
- [ ] Inscripción en formaciones
- [ ] Registro en carreras (VetSICS)
- [ ] Perfil de usuario con historial

## Despliegue

### Desarrollo (Expo Go)
Escanea el QR del servidor de desarrollo con Expo Go.

### Producción (EAS Build)
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Configurar proyecto
eas build:configure

# Build Android (APK)
eas build --platform android --profile preview

# Build iOS (requiere cuenta Apple Developer)
eas build --platform ios --profile preview
```

## Contexto del proyecto

Este proyecto forma parte de la especialización en WordPress dentro del CDS 2026 de Novicell. Los objetivos incluyen:
- Dominio de la REST API de WordPress como headless CMS
- Desarrollo full-stack con JavaScript/TypeScript
- Experiencia en desarrollo móvil cross-platform
