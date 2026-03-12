# Voice Input System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a voice input feature that lets users dictate food names and automatically replace items in their current meal plan with correct portions.

**Architecture:** Three new units — `SpeechRecognitionService` (Web Speech API wrapper + AudioContext for volume), `FoodMatcherService` (tokenization + fuzzy matching against foodDatabase), and `VoiceInputComponent` (FAB + bottom sheet UI with animations). The meal-calculator component orchestrates the result via its existing `replaceFood()` method.

**Tech Stack:** Angular 16, Web Speech API, AudioContext/AnalyserNode, CSS animations

**Spec:** `docs/superpowers/specs/2026-03-12-voice-input-design.md`

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/app/services/speech-recognition.service.ts` | Web Speech API wrapper, mic permissions, volume stream via AudioContext |
| `src/app/services/food-matcher.service.ts` | Text normalization, tokenization, fuzzy matching against food DB |
| `src/app/models/voice.model.ts` | Interfaces: `SpeechEvent`, `MatchResult`, `VoiceResult` |
| `src/app/components/voice-input/voice-input.component.ts` | Component logic: states, orchestration between services |
| `src/app/components/voice-input/voice-input.component.html` | Template: FAB, bottom sheet overlay, result cards |
| `src/app/components/voice-input/voice-input.component.css` | Styles: FAB, breathing pulse, wave animation, bottom sheet, stagger transitions |

### Modified files
| File | Change |
|------|--------|
| `src/app/app.module.ts` | Declare `VoiceInputComponent` |
| `src/app/services/food-calculator.service.ts` | Make `filterByPreferences` public so `FoodMatcherService` can use it |
| `src/app/components/meal-calculator/meal-calculator.component.html` | Add `<app-voice-input>` with inputs/outputs |
| `src/app/components/meal-calculator/meal-calculator.component.ts` | Add `onVoiceApply(results)` method |
| `src/app/components/meal-calculator/meal-calculator.component.css` | Add highlight flash animation for replaced items |

---

## Chunk 1: Data Models & FoodMatcherService

### Task 1: Voice interfaces

**Files:**
- Create: `src/app/models/voice.model.ts`

- [ ] **Step 1: Create voice model interfaces**

```typescript
// src/app/models/voice.model.ts

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
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/angelrivillo/Projects/foodhelper && npx ng build --configuration=development 2>&1 | tail -5`
Expected: Build succeeds (the file is standalone, no imports needed yet)

- [ ] **Step 3: Commit**

```bash
git add src/app/models/voice.model.ts
git commit -m "feat(voice): add voice input interfaces"
```

---

### Task 2: FoodMatcherService — core matching logic

**Files:**
- Create: `src/app/services/food-matcher.service.ts`
- Read: `src/app/services/food-calculator.service.ts` (for `getFoodsByCategory`, `filterByPreferences` patterns)

- [ ] **Step 0: Make `filterByPreferences` public in FoodCalculatorService**

In `src/app/services/food-calculator.service.ts`, change the method visibility from `private` to `public`:

```typescript
// Change: private filterByPreferences(foods: FoodItem[], category: string): FoodItem[]
// To:     public filterByPreferences(foods: FoodItem[], category: string): FoodItem[]
```

- [ ] **Step 1: Create the FoodMatcherService**

```typescript
// src/app/services/food-matcher.service.ts

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

  /**
   * Main entry: takes a raw transcript and returns matched foods.
   * @param transcript - raw text from speech recognition
   * @param mealType - current meal type (DESAYUNO, COMIDA, etc.)
   * @param categories - list of category keys to search in
   */
  match(transcript: string, mealType: string, categories: string[]): VoiceResult {
    const tokens = this.tokenize(transcript);
    const allFoods = this.getAllFoodsForMeal(mealType, categories);

    // Try compound matches first (greedy: longest token combinations first)
    const compoundResults = this.matchWithCompounds(tokens, allFoods);

    return {
      matches: compoundResults.filter(m => m.matched),
      unmatched: compoundResults.filter(m => !m.matched).map(m => m.token)
    };
  }

  /** Try matching compound names by combining adjacent tokens greedily */
  private matchWithCompounds(tokens: string[], foods: FoodItem[]): MatchResult[] {
    const results: MatchResult[] = [];
    const usedCategories = new Set<string>();
    const consumed = new Set<number>();

    // Try longest combinations first (3-word, then 2-word, then single)
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

    // Single tokens that weren't consumed
    for (let i = 0; i < tokens.length; i++) {
      if (consumed.has(i)) continue;
      const result = this.findBestMatch(tokens[i], foods, usedCategories);
      results.push(result);
      if (result.matched && result.category) usedCategories.add(result.category);
    }

    return results;
  }

  /** Remove stop words, split by separators, normalize each token */
  private tokenize(transcript: string): string[] {
    let text = this.normalize(transcript);

    // Split by separators first (before removing stop words, to preserve compound names)
    const segments = text.split(this.SEPARATORS)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Remove stop words within each segment, then split into words
    const tokens: string[] = [];
    for (const segment of segments) {
      const words = segment.split(/\s+/).filter(w => !this.STOP_WORDS.has(w));
      if (words.length > 0) {
        tokens.push(words.join(' '));
      }
    }

    return tokens;
  }

  /** Lowercase + remove accents */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /** Get all foods across categories, filtered by meal type AND profile preferences */
  private getAllFoodsForMeal(mealType: string, categories: string[]): FoodItem[] {
    const normalizedMeal = mealType.toLowerCase();
    const foods: FoodItem[] = [];

    for (const category of categories) {
      let categoryFoods = this.foodCalculator.getFoodsByCategory(category);
      // Apply profile food preferences
      categoryFoods = this.foodCalculator.filterByPreferences(categoryFoods, category);
      for (const food of categoryFoods) {
        if (!food.tipo || food.tipo.includes(normalizedMeal)) {
          foods.push(food);
        }
      }
    }

    return foods;
  }

  /** Find the best matching food for a token */
  private findBestMatch(
    token: string,
    foods: FoodItem[],
    usedCategories: Set<string>
  ): MatchResult {
    const normalizedToken = this.normalize(token);
    let bestMatch: { food: FoodItem; confidence: number } | null = null;

    for (const food of foods) {
      const normalizedName = this.normalize(food.alimento);
      let confidence = 0;

      // Priority 1: exact containment (token in food name)
      if (normalizedName.includes(normalizedToken)) {
        confidence = 1.0;
      }
      // Priority 2: reverse containment (food name in token)
      else if (normalizedToken.includes(normalizedName)) {
        confidence = 0.9;
      }
      // Priority 3: Levenshtein distance ≤ 2
      else {
        const distance = this.levenshtein(normalizedToken, normalizedName.split(' ')[0]);
        if (distance <= 2) {
          confidence = 0.7;
        }
      }

      if (confidence > 0) {
        // Prefer categories not yet used
        const categoryBonus = usedCategories.has(food.category) ? 0 : 0.05;
        const totalScore = confidence + categoryBonus;

        if (!bestMatch || totalScore > bestMatch.confidence) {
          bestMatch = { food, confidence: totalScore };
        }
      }
    }

    if (bestMatch) {
      return {
        token,
        matched: true,
        food: bestMatch.food,
        category: bestMatch.food.category,
        confidence: bestMatch.confidence
      };
    }

    return { token, matched: false };
  }

  /** Levenshtein distance between two strings */
  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }

    return dp[m][n];
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/angelrivillo/Projects/foodhelper && npx ng build --configuration=development 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Smoke test — manual verification**

