import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  Firestore, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  orderBy 
} from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';

interface Car {
  id?: string;
  name: string;
  manufacturer: string;
  year: number;
  colour: string;
  modelFileName?: string | null;
}

interface Review {
  id?: string;
  carId: string;
  userId: string;
  userName: string;
  comment: string;
  rating: number;
  createdAT: any;
}

@Component({
  selector: 'app-car-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review.html',
  styleUrls: ['./review.scss']
})
export class CarReviewsComponent implements OnInit {
  car: Car | null = null;
  reviews: Review[] = [];
  currentUser: User | null = null;
  
  newComment: string = '';
  newRating: number = 5;
  
  isLoading = true;
  error: string | null = null;
  submitting = false;

  private db = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  async ngOnInit(): Promise<void> {
    this.currentUser = this.auth.currentUser;
    
    const carId = this.route.snapshot.paramMap.get('id');
    if (!carId) {
      this.error = 'No car ID provided';
      this.isLoading = false;
      return;
    }

    await this.loadCar(carId);
    await this.loadReviews(carId);
    
    this.isLoading = false;
  }

  private async loadCar(carId: string): Promise<void> {
    try {
      const docRef = doc(this.db, 'car', carId);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        this.car = { id: snap.id, ...(snap.data() as Car) };
        console.log('✅ Car loaded:', this.car);
      } else {
        this.error = 'Car not found';
      }
    } catch (err) {
      console.error(err);
      this.error = 'Failed to load car';
    }
  }

  private async loadReviews(carId: string): Promise<void> {
    try {
      console.log('🔍 Loading reviews for carId:', carId);
      const reviewsRef = collection(this.db, 'reviews');
      
      // First try with orderBy
      let snapshot;
      try {
        const q = query(
          reviewsRef, 
          where('carId', '==', carId),
          orderBy('createdAT', 'desc')
        );
        snapshot = await getDocs(q);
      } catch (indexError) {
        // If index doesn't exist, try without orderBy
        console.warn('⚠️ Index not found, loading without ordering:', indexError);
        const q = query(reviewsRef, where('carId', '==', carId));
        snapshot = await getDocs(q);
      }
      
      this.reviews = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📝 Review doc:', doc.id, data);
        return { 
          id: doc.id, 
          ...data 
        } as Review;
      });
      
      console.log('✅ Reviews loaded:', this.reviews.length, 'reviews found');
      
      if (this.reviews.length === 0) {
        console.log('⚠️ No reviews found. Checking all reviews in collection...');
        const allSnapshot = await getDocs(collection(this.db, 'reviews'));
        console.log('Total reviews in collection:', allSnapshot.size);
        allSnapshot.forEach(doc => {
          console.log('Review:', doc.id, 'carId:', doc.data()['carId']);
        });
      }
    } catch (err) {
      console.error('❌ Error loading reviews:', err);
    }
  }

  async submitReview(): Promise<void> {
    if (!this.currentUser || !this.car || !this.newComment.trim()) {
      return;
    }

    this.submitting = true;

    const review: Review = {
      carId: this.car.id!,
      userId: this.currentUser.uid,
      userName: this.currentUser.displayName || 'Anonymous',
      comment: this.newComment.trim(),
      rating: this.newRating,
      createdAT: serverTimestamp()
    };

    try {
      await addDoc(collection(this.db, 'reviews'), review);
      console.log('✅ Review submitted');
      
      this.newComment = '';
      this.newRating = 5;
      
      await this.loadReviews(this.car.id!);
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      this.submitting = false;
    }
  }

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(0).map((_, i) => i < rating);
  }

  goBack(): void {
    this.router.navigate(['/car']);
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/']);
  }
}