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
    'Frutas': [],
    'Vegetales': []
  };

  private currentMealPlan: { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } | null = null;
  private currentMealType: string = 'DESAYUNO';

  private dailyTargetSubject = new BehaviorSubject<DailyTarget>({
    'Carbohidratos': 5,
    'Legumbres': 1,
    'Proteina Magra': 4,
    'Proteina Semi-Magra': 1,
    'Lácteos': 2,
    'Grasas': 3,
    'Frutas': 2,
    'Vegetales': 3
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
      "Carbohidratos": [
        {"alimento": "Patata", "gramos": "90g", "category": "Carbohidratos", "tipo": ["comida", "cena"]},
        {"alimento": "Gnocchis", "gramos": "40g", "category": "Carbohidratos", "tipo": ["comida", "cena"]},
        {"alimento": "Boniato", "gramos": "75g", "category": "Carbohidratos", "tipo": ["comida", "cena"]},
        {"alimento": "Plátano macho", "gramos": "50g", "category": "Carbohidratos", "tipo": ["comida", "cena"]},
        {"alimento": "Yuca (cocido)", "gramos": "50g", "category": "Carbohidratos", "tipo": ["comida", "cena"]},
        {"alimento": "Quinoa", "gramos": "20g", "category": "Carbohidratos", "tipo": ["comida", "cena"]},
        {"alimento": "Pasta", "gramos": "20g", "category": "Carbohidratos", "tipo": ["comida", "cena"]},
        {"alimento": "Arroz", "gramos": "20g", "category": "Carbohidratos", "tipo": ["comida", "cena"]},
        {"alimento": "Avena/harina de avena", "gramos": "20g", "category": "Carbohidratos", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Harina de maíz (pan)", "gramos": "20g", "category": "Carbohidratos", "tipo": ["desayuno", "comida", "cena"]},
        {"alimento": "Cornflakes", "gramos": "20g", "category": "Carbohidratos", "tipo": ["desayuno"]},
        {"alimento": "Pan blanco o integral de barra", "gramos": "30g", "category": "Carbohidratos", "tipo": ["desayuno", "comida", "cena"]},
        {"alimento": "Pan tostado", "gramos": "1 unidad", "category": "Carbohidratos", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Pan de molde", "gramos": "1 unidad", "category": "Carbohidratos", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Pan thins", "gramos": "1 unidad", "category": "Carbohidratos", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Miel", "gramos": "20g", "category": "Carbohidratos", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Maíz dulce", "gramos": "140g", "category": "Carbohidratos", "tipo": ["comida", "cena"]},
        {"alimento": "Cous-cous", "gramos": "20g", "category": "Carbohidratos", "tipo": ["comida", "cena"]},
        {"alimento": "Tortitas de arroz/maíz", "gramos": "2 unidades", "category": "Carbohidratos", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Fajitas medianas", "gramos": "1 unidad", "category": "Carbohidratos", "tipo": ["comida", "cena"]},
        {"alimento": "Azúcar blanco/moreno", "gramos": "15g", "category": "Carbohidratos", "tipo": ["desayuno", "merienda"]},
      //  {"alimento": "Crema de arroz", "gramos": "20g", "category": "Carbohidratos", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Palomitas de maíz", "gramos": "20g", "category": "Carbohidratos", "tipo": ["merienda"]},
        {"alimento": "Granola baja en grasa", "gramos": "20g", "category": "Carbohidratos", "tipo": ["desayuno", "merienda"]},
       // {"alimento": "Casabe", "gramos": "20g", "category": "Carbohidratos", "tipo": ["desayuno", "cena"]},
        {"alimento": "Pan Árabe", "gramos": "30gr", "category": "Carbohidratos", "tipo": ["comida", "cena"]},
        {"alimento": "Pan Wasa", "gramos": "2 unidades", "category": "Carbohidratos", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Galleta María", "gramos": "3 unidades", "category": "Carbohidratos", "tipo": ["desayuno", "merienda"]}
      ],
      "Legumbres": [
        {"alimento": "Lentejas", "gramos": "30g crudo", "category": "Legumbres", "tipo": ["comida", "cena"]},
        {"alimento": "Garbanzos", "gramos": "30g crudo", "category": "Legumbres", "tipo": ["comida", "cena"]},
        {"alimento": "Frijoles/caraotas/alubias", "gramos": "30g crudo", "category": "Legumbres", "tipo": ["comida", "cena"]}
      ],
      "Proteina Magra": [
        {"alimento": "Pescado blanco", "gramos": "40g", "category": "Proteina Magra", "tipo": ["comida", "cena"]},
        //{"alimento": "Camarones/gambas", "gramos": "40g", "category": "Proteina Magra", "tipo": ["comida", "cena"]},
        {"alimento": "Atún al natural en lata", "gramos": "1/2 lata", "category": "Proteina Magra", "tipo": ["comida", "cena"]},
        {"alimento": "Pechuga de pollo/pavo", "gramos": "30g", "category": "Proteina Magra", "tipo": ["comida", "cena"]},
        {"alimento": "Clara de huevo", "gramos": "60g", "category": "Proteina Magra", "tipo": ["desayuno", "comida", "cena"]},
        {"alimento": "Jamón de pollo/pavo", "gramos": "30g", "category": "Proteina Magra", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Lomo embuchado", "gramos": "20g", "category": "Proteina Magra", "tipo": ["merienda", "cena"]},
        //{"alimento": "Calamares y mariscos", "gramos": "40g", "category": "Proteina Magra", "tipo": ["comida", "cena"]},
        {"alimento": "Carne roja magra", "gramos": "30g", "category": "Proteina Magra", "tipo": ["comida", "cena"]},
        {"alimento": "Proteína en polvo", "gramos": "1/3 de scoop", "category": "Proteina Magra", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Lomo de cerdo", "gramos": "30g", "category": "Proteina Magra", "tipo": ["comida", "cena"]},
        //{"alimento": "Soja", "gramos": "15g", "category": "Proteina Magra", "tipo": ["comida", "cena"]},
        //{"alimento": "Seitán", "gramos": "30g", "category": "Proteina Magra", "tipo": ["comida", "cena"]},
        {"alimento": "Queso burgos light/desnatado", "gramos": "70g", "category": "Proteina Magra", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Yogur straciatella", "gramos": "1/2 unidad", "category": "Proteina Magra", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Yogur proteico sabores", "gramos": "2/3 unidad", "category": "Proteina Magra", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Gelatina proteica", "gramos": "1 unidad", "category": "Proteina Magra", "tipo": ["desayuno", "comida", "merienda", "cena"]},
        {"alimento": "Yogur proteico natrual", "gramos": "70g", "category": "Proteina Magra", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Yogur proteico bebible", "gramos": "1/3 unidad", "category": "Proteina Magra", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Queso fresco batido 0%", "gramos": "70g", "category": "Proteina Magra", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Queso havarti light", "gramos": "1 loncha", "category": "Proteina Magra", "tipo": ["desayuno","comida","merienda", "cena"]},
        {"alimento": "Queso mozzarella light", "gramos": "40g", "category": "Proteina Magra", "tipo": ["comida", "cena"]},
        {"alimento": "Queso cottage", "gramos": "50g", "category": "Proteina Magra", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Queso fresco light", "gramos": "60g", "category": "Proteina Magra", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Salmón", "gramos": "40g", "category": "Proteina Magra", "tipo": ["comida", "cena"]},
        {"alimento": "Helado proteico", "gramos": "80g", "category": "Proteina Magra", "tipo": ["comida", "merienda", "cena"]},
      ],
      "Proteina Semi-Magra": [
        {"alimento": "Huevo", "gramos": "1 unidad", "category": "Proteina Semi-Magra", "tipo": ["desayuno", "comida", "cena"]},
        {"alimento": "Carne de cerdo (graso)", "gramos": "30g", "category": "Proteina Semi-Magra", "tipo": ["comida", "cena"]},
        {"alimento": "Carne roja grasa", "gramos": "30g", "category": "Proteina Semi-Magra", "tipo": ["comida", "cena"]},
        {"alimento": "Jamón serrano/ibérico", "gramos": "30g", "category": "Proteina Semi-Magra", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Atún en aceite", "gramos": "40g", "category": "Proteina Semi-Magra", "tipo": ["comida", "cena"]},
        {"alimento": "Tofu", "gramos": "65g", "category": "Proteina Semi-Magra", "tipo": ["comida", "cena"]},
        {"alimento": "Queso burgos natural", "gramos": "70g", "category": "Proteina Semi-Magra", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Queso mozzarella normal", "gramos": "40g", "category": "Proteina Semi-Magra", "tipo": ["desayuno", "comida", "cena"]},
        {"alimento": "Queso parmesano", "gramos": "25g", "category": "Proteina Semi-Magra", "tipo": ["comida", "cena"]}
      ],
      "Lácteos": [
        {"alimento": "Leche descremada/desnatada", "gramos": "200g", "category": "Lácteos", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Yogur descremado (s/a)", "gramos": "200g", "category": "Lácteos", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Leche semidesnatada", "gramos": "240g", "category": "Lácteos", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Yogur semidesnatado (s/a)", "gramos": "240g", "category": "Lácteos", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Leche entera", "gramos": "200g", "category": "Lácteos", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Leche de cabra", "gramos": "200g", "category": "Lácteos", "tipo": ["desayuno", "cena"]},
        {"alimento": "Leche de oveja", "gramos": "150g", "category": "Lácteos", "tipo": ["desayuno", "cena"]},
        {"alimento": "Cuajada", "gramos": "135g", "category": "Lácteos", "tipo": ["merienda", "cena"]},
        {"alimento": "Yogur natural entero", "gramos": "240g", "category": "Lácteos", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Kefir", "gramos": "200g", "category": "Lácteos", "tipo": ["desayuno", "merienda", "cena"]}
      ],
      "Grasas": [
        {"alimento": "Aguacate", "gramos": "30g", "category": "Grasas", "tipo": ["desayuno", "comida", "cena"]},
        {"alimento": "Aceite de oliva", "gramos": "5g", "category": "Grasas", "tipo": ["comida", "cena"]},
        {"alimento": "Pistachos", "gramos": "10g", "category": "Grasas", "tipo": ["merienda"]},
        {"alimento": "Mantequilla", "gramos": "5g", "category": "Grasas", "tipo": ["desayuno", "cena"]},
        {"alimento": "Avellanas", "gramos": "8g", "category": "Grasas", "tipo": ["merienda"]},
        {"alimento": "Mantequilla de maní", "gramos": "10g", "category": "Grasas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Crema de frutos secos", "gramos": "10g", "category": "Grasas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Coco rallado", "gramos": "8g", "category": "Grasas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Aceituna verde (deshuesadas)", "gramos": "30g", "category": "Grasas", "tipo": ["comida", "cena"]},
        {"alimento": "Aceitunas negras", "gramos": "40g", "category": "Grasas", "tipo": ["comida", "cena"]},
        {"alimento": "Almendras", "gramos": "10g", "category": "Grasas", "tipo": ["merienda"]},
        {"alimento": "Cashews/anacardos", "gramos": "10g", "category": "Grasas", "tipo": ["merienda"]},
        {"alimento": "Nueces", "gramos": "10g", "category": "Grasas", "tipo": ["merienda"]},
        {"alimento": "Aceite de coco", "gramos": "5g", "category": "Grasas", "tipo": ["comida", "cena"]},
        {"alimento": "Chocolate negro (70-75%)", "gramos": "10g", "category": "Grasas", "tipo": ["merienda"]},
        {"alimento": "Nata para cocinar 15%", "gramos": "25g", "category": "Grasas", "tipo": ["comida", "cena"]},
        {"alimento": "Leche de coco", "gramos": "25g", "category": "Grasas", "tipo": ["comida", "cena"]},
        {"alimento": "Cacahuetes/maní", "gramos": "10g", "category": "Grasas", "tipo": ["merienda"]},
        {"alimento": "Mayonesa", "gramos": "7g", "category": "Grasas", "tipo": ["comida", "cena"]},
        {"alimento": "Hummus", "gramos": "20g", "category": "Grasas", "tipo": ["comida", "cena"]},
        {"alimento": "Queso Crema normal", "gramos": "20g", "category": "Grasas", "tipo": ["desayuno", "cena"]},
        {"alimento": "Queso feta", "gramos": "30g", "category": "Grasas", "tipo": ["desayuno","comida", "cena"]},
        {"alimento": "Semillas de girasol, ajonjolí, chía", "gramos": "20g", "category": "Grasas", "tipo": ["desayuno", "merienda"]}
      ],
      "Frutas": [
        {"alimento": "Banana", "gramos": "1/2 unidad", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Piña", "gramos": "110g", "category": "Frutas", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Melón", "gramos": "200g", "category": "Frutas", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Sandía", "gramos": "200g", "category": "Frutas", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Fresas", "gramos": "120g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Frambuesas", "gramos": "120g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Moras", "gramos": "150g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Arándanos", "gramos": "100g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Papaya", "gramos": "200g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Mango", "gramos": "100g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Manzana", "gramos": "130g", "category": "Frutas", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Pera", "gramos": "120g", "category": "Frutas", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Kiwi", "gramos": "100g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Durazno/melocotón", "gramos": "100g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Ciruela", "gramos": "100g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Uvas", "gramos": "90g", "category": "Frutas", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Naranja", "gramos": "130g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Mandarina", "gramos": "130g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Cerezas", "gramos": "110g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Granada", "gramos": "80g", "category": "Frutas", "tipo": ["desayuno", "merienda", "cena"]},
        {"alimento": "Uvas pasas", "gramos": "20g", "category": "Frutas", "tipo": ["desayuno", "merienda"]},
        {"alimento": "Dátiles", "gramos": "20g", "category": "Frutas", "tipo": ["desayuno", "merienda"]}
      ],
        "Vegetales": [
         // {"alimento": "Acelgas", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
         // {"alimento": "Hinojo", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
         // {"alimento": "Ají dulce", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Hongos", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Ajo", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Jugo de tomate", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
         // {"alimento": "Ajo porro", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Lechuga", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
        //  {"alimento": "Alcachofa", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
        //  {"alimento": "Nabo", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Pimiento", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Calabacín", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
         // {"alimento": "Quimbombó", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Cebolla", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
         // {"alimento": "Rábanos", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Cebollín", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Remolacha", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Apio", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Alfalfa", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Palmito", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Calabaza", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Pepino", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Berenjena", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Perejil", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Berros", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Brócoli", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          //{"alimento": "Chayota", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Repollo", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Coliflor", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Tomate", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          //{"alimento": "Corazón de alcachofa", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Tomate en lata", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          //{"alimento": "Repollitos de Bruselas", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          //{"alimento": "Escarola", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Vainitas", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Espárragos", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          //{"alimento": "Vegetales chinos", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Espinaca", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Zanahoria", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]},
          {"alimento": "Edamames", "gramos": "1 taza crudo", "category": "Vegetales", "tipo": ["comida", "cena"]}
        ]
      
    }
    
    
    
  }

  // Establecer objetivos diarios
  setDailyTarget(target: DailyTarget): void {
    this.dailyTargetSubject.next(target);
  }

  // Establecer tipo de comida actual
  setCurrentMealType(mealType: string): void {
    this.currentMealType = mealType;
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
  generateMealPlan(mealType?: string): { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } {
    const target = this.getDailyTarget();
    const mealPlan: { [category: string]: any[] } = {};
    const currentMealType = mealType || this.currentMealType;

    Object.keys(target).forEach(category => {
      const targetPortions = target[category as keyof DailyTarget];
      const availableFoods = this.getFoodsByCategory(category);
      
      if (availableFoods.length > 0 && targetPortions > 0) {
        // Seleccionar alimentos inteligentemente (máximo 3-4 por categoría)
        const suggestedFoods = this.selectSuggestedFoods(availableFoods, targetPortions, currentMealType);
        
        mealPlan[category] = suggestedFoods.map(item => ({
          food: item.food,
          portions: item.portions,
          totalAmount: this.calculateTotalAmount(item.food, item.portions, category)
        }));
      }
    });

    // Asegurar que siempre haya carbohidratos disponibles si hay proteína magra
    // (para casos especiales como yogur bebible que puede reducir carbohidratos a 0)
    if (mealPlan['Proteina Magra'] && mealPlan['Proteina Magra'].length > 0 && !mealPlan['Carbohidratos']) {
      const carbohidratosTarget = target['Carbohidratos'];
      if (carbohidratosTarget > 0) {
        const availableCarbohidratos = this.getFoodsByCategory('Carbohidratos');
        if (availableCarbohidratos.length > 0) {
          const suggestedCarbohidratos = this.selectSuggestedFoods(availableCarbohidratos, carbohidratosTarget, currentMealType);
          mealPlan['Carbohidratos'] = suggestedCarbohidratos.map(item => ({
            food: item.food,
            portions: item.portions,
            totalAmount: this.calculateTotalAmount(item.food, item.portions, 'Carbohidratos')
          }));
        }
      }
    }

    // Aplicar reglas especiales para alimentos específicos
    this.applySpecialFoodRules(mealPlan);

    // Guardar el estado actual del mealPlan
    this.currentMealPlan = mealPlan;
    return mealPlan;
  }

  // Seleccionar alimentos sugeridos de manera inteligente
  private selectSuggestedFoods(foods: FoodItem[], targetPortions: number, mealType?: string): { food: FoodItem, portions: number }[] {
    // Algoritmo de selección inteligente - SOLO UNA SUGERENCIA POR DEFECTO
    const suggestions: { food: FoodItem, portions: number }[] = [];
    
    // Filtrar por tipo de comida si se especifica
    let filteredFoods = foods;
    if (mealType && mealType !== '') {
      const normalizedMealType = mealType.toLowerCase();
      filteredFoods = foods.filter(food => 
        food.tipo && food.tipo.includes(normalizedMealType)
      );
    }
    
    // Si no hay alimentos filtrados, usar todos los alimentos
    if (filteredFoods.length === 0) {
      filteredFoods = foods;
    }
    
    // Priorizar alimentos más comunes/versátiles
    const priorityFoods = this.getPriorityFoods(filteredFoods);
    
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
  private calculateTotalAmount(food: FoodItem, portions: number, category?: string): string {
    // Si no hay porciones, mostrar 0
    if (portions === 0) {
      return '0';
    }
    
    // Manejar fracciones (como "1/3 de scoop")
    const fractionMatch = food.gramos.match(/(\d+)\/(\d+)/);
    if (fractionMatch) {
      const numerator = parseInt(fractionMatch[1]);
      const denominator = parseInt(fractionMatch[2]);
      const totalNumerator = numerator * portions;
      
      // Simplificar la fracción
      const gcd = this.gcd(totalNumerator, denominator);
      const simplifiedNum = totalNumerator / gcd;
      const simplifiedDen = denominator / gcd;
      
      if (simplifiedDen === 1) {
        // Determinar la unidad correcta
        if (food.gramos.toLowerCase().includes('scoop')) {
          return `${simplifiedNum} scoop${simplifiedNum > 1 ? 's' : ''}`;
        } else if (food.gramos.toLowerCase().includes('lata')) {
          return `${simplifiedNum} lata${simplifiedNum > 1 ? 's' : ''}`;
        } else {
          return `${simplifiedNum} ${food.gramos.replace(/\d+\/\d+\s*/, '').trim()}`;
        }
      } else {
        // Determinar la unidad correcta para fracciones
        if (food.gramos.toLowerCase().includes('scoop')) {
          return `${simplifiedNum}/${simplifiedDen} scoop`;
        } else if (food.gramos.toLowerCase().includes('lata')) {
          return `${simplifiedNum}/${simplifiedDen} lata`;
        } else {
          return `${simplifiedNum}/${simplifiedDen} ${food.gramos.replace(/\d+\/\d+\s*/, '').trim()}`;
        }
      }
    }
    
    // Buscar números en el campo gramos
    const gramosMatch = food.gramos.match(/(\d+)/);
    if (gramosMatch) {
      const baseAmount = parseInt(gramosMatch[1]);
      const totalAmount = baseAmount * portions;
      
      // Si el texto original contiene "g" o "gramos", usar "g"
      if (food.gramos.toLowerCase().includes('g')) {
        // No mostrar "crudo" para frutas, grasas y helado proteico
        if (category === 'Frutas' || category === 'Grasas' || food.alimento === 'Helado proteico') {
          return `${totalAmount}g`;
        }
        return `${totalAmount}g crudo`;
      }
      // Si contiene "unidad", usar "unidades"
      else if (food.gramos.toLowerCase().includes('unidad')) {
        return `${totalAmount} unidades`;
      }
      // Si contiene "loncha", usar "lonchas"
      else if (food.gramos.toLowerCase().includes('loncha')) {
        return `${totalAmount} loncha${totalAmount > 1 ? 's' : ''}`;
      }
      // Para otros casos, mantener el formato original
      else {
        return `${totalAmount} ${food.gramos.replace(/\d+/, '').trim()}`;
      }
    }
    
    // Si no hay números, mostrar el formato original multiplicado
    return `${portions} x ${food.gramos}`;
  }

  // Calcular el máximo común divisor
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
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
      'Frutas': target['Frutas'],
      'Vegetales': target['Vegetales']
    };
  }

  // Cambiar un alimento sugerido por otro de la misma categoría
  replaceFood(category: string, currentFood: FoodItem, newFood: FoodItem, portions: number): { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } {
    // Obtener el plan actual - usar el plan existente si está disponible
    let mealPlan = this.currentMealPlan || this.generateMealPlan();
    
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
              item.totalAmount = this.calculateTotalAmount(newFood, portions, category);
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
          totalAmount: this.calculateTotalAmount(newFood, portions, category)
        };
        }
      }
    }
    
    // Aplicar reglas especiales para alimentos específicos
    this.applySpecialFoodRules(mealPlan);
    
    // Guardar el estado actual del mealPlan
    this.currentMealPlan = mealPlan;
    return mealPlan;
  }

  // Obtener alternativas para un alimento específico
  getAlternatives(category: string, currentFood: FoodItem, mealType?: string): FoodItem[] {
    const allFoods = this.getFoodsByCategory(category);
    let filteredFoods = allFoods.filter(food => food.alimento !== currentFood.alimento);
    
    // Filtrar por tipo de comida si se especifica
    if (mealType && mealType !== '') {
      const normalizedMealType = mealType.toLowerCase();
      filteredFoods = filteredFoods.filter(food => 
        food.tipo && food.tipo.includes(normalizedMealType)
      );
    }
    
    return filteredFoods;
  }

  // Ajustar porciones de un alimento específico
  adjustPortions(category: string, food: FoodItem, newPortions: number): { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } {
    // Usar el plan actual si está disponible, sino generar uno nuevo
    let mealPlan = this.currentMealPlan || this.generateMealPlan();
    
    if (mealPlan[category]) {
      const index = mealPlan[category].findIndex(item => item.food.alimento === food.alimento);
      if (index !== -1) {
        // Ajustar normalmente para todas las categorías
        mealPlan[category][index] = {
          food: food,
          portions: newPortions,
          totalAmount: this.calculateTotalAmount(food, newPortions, category)
        };
      }
    }
    
    // Guardar el estado actual del mealPlan
    this.currentMealPlan = mealPlan;
    return mealPlan;
  }

  // Agregar un nuevo alimento al plan
  addFoodToPlan(category: string, food: FoodItem, portions: number = 1): { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } {
    // Usar el plan actual si está disponible, sino generar uno nuevo
    let mealPlan = this.currentMealPlan || this.generateMealPlan();
    
    if (!mealPlan[category]) {
      mealPlan[category] = [];
    }
    
    // Verificar si el alimento ya existe
    const existingIndex = mealPlan[category].findIndex(item => item.food.alimento === food.alimento);
    
    if (existingIndex !== -1) {
      // Si ya existe, incrementar porciones
      mealPlan[category][existingIndex].portions += portions;
      mealPlan[category][existingIndex].totalAmount = this.calculateTotalAmount(food, mealPlan[category][existingIndex].portions, category);
    } else {
      // Si no existe, agregarlo
      mealPlan[category].push({
        food: food,
        portions: portions,
        totalAmount: this.calculateTotalAmount(food, portions, category)
      });
    }
    
    // Guardar el estado actual del mealPlan
    this.currentMealPlan = mealPlan;
    return mealPlan;
  }

  // Remover un alimento del plan
  removeFoodFromPlan(category: string, food: FoodItem): { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] } {
    // Usar el plan actual si está disponible, sino generar uno nuevo
    let mealPlan = this.currentMealPlan || this.generateMealPlan();
    
    if (mealPlan[category]) {
      mealPlan[category] = mealPlan[category].filter(item => item.food.alimento !== food.alimento);
    }
    
    // Guardar el estado actual del mealPlan
    this.currentMealPlan = mealPlan;
    return mealPlan;
  }

  // Aplicar reglas especiales para alimentos específicos
  private applySpecialFoodRules(mealPlan: { [category: string]: { food: FoodItem, portions: number, totalAmount: string }[] }): void {
    // Regla especial: Yogur proteico bebible
    // Si se selecciona yogur proteico bebible, cuenta como 3 porciones de proteína magra
    // y resta 1 porción de carbohidratos
    if (mealPlan['Proteina Magra']) {
      const yogurBebibleIndex = mealPlan['Proteina Magra'].findIndex(
        item => item.food.alimento === 'Yogur proteico bebible'
      );
      
      if (yogurBebibleIndex !== -1) {
        const yogurItem = mealPlan['Proteina Magra'][yogurBebibleIndex];
        
        // Si hay yogur bebible, ajustar las porciones
        if (yogurItem.portions > 0) {
          // Aumentar a 3 porciones de proteína magra
          yogurItem.portions = 3;
          yogurItem.totalAmount = this.calculateTotalAmount(yogurItem.food, 3, 'Proteina Magra');
          
          // Reducir carbohidratos en 1 porción si existen
          if (mealPlan['Carbohidratos'] && mealPlan['Carbohidratos'].length > 0) {
            const carbohidratoIndex = mealPlan['Carbohidratos'].findIndex(
              item => item.portions > 0
            );
            
            if (carbohidratoIndex !== -1) {
              const carbohidratoItem = mealPlan['Carbohidratos'][carbohidratoIndex];
              carbohidratoItem.portions = Math.max(0, carbohidratoItem.portions - 1);
              
              if (carbohidratoItem.portions === 0) {
                // Si se queda en 0, mantener el carbohidrato pero con 0 porciones
                // para que esté disponible para cambios futuros
                carbohidratoItem.totalAmount = '0g';
              } else {
                // Recalcular el totalAmount
                carbohidratoItem.totalAmount = this.calculateTotalAmount(
                  carbohidratoItem.food, 
                  carbohidratoItem.portions, 
                  'Carbohidratos'
                );
              }
            }
          }
        }
      }
    }

    // Regla especial: Yogur proteico sabores
    // Si se selecciona yogur proteico sabores, resta 1 porción de carbohidratos
    if (mealPlan['Proteina Magra']) {
      const yogurSaboresIndex = mealPlan['Proteina Magra'].findIndex(
        item => item.food.alimento === 'Yogur proteico sabores' && item.portions > 0
      );
      
      if (yogurSaboresIndex !== -1) {
        // Reducir carbohidratos en 1 porción si existen
        if (mealPlan['Carbohidratos'] && mealPlan['Carbohidratos'].length > 0) {
          const carbohidratoIndex = mealPlan['Carbohidratos'].findIndex(
            item => item.portions > 0
          );
          
          if (carbohidratoIndex !== -1) {
            const carbohidratoItem = mealPlan['Carbohidratos'][carbohidratoIndex];
            carbohidratoItem.portions = Math.max(0, carbohidratoItem.portions - 1);
            
            if (carbohidratoItem.portions === 0) {
              // Si se queda en 0, mantener el carbohidrato pero con 0 porciones
              // para que esté disponible para cambios futuros
              carbohidratoItem.totalAmount = '0g';
            } else {
              // Recalcular el totalAmount
              carbohidratoItem.totalAmount = this.calculateTotalAmount(
                carbohidratoItem.food, 
                carbohidratoItem.portions, 
                'Carbohidratos'
              );
            }
          }
        }
      }
    }

    // Regla especial: Helado proteico
    // Si se selecciona helado proteico, resta 1 porción de carbohidratos
    if (mealPlan['Proteina Magra']) {
      const heladoIndex = mealPlan['Proteina Magra'].findIndex(
        item => item.food.alimento === 'Helado proteico' && item.portions > 0
      );
      
      if (heladoIndex !== -1) {
        // Reducir carbohidratos en 1 porción si existen
        if (mealPlan['Carbohidratos'] && mealPlan['Carbohidratos'].length > 0) {
          const carbohidratoIndex = mealPlan['Carbohidratos'].findIndex(
            item => item.portions > 0
          );
          
          if (carbohidratoIndex !== -1) {
            const carbohidratoItem = mealPlan['Carbohidratos'][carbohidratoIndex];
            carbohidratoItem.portions = Math.max(0, carbohidratoItem.portions - 1);
            
            if (carbohidratoItem.portions === 0) {
              // Si se queda en 0, mantener el carbohidrato pero con 0 porciones
              // para que esté disponible para cambios futuros
              carbohidratoItem.totalAmount = '0g';
            } else {
              // Recalcular el totalAmount
              carbohidratoItem.totalAmount = this.calculateTotalAmount(
                carbohidratoItem.food, 
                carbohidratoItem.portions, 
                'Carbohidratos'
              );
            }
          }
        }
      }
    }

    // Regla especial: Salmón
    // Si se selecciona salmón, eliminar todas las grasas del plan
    if (mealPlan['Proteina Magra']) {
      const salmonIndex = mealPlan['Proteina Magra'].findIndex(
        item => item.food.alimento === 'Salmón' && item.portions > 0
      );
      
      if (salmonIndex !== -1) {
        // Eliminar todas las grasas del plan
        if (mealPlan['Grasas']) {
          mealPlan['Grasas'] = [];
        }
      } else {
        // Si no hay salmón, restaurar las grasas si no existen
        const target = this.getDailyTarget();
        if (target['Grasas'] > 0 && (!mealPlan['Grasas'] || mealPlan['Grasas'].length === 0)) {
          const availableGrasas = this.getFoodsByCategory('Grasas');
          if (availableGrasas.length > 0) {
            const suggestedGrasas = this.selectSuggestedFoods(availableGrasas, target['Grasas'], this.currentMealType);
            mealPlan['Grasas'] = suggestedGrasas.map(item => ({
              food: item.food,
              portions: item.portions,
              totalAmount: this.calculateTotalAmount(item.food, item.portions, 'Grasas')
            }));
          }
        }
      }
    }
  }
}
