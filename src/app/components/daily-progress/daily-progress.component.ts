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
