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
  @Input() portionsMap: { [category: string]: number } = {};
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

  startListening(): void {
    this.state = 'listening';
    this.interimTranscript = '';
    this.result = null;
    this.errorMessage = '';
    this.dismissPulse();

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    this.subscription = this.speechService.startListening().subscribe(event => {
      this.handleSpeechEvent(event);
    });
  }

  cancel(): void {
    this.speechService.stopListening();
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.state = 'idle';
    this.volume = 0;
  }

  applyResults(): void {
    if (this.result && this.result.matches.length > 0) {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      this.apply.emit(this.result.matches);
    }
    this.state = 'idle';
  }

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
        this.cdr.detectChanges();
        break;

      case 'interim':
        this.interimTranscript = event.transcript ?? '';
        break;

      case 'result':
        this.state = 'processing';
        this.interimTranscript = event.transcript ?? '';
        setTimeout(() => {
          this.processTranscript(event.transcript ?? '');
        }, 400);
        break;

      case 'error':
        this.handleError(event.error ?? 'unknown');
        break;

      case 'end':
        if (this.state === 'listening') {
          this.errorMessage = 'No te escuch\u00e9, intenta de nuevo';
          this.state = 'error';
        }
        break;
    }
  }

  private processTranscript(transcript: string): void {
    this.result = this.foodMatcher.match(transcript, this.mealType, this.categories);

    for (const match of this.result.matches) {
      if (match.category && this.portionsMap[match.category]) {
        match.portions = this.portionsMap[match.category];
      }
    }

    if (this.result.matches.length === 0) {
      this.errorMessage = 'No encontr\u00e9 alimentos en lo que dijiste';
      this.state = 'error';
    } else {
      this.state = 'results';
    }
  }

  private handleError(error: string): void {
    switch (error) {
      case 'not-supported':
        break;
      case 'permission-denied':
      case 'not-allowed':
        this.errorMessage = 'Necesito acceso al micr\u00f3fono para escucharte';
        break;
      case 'network':
        this.errorMessage = 'Sin conexi\u00f3n para reconocimiento de voz';
        break;
      case 'no-speech':
        this.errorMessage = 'No te escuch\u00e9, intenta de nuevo';
        break;
      default:
        this.errorMessage = 'Algo sali\u00f3 mal, intenta de nuevo';
    }
    this.state = 'error';
  }

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
