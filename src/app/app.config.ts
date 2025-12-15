// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

// AngularFire modern modular providers
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';

// IMPORTANT: Replace these with your Firebase project's config
const firebaseConfig = {
  apiKey: "AIzaSyBZrBgsr7rMu6hk5PR9fwBTXr3pU-7Radg",
  authDomain: "carshowcase-d502d.firebaseapp.com",
  projectId: "carshowcase-d502d",
  storageBucket: "carshowcase-d502d.appspot.com",
  messagingSenderId: "754765987766",
  appId: "1:754765987766:web:1c50cbd543edf7de700b17",
  measurementId: "G-7NEDK4MEFY"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),

    // Firebase
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ]
};
