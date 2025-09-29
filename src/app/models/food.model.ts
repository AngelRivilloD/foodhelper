export interface Food {
  id: string;
  name: string;
  category: 'desayuno' | 'almuerzo' | 'cena' | 'snack';
  portions: {
    carbohydrates: number;
    proteins: number;
    fats: number;
    vegetables?: number;
    fruits?: number;
  };
  description?: string;
  imageUrl?: string;
}

export interface FoodItem {
  alimento: string;
  gramos: string;
  category: 'Carbohidratos' | 'Legumbres' | 'Proteina Magra' | 'Proteina Semi-Magra' | 'Lácteos' | 'Grasas' | 'Frutas' | 'Vegetales';
  tipo?: string[];
}

export interface DailyTarget {
  Carbohidratos: number;
  Legumbres: number;
  'Proteina Magra': number;
  'Proteina Semi-Magra': number;
  Lácteos: number;
  Grasas: number;
  Frutas: number;
  Vegetales: number;
}

export interface MealPlan {
  date: Date;
  meals: {
    breakfast?: Food;
    lunch?: Food;
    dinner?: Food;
    snack?: Food;
  };
  totalMacros: {
    carbohydrates: number;
    proteins: number;
    fats: number;
    vegetables?: number;
    fruits?: number;
  };
}

export interface DailyMacros {
  Carbohidratos: number;
  Legumbres: number;
  'Proteina Magra': number;
  'Proteina Semi-Magra': number;
  Lácteos: number;
  Grasas: number;
  Frutas: number;
  Vegetales: number;
}
