import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FoodCalculatorService } from '../../services/food-calculator.service';
import { ProfileConfigService } from '../../services/profile-config.service';
import { DailyTarget, FoodItem, FixedWeeklyPlan, FixedMealEntry } from '../../models/food.model';

@Component({
  selector: 'app-target-setter',
  templateUrl: './target-setter.component.html',
  styleUrls: ['./target-setter.component.css']
})
export class TargetSetterComponent implements OnInit, OnChanges {
  @Input() currentProfile: string = 'Angel';

  showFoodPreferences: boolean = false;
  expandedCategory: string | null = null;

  // Fixed meal plan
  mealPlanMode: 'dynamic' | 'fixed' = 'dynamic';
  selectedDay: string = 'Lunes';
  expandedMeal: string | null = null;
  fixedPlan: FixedWeeklyPlan = {};
  weekDays = [
    { key: 'Lunes', short: 'L' },
    { key: 'Martes', short: 'M' },
    { key: 'Miércoles', short: 'X' },
    { key: 'Jueves', short: 'J' },
    { key: 'Viernes', short: 'V' },
    { key: 'Sábado', short: 'S' },
    { key: 'Domingo', short: 'D' }
  ];
  fixedMealTypes = [
    { key: 'DESAYUNO', label: 'Desayuno', icon: '🌅' },
    { key: 'COMIDA', label: 'Almuerzo', icon: '🍽️' },
    { key: 'MERIENDA', label: 'Merienda', icon: '☕' },
    { key: 'CENA', label: 'Cena', icon: '🌙' }
  ];

  targets: DailyTarget = {
    'Carbohidratos': 3,
    'Legumbres': 1,
    'Proteina Magra': 2,
    'Proteina Semi-Magra': 1,
    'Lácteos': 2,
    'Grasas': 2,
    'Frutas': 3,
    'Vegetales': 3
  };

  macroCategories = [
    { key: 'Carbohidratos', label: 'Carbohidratos', icon: '🍞', color: '#FF6B6B' },
    // { key: 'Legumbres', label: 'Legumbres', icon: '🫘', color: '#8B4513' },
    { key: 'Proteina Magra', label: 'Proteína Magra', icon: '🥩', color: '#4ECDC4' },
    { key: 'Proteina Semi-Magra', label: 'Proteína Semi-Magra', icon: '🐟', color: '#2ECC71' },
    { key: 'Lácteos', label: 'Lácteos', icon: '🥛', color: '#3498DB' },
    { key: 'Grasas', label: 'Grasas', icon: '🥑', color: '#45B7D1' },
    { key: 'Frutas', label: 'Frutas', icon: '🍓', color: '#FECA57' },
    { key: 'Vegetales', label: 'Vegetales', icon: '🥬', color: '#2ECC71' }
  ];

  constructor(
    private foodCalculatorService: FoodCalculatorService,
    private profileConfigService: ProfileConfigService
  ) {}

  ngOnInit(): void {
    this.loadProfileDailyTarget();
    this.loadMealPlanMode();

    // Suscribirse a cambios en el perfil
    this.profileConfigService.dailyTarget$.subscribe(() => {
      this.loadProfileDailyTarget();
    });
  }

  private loadProfileDailyTarget(): void {
    const profileDailyTarget = this.profileConfigService.getDailyTarget(this.currentProfile);
    if (Object.keys(profileDailyTarget).length > 0) {
      this.targets = { ...this.targets, ...profileDailyTarget } as DailyTarget;
    }
  }

  updateTarget(category: string, value: number): void {
    this.targets[category as keyof DailyTarget] = Math.max(0, value);
    
    // Guardar en el servicio de daily targets por perfil
    this.profileConfigService.updateDailyTarget(this.currentProfile, category, value);
    
    // También actualizar el servicio de calculadora para el plan actual
    this.foodCalculatorService.setDailyTarget(this.targets);
  }

  incrementTarget(category: string): void {
    const currentValue = this.targets[category as keyof DailyTarget];
    this.updateTarget(category, currentValue + 1);
  }

  decrementTarget(category: string): void {
    const currentValue = this.targets[category as keyof DailyTarget];
    this.updateTarget(category, currentValue - 1);
  }

  getTargetValue(category: string): number {
    return this.targets[category as keyof DailyTarget];
  }

  isTargetDisabled(category: string): boolean {
    return this.targets[category as keyof DailyTarget] <= 0;
  }

  getTargetPlural(category: string): string {
    return this.targets[category as keyof DailyTarget] !== 1 ? 'es' : '';
  }

