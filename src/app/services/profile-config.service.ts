import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FixedWeeklyPlan, FixedMealEntry } from '../models/food.model';

export interface ProfileConfig {
  [profile: string]: {
    [category: string]: number;
  };
}

export interface ProfileDailyTarget {
  [profile: string]: {
    [category: string]: number;
  };
}

export interface MealObjectives {
  "leche/yogurt": number;
  "vegetales": number;
  "fruta": number;
  "carbohidratos": number;
  "proteína M": number;
  "proteína SM": number;
  "grasas": number;
}

export interface ProfileMealObjectives {
  [profile: string]: {
    [meal: string]: MealObjectives;
  };
}

export interface ProfileFoodPreferences {
  [profile: string]: {
    [category: string]: string[]; // lista de nombres de alimentos preferidos
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProfileConfigService {
  private configSubject = new BehaviorSubject<ProfileConfig>(this.loadFromStorage());
  public config$ = this.configSubject.asObservable();

  private dailyTargetSubject = new BehaviorSubject<ProfileDailyTarget>(this.loadDailyTargetsFromStorage());
  public dailyTarget$ = this.dailyTargetSubject.asObservable();

  private mealObjectivesSubject = new BehaviorSubject<ProfileMealObjectives>(this.loadMealObjectivesFromStorage());
  public mealObjectives$ = this.mealObjectivesSubject.asObservable();

  private foodPreferencesSubject = new BehaviorSubject<ProfileFoodPreferences>(this.loadFoodPreferencesFromStorage());
  public foodPreferences$ = this.foodPreferencesSubject.asObservable();

  private readonly STORAGE_KEY = 'foodhelper_profile_config';
  private readonly DAILY_TARGET_STORAGE_KEY = 'foodhelper_daily_targets';
  private readonly MEAL_OBJECTIVES_STORAGE_KEY = 'foodhelper_meal_objectives';
  private readonly FOOD_PREFERENCES_STORAGE_KEY = 'foodhelper_food_preferences';
  private readonly MEAL_PLAN_MODE_STORAGE_KEY = 'foodhelper_meal_plan_mode';
  private readonly FIXED_PLANS_STORAGE_KEY = 'foodhelper_fixed_plans';

  private mealPlanModeSubject = new BehaviorSubject<{ [profile: string]: 'dynamic' | 'fixed' }>(this.loadMealPlanModeFromStorage());
  public mealPlanMode$ = this.mealPlanModeSubject.asObservable();

  private fixedPlansSubject = new BehaviorSubject<{ [profile: string]: FixedWeeklyPlan }>(this.loadFixedPlansFromStorage());
  public fixedPlans$ = this.fixedPlansSubject.asObservable();

  constructor() {
    // Cargar configuración inicial si no existe
    this.initializeDefaultConfig();
  }

  private loadFromStorage(): ProfileConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private loadDailyTargetsFromStorage(): ProfileDailyTarget {
    try {
      const stored = localStorage.getItem(this.DAILY_TARGET_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private saveToStorage(config: ProfileConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving profile config:', error);
    }
  }

  private saveDailyTargetsToStorage(dailyTargets: ProfileDailyTarget): void {
    try {
      localStorage.setItem(this.DAILY_TARGET_STORAGE_KEY, JSON.stringify(dailyTargets));
    } catch (error) {
      console.error('Error saving daily targets:', error);
    }
  }

  private loadMealObjectivesFromStorage(): ProfileMealObjectives {
    try {
      const stored = localStorage.getItem(this.MEAL_OBJECTIVES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private saveMealObjectivesToStorage(mealObjectives: ProfileMealObjectives): void {
    try {
      localStorage.setItem(this.MEAL_OBJECTIVES_STORAGE_KEY, JSON.stringify(mealObjectives));
    } catch (error) {
      console.error('Error saving meal objectives:', error);
    }
  }

  private loadFoodPreferencesFromStorage(): ProfileFoodPreferences {
    try {
      const stored = localStorage.getItem(this.FOOD_PREFERENCES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private saveFoodPreferencesToStorage(prefs: ProfileFoodPreferences): void {
    try {
      localStorage.setItem(this.FOOD_PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving food preferences:', error);
    }
  }

  private initializeDefaultConfig(): void {
    const currentConfig = this.configSubject.value;
    const currentDailyTargets = this.dailyTargetSubject.value;
    const currentMealObjectives = this.mealObjectivesSubject.value;
    
    // Configuración por defecto para Angel
    if (!currentConfig['Angel']) {
      currentConfig['Angel'] = {
        'Carbohidratos': 3,
        'Legumbres': 1,
        'Proteina Magra': 2,
        'Proteina Semi-Magra': 1,
        'Lácteos': 2,
        'Grasas': 2,
        'Frutas': 3
      };
    }

    // Configuración por defecto para Ferchu
    if (!currentConfig['Ferchu']) {
      currentConfig['Ferchu'] = {
        'Carbohidratos': 4,
        'Legumbres': 2,
        'Proteina Magra': 3,
        'Proteina Semi-Magra': 2,
        'Lácteos': 3,
        'Grasas': 3,
        'Frutas': 4
      };
    }

    // Objetivos por comida para Angel
    if (!currentMealObjectives['Angel']) {
      currentMealObjectives['Angel'] = {
        "DESAYUNO": {
          "leche/yogurt": 0,
          "vegetales": 0,
          "fruta": 0,
          "carbohidratos": 2,
          "proteína M": 2,
          "proteína SM": 2,
          "grasas": 1
        },
        "COMIDA": {
          "leche/yogurt": 0,
          "vegetales": 1,
          "fruta": 0,
          "carbohidratos": 2,
          "proteína M": 6,
          "proteína SM": 0,
          "grasas": 1
        },
        "MERIENDA": {
          "leche/yogurt": 0,
          "vegetales": 0,
          "fruta": 2,
          "carbohidratos": 0,
          "proteína M": 3,
          "proteína SM": 0,
          "grasas": 0
        },
        "CENA": {
          "leche/yogurt": 0,
          "vegetales": 1,
          "fruta": 0,
          "carbohidratos": 2,
          "proteína M": 7,
          "proteína SM": 0,
          "grasas": 1
        }
      };
    }

    // Objetivos por comida para Ferchu
    if (!currentMealObjectives['Ferchu']) {
      currentMealObjectives['Ferchu'] = {
        "DESAYUNO": {
          "leche/yogurt": 0,
          "vegetales": 0,
          "fruta": 1,
          "carbohidratos": 1,
          "proteína M": 2,
          "proteína SM": 2,
          "grasas": 1
        },
        "COMIDA": {
          "leche/yogurt": 0,
          "vegetales": 1,
          "fruta": 0,
          "carbohidratos": 2,
          "proteína M": 4,
          "proteína SM": 0,
          "grasas": 1
        },
        "MERIENDA": {
          "leche/yogurt": 0,
          "vegetales": 0,
          "fruta": 1,
          "carbohidratos": 0,
          "proteína M": 3,
          "proteína SM": 0,
          "grasas": 1
        },
        "CENA": {
          "leche/yogurt": 0,
          "vegetales": 1,
          "fruta": 0,
          "carbohidratos": 2,
          "proteína M": 4,
          "proteína SM": 0,
          "grasas": 1
        }
      };
    }

    // Configuración por defecto para Jose Daniel
    if (!currentConfig['Jose Daniel']) {
      currentConfig['Jose Daniel'] = {
        'Carbohidratos': 9,
        'Legumbres': 0,
        'Proteina Magra': 13,
        'Proteina Semi-Magra': 4,
        'Lácteos': 0,
        'Grasas': 3,
        'Frutas': 1
      };
    }

    // Objetivos por comida para Jose Daniel
    if (!currentMealObjectives['Jose Daniel']) {
      currentMealObjectives['Jose Daniel'] = {
        "DESAYUNO": {
          "leche/yogurt": 0,
          "vegetales": 0,
          "fruta": 0,
          "carbohidratos": 2,
          "proteína M": 3,
          "proteína SM": 2,
          "grasas": 1
        },
        "COMIDA": {
          "leche/yogurt": 0,
          "vegetales": 2,
          "fruta": 0,
          "carbohidratos": 4,
          "proteína M": 6,
          "proteína SM": 0,
          "grasas": 1
        },
        "MERIENDA": {
          "leche/yogurt": 0,
          "vegetales": 0,
          "fruta": 1,
          "carbohidratos": 1,
          "proteína M": 1,
          "proteína SM": 0,
          "grasas": 0
        },
        "CENA": {
          "leche/yogurt": 0,
          "vegetales": 2,
          "fruta": 0,
          "carbohidratos": 2,
          "proteína M": 3,
          "proteína SM": 2,
          "grasas": 1
        }
      };
    }

    // Calcular daily targets basados en objetivos por comida
    this.calculateDailyTargetsFromMeals(currentMealObjectives);

    // Inicializar modo fijo y plan por defecto para Jose Daniel
    this.initializeFixedPlanDefaults();

    this.configSubject.next(currentConfig);
    this.dailyTargetSubject.next(currentDailyTargets);
    this.mealObjectivesSubject.next(currentMealObjectives);
    this.saveToStorage(currentConfig);
    this.saveDailyTargetsToStorage(currentDailyTargets);
    this.saveMealObjectivesToStorage(currentMealObjectives);
  }

  getConfig(profile: string): { [category: string]: number } {
    return this.configSubject.value[profile] || {};
  }

  updateConfig(profile: string, category: string, value: number): void {
    const currentConfig = this.configSubject.value;
    
    if (!currentConfig[profile]) {
      currentConfig[profile] = {};
    }
    
    currentConfig[profile][category] = value;
    
    this.configSubject.next(currentConfig);
    this.saveToStorage(currentConfig);
  }

  updateProfileConfig(profile: string, config: { [category: string]: number }): void {
    const currentConfig = this.configSubject.value;
    currentConfig[profile] = { ...config };
    
    this.configSubject.next(currentConfig);
    this.saveToStorage(currentConfig);
  }

  getCurrentConfig(): ProfileConfig {
    return this.configSubject.value;
  }

  // Métodos para Daily Targets por perfil
  getDailyTarget(profile: string): { [category: string]: number } {
    return this.dailyTargetSubject.value[profile] || {};
  }

  updateDailyTarget(profile: string, category: string, value: number): void {
    const currentDailyTargets = this.dailyTargetSubject.value;
    
    if (!currentDailyTargets[profile]) {
      currentDailyTargets[profile] = {};
    }
    
    currentDailyTargets[profile][category] = value;
    
    this.dailyTargetSubject.next(currentDailyTargets);
    this.saveDailyTargetsToStorage(currentDailyTargets);
  }

  updateProfileDailyTarget(profile: string, dailyTarget: { [category: string]: number }): void {
    const currentDailyTargets = this.dailyTargetSubject.value;
    currentDailyTargets[profile] = { ...dailyTarget };
    
    this.dailyTargetSubject.next(currentDailyTargets);
    this.saveDailyTargetsToStorage(currentDailyTargets);
  }

  getCurrentDailyTargets(): ProfileDailyTarget {
    return this.dailyTargetSubject.value;
  }

  // Métodos para objetivos por comida
  getMealObjectives(profile: string): { [meal: string]: MealObjectives } {
    return this.mealObjectivesSubject.value[profile] || {};
  }

  updateMealObjective(profile: string, meal: string, category: string, value: number): void {
    const currentMealObjectives = this.mealObjectivesSubject.value;
    
    if (!currentMealObjectives[profile]) {
      currentMealObjectives[profile] = {};
    }
    
    if (!currentMealObjectives[profile][meal]) {
      currentMealObjectives[profile][meal] = {
        "leche/yogurt": 0,
        "vegetales": 0,
        "fruta": 0,
        "carbohidratos": 0,
        "proteína M": 0,
        "proteína SM": 0,
        "grasas": 0
      };
    }
    
    currentMealObjectives[profile][meal][category as keyof MealObjectives] = value;
    
    this.mealObjectivesSubject.next(currentMealObjectives);
    this.saveMealObjectivesToStorage(currentMealObjectives);
    
    // Recalcular daily targets
    this.calculateDailyTargetsFromMeals(currentMealObjectives);
  }

  getCurrentMealObjectives(): ProfileMealObjectives {
    return this.mealObjectivesSubject.value;
  }

  // Métodos para preferencias de alimentos
  getFoodPreferences(profile: string): { [category: string]: string[] } {
    return this.foodPreferencesSubject.value[profile] || {};
  }

  setFoodPreference(profile: string, category: string, foods: string[]): void {
    const current = this.foodPreferencesSubject.value;
    if (!current[profile]) {
      current[profile] = {};
    }
    current[profile][category] = foods;
    this.foodPreferencesSubject.next(current);
    this.saveFoodPreferencesToStorage(current);
  }

  toggleFoodPreference(profile: string, category: string, foodName: string): void {
    const current = this.foodPreferencesSubject.value;
    if (!current[profile]) {
      current[profile] = {};
    }
    if (!current[profile][category]) {
      current[profile][category] = [];
    }
    const idx = current[profile][category].indexOf(foodName);
    if (idx === -1) {
      current[profile][category].push(foodName);
    } else {
      current[profile][category].splice(idx, 1);
    }
    this.foodPreferencesSubject.next(current);
    this.saveFoodPreferencesToStorage(current);
  }

  isFoodPreferred(profile: string, category: string, foodName: string): boolean {
    const prefs = this.foodPreferencesSubject.value[profile];
    // Si no hay preferencias configuradas para esta categoría, todos los alimentos se consideran preferidos
    if (!prefs || !prefs[category] || prefs[category].length === 0) {
      return true;
    }
    return prefs[category].includes(foodName);
  }

  // Métodos para modo de plan de comidas
  private loadMealPlanModeFromStorage(): { [profile: string]: 'dynamic' | 'fixed' } {
    try {
      const stored = localStorage.getItem(this.MEAL_PLAN_MODE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private saveMealPlanModeToStorage(modes: { [profile: string]: 'dynamic' | 'fixed' }): void {
    try {
      localStorage.setItem(this.MEAL_PLAN_MODE_STORAGE_KEY, JSON.stringify(modes));
    } catch (error) {
      console.error('Error saving meal plan mode:', error);
    }
  }

  getMealPlanMode(profile: string): 'dynamic' | 'fixed' {
    return this.mealPlanModeSubject.value[profile] || 'dynamic';
  }

  setMealPlanMode(profile: string, mode: 'dynamic' | 'fixed'): void {
    const current = this.mealPlanModeSubject.value;
    current[profile] = mode;
    this.mealPlanModeSubject.next(current);
    this.saveMealPlanModeToStorage(current);
  }

  // Métodos para planes fijos semanales
  private loadFixedPlansFromStorage(): { [profile: string]: FixedWeeklyPlan } {
    try {
      const stored = localStorage.getItem(this.FIXED_PLANS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private saveFixedPlansToStorage(plans: { [profile: string]: FixedWeeklyPlan }): void {
    try {
      localStorage.setItem(this.FIXED_PLANS_STORAGE_KEY, JSON.stringify(plans));
    } catch (error) {
      console.error('Error saving fixed plans:', error);
    }
  }

  getFixedMealPlan(profile: string): FixedWeeklyPlan {
    return this.fixedPlansSubject.value[profile] || {};
  }

  updateFixedMealEntry(profile: string, day: string, mealType: string, entry: FixedMealEntry): void {
    const current = this.fixedPlansSubject.value;
    if (!current[profile]) {
      current[profile] = {};
    }
    if (!current[profile][day]) {
      current[profile][day] = {};
    }
    current[profile][day][mealType] = entry;
    this.fixedPlansSubject.next(current);
    this.saveFixedPlansToStorage(current);
  }

  private initializeFixedPlanDefaults(): void {
    const currentModes = this.mealPlanModeSubject.value;
    const currentPlans = this.fixedPlansSubject.value;

    // Jose Daniel usa plan fijo por defecto
    if (!currentModes['Jose Daniel']) {
      currentModes['Jose Daniel'] = 'fixed';
      this.mealPlanModeSubject.next(currentModes);
      this.saveMealPlanModeToStorage(currentModes);
    }

    if (!currentPlans['Jose Daniel']) {
      currentPlans['Jose Daniel'] = {
        'Lunes': {
          'DESAYUNO': { recipeName: 'Fajitas', description: '120g de pollo desmechado mezclado con 30g de queso rallado + 30g de aguacate.\n2 fajitas integrales.' },
          'COMIDA': { recipeName: 'Boloñesa', description: '1 taza de pasta, con 180g de carne molida en salsa de tomate natural (pasatta).\nEnsalada de lechugas mixtas + tomate + zanahoria rallada + 15g de aguacate.' },
          'MERIENDA': { recipeName: 'Yogurt con fruta', description: '160g de yogurt + 1 porción de fruta (ver lista).' },
          'CENA': { recipeName: 'Ensalada de pollo, maíz y vegetales', description: '150g de pollo desmechado + ½ taza de maíz + cebolla morada, tomate, perejil, espinaca.\n15g de aguacate.\nDip: 1 cda de yogurt, mostaza, sal, limón y pimienta.' }
        },
        'Martes': {
          'DESAYUNO': { recipeName: 'Omelet', description: '4 huevos revueltos + 1 lonja de queso blanco con ¼ de taza de champiñones.\n80g de arepa integral con ½ calabacín rallado.' },
          'COMIDA': { recipeName: 'Pollo con espinaca', description: '1 crema de auyama.\n180g de pollo condimentado y picado en cubos, una vez listo le agregas 1 taza de espinaca y ½ zanahoria, cuando esté casi listo agregar 1 cdita de queso crema o queso parmesano.\n1 taza de puré de papa.' },
          'MERIENDA': { recipeName: 'Pan con atún', description: '1 rebanada de pan + 30g de atún.' },
          'CENA': { recipeName: 'Tortilla española', description: '4 huevos\n200g de papa\n½ cebolla picada y pimentón.\nCocinar, y luego agregar + 30g de queso rallado por encima.' }
        },
        'Miércoles': {
          'DESAYUNO': { recipeName: 'Plátano fit', description: '100g de plátano sancochado con 3 lonjas de queso paisa blanco y 60g de pollo desmechado + alfalfa + tomate + lechuga.' },
          'COMIDA': { recipeName: 'Pabellón criollo', description: '80g de arroz blanco cocido + ¼ taza de caraotas negras.\n180g de carne mechada.\n2 tazas de vainitas + vinagre balsámico + 5g de aceite de oliva.' },
          'MERIENDA': { recipeName: 'Pie de yogurt', description: '150g de yogurt + 1 paquete de galleta maría + 1 ralladura de limón + un chorrito de jugo de limón, mezcla.' },
          'CENA': { recipeName: 'Fajita burger', description: '150g de carne molida divididas en 2 fajitas integrales.\nLlevar al sartén, una vez listo agregar lechuga, tomate, y zanahoria.' }
        },
        'Jueves': {
          'DESAYUNO': { recipeName: 'Arepa con perico', description: 'Arepa de 80g rellena con 4 huevos revueltos + tomate y cebolla + 30g de queso blanco rallado.\n30g de aguacate.' },
          'COMIDA': { recipeName: 'Pollo marinado', description: '1 taza de crema de calabacín.\n180g de pollo a la plancha, marinado en 1 cda de yogur + limón y sal.\n100g de plátano hecho puré.' },
          'MERIENDA': { recipeName: 'Fajita con pollo', description: '1 fajita + 30g de pollo desmechado.' },
          'CENA': { recipeName: 'Cherrys asados', description: '1 taza de tomate cherry picados por la mitad con romero, sal, ajo, pimienta, al air fryer por 20 min.\n2 tostadas de harina de maíz con cherrys encima + 150g de pollo desmechado + 1 cdita de queso parmesano.' }
        },
        'Viernes': {
          'DESAYUNO': { recipeName: 'Sandwich', description: '60g de pan + 120g de pollo desmechado con 30g de queso rallado.\n30g de aguacate.' },
          'COMIDA': { recipeName: 'Air fryer', description: '1 taza de papa picadas en bastones, condimentadas con romero + sal + pimienta y un poco de mostaza.\n1 hamburguesa de 180g pollo casera + ensalada de tomate + 3 hojas de lechuga + cebolla y pimentón.' },
          'MERIENDA': { recipeName: 'Gelatina con fruta', description: '1 taza de gelatina + 1 porción de fruta (ver lista).' },
          'CENA': { recipeName: 'Pizza casera', description: '2 fajitas integrales.\nColocar 2 cucharadas de salsa de tomate + 6 aceitunas + champiñones + 30g de queso en cada una y 45g de pollo desmechado en cada una.' }
        },
        'Sábado': {
          'DESAYUNO': { recipeName: 'Panquecas de cacao y cambur', description: '2 cucharadas de avena + 1 huevo + ½ cambur + 1 cucharadita de polvo para hornear + 1 cucharadita de cacao en polvo + 1 cucharada de almendras fileteadas.\n30g de queso blanco rallado + 3 huevos revueltos.' },
          'COMIDA': { recipeName: 'Taco salad', description: '180g de carne molida, ⅓ de pimentón, cebolla + 1 taza de arroz.\nDip: 2 cucharadas de yogurt griego, limón, cilantro, sal, pimienta en polvo.' },
          'MERIENDA': { recipeName: 'Avena trasnochada', description: '2 cdas de avena en agua, luego agregar 150g de yogurt, lo mezclas.' },
          'CENA': { recipeName: 'Parrilla casera', description: '150g de carne condimentada con ajo.\n200g de papas fritas en el airfryer.\nEnsalada mixta de vegetales (lechuga + zanahoria rallada + tomate + 5g de aceite de oliva).' }
        },
        'Domingo': {
          'DESAYUNO': { recipeName: 'Desayuno criollo', description: 'Arepa de 80g rellena con 90g de carne mechada + 1 huevo "frito" + 30g de queso blanco rallado.\n30g de aguacate.' },
          'COMIDA': { recipeName: 'Papitas colombianas con pollo a la parrilla', description: '10 papitas colombianas con 180g de muslo de pollo picado en tiras a la parrilla con limón, sal y pimienta.\nPico de gallo: 15g de aguacate con sal, limón, tomate, cebolla, pimentón.' },
          'MERIENDA': { recipeName: 'Cotufas', description: '3 tazas de cotufas.' },
          'CENA': { recipeName: 'Ensalada caprese', description: 'Base de mix de lechuga + 2 tomates + 30g de queso + 120g de pollo a la plancha con pimienta + sal.\n2 fajitas tostadas y cortadas en triángulos como nachos.' }
        }
      };
      this.fixedPlansSubject.next(currentPlans);
      this.saveFixedPlansToStorage(currentPlans);
    }
  }

  setFixedMealPlan(profile: string, plan: FixedWeeklyPlan): void {
    const current = this.fixedPlansSubject.value;
    current[profile] = plan;
    this.fixedPlansSubject.next(current);
    this.saveFixedPlansToStorage(current);
  }

  // Calcular daily targets basados en objetivos por comida
  private calculateDailyTargetsFromMeals(mealObjectives: ProfileMealObjectives): void {
    const currentDailyTargets = this.dailyTargetSubject.value;
    
    Object.keys(mealObjectives).forEach(profile => {
      const profileMeals = mealObjectives[profile];
      const dailyTotals: { [category: string]: number } = {};
      
      // Inicializar contadores
      const categories = ["leche/yogurt", "vegetales", "fruta", "carbohidratos", "proteína M", "proteína SM", "grasas"];
      categories.forEach(cat => dailyTotals[cat] = 0);
      
      // Sumar objetivos de todas las comidas
      Object.keys(profileMeals).forEach(meal => {
        const mealObj = profileMeals[meal];
        categories.forEach(cat => {
          dailyTotals[cat] += mealObj[cat as keyof MealObjectives];
        });
      });
      
      // Mapear a las categorías del sistema
      currentDailyTargets[profile] = {
        'Carbohidratos': dailyTotals['carbohidratos'],
        'Legumbres': 0, // No se usa en los objetivos por comida
        'Proteina Magra': dailyTotals['proteína M'],
        'Proteina Semi-Magra': dailyTotals['proteína SM'],
        'Lácteos': dailyTotals['leche/yogurt'],
        'Grasas': dailyTotals['grasas'],
        'Frutas': dailyTotals['fruta'],
        'Vegetales': dailyTotals['vegetales']
      };
    });
    
    this.dailyTargetSubject.next(currentDailyTargets);
    this.saveDailyTargetsToStorage(currentDailyTargets);
  }
}
