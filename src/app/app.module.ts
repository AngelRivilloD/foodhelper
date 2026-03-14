import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TargetSetterComponent } from './components/target-setter/target-setter.component';
import { MealCalculatorComponent } from './components/meal-calculator/meal-calculator.component';
import { HamburgerMenuComponent } from './components/hamburger-menu/hamburger-menu.component';
import { ProfileSelectorComponent } from './components/profile-selector/profile-selector.component';
import { VoiceInputComponent } from './components/voice-input/voice-input.component';
import { DailyProgressComponent } from './components/daily-progress/daily-progress.component';
import { CelebrationComponent } from './components/celebration/celebration.component';
import { AddFoodModalComponent } from './components/add-food-modal/add-food-modal.component';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';

@NgModule({
  declarations: [
    AppComponent,
    TargetSetterComponent,
    MealCalculatorComponent,
    HamburgerMenuComponent,
    ProfileSelectorComponent,
    VoiceInputComponent,
    DailyProgressComponent,
    CelebrationComponent,
    AddFoodModalComponent,
    SplashScreenComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
