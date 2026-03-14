# Add Food Modal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to manually add individual food items to their active meal via a bottom sheet modal.

**Architecture:** New `AddFoodModalComponent` declared in `AppModule`, triggered by a circular `+` button in the `.action-row` of `MealCalculatorComponent`. The modal queries `FoodCalculatorService` for food data, filters by meal type and category, and emits selected food + portion count back to the parent.

**Tech Stack:** Angular 16, TypeScript, vanilla CSS (earth-tone design system)

**Spec:** `docs/superpowers/specs/2026-03-14-add-food-modal-design.md`

---

## Chunk 1: Component scaffold + button

### Task 1: Create AddFoodModalComponent scaffold

**Files:**
- Create: `src/app/components/add-food-modal/add-food-modal.component.ts`
- Create: `src/app/components/add-food-modal/add-food-modal.component.html`
- Create: `src/app/components/add-food-modal/add-food-modal.component.css`
- Modify: `src/app/app.module.ts`

- [ ] **Step 1: Create the component TypeScript file**

```typescript
// src/app/components/add-food-modal/add-food-modal.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FoodCalculatorService } from '../../services/food-calculator.service';
import { FoodItem } from '../../models/food.model';

@Component({
  selector: 'app-add-food-modal',
  templateUrl: './add-food-modal.component.html',
  styleUrls: ['./add-food-modal.component.css']
})
export class AddFoodModalComponent implements OnInit {
  @Input() mealType: string = 'DESAYUNO';
  @Input() blockedCategories: Set<string> = new Set();
  @Output() addFood = new EventEmitter<{ food: FoodItem, portions: number }>();
  @Output() close = new EventEmitter<void>();

  searchQuery = '';
  selectedCategory = 'Todos';
  selectedFood: FoodItem | null = null;
  portions = 1;

  categories = [
    { key: 'Todos', label: 'Todos' },
    { key: 'Proteina Semi-Magra', label: 'Proteína Semigrasa' },
    { key: 'Proteina Magra', label: 'Proteína Magra' },
    { key: 'Carbohidratos', label: 'Carbohidratos' },
    { key: 'Lácteos', label: 'Lácteos' },
    { key: 'Grasas', label: 'Grasas' },
    { key: 'Frutas', label: 'Frutas' },
    { key: 'Vegetales', label: 'Vegetales' }
  ];

  private allFoods: FoodItem[] = [];

  constructor(private foodCalculatorService: FoodCalculatorService) {}

  ngOnInit(): void {
    this.loadFoods();
  }

  private loadFoods(): void {
    const categoryKeys = this.categories
      .filter(c => c.key !== 'Todos')
      .map(c => c.key);

    this.allFoods = [];
    const normalizedMealType = this.mealType.toLowerCase();

    for (const cat of categoryKeys) {
      const foods = this.foodCalculatorService.getFoodsByCategory(cat);
      const filtered = foods.filter(f => f.tipo && f.tipo.includes(normalizedMealType));
      this.allFoods.push(...filtered);
    }
  }

  get filteredFoods(): FoodItem[] {
    let foods = this.allFoods;

    if (this.selectedCategory !== 'Todos') {
      foods = foods.filter(f => f.category === this.selectedCategory);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      foods = foods.filter(f => f.alimento.toLowerCase().includes(query));
    }

    return foods.sort((a, b) => a.alimento.localeCompare(b.alimento));
  }

  selectFood(food: FoodItem): void {
    this.selectedFood = food;
    this.portions = 1;
  }

  goBack(): void {
    this.selectedFood = null;
  }

  incrementPortions(): void {
    this.portions++;
  }

  decrementPortions(): void {
    if (this.portions > 1) {
      this.portions--;
    }
  }

  isCategoryBlocked(food: FoodItem): boolean {
    return this.blockedCategories.has(food.category);
  }

  onAdd(): void {
    if (this.selectedFood && !this.isCategoryBlocked(this.selectedFood)) {
      this.addFood.emit({ food: this.selectedFood, portions: this.portions });
      this.selectedFood = null;
      this.portions = 1;
    }
  }

  onBackdropClick(): void {
    this.close.emit();
  }

  onSheetClick(event: Event): void {
    event.stopPropagation();
  }
}
```