Open browser console on the running app and verify the service is injectable:
```
// In component, temporarily: console.log(this.foodMatcher.match('arroz pollo aguacate', 'COMIDA', ['Carbohidratos', 'Proteina Magra', 'Grasas']));
```

- [ ] **Step 4: Commit**

```bash
git add src/app/services/food-matcher.service.ts
git commit -m "feat(voice): add FoodMatcherService with fuzzy matching"
```

---

## Chunk 2: SpeechRecognitionService

### Task 3: Speech recognition wrapper

**Files:**
- Create: `src/app/services/speech-recognition.service.ts`
- Read: `src/app/models/voice.model.ts` (for `SpeechEvent` interface)

- [ ] **Step 1: Create the SpeechRecognitionService**

```typescript
// src/app/services/speech-recognition.service.ts

import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SpeechEvent } from '../models/voice.model';

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {

  readonly isSupported: boolean;

  private recognition: any;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private volumeFrameId: number | null = null;
  private events$ = new Subject<SpeechEvent>();

  constructor(private ngZone: NgZone) {
    const win = window as any;
    this.isSupported = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  /** Start listening. Returns observable of speech events. */
  startListening(): Observable<SpeechEvent> {
    if (!this.isSupported) {
      this.events$.next({ type: 'error', error: 'not-supported' });
      return this.events$.asObservable();
    }

    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = true;
    this.recognition.continuous = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.ngZone.run(() => this.events$.next({ type: 'listening' }));
    };

    this.recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      const transcript = last[0].transcript;
      const confidence = last[0].confidence;
      const isFinal = last.isFinal;

      this.ngZone.run(() => {
        this.events$.next({
          type: isFinal ? 'result' : 'interim',
          transcript,
          confidence: isFinal ? confidence : undefined
        });
      });
    };

    this.recognition.onerror = (event: any) => {
      this.ngZone.run(() => {
        this.events$.next({ type: 'error', error: event.error });
      });
    };

    this.recognition.onend = () => {
      this.ngZone.run(() => this.events$.next({ type: 'end' }));
      this.stopVolumeTracking();
    };

    // Start mic + volume tracking, then start recognition
    this.startVolumeTracking().then(() => {
      this.recognition.start();
    }).catch((err) => {
      this.ngZone.run(() => {
        this.events$.next({ type: 'error', error: 'permission-denied' });
      });
    });

    return this.events$.asObservable();
  }

  /** Stop listening and clean up resources */
  stopListening(): void {
    if (this.recognition) {
      // Remove onend handler to avoid duplicate 'end' events
      this.recognition.onend = null;
      this.recognition.abort();
      this.recognition = null;
    }
    this.stopVolumeTracking();
    this.events$.next({ type: 'end' });
  }

  /** Request mic access and set up AudioContext + AnalyserNode for volume */
  private async startVolumeTracking(): Promise<void> {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    source.connect(this.analyser);

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    let lastEmit = 0;

    // Run volume tracking outside NgZone to avoid triggering change detection at 60fps.
    // The VoiceInputComponent handles its own change detection for volume updates.
    this.ngZone.runOutsideAngular(() => {
      const tick = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        const now = performance.now();
        // Throttle to ~30fps (every 33ms) to reduce overhead
        if (now - lastEmit >= 33) {
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const volume = Math.min(average / 128, 1);
          this.events$.next({ type: 'volume', volume });
          lastEmit = now;
        }

        this.volumeFrameId = requestAnimationFrame(tick);
      };

      this.volumeFrameId = requestAnimationFrame(tick);
    });
  }

  /** Stop volume tracking and release mic */
  private stopVolumeTracking(): void {
    if (this.volumeFrameId !== null) {
      cancelAnimationFrame(this.volumeFrameId);
      this.volumeFrameId = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/angelrivillo/Projects/foodhelper && npx ng build --configuration=development 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/services/speech-recognition.service.ts
git commit -m "feat(voice): add SpeechRecognitionService with volume tracking"
```

