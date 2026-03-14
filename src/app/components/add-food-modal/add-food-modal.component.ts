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

  // Swipe-to-close
  private touchStartY = 0;
  private touchCurrentY = 0;
  sheetTranslateY = 0;
  isDragging = false;

  onTouchStart(event: TouchEvent): void {
    this.touchStartY = event.touches[0].clientY;
    this.isDragging = true;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    this.touchCurrentY = event.touches[0].clientY;
    const delta = this.touchCurrentY - this.touchStartY;
    // Only allow dragging down
    this.sheetTranslateY = Math.max(0, delta);
  }

  onTouchEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    // Close if dragged more than 100px down
    if (this.sheetTranslateY > 100) {
      this.close.emit();
    }
    this.sheetTranslateY = 0;
  }
}
