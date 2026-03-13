# Gamification & Daily Progress Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add daily progress tracking with gamification (confirm meals, celebration effects, streak counter) and change swap arrows to portion controls.

**Architecture:** New `DailyProgressService` manages daily meal state and streak persistence. New `DailyProgressComponent` renders the "Mi día" header. New `CelebrationComponent` handles confetti/sound/haptic overlay. Existing `MealCalculatorComponent` gets confirm button, ellipsis menu for confirmed meals, and swap arrow → portion control changes.

**Tech Stack:** Angular 16, Lucide Angular, CSS animations, Web Audio API, localStorage

**Spec:** `docs/superpowers/specs/2026-03-13-gamification-daily-progress-design.md`

---

## File Structure

### New Files
- `src/app/models/daily-progress.model.ts` — Interfaces: `DailyMealState`, `StreakState`, `ConfirmedMeal`
- `src/app/services/daily-progress.service.ts` — Service: daily state management, streak logic, localStorage persistence
- `src/app/components/daily-progress/daily-progress.component.ts` — Component: "Mi día" header (collapsed/expanded)
- `src/app/components/daily-progress/daily-progress.component.html` — Template
- `src/app/components/daily-progress/daily-progress.component.css` — Styles
- `src/app/components/celebration/celebration.component.ts` — Component: confetti, sound, haptic, overlay
- `src/app/components/celebration/celebration.component.html` — Template
- `src/app/components/celebration/celebration.component.css` — Styles

### Modified Files
- `src/app/models/food.model.ts` — Add re-export of daily-progress models
- `src/app/app.module.ts` — Register new components
- `src/app/components/meal-calculator/meal-calculator.component.ts` — Add confirm/edit/delete logic, wire up daily progress
- `src/app/components/meal-calculator/meal-calculator.component.html` — Swap arrows → portions, confirm button, ellipsis menu, daily-progress and celebration components
- `src/app/components/meal-calculator/meal-calculator.component.css` — New styles for confirm button, ellipsis menu, portion controls in summary

---

## Chunk 1: Data Models & Daily Progress Service

### Task 1: Data Models

**Files:**
- Create: `src/app/models/daily-progress.model.ts`

- [ ] **Step 1: Create the daily progress model file**

```typescript
// src/app/models/daily-progress.model.ts
import { FoodItem } from './food.model';

export interface ConfirmedMealPlan {
  [category: string]: {
    food: FoodItem;
    portions: number;
    totalAmount: string;
  }[];
}

export interface DailyMealState {
  date: string; // YYYY-MM-DD local
  meals: {
    [mealType: string]: {
      confirmed: boolean;
      mealPlan: ConfirmedMealPlan;
    };
  };
}

export interface StreakState {
  count: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
}

export const CALORIES_PER_PORTION: { [category: string]: number } = {
  'Proteina Magra': 55,
  'Proteina Semi-Magra': 75,
  'Carbohidratos': 140,
  'Lácteos': 100,
  'Grasas': 45,
  'Frutas': 60,
  'Vegetales': 25,
};

export const MEAL_GENDER: { [mealType: string]: 'masculino' | 'femenino' } = {
  'DESAYUNO': 'masculino',
  'COMIDA': 'masculino',
  'MERIENDA': 'femenino',
  'CENA': 'femenino',
};

export const MOTIVATIONAL_MESSAGES: string[] = [
  '¡Gran elección!',
  '¡Vas genial!',
  '¡Nutrición perfecta!',
  '¡Sigue así!',
  '¡Eso es disciplina!',
  '¡Tu cuerpo te lo agradece!',
];
```

- [ ] **Step 2: Commit**

```bash
git add src/app/models/daily-progress.model.ts
git commit -m "feat: add daily progress data models and constants"
```

---

### Task 2: Daily Progress Service

**Files:**
- Create: `src/app/services/daily-progress.service.ts`

- [ ] **Step 1: Create the daily progress service**

