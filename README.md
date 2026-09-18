# FetroApp - WordPress Mobile App

Aplicación móvil desarrollada con React Native y Expo que consume la REST API de WordPress del entorno de Fatro Ibérica. "Fetro" es la versión independiente y no oficial — un proyecto de formación para la especialización en WordPress back-end y desarrollo full-stack JavaScript.

## Stack tecnológico

- **React Native** con **Expo** (SDK 55)
- **TypeScript**
- **React Navigation** (Stack + Bottom Tabs)
- **Axios** para consumo de API REST
- **TanStack Query** para caché y estados de carga
- **EAS Build** y **EAS Update** para builds y actualizaciones OTA
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

### Tests

```bash
npm test
```

Tests unitarios con Jest (`jest-expo`) en `src/services/__tests__/`. Cubren el cliente del plugin (`pluginApi`), el almacenamiento de favoritos y la recuperación de sesión (`auth`), que son las piezas con más lógica y sin dependencia de UI.

## Estructura del proyecto

```
fetro-app/
├── App.tsx                  # Entry point: providers (Query, Auth, Favoritos) y navegación
├── app.json / eas.json      # Configuración de Expo, EAS Build y EAS Update
├── proxy-server.js          # Proxy CORS para desarrollar en web
├── scripts/                 # Generación de iconos y preview del splash
├── store/                   # Material de la ficha de Play Store (icono, capturas, textos)
├── docs/                    # Guías, checklists y páginas públicas (GitHub Pages)
└── src/
    ├── components/          # Tarjetas de listado, FavoriteButton, ErrorState
    ├── constants/           # Host de la API y tema
    ├── context/             # AuthContext y FavoritesContext
    ├── navigation/          # Stack principal, barra inferior y tipos
    ├── screens/             # Una pantalla por archivo: listados, detalles, auth, perfil, QR, WebView
    ├── services/            # Clientes de la REST API y del plugin, sesión y favoritos
    │   └── __tests__/       # Tests unitarios con Jest
    └── queryClient.ts       # Configuración de TanStack Query
```

## API de WordPress

### Entorno (producción vs. staging)

Por defecto la app apunta al WordPress **de producción** (`https://fatroiberica.es`). Para desarrollar contra la copia de pruebas en SiteGround, define la variable pública de Expo antes de arrancar (también la lee `proxy-server.js`):

```bash
EXPO_PUBLIC_API_HOST=https://fatroibericas.sg-host.com npx expo start
```

O crea un `.env.local` (ignorado por git) con `EXPO_PUBLIC_API_HOST=https://fatroibericas.sg-host.com`. Ojo: contra producción, registrar usuarios o dar de baja cuentas afecta a datos reales.

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
- [x] Listado de productos (CPT) y detalle
- [x] Búsqueda global

### Fase 2 (autenticación y área privada)
- [x] Registro, login, recuperación de contraseña y baja de cuenta
- [x] Perfil de usuario editable
- [x] Formaciones (listado, detalle, calendario)
- [x] Carreras VetSICS (listado y detalle)
- [x] Consultas a especialistas
- [x] Solicitudes de promociones e inscripción a carreras VetSICS (formulario web en WebView con la sesión ya iniciada)
- [x] Asistencias y Mis solicitudes
- [x] Favoritos locales por usuario
- [x] Escaneo de códigos QR

### Pendiente
- [ ] Publicación en Google Play (ver `docs/play-store-checklist.md`)

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

Proyecto personal de aprendizaje: una app móvil sobre un WordPress real usado como CMS headless, con autorización del titular del backend. Los objetivos incluyen:
- Dominio de la REST API de WordPress como headless CMS
- Desarrollo full-stack con JavaScript/TypeScript
- Experiencia en desarrollo móvil cross-platform