- [ ] **Step 2: Create the component HTML template**

```html
<!-- src/app/components/add-food-modal/add-food-modal.component.html -->
<div class="modal-backdrop" (click)="onBackdropClick()">
  <div class="bottom-sheet" (click)="onSheetClick($event)">
    <div class="handle-bar"></div>

    <!-- Search / List View -->
    <ng-container *ngIf="!selectedFood">
      <div class="sheet-header">
        <h2>Añadir alimento</h2>
        <button class="close-btn" (click)="close.emit()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="search-container">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          class="search-input"
          placeholder="Buscar alimento..."
          [(ngModel)]="searchQuery"
          autocomplete="off">
      </div>

      <div class="category-chips">
        <button
          *ngFor="let cat of categories"
          class="chip"
          [class.active]="selectedCategory === cat.key"
          (click)="selectedCategory = cat.key">
          {{ cat.label }}
        </button>
      </div>

      <div class="food-list" *ngIf="filteredFoods.length > 0">
        <button
          class="food-list-item"
          *ngFor="let food of filteredFoods"
          (click)="selectFood(food)">
          <div class="food-list-info">
            <span class="food-list-name">{{ food.alimento }}</span>
            <span class="food-list-meta">{{ food.category }} · {{ food.gramos }}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-icon"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div class="empty-state" *ngIf="filteredFoods.length === 0">
        <p>No se encontraron alimentos</p>
      </div>
    </ng-container>

    <!-- Quantity View -->
    <ng-container *ngIf="selectedFood">
      <div class="sheet-header">
        <button class="back-btn" (click)="goBack()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2>{{ selectedFood.alimento }}</h2>
        <button class="close-btn" (click)="close.emit()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="quantity-view">
        <span class="quantity-category">{{ selectedFood.category }}</span>

        <div class="portion-selector">
          <button class="portion-btn" (click)="decrementPortions()" [disabled]="portions <= 1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <span class="portion-count">{{ portions }}</span>
          <button class="portion-btn" (click)="incrementPortions()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        <span class="portion-reference">1 porción = {{ selectedFood.gramos }}</span>

        <div class="add-action">
          <button
            class="add-btn"
            [disabled]="isCategoryBlocked(selectedFood)"
            (click)="onAdd()">
            {{ isCategoryBlocked(selectedFood) ? 'Límite diario alcanzado' : 'Añadir' }}
          </button>
        </div>
      </div>
    </ng-container>
  </div>
</div>
```

- [ ] **Step 3: Create the component CSS**

