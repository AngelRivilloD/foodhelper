# Gamificación y Progreso Diario — Spec de Diseño

## Contexto

Feedback de usuario: necesita ver cómo va su progreso de porciones y calorías del día, y la app debe motivarlo a registrar todas sus comidas con una experiencia gamificada.

## Cambios principales

### 1. Header "Mi día" — Progreso diario global

Componente compacto siempre visible arriba del meal calculator (solo en modo dinámico). Se expande al tocarlo.

**Estado colapsado:**
- Título "Mi día" a la izquierda
- Streak counter (🔥 N) y chevron a la derecha
- 4 pills horizontales, una por comida (Desayuno, Comida, Merienda, Cena):
  - Confirmada: fondo `#f0faf3`, icono Lucide `circle-check` verde (`#34c759`), texto verde bold
  - Pendiente: fondo `#F5F0E8`, icono Lucide `circle` gris (`#bbb`), texto gris, opacity 0.6
- Barra de progreso global: porcentaje de porciones totales consumidas vs objetivo diario
  - Gradiente amarillo → verde (`#FECA57` → `#34c759`) según el porcentaje
  - Texto del porcentaje con color acorde al gradiente
  - Al 100%: borde sutil verde en la card (`#34c75933`)

**Estado expandido (al tocar):**
- Todo lo del colapsado + chevron rotado 180°
- Sección "Porciones totales del día" con total de kcal estimadas a la derecha
- Lista de categorías, cada una con:
  - Emoji + nombre de categoría a la izquierda
  - Porciones consumidas/objetivo a la derecha (ej. "2/4 porc")
  - Barra de progreso con color de la categoría
  - Calorías aproximadas debajo de la barra (sin gramos — no tiene sentido sumar gramos de alimentos distintos)

**Colores por categoría (existentes):**
- Proteína Magra: `#4ECDC4`
- Proteína Semi-Magra: `#2ECC71`
- Carbohidratos: `#FF6B6B`
- Lácteos: `#3498DB`
- Grasas: `#45B7D1`
- Frutas: `#FECA57`
- Vegetales: `#34c759`

**Cálculo de calorías:** Aproximadas, basadas en un valor calórico fijo por porción de cada categoría. No es un tracking calórico exacto — es una referencia motivacional.

### 2. Flechas de swap → Controles de porciones

**En el resumen de ingredientes:**

**Antes:** Flechas `‹ ›` que cambiaban el alimento por otro aleatorio de la misma categoría.

**Después:**
- Botones circulares `−` / `+` (mismo estilo que los portion-btn existentes, 26px)
- Controlan la cantidad de porciones del alimento
- Se muestra número de porciones junto al peso: "90g · 3 porc" (color `#b68f5e`)
- El botón `−` tiene `disabled` cuando porciones <= 0
- El botón `+` tiene `disabled` cuando no se pueden agregar más porciones en esa categoría

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
  - La barra de progreso global se actualiza con animación
  - Se dispara el efecto de celebración
- El botón desaparece después de confirmar (esa comida ya está registrada)
- Si el usuario cambia a una comida ya confirmada, se muestra un estado "ya confirmada" en vez del botón

### 4. Efecto de celebración

Se dispara al presionar "Confirmar comida":

1. **Confetti:** Partículas de colores (rojo, amarillo, cyan, azul, dorado) que caen desde arriba con animación CSS. Duración ~2 segundos.
2. **Haptic feedback:** `navigator.vibrate(200)` si el navegador lo soporta (check con `'vibrate' in navigator`).
3. **Sonido:** Un sonido corto de éxito. Se puede usar un beep generado con Web Audio API para evitar archivos de audio.
4. **Overlay temporal:** Card centrada con:
   - Icono Lucide `circle-check` grande (56px) verde
   - Texto "¡[Comida] confirmado/a!"
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
- Se muestra como "🔥 N" en el header "Mi día"
- Se incrementa cuando se confirma la 4ta comida del día
- Se resetea si al inicio de un nuevo día el día anterior no tenía las 4 comidas confirmadas
- Persistido en localStorage

### 6. Persistencia (localStorage)

Nuevas keys:
- `foodhelper_daily_meals_{profile}`: objeto con fecha del día y estado de cada comida (confirmada/pendiente + porciones guardadas)
- `foodhelper_streak_{profile}`: objeto con contador de racha y fecha del último día completo

Lógica de reseteo diario:
- Al cargar la app, comparar fecha guardada con fecha actual
- Si es un nuevo día:
  - Verificar si el día anterior tenía las 4 comidas → actualizar streak
  - Resetear estado de comidas del día

### 7. Scope exclusions

- No se implementa un calendario de racha en esta iteración (se hará después)
- No se cambia el modo fijo (fixed) — solo aplica al modo dinámico
- No se añade backend — todo sigue siendo localStorage
- Las calorías son aproximadas, no exactas
