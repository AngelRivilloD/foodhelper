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
  @Input() profileName: string = '';
  @Input() currentMealPortions: { [category: string]: number } = {};
  @Input() currentMealType: string = '';
  @Input() mealModified: boolean = false;

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

  /**
   * Combined portions: confirmed meals + current unconfirmed meal preview.
   * If current meal is already confirmed, skip adding currentMealPortions
   * (they're already counted in confirmed totals).
   */
  private getCombinedPortions(): { [category: string]: number } {
    const confirmed = this.dailyProgressService.getConfirmedPortionsByCategory();
    const isConfirmedAndUnmodified = this.dailyProgressService.isMealConfirmed(this.currentMealType) && !this.mealModified;
    if (!this.currentMealType || isConfirmedAndUnmodified) {
      return confirmed;
    }
    const combined: { [category: string]: number } = { ...confirmed };
    for (const cat of Object.keys(this.currentMealPortions)) {
      combined[cat] = (combined[cat] || 0) + (this.currentMealPortions[cat] || 0);
    }
    return combined;
  }

  /** Confirmed-only percentage (solid bar) */
  getConfirmedPercentage(): number {
    return this.dailyProgressService.getDailyProgressPercentage(this.dailyTarget);
  }

  /** Preview percentage = combined - confirmed (transparent bar) */
  getPreviewPercentage(): number {
    const total = this.getProgressPercentage();
    const confirmed = this.getConfirmedPercentage();
    return Math.max(0, total - confirmed);
  }

  /** Combined percentage (confirmed + current meal) */
  getProgressPercentage(): number {
    const portions = this.getCombinedPortions();
    let totalConsumed = 0;
    let totalTarget = 0;
    for (const category of Object.keys(this.dailyTarget)) {
      if (category === 'Legumbres') continue;
      totalTarget += this.dailyTarget[category] || 0;
      totalConsumed += Math.min(portions[category] || 0, this.dailyTarget[category] || 0);
    }
    if (totalTarget === 0) return 0;
    return Math.round((totalConsumed / totalTarget) * 100);
  }

  getProgressColor(): string {
    return this.dailyProgressService.getProgressColor(this.getProgressPercentage());
  }

  getBarColor(): string {
    return 'rgb(212, 169, 115)';
  }

  /** Confirmed-only portions for a category */
  getConfirmedCategoryPortions(categoryKey: string): number {
    const portions = this.dailyProgressService.getConfirmedPortionsByCategory();
    return portions[categoryKey] || 0;
  }

  /** Confirmed bar width for a category */
  getConfirmedCategoryBarWidth(categoryKey: string): number {
    const target = this.getTargetPortions(categoryKey);
    if (target === 0) return 0;
    return Math.min(100, (this.getConfirmedCategoryPortions(categoryKey) / target) * 100);
  }

  /** Preview bar width for a category (current meal portion only) */
  getPreviewCategoryBarWidth(categoryKey: string): number {
    const target = this.getTargetPortions(categoryKey);
    if (target === 0) return 0;
    const total = this.getCategoryBarWidth(categoryKey);
    const confirmed = this.getConfirmedCategoryBarWidth(categoryKey);
    return Math.max(0, total - confirmed);
  }

  isAllConfirmed(): boolean {
    return this.mealTypes.every(m => this.isMealConfirmed(m.key));
  }

  getConsumedPortions(categoryKey: string): number {
    const portions = this.getCombinedPortions();
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
    const portions = this.getCombinedPortions();
    let total = 0;
    for (const category of Object.keys(portions)) {
      total += (portions[category] || 0) * (CALORIES_PER_PORTION[category] || 0);
    }
    return total;
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