```css
/* src/app/components/add-food-modal/add-food-modal.component.css */

/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9998;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Bottom sheet */
.bottom-sheet {
  background: #FFFFFF;
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Handle bar */
.handle-bar {
  width: 36px;
  height: 4px;
  background: #DDD;
  border-radius: 2px;
  margin: 10px auto 4px;
  flex-shrink: 0;
}

/* Header */
.sheet-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  gap: 12px;
  flex-shrink: 0;
}

.sheet-header h2 {
  flex: 1;
  font-family: 'Urbanist', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #222222;
  margin: 0;
}

.close-btn,
.back-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.close-btn:hover,
.back-btn:hover {
  background: #F5F0E8;
  color: #666;
}

/* Search */
.search-container {
  position: relative;
  padding: 0 20px 12px;
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: 32px;
  top: 50%;
  transform: translateY(calc(-50% - 6px));
  color: #bbb;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 38px;
  border: 1.5px solid #EDE8E0;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  color: #222222;
  background: #FAFAF8;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.search-input::placeholder {
  color: #bbb;
}

.search-input:focus {
  border-color: #b68f5e;
}

/* Category chips */
.category-chips {
  display: flex;
  gap: 8px;
  padding: 0 20px 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  flex-shrink: 0;
}

.category-chips::-webkit-scrollbar {
  display: none;
}

.chip {
  background: #F5F0E8;
  border: none;
  color: #666;
  padding: 6px 14px;
  border-radius: 20px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.chip:hover {
  background: #EBE4D6;
  color: #8B7355;
}

.chip.active {
  background: linear-gradient(131deg, #b68f5e 0%, #8d6e47 100%);
  color: #FFFFFF;
  font-weight: 600;
}

/* Food list */
.food-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.food-list-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: none;
  border: none;
  border-bottom: 1px solid #F5F0E8;
  cursor: pointer;
  transition: background 0.15s ease;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}

.food-list-item:hover {
  background: #FAFAF8;
}

.food-list-item:active {
  background: #F5F0E8;
}

.food-list-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.food-list-name {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: #222222;
}

.food-list-meta {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  color: #999;
}

.chevron-icon {
  color: #ccc;
  flex-shrink: 0;
}

/* Empty state */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
}

.empty-state p {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  color: #999;
  margin: 0;
}

/* Quantity view */
.quantity-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px 40px;
  gap: 24px;
}

.quantity-category {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: #b68f5e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.portion-selector {
  display: flex;
  align-items: center;
  gap: 24px;
}

.portion-selector .portion-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1.5px solid #e0e0e0;
  background: #FFFFFF;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.portion-selector .portion-btn:hover:not(:disabled) {
  background: #F5F0E8;
  border-color: #999;
  transform: scale(1.1);
}

.portion-selector .portion-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.portion-selector .portion-btn:disabled {
  cursor: not-allowed;
  background: #fafafa;
  color: #ddd;
  border-color: #EDE8E0;
}

.portion-count {
  font-family: 'Urbanist', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: #222222;
  min-width: 48px;
  text-align: center;
}

.portion-reference {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  color: #999;
}

/* Add action */
.add-action {
  width: 100%;
  padding: 0;
}

.add-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(131deg, #b68f5e 0%, #8d6e47 100%);
  border: none;
  border-radius: 24px;
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(139, 115, 85, 0.25);
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.add-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(139, 115, 85, 0.35);
  transform: translateY(-1px);
}

.add-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.add-btn:disabled {
  background: #EDE8E0;
  color: #999;
  box-shadow: none;
  cursor: not-allowed;
}
```

- [ ] **Step 4: Register component in AppModule**

Modify `src/app/app.module.ts`:

Add import at top:
```typescript
import { AddFoodModalComponent } from './components/add-food-modal/add-food-modal.component';
import { FormsModule } from '@angular/forms';
```

Add `AddFoodModalComponent` to `declarations` array and `FormsModule` to `imports` array (needed for `[(ngModel)]` in search input).

- [ ] **Step 5: Commit**

```bash
git add src/app/components/add-food-modal/ src/app/app.module.ts
git commit -m "feat: scaffold AddFoodModalComponent with search, categories, and quantity view"
```

---

### Task 2: Add the circular + button to MealCalculatorComponent

**Files:**
- Modify: `src/app/components/meal-calculator/meal-calculator.component.html:270-285`
- Modify: `src/app/components/meal-calculator/meal-calculator.component.css`
- Modify: `src/app/components/meal-calculator/meal-calculator.component.ts`

- [ ] **Step 1: Add state and handler to the component TS**

Add to `MealCalculatorComponent`:

```typescript
showAddFoodModal = false;

openAddFoodModal(): void {
  this.showAddFoodModal = true;
}

closeAddFoodModal(): void {
  this.showAddFoodModal = false;
}

onAddFoodFromModal(event: { food: FoodItem, portions: number }): void {
  // Check if food already exists — if so, add portions on top
  const existing = this.mealPlan[event.food.category]?.find(
    item => item.food.alimento === event.food.alimento
  );
  if (existing) {
    this.adjustPortions(event.food.category, event.food, existing.portions + event.portions);
  } else {
    this.addFoodToPlan(event.food.category, event.food);
    if (event.portions > 1) {
      this.adjustPortions(event.food.category, event.food, event.portions);
    }
  }
}

getBlockedCategories(): Set<string> {
  const blocked = new Set<string>();
  for (const cat of this.macroCategories) {
    if (this.isCategoryAtDailyLimit(cat.key)) {
      blocked.add(cat.key);
    }
  }
  return blocked;
}
```

