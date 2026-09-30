import * as THREE from "https://esm.sh/three@0.180.0";
import { DRACOLoader } from "https://esm.sh/three@0.180.0/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

const host = document.querySelector("[data-project-two-device-pair-3d]");

if (host) {
  const macVideo = host.querySelector("[data-project-two-pair-mac-video]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  const deviceGroup = new THREE.Group();
  const macbook = new THREE.Group();
  const phone = new THREE.Group();
  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  let frameId = 0;
  let enteredAt = 0;
  let scrollInfluence = 0;

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
    color: 0xc8cdd4,
    metalness: 0.96,
    roughness: 0.2,
    clearcoat: 0.5,
    clearcoatRoughness: 0.18,
  });
  const darkMetalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x6e737a,
    metalness: 0.86,
    roughness: 0.26,
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x010102,
    metalness: 0.14,
    roughness: 0.06,
    clearcoat: 1,
  });
  const keyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x111317,
    metalness: 0.15,
    roughness: 0.32,
    clearcoat: 0.4,
  });

  const addRoundedBody = (parent, width, height, radius, depth, material = metalMaterial) => {
    const geometry = new THREE.ExtrudeGeometry(roundedRect(width, height, radius), {
      depth,
      bevelEnabled: true,
      bevelSegments: 8,
      bevelSize: 0.045,
      bevelThickness: 0.04,
      curveSegments: 20,
    });
    geometry.center();
    const body = new THREE.Mesh(geometry, material);
    parent.add(body);
    return body;
  };

  const createPlaceholderTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 940;
    const context = canvas.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#111321");
    gradient.addColorStop(1, "#25203f");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#171a2c";
    context.fillRect(0, 0, 116, canvas.height);
    context.fillStyle = "#7470f4";
    context.beginPath();
    context.roundRect(29, 34, 58, 58, 16);
    context.fill();

    context.fillStyle = "rgba(255,255,255,0.12)";
    for (let y = 132; y < 710; y += 88) {
      context.beginPath();
      context.roundRect(31, y, 54, 54, 14);
      context.fill();
    }

    context.fillStyle = "#f5f6fb";
    context.beginPath();
    context.roundRect(116, 0, canvas.width - 116, canvas.height, 28);
    context.fill();
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.roundRect(190, 58, 1320, 84, 22);
    context.fill();
    context.strokeStyle = "#d7d9e2";
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = "#666a78";
    context.font = "32px Arial";
    context.fillText("Search", 250, 111);

    context.fillStyle = "#303445";
    context.font = "600 42px Arial";
    context.fillText("Search across Teams", 190, 225);
    context.fillStyle = "#6e7280";
    context.font = "28px Arial";
    context.fillText("Messages, people, meetings and files", 190, 270);

    for (let index = 0; index < 3; index += 1) {
      const y = 330 + index * 165;
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.roundRect(190, y, 1260, 128, 24);
      context.fill();
      context.strokeStyle = "#e3e4ea";
      context.lineWidth = 2;
      context.stroke();
      context.fillStyle = index === 0 ? "#6d68e8" : "#d9dbe3";
      context.beginPath();
      context.arc(260, y + 64, 34, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#3d4050";
      context.fillRect(330, y + 35, 390 + index * 80, 18);
      context.fillStyle = "#a5a8b2";
      context.fillRect(330, y + 73, 720 - index * 55, 14);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  };

  const createMediaTexture = (video) => {
    if (!video) return createPlaceholderTexture();
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  };

  addRoundedBody(macbook, 12.55, 7.8, 0.34, 0.24);

  const displayGlass = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(12.35, 7.6, 0.28), 24),
    glassMaterial
  );
  displayGlass.position.z = 0.17;
  macbook.add(displayGlass);

  const macScreenWidth = 12.24;
  const macScreenHeight = 7.245;
  const macScreenMaterial = new THREE.MeshBasicMaterial({
    map: createMediaTexture(macVideo),
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const macScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(macScreenWidth, macScreenHeight),
    macScreenMaterial
  );
  macScreen.position.set(0, 0, 0.184);
  macbook.add(macScreen);

  if (!macVideo) {
    new THREE.TextureLoader().load(
      "Desktop search.png?v=202609301903",
      (sourceTexture) => {
        const targetAspect = 16 / 10;
        const sourceWidth = sourceTexture.image.naturalWidth || sourceTexture.image.width;
        const sourceHeight = sourceTexture.image.naturalHeight || sourceTexture.image.height;

        const canvas = document.createElement("canvas");
        canvas.width = 1920;
        canvas.height = Math.round(canvas.width / targetAspect);
        const context = canvas.getContext("2d");
        context.drawImage(
          sourceTexture.image,
          0,
          0,
          sourceWidth,
          sourceHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const screenTexture = new THREE.CanvasTexture(canvas);
        screenTexture.colorSpace = THREE.SRGBColorSpace;
        screenTexture.flipY = false;
        screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        macScreenMaterial.map?.dispose();
        macScreenMaterial.map = screenTexture;
        macScreenMaterial.needsUpdate = true;
        sourceTexture.dispose();
      },
      undefined,
      (error) => {
        console.error("Failed to load the MacBook SERP screen texture.", error);
      }
    );
  }

  const macBezelShape = roundedRect(12.35, 7.6, 0.28);
  macBezelShape.holes.push(roundedRect(macScreenWidth, macScreenHeight, 0.12));
  const macBezel = new THREE.Mesh(
    new THREE.ShapeGeometry(macBezelShape, 24),
    glassMaterial
  );
  macBezel.position.z = 0.188;
  macbook.add(macBezel);

  const macNotch = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(1.24, 0.42, 0.16), 20),
    new THREE.MeshBasicMaterial({ color: 0x020203 })
  );
  macNotch.position.set(0, 3.48, 0.192);
  macbook.add(macNotch);

  const macCamera = new THREE.Mesh(
    new THREE.CircleGeometry(0.055, 20),
    new THREE.MeshPhysicalMaterial({ color: 0x111a26, roughness: 0.08, clearcoat: 1 })
  );
  macCamera.position.set(0, 3.51, 0.195);
  macbook.add(macCamera);

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(13.05, 0.2, 5.05),
    metalMaterial
  );
  deck.position.set(0, -4.03, 2.38);
  macbook.add(deck);

  const deckEdge = new THREE.Mesh(
    new THREE.BoxGeometry(13.13, 0.12, 0.25),
    darkMetalMaterial
  );
  deckEdge.position.set(0, -4.09, 4.91);
  macbook.add(deckEdge);

  const hingeGeometry = new THREE.CylinderGeometry(0.13, 0.13, 2.35, 24);
  const leftHinge = new THREE.Mesh(hingeGeometry, darkMetalMaterial);
  leftHinge.rotation.z = Math.PI / 2;
  leftHinge.position.set(-3.85, -3.92, -0.03);
  macbook.add(leftHinge);
  const rightHinge = leftHinge.clone();
  rightHinge.position.x = 3.85;
  macbook.add(rightHinge);

  const keyGeometry = new THREE.BoxGeometry(0.61, 0.055, 0.37);
  const keys = new THREE.InstancedMesh(keyGeometry, keyMaterial, 78);
  const keyTransform = new THREE.Object3D();
  let keyIndex = 0;
  for (let row = 0; row < 6; row += 1) {
    const columns = row === 5 ? 8 : 14;
    const rowWidth = (columns - 1) * 0.78;
    for (let column = 0; column < columns; column += 1) {
      keyTransform.position.set(
        -rowWidth / 2 + column * 0.78,
        -3.9,
        0.42 + row * 0.49
      );
      keyTransform.scale.set(row === 5 && column === 3 ? 3.2 : 1, 1, 1);
      keyTransform.updateMatrix();
      keys.setMatrixAt(keyIndex, keyTransform.matrix);
      keyIndex += 1;
    }
  }
  keys.count = keyIndex;
  macbook.add(keys);

  const trackpad = new THREE.Mesh(
    new THREE.BoxGeometry(4.45, 0.025, 1.15),
    new THREE.MeshPhysicalMaterial({
      color: 0xb8bdc4,
      metalness: 0.84,
      roughness: 0.28,
      clearcoat: 0.35,
    })
  );
  trackpad.position.set(0, -3.9, 4.02);
  macbook.add(trackpad);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/");
  const macbookLoader = new GLTFLoader();
  macbookLoader.setDRACOLoader(dracoLoader);
  macbookLoader.load(
    "macbook.glb?v=202609301916",
    ({ scene: model }) => {
      model.traverse((child) => {
        if (!child.isMesh) return;
        if (Array.isArray(child.material)) {
          child.material = child.material.map((material) => {
            if (material.name === "screen.001") return macScreenMaterial;
            if (child.name === "screen" && material.name === "aluminium") {
              const darkerBezelMaterial = material.clone();
              darkerBezelMaterial.color.multiplyScalar(0.72);
              return darkerBezelMaterial;
            }
            return material;
          });
        } else if (child.material?.name === "screen.001") {
          child.material = macScreenMaterial;
          child.scale.x *= 1.02;
          child.scale.y *= 1.02;
          child.material.polygonOffset = true;
          child.material.polygonOffsetFactor = -1;
        }
      });
      model.scale.setScalar(1.38);
      model.position.set(0, -3.08, -3.25);

      macbook.traverse((child) => {
        child.geometry?.dispose();
      });
      macbook.clear();
      macbook.add(model);
    },
    undefined,
    (error) => {
      console.error("Failed to load the authored MacBook model.", error);
    }
  );

  addRoundedBody(phone, 3.26, 6.91, 0.56, 0.29);
  const phoneGlass = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(3.18, 6.83, 0.51), 24),
    glassMaterial
  );
  phoneGlass.position.z = 0.205;
  phone.add(phoneGlass);

  const phoneScreenOpeningWidth = 3.08;
  const phoneScreenOpeningHeight = 6.67;
  const phoneScreenOpeningRadius = 0.43;
  const phoneScreenWidth = phoneScreenOpeningWidth;
  const phoneScreenHeight = phoneScreenOpeningHeight;
  const phoneScreenRadius = phoneScreenOpeningRadius;
  const phoneScreenMaterial = new THREE.MeshBasicMaterial({
    map: createPlaceholderTexture(),
    transparent: true,
    alphaTest: 0.01,
    toneMapped: false,
  });
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(phoneScreenWidth, phoneScreenHeight),
    phoneScreenMaterial
  );
  phoneScreen.position.z = 0.213;
  phone.add(phoneScreen);

  new THREE.TextureLoader().load(
    "Mobile serp latest.png?v=202609301956",
    (sourceTexture) => {
      const canvas = document.createElement("canvas");
      canvas.width = sourceTexture.image.naturalWidth || sourceTexture.image.width;
      canvas.height = sourceTexture.image.naturalHeight || sourceTexture.image.height;
      const context = canvas.getContext("2d");
      const cornerRadius = canvas.width * (phoneScreenRadius / phoneScreenWidth);
      context.beginPath();
      context.roundRect(0, 0, canvas.width, canvas.height, cornerRadius);
      context.clip();
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(sourceTexture.image, 0, 0, canvas.width, canvas.height);

      const screenTexture = new THREE.CanvasTexture(canvas);
      screenTexture.colorSpace = THREE.SRGBColorSpace;
      screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      phoneScreenMaterial.map?.dispose();
      phoneScreenMaterial.map = screenTexture;
      phoneScreenMaterial.needsUpdate = true;
      sourceTexture.dispose();
    },
    undefined,
    (error) => {
      console.error("Failed to load the mobile SERP screen texture.", error);
    }
  );

  const phoneBezelShape = roundedRect(3.16, 6.79, 0.49);
  phoneBezelShape.holes.push(
    roundedRect(phoneScreenOpeningWidth, phoneScreenOpeningHeight, phoneScreenOpeningRadius)
  );
  const phoneBezel = new THREE.Mesh(
    new THREE.ShapeGeometry(phoneBezelShape, 24),
    glassMaterial
  );
  phoneBezel.position.z = 0.218;
  phone.add(phoneBezel);

  const island = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(0.91, 0.265, 0.13), 20),
    new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.1, clearcoat: 1 })
  );
  island.position.set(0, 3.08, 0.224);
  phone.add(island);

  const addPhoneButton = (side, y, height, width = 0.075) => {
    const geometry = new THREE.ExtrudeGeometry(roundedRect(width, height, width / 2), {
      depth: 0.055,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.012,
      bevelThickness: 0.01,
      curveSegments: 12,
    });
    geometry.center();
    const button = new THREE.Mesh(geometry, metalMaterial);
    button.rotation.y = Math.PI / 2;
    button.position.set(side * 1.672, y, -0.01);
    phone.add(button);
  };
  addPhoneButton(-1, 2.03, 0.38);
  addPhoneButton(-1, 1.22, 0.66);
  addPhoneButton(-1, 0.37, 0.66);
  addPhoneButton(1, 1.02, 1.18);
  addPhoneButton(1, -1.48, 0.64, 0.085);

  macbook.position.set(1.1, 0.75, -1.05);
  macbook.rotation.x = -0.035;
  phone.position.set(-4.35, -1.55, 4.8);
  phone.rotation.set(0, 0, 0);
  phone.scale.setScalar(0.74);
  deviceGroup.add(macbook, phone);
  scene.add(deviceGroup);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a4f5b, 3));
  const keyLight = new THREE.DirectionalLight(0xffffff, 5.4);
  keyLight.position.set(-5, 8, 9);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xa9bfff, 4.4);
  rimLight.position.set(7, -2, 5);
  scene.add(rimLight);
  const fillLight = new THREE.DirectionalLight(0xdce7ff, 2.4);
  fillLight.position.set(4, 4, -2);
  scene.add(fillLight);
  camera.position.set(0, 0.7, 19.5);
  camera.lookAt(0, -0.2, 0);

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    phone.scale.setScalar(width < 600 ? 0.88 : 0.74);
    phone.position.x = width < 600 ? -4.05 : -4.35;
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
    if (reducedMotion.matches || !finePointer.matches) return;
    const rect = host.getBoundingClientRect();
    const x = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width, 0, 1) - 0.5;
    const y = THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height, 0, 1) - 0.5;
    pointerTarget.set(x * 0.16, y * 0.07);
  };

  const resetPointer = () => pointerTarget.set(0, 0);

  const render = (time) => {
    const elapsed = enteredAt ? time - enteredAt : 0;
    const entrance = reducedMotion.matches
      ? 1
      : 1 - Math.pow(1 - THREE.MathUtils.clamp(elapsed / 1550, 0, 1), 4);
    const phoneLead = reducedMotion.matches
      ? 1
      : 1 - Math.pow(1 - THREE.MathUtils.clamp((elapsed + 160) / 1450, 0, 1), 4);
    const idle = reducedMotion.matches ? 0 : Math.sin(time * 0.00055);
    pointerCurrent.lerp(pointerTarget, 0.045);

    const interactionX = finePointer.matches ? -pointerCurrent.y : scrollInfluence * 0.07;
    const interactionY = finePointer.matches ? pointerCurrent.x : scrollInfluence * 0.17;
    deviceGroup.rotation.x = interactionX * entrance;
    deviceGroup.rotation.y = interactionY * entrance;
    deviceGroup.rotation.z = (finePointer.matches ? pointerCurrent.x * 0.035 : 0) * entrance;
    deviceGroup.position.x = THREE.MathUtils.lerp(0.9, -0.15, entrance);
    deviceGroup.position.y = THREE.MathUtils.lerp(-0.45, 0.34 + idle * 0.04, entrance);
    deviceGroup.position.z = THREE.MathUtils.lerp(-0.8, 0, entrance);

    const responsiveScale = host.clientWidth < 600 ? 0.52 : 0.76;
    deviceGroup.scale.setScalar(THREE.MathUtils.lerp(responsiveScale * 0.9, responsiveScale, entrance));
    phone.position.z = THREE.MathUtils.lerp(4.1, 4.8 + idle * 0.04, phoneLead);
    macbook.position.z = -1.05 + idle * 0.012;
    keyLight.position.x = -5 + idle * 0.35;
    rimLight.position.y = -2 + idle * 0.25;

    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !frameId) {
      if (!enteredAt) enteredAt = performance.now();
      macVideo?.play().catch(() => {});
      frameId = requestAnimationFrame(render);
    } else if (!entry.isIntersecting && frameId) {
      macVideo?.pause();
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  });

  resize();
  updateScrollInfluence();
  host.classList.add("is-ready");
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