```typescript
// src/app/services/daily-progress.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DailyMealState, StreakState, ConfirmedMealPlan, CALORIES_PER_PORTION } from '../models/daily-progress.model';

@Injectable({ providedIn: 'root' })
export class DailyProgressService {
  private readonly DAILY_MEALS_KEY = 'foodhelper_daily_meals_';
  private readonly STREAK_KEY = 'foodhelper_streak_';

  private dailyStateSubject = new BehaviorSubject<DailyMealState>(this.emptyState());
  dailyState$ = this.dailyStateSubject.asObservable();

  private streakSubject = new BehaviorSubject<StreakState>({ count: 1, lastCompletedDate: null });
  streak$ = this.streakSubject.asObservable();

  private currentProfile = '';

  private emptyState(): DailyMealState {
    return {
      date: this.getTodayDate(),
      meals: {}
    };
  }

  private getTodayDate(): string {
    return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  }

  initialize(profile: string): void {
    this.currentProfile = profile;
    const savedState = this.loadDailyState(profile);
    const streak = this.loadStreak(profile);
    const today = this.getTodayDate();

    if (savedState && savedState.date === today) {
      // Same day — restore saved state
      this.dailyStateSubject.next(savedState);
    } else {
      // New day — check streak continuity
      const yesterday = this.getYesterdayDate();
      if (streak.lastCompletedDate !== yesterday && streak.lastCompletedDate !== today) {
        // Yesterday was not completed (or gap > 1 day) — reset streak
        streak.count = 1;
        streak.lastCompletedDate = null;
        this.saveStreak(profile, streak);
      }
      // Start fresh day
      const newState = this.emptyState();
      this.dailyStateSubject.next(newState);
      this.saveDailyState(profile, newState);
    }

    this.streakSubject.next(streak);
  }

  private getYesterdayDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
  }

  confirmMeal(mealType: string, mealPlan: ConfirmedMealPlan): void {
    const state = { ...this.dailyStateSubject.value };
    state.meals = { ...state.meals };
    state.meals[mealType] = {
      confirmed: true,
      mealPlan: JSON.parse(JSON.stringify(mealPlan))
    };

    this.dailyStateSubject.next(state);
    this.saveDailyState(this.currentProfile, state);

    // Check if all 4 meals are now confirmed — update streak once per day
    this.updateStreakIfComplete(state);
  }

  unconfirmMeal(mealType: string): void {
    const state = { ...this.dailyStateSubject.value };
    state.meals = { ...state.meals };
    delete state.meals[mealType];

    // If day was previously completed, revoke it
    const streak = { ...this.streakSubject.value };
    if (streak.lastCompletedDate === this.getTodayDate()) {
      streak.count = Math.max(1, streak.count - 1);
      streak.lastCompletedDate = null;
      this.streakSubject.next(streak);
      this.saveStreak(this.currentProfile, streak);
    }

    this.dailyStateSubject.next(state);
    this.saveDailyState(this.currentProfile, state);
  }

  private updateStreakIfComplete(state: DailyMealState): void {
    if (!this.areAllMealsConfirmed(state)) return;

    const streak = { ...this.streakSubject.value };
    // Only increment once per day (avoid double-counting on re-confirm)
    if (streak.lastCompletedDate === this.getTodayDate()) return;

    streak.count += 1;
    streak.lastCompletedDate = this.getTodayDate();
    this.streakSubject.next(streak);
    this.saveStreak(this.currentProfile, streak);
  }

  isMealConfirmed(mealType: string): boolean {
    const state = this.dailyStateSubject.value;
    return state.meals[mealType]?.confirmed === true;
  }

  getConfirmedMealPlan(mealType: string): ConfirmedMealPlan | null {
    const state = this.dailyStateSubject.value;
    return state.meals[mealType]?.mealPlan || null;
  }

  private areAllMealsConfirmed(state: DailyMealState): boolean {
    const requiredMeals = ['DESAYUNO', 'COMIDA', 'MERIENDA', 'CENA'];
    return requiredMeals.every(m => state.meals[m]?.confirmed === true);
  }

  getConfirmedPortionsByCategory(): { [category: string]: number } {
    const state = this.dailyStateSubject.value;
    const totals: { [category: string]: number } = {};

    for (const mealType of Object.keys(state.meals)) {
      const meal = state.meals[mealType];
      if (meal.confirmed && meal.mealPlan) {
        for (const category of Object.keys(meal.mealPlan)) {
          if (!totals[category]) totals[category] = 0;
          for (const item of meal.mealPlan[category]) {
            totals[category] += item.portions;
          }
        }
      }
    }

    return totals;
  }

  getEstimatedCalories(): number {
    const portions = this.getConfirmedPortionsByCategory();
    let total = 0;
    for (const category of Object.keys(portions)) {
      total += (portions[category] || 0) * (CALORIES_PER_PORTION[category] || 0);
    }
    return total;
  }

  getDailyProgressPercentage(dailyTarget: { [category: string]: number }): number {
    const portions = this.getConfirmedPortionsByCategory();
    let totalConsumed = 0;
    let totalTarget = 0;

    for (const category of Object.keys(dailyTarget)) {
      if (category === 'Legumbres') continue;
      totalTarget += dailyTarget[category] || 0;
      totalConsumed += Math.min(portions[category] || 0, dailyTarget[category] || 0);
    }

    if (totalTarget === 0) return 0;
    return Math.round((totalConsumed / totalTarget) * 100);
  }

  getProgressColor(percentage: number): string {
    if (percentage <= 0) return '#FECA57';
    if (percentage >= 100) return '#34c759';
    // Interpolate from yellow (#FECA57) to green (#34c759)
    const r = Math.round(254 + (52 - 254) * (percentage / 100));
    const g = Math.round(202 + (199 - 202) * (percentage / 100));
    const b = Math.round(87 + (89 - 87) * (percentage / 100));
    return `rgb(${r}, ${g}, ${b})`;
  }

  private loadDailyState(profile: string): DailyMealState | null {
    try {
      const data = localStorage.getItem(this.DAILY_MEALS_KEY + profile);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }

  private saveDailyState(profile: string, state: DailyMealState): void {
    localStorage.setItem(this.DAILY_MEALS_KEY + profile, JSON.stringify(state));
  }

  private loadStreak(profile: string): StreakState {
    try {
      const data = localStorage.getItem(this.STREAK_KEY + profile);
      return data ? JSON.parse(data) : { count: 1, lastCompletedDate: null };
    } catch { return { count: 1, lastCompletedDate: null }; }
  }

  private saveStreak(profile: string, streak: StreakState): void {
    localStorage.setItem(this.STREAK_KEY + profile, JSON.stringify(streak));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/services/daily-progress.service.ts
git commit -m "feat: add DailyProgressService with meal confirmation and streak logic"
```

