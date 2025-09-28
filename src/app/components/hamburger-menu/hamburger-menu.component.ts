import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-hamburger-menu',
  templateUrl: './hamburger-menu.component.html',
  styleUrls: ['./hamburger-menu.component.css']
})
export class HamburgerMenuComponent {
  @Output() sectionSelected = new EventEmitter<string>();
  
  isMenuOpen = false;
  selectedSection = '';

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  selectOption(section: string) {
    this.selectedSection = section;
    this.sectionSelected.emit(section);
    this.isMenuOpen = false;
  }

  get displayText() {
    const sections = {
      'plan': 'Plan de Comidas',
      'config': 'Configurar porciones'
    };
    return sections[this.selectedSection as keyof typeof sections] || 'Seleccionar Sección';
  }
}
