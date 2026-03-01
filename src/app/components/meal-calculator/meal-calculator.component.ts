import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FoodCalculatorService } from '../../services/food-calculator.service';
import { ProfileConfigService } from '../../services/profile-config.service';
import { FoodItem } from '../../models/food.model';

@Component({
  selector: 'app-meal-calculator',
  templateUrl: './meal-calculator.component.html',
  styleUrls: ['./meal-calculator.component.css']
})
export class MealCalculatorComponent implements OnInit, OnChanges {
  @Input() currentProfile: string = 'Angel';
  
  mealPlan: { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } = {};
  showAlternatives: string | null = null;
  showAddFood: string | null = null;
  selectedMealType: string = this.getDefaultMealType();
  rawItems: Set<string> = new Set(); // Rastrear qué items el usuario cambió a modo crudo
  swappingItem: string | null = null; // ID del item animándose
  swapDirection: 'left' | 'right' = 'right';
  isLoading: boolean = false;
  isSummaryLoading: boolean = false;
  skeletonItemCount: number = 4;
  showCategories: boolean = false;
  showSummaryAlternatives: string | null = null;
  
  mealTypes = [
    { key: 'DESAYUNO', label: 'Desayuno', icon: '🌅' },
    { key: 'COMIDA', label: 'Comida', icon: '🍽️' },
    { key: 'MERIENDA', label: 'Merienda', icon: '☕' },
    { key: 'CENA', label: 'Cena', icon: '🌙' }
  ];

  macroCategories = [
    { key: 'Proteina Semi-Magra', label: 'Proteína Semigrasa', icon: '🐟', color: '#2ECC71' },
    { key: 'Proteina Magra', label: 'Proteína Magra', icon: '🥩', color: '#4ECDC4' },
    { key: 'Carbohidratos', label: 'Carbohidratos', icon: '🍞', color: '#FF6B6B' },
    { key: 'Lácteos', label: 'Lácteos', icon: '🥛', color: '#3498DB' },
    { key: 'Grasas', label: 'Grasas', icon: '🥑', color: '#45B7D1' },
    { key: 'Frutas', label: 'Frutas', icon: '🍓', color: '#FECA57' },
    { key: 'Vegetales', label: 'Vegetales', icon: '🥬', color: '#2ECC71' }
    // { key: 'Legumbres', label: 'Legumbres', icon: '🫘', color: '#8B4513' },
  ];

  private getDefaultMealType(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'DESAYUNO';
    if (hour >= 12 && hour < 16) return 'COMIDA';
    if (hour >= 16 && hour < 19) return 'MERIENDA';
    return 'CENA';
  }

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentProfile'] && !changes['currentProfile'].firstChange) {
      // Activar skeleton cuando cambia el perfil
      this.isLoading = true;
      