---

## Chunk 2: Daily Progress Header Component

### Task 3: Daily Progress Component

**Files:**
- Create: `src/app/components/daily-progress/daily-progress.component.ts`
- Create: `src/app/components/daily-progress/daily-progress.component.html`
- Create: `src/app/components/daily-progress/daily-progress.component.css`

- [ ] **Step 1: Create the component TypeScript**

```typescript
// src/app/components/daily-progress/daily-progress.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DailyProgressService } from '../../services/daily-progress.service';
import { DailyMealState, StreakState, CALORIES_PER_PORTION } from '../../models/daily-progress.model';

@Component({
  selector: 'app-daily-progress',
  templateUrl: './daily-progress.component.html',
  styleUrls: ['./daily-progress.component.css']
})
export class DailyProgressComponent implements OnInit, OnDestroy {
  @Input() dailyTarget: { [category: string]: number } = {};

  expanded = false;
  dailyState: DailyMealState = { date: '', meals: {} };
  streak: StreakState = { count: 1, lastCompletedDate: null };

  mealTypes = [
    { key: 'DESAYUNO', label: 'Desayuno' },
    { key: 'COMIDA', label: 'Almuerzo' },
    { key: 'MERIENDA', label: 'Merienda' },
    { key: 'CENA', label: 'Cena' },
  ];

  categories = [
    { key: 'Proteina Magra', label: 'Proteína M', icon: '🥩', color: '#4ECDC4' },
    { key: 'Proteina Semi-Magra', label: 'Proteína SM', icon: '🐟', color: '#2ECC71' },
    { key: 'Carbohidratos', label: 'Carbohidratos', icon: '🍞', color: '#FF6B6B' },
    { key: 'Lácteos', label: 'Lácteos', icon: '🥛', color: '#3498DB' },
    { key: 'Grasas', label: 'Grasas', icon: '🥑', color: '#45B7D1' },
    { key: 'Frutas', label: 'Frutas', icon: '🍓', color: '#FECA57' },
    { key: 'Vegetales', label: 'Vegetales', icon: '🥬', color: '#2ECC71' },
  ];

  private subs: Subscription[] = [];

  constructor(private dailyProgressService: DailyProgressService) {}

  ngOnInit(): void {
    this.subs.push(
      this.dailyProgressService.dailyState$.subscribe(state => this.dailyState = state),
      this.dailyProgressService.streak$.subscribe(streak => this.streak = streak)
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }

  isMealConfirmed(mealKey: string): boolean {
    return this.dailyState.meals[mealKey]?.confirmed === true;
  }

  getProgressPercentage(): number {
    return this.dailyProgressService.getDailyProgressPercentage(this.dailyTarget);
  }

  getProgressColor(): string {
    return this.dailyProgressService.getProgressColor(this.getProgressPercentage());
  }

  getProgressGradient(): string {
    const pct = this.getProgressPercentage();
    if (pct >= 100) return 'linear-gradient(90deg, #FECA57, #34c759)';
    return `linear-gradient(90deg, #FECA57, ${this.getProgressColor()})`;
  }

  isAllConfirmed(): boolean {
    return this.mealTypes.every(m => this.isMealConfirmed(m.key));
  }

  getConsumedPortions(categoryKey: string): number {
    const portions = this.dailyProgressService.getConfirmedPortionsByCategory();
    return portions[categoryKey] || 0;
  }

  getTargetPortions(categoryKey: string): number {
    return this.dailyTarget[categoryKey] || 0;
  }

  getCategoryCalories(categoryKey: string): number {
    const consumed = this.getConsumedPortions(categoryKey);
    return consumed * (CALORIES_PER_PORTION[categoryKey] || 0);
  }

  getTotalCalories(): number {
    return this.dailyProgressService.getEstimatedCalories();
  }

  getCategoryBarWidth(categoryKey: string): number {
    const target = this.getTargetPortions(categoryKey);
    if (target === 0) return 0;
    return Math.min(100, (this.getConsumedPortions(categoryKey) / target) * 100);
  }

  isCategoryComplete(categoryKey: string): boolean {
    return this.getConsumedPortions(categoryKey) >= this.getTargetPortions(categoryKey);
  }

  getActiveCategories(): typeof this.categories {
    return this.categories.filter(c => this.getTargetPortions(c.key) > 0);
  }
}
```

- [ ] **Step 2: Create the component template**

Create `src/app/components/daily-progress/daily-progress.component.html` with the "Mi día" header layout: collapsed shows meal pills + progress bar, expanded adds category breakdown. Use Lucide SVG inline for `circle-check` and `circle` icons. Chevron rotates on expand.

Key template structure:
- Wrapper div with click handler for `toggleExpanded()`
- Top row: "Mi día" title + streak (🔥 N) + chevron SVG
- Meal pills row: 4 flex items, each showing confirmed (circle-check green) or pending (circle grey)
- Progress bar: yellow→green gradient, percentage text with dynamic color
- Expanded section (ngIf expanded): "Porciones totales del día" + total kcal, then category list with bars

- [ ] **Step 3: Create the component styles**

Create `src/app/components/daily-progress/daily-progress.component.css` matching the mockup design:
- Card style: white background, border-radius 16px, box-shadow, padding 16px 20px
- Meal pills: flex row, gap 8px, each pill with border-radius 10px
- Confirmed pill: background `#f0faf3`, green text
- Pending pill: background `#F5F0E8`, grey text, opacity 0.6
- Progress bar: height 8px, border-radius 4px, background `#EDE8E0`
- Expanded section: border-top, category rows with small progress bars (height 5px)
- All-confirmed state: subtle green border on card
- Transition animations for expand/collapse

