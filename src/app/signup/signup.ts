import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import {
  createUserWithEmailAndPassword,
  Auth,
  UserCredential
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc
} from '@angular/fire/firestore';
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss']
})
export class SignupPage implements AfterViewInit, OnDestroy {
  @ViewChild('spaceCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  private router = inject(Router);
  private auth   = inject(Auth);      // ← add this
  private db     = inject(Firestore); 
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private planets: THREE.Mesh[] = [];
  private stars!: THREE.Points;
  private moon!: THREE.Mesh;
  private moonGroup!: THREE.Group;
  private animationId?: number;

  // registration fields
  email = '';
  password = '';
  confirmPassword = '';
  displayName = '';
  isLoading = false;

  ngAfterViewInit() {
    this.initScene();
    this.animate();
  }

  /* ------------------------------------------------------------------ */
  /* Three.js scene – identical to login.ts                             */
  /* ------------------------------------------------------------------ */
  private initScene() {
    const canvas = this.canvas.nativeElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070a12);

    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
    this.camera.position.set(0, 5, 18);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const moonLight = new THREE.DirectionalLight(0xccccff, 1.5);
    moonLight.position.set(0, 30, -30);
    this.scene.add(moonLight);
    this.scene.add(new THREE.AmbientLight(0x1a2a4a, 0.2));

    this.createMoon();
    this.createPlanets();
    this.createStars();

    window.addEventListener('resize', () => this.onResize());
  }

  private createMoon() {
    this.moonGroup = new THREE.Group();
    const moonGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.moon = new THREE.Mesh(moonGeo, moonMat);
    this.moonGroup.add(this.moon);

    const haloGeo = new THREE.SphereGeometry(5, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.BackSide
    });
    this.moon.add(new THREE.Mesh(haloGeo, haloMat));

    const glowLayers = [
      { size: 4.2, opacity: 0.4, color: 0xfff8dc },
      { size: 5.5, opacity: 0.2, color: 0xaaccff },
      { size: 7, opacity: 0.1, color: 0x7799ff }
    ];
    glowLayers.forEach(layer => {
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(layer.size, 32, 32),
        new THREE.MeshBasicMaterial({
          color: layer.color, transparent: true, opacity: layer.opacity, side: THREE.BackSide
        })
      );
      this.moon.add(glow);
    });
    this.scene.add(this.moonGroup);
  }

  private createPlanets() {
    const planetData: Array<{ color: number; size: number; position: [number, number, number]; emissive: number }> = [
      { color: 0x4169E1, size: 1.2, position: [-12, -8, -45], emissive: 0x112244 },
      { color: 0x9370DB, size: 0.9, position: [15, 12, -50], emissive: 0x221133 },
      { color: 0x00CED1, size: 0.6, position: [-6, 15, -55], emissive: 0x003333 }
    ];
    planetData.forEach(data => {
      const geometry = new THREE.SphereGeometry(data.size, 32, 32);
      const material = new THREE.MeshLambertMaterial({
        color: data.color, emissive: data.emissive, emissiveIntensity: 0.08
      });
      const planet = new THREE.Mesh(geometry, material);
      planet.position.set(...data.position);
      this.planets.push(planet);
      this.scene.add(planet);
    });
  }

  private createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.5, transparent: true, opacity: 1,
      sizeAttenuation: true, blending: THREE.AdditiveBlending
    });
    const starVertices: number[] = [];
    for (let i = 0; i < 20000; i++) {
      starVertices.push(
        THREE.MathUtils.randFloatSpread(4000),
        THREE.MathUtils.randFloatSpread(4000),
        THREE.MathUtils.randFloatSpread(4000)
      );
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    const time = Date.now() * 0.0002;
    this.moonGroup.position.set(Math.sin(time) * 50, 30, -40);
    this.moonGroup.scale.setScalar(1 + Math.sin(time * 3) * 0.05);

    this.planets.forEach((planet, index) => { planet.rotation.y += 0.001 * (index + 1); });
    (this.stars.material as THREE.PointsMaterial).opacity = 0.7 + Math.sin(time * 3) * 0.3;
    this.stars.rotation.y += 0.00005;

    this.camera.position.x = Math.sin(time * 0.1) * 2;
    this.camera.position.y = 5 + Math.cos(time * 0.05) * 1;
    this.camera.lookAt(0, 10, 0);
    this.renderer.render(this.scene, this.camera);
  }

  private onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /* ------------------------------------------------------------------ */
  /* UI helpers                                                         */
  /* ------------------------------------------------------------------ */
  async onSignup() {
  if (!this.email || !this.password || !this.confirmPassword || !this.displayName) {
    alert('Please fill all fields');
    return;
  }
  if (this.password !== this.confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  if (this.password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  this.isLoading = true;
  try {
    // 1. Create Firebase Auth account
    const cred: UserCredential = await createUserWithEmailAndPassword(
      this.auth,
      this.email,
      this.password
    );

    // 2. Create Firestore user doc with default role "user"
    await setDoc(doc(this.db, 'Users', cred.user.uid), {
      displayName: this.displayName,
      email: this.email,
      role: 'user', // ← every new signup gets this
      createdAt: new Date()
    });

    // 3. Redirect to login (or directly to car-details if you want auto-login)
    this.router.navigate(['/login']);
  } catch (err: any) {
    console.error('Signup failed:', err);
    alert(err.message ?? 'Signup failed');
  } finally {
    this.isLoading = false;
  }
}

  goToLogin() { this.router.navigate(['/login']); }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.renderer?.dispose();
    window.removeEventListener('resize', () => this.onResize());
  }
}