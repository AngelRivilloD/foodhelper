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
      this.dailyStateSubject.next(savedState);
    } else {
      const yesterday = this.getYesterdayDate();
      if (streak.lastCompletedDate !== yesterday && streak.lastCompletedDate !== today) {
        streak.count = 1;
        streak.lastCompletedDate = null;
        this.saveStreak(profile, streak);
      }
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

    this.updateStreakIfComplete(state);
  }

  unconfirmMeal(mealType: string): void {
    const state = { ...this.dailyStateSubject.value };
    state.meals = { ...state.meals };
    delete state.meals[mealType];

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
