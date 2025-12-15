import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private auth = inject(Auth);
  private db   = inject(Firestore);

  // Live auth state
  user$ = user(this.auth);

  // Profile (null when logged out)
  profile$ = this.user$.pipe(
    switchMap(u => (u ? docData(doc(this.db, 'Users', u.uid)) : of(null)))
  );

  // UID string or undefined
  uid$ = this.user$.pipe(switchMap(u => of(u?.uid)));

  // Admin boolean
  isAdmin$ = this.profile$.pipe(switchMap(p => of(p?.['role'] === 'admin')));
}