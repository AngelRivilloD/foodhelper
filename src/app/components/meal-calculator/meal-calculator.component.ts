import { Component, OnInit, Input } from '@angular/core';
import { FoodCalculatorService } from '../../services/food-calculator.service';
import { ProfileConfigService } from '../../services/profile-config.service';
import { FoodItem } from '../../models/food.model';

@Component({
  selector: 'app-meal-calculator',
  templateUrl: './meal-calculator.component.html',
  styleUrls: ['./meal-calculator.component.css']
})
export class MealCalculatorComponent implements OnInit {
  @Input() currentProfile: string = 'Angel';
  
  mealPlan: { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } = {};
  showAlternatives: string | null = null;
  showAddFood: string | null = null;
  selectedMealType: string = 'DESAYUNO';
  cookedItems: Set<string> = new Set(); // Rastrear qué items están en modo cocinado
  
  mealTypes = [
    { key: 'DESAYUNO', label: 'Desayuno', icon: '🌅' },
    { key: 'COMIDA', label: 'Comida', icon: '🍽️' },
    { key: 'MERIENDA', label: 'Merienda', icon: '☕' },
    { key: 'CENA', label: 'Cena', icon: '🌙' }
  ];

  macroCategories = [
    { key: 'Carbohidratos', label: 'Carbohidratos', icon: '🍞', color: '#FF6B6B' },
    // { key: 'Legumbres', label: 'Legumbres', icon: '🫘', color: '#8B4513' },
    { key: 'Proteina Magra', label: 'Proteína Magra', icon: '🥩', color: '#4ECDC4' },
    { key: 'Proteina Semi-Magra', label: 'Proteína SM', icon: '🐟', color: '#2ECC71' },
    { key: 'Lácteos', label: 'Lácteos', icon: '🥛', color: '#3498DB' },
    { key: 'Grasas', label: 'Grasas', icon: '🥑', color: '#45B7D1' },
    { key: 'Frutas', label: 'Frutas', icon: '🍓', color: '#FECA57' }
  ];

  constructor(
    private foodCalculatorService: FoodCalculatorService,
    private profileConfigService: ProfileConfigService
  ) {}

  ngOnInit(): void {
    this.loadProfileDailyTarget();
    
    // Suscribirse a cambios en el perfil
    this.profileConfigService.dailyTarget$.subscribe(() => {
      this.loadProfileDailyTarget();
    });
  }

  private loadProfileDailyTarget(): void {
    // Cargar objetivos de la comida seleccionada
    this.generateMealPlanForMeal();
  }

  generateMealPlan(): void {
    this.mealPlan = this.foodCalculatorService.generateMealPlan(this.selectedMealType);
  }

  getFoodsByCategory(category: string): FoodItem[] {
    return this.foodCalculatorService.getFoodsByCategory(category);
  }

  getTargetValue(category: string): number {
    const mealObjectives = this.getMealObjectives();
    return mealObjectives[category] || 0;
  }

  // Cambiar un alimento por otro
  replaceFood(category: string, currentFood: FoodItem, newFood: FoodItem): void {
    this.mealPlan = this.foodCalculatorService.replaceFood(category, currentFood, newFood, this.getTargetValue(category));
  }


  // MÉTODOS DE AJUSTE DE PORCIONES - OCULTOS
  // adjustPortions(category: string, food: FoodItem, newPortions: number): void {
  //   this.mealPlan = this.foodCalculatorService.adjustPortions(category, food, newPortions);
  // }

  // Obtener alternativas para un alimento
  getAlternatives(category: string, currentFood: FoodItem, mealType?: string): FoodItem[] {
    return this.foodCalculatorService.getAlternatives(category, currentFood, mealType).sort((a, b) => 
      a.alimento.localeCompare(b.alimento)
    );
  }

  // incrementPortions(category: string, food: FoodItem): void {
  //   const currentItem = this.mealPlan[category]?.find(item => item.food.alimento === food.alimento);
  //   if (currentItem) {
  //     this.adjustPortions(category, food, currentItem.portions + 1);
  //   }
  // }

  // decrementPortions(category: string, food: FoodItem): void {
  //   const currentItem = this.mealPlan[category]?.find(item => item.food.alimento === food.alimento);
  //   if (currentItem && currentItem.portions > 1) {
  //     this.adjustPortions(category, food, currentItem.portions - 1);
  //   }
  // }

  // Agregar un nuevo alimento al plan
  addFoodToPlan(category: string, food: FoodItem): void {
    this.mealPlan = this.foodCalculatorService.addFoodToPlan(category, food, 1);
  }