---

## Chunk 3: VoiceInputComponent — UI

### Task 4: Component skeleton + FAB

**Files:**
- Create: `src/app/components/voice-input/voice-input.component.ts`
- Create: `src/app/components/voice-input/voice-input.component.html`
- Create: `src/app/components/voice-input/voice-input.component.css`
- Modify: `src/app/app.module.ts:1-27`

- [ ] **Step 1: Create the component TypeScript**

```typescript
// src/app/components/voice-input/voice-input.component.ts

import { Component, ChangeDetectorRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { FoodMatcherService } from '../../services/food-matcher.service';
import { SpeechEvent, MatchResult, VoiceResult } from '../../models/voice.model';

type VoiceState = 'idle' | 'listening' | 'processing' | 'results' | 'error';

@Component({
  selector: 'app-voice-input',
  templateUrl: './voice-input.component.html',
  styleUrls: ['./voice-input.component.css']
})
export class VoiceInputComponent implements OnDestroy {
  @Input() mealType: string = 'COMIDA';
  @Input() mealPlanMode: 'dynamic' | 'fixed' = 'dynamic';
  @Input() categories: string[] = [];
  @Input() portionsMap: { [category: string]: number } = {}; // category → target portions for current meal
  @Output() apply = new EventEmitter<MatchResult[]>();

  readonly isSupported: boolean;

  state: VoiceState = 'idle';
  volume: number = 0;
  interimTranscript: string = '';
  result: VoiceResult | null = null;
  errorMessage: string = '';
  showPulse: boolean = false;
  showTooltip: boolean = false;

  private subscription: Subscription | null = null;
  private readonly PULSE_KEY = 'foodhelper_voice_pulse_count';
  private readonly MAX_PULSES = 3;

  constructor(
    private speechService: SpeechRecognitionService,
    private foodMatcher: FoodMatcherService,
    private cdr: ChangeDetectorRef
  ) {
    this.isSupported = this.speechService.isSupported;
    this.initPulse();
  }

  ngOnDestroy(): void {
    this.cancel();
  }

  /** Start voice recognition flow */
  startListening(): void {
    this.state = 'listening';
    this.interimTranscript = '';
    this.result = null;
    this.errorMessage = '';
    this.dismissPulse();

    // Haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    this.subscription = this.speechService.startListening().subscribe(event => {
      this.handleSpeechEvent(event);
    });
  }

  /** Cancel and return to idle */
  cancel(): void {
    this.speechService.stopListening();
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.state = 'idle';
    this.volume = 0;
  }

  /** Apply matched results to meal plan */
  applyResults(): void {
    if (this.result && this.result.matches.length > 0) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      this.apply.emit(this.result.matches);
    }
    this.state = 'idle';
  }

  /** Retry after error */
  retry(): void {
    this.startListening();
  }

  private handleSpeechEvent(event: SpeechEvent): void {
    switch (event.type) {
      case 'listening':
        this.state = 'listening';
        break;

      case 'volume':
        this.volume = event.volume ?? 0;
        this.cdr.detectChanges(); // Manual CD since volume events run outside NgZone
        break;

      case 'interim':
        this.interimTranscript = event.transcript ?? '';
        break;

      case 'result':
        this.state = 'processing';
        this.interimTranscript = event.transcript ?? '';
        // Small delay for the "processing" animation to show
        setTimeout(() => {
          this.processTranscript(event.transcript ?? '');
        }, 400);
        break;

      case 'error':
        this.handleError(event.error ?? 'unknown');
        break;

      case 'end':
        // If still listening (no result arrived), it means silence timeout
        if (this.state === 'listening') {
          this.errorMessage = 'No te escuché, intenta de nuevo';
          this.state = 'error';
        }
        break;
    }
  }

  private processTranscript(transcript: string): void {
    this.result = this.foodMatcher.match(transcript, this.mealType, this.categories);

    // Attach portion info from the current meal's targets
    for (const match of this.result.matches) {
      if (match.category && this.portionsMap[match.category]) {
        match.portions = this.portionsMap[match.category];
      }
    }

    if (this.result.matches.length === 0) {
      this.errorMessage = 'No encontré alimentos en lo que dijiste';
      this.state = 'error';
    } else {
      this.state = 'results';
    }
  }

  private handleError(error: string): void {
    switch (error) {
      case 'not-supported':
        // Should not happen since FAB is hidden
        break;
      case 'permission-denied':
      case 'not-allowed':
        this.errorMessage = 'Necesito acceso al micrófono para escucharte';
        break;
      case 'network':
        this.errorMessage = 'Sin conexión para reconocimiento de voz';
        break;
      case 'no-speech':
        this.errorMessage = 'No te escuché, intenta de nuevo';
        break;
      default:
        this.errorMessage = 'Algo salió mal, intenta de nuevo';
    }
    this.state = 'error';
  }

  /** Show breathing pulse only first N times */
  private initPulse(): void {
    const count = parseInt(localStorage.getItem(this.PULSE_KEY) || '0', 10);
    if (count < this.MAX_PULSES) {
      this.showPulse = true;
      this.showTooltip = true;
      setTimeout(() => { this.showTooltip = false; }, 4000);
    }
  }

  private dismissPulse(): void {
    const count = parseInt(localStorage.getItem(this.PULSE_KEY) || '0', 10);
    localStorage.setItem(this.PULSE_KEY, String(count + 1));
    this.showPulse = false;
    this.showTooltip = false;
  }
}
```

