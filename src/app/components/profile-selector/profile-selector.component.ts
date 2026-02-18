import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-profile-selector',
  templateUrl: './profile-selector.component.html',
  styleUrls: ['./profile-selector.component.css']
})
export class ProfileSelectorComponent {
  @Output() profileSelected = new EventEmitter<string>();
  
  selectedProfile = 'Angel';
  profiles = [
    { value: 'Angel', label: 'Angel' },
    { value: 'Ferchu', label: 'Ferchu' },
    { value: 'Jose Daniel', label: 'Jose Daniel' }
  ];

  onProfileChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const profile = target.value;
    this.selectedProfile = profile;
    this.profileSelected.emit(profile);
  }
}
