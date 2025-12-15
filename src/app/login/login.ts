    import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject } from '@angular/core';
    import { Router } from '@angular/router';
    import { FormsModule } from '@angular/forms';
    import { CommonModule } from '@angular/common';
    import * as THREE from 'three';
    import {
      signInWithEmailAndPassword,
      getAuth,
      Auth,
      UserCredential
    } from '@angular/fire/auth';
    import {
      Firestore,
      doc,
      getDoc,
      docData
    } from '@angular/fire/firestore';

    @Component({
      selector: 'app-login',
      standalone: true,
      imports: [FormsModule, CommonModule],
      templateUrl: './login.html',
      styleUrls: ['./login.scss']
    })
    export class LoginPage implements AfterViewInit, OnDestroy {
      @ViewChild('spaceCanvas') canvas!: ElementRef<HTMLCanvasElement>;
    private auth  = inject(Auth);   // Firebase Auth
      private db    = inject(Firestore); 
      private router = inject(Router);
      private scene!: THREE.Scene;
      private camera!: THREE.PerspectiveCamera;
      private renderer!: THREE.WebGLRenderer;
      private planets: THREE.Mesh[] = [];
      private stars!: THREE.Points;
      private moon!: THREE.Mesh;
      private moonGroup!: THREE.Group;
      private animationId?: number;

      email = '';
      password = '';
      isLoading = false;

      ngAfterViewInit() {
        this.initScene();
        this.animate();
      }

      private initScene() {
        const canvas = this.canvas.nativeElement;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Deep night scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x070a12); // Very dark blue

        // Camera with slightly tighter view
        this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
        this.camera.position.set(0, 5, 18);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Stronger moon lighting
        const moonLight = new THREE.DirectionalLight(0xccccff, 1.5); // Brighter moonlight
        moonLight.position.set(0, 30, -30); // Position matches moon
        moonLight.castShadow = true;
        this.scene.add(moonLight);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x1a2a4a, 0.2);
        this.scene.add(ambientLight);

        // Create prominent moon with glow
        this.createMoon();

        // Create planets
        this.createPlanets();

        // Enhanced starfield
        this.createStars();

        window.addEventListener('resize', () => this.onResize());
      }

      private createMoon() {
        this.moonGroup = new THREE.Group();

        // Moon sphere (more prominent)
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
      const halo = new THREE.Mesh(haloGeo, haloMat);
      this.moon.add(halo);

      this.scene.add(this.moonGroup);
        // Multi-layer glow for prominence
        const glowLayers = [
          { size: 4.2, opacity: 0.4, color: 0xfff8dc },
          { size: 5.5, opacity: 0.2, color: 0xaaccff },
          { size: 7, opacity: 0.1, color: 0x7799ff }
        ];

        glowLayers.forEach(layer => {
          const glowGeometry = new THREE.SphereGeometry(layer.size, 32, 32);
          const glowMaterial = new THREE.MeshBasicMaterial({
            color: layer.color,
            transparent: true,
            opacity: layer.opacity,
            side: THREE.BackSide
          });
          const glow = new THREE.Mesh(glowGeometry, glowMaterial);
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
            color: data.color,
            emissive: data.emissive,
            emissiveIntensity: 0.08
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
          color: 0xffffff, 
          size: 0.5, // Prominent stars
          transparent: true,
          opacity: 1.0,
          sizeAttenuation: true,
          blending: THREE.AdditiveBlending
        });

        const starVertices = [];
        for (let i = 0; i < 20000; i++) { // Twice as many stars
          const x = THREE.MathUtils.randFloatSpread(4000);
          const y = THREE.MathUtils.randFloatSpread(4000);
          const z = THREE.MathUtils.randFloatSpread(4000);
          starVertices.push(x, y, z);
        }


        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
      }

      private animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Rotate moon on its axis
        const time = Date.now() * 0.0002;
      this.moonGroup.position.x = Math.sin(time) * 50;   // left ↔ right
      this.moonGroup.position.y = 30;                    // fixed top height
      this.moonGroup.position.z = -40;                   // behind scene

      // 2. gentle pulse
      const breathe = 1 + Math.sin(time * 3) * 0.05;
      this.moonGroup.scale.setScalar(breathe);
        // Rotate planets
        this.planets.forEach((planet, index) => {
          planet.rotation.y += 0.001 * (index + 1);
        });

        // Enhanced twinkling
        (this.stars.material as THREE.PointsMaterial).opacity = 0.7 + Math.sin(time * 3) * 0.3;
        this.stars.rotation.y += 0.00005;

        // Slow camera orbit
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

      async onLogin() {
  if (!this.email || !this.password) return;

  this.isLoading = true;
  try {
    const cred: UserCredential = await signInWithEmailAndPassword(
      this.auth,
      this.email,
      this.password
    );

    const userDoc = await getDoc(doc(this.db, 'Users', cred.user.uid));
    const role = userDoc.exists() ? userDoc.data()['role'] : null;

    if (role === 'admin') {
      await this.router.navigate(['/admin']);
    } else {
      await this.router.navigate(['/car', 'car']); // ← FIX HERE
    }
  } catch (err: any) {
    console.error('Login failed:', err);
    alert(err.message ?? 'Login failed');
  } finally {
    this.isLoading = false;
  }
}
        

        goToSignup() {
          this.router.navigate(['/signup']);
        }

        goHome() {
          this.router.navigate(['/']);
        }

        ngOnDestroy() {
          if (this.animationId) cancelAnimationFrame(this.animationId);
          this.renderer?.dispose();
          window.removeEventListener('resize', () => this.onResize());
        }
      }