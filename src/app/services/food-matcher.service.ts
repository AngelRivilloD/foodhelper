import { Injectable } from '@angular/core';
import { FoodCalculatorService } from './food-calculator.service';
import { FoodItem } from '../models/food.model';
import { MatchResult, VoiceResult } from '../models/voice.model';

@Injectable({
  providedIn: 'root'
})
export class FoodMatcherService {

  private readonly STOP_WORDS = new Set([
    'quiero', 'dame', 'ponme', 'pon', 'añade', 'agrega',
    'me', 'un', 'una', 'unos', 'unas', 'algo', 'de',
    'por', 'favor', 'poner', 'el', 'la', 'los', 'las',
    'con', 'para', 'hoy', 'comer', 'cenar', 'desayunar',
    'quería', 'quisiera', 'podrias', 'podrías', 'meter',
    'tomar', 'cena', 'comida', 'desayuno', 'merienda'
  ]);

  private readonly SEPARATORS = /\s*,\s*|\s+y\s+|\s+e\s+|\s+con\s+/i;

  constructor(private foodCalculator: FoodCalculatorService) {}

  match(transcript: string, mealType: string, categories: string[]): VoiceResult {
    const tokens = this.tokenize(transcript);
    const allFoods = this.getAllFoodsForMeal(mealType, categories);
    const compoundResults = this.matchWithCompounds(tokens, allFoods);

    return {
      matches: compoundResults.filter(m => m.matched),
      unmatched: compoundResults.filter(m => !m.matched).map(m => m.token)
    };
  }

  private matchWithCompounds(tokens: string[], foods: FoodItem[]): MatchResult[] {
    const results: MatchResult[] = [];
    const usedCategories = new Set<string>();
    const consumed = new Set<number>();

    for (let len = Math.min(3, tokens.length); len >= 2; len--) {
      for (let i = 0; i <= tokens.length - len; i++) {
        if (consumed.has(i)) continue;
        const compound = tokens.slice(i, i + len).join(' ');
        const result = this.findBestMatch(compound, foods, usedCategories);
        if (result.matched) {
          results.push(result);
          if (result.category) usedCategories.add(result.category);
          for (let j = i; j < i + len; j++) consumed.add(j);
        }
      }
    }

    for (let i = 0; i < tokens.length; i++) {
      if (consumed.has(i)) continue;
      const result = this.findBestMatch(tokens[i], foods, usedCategories);
      results.push(result);
      if (result.matched && result.category) usedCategories.add(result.category);
    }

    return results;
  }

  private tokenize(transcript: string): string[] {
    let text = this.normalize(transcript);
    const segments = text.split(this.SEPARATORS)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const tokens: string[] = [];
    for (const segment of segments) {
      const words = segment.split(/\s+/).filter(w => !this.STOP_WORDS.has(w));
      if (words.length > 0) {
        tokens.push(words.join(' '));
      }
    }
    return tokens;
  }

  private normalize(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private getAllFoodsForMeal(mealType: string, categories: string[]): FoodItem[] {
    const normalizedMeal = mealType.toLowerCase();
    const foods: FoodItem[] = [];

    for (const category of categories) {
      let categoryFoods = this.foodCalculator.getFoodsByCategory(category);
      categoryFoods = this.foodCalculator.filterByPreferences(categoryFoods, category);
      for (const food of categoryFoods) {
        if (!food.tipo || food.tipo.includes(normalizedMeal)) {
          foods.push(food);
        }
      }
    }
    return foods;
  }

  private findBestMatch(token: string, foods: FoodItem[], usedCategories: Set<string>): MatchResult {
    const normalizedToken = this.normalize(token);
    let bestMatch: { food: FoodItem; confidence: number } | null = null;

    for (const food of foods) {
      const normalizedName = this.normalize(food.alimento);
      let confidence = 0;

      if (normalizedName.includes(normalizedToken)) {
        confidence = 1.0;
      } else if (normalizedToken.includes(normalizedName)) {
        confidence = 0.9;
      } else {
        const distance = this.levenshtein(normalizedToken, normalizedName.split(' ')[0]);
        if (distance <= 2) {
          confidence = 0.7;
        }
      }

      if (confidence > 0) {
        const categoryBonus = usedCategories.has(food.category) ? 0 : 0.05;
        const totalScore = confidence + categoryBonus;
        if (!bestMatch || totalScore > bestMatch.confidence) {
          bestMatch = { food, confidence: totalScore };
        }
      }
    }

    if (bestMatch) {
      return {
        token, matched: true,
        food: bestMatch.food, category: bestMatch.food.category,
        confidence: bestMatch.confidence
      };
    }
    return { token, matched: false };
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }
}
