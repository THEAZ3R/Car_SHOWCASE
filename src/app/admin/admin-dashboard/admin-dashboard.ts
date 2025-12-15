import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
   templateUrl: './admin-dashboard.html',   // ← was .scss
  styleUrls: ['./admin-dashboard.scss'] 
})
export class AdminDashboard implements OnInit {
  private auth = inject(Auth);
  private db   = inject(Firestore);
  private router = inject(Router);

  user$: Observable<any> = user(this.auth);
  displayName = '';

  ngOnInit(): void {
    this.user$.subscribe(u => {
      if (u) {
        docData(doc(this.db, 'Users', u.uid)).subscribe(profile => {
          this.displayName = profile?.['displayName'] ?? 'Admin';
        });
      }
    });
  }

  nav(path: string): void {
    this.router.navigate(['admin', path]);
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/']);
  }
}