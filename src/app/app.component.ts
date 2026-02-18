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
  profiles = ['Angel', 'Ferchu'];

  onSectionSelected(section: string) {
    this.currentSection = section;
    console.log('Sección seleccionada:', section);
  }

  onProfileSelected(profile: string) {
    this.selectedProfile = profile;
    console.log('Perfil seleccionado:', profile);
  }

  toggleProfile() {
    const currentIndex = this.profiles.indexOf(this.selectedProfile);
    this.selectedProfile = this.profiles[(currentIndex + 1) % this.profiles.length];
    console.log('Perfil seleccionado:', this.selectedProfile);
  }
}
