import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';

import { AppComponent } from './app.component';
import { TargetSetterComponent } from './components/target-setter/target-setter.component';
import { MealCalculatorComponent } from './components/meal-calculator/meal-calculator.component';
import { HamburgerMenuComponent } from './components/hamburger-menu/hamburger-menu.component';
import { ProfileSelectorComponent } from './components/profile-selector/profile-selector.component';

@NgModule({
  declarations: [
    AppComponent,
    TargetSetterComponent,
    MealCalculatorComponent,
    HamburgerMenuComponent,
    ProfileSelectorComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
