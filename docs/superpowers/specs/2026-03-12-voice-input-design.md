# Voice Input System — Design Spec

## Overview

Sistema de entrada por voz para FoodHelper que permite al usuario dictar alimentos y obtener porciones calculadas automáticamente según su perfil. Funciona como feature complementaria al menú generado, con un CTA flotante llamativo que invite a probarlo.

## Decisiones clave

| Decisión | Valor |
|----------|-------|
| Trigger | FAB flotante, solo en sección 'plan' |
| STT | Web Speech API (`es-ES`), client-side, gratis |
| Matching | Local: exacto → inclusión → Levenshtein (≤2) |
| Alimento no encontrado | Feedback sutil: "X no encontrado" |
| Porciones | Las del perfil activo para el meal type actual |
| Aplicación | Reemplazo directo por categoría via `replaceFood()` |
| Animación escucha | Ondas reactivas al volumen (AudioContext + AnalyserNode) |
| Flujo UI | FAB → bottom sheet → resultados → aplicar → cierra |
| Compatibilidad | FAB oculto si navegador no soporta Speech API |

## Arquitectura

```
┌──────────────────┐     ┌───────────────────┐     ┌──────────────────────┐
│ SpeechRecognition│────▶│  FoodMatcher       │────▶│ MealCalculator       │
│ Service          │     │  Service           │     │ Component            │
│                  │     │                    │     │                      │
│ - Web Speech API │     │ - Tokenización     │     │ - replaceFood()      │
│ - AudioContext   │     │ - Normalización    │     │ - Feedback visual    │
│ - Volume stream  │     │ - Fuzzy matching   │     │                      │
└──────────────────┘     └───────────────────┘     └──────────────────────┘
        ▲                                                    ▲
        │                                                    │
        └──────────── VoiceInputComponent ──────────────────┘
                      (FAB + Bottom Sheet + Animaciones)
```

### Piezas nuevas

1. **SpeechRecognitionService** — Wrapper de Web Speech API. Emite `Observable<SpeechEvent>` con tipos: `listening`, `interim`, `result`, `volume`, `error`, `end`. Usa AudioContext+AnalyserNode para capturar nivel de volumen en tiempo real (~60fps) independiente del STT.

2. **FoodMatcherService** — Recibe transcript, tokeniza, normaliza y busca matches contra la foodDatabase filtrada por meal type y preferencias del perfil.

3. **VoiceInputComponent** — UI: FAB flotante, bottom sheet con estados (escuchando/procesando/resultados), animaciones.

## Flujo de datos

```
Usuario habla → SpeechRecognitionService (STT + volumen)
  → transcript final → FoodMatcherService
    → paso 1: eliminar stop words
    → paso 2: tokenizar por ", " / " y " / " con " / " e "
    → paso 3: normalizar (lowercase, sin acentos)
    → paso 4: para cada token, buscar en DB por prioridad:
        1. Match exacto (token contenido en nombre) → confidence 1.0
        2. Match por inclusión inversa → confidence 0.9
        3. Levenshtein ≤ 2 → confidence 0.7
        4. Sin match → reportar
    → paso 5: resolver ambigüedades (priorizar categoría no cubierta)
  → MatchResult[] → MealCalculatorComponent
    → para cada match: replaceFood() con porciones del MealObjectives
```

## Stop words

```
quiero, dame, ponme, pon, añade, agrega, me, un, una, unos, unas,
algo, de, por, favor, poner, el, la, los, las, con, para, hoy,
comer, cenar, desayunar
```

## UX/UI

### FAB (Floating Action Button)
- Circular, 56px, esquina inferior derecha
- Solo visible cuando `section === 'plan'`
- Gradiente cálido sutil con sombra para efecto "flotante"
- Pulso "breathing" en loop las primeras 3 veces (controlado por localStorage)
- Tooltip inicial: "Dime qué quieres comer" que desaparece tras unos segundos
- Oculto si el navegador no soporta Web Speech API

### Estado: Escuchando
- FAB se expande en bottom sheet con overlay oscuro
- Centro: círculo con ondas concéntricas reactivas al volumen
- Texto: "Te escucho..."
- Cancelar: X o tap fuera

### Estado: Procesando
- Ondas se comprimen hacia el centro (~300ms)
- Texto: "Entendido, buscando..."

### Estado: Resultados
- Tarjeta con lista de alimentos encontrados (animación stagger 100ms)
- Check animado por cada match exitoso: nombre + categoría + porciones
- Items no encontrados en gris: "X no encontrado"
- CTA "Aplicar cambios" (gradiente dorado, el único botón prominente)
- Link "Cancelar" debajo
- Al aplicar: modal cierra hacia abajo, alimentos reemplazados hacen flash/highlight

### Feedback sensorial
- Bip suave al empezar a escuchar
- Sonido de confirmación al aplicar
- Haptic feedback en móvil (vibración corta) al pulsar FAB y al aplicar

## Manejo de errores

| Error | UX |
|-------|-----|
| Navegador no soportado | FAB oculto |
| Permiso micrófono denegado | Modal con instrucciones |
| No se detectó voz | "No te escuché, intenta de nuevo" + retry |
| Error de red | "Sin conexión para reconocimiento de voz" |

## SpeechEvent Interface

```typescript
interface SpeechEvent {
  type: 'listening' | 'result' | 'interim' | 'volume' | 'error' | 'end';
  transcript?: string;
  confidence?: number;  // 0-1
  volume?: number;      // 0-1
  error?: string;
}
```

## Archivos nuevos

| Archivo | Responsabilidad | Líneas est. |
|---------|----------------|-------------|
| `services/speech-recognition.service.ts` | Web Speech API + AudioContext | ~120 |
| `services/food-matcher.service.ts` | Tokenización + fuzzy matching | ~150 |
| `components/voice-input/voice-input.component.ts` | Lógica estados y orquestación | ~100 |
| `components/voice-input/voice-input.component.html` | FAB, bottom sheet, estados | ~80 |
| `components/voice-input/voice-input.component.css` | Estilos y animaciones | ~200 |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `meal-calculator.component.html` | Añadir `<app-voice-input>` |
| `meal-calculator.component.ts` | Método `onVoiceResult(matches)` → `replaceFood()` |
| `app.module.ts` | Declarar `VoiceInputComponent` |
