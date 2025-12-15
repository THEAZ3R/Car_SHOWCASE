  import { CommonModule } from '@angular/common';   // ← make sure this line exists
  import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
  import { Router } from '@angular/router';
  import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
  import * as THREE from 'three';

  @Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule],              // ← must be in the array
    templateUrl: './home.html',
    styleUrls: ['./home.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
  })
  export class HomePage implements AfterViewInit, OnDestroy {
    @ViewChild('spaceCanvas', { static: true })
    canvas!: ElementRef<HTMLCanvasElement>;

    private router = inject(Router);
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private planets: THREE.Mesh[] = [];
    private stars!: THREE.Points;
    private moon!: THREE.Mesh;
    private moonGroup!: THREE.Group;
    private animationId?: number;

    user: User | null = null;

    ngAfterViewInit(): void {
      onAuthStateChanged(getAuth(), u => (this.user = u));
      this.initScene();
      this.animate();
    }

    private initScene(): void {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const canvas = this.canvas.nativeElement;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x070a12);

      this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 2000);
      this.camera.position.set(0, 5, 18);
  this.camera.lookAt(0, 10, 0);   // look slightly above centre
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      this.renderer.setSize(w, h);
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

    private createMoon(): void {
      this.moonGroup = new THREE.Group();

      const moonGeo = new THREE.SphereGeometry(3.5, 32, 32);
      const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      this.moon = new THREE.Mesh(moonGeo, moonMat);
      this.moonGroup.add(this.moon);

      const haloGeo = new THREE.SphereGeometry(5, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
      });
      this.moon.add(new THREE.Mesh(haloGeo, haloMat));

      this.scene.add(this.moonGroup);
    }

    private createPlanets(): void {
      const data: Array<{
        color: number;
        size: number;
        pos: [number, number, number];
      }> = [
        { color: 0x4169e1, size: 1.2, pos: [-12, -8, -45] },
        { color: 0x9370db, size: 0.9, pos: [15, 12, -50] },
        { color: 0x00ced1, size: 0.6, pos: [-6, 15, -55] }
      ];

      data.forEach(d => {
        const geo = new THREE.SphereGeometry(d.size, 32, 32);
        const mat = new THREE.MeshLambertMaterial({
          color: d.color,
          emissive: d.color,
          emissiveIntensity: 0.08
        });
        const planet = new THREE.Mesh(geo, mat);
        planet.position.set(...d.pos);
        this.planets.push(planet);
        this.scene.add(planet);
      });
    }

    private createStars(): void {
      const geo = new THREE.BufferGeometry();
      const vertices: number[] = [];
      for (let i = 0; i < 20000; i++) {
        vertices.push(
          THREE.MathUtils.randFloatSpread(4000),
          THREE.MathUtils.randFloatSpread(4000),
          THREE.MathUtils.randFloatSpread(4000)
        );
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      this.stars = new THREE.Points(
        geo,
      new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2.0,               // bigger dots
    sizeAttenuation: false,  // constant size
    transparent: false       // no blending against black
  })

      );
      this.scene.add(this.stars);
    }

    private animate(): void {
      this.animationId = requestAnimationFrame(() => this.animate());

      const t = Date.now() * 0.0002;
      this.moonGroup.position.set(Math.sin(t) * 50, 30, -40);
      this.moonGroup.scale.setScalar(1 + Math.sin(t * 3) * 0.05);

      this.planets.forEach((p, i) => (p.rotation.y += 0.001 * (i + 1)));
      (this.stars.material as THREE.PointsMaterial).opacity =
        0.7 + Math.sin(t * 3) * 0.3;
      this.stars.rotation.y += 0.00005;

      this.camera.position.x = Math.sin(t * 0.1) * 2;
      this.camera.position.y = 5 + Math.cos(t * 0.05) * 1;
      this.camera.lookAt(this.moonGroup.position);   // moon is at (0,30,-40)

      this.renderer.render(this.scene, this.camera);
    }

    private onResize(): void {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    goTo(path: string): void {
      this.router.navigate([path]);
    }

    ngOnDestroy(): void {
      if (this.animationId) cancelAnimationFrame(this.animationId);
      this.renderer?.dispose();
      window.removeEventListener('resize', () => this.onResize());
    }
  }