- [ ] **Step 2: Create the component template**

```html
<!-- src/app/components/voice-input/voice-input.component.html -->

<!-- FAB Button — only in dynamic mode, hidden if browser doesn't support Speech API -->
<button
  *ngIf="isSupported && mealPlanMode === 'dynamic' && state === 'idle'"
  class="voice-fab"
  [class.pulse]="showPulse"
  (click)="startListening()">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
  <span class="tooltip" *ngIf="showTooltip">Dime qué quieres comer</span>
</button>

<!-- Overlay + Bottom Sheet -->
<div class="voice-overlay" *ngIf="state !== 'idle'" (click)="cancel()">
  <div class="voice-sheet" (click)="$event.stopPropagation()">

    <!-- Listening State -->
    <div class="sheet-content" *ngIf="state === 'listening'">
      <div class="wave-container">
        <div class="wave-circle wave-1" [style.transform]="'scale(' + (1 + volume * 0.6) + ')'"></div>
        <div class="wave-circle wave-2" [style.transform]="'scale(' + (1 + volume * 0.4) + ')'"></div>
        <div class="wave-circle wave-3" [style.transform]="'scale(' + (1 + volume * 0.2) + ')'"></div>
        <div class="wave-core">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
        </div>
      </div>
      <p class="sheet-label">Te escucho...</p>
      <p class="interim-text" *ngIf="interimTranscript">{{ interimTranscript }}</p>
      <button class="cancel-btn" (click)="cancel()">Cancelar</button>
    </div>

    <!-- Processing State -->
    <div class="sheet-content" *ngIf="state === 'processing'">
      <div class="wave-container processing">
        <div class="wave-core">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
        </div>
      </div>
      <p class="sheet-label">Entendido, buscando...</p>
      <p class="interim-text" *ngIf="interimTranscript">{{ interimTranscript }}</p>
    </div>

    <!-- Results State -->
    <div class="sheet-content" *ngIf="state === 'results' && result">
      <div class="results-list">
        <div
          class="result-item matched"
          *ngFor="let match of result.matches; let i = index"
          [style.animation-delay]="(i * 100) + 'ms'">
          <div class="result-check">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="result-info">
            <span class="result-name">{{ match.food?.alimento }}</span>
            <span class="result-category">{{ match.category }} · {{ match.portions || '?' }} {{ match.portions === 1 ? 'porción' : 'porciones' }}</span>
          </div>
        </div>

        <div
          class="result-item unmatched"
          *ngFor="let token of result.unmatched; let i = index"
          [style.animation-delay]="((result.matches.length + i) * 100) + 'ms'">
          <div class="result-x">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
            </svg>
          </div>
          <div class="result-info">
            <span class="result-name unmatched-name">"{{ token }}" no encontrado</span>
          </div>
        </div>
      </div>

      <button class="apply-btn" (click)="applyResults()">Aplicar cambios</button>
      <button class="cancel-link" (click)="cancel()">Cancelar</button>
    </div>

    <!-- Error State -->
    <div class="sheet-content" *ngIf="state === 'error'">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
        </svg>
      </div>
      <p class="sheet-label error-label">{{ errorMessage }}</p>
      <button class="retry-btn" (click)="retry()">Intentar de nuevo</button>
      <button class="cancel-link" (click)="cancel()">Cancelar</button>
    </div>

  </div>
</div>
```