- [ ] **Step 2: Add the button and modal to the HTML template**

In `meal-calculator.component.html`, modify the `.action-row` (around line 270-285):

```html
      <!-- Action row: voice + add food + confirm -->
      <div class="action-row">
        <app-voice-input *ngIf="!isMealConfirmed()"
          [mealType]="selectedMealType"
          [mealPlanMode]="mealPlanMode"
          [categories]="voiceCategories"
          [portionsMap]="voicePortionsMapCache"
          (apply)="onVoiceApply($event)">
        </app-voice-input>
        <button class="add-food-circle-btn" (click)="openAddFoodModal(); $event.stopPropagation()" title="Añadir alimento">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button class="confirm-meal-btn"
                [class.confirmed]="isMealConfirmed() && !mealModified"
                (click)="onConfirmClick(); $event.stopPropagation()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {{ isMealConfirmed() && !mealModified ? getMealTypeLabel() + (selectedMealType === 'MERIENDA' || selectedMealType === 'CENA' ? ' confirmada' : ' confirmado') : 'Confirmar ' + getMealTypeLabel() }}
        </button>
      </div>
```

Add the modal right before `</ng-container>` (after the celebration component, around line 296):

```html
    <app-add-food-modal
      *ngIf="showAddFoodModal"
      [mealType]="selectedMealType"
      [blockedCategories]="getBlockedCategories()"
      (addFood)="onAddFoodFromModal($event)"
      (close)="closeAddFoodModal()">
    </app-add-food-modal>
```

- [ ] **Step 3: Add CSS for the circular button**

Add to `meal-calculator.component.css`:

```css
/* Add food circular button */
.add-food-circle-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(131deg, #b68f5e 0%, #8d6e47 100%);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(139, 115, 85, 0.25);
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.add-food-circle-btn:hover {
  box-shadow: 0 6px 20px rgba(139, 115, 85, 0.35);
  transform: scale(1.08);
}

.add-food-circle-btn:active {
  transform: scale(0.95);
}
```

- [ ] **Step 4: Verify the app compiles**

Run: `cd /Users/angelrivillo/Projects/foodhelper && ng build`
Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add src/app/components/meal-calculator/
git commit -m "feat: add circular + button and wire up AddFoodModalComponent"
```

---

## Chunk 2: Manual testing & edge cases

### Task 3: Test the full flow manually and fix issues

- [ ] **Step 1: Run the dev server**

Run: `cd /Users/angelrivillo/Projects/foodhelper && ng serve`

- [ ] **Step 2: Verify the + button appears in the action row**

Open browser, verify:
- The `+` button appears next to the mic and confirm buttons
- The `+` button stays visible even after confirming a meal (when mic disappears)

- [ ] **Step 3: Verify the modal opens and shows foods**

Click the `+` button, verify:
- Bottom sheet slides up with backdrop
- Search input works (type "banana" → shows Banana)
- Category chips filter correctly
- "Todos" shows all foods for the meal type
- Empty state shows when no results match

- [ ] **Step 4: Verify the quantity view and adding**

Select a food, verify:
- Quantity view shows with food name, category, portions selector
- `-` disabled at 1, `+` increments
- Reference info shows the `gramos` value
- "Añadir" button works → food appears in meal plan
- Modal returns to search view after adding
- If category is at daily limit, button shows "Límite diario alcanzado" and is disabled

- [ ] **Step 5: Verify re-confirm flow**

Confirm a meal, then add food via modal:
- Verify `mealModified` flag triggers and confirm button changes to "Confirmar [meal]"

- [ ] **Step 6: Fix any issues found and commit**

```bash
git add -A
git commit -m "fix: address issues found during manual testing of add-food modal"
```
