import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  deleteDoc, 
  docData,
  DocumentData 
} from '@angular/fire/firestore';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

interface Review {
  id?: string;
  carId: string;
  comment: string;
  rating: number;
  userId: string;
  userName?: string;
  createdAt: any;
}

interface User {
  displayName: string;
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reviews.html',
  styleUrls: ['./admin-reviews.scss']
})
export class AdminReviews {
  private router = inject(Router);
  private firestore = inject(Firestore);

  reviews$: Observable<(Review & { userData?: User | null })[]> = collectionData(
    collection(this.firestore, 'reviews'),
    { idField: 'id' }
  ).pipe(
    switchMap((reviews: DocumentData[]) => {
      if (reviews.length === 0) {
        return of([] as (Review & { userData?: User | null })[]);
      }
      
      const reviewList = reviews as Review[];
      const enriched = reviewList.map((review: Review) => 
        docData(doc(this.firestore, 'Users', review.userId)).pipe(
          map((user: DocumentData | undefined) => ({ 
            ...review, 
            userData: user ? (user as User) : null 
          })),
          catchError(() => of({ ...review, userData: null }))
        )
      );
      return combineLatest(enriched);
    })
  );

  goToDashboard() {
    this.router.navigate(['/admin']);
  }

  async deleteReview(reviewId: string) {
    if (!confirm('Delete this review?')) return;
    await deleteDoc(doc(this.firestore, 'reviews', reviewId));
    alert('Review deleted');
  }
}