- [ ] **Step 3: Create the component styles**

```css
/* src/app/components/voice-input/voice-input.component.css */

/* ===== FAB ===== */
.voice-fab {
  position: fixed;
  bottom: 28px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #c9a66b 0%, #8B7355 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(139, 115, 85, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 1000;
  -webkit-tap-highlight-color: transparent;
}

.voice-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 25px rgba(139, 115, 85, 0.45);
}

.voice-fab:active {
  transform: scale(0.95);
}

/* Breathing pulse */
.voice-fab.pulse::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #c9a66b 0%, #8B7355 100%);
  animation: breathing 2s ease-in-out infinite;
  z-index: -1;
}

@keyframes breathing {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.35); opacity: 0; }
}

/* Tooltip */
.tooltip {
  position: absolute;
  bottom: 64px;
  right: 0;
  background: #333;
  color: #fff;
  padding: 8px 14px;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  animation: tooltipFade 4s ease forwards;
  pointer-events: none;
}

.tooltip::after {
  content: '';
  position: absolute;
  bottom: -6px;
  right: 20px;
  width: 12px;
  height: 12px;
  background: #333;
  transform: rotate(45deg);
  border-radius: 2px;
}

@keyframes tooltipFade {
  0% { opacity: 0; transform: translateY(4px); }
  10% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

/* ===== OVERLAY ===== */
.voice-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: overlayIn 0.25s ease;
}

@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== BOTTOM SHEET ===== */
.voice-sheet {
  background: #fff;
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 480px;
  padding: 32px 24px;
  padding-bottom: max(32px, env(safe-area-inset-bottom));
  animation: sheetUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes sheetUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.sheet-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* ===== WAVE ANIMATION ===== */
.wave-container {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wave-circle {
  position: absolute;
  border-radius: 50%;
  transition: transform 0.08s ease-out;
}

.wave-1 {
  width: 120px;
  height: 120px;
  background: rgba(201, 166, 107, 0.08);
}

.wave-2 {
  width: 90px;
  height: 90px;
  background: rgba(201, 166, 107, 0.15);
}

.wave-3 {
  width: 65px;
  height: 65px;
  background: rgba(201, 166, 107, 0.22);
}

.wave-core {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c9a66b 0%, #8B7355 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

/* Processing: waves compress */
.wave-container.processing .wave-1,
.wave-container.processing .wave-2,
.wave-container.processing .wave-3 {
  animation: compress 0.4s ease forwards;
}

@keyframes compress {
  to { transform: scale(0.6); opacity: 0; }
}

.sheet-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: #444;
}

.interim-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  color: #999;
  font-style: italic;
  text-align: center;
  min-height: 20px;
}

/* ===== RESULTS ===== */
.results-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  animation: resultSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes resultSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-item.matched {
  background: #f5f9f5;
}

.result-item.unmatched {
  background: #f9f7f5;
}

.result-check {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8f5e9;
  color: #2e7d32;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.result-check svg {
  animation: checkDraw 0.4s ease 0.2s backwards;
}

@keyframes checkDraw {
  from { stroke-dashoffset: 30; stroke-dasharray: 30; }
  to { stroke-dashoffset: 0; stroke-dasharray: 30; }
}

.result-x {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0ebe5;
  color: #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-name {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.result-name.unmatched-name {
  font-weight: 400;
  color: #999;
  font-size: 0.85rem;
}

.result-category {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  color: #aaa;
}

/* ===== BUTTONS ===== */
.apply-btn {
  width: 100%;
  padding: 14px;
  margin-top: 8px;
  background: linear-gradient(135deg, #c9a66b 0%, #8B7355 100%);
  color: #fff;
  border: none;
  border-radius: 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.apply-btn:hover {
  opacity: 0.9;
}

.apply-btn:active {
  transform: scale(0.98);
}

.cancel-btn,
.retry-btn {
  padding: 10px 24px;
  background: #f0ebe5;
  color: #8B7355;
  border: none;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.cancel-btn:hover,
.retry-btn:hover {
  background: #e8e2da;
}

.cancel-link {
  background: none;
  border: none;
  color: #aaa;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 8px;
  -webkit-tap-highlight-color: transparent;
}

.cancel-link:hover {
  color: #888;
}

/* ===== ERROR ===== */
.error-icon {
  color: #ccc;
}

.error-label {
  text-align: center;
  color: #888 !important;
}
```

