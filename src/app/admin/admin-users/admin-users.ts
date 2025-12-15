import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  deleteDoc,
  DocumentData 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface User {
  id?: string;
  displayName: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.scss']
})
export class AdminUsers {
  private router = inject(Router);
  private firestore = inject(Firestore);

  users$: Observable<User[]> = collectionData(
    collection(this.firestore, 'Users'),
    { idField: 'id' }
  ).pipe(
    map(users => users as User[])
  );

  goToDashboard() {
    this.router.navigate(['/admin']);
  }

  async deleteUser(userId: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await deleteDoc(doc(this.firestore, 'Users', userId));
    alert('User deleted');
  }
}