- [ ] **Step 4: Commit**

```bash
git add src/app/components/daily-progress/
git commit -m "feat: add DailyProgressComponent with collapsed/expanded daily tracking"
```

---

## Chunk 3: Celebration Component

### Task 4: Celebration Component

**Files:**
- Create: `src/app/components/celebration/celebration.component.ts`
- Create: `src/app/components/celebration/celebration.component.html`
- Create: `src/app/components/celebration/celebration.component.css`

- [ ] **Step 1: Create the celebration component TypeScript**

```typescript
// src/app/components/celebration/celebration.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MOTIVATIONAL_MESSAGES, MEAL_GENDER } from '../../models/daily-progress.model';

@Component({
  selector: 'app-celebration',
  templateUrl: './celebration.component.html',
  styleUrls: ['./celebration.component.css']
})
export class CelebrationComponent implements OnInit {
  @Input() mealType: string = '';
  @Input() mealLabel: string = '';
  @Input() streakCount: number = 1;
  @Output() dismiss = new EventEmitter<void>();

  message = '';
  confirmText = '';
  confettiParticles: { left: number; delay: number; color: string; size: number; rotation: number }[] = [];

  private confettiColors = ['#FF6B6B', '#FECA57', '#4ECDC4', '#3498DB', '#b68f5e', '#34c759', '#FF9FF3'];

  ngOnInit(): void {
    this.message = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

    const gender = MEAL_GENDER[this.mealType];
    this.confirmText = gender === 'femenino'
      ? `¡${this.mealLabel} confirmada!`
      : `¡${this.mealLabel} confirmado!`;

    this.generateConfetti();
    this.playSound();
    this.vibrate();

    setTimeout(() => this.dismiss.emit(), 2500);
  }

  private generateConfetti(): void {
    this.confettiParticles = Array.from({ length: 30 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
    }));
  }

  private playSound(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  private vibrate(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }

  onOverlayClick(): void {
    this.dismiss.emit();
  }
}
```

