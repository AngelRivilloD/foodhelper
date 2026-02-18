import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'foodhelper';
  selectedProfile = 'Angel';
  currentSection = 'plan'; // 'plan' o 'config'
  profiles = ['Angel', 'Ferchu', 'Jose Daniel'];
  showProfileMenu = false;

  onSectionSelected(section: string) {
    this.currentSection = section;
    this.showProfileMenu = false;
  }

  onProfileSelected(profile: string) {
    this.selectedProfile = profile;
    this.showProfileMenu = false;
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }
}
