import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

export class StartScreen {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private glitchPass: GlitchPass;
  private capMesh: THREE.Mesh;
  private buttonGroup: THREE.Group;
  private textMeshes: THREE.Mesh[] = [];
  private textGroup?: THREE.Group;
  private gridHelper?: THREE.GridHelper;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isHoveringButton = false;
  private clock: THREE.Clock;
  private animationId?: number;
  private onStartCallback?: () => void;

  constructor(container: HTMLElement, onStart: () => void) {
    this.onStartCallback = onStart;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x02000a, 0.02);
    this.scene.background = new THREE.Color(0x02000a);

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 3, 22);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    // Make canvas fill the entire screen
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.zIndex = '1000';
    
    container.appendChild(this.renderer.domElement);

    // Post-Processing
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.0
    );
    this.composer.addPass(bloomPass);

    this.glitchPass = new GlitchPass();
    this.glitchPass.enabled = true;
    this.glitchPass.goWild = false;
    this.composer.addPass(this.glitchPass);

    // Environment
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 20, 10);
    spotLight.angle = 0.3;
    spotLight.penumbra = 1;
    spotLight.intensity = 1.5;
    this.scene.add(spotLight);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(500, 500);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -5;
    this.scene.add(floor);

    this.gridHelper = new THREE.GridHelper(500, 60, 0xaa00ff, 0x220044);
    this.gridHelper.position.y = -4.9;
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = 0.15;
    this.scene.add(this.gridHelper);

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const posArray = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 400;
      if (i % 3 === 1 && posArray[i] < 0) posArray[i] *= -1;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0x88aaff, size: 0.2 }));
    this.scene.add(stars);

    // Button
    this.buttonGroup = new THREE.Group();
    this.scene.add(this.buttonGroup);
    this.buttonGroup.position.set(0, -3.5, 8);
    this.buttonGroup.rotation.x = 0.2;

    // Button Base
    const baseGeo = new THREE.CylinderGeometry(3.5, 4, 1, 6);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.5,
      metalness: 0.7
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.5;
    this.buttonGroup.add(baseMesh);

    // Button Cap
    const capGeo = new THREE.SphereGeometry(2.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xaa0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      roughness: 0.4,
      metalness: 0.3,
    });
    this.capMesh = new THREE.Mesh(capGeo, capMat);
    this.capMesh.scale.y = 0.5;
    this.capMesh.position.y = 0.1;
    this.capMesh.userData = { isButton: true };
    this.buttonGroup.add(this.capMesh);

    // Warning Ring
    const ringGeo = new THREE.TorusGeometry(3, 0.15, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.05;
    this.buttonGroup.add(ringMesh);

    // Text
    this.loadText();

    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.setupEventListeners();
  }

  private loadText() {
    const loader = new THREE.FontLoader();
    const neonColors = [0x00ffff, 0xffaa00, 0x00ffff, 0xffaa00];

    loader.load('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
      this.textGroup = new THREE.Group();
      this.scene.add(this.textGroup);

      // RIFT Title
      const textString = "RIFT";
      let xOffset = 0;
      const spacing = 1.5;

      textString.split('').forEach((char, i) => {
        const geometry = new THREE.TextGeometry(char, {
          font: font,
          size: 7,
          height: 0.6,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.05,
          bevelSize: 0.02,
          bevelSegments: 3
        });
        geometry.computeBoundingBox();
        const width = geometry.boundingBox!.max.x - geometry.boundingBox!.min.x;
        const material = new THREE.MeshStandardMaterial({
          color: 0x000000,
          emissive: neonColors[i % neonColors.length],
          emissiveIntensity: 1.5,
          roughness: 0.3,
          metalness: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = xOffset;
        mesh.userData = { baseHex: neonColors[i % neonColors.length], offset: i };
        this.textGroup!.add(mesh);
        this.textMeshes.push(mesh);

        // Floor light
        const floorLight = new THREE.PointLight(neonColors[i % neonColors.length], 0.8, 10);
        floorLight.position.set(xOffset + width / 2, -2, 4);
        this.textGroup!.add(floorLight);

        xOffset += width + spacing;
      });

      const box = new THREE.Box3().setFromObject(this.textGroup);
      this.textGroup.position.x = -(box.max.x - box.min.x) / 2;
      this.textGroup.position.y = 2;

      // BREACH Label
      const breachGeo = new THREE.TextGeometry("START", {
        font: font,
        size: 0.8,
        height: 0.1,
        curveSegments: 5,
        bevelEnabled: false
      });
      breachGeo.computeBoundingBox();
      const bWidth = breachGeo.boundingBox!.max.x - breachGeo.boundingBox!.min.x;
      const breachMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const breachMesh = new THREE.Mesh(breachGeo, breachMat);
      breachMesh.position.set(-bWidth / 2, 0.5, 0.3);
      breachMesh.rotation.x = -Math.PI / 2;
      this.capMesh.add(breachMesh);
    });
  }

  private setupEventListeners() {
    const onMouseMove = (event: MouseEvent) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const onMouseDown = () => {
      if (this.isHoveringButton) {
        this.capMesh.position.y = -0.1;
        setTimeout(() => {
          if (this.onStartCallback) {
            this.onStartCallback();
          }
        }, 100);
      }
    };

    const onMouseUp = () => {
      this.capMesh.position.y = 0.1;
    };

    const onResize = () => {
      this.onResize();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', onResize);

    // Store for cleanup
    (this as any).eventListeners = { onMouseMove, onMouseDown, onMouseUp, onResize };
  }

  public start() {
    this.animate();
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    // Remove event listeners
    const listeners = (this as any).eventListeners;
    if (listeners) {
      window.removeEventListener('mousemove', listeners.onMouseMove);
      window.removeEventListener('mousedown', listeners.onMouseDown);
      window.removeEventListener('mouseup', listeners.onMouseUp);
      window.removeEventListener('resize', listeners.onResize);
    }
    // Remove canvas from DOM
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    // Dispose of resources
    this.renderer.dispose();
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([this.capMesh], false);
    const wasHovering = this.isHoveringButton;
    this.isHoveringButton = intersects.length > 0;

    if (this.isHoveringButton !== wasHovering) {
      document.body.className = this.isHoveringButton ? 'hovering' : '';
    }

    const capMat = this.capMesh.material as THREE.MeshStandardMaterial;

    if (this.isHoveringButton) {
      this.glitchPass.goWild = false;
      const hoverPulse = Math.sin(t * 10) * 0.25 + 0.5;
      capMat.emissive.setHex(0xff3333);
      capMat.emissiveIntensity = 1.5 + hoverPulse * 0.5;

      this.buttonGroup.scale.setScalar(1.05);
    } else {
      this.glitchPass.goWild = false;
      this.buttonGroup.scale.setScalar(1.0);

      const pulse = Math.sin(t * 3) * 0.5 + 0.5;
      capMat.emissive.setHex(0xff0000);
      capMat.emissiveIntensity = 0.3 + (pulse * 0.3);

      // Rotate ring
      const ringMesh = this.buttonGroup.children[2] as THREE.Mesh;
      ringMesh.rotation.z = t * 0.5;
    }

    if (this.textGroup) {
      this.textGroup.position.y = 2 + Math.sin(t * 0.8) * 0.2;
      this.textMeshes.forEach(mesh => {
        const hueShift = Math.sin(t * 0.5 + (mesh.userData as any).offset) * 0.1;
        const baseColor = new THREE.Color((mesh.userData as any).baseHex);
        const hsl: any = {};
        baseColor.getHSL(hsl);
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHSL(hsl.h + hueShift, hsl.s, hsl.l);

        const extraEnergy = this.isHoveringButton ? 0.5 : 0.0;
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + Math.sin(t * 2) * 0.15 + extraEnergy;
      });
    }

    if (this.gridHelper) this.gridHelper.position.z = (t * 2) % 10;

    if (!this.isHoveringButton) {
      if (Math.random() > 0.999) {
        this.glitchPass.curF = Math.floor(Math.random() * 10);
      }
    }

    this.camera.lookAt(0, 0, 0);
    this.composer.render();
  };

  public onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    // Note: bloomPass resolution update might need adjustment
  }
}
