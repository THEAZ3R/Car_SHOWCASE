  import { Component, OnDestroy, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { Firestore, collection, getDocs } from '@angular/fire/firestore';
  import { Auth } from '@angular/fire/auth';
  import { Router } from '@angular/router';
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

  @Component({
    selector: 'app-car-details',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './car-details.html',
    styleUrls: ['./car-details.scss']
  })
  export class CarShowcaseComponent implements AfterViewInit, OnDestroy {
    @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

    cars: Car[] = [];
    car: Car | null = null;
    isLoading = true;
    error: string | null = null;
    hasModel = false;

    private scene = new THREE.Scene();
    private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    private renderer!: THREE.WebGLRenderer;
    private controls!: OrbitControls;
    private frameId = 0;

    private db = inject(Firestore);
    private auth = inject(Auth);
    public router = inject(Router);

    async ngAfterViewInit(): Promise<void> {
      await this.loadAllCars();

      if (this.car) {
        this.initThree();
        this.animate();
      }

      this.isLoading = false;
    }

    ngOnDestroy(): void {
      cancelAnimationFrame(this.frameId);
      this.renderer?.dispose();
      window.removeEventListener('resize', this.resize);
    }

    /** Load all cars from Firestore */
    private async loadAllCars(): Promise<void> {
      try {
        const snapshot = await getDocs(collection(this.db, 'car'));
        this.cars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));

        if (this.cars.length > 0) {
          this.selectCar(this.cars[0]);
        }

        console.log('✅ Cars loaded:', this.cars);
      } catch (err) {
        this.error = 'Failed to load cars';
        console.error(err);
      }
    }

    /** Select a car from dropdown */
    selectCar(car: Car): void {
      this.car = car;
      this.hasModel = !!car.modelFileName;

      // Remove previous model
      const oldModel = this.scene.getObjectByName('car');
      if (oldModel) this.scene.remove(oldModel);

      if (this.hasModel) {
        this.loadModel();
      }
    }

    private initThree(): void {
      const canvas = this.canvasRef.nativeElement;
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;

      this.scene.background = new THREE.Color(0x222222); // dark grey background

      this.camera.position.set(6, 3, 8);

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, 1.2); // stronger ambient
      this.scene.add(ambient);

      const dir = new THREE.DirectionalLight(0xffffff, 1.5);
      dir.position.set(10, 10, 10);
      dir.castShadow = true;
      dir.shadow.mapSize.width = 2048;
      dir.shadow.mapSize.height = 2048;
      this.scene.add(dir);

      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.5;
      this.controls.maxDistance = 20;
      this.controls.minDistance = 3;
      this.controls.target.set(0, 0, 0);

      window.addEventListener('resize', () => this.resize());
      this.resize();
    }

    private loadModel(): void {
      if (!this.car?.modelFileName) return;

      const loader = new GLTFLoader();
      const path = this.car.modelFileName.startsWith('assets/') ? `/${this.car.modelFileName}` : this.car.modelFileName;

      loader.load(
        path,
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
              if (!child.material) return;
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => { mat.color.multiplyScalar(1.5); });
              } else {
                child.material.color.multiplyScalar(1.5); // brighten dark cars
              }
            }
          });

          model.name = 'car';
          this.scene.add(model);

          console.log('✅ Model loaded:', this.car?.name);
        },
        (progress) => {
          console.log(`📊 Loading progress: ${((progress.loaded / progress.total) * 100).toFixed(0)}%`);
        },
        (err) => console.error('❌ Model load error:', err)
      );
    }

    private animate(): void {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(() => this.animate());
    }

    private resize(): void {
      const canvas = this.canvasRef.nativeElement;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w > 0 && h > 0) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      }
    }
    goToReviews(): void {
      if (this.car?.id) {
        this.router.navigate(['/review', this.car.id]);
      }
    }


    async logout(): Promise<void> {
      await this.auth.signOut();
      this.router.navigate(['/']);
    }
  onCarChange(event: Event) {
    const select = event.target as HTMLSelectElement; // cast to HTMLSelectElement
    const index = select.selectedIndex;
    this.selectCar(this.cars[index]);
  }
  }