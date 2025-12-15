import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, deleteDoc, query, where, orderBy } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { Auth } from '@angular/fire/auth';

export interface Car {
  id?: string;
  name: string;
  description: string;
  modelUrl: string;
  imageUrl?: string;
  year?: number;
  price?: number;
  ownerId: string;
  createdAt: Date;
  approved: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private storage = inject(Storage);
  private carsCollection = collection(this.firestore, 'cars');

  // Upload 3D model to Firebase Storage
  async uploadModel(file: File): Promise<string> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const filePath = `car-models/${userId}_${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);
    
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  // Add car to Firestore
  async addCar(carData: { name: string; description: string; modelUrl: string }): Promise<void> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    await addDoc(this.carsCollection, {
      ...carData,
      ownerId: userId,
      createdAt: new Date(),
      approved: false
    });
  }

  
  getApprovedCars(): Observable<Car[]> {
    const carsQuery = query(
      this.carsCollection, 
      where('approved', '==', true),
      orderBy('createdAt', 'desc')
    );
    return collectionData(carsQuery, { idField: 'id' }) as Observable<Car[]>;
  }

  
  getCar(id: string): Observable<Car> {
    const carDoc = doc(this.firestore, `cars/${id}`);
    return docData(carDoc, { idField: 'id' }) as Observable<Car>;
  }

  
  async approveCar(carId: string): Promise<void> {
    await updateDoc(doc(this.firestore, `cars/${carId}`), { approved: true });
  }

  async deleteCar(carId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `cars/${carId}`));
  }
}