import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { MOTIVATIONAL_MESSAGES, MEAL_GENDER } from '../../models/daily-progress.model';

@Component({
  selector: 'app-celebration',
  templateUrl: './celebration.component.html',
  styleUrls: ['./celebration.component.css']
})
export class CelebrationComponent implements OnInit, OnDestroy {
  @Input() mealType: string = '';
  @Input() mealLabel: string = '';
  @Input() streakCount: number = 1;
  @Input() progressPercent: number = 0;
  @Input() totalCalories: number = 0;
  @Input() confirmedMealCount: number = 1;
  @Output() dismiss = new EventEmitter<void>();

  message = '';
  confirmText = '';
  countdown = 5;
  countdownProgress = 0;
  confettiParticles: { left: number; delay: number; color: string; size: number; rotation: number }[] = [];

  private confettiColors = ['#FF6B6B', '#FECA57', '#4ECDC4', '#3498DB', '#b68f5e', '#34c759', '#FF9FF3'];
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.message = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

    const gender = MEAL_GENDER[this.mealType];
    this.confirmText = gender === 'femenino'
      ? `¡${this.mealLabel} confirmada!`
      : `¡${this.mealLabel} confirmado!`;

    this.generateConfetti();
    this.playSound();
    this.vibrate();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  private startCountdown(): void {
    // Start fill animation immediately (CSS transition handles the 5s fill)
    setTimeout(() => { this.countdownProgress = 100; }, 50);
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.dismiss.emit();
      }
    }, 1000);
  }

  getMealCountText(): string {
    const ordinals: Record<number, string> = { 1: '1ª', 2: '2ª', 3: '3ª', 4: '4ª' };
    const ord = ordinals[this.confirmedMealCount] || this.confirmedMealCount + 'ª';
    return `🔥 ${ord} comida del día registrada`;
  }

  onContinueClick(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.dismiss.emit();
  }

  private generateConfetti(): void {
    this.confettiParticles = Array.from({ length: 30 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
    }));
  }

  private playSound(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  private vibrate(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }

  onOverlayClick(): void {
    this.dismiss.emit();
  }
}