      // Simular un pequeño delay para mostrar el skeleton
      setTimeout(() => {
        this.loadProfileDailyTarget();
        this.isLoading = false;
      }, 500);
    }
  }

  private loadProfileDailyTarget(): void {
    // Cargar objetivos de la comida seleccionada
    this.generateMealPlanForMeal();
  }

  generateMealPlan(randomize: boolean = false): void {
    this.mealPlan = this.foodCalculatorService.generateMealPlan(this.selectedMealType, randomize);
  }

  getFoodsByCategory(category: string): FoodItem[] {
    return this.foodCalculatorService.getFoodsByCategory(category);
  }

  getTargetValue(category: string): number {
    const mealObjectives = this.getMealObjectives();
    return mealObjectives[category] || 0;
  }

  // Obtener el valor objetivo original (sin ajustes especiales)
  getOriginalTargetValue(category: string): number {
    const profileMealObjectives = this.profileConfigService.getMealObjectives(this.currentProfile);
    const mealObjectives = profileMealObjectives[this.selectedMealType];
    
    if (!mealObjectives) {
      return 0;
    }

    // Mapear objetivos originales sin ajustes
    const originalObjectives = {
      'Proteina Semi-Magra': mealObjectives['proteína SM'] || 0,
      'Proteina Magra': mealObjectives['proteína M'] || 0,
      'Carbohidratos': mealObjectives['carbohidratos'] || 0,
      'Lácteos': mealObjectives['leche/yogurt'] || 0,
      'Grasas': mealObjectives['grasas'] || 0,
      'Frutas': mealObjectives['fruta'] || 0,
      'Vegetales': mealObjectives['vegetales'] || 0
    };

    return originalObjectives[category as keyof typeof originalObjectives] || 0;
  }

  // Cambiar un alimento por otro
  replaceFood(category: string, currentFood: FoodItem, newFood: FoodItem): void {
    // Para carbohidratos, usar el valor original para evitar problemas con yogur bebible
    const portions = category === 'Carbohidratos' ? this.getOriginalTargetValue(category) : this.getTargetValue(category);
    this.mealPlan = this.foodCalculatorService.replaceFood(category, currentFood, newFood, portions);
    // Forzar actualización de la vista para reflejar cambios en objetivos
    this.mealPlan = { ...this.mealPlan };
  }


  // MÉTODOS DE AJUSTE DE PORCIONES
  adjustPortions(category: string, food: FoodItem, newPortions: number): void {
    this.mealPlan = this.foodCalculatorService.adjustPortions(category, food, newPortions);
  }

  // Obtener alternativas para un alimento
  getAlternatives(category: string, currentFood: FoodItem, mealType?: string): FoodItem[] {
    return this.foodCalculatorService.getAlternatives(category, currentFood, mealType).sort((a, b) =>
      a.alimento.localeCompare(b.alimento)
    );
  }

  // Cambiar al siguiente o anterior alimento alternativo desde el resumen
  swapFoodInSummary(category: string, currentFood: FoodItem, direction: 'left' | 'right'): void {
    const alternatives = this.getAlternatives(category, currentFood, this.selectedMealType);
    if (alternatives.length > 0) {
      const itemId = this.getItemId(category, currentFood);
      this.swapDirection = direction;
      this.swappingItem = itemId;

      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * alternatives.length);
        this.replaceFood(category, currentFood, alternatives[randomIndex]);
        this.swappingItem = null;
      }, 150);
    }
  }

  isSwapping(category: string, food: FoodItem): boolean {
    return this.swappingItem === this.getItemId(category, food);
  }

  incrementPortions(category: string, food: FoodItem): void {
    const currentItem = this.mealPlan[category]?.find(item => item.food.alimento === food.alimento);
    if (currentItem) {
      const totalUsed = this.getTotalPortionsUsed(category);
      const targetPortions = this.getTargetValue(category);
      // Solo permitir incrementar si no se excede el objetivo
      if (totalUsed < targetPortions) {
        this.adjustPortions(category, food, currentItem.portions + 1);
      }
    }
  }

  decrementPortions(category: string, food: FoodItem): void {
    const currentItem = this.mealPlan[category]?.find(item => item.food.alimento === food.alimento);
    if (currentItem && currentItem.portions > 0) {
      const newPortions = currentItem.portions - 1;
      if (newPortions === 0) {
        // Si llega a 0, remover el alimento
        this.removeFoodFromPlan(category, food);
      } else {
        this.adjustPortions(category, food, newPortions);
      }
    }
  }

  // Obtener total de porciones usadas en una categoría
  getTotalPortionsUsed(category: string): number {
    if (!this.mealPlan[category]) return 0;
    return this.mealPlan[category].reduce((total, item) => total + item.portions, 0);
  }

  // Obtener porciones restantes disponibles
  getRemainingPortions(category: string): number {
    const target = this.getTargetValue(category);
    const used = this.getTotalPortionsUsed(category);
    return Math.max(0, target - used);
  }

  // Verificar si se pueden agregar más porciones
  canAddMorePortions(category: string): boolean {
    return this.getRemainingPortions(category) > 0;
  }

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
    const allFoods = this.getFoodsByCategory(category);

    // Filtrar por preferencias del perfil
    const prefs = this.profileConfigService.getFoodPreferences(this.currentProfile);
    const prefList = prefs[category];
    let preferredFoods = allFoods;
    if (prefList && prefList.length > 0) {
      preferredFoods = allFoods.filter(f => prefList.includes(f.alimento));
    }

    // Filtrar por tipo de comida
    const normalizedMealType = this.selectedMealType.toLowerCase();
    const filteredFoods = preferredFoods.filter(food =>
      food.tipo && food.tipo.includes(normalizedMealType)
    );

    // Excluir los alimentos ya en el plan y ordenar alfabéticamente
    return filteredFoods
      .filter(food => !currentFoods.includes(food.alimento))
      .sort((a, b) => a.alimento.localeCompare(b.alimento));
  }

  // Regenerar el menú completo con selección aleatoria
  regenerateMeal(): void {
    this.skeletonItemCount = this.getActiveCategories().reduce((total, cat) =>
      total + (this.mealPlan[cat.key]?.length || 0), 0) || 4;
    this.isSummaryLoading = true;
    setTimeout(() => {
      const mealObjectives = this.getMealObjectives();
      this.foodCalculatorService.setDailyTarget(mealObjectives as any);
      this.foodCalculatorService.setCurrentMealType(this.selectedMealType);
      const prefs = this.profileConfigService.getFoodPreferences(this.currentProfile);
      this.foodCalculatorService.setFoodPreferences(prefs);
      this.generateMealPlan(true);
      this.rawItems.clear();
      this.isSummaryLoading = false;
    }, 500);
  }

  // Cambiar tipo de comida
  selectMealType(mealType: string): void {
    this.selectedMealType = mealType;
    this.isLoading = true;
    
    // Simular un pequeño delay para mostrar el skeleton
    setTimeout(() => {
      this.generateMealPlanForMeal();
      this.isLoading = false;
    }, 500);
  }

  // Obtener objetivos de la comida seleccionada
  getMealObjectives(): { [category: string]: number } {
    const profileMealObjectives = this.profileConfigService.getMealObjectives(this.currentProfile);
    const mealObjectives = profileMealObjectives[this.selectedMealType];
    
    if (!mealObjectives) {
      return {};
    }

    // Mapear objetivos de la comida a categorías del sistema
    let objectives = {
      'Proteina Semi-Magra': mealObjectives['proteína SM'] || 0,
      'Proteina Magra': mealObjectives['proteína M'] || 0,
      'Carbohidratos': mealObjectives['carbohidratos'] || 0,
      'Lácteos': mealObjectives['leche/yogurt'] || 0,
      'Grasas': mealObjectives['grasas'] || 0,
      'Frutas': mealObjectives['fruta'] || 0,
      'Vegetales': mealObjectives['vegetales'] || 0
    };

    // Aplicar regla especial para yogur proteico bebible
    if (this.mealPlan && this.mealPlan['Proteina Magra']) {
      const hasYogurBebible = this.mealPlan['Proteina Magra'].some(
        item => item.food.alimento === 'Yogur proteico bebible' && item.portions > 0
      );
      
      if (hasYogurBebible) {
        // Reducir carbohidratos en 1 porción
        objectives['Carbohidratos'] = Math.max(0, objectives['Carbohidratos'] - 1);
      }
    }

    // Aplicar regla especial para yogur proteico sabores
    if (this.mealPlan && this.mealPlan['Proteina Magra']) {
      const hasYogurSabores = this.mealPlan['Proteina Magra'].some(
        item => item.food.alimento === 'Yogur proteico sabores' && item.portions > 0
      );
      
      if (hasYogurSabores) {
        // Reducir carbohidratos en 1 porción
        objectives['Carbohidratos'] = Math.max(0, objectives['Carbohidratos'] - 1);
      }
    }

    // Aplicar regla especial para helado proteico
    if (this.mealPlan && this.mealPlan['Proteina Magra']) {
      const hasHelado = this.mealPlan['Proteina Magra'].some(
        item => item.food.alimento === 'Helado proteico' && item.portions > 0
      );
      
      if (hasHelado) {
        // Reducir carbohidratos en 1 porción
        objectives['Carbohidratos'] = Math.max(0, objectives['Carbohidratos'] - 1);
      }
    }

    // Aplicar regla especial para salmón
    if (this.mealPlan && this.mealPlan['Proteina Magra']) {
      const hasSalmon = this.mealPlan['Proteina Magra'].some(
        item => item.food.alimento === 'Salmón' && item.portions > 0
      );
      
      if (hasSalmon) {
        // Eliminar grasas del plan
        objectives['Grasas'] = 0;
      }
      // Si no hay salmón, mantener las grasas originales (no hacer nada)
    }

    return objectives;
  }

  // Generar plan de comidas para la comida seleccionada
  generateMealPlanForMeal(): void {
    const mealObjectives = this.getMealObjectives();
    this.foodCalculatorService.setDailyTarget(mealObjectives as any);
    this.foodCalculatorService.setCurrentMealType(this.selectedMealType);
    // Pasar preferencias de alimentos del perfil actual
    const prefs = this.profileConfigService.getFoodPreferences(this.currentProfile);
    this.foodCalculatorService.setFoodPreferences(prefs);
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
    if (this.rawItems.has(itemId)) {
      this.rawItems.delete(itemId);
    } else {
      this.rawItems.add(itemId);
    }
  }

  // Verificar si un item está en modo cocinado (por defecto sí, salvo que el usuario lo haya cambiado)
  isCookedMode(category: string, food: FoodItem): boolean {
    const itemId = this.getItemId(category, food);
    return !this.rawItems.has(itemId);
  }

  // Obtener el peso a mostrar (siempre cocinado cuando aplica)
  getDisplayWeight(category: string, food: FoodItem, totalAmount: string): string {
    if (this.shouldShowCookedWeight(totalAmount) &&
        this.shouldCategoryShowCookedWeight(category) &&
        food.alimento !== 'Helado proteico') {
      return this.getCookedWeight(totalAmount);
    }
    return totalAmount;
  }

  // Verificar si el alimento debe mostrar peso cocinado (solo gramos y tazas de ciertas categorías)
  shouldShowCookedWeight(totalAmount: string): boolean {
    return (totalAmount.includes('g') || totalAmount.includes('taza')) && 
           !totalAmount.includes('unidad') && 
           !totalAmount.includes('lata') &&
           !totalAmount.includes('helado'); // Excluir helado proteico
  }

  // Verificar si la categoría permite peso cocinado
  shouldCategoryShowCookedWeight(category: string): boolean {
    const categoriesWithCookedWeight = ['Carbohidratos', 'Proteina Magra', 'Proteina Semi-Magra', 'Lácteos', 'Vegetales'];
    return categoriesWithCookedWeight.includes(category);
  }

  // Calcular peso cocinado (restando 20% para gramos, 50% para tazas)
  getCookedWeight(totalAmount: string): string {
    // Extraer el número del totalAmount
    const match = totalAmount.match(/(\d+)/);
    if (match) {
      const rawWeight = parseInt(match[1]);
      
      // Lógica específica para vegetales (tazas): 1/2 taza cocinado = 1 taza crudo
      if (totalAmount.includes('taza')) {
        const cookedWeight = rawWeight * 0.5; // 50% para vegetales
        
        // Manejar fracciones para tazas
        if (cookedWeight === 0.5) {
          return '1/2 taza cocinado';
        } else if (cookedWeight === 1.5) {
          return '1 1/2 tazas cocinado';
        } else if (cookedWeight === 2.5) {
          return '2 1/2 tazas cocinado';
        } else {
          const roundedWeight = Math.round(cookedWeight);
          return `${roundedWeight} taza${roundedWeight > 1 ? 's' : ''} cocinado`;
        }
      } else {
        // Lógica para otros alimentos (gramos): restar 20%
        const cookedWeight = Math.round(rawWeight * 0.8);
        
        // Mantener la unidad original
        if (totalAmount.includes('g')) {
          return `${cookedWeight}g cocinado`;
        } else if (totalAmount.includes('unidad')) {
          return `${cookedWeight} unidades cocinadas`;
        } else {
          return `${cookedWeight} cocinado`;
        }
      }
    }
    return totalAmount;
  }

  // Cerrar todos los dropdowns
  closeDropdowns(): void {
    this.showAlternatives = null;
    this.showAddFood = null;
    this.showSummaryAlternatives = null;
  }

  // Obtener el icono del alimento actual en la categoría
  getCategoryIcon(categoryKey: string): string {
    const categoryItems = this.mealPlan[categoryKey];
    if (categoryItems && categoryItems.length > 0) {
      const currentFood = categoryItems[0].food.alimento;
      return this.getFoodIcon(currentFood);
    }
    // Fallback al icono de categoría si no hay alimentos
    const category = this.macroCategories.find(cat => cat.key === categoryKey);
    return category ? category.icon : '🍽️';
  }

  // Mapear alimentos a iconos
  getFoodIcon(foodName: string): string {
    const foodIcons: { [key: string]: string } = {
      // Carbohidratos
      'Arroz': '🍚',
      'Pasta': '🍝',
      'Gnocchis': '🍝',
      'Quinoa': '🌾',
      'Avena/harina de avena': '🥣',
      'Pan de molde': '🍞',
      'Pan tostado': '🍞',
      'Pan thins': '🍞',
      'Tortitas de arroz/maíz': '🍘',
      'Tortilla para fajitas': '🌮',
      'Miel': '🍯',
      'Maíz dulce': '🌽',
      'Cous-cous': '🌾',
      'Palomitas de maíz': '🍿',
      'Granola baja en grasa': '🥣',
      'Casabe': '🍞',
      'Pan Árabe': '🫓',
      'Pan Wasa': '🍞',
      'Galleta María': '🍪',
      'Cornflakes': '🥣',
      'Pan blanco o integral de barra': '🥖',
      'Azúcar blanco/moreno': '🍬',
      'Crema de arroz': '🥣',
      'Patata': '🥔',
      'Boniato': '🍠',
      'Plátano macho': '🍌',
      'Yuca (cocido)': '🫚',
      'Fajitas medianas': '🫓',
      'Harina de maíz': '🌽',
      'Harina de maíz (pan)': '🌽',

      // Legumbres
      'Lentejas': '🫘',
      'Garbanzos': '🫘',
      'Frijoles/caraotas/alubias': '🫘',

      // Proteína Magra
      'Pechuga de pollo/pavo': '🍗',
      'Pescado blanco': '🐟',
      'Camarones/gambas': '🦐',
      'Atún al natural en lata': '🐟',
      'Clara de huevo': '🥚',
      'Jamón de pollo/pavo': '🥩',
      'Lomo embuchado': '🥩',
      'Proteína en polvo (whey y vegana)': '🥤',
      'Proteína en polvo': '🥤',
      'Lomo de cerdo': '🍖',
      'Soja': '🫘',
      'Seitán': '🌾',
      'Queso burgos light/desnatado': '🧀',
      'Yogur proteico': '🍨',
      'Yogur proteico bebible': '🥤',
      'Yogur proteico sabores': '🍨',
      'Gelatina proteica': '🍮',
      'Yogur straciatella': '🍨',
      'Yogur proteico natural': '🍨',
      'Queso fresco batido 0%': '🧀',
      'Queso havarti light': '🧀',
      'Queso mozzarella light': '🧀',
      'Queso cottage': '🧀',
      'Queso fresco light': '🧀',
      'Salmón': '🐟',
      'Helado proteico': '🍦',
      'Carne roja magra': '🥩',

      // Proteína Semi-Magra
      'Huevo': '🥚',
      'Salmón, caballa': '🐟',
      'Carne de cerdo (graso)': '🥩',
      'Carne roja grasa': '🥩',
      'Jamón serrano/ibérico': '🥩',
      'Atún en aceite': '🐟',
      'Tofu': '🧈',
      'Queso burgos natural': '🧀',
      'Queso mozzarella normal': '🧀',
      'Queso parmesano': '🧀',

      // Lácteos
      'Leche desnatada': '🥛',
      'Leche descremada/desnatada': '🥛',
      'Leche semidesnatada': '🥛',
      'Leche entera': '🥛',
      'Leche de cabra': '🥛',
      'Leche de oveja': '🥛',
      'Yogur natural desnatado': '🍶',
      'Yogur griego desnatado': '🍶',
      'Yogur descremado (s/a)': '🍶',
      'Yogur semidesnatado (s/a)': '🍶',
      'Yogur natural entero': '🍶',
      'Cuajada': '🍮',
      'Kefir': '🥛',
      'Queso fresco desnatado': '🧀',

      // Grasas
      'Aguacate': '🥑',
      'Almendras': '🌰',
      'Nueces': '🥜',
      'Aceitunas': '🫒',
      'Mantequilla': '🧈',
      'Mantequilla de maní': '🥜',
      'Crema de frutos secos': '🥜',
      'Coco rallado': '🥥',
      'Aceituna verde (deshuesadas)': '🫒',
      'Aceitunas negras': '🫒',
      'Cacahuetes/maní': '🥜',
      'Chocolate negro (70-75%)': '🍫',
      'Nata para cocinar 15%': '🍶',
      'Leche de coco': '🥥',
      'Semillas de girasol, ajonjolí, chía': '🌻',
      'Queso Crema normal': '🧀',
      'Queso feta': '🧀',
      'Avellanas': '🌰',
      'Cashews/anacardos': '🥜',
      'Pistachos': '🥜',
      'Aceite de oliva': '🫒',
      'Aceite de coco': '🥥',
      'Mayonesa': '🫙',
      'Hummus': '🫘',

      // Frutas
      'Banana': '🍌',
      'Manzana': '🍎',
      'Pera': '🍐',
      'Kiwi': '🥝',
      'Durazno/melocotón': '🍑',
      'Ciruela': '🍑',
      'Uvas': '🍇',
      'Naranja': '🍊',
      'Mandarina': '🍊',
      'Cerezas': '🍒',
      'Granada': '🫐',
      'Uvas pasas': '🍇',
      'Dátiles': '🌴',
      'Fresas': '🍓',
      'Piña': '🍍',
      'Melón': '🍈',
      'Sandía': '🍉',
      'Frambuesas': '🫐',
      'Moras': '🫐',
      'Arándanos': '🫐',
      'Papaya': '🥭',
      'Mango': '🥭',

      // Vegetales
      'Acelgas': '🥬',
      'Hinojo': '🥬',
      'Ají dulce': '🌶️',
      'Hongos': '🍄',
      'Ajo': '🧄',
      'Jugo de tomate': '🍅',
      'Ajo porro': '🧄',
      'Lechuga': '🥬',
      'Alcachofa': '🥬',
      'Nabo': '🥬',
      'Pimiento': '🫑',
      'Calabacín': '🥒',
      'Quimbombó': '🥬',
      'Cebolla': '🧅',
      'Rábanos': '🥬',
      'Cebollín': '🧅',
      'Remolacha': '🟣',
      'Apio': '🥬',
      'Alfalfa': '🌱',
      'Palmito': '🌴',
      'Calabaza': '🎃',
      'Pepino': '🥒',
      'Berenjena': '🍆',
      'Perejil': '🌿',
      'Berros': '🥬',
      'Brócoli': '🥦',
      'Chayota': '🥬',
      'Repollo': '🥬',
      'Coliflor': '🥦',
      'Tomate': '🍅',
      'Corazón de alcachofa': '🥬',
      'Tomate en lata': '🍅',
      'Repollitos de Bruselas': '🥬',
      'Escarola': '🥬',
      'Vainitas': '🫛',
      'Espárragos': '🌿',
      'Vegetales chinos': '🥬',
      'Espinaca': '🥬',
      'Zanahoria': '🥕',
      'Edamames': '🫛'
    };

    return foodIcons[foodName] || '🍽️';
  }

  // Obtener la etiqueta del tipo de comida seleccionado
  getMealTypeLabel(): string {
    const mealType = this.mealTypes.find(type => type.key === this.selectedMealType);
    return mealType ? mealType.label : 'comida';
  }

  // Obtener el texto de porciones con pluralización correcta
  getPortionsText(category: string): string {
    const value = this.getTargetValue(category);
    return value === 1 ? '1 porción' : `${value} porciones`;
  }

  // Obtener el total de porciones usadas en todas las categorías
  getTotalPortionsUsedGlobal(): number {
    const activeCategories = this.getActiveCategories();
    return activeCategories.reduce((total, category) => {
      return total + this.getTotalPortionsUsed(category.key);
    }, 0);
  }

  // Obtener el total de porciones objetivo en todas las categorías
  getTotalPortionsTargetGlobal(): number {
    const activeCategories = this.getActiveCategories();
    return activeCategories.reduce((total, category) => {
      return total + this.getTargetValue(category.key);
    }, 0);
  }
}
