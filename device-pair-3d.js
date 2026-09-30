import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const host = document.querySelector("[data-device-pair-3d]");

if (host) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  const deviceGroup = new THREE.Group();
  const phone = new THREE.Group();
  const tablet = new THREE.Group();
  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  let loadedScreens = 0;
  let scrollInfluence = 0;
  let enteredAt = 0;
  let frameId = 0;

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

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

  const metalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xcbd0d7,
    metalness: 0.96,
    roughness: 0.2,
    clearcoat: 0.48,
    clearcoatRoughness: 0.18,
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x010102,
    metalness: 0.15,
    roughness: 0.06,
    clearcoat: 1,
  });

  const addBody = (parent, width, height, radius, depth) => {
    const geometry = new THREE.ExtrudeGeometry(roundedRect(width, height, radius), {
      depth,
      bevelEnabled: true,
      bevelSegments: 8,
      bevelSize: 0.045,
      bevelThickness: 0.04,
      curveSegments: 20,
    });
    geometry.center();
    parent.add(new THREE.Mesh(geometry, metalMaterial));
  };

  const addScreen = (parent, image, width, height, radius, z, glassPadding, crop) => {
    const glass = new THREE.Mesh(
      new THREE.ShapeGeometry(roundedRect(width + glassPadding, height + glassPadding, radius + glassPadding / 2), 24),
      glassMaterial
    );
    glass.position.z = z - 0.006;
    parent.add(glass);

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    const cornerRadius = Math.round(canvas.height * (radius / height));
    context.beginPath();
    context.roundRect(0, 0, canvas.width, canvas.height, cornerRadius);
    context.clip();
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    );
    screen.position.z = z;
    parent.add(screen);
    loadedScreens += 1;
    if (loadedScreens === 2) host.classList.add("is-ready");
  };

  addBody(tablet, 11.53, 8.31, 0.42, 0.27);

  const tabletGlass = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(11.43, 8.21, 0.37), 24),
    glassMaterial
  );
  tabletGlass.position.z = 0.199;
  tablet.add(tabletGlass);

  const tabletScreenWidth = 10.99;
  const tabletScreenHeight = 7.84;
  const tabletScreenRadius = 0.27;
  const tabletBezelShape = roundedRect(11.39, 8.17, 0.35);
  tabletBezelShape.holes.push(roundedRect(tabletScreenWidth, tabletScreenHeight, tabletScreenRadius));
  const tabletBezel = new THREE.Mesh(
    new THREE.ShapeGeometry(tabletBezelShape, 24),
    new THREE.MeshPhysicalMaterial({
      color: 0x010102,
      metalness: 0.2,
      roughness: 0.2,
      clearcoat: 0.9,
    })
  );
  tabletBezel.position.z = 0.207;
  tablet.add(tabletBezel);

  new THREE.TextureLoader().load("iPad Main Screen.png", (sourceTexture) => {
    const canvas = document.createElement("canvas");
    canvas.width = 2420;
    canvas.height = 1668;
    const context = canvas.getContext("2d");
    const radius = canvas.height * (tabletScreenRadius / tabletScreenHeight);
    context.beginPath();
    context.roundRect(0, 0, canvas.width, canvas.height, radius);
    context.clip();
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(sourceTexture.image, 0, 0, 4840, 3336, 0, 0, canvas.width, canvas.height);

    const screenTexture = new THREE.CanvasTexture(canvas);
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(tabletScreenWidth, tabletScreenHeight),
      new THREE.MeshBasicMaterial({ map: screenTexture, transparent: true })
    );
    screen.position.z = 0.212;
    tablet.add(screen);
    sourceTexture.dispose();
    loadedScreens += 1;
    if (loadedScreens === 2) host.classList.add("is-ready");
  });

  const tabletCamera = new THREE.Mesh(
    new THREE.CircleGeometry(0.045, 24),
    new THREE.MeshPhysicalMaterial({ color: 0x05070a, roughness: 0.08, clearcoat: 1 })
  );
  tabletCamera.scale.setScalar(0.62);
  tabletCamera.position.set(0, 4.04, 0.218);
  tablet.add(tabletCamera);

  const tabletSensorMaterial = new THREE.MeshBasicMaterial({ color: 0x17202c });
  const leftTabletSensor = new THREE.Mesh(new THREE.CircleGeometry(0.016, 18), tabletSensorMaterial);
  leftTabletSensor.scale.setScalar(0.62);
  leftTabletSensor.position.set(-0.09, 4.04, 0.219);
  tablet.add(leftTabletSensor);
  const rightTabletSensor = leftTabletSensor.clone();
  rightTabletSensor.position.x = 0.09;
  tablet.add(rightTabletSensor);

  addBody(phone, 3.26, 6.91, 0.56, 0.29);
  const phoneGlass = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(3.18, 6.83, 0.51), 24),
    glassMaterial
  );
  phoneGlass.position.z = 0.205;
  phone.add(phoneGlass);

  const phoneBezelShape = roundedRect(3.16, 6.79, 0.49);
  phoneBezelShape.holes.push(roundedRect(3.08, 6.67, 0.43));
  const phoneBezel = new THREE.Mesh(
    new THREE.ShapeGeometry(phoneBezelShape, 24),
    new THREE.MeshPhysicalMaterial({
      color: 0x010102,
      metalness: 0.2,
      roughness: 0.2,
      clearcoat: 0.9,
    })
  );
  phoneBezel.position.z = 0.213;
  phone.add(phoneBezel);

  new THREE.TextureLoader().load("iOS main screen.png", (sourceTexture) => {
    const canvas = document.createElement("canvas");
    canvas.width = 786;
    canvas.height = 1704;
    const context = canvas.getContext("2d");
    context.beginPath();
    context.roundRect(0, 0, canvas.width, canvas.height, 92);
    context.clip();
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(sourceTexture.image, 8, 8, 1556, 3392, 0, 0, canvas.width, canvas.height);

    const screenTexture = new THREE.CanvasTexture(canvas);
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(3.08, 6.67),
      new THREE.MeshBasicMaterial({ map: screenTexture, transparent: true })
    );
    screen.position.set(0, -0.005, 0.218);
    phone.add(screen);
    sourceTexture.dispose();
    loadedScreens += 1;
    if (loadedScreens === 2) host.classList.add("is-ready");
  });

  const island = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(0.91, 0.265, 0.132), 24),
    new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.1, clearcoat: 1 })
  );
  island.position.set(0, 3.08, 0.222);
  phone.add(island);

  const buttonMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xcbd0d7,
    metalness: 0.96,
    roughness: 0.2,
    clearcoat: 0.48,
  });
  const addButton = (parent, side, x, y, height, depth, width = 0.075) => {
    const geometry = new THREE.ExtrudeGeometry(roundedRect(width, height, width / 2), {
      depth,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.012,
      bevelThickness: 0.01,
      curveSegments: 12,
    });
    geometry.center();
    const button = new THREE.Mesh(geometry, buttonMaterial);
    button.rotation.y = Math.PI / 2;
    button.position.set(side * x, y, -0.01);
    parent.add(button);
  };
  addButton(phone, -1, 1.672, 2.03, 0.38, 0.055);
  addButton(phone, -1, 1.672, 1.22, 0.66, 0.055);
  addButton(phone, -1, 1.672, 0.37, 0.66, 0.055);
  addButton(phone, 1, 1.672, 1.02, 1.18, 0.055);
  addButton(phone, 1, 1.672, -1.48, 0.64, 0.055, 0.085);
  addButton(tablet, 1, 5.812, 2.45, 0.82, 0.05, 0.07);
  addButton(tablet, 1, 5.812, 1.45, 0.56, 0.05, 0.07);

  const portMaterial = new THREE.MeshBasicMaterial({ color: 0x101217 });
  const usbPort = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.34, 0.095), portMaterial);
  usbPort.position.set(5.806, 0, -0.005);
  tablet.add(usbPort);

  const speakerGeometry = new THREE.SphereGeometry(0.025, 12, 8);
  for (const y of [-2.8, -2.62, -2.44, 2.44, 2.62, 2.8]) {
    const speaker = new THREE.Mesh(speakerGeometry, portMaterial);
    speaker.scale.set(0.35, 1, 1);
    speaker.position.set(5.81, y, -0.01);
    tablet.add(speaker);
  }

  tablet.position.set(1.05, 0.42, -0.88);
  tablet.rotation.set(0, 0, 0);
  phone.position.set(-3.72, -1.05, 0.92);
  phone.rotation.set(0, 0, 0);
  deviceGroup.add(tablet, phone);
  scene.add(deviceGroup);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a4f5b, 3));
  const keyLight = new THREE.DirectionalLight(0xffffff, 5.2);
  keyLight.position.set(-5, 7, 8);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xa9bfff, 4.2);
  rimLight.position.set(6, -2, 4);
  scene.add(rimLight);
  const fillLight = new THREE.DirectionalLight(0xdce7ff, 2.3);
  fillLight.position.set(4, 3, -2);
  scene.add(fillLight);
  camera.position.set(0, 0, 16.2);

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
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
    pointerTarget.set(x * 0.18, y * 0.08);
  };

  const resetPointer = () => pointerTarget.set(0, 0);

  const render = (time) => {
    const elapsed = enteredAt ? time - enteredAt : 0;
    const entrance = reducedMotion.matches
      ? 1
      : 1 - Math.pow(1 - THREE.MathUtils.clamp(elapsed / 1550, 0, 1), 4);
    const phoneLead = reducedMotion.matches
      ? 1
      : 1 - Math.pow(1 - THREE.MathUtils.clamp((elapsed + 130) / 1450, 0, 1), 4);
    const idle = reducedMotion.matches ? 0 : Math.sin(time * 0.00055);
    pointerCurrent.lerp(pointerTarget, 0.045);

    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    const interactionX = hasFinePointer ? -pointerCurrent.y : scrollInfluence * 0.08;
    const interactionY = hasFinePointer ? pointerCurrent.x : scrollInfluence * 0.18;
    const interactionZ = hasFinePointer ? pointerCurrent.x * 0.04 : 0;
    deviceGroup.rotation.x = interactionX * entrance;
    deviceGroup.rotation.y = interactionY * entrance;
    deviceGroup.rotation.z = interactionZ * entrance;
    deviceGroup.position.x = THREE.MathUtils.lerp(0.85, -0.3, entrance);
    deviceGroup.position.y = THREE.MathUtils.lerp(-0.35, 0.36 + idle * 0.045, entrance);
    deviceGroup.position.z = THREE.MathUtils.lerp(-0.8, 0, entrance);

    const responsiveScale = host.clientWidth < 600 ? 0.48 : 0.72;
    deviceGroup.scale.setScalar(THREE.MathUtils.lerp(responsiveScale * 0.9, responsiveScale, entrance));
    phone.position.z = THREE.MathUtils.lerp(0.25, 0.92 + idle * 0.035, phoneLead);
    tablet.position.z = -0.88 + idle * 0.012;

    keyLight.position.x = -5 + idle * 0.35;
    rimLight.position.y = -2 + idle * 0.25;
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !frameId) {
      if (!enteredAt) enteredAt = performance.now();
      frameId = requestAnimationFrame(render);
    } else if (!entry.isIntersecting && frameId) {
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