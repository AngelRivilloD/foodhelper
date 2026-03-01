# UI Redesign: Earth Tones + Gestalt + 60-30-10

## Paleta de colores (60-30-10)

| Rol | Color | Uso |
|-----|-------|-----|
| 60% Dominante | `#FAF7F2` | Fondo body, contenedores principales |
| 30% Secundario | `#8B7355` | Headers, botones activos, nav, texto destacado |
| 10% Acento | `#5A8F5C` | Completado, progreso lleno, CTAs de éxito |
| Texto primario | `#2D2A26` | Títulos, nombres de alimentos |
| Texto secundario | `#7A756D` | Descripciones, labels |
| Texto terciario | `#A8A29E` | Hints, placeholders |
| Bordes | `#E8E2D9` | Separadores, bordes de cards |
| Card background | `#FFFFFF` | Cards sobre fondo crema |
| Progreso incompleto | `#D4A853` | Barras en curso |
| Warning/In-progress | `#D4A853` | Porciones parciales |

## Principios Gestalt

- **Proximidad**: 8px dentro de grupos, 20px entre grupos, 32px entre secciones
- **Similitud**: Botones de acción con mismo estilo (borde `#E8E2D9`, radius 10px)
- **Figura/Fondo**: Cards blancas sobre fondo crema
- **Continuidad**: Barras de progreso como líneas guía
- **Enclosure**: Category sections agrupan header + progress + food items

## Micro-interacciones

- Botones de porción: `scale(1.15)` hover, 0.15s
- Category cards: Sombra creciente al hover
- Barras de progreso: Transición de ancho + color (dorado a verde)
- Meal type buttons: Active con fondo marrón suave
- Hover states: `#F5F0E8` consistente
- Nav bottom tab activa: Color `#8B7355`

## Archivos a modificar

1. `src/styles.css` — Fondo, scrollbar, colores base
2. `src/app/app.component.css` — Container, nav-bottom
3. `src/app/components/meal-calculator/meal-calculator.component.css` — Categories, progress, buttons, summary
4. `src/app/components/target-setter/target-setter.component.css` — Checkboxes, headers, hovers
