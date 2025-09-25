import * as THREE from 'three';

const app = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 4);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(2, 3, 4);
scene.add(new THREE.AmbientLight(0xffffff, 0.5), light);

const geo = new THREE.BoxGeometry(1, 1, 1);
const mat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.9 });
const cube = new THREE.Mesh(geo, mat);

scene.add(cube);

// Resize handling
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Simple idle animation (placeholder for avatar)
const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  cube.rotation.x = t * 0.5;
  cube.rotation.y = t * 0.8;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