- [ ] **Step 2: Create the celebration template**

Create `src/app/components/celebration/celebration.component.html`:
- Fixed overlay with confetti particles (ngFor, absolute positioned divs with CSS animation)
- Center card with: Lucide circle-check SVG (56px green), confirmText, motivational message, streak badge
- Click on overlay dismisses

- [ ] **Step 3: Create the celebration styles**

Create `src/app/components/celebration/celebration.component.css`:
- `.celebration-overlay`: position fixed, inset 0, z-index 9999, backdrop blur, flex center
- `.confetti-particle`: position absolute, animation `confettiFall` 2s ease-out forwards
- `@keyframes confettiFall`: from top -10px to bottom 100vh with rotation and horizontal sway
- `.celebration-card`: white background, border-radius 20px, padding, box-shadow, text-align center
- `.celebration-icon`: the circle-check SVG, scale animation on mount
- Streak badge: background `#F5F0E8`, rounded, inline-flex
- Fade-in animation for the card

- [ ] **Step 4: Commit**

```bash
git add src/app/components/celebration/
git commit -m "feat: add CelebrationComponent with confetti, sound, and haptic feedback"
```

---

## Chunk 4: Integrate into Meal Calculator

### Task 5: Register Components in AppModule

**Files:**
- Modify: `src/app/app.module.ts`

- [ ] **Step 1: Add imports and declarations for new components**

Add to imports at top:
```typescript
import { DailyProgressComponent } from './components/daily-progress/daily-progress.component';
import { CelebrationComponent } from './components/celebration/celebration.component';
```

Add to `declarations` array:
```typescript
DailyProgressComponent,
CelebrationComponent,
```

