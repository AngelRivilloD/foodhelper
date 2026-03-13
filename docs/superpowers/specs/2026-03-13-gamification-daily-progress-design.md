# Gamificación y Progreso Diario — Spec de Diseño

## Contexto

Feedback de usuario: necesita ver cómo va su progreso de porciones y calorías del día, y la app debe motivarlo a registrar todas sus comidas con una experiencia gamificada.

## Cambios principales

### 1. Header "Mi día" — Progreso diario global

Componente compacto siempre visible arriba del meal calculator (solo en modo dinámico). Se expande al tocarlo.

**Estado colapsado:**
- Título "Mi día" a la izquierda
- Streak counter (🔥 N) y chevron a la derecha. Valor mínimo: 1 (nunca muestra 0)
- 4 pills horizontales, una por comida (Desayuno, Almuerzo, Merienda, Cena):
  - Confirmada: fondo `#f0faf3`, icono Lucide `circle-check` verde (`#34c759`), texto verde bold
  - Pendiente: fondo `#F5F0E8`, icono Lucide `circle` gris (`#bbb`), texto gris, opacity 0.6
- Barra de progreso global: porcentaje de porciones totales consumidas vs objetivo diario
  - Gradiente amarillo → verde (`#FECA57` → `#34c759`) según el porcentaje
  - Texto del porcentaje con color acorde al gradiente
  - Al 100%: borde sutil verde en la card (`#34c75933`)

**Estado expandido (al tocar):**
- Todo lo del colapsado + chevron rotado 180°
- Sección "Porciones totales del día" con total de kcal estimadas a la derecha
- Lista de categorías (excluyendo Legumbres), cada una con:
  - Emoji + nombre de categoría a la izquierda
  - Porciones consumidas/objetivo a la derecha (ej. "2/4 porc")
  - Barra de progreso con color de la categoría
  - Calorías aproximadas debajo de la barra (sin gramos — no tiene sentido sumar gramos de alimentos distintos)

**Objetivo diario:** Se calcula sumando los objetivos de las 4 comidas desde `ProfileConfigService.getMealObjectives()`. Si una categoría tiene ajuste dinámico (ej. Salmón elimina Grasas), se usa el valor ajustado de la comida confirmada.

**Colores por categoría (existentes):**
- Proteína Magra: `#4ECDC4`
- Proteína Semi-Magra: `#2ECC71`
- Carbohidratos: `#FF6B6B`
- Lácteos: `#3498DB`
- Grasas: `#45B7D1`
- Frutas: `#FECA57`
- Vegetales: `#2ECC71`

**Nota:** Vegetales y Proteína SM comparten color `#2ECC71` (existente en el código). Se mantiene así por ahora.

**Categoría Legumbres:** Excluida del progreso diario. Está comentada en `macroCategories` y no se usa activamente.

**Calorías aproximadas por porción de categoría:**
- Proteína Magra: ~55 kcal/porción
- Proteína Semi-Magra: ~75 kcal/porción
- Carbohidratos: ~140 kcal/porción
- Lácteos: ~100 kcal/porción
- Grasas: ~45 kcal/porción
- Frutas: ~60 kcal/porción
- Vegetales: ~25 kcal/porción

Estos valores son orientativos. Se almacenan como constante en el servicio.

### 2. Flechas de swap → Controles de porciones

**En el resumen de ingredientes:**

**Antes:** Flechas `‹ ›` que cambiaban el alimento por otro aleatorio de la misma categoría.

**Después:**
- Botones circulares `−` / `+` (mismo estilo que los portion-btn existentes, 26px)
- Controlan la cantidad de porciones del alimento
- Se muestra número de porciones junto al peso: "90g · 3 porc" (color `#b68f5e`)
- El botón `−` tiene `disabled` cuando porciones <= 0
- El botón `+` tiene `disabled` cuando no se pueden agregar más porciones en esa categoría (usa `canAddMorePortions()` existente, que evalúa a nivel de categoría sumando todas las porciones de todos los alimentos)

**Cambio de alimento:** Click/tap en el nombre del alimento (estilizado como clickeable con subrayado `text-decoration-color: #d4c4a8`) abre el dropdown de alternativas — funcionalidad ya existente (`showSummaryAlternatives`).

**Nota:** Los controles de porciones en la vista de categorías (arriba) NO cambian. Solo cambia el resumen de ingredientes.

### 3. Botón "Confirmar comida"

