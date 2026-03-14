import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('foodListEl') foodListEl?: ElementRef<HTMLElement>;

  searchQuery = '';
  selectedCategory = 'Todos';
  selectedFood: FoodItem | null = null;
  portions = 1;
  cachedFilteredFoods: FoodItem[] = [];

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
    this.updateFilteredFoods();
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

    // Sort once
    this.allFoods.sort((a, b) => a.alimento.localeCompare(b.alimento));
  }

  updateFilteredFoods(): void {
    let foods = this.allFoods;

    if (this.selectedCategory !== 'Todos') {
      foods = foods.filter(f => f.category === this.selectedCategory);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      foods = foods.filter(f => f.alimento.toLowerCase().includes(query));
    }

    this.cachedFilteredFoods = foods;
  }

  onSearchChange(): void {
    this.updateFilteredFoods();
  }

  onCategoryChange(categoryKey: string): void {
    this.selectedCategory = categoryKey;
    this.updateFilteredFoods();
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

  // Swipe-to-close
  private touchStartY = 0;
  private touchCurrentY = 0;
  sheetTranslateY = 0;
  isDragging = false;

  onTouchStart(event: TouchEvent): void {
    // Only allow swipe-to-close when food list is at top (not mid-scroll)
    const listEl = this.foodListEl?.nativeElement;
    if (listEl && listEl.scrollTop > 0) return;

    this.touchStartY = event.touches[0].clientY;
    this.isDragging = true;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    this.touchCurrentY = event.touches[0].clientY;
    const delta = this.touchCurrentY - this.touchStartY;
    this.sheetTranslateY = Math.max(0, delta);
  }

  onTouchEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (this.sheetTranslateY > 100) {
      this.close.emit();
    }
    this.sheetTranslateY = 0;
  }
}