- [ ] **Step 2: Commit**

```bash
git add src/app/app.module.ts
git commit -m "feat: register DailyProgress and Celebration components in AppModule"
```

---

### Task 6: Update Meal Calculator — Service Integration & Properties

**Files:**
- Modify: `src/app/components/meal-calculator/meal-calculator.component.ts`

- [ ] **Step 1: Add imports and inject DailyProgressService**

Add import:
```typescript
import { DailyProgressService } from '../../services/daily-progress.service';
```

Inject in constructor:
```typescript
constructor(
  private foodService: FoodCalculatorService,
  private profileService: ProfileConfigService,
  public dailyProgressService: DailyProgressService
)
```

- [ ] **Step 2: Add new properties**

```typescript
showCelebration = false;
celebrationMealType = '';
celebrationMealLabel = '';
showConfirmedMenu: string | null = null; // tracks which meal's ellipsis menu is open
```

- [ ] **Step 3: Initialize daily progress service in ngOnInit and ngOnChanges**

In `ngOnInit()`, after existing initialization:
```typescript
this.dailyProgressService.initialize(this.currentProfile);
```

In `ngOnChanges()`, when profile changes:
```typescript
this.dailyProgressService.initialize(this.currentProfile);
```

- [ ] **Step 4: Add confirm, edit, and delete methods**

```typescript
confirmMeal(): void {
  if (!this.mealPlan) return;
  this.dailyProgressService.confirmMeal(this.selectedMealType, this.mealPlan);
  this.celebrationMealType = this.selectedMealType;
  this.celebrationMealLabel = this.getMealTypeLabel();
  this.showCelebration = true;
}

onCelebrationDismiss(): void {
  this.showCelebration = false;
}

editConfirmedMeal(): void {
  this.showConfirmedMenu = null;
  this.dailyProgressService.unconfirmMeal(this.selectedMealType);
  // Meal plan is still loaded, user can edit and re-confirm
}

deleteConfirmedMeal(): void {
  this.showConfirmedMenu = null;
  this.dailyProgressService.unconfirmMeal(this.selectedMealType);
  // Clear the current meal plan
  this.mealPlan = {};
  this.generateMealPlan(true);
}

isMealConfirmed(): boolean {
  return this.dailyProgressService.isMealConfirmed(this.selectedMealType);
}

getDailyTargetForProgress(): { [category: string]: number } {
  return this.profileService.getDailyTarget(this.currentProfile);
}
```

- [ ] **Step 5: Handle confirmed meals when switching meal types**

In the existing `selectMealType()` method, after setting the meal type, add logic to restore confirmed meal plan if that meal was already confirmed:

```typescript
// Add at the end of selectMealType(), after the existing logic:
if (this.dailyProgressService.isMealConfirmed(mealType)) {
  const confirmedPlan = this.dailyProgressService.getConfirmedMealPlan(mealType);
  if (confirmedPlan) {
    this.mealPlan = JSON.parse(JSON.stringify(confirmedPlan));
    return; // Don't regenerate, show the confirmed plan
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/components/meal-calculator/meal-calculator.component.ts
git commit -m "feat: integrate DailyProgressService into MealCalculatorComponent"
```

---

### Task 7: Update Meal Calculator Template

**Files:**
- Modify: `src/app/components/meal-calculator/meal-calculator.component.html`

- [ ] **Step 1: Add daily progress component after the dynamic mode header**

After the `</header>` tag for dynamic mode (line 32), before the `<ng-container *ngIf="mealPlanMode === 'dynamic'">`, add:

```html
<app-daily-progress
  *ngIf="mealPlanMode === 'dynamic'"
  [dailyTarget]="getDailyTargetForProgress()">
</app-daily-progress>
```

- [ ] **Step 2: Replace swap arrows with portion controls in ingredient summary**

In the ingredients summary section (lines 210-245), replace the swap arrow buttons and modify the ingredient-item structure.

