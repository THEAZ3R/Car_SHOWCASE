import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private firestore: Firestore) {}

  addReview(carId: string, userId: string, text: string) {
    return addDoc(collection(this.firestore, 'reviews'), {
      carId,
      userId,
      text,
      createdAt: new Date()
    });
  }
}
