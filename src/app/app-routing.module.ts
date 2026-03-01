import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/angel', pathMatch: 'full' },
  { path: 'angel', children: [] },
  { path: 'ferchu', children: [] },
  { path: 'jose-daniel', children: [] },
  { path: '**', redirectTo: '/angel' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
