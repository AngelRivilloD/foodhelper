import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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

@NgModule({
  declarations: [
    AppComponent,
    TargetSetterComponent,
    MealCalculatorComponent,
    HamburgerMenuComponent,
    ProfileSelectorComponent,
    VoiceInputComponent,
    DailyProgressComponent,
    CelebrationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