- Botón verde debajo del resumen de ingredientes (después de los action buttons)
- Estilo: `background: linear-gradient(131deg, #34c759, #2da44e)`, texto blanco, border-radius 14px, padding 14px, font-weight 700
- Box-shadow verde sutil: `0 4px 16px rgba(52, 199, 89, 0.25)`
- Texto: "✓ Confirmar [tipo de comida]" (ej. "✓ Confirmar Desayuno")
- Significado: el usuario registra que ya comió eso
- Al confirmar:
  - Las porciones de esa comida se suman al progreso diario global
  - La pill de esa comida cambia a confirmada (circle-check verde)
  - La barra de progreso global se actualiza con animación (CSS transition 0.5s ease)
  - Se dispara el efecto de celebración

**Comida ya confirmada:**
- Si el usuario navega a una comida ya confirmada, se muestra el resumen de lo que confirmó
- En lugar del botón "Confirmar", se muestra un **menú de elipsis** (icono Lucide `ellipsis`) que ofrece:
  - **Editar:** Desconfirma la comida, resta sus porciones del progreso diario, y permite modificarla. Luego debe volver a confirmar.
  - **Eliminar:** Desconfirma la comida y borra el plan de esa comida. Resta sus porciones del progreso diario.

**Concordancia de género en el mensaje:**
- "Desayuno" → "¡Desayuno confirmado!" (masculino)
- "Almuerzo" → "¡Almuerzo confirmado!" (masculino)
- "Merienda" → "¡Merienda confirmada!" (femenino)
- "Cena" → "¡Cena confirmada!" (femenino)

### 4. Efecto de celebración

Se dispara al presionar "Confirmar comida":

1. **Confetti:** ~30 partículas de colores (rojo, amarillo, cyan, azul, dorado) que caen desde arriba con animación CSS. Contenidas en un div `position: fixed` con `pointer-events: none` y `z-index: 9999` que se destruye después de la animación. Duración ~2 segundos.
2. **Haptic feedback:** `navigator.vibrate(200)` si el navegador lo soporta (check con `'vibrate' in navigator`).
3. **Sonido:** Un beep corto generado con Web Audio API (sin archivos de audio). Se puede añadir una preferencia de mute en localStorage en el futuro.
4. **Overlay temporal:** Card centrada con:
   - Icono Lucide `circle-check` grande (56px) verde
   - Texto "¡[Comida] confirmado/a!" (con género correcto)
   - Mensaje motivacional aleatorio
   - Streak counter actualizado
   - Se cierra automáticamente después de ~2.5 segundos o al tocar

**Pool de mensajes motivacionales:**
- ¡Gran elección!
- ¡Vas genial!
- ¡Nutrición perfecta!
- ¡Sigue así!
- ¡Eso es disciplina!
- ¡Tu cuerpo te lo agradece!

### 5. Streak (racha)

- Cuenta días consecutivos en que el usuario confirmó las 4 comidas
- Se muestra como "🔥 N" en el header "Mi día". Mínimo visible: 1
- Se incrementa cuando se confirma la 4ta comida del día
- Se resetea si al inicio de un nuevo día el día anterior no tenía las 4 comidas confirmadas
- Persistido en localStorage
- Comparación de fechas usa fecha local (YYYY-MM-DD desde `new Date().toLocaleDateString('en-CA')`)

### 6. Persistencia (localStorage)

Nuevas keys:
- `foodhelper_daily_meals_{profile}`: estado diario de comidas
- `foodhelper_streak_{profile}`: racha

**Modelo de datos:**

```typescript
interface DailyMealState {
  date: string; // YYYY-MM-DD local
  meals: {
    [mealType: string]: {
      confirmed: boolean;
      mealPlan: { [category: string]: { food: FoodItem; portions: number; totalAmount: string }[] };
    };
  };
}

interface StreakState {
  count: number; // mínimo 1 para display
  lastCompletedDate: string | null; // YYYY-MM-DD del último día con 4 comidas
}
```

Lógica de reseteo diario:
- Al cargar la app, comparar `date` guardado con fecha local actual
- Si es un nuevo día:
  - Verificar si el día anterior tenía las 4 comidas confirmadas → si sí, incrementar streak; si no, resetear a 1
  - Limpiar `meals` para el nuevo día

### 7. Scope exclusions

- No se implementa un calendario de racha en esta iteración (se hará después)
- No se cambia el modo fijo (fixed) — solo aplica al modo dinámico
- No se añade backend — todo sigue siendo localStorage
- Las calorías son aproximadas, no exactas
- Legumbres excluida del progreso diario
- No se implementa preferencia de mute para sonidos (futuro)
