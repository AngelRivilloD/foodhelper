import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FoodItem, DailyTarget, DailyMacros } from '../models/food.model';

@Injectable({
  providedIn: 'root'
})
export class FoodCalculatorService {
  private foodDatabase: { [category: string]: FoodItem[] } = {
    'Carbohidratos': [],
    'Legumbres': [],
    'Proteina Magra': [],
    'Proteina Semi-Magra': [],
    'Lácteos': [],
    'Grasas': [],
    'Frutas': []
  };

  private dailyTargetSubject = new BehaviorSubject<DailyTarget>({
    'Carbohidratos': 5,
    'Legumbres': 1,
    'Proteina Magra': 4,
    'Proteina Semi-Magra': 1,
    'Lácteos': 2,
    'Grasas': 3,
    'Frutas': 2
  });

  public dailyTarget$ = this.dailyTargetSubject.asObservable();

  constructor() {
    // Cargar la base de datos completa de alimentos
    this.loadCompleteFoodDatabase();
  }


  // Cargar alimentos desde JSON
  loadFoodsFromJson(foods: { [category: string]: FoodItem[] }): void {
    this.foodDatabase = foods;
  }

  // Cargar datos completos del JSON proporcionado
  loadCompleteFoodDatabase(): void {
    this.foodDatabase = {
      'Carbohidratos': [
        { alimento: 'Arroz', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Avena/harina de avena', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Azúcar blanco/moreno', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Boniato/batata', gramos: '75g', category: 'Carbohidratos' },
        { alimento: 'Casabe', gramos: '30g', category: 'Carbohidratos' },
        { alimento: 'Cornflakes', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Cous-cous', gramos: '25g', category: 'Carbohidratos' },
        { alimento: 'Crema de arroz', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Galleta María', gramos: '-', category: 'Carbohidratos' },
        { alimento: 'Granola baja en grasa', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Harina de maíz (pan)', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Maíz dulce', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Miel', gramos: '140g', category: 'Carbohidratos' },
        { alimento: 'Obleas estilo kalan', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Palomitas de maíz', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Pan Árabe', gramos: '-', category: 'Carbohidratos' },
        { alimento: 'Pan Wasa', gramos: '25g', category: 'Carbohidratos' },
        { alimento: 'Pan blanco o integral de barra', gramos: '30g', category: 'Carbohidratos' },
        { alimento: 'Pan de molde', gramos: '30g', category: 'Carbohidratos' },
        { alimento: 'Pan thins', gramos: '30g', category: 'Carbohidratos' },
        { alimento: 'Pan tostado', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Papa/patata', gramos: '90g', category: 'Carbohidratos' },
        { alimento: 'Pasta', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Plátano macho', gramos: '50g', category: 'Carbohidratos' },
        { alimento: 'Quinoa', gramos: '20g', category: 'Carbohidratos' },
        { alimento: 'Tortilla para fajitas', gramos: '15g', category: 'Carbohidratos' },
        { alimento: 'Tortitas de arroz/maíz', gramos: '-', category: 'Carbohidratos' },
        { alimento: 'Yuca', gramos: '50g (cocido)', category: 'Carbohidratos' }
      ],
      'Legumbres': [
        { alimento: 'Frijoles/caraotas/alubias', gramos: '30g crudo', category: 'Legumbres' },
        { alimento: 'Garbanzos', gramos: '30g crudo', category: 'Legumbres' },
        { alimento: 'Lentejas', gramos: '30g crudo', category: 'Legumbres' }
      ],
      'Proteina Magra': [
        { alimento: 'Atún al natural en lata', gramos: '30g', category: 'Proteina Magra' },
        { alimento: 'Calamares y mariscos', gramos: '30g', category: 'Proteina Magra' },
        { alimento: 'Camarones/gambas', gramos: '40g', category: 'Proteina Magra' },
        { alimento: 'Carne roja magra', gramos: '30g', category: 'Proteina Magra' },
        { alimento: 'Clara de huevo', gramos: '30g', category: 'Proteina Magra' },
        { alimento: 'Jamón de pollo/pavo', gramos: '20g', category: 'Proteina Magra' },
        { alimento: 'Lomo de cerdo', gramos: '30g', category: 'Proteina Magra' },
        { alimento: 'Lomo embuchado', gramos: '40g', category: 'Proteina Magra' },
        { alimento: 'Pechuga/solomillo de pollo o pavo', gramos: '60g', category: 'Proteina Magra' },
        { alimento: 'Pescado blanco', gramos: '40g', category: 'Proteina Magra' },
        { alimento: 'Proteína en polvo (whey y vegana)', gramos: '15g', category: 'Proteina Magra' },
        { alimento: 'Queso burgos light/desnatado', gramos: '40g', category: 'Proteina Magra' },
        { alimento: 'Queso fresco batido 0%', gramos: '50g', category: 'Proteina Magra' },
        { alimento: 'Queso mozzarella light', gramos: '60g', category: 'Proteina Magra' },
        { alimento: 'Seitán', gramos: '70g', category: 'Proteina Magra' },
        { alimento: 'Soja', gramos: '70g', category: 'Proteina Magra' },
        { alimento: 'Yogur proteico', gramos: '50g', category: 'Proteina Magra' }
      ],
      'Proteina Semi-Magra': [
        { alimento: 'Atún en aceite', gramos: '30g', category: 'Proteina Semi-Magra' },
        { alimento: 'Carne de cerdo (graso)', gramos: '30g', category: 'Proteina Semi-Magra' },
        { alimento: 'Carne roja grasa', gramos: '30g', category: 'Proteina Semi-Magra' },
        { alimento: 'Cordero', gramos: '65g', category: 'Proteina Semi-Magra' },
        { alimento: 'Huevo', gramos: '30g', category: 'Proteina Semi-Magra' },
        { alimento: 'Jamón serrano/ibérico', gramos: '30g', category: 'Proteina Semi-Magra' },
        { alimento: 'Queso burgos natural', gramos: '40g', category: 'Proteina Semi-Magra' },
        { alimento: 'Queso mozzarella normal', gramos: '25g', category: 'Proteina Semi-Magra' },
        { alimento: 'Queso parmesano', gramos: '25g', category: 'Proteina Semi-Magra' },
        { alimento: 'Salmón, caballa', gramos: '40g', category: 'Proteina Semi-Magra' },
        { alimento: 'Sardinas', gramos: '40g', category: 'Proteina Semi-Magra' },
        { alimento: 'Tofu', gramos: '70g', category: 'Proteina Semi-Magra' }
      ],
      'Lácteos': [
        { alimento: 'Cuajada', gramos: '240g', category: 'Lácteos' },
        { alimento: 'Kefir', gramos: '200g', category: 'Lácteos' },
        { alimento: 'Leche de cabra', gramos: '150g', category: 'Lácteos' },
        { alimento: 'Leche de oveja', gramos: '135g', category: 'Lácteos' },
        { alimento: 'Leche descremada/desnatada', gramos: '200g', category: 'Lácteos' },
        { alimento: 'Leche entera', gramos: '200g', category: 'Lácteos' },
        { alimento: 'Leche semidesnatada', gramos: '240g', category: 'Lácteos' },
        { alimento: 'Yogur descremado (s/a)', gramos: '200g', category: 'Lácteos' },
        { alimento: 'Yogur natural entero', gramos: '200g', category: 'Lácteos' },
        { alimento: 'Yogur semidesnatado (s/a)', gramos: '240g', category: 'Lácteos' }
      ],
      'Grasas': [
        { alimento: 'Aceite de coco', gramos: '5g', category: 'Grasas' },
        { alimento: 'Aceite de oliva', gramos: '5g', category: 'Grasas' },
        { alimento: 'Aceituna verde (deshuesadas)', gramos: '30g', category: 'Grasas' },
        { alimento: 'Aceitunas negras', gramos: '40g', category: 'Grasas' },
        { alimento: 'Almendras', gramos: '10g', category: 'Grasas' },
        { alimento: 'Aguacate', gramos: '30g', category: 'Grasas' },
        { alimento: 'Avellanas', gramos: '8g', category: 'Grasas' },
        { alimento: 'Cacahuetes/maní', gramos: '10g', category: 'Grasas' },
        { alimento: 'Cashews/anacardos', gramos: '10g', category: 'Grasas' },
        { alimento: 'Chocolate negro (70-75%)', gramos: '10g', category: 'Grasas' },
        { alimento: 'Coco rallado', gramos: '8g', category: 'Grasas' },
        { alimento: 'Crema de frutos secos', gramos: '10g', category: 'Grasas' },
        { alimento: 'Leche de coco', gramos: '25g', category: 'Grasas' },
        { alimento: 'Mantequilla', gramos: '5g', category: 'Grasas' },
        { alimento: 'Mantequilla de maní', gramos: '10g', category: 'Grasas' },
        { alimento: 'Mayonesa', gramos: '7g', category: 'Grasas' },
        { alimento: 'Nata para cocinar 15%', gramos: '25g', category: 'Grasas' },
        { alimento: 'Nueces', gramos: '10g', category: 'Grasas' },
        { alimento: 'Pistachos', gramos: '10g', category: 'Grasas' },
        { alimento: 'Queso Crema normal', gramos: '20g', category: 'Grasas' },
        { alimento: 'Semillas de girasol, ajonjolí, chía', gramos: '20g', category: 'Grasas' }
      ],
      'Frutas': [
        { alimento: 'Arándanos', gramos: '100g', category: 'Frutas' },
        { alimento: 'Banana', gramos: '80g', category: 'Frutas' },
        { alimento: 'Caqui', gramos: '90g', category: 'Frutas' },
        { alimento: 'Cerezas', gramos: '110g', category: 'Frutas' },
        { alimento: 'Chirimoya', gramos: '80g', category: 'Frutas' },
        { alimento: 'Ciruela', gramos: '100g', category: 'Frutas' },
        { alimento: 'Dátiles', gramos: '20g', category: 'Frutas' },
        { alimento: 'Frambuesas', gramos: '120g', category: 'Frutas' },
        { alimento: 'Fresas', gramos: '120g', category: 'Frutas' },
        { alimento: 'Granada', gramos: '80g', category: 'Frutas' },
        { alimento: 'Guanábana', gramos: '90g', category: 'Frutas' },
        { alimento: 'Higos', gramos: '80g', category: 'Frutas' },
        { alimento: 'Kiwi', gramos: '100g', category: 'Frutas' },
        { alimento: 'Mandarina', gramos: '130g', category: 'Frutas' },
        { alimento: 'Mango', gramos: '100g', category: 'Frutas' },
        { alimento: 'Manzana', gramos: '130g', category: 'Frutas' },
        { alimento: 'Melón', gramos: '200g', category: 'Frutas' },
        { alimento: 'Moras', gramos: '150g', category: 'Frutas' },
        { alimento: 'Naranja', gramos: '130g', category: 'Frutas' },
        { alimento: 'Papaya', gramos: '200g', category: 'Frutas' },
        { alimento: 'Pera', gramos: '120g', category: 'Frutas' },
        { alimento: 'Piña', gramos: '110g', category: 'Frutas' },
        { alimento: 'Sandía', gramos: '200g', category: 'Frutas' },
        { alimento: 'Uvas', gramos: '90g', category: 'Frutas' },
        { alimento: 'Uvas pasas', gramos: '20g', category: 'Frutas' }
      ]
    };
    
  }

  // Establecer objetivos diarios
  setDailyTarget(target: DailyTarget): void {
    this.dailyTargetSubject.next(target);
  }

  // Obtener objetivos actuales
  getDailyTarget(): DailyTarget {
    return this.dailyTargetSubject.value;
  }

  // Obtener alimentos por categoría
  getFoodsByCategory(category: string): FoodItem[] {
    return this.foodDatabase[category] || [];
  }

  // Calcular plan de comidas basado en objetivos
  generateMealPlan(): { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } {
    const target = this.getDailyTarget();
    const mealPlan: { [category: string]: any[] } = {};

    Object.keys(target).forEach(category => {
      const targetPortions = target[category as keyof DailyTarget];
      const availableFoods = this.getFoodsByCategory(category);
      
      if (availableFoods.length > 0 && targetPortions > 0) {
        // Seleccionar alimentos inteligentemente (máximo 3-4 por categoría)
        const suggestedFoods = this.selectSuggestedFoods(availableFoods, targetPortions);
        
        mealPlan[category] = suggestedFoods.map(item => ({
          food: item.food,
          portions: item.portions,
          totalAmount: this.calculateTotalAmount(item.food, item.portions)
        }));
      }
    });

    return mealPlan;
  }

  // Seleccionar alimentos sugeridos de manera inteligente
  private selectSuggestedFoods(foods: FoodItem[], targetPortions: number): { food: FoodItem, portions: number }[] {
    // Algoritmo de selección inteligente - SOLO UNA SUGERENCIA POR DEFECTO
    const suggestions: { food: FoodItem, portions: number }[] = [];
    
    // Priorizar alimentos más comunes/versátiles
    const priorityFoods = this.getPriorityFoods(foods);
    
    // NUEVA REGLA: Solo una sugerencia por defecto para todas las categorías
    const selectedFood = priorityFoods[0];
    if (selectedFood && targetPortions > 0) {
      suggestions.push({
        food: selectedFood,
        portions: targetPortions
      });
    }
    
    return suggestions;
  }

  // Obtener alimentos prioritarios (más comunes/versátiles)
  private getPriorityFoods(foods: FoodItem[]): FoodItem[] {
    // Definir prioridades por categoría
    const priorityKeywords = {
      'Carbohidratos': ['arroz', 'papa', 'pasta', 'pan', 'avena', 'quinoa'],
      'Legumbres': ['lentejas', 'garbanzos', 'frijoles'],
      'Proteina Magra': ['pollo', 'pescado', 'atún', 'clara', 'proteína'],
      'Proteina Semi-Magra': ['huevo', 'salmón', 'tofu'],
      'Lácteos': ['leche', 'yogur', 'queso'],
      'Grasas': ['aguacate', 'aceite', 'almendras', 'nueces'],
      'Frutas': ['banana', 'manzana', 'naranja', 'fresas']
    };

    const category = foods[0]?.category || '';
    const keywords = priorityKeywords[category as keyof typeof priorityKeywords] || [];
    
    // Ordenar por prioridad
    return foods.sort((a, b) => {
      const aPriority = keywords.findIndex(keyword => 
        a.alimento.toLowerCase().includes(keyword.toLowerCase())
      );
      const bPriority = keywords.findIndex(keyword => 
        b.alimento.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // Si ambos tienen prioridad, ordenar por índice
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }
      
      // Si solo uno tiene prioridad, ese va primero
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;
      
      // Si ninguno tiene prioridad, mantener orden original
      return 0;
    });
  }

  // Calcular cantidad total de un alimento
  private calculateTotalAmount(food: FoodItem, portions: number): string {
    const gramosMatch = food.gramos.match(/(\d+)/);
    if (gramosMatch) {
      const baseGrams = parseInt(gramosMatch[1]);
      const totalGrams = baseGrams * portions;
      return `${totalGrams}g`;
    }
    return `${portions} x ${food.gramos}`;
  }

  // Obtener resumen de macronutrientes
  getMacroSummary(): DailyMacros {
    const target = this.getDailyTarget();
    return {
      'Carbohidratos': target['Carbohidratos'],
      'Legumbres': target['Legumbres'],
      'Proteina Magra': target['Proteina Magra'],
      'Proteina Semi-Magra': target['Proteina Semi-Magra'],
      'Lácteos': target['Lácteos'],
      'Grasas': target['Grasas'],
      'Frutas': target['Frutas']
    };
  }

  // Cambiar un alimento sugerido por otro de la misma categoría
  replaceFood(category: string, currentFood: FoodItem, newFood: FoodItem, portions: number): { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } {
    // Obtener el plan actual
    let mealPlan = this.generateMealPlan();
    
    if (mealPlan[category]) {
      // Encontrar y reemplazar el alimento
      const index = mealPlan[category].findIndex(item => item.food.alimento === currentFood.alimento);
      if (index !== -1) {
        // REGLA ESPECIAL PARA CARBOHIDRATOS: Si se reemplaza un carbohidrato,
        // poner las otras opciones en 0 porciones
        if (category === 'Carbohidratos') {
          // Poner todas las porciones en el nuevo alimento
          mealPlan[category].forEach((item, i) => {
            if (i === index) {
              item.food = newFood;
              item.portions = portions;
              item.totalAmount = this.calculateTotalAmount(newFood, portions);
            } else {
              item.portions = 0;
              item.totalAmount = '0g';
            }
          });
        } else {
          // Para otras categorías, reemplazar normalmente
          mealPlan[category][index] = {
            food: newFood,
            portions: portions,
            totalAmount: this.calculateTotalAmount(newFood, portions)
          };
        }
      }
    }
    
    return mealPlan;
  }

  // Obtener alternativas para un alimento específico
  getAlternatives(category: string, currentFood: FoodItem): FoodItem[] {
    const allFoods = this.getFoodsByCategory(category);
    return allFoods.filter(food => food.alimento !== currentFood.alimento);
  }

  // Ajustar porciones de un alimento específico
  adjustPortions(category: string, food: FoodItem, newPortions: number): { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } {
    let mealPlan = this.generateMealPlan();
    
    if (mealPlan[category]) {
      const index = mealPlan[category].findIndex(item => item.food.alimento === food.alimento);
      if (index !== -1) {
        // REGLA ESPECIAL PARA CARBOHIDRATOS: Si se ajusta un carbohidrato, 
        // poner las otras opciones en 0 porciones
        if (category === 'Carbohidratos') {
          // Poner todas las porciones en el alimento seleccionado
          mealPlan[category].forEach((item, i) => {
            if (i === index) {
              item.portions = newPortions;
              item.totalAmount = this.calculateTotalAmount(food, newPortions);
            } else {
              item.portions = 0;
              item.totalAmount = '0g';
            }
          });
        } else {
          // Para otras categorías, ajustar normalmente
          mealPlan[category][index] = {
            food: food,
            portions: newPortions,
            totalAmount: this.calculateTotalAmount(food, newPortions)
          };
        }
      }
    }
    
    return mealPlan;
  }

  // Agregar un nuevo alimento al plan
  addFoodToPlan(category: string, food: FoodItem, portions: number = 1): { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } {
    let mealPlan = this.generateMealPlan();
    
    if (!mealPlan[category]) {
      mealPlan[category] = [];
    }
    
    // Verificar si el alimento ya existe
    const existingIndex = mealPlan[category].findIndex(item => item.food.alimento === food.alimento);
    
    if (existingIndex !== -1) {
      // Si ya existe, incrementar porciones
      mealPlan[category][existingIndex].portions += portions;
      mealPlan[category][existingIndex].totalAmount = this.calculateTotalAmount(food, mealPlan[category][existingIndex].portions);
    } else {
      // Si no existe, agregarlo
      mealPlan[category].push({
        food: food,
        portions: portions,
        totalAmount: this.calculateTotalAmount(food, portions)
      });
    }
    
    return mealPlan;
  }

  // Remover un alimento del plan
  removeFoodFromPlan(category: string, food: FoodItem): { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } {
    let mealPlan = this.generateMealPlan();
    
    if (mealPlan[category]) {
      mealPlan[category] = mealPlan[category].filter(item => item.food.alimento !== food.alimento);
    }
    
    return mealPlan;
  }
}
