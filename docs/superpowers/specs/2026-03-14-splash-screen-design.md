# Splash Screen — Nutriguud

## Overview

Pantalla splash animada que se muestra al entrar a la app, con el logo "nutriguud" animado en canvas, seguido de una transición a la vista principal del usuario.

## Logo

- Solo texto "nutriguud" — sin icono, sin tagline
- "nutri": color `#222222`, Urbanist 600, 40px
- "guud": color `#b68f5e`, Urbanist 700, 40px
- Renderizado en Canvas API con soporte retina (`devicePixelRatio`)

## Animación

El texto base animado es "nutrigud" (una sola u). Durante la fase de stretch, esa única "u" se estira hasta separarse visualmente en dos "uu", resultando en "nutriguud".

| Fase | Qué pasa | Timing |
|------|----------|--------|
| 1. Reveal | Todas las letras aparecen de izquierda a derecha con clip mask | 400ms delay, 350px/s |
| 2. Stretch | La "u" (posición después de "nutrig") se estira horizontalmente con `scaleX` desde 1x hasta 2.8x, anclada por la izquierda (`transform-origin: left`). Los caracteres a la derecha no se mueven — la "u" crece sobre el espacio vacío. | 450ms, easeInOut |
| 3. Snap | La "u" estirada se reemplaza instantáneamente por dos "u" normales en sus posiciones finales (como si se partiera en dos). Las dos "u" quedan en las posiciones exactas que ocupan en "nutriguud" renderizado normalmente. | Inmediato |
| 4. D reveal | La "d" aparece con clip reveal desde la izquierda | 100ms, easeOut |
| 5. Loading bar | Barra de 40px debajo del logo se llena | 600ms |
| 6. Fade out | El splash desaparece, muestra la app | 500ms ease-in |

Duración total: ~3 segundos

## Implementación

### Nuevo componente: `SplashScreenComponent`

**Archivos:**
- `src/app/components/splash-screen/splash-screen.component.ts`
- `src/app/components/splash-screen/splash-screen.component.html`
- `src/app/components/splash-screen/splash-screen.component.css`

**Responsabilidades:**
- Esperar a `document.fonts.ready` antes de iniciar la animación (Urbanist debe estar cargada para que `measureText` sea correcto)
- Renderizar el canvas con la animación del logo
- Mostrar la barra de carga
- Emitir evento `splashComplete` cuando termina la animación
- Manejar soporte retina (devicePixelRatio)
- Anular la transición global `* { transition: all 0.3s ease }` del proyecto con `:host * { transition: none }` para evitar conflictos con el fade-out

### Integración con AppComponent

- `AppComponent` muestra `SplashScreenComponent` al iniciar
- Cuando recibe `splashComplete`, oculta el splash y muestra el contenido normal
- El splash se superpone al contenido (position absolute, z-index alto)
- No bloquea la carga del contenido por debajo
- Registrar `SplashScreenComponent` en `declarations` de `AppModule`
- Background del splash: `#FAFAF8` (mismo que el fondo de la app)

### Lógica del canvas (basada en el mockup v17 aprobado)

- Medición de texto con `measureText()` y `actualBoundingBoxAscent/Descent`
- Clip regions para el reveal izquierda→derecha
- `ctx.scale(scaleX, 1)` para el efecto de estiramiento de la "u"
- Canvas dimensionado a `maxWidth * dpr` x `canvasHeight * dpr` con CSS size en píxeles lógicos
- `requestAnimationFrame` loop para la animación

### Parámetros de animación

```
fontSize: 40
revealSpeed: 350 px/s
revealStart: 400ms
stretchDelay: 100ms
stretchDuration: 450ms
maxScale: 2.8
dRevealDuration: 100ms
loadingBarDelay: 2200ms
loadingBarDuration: 600ms
fadeOutDelay: 3000ms
fadeOutDuration: 500ms
```

## Arquitectura

```
AppComponent
├── SplashScreenComponent (overlay, z-index alto)
│   ├── <canvas> (logo animado)
│   └── <div class="loading-bar"> (barra de carga CSS)
└── [contenido normal de la app] (carga por debajo)
```

## No incluye

- Icono o imagen
- Tagline
- Sonido
- Skip/tap para saltar
