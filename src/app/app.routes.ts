import { Routes } from '@angular/router';


import { AdminReviews } from './admin/admin-reviews/admin-reviews';
import { AdminUsers } from './admin/admin-users/admin-users';

import { AdminDashboard } from './admin/admin-dashboard/admin-dashboard';
import { LoginPage } from './login/login';
import { HomePage } from './pages/home/home';
import {  CarShowcaseComponent } from './pages/car-details/car-details';
import { AdminCars } from './admin/admin-cars/admin-cars';
import { SignupPage } from './signup/signup';
import { CarReviewsComponent } from './review/review';
export const appRoutes: Routes = [
  { path: '', component: HomePage },
  { path: 'login', component: LoginPage },
  {path:'signup', component: SignupPage},
  { path: 'car/:id', component:CarShowcaseComponent   },
  { path: 'review/:id', component:CarReviewsComponent  },

  // Admin area
  { path: 'admin',          component: AdminDashboard },   // welcome screen
  { path: 'admin/cars',     component: AdminCars },
  { path: 'admin/users',    component: AdminUsers },
  { path: 'admin/reviews',  component: AdminReviews },

  { path: '**', redirectTo: '' }
];