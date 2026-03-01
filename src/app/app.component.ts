import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'foodhelper';
  selectedProfile = 'Angel';
  currentSection = 'plan'; // 'plan' o 'config'
  profiles = ['Angel', 'Ferchu', 'Jose Daniel'];
  showProfileMenu = false;

  private profileSlugMap: { [slug: string]: string } = {
    'angel': 'Angel',
    'ferchu': 'Ferchu',
    'jose-daniel': 'Jose Daniel'
  };

  private slugProfileMap: { [profile: string]: string } = {
    'Angel': 'angel',
    'Ferchu': 'ferchu',
    'Jose Daniel': 'jose-daniel'
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const slug = event.urlAfterRedirects.split('/').filter(s => s)[0];
      const profile = this.profileSlugMap[slug];
      if (profile && profile !== this.selectedProfile) {
        this.selectedProfile = profile;
      }
    });
  }

  onSectionSelected(section: string) {
    this.currentSection = section;
    this.showProfileMenu = false;
  }

  onProfileSelected(profile: string) {
    this.selectedProfile = profile;
    this.showProfileMenu = false;
    const slug = this.slugProfileMap[profile];
    if (slug) {
      this.router.navigate(['/' + slug]);
    }
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }
}