Replace the left swap arrow button (line 214-216) with:
```html
<button class="summary-portion-btn decrement"
        (click)="decrementPortions(category.key, item.food); $event.stopPropagation()"
        [disabled]="item.portions <= 0">
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
</button>
```

Replace the right swap arrow button (line 242-244) with:
```html
<button class="summary-portion-btn increment"
        (click)="incrementPortions(category.key, item.food); $event.stopPropagation()"
        [disabled]="!canAddMorePortions(category.key)">
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
</button>
```

Remove the swap animation classes from ingredient-item (lines 211-213) since we no longer swap foods:
```html
<div class="ingredient-item" *ngFor="let item of mealPlan[category.key]">
```

- [ ] **Step 3: Add portion count display in ingredient amount**

Update the ingredient-amount span (line 238-240) to include portion count:
```html
<span class="ingredient-amount">
  {{ getDisplayWeight(category.key, item.food, item.totalAmount) }}
  <span class="ingredient-portions">· {{ item.portions }} porc</span>
</span>
```

- [ ] **Step 4: Add confirm button and confirmed-meal state after action buttons**

After the `menu-action-buttons` div (line 257), add:

```html
<!-- Confirm button (only if not confirmed) -->
<button class="confirm-meal-btn"
        *ngIf="!isMealConfirmed()"
        (click)="confirmMeal(); $event.stopPropagation()">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  Confirmar {{ getMealTypeLabel() }}
</button>

<!-- Confirmed state with ellipsis menu -->
<div class="confirmed-state" *ngIf="isMealConfirmed()">
  <div class="confirmed-badge">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
    <span>{{ getMealTypeLabel() }} confirmado{{ selectedMealType === 'MERIENDA' || selectedMealType === 'CENA' ? 'a' : '' }}</span>
  </div>
  <div class="ellipsis-menu-container">
    <button class="ellipsis-btn" (click)="showConfirmedMenu = showConfirmedMenu === selectedMealType ? null : selectedMealType; $event.stopPropagation()">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
    </button>
    <div class="ellipsis-dropdown" *ngIf="showConfirmedMenu === selectedMealType" (click)="$event.stopPropagation()">
      <button class="ellipsis-option" (click)="editConfirmedMeal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Editar
      </button>
      <button class="ellipsis-option delete" (click)="deleteConfirmedMeal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        Eliminar
      </button>
    </div>
  </div>
</div>
```

- [ ] **Step 5: Add celebration component**

Before the closing `</ng-container>` of dynamic mode (before the voice-input component), add:

```html
<app-celebration
  *ngIf="showCelebration"
  [mealType]="celebrationMealType"
  [mealLabel]="celebrationMealLabel"
  [streakCount]="(dailyProgressService.streak$ | async)?.count || 1"
  (dismiss)="onCelebrationDismiss()">
</app-celebration>
```

- [ ] **Step 6: Close ellipsis menu in closeDropdowns()**

In the existing `closeDropdowns()` method, add:
```typescript
this.showConfirmedMenu = null;
```

- [ ] **Step 7: Commit**

```bash
git add src/app/components/meal-calculator/meal-calculator.component.html
git add src/app/components/meal-calculator/meal-calculator.component.ts
git commit -m "feat: add confirm button, ellipsis menu, and portion controls in summary"
```

---

### Task 8: Update Meal Calculator Styles

**Files:**
- Modify: `src/app/components/meal-calculator/meal-calculator.component.css`

- [ ] **Step 1: Add styles for summary portion buttons**

```css
/* Summary portion controls (replacing swap arrows) */
.summary-portion-btn {
  background: #FFFFFF;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #666;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.summary-portion-btn:hover:not(:disabled) {
  background: #F5F0E8;
  border-color: #999;
  transform: scale(1.15);
}

.summary-portion-btn:active:not(:disabled) {
  transform: scale(0.95);
  transition: transform 0.08s ease;
}

.summary-portion-btn:disabled {
  cursor: not-allowed;
  background-color: #fafafa;
  color: #ddd;
  border-color: #EDE8E0;
}

.ingredient-portions {
  color: #b68f5e;
  font-weight: 500;
}

/* Food name clickable underline in summary */
.ingredient-name-wrapper .ingredient-name {
  text-decoration: underline;
  text-decoration-color: #d4c4a8;
  text-underline-offset: 2px;
}
```

