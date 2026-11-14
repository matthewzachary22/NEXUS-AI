
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function GamePreview() {
  const host = useRef(null);
  const touchRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false
  });

  const [help, setHelp] = useState('Loading 3D world…');

  useEffect(() => {
    const node = host.current;
    if (!node) return;

    let renderer;
    let frame;
    let observer;
    let disposed = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050914);
    scene.fog = new THREE.Fog(0x050914, 28, 105);

    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 250);
    camera.position.set(0, 5, 9);

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'low-power'
      });
    } catch {
      setHelp('This browser could not start WebGL.');
      return;
    }

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.5)
    );

    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    node.appendChild(renderer.domElement);

    scene.add(
      new THREE.HemisphereLight(0xb8d8ff, 0x17202c, 2)
    );

    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-12, 20, 10);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 220),
      new THREE.MeshStandardMaterial({
        color: 0x182b35,
        roughness: 1
      })
    );

    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    scene.add(
      new THREE.GridHelper(220, 110, 0x34505b, 0x263d48)
    );

    const player = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.42, 0.8, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x64d9ff })
    );

    body.position.y = 0.95;
    player.add(body);

    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0xe8fbff,
        emissive: 0x174c68
      })
    );

    visor.position.set(0, 1.25, -0.32);
    player.add(visor);

    scene.add(player);

    const materials = [
      0x567b80,
      0x6b718e,
      0x8b775e,
      0x3c7771
    ].map(color =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9
      })
    );

    for (let i = 0; i < 38; i++) {
      const height = 1.5 + Math.random() * 5;

      const mesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(
          0.8 + Math.random() * 1.5
        ),
        materials[i % materials.length]
      );

      const angle = Math.random() * Math.PI * 2;
      const radius = 12 + Math.random() * 78;

      mesh.position.set(
        Math.cos(angle) * radius,
        height / 2,
        Math.sin(angle) * radius
      );

      mesh.scale.y = height / 2;
      scene.add(mesh);
    }

    const beacon = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.09, 10, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffd36b,
        emissive: 0x6b3b08
      })
    );

    beacon.position.set(0, 2.2, -13);
    scene.add(beacon);

    // PC keyboard controls
    const keys = new Set();

    const validKeys = [
      'w', 'a', 's', 'd',
      'arrowup', 'arrowdown',
      'arrowleft', 'arrowright'
    ];

    const down = event => {
      const key = event.key.toLowerCase();

      if (validKeys.includes(key)) {
        event.preventDefault();
        keys.add(key);
      }
    };

    const up = event => {
      keys.delete(event.key.toLowerCase());
    };

    const clearKeys = () => keys.clear();

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clearKeys);

    // Mouse and touchscreen camera rotation
    let yaw = 0;
    let dragging = false;
    let lastX = 0;

    const pointerDown = event => {
      dragging = true;
      lastX = event.clientX;

      renderer.domElement.setPointerCapture?.(
        event.pointerId
      );
    };

    const pointerMove = event => {
      if (!dragging) return;

      yaw -= (event.clientX - lastX) * 0.006;
      lastX = event.clientX;
    };

    const pointerUp = () => {
      dragging = false;
    };

    renderer.domElement.addEventListener(
      'pointerdown',
      pointerDown
    );

    renderer.domElement.addEventListener(
      'pointermove',
      pointerMove
    );

    renderer.domElement.addEventListener(
      'pointerup',
      pointerUp
    );

    renderer.domElement.addEventListener(
      'pointercancel',
      pointerUp
    );

    // Responsive rendering
    const resize = () => {
      const width = Math.max(1, node.clientWidth);
      const height = Math.max(1, node.clientHeight);

      renderer.setSize(width, height, false);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    observer = new ResizeObserver(resize);
    observer.observe(node);
    resize();

    const clock = new THREE.Clock();

    // Main game loop
    function animate() {
      if (disposed) return;

      frame = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.04);
      const touch = touchRef.current;

      const forward =
        (
          keys.has('w') ||
          keys.has('arrowup') ||
          touch.forward ? 1 : 0
        ) -
        (
          keys.has('s') ||
          keys.has('arrowdown') ||
          touch.backward ? 1 : 0
        );

      const side =
        (
          keys.has('d') ||
          keys.has('arrowright') ||
          touch.right ? 1 : 0
        ) -
        (
          keys.has('a') ||
          keys.has('arrowleft') ||
          touch.left ? 1 : 0
        );

      const direction = new THREE.Vector3(
        side,
        0,
        -forward
      ).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        yaw
      );

      if (direction.lengthSq()) {
        direction.normalize();

        player.position.addScaledVector(
          direction,
          dt * 8
        );

        player.rotation.y =
          Math.atan2(direction.x, direction.z) +
          Math.PI;
      }

      const behind = new THREE.Vector3(
        Math.sin(yaw) * 8,
        5,
        Math.cos(yaw) * 8
      );

      camera.position.lerp(
        player.position.clone().add(behind),
        1 - Math.pow(0.001, dt)
      );

      camera.lookAt(
        player.position.x,
        player.position.y + 1.1,
        player.position.z
      );

      beacon.rotation.y += dt * 0.6;

      renderer.render(scene, camera);
    }

    setHelp(
      'PC: WASD / arrow keys to move. Mobile: hold the direction buttons. Drag the world to look around.'
    );

    animate();

    return () => {
      disposed = true;

      cancelAnimationFrame(frame);
      observer?.disconnect();

      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clearKeys);

      renderer.domElement.removeEventListener(
        'pointerdown',
        pointerDown
      );

      renderer.domElement.removeEventListener(
        'pointermove',
        pointerMove
      );

      renderer.domElement.removeEventListener(
        'pointerup',
        pointerUp
      );

      renderer.domElement.removeEventListener(
        'pointercancel',
        pointerUp
      );

      touchRef.current = {
        forward: false,
        backward: false,
        left: false,
        right: false
      };

      scene.traverse(object => {
        object.geometry?.dispose();

        if (object.material) {
          const list = Array.isArray(object.material)
            ? object.material
            : [object.material];

          list.forEach(material => material.dispose());
        }
      });

      renderer.dispose();

      if (renderer.domElement.parentNode === node) {
        node.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Mobile button controls
  const hold = (direction, active) => {
    touchRef.current[direction] = active;
  };

  const controlStyle = {
    width: 48,
    height: 48,
    border: '1px solid #7893aa',
    borderRadius: 12,
    background: 'rgba(18, 35, 52, 0.88)',
    color: 'white',
    fontSize: 22,
    fontWeight: 700,
    touchAction: 'none',
    userSelect: 'none'
  };

  const control = (direction, symbol) => (
    <button
      type="button"
      aria-label={direction}
      onPointerDown={event => {
        event.preventDefault();
        hold(direction, true);
      }}
      onPointerUp={() => hold(direction, false)}
      onPointerLeave={() => hold(direction, false)}
      onPointerCancel={() => hold(direction, false)}
      style={controlStyle}
    >
      {symbol}
    </button>
  );

  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        background: '#101827',
        borderRadius: 16
      }}
    >
      <h3 style={{ color: 'white', marginTop: 0 }}>
        3D Exploration Prototype
      </h3>

      <div
        ref={host}
        style={{
          position: 'relative',
          width: '100%',
          height: 'min(62vh, 520px)',
          minHeight: 340,
          overflow: 'hidden',
          borderRadius: 12,
          background: '#050914',
          touchAction: 'none'
        }}
      >
        {/* Mobile movement pad */}
        <div
          style={{
            position: 'absolute',
            zIndex: 2,
            left: 12,
            bottom: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 48px)',
            gridTemplateRows: 'repeat(2, 48px)',
            gap: 5
          }}
        >
          <span />
          {control('forward', '▲')}
          <span />

          {control('left', '◀')}
          {control('backward', '▼')}
          {control('right', '▶')}
        </div>

        <div
          style={{
            position: 'absolute',
            zIndex: 2,
            right: 12,
            bottom: 12,
            padding: '8px 10px',
            borderRadius: 10,
            color: '#d7e8f5',
            background: 'rgba(18, 35, 52, 0.75)',
            fontSize: 12,
            pointerEvents: 'none'
          }}
        >
          DRAG TO LOOK
        </div>
      </div>

      <p
        style={{
          color: '#aab8ca',
          lineHeight: 1.5
        }}
      >
        {help}
      </p>
    </section>
  );
}
