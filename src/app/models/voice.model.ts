import { FoodItem } from './food.model';

export interface SpeechEvent {
  type: 'listening' | 'result' | 'interim' | 'volume' | 'error' | 'end';
  transcript?: string;
  confidence?: number;
  volume?: number;
  error?: string;
}

export interface MatchResult {
  token: string;
  matched: boolean;
  food?: FoodItem;
  category?: string;
  confidence?: number;
  portions?: number;
}

export interface VoiceResult {
  matches: MatchResult[];
  unmatched: string[];
}
