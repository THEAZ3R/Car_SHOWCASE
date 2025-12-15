  import { Component, inject, ViewChild, ElementRef } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { Router } from '@angular/router';
  import { Firestore, collection, collectionData, doc, setDoc, deleteDoc } from '@angular/fire/firestore';
  import { Observable } from 'rxjs';
  import { v4 as uuid } from 'uuid';

  interface Car {
    id?: string;
    name: string;
    manufacturer: string;
    year: number;
    colour: string;
    modelFileName?: string | null; // ← only store filename, not URL
  }

  @Component({
    selector: 'app-admin-cars',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-cars.html',
    styleUrls: ['./admin-cars.scss']
  })
  export class AdminCars {
    @ViewChild('formSection', { static: true }) formSection!: ElementRef;
    
    private router = inject(Router);
    private firestore = inject(Firestore);

    cars$: Observable<Car[]> = collectionData(
      collection(this.firestore, 'car'),
      { idField: 'id' }
    ) as Observable<Car[]>;

    form: Car = { name: '', manufacturer: '', year: 2025, colour: '#ff0000', modelFileName: null };
    isEditing = false;
    editId = '';
    selectedFileName = '';

    goToDashboard() {
      this.router.navigate(['/admin']);
    }

    onFileSelected(event: Event) {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (!file.name.match(/\.(glb|gltf)$/)) {
        alert('Only .glb or .gltf files allowed');
        return;
      }
      // Just store the filename locally
      this.selectedFileName = file.name;
      this.form.modelFileName = `assets/models/${file.name}`; // ← Fixed path
      alert('Model selected: ' + file.name);
    }

    canSave(): boolean {
      return !!this.form.name && !!this.form.manufacturer && !!this.form.year;
    }

    async saveCar() {
      if (!this.canSave()) return;

      const carId = this.isEditing ? this.editId : uuid();
      await setDoc(doc(this.firestore, 'car', carId), {
        ...this.form,
        updatedAt: new Date()
      });

      this.resetForm();
      alert('Car saved!');
    }

    editCar(car: Car) {
      this.form = { ...car };
      this.isEditing = true;
      this.editId = car.id!;
      this.selectedFileName = car.modelFileName?.split('/').pop() || '';
      this.formSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async deleteCar(carId: string) {
      if (!confirm('Delete this car?')) return;
      await deleteDoc(doc(this.firestore, 'car', carId));
      alert('Car deleted');
    }

    resetForm() {
      this.form = { name: '', manufacturer: '', year: 2025, colour: '#ff0000', modelFileName: null };
      this.isEditing = false;
      this.editId = '';
      this.selectedFileName = '';
    }
  }