import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

document.querySelectorAll("[data-demo-phone-3d]").forEach((host) => {
  const video = host.querySelector("[data-demo-video]");
  const videoToggle = host.querySelector("[data-demo-video-toggle]");
  const isZoomOutModel = host.getAttribute("data-demo-phone-3d") === "zoom-out";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  const phone = new THREE.Group();
  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  const screenCanvas = document.createElement("canvas");
  const screenContext = screenCanvas.getContext("2d");
  let enteredAt = 0;
  let frameId = 0;
  let hoverTarget = 0;
  let hoverCurrent = 0;
  let loopTimer = 0;
  let entranceTimer = 0;
  let isVisible = false;

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

  const bodyGeometry = new THREE.ExtrudeGeometry(roundedRect(3.26, 6.91, 0.56), {
    depth: 0.29,
    bevelEnabled: true,
    bevelSegments: 8,
    bevelSize: 0.045,
    bevelThickness: 0.04,
    curveSegments: 18,
  });
  bodyGeometry.center();
  phone.add(new THREE.Mesh(bodyGeometry, new THREE.MeshPhysicalMaterial({
    color: 0xb8bdc5,
    metalness: 1,
    roughness: 0.17,
    clearcoat: 0.68,
    clearcoatRoughness: 0.14,
  })));

  const glass = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(3.18, 6.83, 0.51), 24),
    new THREE.MeshPhysicalMaterial({
      color: 0x020305,
      metalness: 0.15,
      roughness: 0.05,
      transmission: 0.08,
      clearcoat: 1,
    })
  );
  glass.position.z = 0.205;
  phone.add(glass);

  const bezelShape = roundedRect(3.16, 6.79, 0.49);
  bezelShape.holes.push(roundedRect(3.08, 6.67, 0.43));
  const bezel = new THREE.Mesh(new THREE.ShapeGeometry(bezelShape, 24), new THREE.MeshPhysicalMaterial({
    color: 0x010102,
    metalness: 0.2,
    roughness: 0.2,
    clearcoat: 0.9,
  }));
  bezel.position.z = 0.213;
  phone.add(bezel);

  screenCanvas.width = 786;
  screenCanvas.height = 1704;
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(3.08, 6.67),
    new THREE.MeshBasicMaterial({ map: screenTexture, transparent: true })
  );
  screen.position.set(0, -0.005, 0.218);
  phone.add(screen);

  const buttonMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xaeb4bd,
    metalness: 1,
    roughness: 0.16,
    clearcoat: 0.66,
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

  scene.add(phone);
  scene.add(new THREE.HemisphereLight(0x65d7ff, 0xffa640, 2.7));
  const keyLight = new THREE.DirectionalLight(0xffe2a3, 4.3);
  keyLight.position.set(-4, 6, 7);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x35d7ff, 3.6);
  rimLight.position.set(5, -2, 4);
  scene.add(rimLight);
  const metalFill = new THREE.DirectionalLight(0x758cff, 2.5);
  metalFill.position.set(4, 2, -1);
  scene.add(metalFill);
  camera.position.set(0, 0, 13.5);

  const drawVideoFrame = () => {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    screenContext.save();
    screenContext.clearRect(0, 0, screenCanvas.width, screenCanvas.height);
    screenContext.beginPath();
    screenContext.roundRect(0, 0, screenCanvas.width, screenCanvas.height, 110);
    screenContext.clip();
    screenContext.fillStyle = "#ffffff";
    screenContext.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
    const sourceAspect = video.videoWidth / video.videoHeight;
    const screenAspect = screenCanvas.width / screenCanvas.height;
    const drawWidth = sourceAspect > screenAspect
      ? screenCanvas.width
      : screenCanvas.height * sourceAspect;
    const drawHeight = sourceAspect > screenAspect
      ? screenCanvas.width / sourceAspect
      : screenCanvas.height;
    screenContext.drawImage(
      video,
      0,
      0,
      video.videoWidth,
      video.videoHeight,
      (screenCanvas.width - drawWidth) / 2,
      (screenCanvas.height - drawHeight) / 2,
      drawWidth,
      drawHeight
    );
    screenContext.restore();
    screenTexture.needsUpdate = true;
    host.classList.add("is-ready");
  };

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const updatePointer = (event) => {
    if (reducedMotion.matches || !window.matchMedia("(pointer: fine)").matches) return;
    const rect = host.getBoundingClientRect();
    const x = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width, 0, 1) - 0.5;
    const y = THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height, 0, 1) - 0.5;
    pointerTarget.set(x * 0.72, y * 0.22);
    hoverTarget = 1;
  };

  const resetPointer = () => {
    pointerTarget.set(0, 0);
    hoverTarget = 0;
  };

  const render = (time) => {
    const elapsed = enteredAt ? time - enteredAt : 0;
    const entranceDelay = isZoomOutModel ? 700 : 0;
    const entranceDuration = isZoomOutModel ? 1800 : 1250;
    const entranceProgress = THREE.MathUtils.clamp(
      (elapsed - entranceDelay) / entranceDuration,
      0,
      1
    );
    const entrance = reducedMotion.matches
      ? 1
      : isZoomOutModel
        ? THREE.MathUtils.smoothstep(entranceProgress, 0, 1)
        : 1 - Math.pow(1 - entranceProgress, 4);
    pointerCurrent.lerp(pointerTarget, 0.045);
    hoverCurrent = THREE.MathUtils.lerp(hoverCurrent, hoverTarget, 0.06);
    drawVideoFrame();

    const targetX = isZoomOutModel
      ? 0
      : THREE.MathUtils.lerp(-0.055, -pointerCurrent.y, hoverCurrent);
    const targetY = isZoomOutModel
      ? 0
      : THREE.MathUtils.lerp(-0.3, pointerCurrent.x, hoverCurrent);
    const targetZ = isZoomOutModel
      ? 0
      : THREE.MathUtils.lerp(-0.025, pointerCurrent.x * 0.06, hoverCurrent);
    phone.rotation.x = THREE.MathUtils.lerp(isZoomOutModel ? 0 : -0.16, targetX, entrance);
    phone.rotation.y = THREE.MathUtils.lerp(isZoomOutModel ? 0 : -0.82, targetY, entrance);
    phone.rotation.z = THREE.MathUtils.lerp(isZoomOutModel ? 0 : -0.05, targetZ, entrance);
    const entranceY = isZoomOutModel ? -1.65 : -0.22;
    const settledY = isZoomOutModel ? -0.35 : 0;
    phone.position.y = THREE.MathUtils.lerp(entranceY, settledY, entrance);
    const responsiveScale = host.clientWidth < 600 ? 0.88 : 1;
    const entranceScale = isZoomOutModel ? responsiveScale * 1.24 : responsiveScale * 0.94;
    const settledScale = isZoomOutModel ? responsiveScale * 1.08 : responsiveScale;
    phone.scale.setScalar(THREE.MathUtils.lerp(entranceScale, settledScale, entrance));

    const sheen = reducedMotion.matches ? 0 : Math.sin(time * 0.0011);
    rimLight.intensity = 3.6 + sheen * 0.3;
    metalFill.intensity = 2.5 - sheen * 0.2;

    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };

  const observerThreshold = isZoomOutModel ? 0.8 : 0;
  const applyZoomOutStartPose = () => {
    const responsiveScale = host.clientWidth < 600 ? 0.88 : 1;
    phone.rotation.set(0, 0, 0);
    phone.position.y = -1.65;
    phone.scale.setScalar(responsiveScale * 1.24);
    if (!frameId) {
      drawVideoFrame();
      renderer.render(scene, camera);
    }
  };
  const scheduleZoomOutEntrance = () => {
    if (!isZoomOutModel || reducedMotion.matches) return;
    window.clearTimeout(entranceTimer);
    enteredAt = 0;
    applyZoomOutStartPose();
    entranceTimer = window.setTimeout(() => {
      if (isVisible) enteredAt = performance.now();
    }, 450);
  };
  const observer = new IntersectionObserver(([entry]) => {
    const shouldAnimate = isZoomOutModel
      ? entry.intersectionRatio >= observerThreshold
      : entry.isIntersecting;
    isVisible = shouldAnimate;
    if (shouldAnimate && !frameId) {
      if (isZoomOutModel) {
        scheduleZoomOutEntrance();
      } else if (!enteredAt) {
        enteredAt = performance.now();
      }
      video.play().catch(() => {});
      frameId = requestAnimationFrame(render);
    } else if (!shouldAnimate && frameId) {
      video.pause();
      window.clearTimeout(loopTimer);
      window.clearTimeout(entranceTimer);
      cancelAnimationFrame(frameId);
      frameId = 0;
      if (isZoomOutModel) {
        enteredAt = 0;
        applyZoomOutStartPose();
      }
    }
  }, { threshold: observerThreshold });

  video.addEventListener("ended", () => {
    window.clearTimeout(loopTimer);
    loopTimer = window.setTimeout(() => {
      video.currentTime = 0;
      if (isVisible) {
        if (isZoomOutModel) enteredAt = performance.now();
        video.play().catch(() => {});
      }
    }, 1000);
  });

  if (videoToggle) {
    const syncVideoToggle = () => {
      videoToggle.setAttribute(
        "aria-label",
        video.paused ? "Play video preview" : "Pause video preview"
      );
    };
    videoToggle.addEventListener("click", () => {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
    video.addEventListener("play", syncVideoToggle);
    video.addEventListener("pause", syncVideoToggle);
    syncVideoToggle();
  }

  resize();
  observer.observe(host);
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", scheduleZoomOutEntrance, { passive: true });
  host.addEventListener("pointermove", updatePointer, { passive: true });
  host.addEventListener("pointerleave", resetPointer, { passive: true });
});