  onInputChange(category: string, event: any): void {
    const value = +event.target.value;
    this.updateTarget(category, value);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentProfile'] && !changes['currentProfile'].firstChange) {
      this.loadProfileDailyTarget();
      this.loadMealPlanMode();
    }
  }

  // Food preferences methods
  toggleFoodPreferences(): void {
    this.showFoodPreferences = !this.showFoodPreferences;
    this.expandedCategory = null;
  }

  toggleCategory(category: string): void {
    this.expandedCategory = this.expandedCategory === category ? null : category;
  }

  getFoodsForCategory(category: string): FoodItem[] {
    return this.foodCalculatorService.getFoodsByCategory(category)
      .slice()
      .sort((a, b) => a.alimento.localeCompare(b.alimento, 'es'));
  }

  getFoodEmoji(foodName: string): string {
    const emojiMap: { [key: string]: string } = {
      'Patata': '🥔', 'Gnocchis': '🍝', 'Boniato': '🍠', 'Plátano macho': '🍌', 'Yuca (cocido)': '🫚',
      'Quinoa': '🌾', 'Pasta': '🍝', 'Arroz': '🍚', 'Avena/harina de avena': '🥣', 'Harina de maíz (pan)': '🌽',
      'Harina de maíz': '🌽', 'Cornflakes': '🥣', 'Pan blanco o integral de barra': '🥖',
      'Pan tostado': '🍞', 'Pan de molde': '🍞', 'Pan thins': '🍞', 'Miel': '🍯',
      'Maíz dulce': '🌽', 'Cous-cous': '🌾', 'Tortitas de arroz/maíz': '🍘', 'Crema de arroz': '🥣',
      'Fajitas medianas': '🫓', 'Azúcar blanco/moreno': '🍬', 'Palomitas de maíz': '🍿',
      'Granola baja en grasa': '🥣', 'Pan Árabe': '🫓', 'Pan Wasa': '🍞', 'Galleta María': '🍪',
      'Casabe': '🍞', 'Tortilla para fajitas': '🌮',
      'Lentejas': '🫘', 'Garbanzos': '🫘', 'Frijoles/caraotas/alubias': '🫘',
      'Pescado blanco': '🐟', 'Atún al natural en lata': '🐟', 'Pechuga de pollo/pavo': '🍗',
      'Camarones/gambas': '🦐', 'Clara de huevo': '🥚', 'Jamón de pollo/pavo': '🥩',
      'Lomo embuchado': '🥩', 'Carne roja magra': '🥩', 'Proteína en polvo': '🥤',
      'Proteína en polvo (whey y vegana)': '🥤', 'Lomo de cerdo': '🍖', 'Soja': '🫘', 'Seitán': '🌾',
      'Queso burgos light/desnatado': '🧀', 'Yogur straciatella': '🍨', 'Yogur proteico sabores': '🍨',
      'Yogur proteico': '🍨', 'Gelatina proteica': '🍮', 'Yogur proteico natural': '🍨',
      'Yogur proteico bebible': '🥤', 'Queso fresco batido 0%': '🧀', 'Queso havarti light': '🧀',
      'Queso mozzarella light': '🧀', 'Queso cottage': '🧀', 'Queso fresco light': '🧀',
      'Salmón': '🐟', 'Helado proteico': '🍦',
      'Huevo': '🥚', 'Salmón, caballa': '🐟', 'Carne de cerdo (graso)': '🥩', 'Carne roja grasa': '🥩',
      'Jamón serrano/ibérico': '🥩', 'Atún en aceite': '🐟', 'Tofu': '🧈',
      'Queso burgos natural': '🧀', 'Queso mozzarella normal': '🧀', 'Queso parmesano': '🧀',
      'Leche desnatada': '🥛', 'Leche descremada/desnatada': '🥛', 'Yogur descremado (s/a)': '🍶',
      'Leche semidesnatada': '🥛', 'Yogur semidesnatado (s/a)': '🍶', 'Leche entera': '🥛',
      'Leche de cabra': '🥛', 'Leche de oveja': '🥛', 'Cuajada': '🍮',
      'Yogur natural entero': '🍶', 'Yogur natural desnatado': '🍶', 'Yogur griego desnatado': '🍶',
      'Kefir': '🥛', 'Queso fresco desnatado': '🧀',
      'Aguacate': '🥑', 'Aceite de oliva': '🫒', 'Pistachos': '🥜', 'Mantequilla': '🧈',
      'Avellanas': '🌰', 'Mantequilla de maní': '🥜', 'Crema de frutos secos': '🥜',
      'Coco rallado': '🥥', 'Aceituna verde (deshuesadas)': '🫒', 'Aceitunas negras': '🫒',
      'Aceitunas': '🫒', 'Almendras': '🌰', 'Cashews/anacardos': '🥜', 'Nueces': '🥜',
      'Aceite de coco': '🥥', 'Chocolate negro (70-75%)': '🍫', 'Nata para cocinar 15%': '🍶',
      'Leche de coco': '🥥', 'Cacahuetes/maní': '🥜', 'Mayonesa': '🫙', 'Hummus': '🫘',
      'Queso Crema normal': '🧀', 'Queso feta': '🧀', 'Semillas de girasol, ajonjolí, chía': '🌻',
      'Banana': '🍌', 'Piña': '🍍', 'Melón': '🍈', 'Sandía': '🍉', 'Fresas': '🍓',
      'Frambuesas': '🫐', 'Moras': '🫐', 'Arándanos': '🫐', 'Papaya': '🥭', 'Mango': '🥭',
      'Manzana': '🍎', 'Pera': '🍐', 'Kiwi': '🥝', 'Durazno/melocotón': '🍑', 'Ciruela': '🍑',
      'Uvas': '🍇', 'Naranja': '🍊', 'Mandarina': '🍊', 'Cerezas': '🍒', 'Granada': '🫐',
      'Uvas pasas': '🍇', 'Dátiles': '🌴',
      'Acelgas': '🥬', 'Hinojo': '🥬', 'Ají dulce': '🌶️',
      'Hongos': '🍄', 'Ajo': '🧄', 'Ajo porro': '🧄', 'Jugo de tomate': '🍅', 'Lechuga': '🥬',
      'Alcachofa': '🥬', 'Nabo': '🥬', 'Pimiento': '🫑', 'Calabacín': '🥒', 'Quimbombó': '🥬',
      'Cebolla': '🧅', 'Rábanos': '🥬', 'Cebollín': '🧅', 'Remolacha': '🟣', 'Apio': '🥬',
      'Alfalfa': '🌱', 'Palmito': '🌴', 'Calabaza': '🎃', 'Pepino': '🥒', 'Berenjena': '🍆',
      'Perejil': '🌿', 'Berros': '🥬', 'Brócoli': '🥦', 'Chayota': '🥬', 'Repollo': '🥬',
      'Coliflor': '🥦', 'Tomate': '🍅', 'Corazón de alcachofa': '🥬', 'Tomate en lata': '🍅',
      'Repollitos de Bruselas': '🥬', 'Escarola': '🥬', 'Vainitas': '🫛', 'Espárragos': '🌿',
      'Vegetales chinos': '🥬', 'Espinaca': '🥬', 'Zanahoria': '🥕', 'Edamames': '🫛'
    };
    return emojiMap[foodName] || '🍽️';
  }

  isFoodPreferred(category: string, foodName: string): boolean {
    return this.profileConfigService.isFoodPreferred(this.currentProfile, category, foodName);
  }

  toggleFoodPreference(category: string, foodName: string): void {
    const prefs = this.profileConfigService.getFoodPreferences(this.currentProfile);
    const prefList = prefs[category];

    // Si no hay preferencias configuradas (all selected by default),
    // inicializar con todos los alimentos EXCEPTO el que se está deseleccionando
    if (!prefList || prefList.length === 0) {
      const allFoods = this.getFoodsForCategory(category).map(f => f.alimento);
      const newList = allFoods.filter(name => name !== foodName);
      this.profileConfigService.setFoodPreference(this.currentProfile, category, newList);
    } else {
      this.profileConfigService.toggleFoodPreference(this.currentProfile, category, foodName);
    }
  }

  getPreferredCount(category: string): number {
    const prefs = this.profileConfigService.getFoodPreferences(this.currentProfile);
    const prefList = prefs[category];
    if (!prefList || prefList.length === 0) {
      return this.getFoodsForCategory(category).length; // Todos seleccionados por defecto
    }
    return prefList.length;
  }

  getTotalFoodCount(category: string): number {
    return this.getFoodsForCategory(category).length;
  }

  selectAllFoods(category: string): void {
    // Vaciar la lista = todos seleccionados
    this.profileConfigService.setFoodPreference(this.currentProfile, category, []);
  }

  deselectAllFoods(category: string): void {
    // Poner una lista vacía que signifique "ninguno" - usamos un marcador especial
    this.profileConfigService.setFoodPreference(this.currentProfile, category, ['__none__']);
  }

  // Fixed meal plan methods
  private loadMealPlanMode(): void {
    this.mealPlanMode = this.profileConfigService.getMealPlanMode(this.currentProfile);
    this.fixedPlan = this.profileConfigService.getFixedMealPlan(this.currentProfile);
  }

  setMode(mode: 'dynamic' | 'fixed'): void {
    this.mealPlanMode = mode;
    this.profileConfigService.setMealPlanMode(this.currentProfile, mode);
  }

  selectDay(day: string): void {
    this.selectedDay = day;
    this.expandedMeal = null;
  }

  toggleMeal(mealType: string): void {
    this.expandedMeal = this.expandedMeal === mealType ? null : mealType;
  }

  getFixedMealEntry(day: string, mealType: string): FixedMealEntry {
    return this.fixedPlan?.[day]?.[mealType] || { recipeName: '', description: '' };
  }

  onFixedMealChange(day: string, mealType: string, field: 'recipeName' | 'description', value: string): void {
    const current = this.getFixedMealEntry(day, mealType);
    const updated = { ...current, [field]: value };
    this.profileConfigService.updateFixedMealEntry(this.currentProfile, day, mealType, updated);
    // Actualizar referencia local
    if (!this.fixedPlan[day]) {
      this.fixedPlan[day] = {};
    }
    this.fixedPlan[day][mealType] = updated;
  }

  hasMealContent(day: string, mealType: string): boolean {
    const entry = this.getFixedMealEntry(day, mealType);
    return !!(entry.recipeName || entry.description);
  }
}
