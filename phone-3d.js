import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const host = document.querySelector("[data-phone-3d]");

if (host) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  const phone = new THREE.Group();
  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  let scrollInfluence = 0;
  let enteredAt = 0;
  let frameId = 0;

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  phone.rotation.set(-0.18, -0.92, -0.055);
  phone.position.set(0.52, -0.28, -0.7);
  phone.scale.setScalar(0.92);

  const roundedRect = (width, height, radius) => {
    const x = -width / 2;
    const y = -height / 2;
    const shape = new THREE.Shape();
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return shape;
  };

  const bodyGeometry = new THREE.ExtrudeGeometry(roundedRect(3.26, 6.91, 0.56), {
    depth: 0.29,
    bevelEnabled: true,
    bevelSegments: 8,
    bevelSize: 0.045,
    bevelThickness: 0.04,
    curveSegments: 18,
  });
  bodyGeometry.center();

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb8bdc5,
    metalness: 1,
    roughness: 0.24,
    clearcoat: 0.42,
    clearcoatRoughness: 0.2,
  });
  phone.add(new THREE.Mesh(bodyGeometry, bodyMaterial));

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x020305,
    metalness: 0.15,
    roughness: 0.05,
    transmission: 0.08,
    clearcoat: 1,
  });
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(3.18, 6.83, 0.51), 24), glassMaterial);
  glass.position.z = 0.205;
  phone.add(glass);

  const bezelShape = roundedRect(3.16, 6.79, 0.49);
  bezelShape.holes.push(roundedRect(3.08, 6.67, 0.43));
  const bezelMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x010102,
    metalness: 0.2,
    roughness: 0.2,
    clearcoat: 0.9,
  });
  const bezel = new THREE.Mesh(new THREE.ShapeGeometry(bezelShape, 24), bezelMaterial);
  bezel.position.z = 0.213;
  phone.add(bezel);

  new THREE.TextureLoader().load(
    "26.png",
    (sourceTexture) => {
      const image = sourceTexture.image;
      const screenCanvas = document.createElement("canvas");
      const scale = 2;
      screenCanvas.width = 393 * scale;
      screenCanvas.height = 852 * scale;
      const context = screenCanvas.getContext("2d");
      const radius = 46 * scale;
      const width = screenCanvas.width;
      const height = screenCanvas.height;

      context.beginPath();
      context.roundRect(0, 0, width, height, radius);
      context.clip();
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 2, 2, 389, 848, 0, 0, width, height);

      const screenTexture = new THREE.CanvasTexture(screenCanvas);
      screenTexture.colorSpace = THREE.SRGBColorSpace;
      screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture, transparent: true });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.08, 6.67), screenMaterial);
      screen.position.y = -0.005;
      screen.position.z = 0.218;
      phone.add(screen);
      sourceTexture.dispose();
      host.classList.add("is-ready");
    },
    undefined,
    () => renderer.dispose()
  );

  const islandMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x000000,
    metalness: 0.05,
    roughness: 0.12,
    clearcoat: 1,
  });
  const island = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(0.92, 0.27, 0.135), 24),
    islandMaterial
  );
  island.position.set(0, 3.09, 0.229);
  phone.add(island);

  const sensorMaterial = new THREE.MeshBasicMaterial({ color: 0x121a26 });
  const sensor = new THREE.Mesh(new THREE.CircleGeometry(0.055, 24), sensorMaterial);
  sensor.position.set(0.31, 3.09, 0.233);
  phone.add(sensor);

  const speakerMaterial = new THREE.MeshBasicMaterial({ color: 0x27292e });
  const speaker = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.025), speakerMaterial);
  speaker.position.set(-0.1, 3.09, 0.234);
  phone.add(speaker);

  const buttonMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xaeb4bd,
    metalness: 1,
    roughness: 0.22,
    clearcoat: 0.48,
  });
  const addButton = (side, y, height, width = 0.075) => {
    const geometry = new THREE.ExtrudeGeometry(roundedRect(width, height, width / 2), {
      depth: 0.055,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.012,
      bevelThickness: 0.01,
      curveSegments: 12,
    });
    geometry.center();
    const button = new THREE.Mesh(geometry, buttonMaterial);
    button.rotation.y = Math.PI / 2;
    button.position.set(side * 1.672, y, -0.01);
    phone.add(button);
  };
  addButton(-1, 2.03, 0.38);
  addButton(-1, 1.22, 0.66);
  addButton(-1, 0.37, 0.66);
  addButton(1, 1.02, 1.18);
  addButton(1, -1.48, 0.64, 0.085);

  const antennaMaterial = new THREE.MeshBasicMaterial({ color: 0x686e76 });
  const addAntenna = (side, y) => {
    const antenna = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.22), antennaMaterial);
    antenna.rotation.y = Math.PI / 2;
    antenna.position.set(side * 1.704, y, -0.035);
    phone.add(antenna);
  };
  addAntenna(-1, 2.78);
  addAntenna(-1, -2.73);
  addAntenna(1, 2.78);
  addAntenna(1, -2.73);

  scene.add(phone);
  scene.add(new THREE.HemisphereLight(0xe9e6ff, 0x171322, 2.4));
  const keyLight = new THREE.DirectionalLight(0xffffff, 4.1);
  keyLight.position.set(-4, 6, 7);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x7766ff, 3.2);
  rimLight.position.set(5, -2, 4);
  scene.add(rimLight);
  const metalFill = new THREE.DirectionalLight(0xdce7ff, 2.2);
  metalFill.position.set(4, 2, -1);
  scene.add(metalFill);
  camera.position.set(0, 0, 13.5);

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    phone.scale.setScalar(width < 600 ? 0.88 : 1);
  };

  const updateScrollInfluence = () => {
    if (reducedMotion.matches) return;
    const rect = host.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const stageCenter = rect.top + rect.height / 2;
    scrollInfluence = THREE.MathUtils.clamp(
      (viewportCenter - stageCenter) / (window.innerHeight + rect.height),
      -0.5,
      0.5
    );
  };

  const updatePointer = (event) => {
    if (reducedMotion.matches || !window.matchMedia("(pointer: fine)").matches) return;
    const rect = host.getBoundingClientRect();
    const x = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width, 0, 1) - 0.5;
    const y = THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height, 0, 1) - 0.5;
    pointerTarget.set(x * 0.2, y * 0.1);
  };

  const resetPointer = () => pointerTarget.set(0, 0);

  const render = (time) => {
    const elapsed = enteredAt ? time - enteredAt : 0;
    const entrance = reducedMotion.matches
      ? 1
      : 1 - Math.pow(1 - THREE.MathUtils.clamp(elapsed / 1450, 0, 1), 4);
    const idle = reducedMotion.matches ? 0 : Math.sin(time * 0.00055);
    pointerCurrent.lerp(pointerTarget, 0.045);

    const targetX = -0.055 - pointerCurrent.y + scrollInfluence * 0.08 + idle * 0.012;
    const targetY = -0.3 + pointerCurrent.x + scrollInfluence * 0.18 + idle * 0.025;
    const targetZ = -0.025 + pointerCurrent.x * 0.08;

    phone.rotation.x = THREE.MathUtils.lerp(-0.18, targetX, entrance);
    phone.rotation.y = THREE.MathUtils.lerp(-0.92, targetY, entrance);
    phone.rotation.z = THREE.MathUtils.lerp(-0.055, targetZ, entrance);
    phone.position.x = THREE.MathUtils.lerp(0.52, 0, entrance);
    phone.position.y = THREE.MathUtils.lerp(-0.28, idle * 0.055, entrance);
    phone.position.z = THREE.MathUtils.lerp(-0.7, 0, entrance);
    const responsiveScale = host.clientWidth < 600 ? 0.88 : 1;
    phone.scale.setScalar(THREE.MathUtils.lerp(responsiveScale * 0.92, responsiveScale, entrance));

    keyLight.position.x = -4 + idle * 0.35;
    rimLight.position.y = -2 + idle * 0.25;
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !frameId) {
      if (!enteredAt) enteredAt = performance.now();
      frameId = requestAnimationFrame(render);
    }
    if (!entry.isIntersecting && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  });

  resize();
  updateScrollInfluence();
  observer.observe(host);
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", updateScrollInfluence, { passive: true });
  host.addEventListener("pointermove", updatePointer, { passive: true });
  host.addEventListener("pointerleave", resetPointer, { passive: true });
  reducedMotion.addEventListener("change", () => {
    resetPointer();
    updateScrollInfluence();
  });
}