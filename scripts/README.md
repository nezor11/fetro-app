# scripts/

Scripts auxiliares de la app que **no se ejecutan en runtime** — son utilidades de build, mantenimiento o documentación. Por eso viven aquí en lugar de en `src/`.

Todos los scripts están escritos en Node.js puro (sin TypeScript) para que se puedan ejecutar directamente con `node scripts/<nombre>.js` sin pasar por bundler.

---

## `generate-icons.js`

Genera los **6 iconos placeholder** de la app (icon, splash, adaptive icon foreground/background/monochrome y favicon) a partir de SVG inline + `sharp`.

### Cuándo regenerar

- **Cambia el branding** (color, letra/logo).
- **Diseñador entrega los assets finales** y queremos sustituir los placeholders por ellos (en ese caso, no hace falta este script — basta con copiar los PNG entregados a `assets/`).

### Cómo ejecutar

```bash
node scripts/generate-icons.js
```

Produce los 6 PNGs en `assets/`. **Sobreescribe** los existentes — si tenías iconos finales, asegúrate de tenerlos en otro sitio antes de ejecutarlo.

### Cómo personalizar

Cambia las constantes al inicio del script:

| Constante | Para qué |
|---|---|
| `NOVICELL_PURPLE` | Color de fondo. Cambiar a hex de la marca real. |
| `letter` (en `buildIconSvg`) | El glyph centrado. Por defecto "F". Sustituir por la inicial del producto si cambia el nombre. |
| `letterSize` | Proporción del glyph (0.62 default, 0.45 para Android adaptive icon por la safe zone). |

### Por qué SVG inline + sharp y no Figma export

- **Reproducible**: cualquiera con el repo regenera los iconos con un comando, sin esperar a recibir nada de un diseñador.
- **Versionable**: el script vive en git, los cambios se ven en diff.
- **Cero dependencias de servicios externos**: no necesita acceso a Figma, Adobe, etc.

Cuando haya logo final del diseñador, este script seguirá siendo útil para **generar los tamaños derivados** automáticamente partiendo de un SVG entregado.

---

## `preview-splash.js`

Renderiza un **mock visual del splash screen** (1080×2400, resolución de móvil moderno) para validar la apariencia visual antes de instalar el APK en un dispositivo real.

### Cuándo ejecutar

- Después de regenerar iconos con `generate-icons.js`, para visualizar el resultado.
- Antes de mostrar el branding al cliente — para validar el look sin esperar al build de EAS.

### Cómo ejecutar

```bash
# Asegúrate de tener iconos generados primero
node scripts/generate-icons.js

# Genera el mock
node scripts/preview-splash.js
```

Produce `docs/preview-splash.png`. Es el splash compuesto: fondo plano del color configurado + el icono centrado al 30% del ancho.

### Limitaciones

- No simula la **status bar** del sistema (la barra de hora/batería arriba).
- No simula los **safe areas** del notch (en móviles modernos hay recorte arriba).
- No muestra el **timing** del splash (Expo lo muestra ~1-3s antes de cargar la app).

Es solo una validación visual del fondo + icono, suficiente para detectar problemas de contraste, escala o branding antes del APK.

---

## Convenciones para añadir nuevos scripts

Si añades un script nuevo:

1. **Pon un comentario JSDoc al inicio** explicando: qué hace, cuándo usarlo, qué genera, cómo ejecutarlo.
2. **No uses TypeScript** salvo que sea imprescindible — la idea es que estos scripts se ejecuten sin compilar.
3. **No los importes desde `src/`** — son herramientas de desarrollador, no parte de la app.
4. **Añade aquí una entrada** en este README explicando el propósito.
5. **Si requiere una dep nueva**, instálala como `devDependency` (no `dependency`) para que no entre en el bundle de la app.