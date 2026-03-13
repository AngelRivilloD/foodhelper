import { FoodItem } from './food.model';

export interface ConfirmedMealPlan {
  [category: string]: {
    food: FoodItem;
    portions: number;
    totalAmount: string;
  }[];
}

export interface DailyMealState {
  date: string; // YYYY-MM-DD local
  meals: {
    [mealType: string]: {
      confirmed: boolean;
      mealPlan: ConfirmedMealPlan;
    };
  };
}

export interface StreakState {
  count: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
}

export const CALORIES_PER_PORTION: { [category: string]: number } = {
  'Proteina Magra': 55,
  'Proteina Semi-Magra': 75,
  'Carbohidratos': 140,
  'Lácteos': 100,
  'Grasas': 45,
  'Frutas': 60,
  'Vegetales': 25,
};

export const MEAL_GENDER: { [mealType: string]: 'masculino' | 'femenino' } = {
  'DESAYUNO': 'masculino',
  'COMIDA': 'masculino',
  'MERIENDA': 'femenino',
  'CENA': 'femenino',
};

export const MOTIVATIONAL_MESSAGES: string[] = [
  '¡Gran elección!',
  '¡Vas genial!',
  '¡Nutrición perfecta!',
  '¡Sigue así!',
  '¡Eso es disciplina!',
  '¡Tu cuerpo te lo agradece!',
];
