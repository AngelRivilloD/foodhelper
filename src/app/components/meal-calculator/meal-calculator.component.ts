import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FoodCalculatorService } from '../../services/food-calculator.service';
import { ProfileConfigService } from '../../services/profile-config.service';
import { DailyProgressService } from '../../services/daily-progress.service';
import { FoodItem, FixedWeeklyPlan, FixedMealEntry } from '../../models/food.model';
import { MatchResult } from '../../models/voice.model';

@Component({
  selector: 'app-meal-calculator',
  templateUrl: './meal-calculator.component.html',
  styleUrls: ['./meal-calculator.component.css']
})
export class MealCalculatorComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() currentProfile: string = 'Angel';
  @ViewChild('daySelectorButtons') daySelectorButtons!: ElementRef;
  
  mealPlan: { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } = {};
  showAlternatives: string | null = null;
  showAddFood: string | null = null;
  selectedMealType: string = this.getDefaultMealType();
  rawItems: Set<string> = new Set(); // Rastrear qué items el usuario cambió a modo crudo
  isLoading: boolean = false;
  isSummaryLoading: boolean = false;
  skeletonItemCount: number = 4;
  showCategories: boolean = false;
  showSummaryAlternatives: string | null = null;
  showCelebration = false;
  celebrationMealType = '';
  celebrationMealLabel = '';
  showConfirmedMenu: string | null = null;

  // Fixed meal plan
  mealPlanMode: 'dynamic' | 'fixed' = 'dynamic';
  fixedPlan: FixedWeeklyPlan = {};
  selectedDay: string = '';
  weekDays = [
    { key: 'Lunes', short: 'L' },
    { key: 'Martes', short: 'M' },
    { key: 'Miércoles', short: 'X' },
    { key: 'Jueves', short: 'J' },
    { key: 'Viernes', short: 'V' },
    { key: 'Sábado', short: 'S' },
    { key: 'Domingo', short: 'D' }
  ];
  fixedMealSlots = [
    { key: 'DESAYUNO', label: 'Desayuno', icon: '🥐', time: '8:00' },
    { key: 'COMIDA', label: 'Almuerzo', icon: '🍲', time: '12:30' },
    { key: 'MERIENDA', label: 'Merienda', icon: '🍎', time: '16:00' },
    { key: 'CENA', label: 'Cena', icon: '🥗', time: '20:00' }
  ];

  mealTypes = [
    { key: 'DESAYUNO', label: 'Desayuno', icon: '🌅' },
    { key: 'COMIDA', label: 'Almuerzo', icon: '🍽️' },
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
    private profileConfigService: ProfileConfigService,
    public dailyProgressService: DailyProgressService
  ) {}

  ngOnInit(): void {
    this.loadMealPlanMode();
    this.loadProfileDailyTarget();

    // Suscribirse a cambios en el perfil
    this.profileConfigService.dailyTarget$.subscribe(() => {
      this.loadProfileDailyTarget();
    });

    // Suscribirse a cambios de modo
    this.profileConfigService.mealPlanMode$.subscribe(() => {
      this.loadMealPlanMode();
    });

    this.dailyProgressService.initialize(this.currentProfile);
  }

  ngAfterViewInit(): void {
    this.scrollToActiveDay();
  }

  private scrollToActiveDay(): void {
    setTimeout(() => {
      const container = this.daySelectorButtons?.nativeElement;
      if (!container) return;
      const activeBtn = container.querySelector('.day-selector-btn.active') as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentProfile'] && !changes['currentProfile'].firstChange) {
      this.dailyProgressService.initialize(this.currentProfile);
      this.loadMealPlanMode();

      if (this.mealPlanMode === 'dynamic') {
        // Activar skeleton cuando cambia el perfil
        this.isLoading = true;

        // Simular un pequeño delay para mostrar el skeleton
        setTimeout(() => {
          this.loadProfileDailyTarget();
          this.isLoading = false;
        }, 500);
      }
    }
  }

  private loadProfileDailyTarget(): void {
    // Cargar objetivos de la comida seleccionada
    this.generateMealPlanForMeal();
  }

  generateMealPlan(randomize: boolean = false): void {
    this.mealPlan = this.foodCalculatorService.generateMealPlan(this.selectedMealType, randomize);
    this.updateVoiceBindings();
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

  // Cached properties for voice-input template bindings (avoid recomputing every CD cycle)
  voiceCategories: string[] = [];
  voicePortionsMapCache: { [category: string]: number } = {};

  private updateVoiceBindings(): void {
    this.voiceCategories = this.macroCategories.map(c => c.key);
    const map: { [category: string]: number } = {};
    for (const cat of this.macroCategories) {
      map[cat.key] = this.getTargetValue(cat.key);
    }
    this.voicePortionsMapCache = map;
  }

  // Track which categories were just replaced by voice for highlight animation
  voiceReplacedCategories = new Set<string>();

  /** Handle voice input results — replace first food in each matched category */
  onVoiceApply(matches: MatchResult[]): void {
    this.voiceReplacedCategories.clear();

    for (const match of matches) {
      if (!match.food || !match.category) continue;

      const categoryItems = this.mealPlan[match.category];
      if (categoryItems && categoryItems.length > 0) {
        const currentFood = categoryItems[0].food;
        this.replaceFood(match.category, currentFood, match.food);
        this.voiceReplacedCategories.add(match.category);
      }
    }

    // Clear highlights after animation completes
    setTimeout(() => { this.voiceReplacedCategories.clear(); }, 1500);
  }

  // Cambiar un alimento por otro
  replaceFood(category: string, currentFood: FoodItem, newFood: FoodItem): void {
    // Para carbohidratos, usar el valor original para evitar problemas con yogur bebible
    const portions = category === 'Carbohidratos' ? this.getOriginalTargetValue(category) : this.getTargetValue(category);
    this.mealPlan = this.foodCalculatorService.replaceFood(category, currentFood, newFood, portions);
    // Forzar actualización de la vista para reflejar cambios en objetivos
    this.mealPlan = { ...this.mealPlan };
    this.updateVoiceBindings();
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
      if (this.dailyProgressService.isMealConfirmed(this.selectedMealType)) {
        const confirmedPlan = this.dailyProgressService.getConfirmedMealPlan(this.selectedMealType);
        if (confirmedPlan) {
          this.mealPlan = JSON.parse(JSON.stringify(confirmedPlan));
        }
      }
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
  // Alimentos que se miden crudos y se cocinan (carnes, pescados, tubérculos)
  private readonly rawToCookedFoods = [
    'Pescado blanco', 'Pechuga de pollo/pavo', 'Clara de huevo',
    'Carne roja magra', 'Lomo de cerdo', 'Salmón',
    'Carne de cerdo (graso)', 'Carne roja grasa',
    'Patata', 'Gnocchis', 'Boniato', 'Plátano macho'
  ];

  // Vegetales que se comen crudos (no convertir a "cocinado")
  private readonly rawVegetables = [
    'Lechuga', 'Pepino', 'Tomate', 'Apio', 'Alfalfa', 'Berros',
    'Perejil', 'Cebollín', 'Palmito', 'Tomate en lata', 'Jugo de tomate', 'Espinaca'
  ];

  getDisplayWeight(category: string, food: FoodItem, totalAmount: string): string {
    // Si ya dice "cocido", mostrar tal cual
    if (totalAmount.includes('cocido')) return totalAmount;

    // Alimentos en gramos que se miden crudos → mostrar cocinado
    if (totalAmount.includes('g') && this.rawToCookedFoods.includes(food.alimento)) {
      return this.getCookedWeight(totalAmount);
    }

    // Vegetales en tazas que se cocinan → mostrar cocinado
    if (totalAmount.includes('taza') && category === 'Vegetales' && !this.rawVegetables.includes(food.alimento)) {
      return this.getCookedWeight(totalAmount);
    }

    return totalAmount;
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
    this.showConfirmedMenu = null;
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
  }

  deleteConfirmedMeal(): void {
    this.showConfirmedMenu = null;
    this.dailyProgressService.unconfirmMeal(this.selectedMealType);
    this.mealPlan = {};
    this.generateMealPlanForMeal();
  }

  isMealConfirmed(): boolean {
    return this.dailyProgressService.isMealConfirmed(this.selectedMealType);
  }

  getDailyTargetForProgress(): { [category: string]: number } {
    return this.profileConfigService.getDailyTarget(this.currentProfile);
  }

  // Fixed meal plan methods
  private loadMealPlanMode(): void {
    this.mealPlanMode = this.profileConfigService.getMealPlanMode(this.currentProfile);
    if (this.mealPlanMode === 'fixed') {
      this.fixedPlan = this.profileConfigService.getFixedMealPlan(this.currentProfile);
      if (!this.selectedDay) {
        this.selectedDay = this.getCurrentDayName();
      }
    }
  }

  private getCurrentDayName(): string {
    const dayIndex = new Date().getDay(); // 0=Sunday
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayIndex];
  }

  dayAnimating = false;

  selectFixedDay(day: string): void {
    if (day === this.selectedDay) return;
    this.dayAnimating = true;
    setTimeout(() => {
      this.selectedDay = day;
      this.dayAnimating = false;
      this.scrollToActiveDay();
    }, 150);
  }

  getFixedMealEntry(day: string, mealType: string): FixedMealEntry | null {
    const entry = this.fixedPlan?.[day]?.[mealType];
    if (entry && (entry.recipeName || entry.description)) {
      return entry;
    }
    return null;
  }

  getFixedMealsForDay(day: string): { key: string, label: string, icon: string, time: string, entry: FixedMealEntry }[] {
    return this.fixedMealSlots
      .map(slot => {
        const entry = this.getFixedMealEntry(day, slot.key);
        return entry ? { ...slot, entry } : null;
      })
      .filter((item): item is { key: string, label: string, icon: string, time: string, entry: FixedMealEntry } => item !== null);
  }
}
