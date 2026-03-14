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
- Only visible when a meal is active (a meal type is selected)

## 2. Bottom Sheet Modal

### Layout (top to bottom)

1. **Handle bar** — small gray centered bar at top indicating swipe-to-close
2. **Header** — title "Añadir alimento" with X close button
3. **Search input** — text input with magnifying glass icon, placeholder "Buscar alimento..."
4. **Category chips** — horizontally scrollable row with all 8 food categories plus "Todos" (selected by default)
5. **Food list** — scrollable list showing: food name, category, grams per portion. Tapping an item navigates to the quantity view

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
4. **Mode toggle** — tabs: "Porciones" | "Gramos"
5. **Portions mode** — `-` / number / `+` buttons (integers only, minimum 1)
6. **Grams mode** — numeric input field
7. **Reference info** — subtle text: "1 porción = Xg"
8. **"Añadir" button** — primary action button at bottom, accent color `#b68f5e`

### Behavior

- Food is added to the currently active meal
- Daily progress updates immediately
- After adding, returns to the search/list view (user may want to add more items)
- User closes the modal when done

## 4. Integration with Existing System

- **Data source:** Uses the existing food database in `FoodCalculatorService` — no new data needed
- **State:** Manually added foods are saved as part of the `ConfirmedMealPlan` for the active meal, same structure as auto-generated meals
- **Daily Progress:** Added portions count toward daily progress and respect per-category daily limits
- **Limits:** If a category has reached its daily limit, show the existing "Límite diario alcanzado" tooltip and block adding more from that category

## 5. New Component

- `AddFoodModalComponent` — standalone component
- **Inputs:** active meal type
- **Outputs:** emits the selected food item with quantity (portions or grams)
- Scoped CSS following the app's earth-tone design system (DM Sans body, Urbanist headers, `#b68f5e` accent, `#F5F0E8` subtle backgrounds)

## 6. Out of Scope

- Creating custom food items not in the database
- Editing or removing already-added foods from the modal
- Barcode scanning
- Meal plan modification (this is purely additive logging)