- [ ] **Step 4: Register component in app.module.ts**

Add import and declaration for `VoiceInputComponent` in `src/app/app.module.ts`:

```typescript
import { VoiceInputComponent } from './components/voice-input/voice-input.component';
```

Add `VoiceInputComponent` to the `declarations` array.

- [ ] **Step 5: Verify it compiles**

Run: `cd /Users/angelrivillo/Projects/foodhelper && npx ng build --configuration=development 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/app/components/voice-input/ src/app/app.module.ts
git commit -m "feat(voice): add VoiceInputComponent with FAB, bottom sheet, and animations"
```

---

## Chunk 4: Integration with MealCalculator

### Task 5: Wire voice input into meal-calculator

**Files:**
- Modify: `src/app/components/meal-calculator/meal-calculator.component.html:247-255`
- Modify: `src/app/components/meal-calculator/meal-calculator.component.ts:168-174`
- Modify: `src/app/components/meal-calculator/meal-calculator.component.css`

- [ ] **Step 1: Add voice-input component to meal-calculator template**

At the end of the dynamic plan `</div>` (after the menu-action-buttons, before the closing `</div>` and `</ng-container>`), add:

```html
<app-voice-input
  [mealType]="selectedMealType"
  [mealPlanMode]="mealPlanMode"
  [categories]="voiceCategories"
  [portionsMap]="voicePortionsMap"
  (apply)="onVoiceApply($event)">
</app-voice-input>
```

