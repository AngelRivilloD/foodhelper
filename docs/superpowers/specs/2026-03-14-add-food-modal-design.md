# Add Food Modal — Design Spec

## Problem

Users cannot log food they actually ate when it differs from the app's generated meal plan. For example, eating "a toast with peanut butter and half a banana" for breakfast has no way to be recorded.

## Solution

A bottom sheet modal triggered by a new circular button (next to the microphone) that lets users search, select, and log individual food items with a specific quantity to the active meal.

## 1. Add Food Button

- Circular button, same size and style as the existing microphone button
- Positioned next to the mic button
- Icon: `+` (Lucide `plus`)
- Color: accent `#b68f5e`, consistent with the app theme
- Visible whenever a meal type is selected (note: `selectedMealType` always has a value based on time of day)
- Hidden when profile mode is `fixed` (weekly plan mode — the user follows a set plan, manual adding doesn't apply)
- Positioned in the `.action-row` next to the mic button. When the meal is confirmed (mic is hidden via `*ngIf`), the add-food button remains visible — it's an independent element, not tied to the mic's visibility. This allows users to add food to an already-confirmed meal (triggering re-confirm flow)

## 2. Bottom Sheet Modal

### Layout (top to bottom)

1. **Handle bar** — small gray centered bar at top indicating swipe-to-close
2. **Header** — title "Añadir alimento" with X close button
3. **Search input** — text input with magnifying glass icon, placeholder "Buscar alimento..."
4. **Category chips** — horizontally scrollable row with the 7 active categories (excluding Legumbres, which is hidden throughout the app) plus "Todos" (selected by default)
5. **Food list** — scrollable list showing: food name, category, amount per portion (displayed as the raw `gramos` string, e.g., "90g", "1/2 taza cocido", "2 unidades"). Tapping an item navigates to the quantity view
6. **Meal type filter** — the food list is pre-filtered by the active meal's `tipo` (e.g., only showing breakfast-appropriate foods when the active meal is DESAYUNO). Unlike `getAvailableFoods()`, profile food preferences are NOT applied — the modal shows all foods in the database for that meal type, since the purpose is to log what the user actually ate, which may be outside their usual preferences

### Behavior

- Covers ~80% of the screen from the bottom
- Dark semi-transparent backdrop behind
- Closes via: X button, tapping backdrop, or swiping down
- Search filters in real-time against the existing food database in `FoodCalculatorService`
- Category chips filter by category; combinable with text search

## 3. Quantity View

When a food item is tapped, the bottom sheet content transitions to:

1. **Back arrow** — top left, returns to the search/list view
2. **Food name** — prominently displayed (e.g., "Banana")
3. **Category label** — subtle text below name (e.g., "Frutas")
4. **Portions selector** — `-` / number / `+` buttons (integers only, minimum 1)
5. **Reference info** — subtle text showing the amount per portion (e.g., "1 porción = 90g", "1 porción = 1/2 taza cocido")
6. **"Añadir" button** — primary action button at bottom, accent color `#b68f5e`

Note: Grams mode removed. The `gramos` field contains heterogeneous units ("90g", "1/2 taza cocido", "2 unidades", "1/3 de scoop") making gram-to-portion conversion unreliable. Users select whole portions only, consistent with how the rest of the app works.

### Behavior

- Food is added to the currently active meal
- After adding, returns to the search/list view (user may want to add more items)
- User closes the modal when done

## 4. Integration with Existing System

- **Data source:** Uses the existing food database in `FoodCalculatorService` — no new data needed
- **State:** Manually added foods are added to the current `mealPlan` in `MealCalculatorComponent`, same as auto-generated foods. They are NOT auto-confirmed — the user must press the existing "Confirmar" button to confirm the meal (preserving the existing confirm flow)
- **Already confirmed meals:** If the meal was already confirmed and the user adds food via the modal, the `mealModified` flag is set to `true`, which triggers the re-confirm button ("Reconfirmar") in the existing UI
- **Daily Progress:** Portions only count toward daily progress once the meal is confirmed (existing behavior)
- **Limits:** If a category has reached its daily limit (across all confirmed meals + current meal), show the existing "Límite diario alcanzado" tooltip and block adding more from that category

## 5. New Component

- `AddFoodModalComponent` — standalone component
- **Inputs:** active meal type, set of blocked categories (categories that have reached their daily limit — computed by the parent using existing `isCategoryAtDailyLimit()` logic)
- **Outputs:** emits the selected food item with portion count
- The parent (`MealCalculatorComponent`) handles all limit-checking logic and passes blocked categories as a simple `Set<string>`. The modal disables the "Añadir" button and shows "Límite diario alcanzado" when the selected food's category is blocked
- Icons use inline SVGs (matching the existing codebase pattern — no Lucide library import needed)
- Scoped CSS following the app's earth-tone design system (DM Sans body, Urbanist headers, `#b68f5e` accent, `#F5F0E8` subtle backgrounds)

## 6. Out of Scope

- Creating custom food items not in the database
- Editing or removing already-added foods from the modal
- Barcode scanning
- Grams-based input (portion units are too heterogeneous)
- Meal plan modification (this is purely additive logging)
