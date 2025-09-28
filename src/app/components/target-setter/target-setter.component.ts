import { Component, OnInit, Input } from '@angular/core';
import { FoodCalculatorService } from '../../services/food-calculator.service';
import { ProfileConfigService } from '../../services/profile-config.service';
import { DailyTarget } from '../../models/food.model';

@Component({
  selector: 'app-target-setter',
  templateUrl: './target-setter.component.html',
  styleUrls: ['./target-setter.component.css']
})
export class TargetSetterComponent implements OnInit {
  @Input() currentProfile: string = 'Angel';
  
  targets: DailyTarget = {
    'Carbohidratos': 3,
    'Legumbres': 1,
    'Proteina Magra': 2,
    'Proteina Semi-Magra': 1,
    'Lácteos': 2,
    'Grasas': 2,
    'Frutas': 3
  };

  macroCategories = [
    { key: 'Carbohidratos', label: 'Carbohidratos', icon: '🍞', color: '#FF6B6B' },
    // { key: 'Legumbres', label: 'Legumbres', icon: '🫘', color: '#8B4513' },
    { key: 'Proteina Magra', label: 'Proteína Magra', icon: '🥩', color: '#4ECDC4' },
    { key: 'Proteina Semi-Magra', label: 'Proteína Semi-Magra', icon: '🐟', color: '#2ECC71' },
    { key: 'Lácteos', label: 'Lácteos', icon: '🥛', color: '#3498DB' },
    { key: 'Grasas', label: 'Grasas', icon: '🥑', color: '#45B7D1' },
    { key: 'Frutas', label: 'Frutas', icon: '🍓', color: '#FECA57' }
  ];

  constructor(
    private foodCalculatorService: FoodCalculatorService,
    private profileConfigService: ProfileConfigService
  ) {}

  ngOnInit(): void {
    this.loadProfileDailyTarget();
    
    // Suscribirse a cambios en el perfil
    this.profileConfigService.dailyTarget$.subscribe(() => {
      this.loadProfileDailyTarget();
    });
  }

  private loadProfileDailyTarget(): void {
    const profileDailyTarget = this.profileConfigService.getDailyTarget(this.currentProfile);
    if (Object.keys(profileDailyTarget).length > 0) {
      this.targets = { ...this.targets, ...profileDailyTarget } as DailyTarget;
    }
  }

  updateTarget(category: string, value: number): void {
    this.targets[category as keyof DailyTarget] = Math.max(0, value);
    
    // Guardar en el servicio de daily targets por perfil
    this.profileConfigService.updateDailyTarget(this.currentProfile, category, value);
    
    // También actualizar el servicio de calculadora para el plan actual
    this.foodCalculatorService.setDailyTarget(this.targets);
  }

  incrementTarget(category: string): void {
    const currentValue = this.targets[category as keyof DailyTarget];
    this.updateTarget(category, currentValue + 1);
  }

  decrementTarget(category: string): void {
    const currentValue = this.targets[category as keyof DailyTarget];
    this.updateTarget(category, currentValue - 1);
  }

  getTargetValue(category: string): number {
    return this.targets[category as keyof DailyTarget];
  }

  isTargetDisabled(category: string): boolean {
    return this.targets[category as keyof DailyTarget] <= 0;
  }

  getTargetPlural(category: string): string {
    return this.targets[category as keyof DailyTarget] !== 1 ? 'es' : '';
  }

  onInputChange(category: string, event: any): void {
    const value = +event.target.value;
    this.updateTarget(category, value);
  }
}