- [ ] **Step 2: Add onVoiceApply method to meal-calculator component**

In `src/app/components/meal-calculator/meal-calculator.component.ts`, add:

```typescript
import { MatchResult } from '../../models/voice.model';
```

And add this method alongside the existing `replaceFood`:

```typescript
// Property for template binding (Angular templates don't support .map())
get voiceCategories(): string[] {
  return this.macroCategories.map(c => c.key);
}

// Map category → target portions for the current meal type (used by voice result preview)
get voicePortionsMap(): { [category: string]: number } {
  const map: { [category: string]: number } = {};
  for (const cat of this.macroCategories) {
    map[cat.key] = this.getTargetValue(cat.key);
  }
  return map;
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
```

Then in the template, add the highlight class to the category card elements using:
```html
[class.voice-replaced]="voiceReplacedCategories.has(category.key)"
```

- [ ] **Step 3: Add highlight flash CSS for replaced items**

In `src/app/components/meal-calculator/meal-calculator.component.css`, add:

```css
/* Voice replacement highlight */
@keyframes voiceHighlight {
  0% { background-color: rgba(201, 166, 107, 0.25); }
  100% { background-color: transparent; }
}

.voice-replaced {
  animation: voiceHighlight 1.5s ease;
}
```

- [ ] **Step 4: Verify the full app compiles and serves**

Run: `cd /Users/angelrivillo/Projects/foodhelper && npx ng serve --open 2>&1 | head -20`
Expected: App compiles and opens in browser. FAB visible on plan screen.

- [ ] **Step 5: Manual smoke test**

1. Open app in Chrome
2. Verify FAB appears in bottom-right corner
3. Verify pulse animation and tooltip on first visits
4. Click FAB → bottom sheet opens
5. Allow microphone → wave animation responds to sound
6. Say "arroz y pollo" → results appear
7. Click "Aplicar cambios" → foods replace in menu
8. Verify "cancel" and "tap outside" both close the sheet

- [ ] **Step 6: Commit**

```bash
git add src/app/components/meal-calculator/ src/app/models/voice.model.ts
git commit -m "feat(voice): integrate voice input with meal calculator"
```

---

## Chunk 5: Polish & Edge Cases

### Task 6: Final polish

**Files:**
- Modify: `src/app/components/voice-input/voice-input.component.ts`
- Modify: `src/app/services/food-matcher.service.ts`

- [ ] **Step 1: Ensure the FAB doesn't overlap content**

Add bottom padding to the meal-calculator content area so the FAB doesn't cover the last items:

In `src/app/components/meal-calculator/meal-calculator.component.css`, add:

```css
/* Padding for voice FAB */
.dynamic-plan-view {
  padding-bottom: 80px;
}
```

- [ ] **Step 2: Test edge cases manually**

1. Say nothing (silence) → should show "No te escuché"
2. Say gibberish → should show "No encontré alimentos"
3. Say one food only → should match and replace only that category
4. Say a food not available for current meal type → should not match
5. Deny microphone permission → should show permission error

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(voice): polish matching and edge cases"
```