- [ ] **Step 2: Add styles for confirm button**

```css
/* Confirm meal button */
.confirm-meal-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(131deg, #34c759 0%, #2da44e 100%);
  border: none;
  border-radius: 14px;
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.25);
  margin-top: 14px;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.confirm-meal-btn:hover {
  box-shadow: 0 6px 20px rgba(52, 199, 89, 0.35);
  transform: translateY(-1px);
}

.confirm-meal-btn:active {
  transform: scale(0.98);
}
```

- [ ] **Step 3: Add styles for confirmed state and ellipsis menu**

```css
/* Confirmed state */
.confirmed-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding: 12px 16px;
  background: #f0faf3;
  border-radius: 14px;
}

.confirmed-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #34c759;
}

.ellipsis-menu-container {
  position: relative;
}

.ellipsis-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  -webkit-tap-highlight-color: transparent;
}

.ellipsis-btn:hover {
  background: #e8f5e9;
  color: #666;
}

.ellipsis-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #FFFFFF;
  border: 1px solid #EDE8E0;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  margin-top: 4px;
  min-width: 140px;
  overflow: hidden;
}

.ellipsis-option {
  width: 100%;
  background: none;
  border: none;
  padding: 12px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  color: #222;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s ease;
}

.ellipsis-option:hover {
  background: #F5F0E8;
}

.ellipsis-option.delete {
  color: #e74c3c;
  border-top: 1px solid #F5F0E8;
}

.ellipsis-option.delete:hover {
  background: #fdf0ef;
}
```

- [ ] **Step 4: Remove old swap arrow animation CSS**

Remove or keep these classes as they're no longer used in the summary:
- `.swap-arrow` styles
- `.ingredient-item.swap-out-left`
- `.ingredient-item.swap-out-right`
- `.ingredient-item.swap-in`
- `@keyframes slideOutLeft`
- `@keyframes slideOutRight`
- `@keyframes slideIn`

- [ ] **Step 5: Commit**

```bash
git add src/app/components/meal-calculator/meal-calculator.component.css
git commit -m "feat: add styles for confirm button, ellipsis menu, and summary portion controls"
```

---

## Chunk 5: Final Cleanup & Verification

### Task 9: Remove Dead Code

**Files:**
- Modify: `src/app/components/meal-calculator/meal-calculator.component.ts`

- [ ] **Step 1: Remove swapFoodInSummary method and related properties**

Remove:
- `swapFoodInSummary()` method
- `isSwapping()` method
- `swappingItem` property
- `swapDirection` property

These are no longer used since swap arrows were replaced with portion controls.

- [ ] **Step 2: Commit**

```bash
git add src/app/components/meal-calculator/meal-calculator.component.ts
git commit -m "refactor: remove unused swap arrow code from MealCalculatorComponent"
```

---

### Task 10: Build & Verify

- [ ] **Step 1: Run the Angular build**

```bash
cd /Users/angelrivillo/Projects/foodhelper && ng build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run ng serve and test manually**

```bash
ng serve
```

Verify in browser:
1. "Mi día" header appears above meal content in dynamic mode
2. Collapsed: 4 pills (all pending), yellow progress bar at 0%
3. Click on header expands to show category breakdown
4. Swap arrows replaced with -/+ buttons in ingredient summary
5. Click food name opens alternatives dropdown
6. "Confirmar [meal]" button visible
7. Click confirm → celebration overlay with confetti, sound, message
8. Pill changes to confirmed, progress bar updates
9. Navigating to confirmed meal shows confirmed badge + ellipsis menu
10. Edit from ellipsis → unconfirms, allows editing
11. Delete from ellipsis → unconfirms, regenerates meal
12. Streak counter shows 🔥 1

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address build issues from gamification integration"
```
