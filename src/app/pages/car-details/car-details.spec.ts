import { Component, OnDestroy, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, collection, doc, getDoc, getDocs, addDoc, query, where, orderBy } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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
  user: string;
  score: number;
  comment: string;
}

@Component({
  selector: 'app-car-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './car-details.html',
  styleUrls: ['./car-details.scss']
})
export class CarDetailsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  cars: Car[] = [];
  car: Car | null = null;
  isLoading = true;
  error: string | null = null;
  hasModel = false;

  reviews: Review[] = [];
  newReviewScore = 5;
  newReviewComment = '';

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private frameId = 0;

  private db = inject(Firestore);
  private auth = inject(Auth);
  public router = inject(Router);
  private route = inject(ActivatedRoute);

  async ngAfterViewInit(): Promise<void> {
    await this.loadCars();

    const carId = this.route.snapshot.paramMap.get('id') || (this.cars.length ? this.cars[0].id : null);
    if (!carId) {
      this.error = 'No car selected';
      this.isLoading = false;
      return;
    }

    await this.selectCar(this.cars.find(c => c.id === carId)!);
    this.initThree();
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId);
    this.renderer?.dispose();
    window.removeEventListener('resize', () => this.resize());
  }

  async loadCars(): Promise<void> {
    try {
      const snap = await getDocs(collection(this.db, 'car'));
      this.cars = snap.docs.map((d) => ({ ...(d.data() as Car), id: d.id }));
      console.log('Loaded cars:', this.cars);
    } catch (err) {
      console.error('Error loading cars:', err);
      this.error = 'Failed to load cars';
    }
  }

  async selectCar(selectedCar: Car): Promise<void> {
    if (!selectedCar) return;
    this.car = selectedCar;
    this.hasModel = !!selectedCar.modelFileName;
    await this.loadReviews();
    if (this.hasModel) this.loadModel();
  }

  onCarChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const index = select.selectedIndex;
    this.selectCar(this.cars[index]);
  }

  private initThree(): void {
    if (!this.canvasRef?.nativeElement) return;

    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.background = new THREE.Color(0x111111);

    this.camera.position.set(6, 3, 8);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(10, 10, 10);
    dir.castShadow = true;
    this.scene.add(dir);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.target.set(0, 0, 0);

    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.animate();
  }

  private loadModel(): void {
    if (!this.car?.modelFileName) return;

    const loader = new GLTFLoader();
    const modelPath = this.car.modelFileName.startsWith('assets/')
      ? `/${this.car.modelFileName}`
      : this.car.modelFileName;

    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        const size = box.getSize(new THREE.Vector3()).length();
        const scale = 5 / size;
        model.scale.setScalar(scale);

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.scene.add(model);
      },
      (progress) => {
        const pct = (progress.loaded / progress.total) * 100;
        console.log('Loading model:', pct.toFixed(0) + '%');
      },
      (err) => {
        console.error('Failed to load model:', err);
      }
    );
  }

  private animate(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(() => this.animate());
  }

  private resize(): void {
    if (!this.canvasRef) return;
    const w = this.canvasRef.nativeElement.clientWidth;
    const h = this.canvasRef.nativeElement.clientHeight;
    if (w > 0 && h > 0) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }
  }

  async loadReviews(): Promise<void> {
    if (!this.car?.id) return;
    try {
      const q = query(
        collection(this.db, 'reviews'),
        where('carId', '==', this.car.id),
        orderBy('score', 'desc')
      );
      const snap = await getDocs(q);
      this.reviews = snap.docs.map(d => ({ ...(d.data() as Review), id: d.id }));
    } catch (err) {
      console.error('Failed to load reviews:', err);
      this.reviews = [];
    }
  }

  async addReview(): Promise<void> {
    if (!this.car?.id || !this.auth.currentUser) return;
    try {
      await addDoc(collection(this.db, 'reviews'), {
        carId: this.car.id,
        user: this.auth.currentUser.email || 'Anonymous',
        score: this.newReviewScore,
        comment: this.newReviewComment
      });
      this.newReviewScore = 5;
      this.newReviewComment = '';
      await this.loadReviews();
    } catch (err) {
      console.error('Failed to add review:', err);
    }
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/']);
  }
}