  // Remover un alimento del plan
  removeFoodFromPlan(category: string, food: FoodItem): void {
    this.mealPlan = this.foodCalculatorService.removeFoodFromPlan(category, food);
  }

  // Obtener alimentos disponibles para agregar (excluyendo los ya en el plan)
  getAvailableFoods(category: string): FoodItem[] {
    const currentFoods = this.mealPlan[category]?.map(item => item.food.alimento) || [];
    return this.getFoodsByCategory(category).filter(food => !currentFoods.includes(food.alimento));
  }

  // Cambiar tipo de comida
  selectMealType(mealType: string): void {
    this.selectedMealType = mealType;
    this.generateMealPlanForMeal();
  }

  // Obtener objetivos de la comida seleccionada
  getMealObjectives(): { [category: string]: number } {
    const profileMealObjectives = this.profileConfigService.getMealObjectives(this.currentProfile);
    const mealObjectives = profileMealObjectives[this.selectedMealType];
    
    if (!mealObjectives) {
      return {};
    }

    // Mapear objetivos de la comida a categorías del sistema
    return {
      'Carbohidratos': mealObjectives['carbohidratos'] || 0,
      'Proteina Magra': mealObjectives['proteína M'] || 0,
      'Proteina Semi-Magra': mealObjectives['proteína SM'] || 0,
      'Lácteos': mealObjectives['leche/yogurt'] || 0,
      'Grasas': mealObjectives['grasas'] || 0,
      'Frutas': mealObjectives['fruta'] || 0
    };
  }

  // Generar plan de comidas para la comida seleccionada
  generateMealPlanForMeal(): void {
    const mealObjectives = this.getMealObjectives();
    this.foodCalculatorService.setDailyTarget(mealObjectives as any);
    this.foodCalculatorService.setCurrentMealType(this.selectedMealType);
    this.generateMealPlan();
  }

  // Obtener categorías que tienen objetivos > 0 para la comida seleccionada
  getActiveCategories(): any[] {
    const mealObjectives = this.getMealObjectives();
    return this.macroCategories.filter(category => {
      const objectiveValue = mealObjectives[category.key];
      return objectiveValue && objectiveValue > 0;
    });
  }

  // Generar ID único para cada item
  getItemId(category: string, food: FoodItem): string {
    return `${category}-${food.alimento}`;
  }

  // Toggle entre peso original y cocinado
  toggleCookedWeight(category: string, food: FoodItem): void {
    const itemId = this.getItemId(category, food);
    if (this.cookedItems.has(itemId)) {
      this.cookedItems.delete(itemId);
    } else {
      this.cookedItems.add(itemId);
    }
  }

  // Verificar si un item está en modo cocinado
  isCookedMode(category: string, food: FoodItem): boolean {
    const itemId = this.getItemId(category, food);
    return this.cookedItems.has(itemId);
  }

  // Obtener el peso a mostrar (original o cocinado)
  getDisplayWeight(category: string, food: FoodItem, totalAmount: string): string {
    // Solo aplicar lógica de cocinado a alimentos medidos en gramos de categorías específicas
    if (this.isCookedMode(category, food) && 
        this.shouldShowCookedWeight(totalAmount) && 
        this.shouldCategoryShowCookedWeight(category)) {
      return this.getCookedWeight(totalAmount);
    }
    return totalAmount;
  }

  // Verificar si el alimento debe mostrar peso cocinado (solo gramos de ciertas categorías)
  shouldShowCookedWeight(totalAmount: string): boolean {
    return totalAmount.includes('g') && !totalAmount.includes('unidad') && !totalAmount.includes('lata');
  }

  // Verificar si la categoría permite peso cocinado
  shouldCategoryShowCookedWeight(category: string): boolean {
    const categoriesWithCookedWeight = ['Carbohidratos', 'Proteina Magra', 'Proteina Semi-Magra', 'Lácteos'];
    return categoriesWithCookedWeight.includes(category);
  }

  // Calcular peso cocinado (restando 20%)
  getCookedWeight(totalAmount: string): string {
    // Extraer el número del totalAmount
    const match = totalAmount.match(/(\d+)/);
    if (match) {
      const rawWeight = parseInt(match[1]);
      const cookedWeight = Math.round(rawWeight * 0.8); // Restar 20%
      
      // Mantener la unidad original
      if (totalAmount.includes('g')) {
        return `${cookedWeight}g cocinado`;
      } else if (totalAmount.includes('unidad')) {
        return `${cookedWeight} unidades cocinadas`;
      } else {
        return `${cookedWeight} cocinado`;
      }
    }
    return totalAmount;
  }

  // Cerrar todos los dropdowns
  closeDropdowns(): void {
    this.showAlternatives = null;
  }
}
