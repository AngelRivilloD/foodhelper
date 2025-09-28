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

  onSectionSelected(section: string) {
    this.currentSection = section;
    console.log('Sección seleccionada:', section);
  }

  onProfileSelected(profile: string) {
    this.selectedProfile = profile;
    console.log('Perfil seleccionado:', profile);
  }
}
