import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
