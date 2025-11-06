// inline-session.js
// Three.js WebXR Demo mit AR- und VR-Buttons, Licht, Schatten und animiertem Objekt

import * as THREE from 'three';

let renderer, scene, camera, cube, gl, xrSession = null, btnAR, btnVR;
const log = (t) => document.getElementById('log').innerText = "Status: " + t;

// Haupt-Setup-Funktion
async function setup() {
  // WebGL-Renderer und Szene vorbereiten
  const canvas = document.getElementById('c');
  gl = canvas.getContext('webgl', {antialias:true});
  renderer = new THREE.WebGLRenderer({canvas: canvas, context: gl});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight - 56);
  renderer.xr.enabled = true;

  // Kamera
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / (window.innerHeight - 56), 0.01, 1000);

  // Szene & Lichtquellen
  scene = new THREE.Scene();
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
  hemi.position.set(0, 1, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(1, 2, 1);
  dir.castShadow = true;
  dir.shadow.mapSize.width = dir.shadow.mapSize.height = 1024;
  dir.shadow.camera.near = 0.1;
  dir.shadow.camera.far = 10;
  scene.add(dir);

  // Bodenfläche (empfängt Schatten)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(10,10),
    new THREE.MeshStandardMaterial({color:0x555555})
  );
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Animiertes Objekt (Würfel)
  const geom = new THREE.BoxGeometry(0.3,0.3,0.3);
  const mat = new THREE.MeshStandardMaterial({color:0x89CFF0});
  cube = new THREE.Mesh(geom, mat);
  cube.position.set(0,0.15,-0.6);
  cube.castShadow = true;
  scene.add(cube);

  // Buttons erzeugen
  const controls = document.getElementById('controls');
  const supportedAR = await navigator.xr.isSessionSupported('immersive-ar').catch(()=>false);
  const supportedVR = await navigator.xr.isSessionSupported('immersive-vr').catch(()=>false);

  if (supportedAR) {
    btnAR = document.createElement('button');
    btnAR.textContent = "Enter AR";
    btnAR.onclick = () => requestSession('immersive-ar');
    controls.appendChild(btnAR);
  }
  if (supportedVR) {
    btnVR = document.createElement('button');
    btnVR.textContent = "Enter VR";
    btnVR.onclick = () => requestSession('immersive-vr');
    controls.appendChild(btnVR);
  }

  if (!supportedAR && !supportedVR) {
    log('WebXR wird nicht unterstützt');
  } else {
    log('Bereit – wählen Sie AR oder VR');
  }

  animate();
}

// XR-Session starten
async function requestSession(mode) {
  try {
    log('Starte ' + mode + ' ...');
    const options = (mode === 'immersive-ar') ? {requiredFeatures:['local', 'viewer']} : {requiredFeatures:['local']};
    const session = await navigator.xr.requestSession(mode, options);
    onSessionStarted(session, mode);
  } catch (e) {
    log('Fehler beim Starten der Session: ' + e);
  }
}

// Wenn Session startet
async function onSessionStarted(session, mode) {
  xrSession = session;
  log(mode + ' gestartet');

  session.addEventListener('end', onSessionEnded);

  await gl.makeXRCompatible();
  session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });

  renderer.xr.setReferenceSpaceType('local');
  await renderer.xr.setSession(session);

  if (mode === 'immersive-ar' && btnAR) btnAR.textContent = 'Stop AR';
  if (mode === 'immersive-vr' && btnVR) btnVR.textContent = 'Stop VR';

  renderer.setAnimationLoop(render);
}

// Wenn Session endet
function onSessionEnded() {
  log('Session beendet');
  renderer.setAnimationLoop(null);
  if (btnAR) btnAR.textContent = 'Enter AR';
  if (btnVR) btnVR.textContent = 'Enter VR';
  xrSession = null;
}

// Normale Bildschirm-Animation
function animate() {
  requestAnimationFrame(() => {
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
    animate();
  });
}

// Render-Schleife während XR-Session
function render(time) {
  time *= 0.001;
  cube.position.y = 0.15 + 0.05 * Math.sin(time * 2.0);
  renderer.render(scene, camera);
}

// Fenstergröße anpassen
window.addEventListener('resize', () => {
  const h = window.innerHeight - 56;
  renderer.setSize(window.innerWidth, h);
  camera.aspect = window.innerWidth / h;
  camera.updateProjectionMatrix();
});

setup();
