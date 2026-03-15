import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FoodCalculatorService } from '../../services/food-calculator.service';
import { FoodItem } from '../../models/food.model';

@Component({
  selector: 'app-add-food-modal',
  templateUrl: './add-food-modal.component.html',
  styleUrls: ['./add-food-modal.component.css']
})
export class AddFoodModalComponent implements OnInit, AfterViewInit {
  @Input() mealType: string = 'DESAYUNO';
  @Input() foodIconFn: (name: string) => string = () => '🍽️';
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() editCategory: string = '';
  @Input() editFood: FoodItem | null = null;
  @Input() categoryLabel: string = '';
  @Input() categoryPortionsUsed: number = 0;
  @Input() categoryPortionsTarget: number = 0;
  @Input() editFoodCurrentPortions: number = 0;
  @Output() addFood = new EventEmitter<{ food: FoodItem, portions: number }>();
  @Output() replaceFood = new EventEmitter<{ food: FoodItem, portions: number }>();
  @Output() close = new EventEmitter<void>();
  @ViewChild('foodListEl') foodListEl?: ElementRef<HTMLElement>;
  @ViewChild('chipsContainer') chipsContainer?: ElementRef<HTMLElement>;

  searchQuery = '';
  selectedCategory = 'Todos';
  selectedFood: FoodItem | null = null;
  portions = 1;
  portionAnimating = false;
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
    if (this.mode === 'edit' && this.editCategory) {
      this.selectedCategory = this.editCategory;
    }
    this.updateFilteredFoods();
  }

  ngAfterViewInit(): void {
    if (this.selectedCategory !== 'Todos') {
      setTimeout(() => this.scrollToActiveChip(), 50);
    }
    if (this.mode === 'edit' && this.editFood) {
      setTimeout(() => this.scrollToCurrentFood(), 100);
    }
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
    setTimeout(() => this.scrollToActiveChip(), 0);
  }

  private scrollToActiveChip(): void {
    const container = this.chipsContainer?.nativeElement;
    if (!container) return;
    const activeChip = container.querySelector(`[data-category="${this.selectedCategory}"]`) as HTMLElement;
    if (!activeChip) return;
    const chipRight = activeChip.offsetLeft + activeChip.offsetWidth;
    const containerWidth = container.offsetWidth;
    const padding = 20;
    // Only scroll if the chip is not fully visible
    if (chipRight > container.scrollLeft + containerWidth) {
      container.scrollTo({
        left: chipRight - containerWidth + padding,
        behavior: 'smooth'
      });
    } else if (activeChip.offsetLeft < container.scrollLeft) {
      container.scrollTo({
        left: activeChip.offsetLeft - padding,
        behavior: 'smooth'
      });
    }
  }

  private scrollToCurrentFood(): void {
    const listEl = this.foodListEl?.nativeElement;
    if (!listEl || !this.editFood) return;
    const item = listEl.querySelector('.current-food') as HTMLElement;
    if (!item) return;
    item.scrollIntoView({ block: 'center', behavior: 'smooth' });
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
    this.triggerPortionAnimation();
  }

  decrementPortions(): void {
    if (this.portions > 1) {
      this.portions--;
      this.triggerPortionAnimation();
    }
  }

  private triggerPortionAnimation(): void {
    this.portionAnimating = false;
    setTimeout(() => { this.portionAnimating = true; }, 0);
    setTimeout(() => { this.portionAnimating = false; }, 300);
  }

  getMealLabel(): string {
    const labels: Record<string, string> = {
      'DESAYUNO': 'desayuno',
      'COMIDA': 'almuerzo',
      'ALMUERZO': 'almuerzo',
      'MERIENDA': 'merienda',
      'CENA': 'cena'
    };
    return labels[this.mealType] || 'comida';
  }

  getProjectedPortions(): number {
    return this.categoryPortionsUsed - this.editFoodCurrentPortions + this.portions;
  }

  private readonly rawToCookedFoods = [
    'Pescado blanco', 'Pechuga de pollo', 'Pechuga de pavo', 'Clara de huevo',
    'Carne roja magra', 'Lomo de cerdo', 'Salmón',
    'Carne de cerdo (graso)', 'Carne roja grasa',
    'Patata', 'Gnocchis', 'Boniato', 'Plátano macho'
  ];

  private isRawToCooked(): boolean {
    return !!this.selectedFood && this.rawToCookedFoods.includes(this.selectedFood.alimento);
  }

  getCookingState(): string {
    if (!this.selectedFood) return '';
    const raw = this.selectedFood.gramos;
    if (/cocido/i.test(raw)) return 'cocido';
    if (/crudo/i.test(raw)) return 'crudo';
    if (this.isRawToCooked()) return 'cocinado';
    return '';
  }

  private stripCookingState(text: string): string {
    return text.replace(/\s*(cocido|crudo)\s*/gi, '').trim();
  }

  getScaledGrams(): string {
    if (!this.selectedFood) return '';
    const raw = this.selectedFood.gramos;

    // Match patterns like "90g", "20g"
    const gramMatch = raw.match(/^(\d+)\s*g$/i);
    if (gramMatch) {
      let total = parseInt(gramMatch[1], 10) * this.portions;
      // Convert raw to cooked weight (~75%)
      if (this.isRawToCooked()) {
        total = Math.round(total * 0.75);
      }
      return total + 'g';
    }

    // Match fractions like "1/2 taza cocido", "1/3 taza cocido"
    const fractionMatch = raw.match(/^(\d+)\/(\d+)\s+(.+)$/);
    if (fractionMatch) {
      const num = parseInt(fractionMatch[1], 10) * this.portions;
      const den = parseInt(fractionMatch[2], 10);
      const unit = this.stripCookingState(fractionMatch[3]);
      if (num % den === 0) {
        const whole = num / den;
        return whole + ' ' + unit;
      }
      return num + '/' + den + ' ' + unit;
    }

    // Match "1 unidad", "2 unidades"
    const unitMatch = raw.match(/^(\d+)\s+(.+)$/);
    if (unitMatch) {
      const count = parseInt(unitMatch[1], 10) * this.portions;
      let unit = this.stripCookingState(unitMatch[2]);
      // Handle singular/plural for "unidad"/"unidades"
      if (count === 1 && unit.endsWith('es')) {
        unit = unit.replace(/es$/, '');
      } else if (count > 1 && unit === 'unidad') {
        unit = 'unidades';
      }
      return count + ' ' + unit;
    }

    return this.portions > 1 ? this.portions + ' × ' + raw : raw;
  }

  onAdd(): void {
    if (this.selectedFood) {
      if (this.mode === 'edit') {
        this.replaceFood.emit({ food: this.selectedFood, portions: this.portions });
      } else {
        this.addFood.emit({ food: this.selectedFood, portions: this.portions });
      }
      this.close.emit();
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
