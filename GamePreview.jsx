
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function GamePreview() {
  const host = useRef(null);
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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    node.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xb8d8ff, 0x17202c, 2));

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

    scene.add(new THREE.GridHelper(220, 110, 0x34505b, 0x263d48));

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
      0x567b80, 0x6b718e, 0x8b775e, 0x3c7771
    ].map(color =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
    );

    for (let i = 0; i < 38; i++) {
      const height = 1.5 + Math.random() * 5;
      const mesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.8 + Math.random() * 1.5),
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

    const keys = new Set();

    const down = event => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault();
        keys.add(key);
      }
    };

    const up = event => keys.delete(event.key.toLowerCase());

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    let yaw = 0;
    let dragging = false;
    let lastX = 0;

    const pointerDown = event => {
      dragging = true;
      lastX = event.clientX;
    };

    const pointerMove = event => {
      if (dragging) {
        yaw -= (event.clientX - lastX) * 0.006;
        lastX = event.clientX;
      }
    };

    const pointerUp = () => {
      dragging = false;
    };

    renderer.domElement.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);

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

    function animate() {
      if (disposed) return;

      frame = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.04);

      const forward =
        (keys.has('w') || keys.has('arrowup') ? 1 : 0) -
        (keys.has('s') || keys.has('arrowdown') ? 1 : 0);

      const side =
        (keys.has('d') || keys.has('arrowright') ? 1 : 0) -
        (keys.has('a') || keys.has('arrowleft') ? 1 : 0);

      const direction = new THREE.Vector3(side, 0, -forward)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

      if (direction.lengthSq()) {
        direction.normalize();
        player.position.addScaledVector(direction, dt * 8);
        player.rotation.y = Math.atan2(direction.x, direction.z) + Math.PI;
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

    setHelp('WASD / arrow keys to move • Drag to look around');
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();

      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);

      renderer.domElement.removeEventListener('pointerdown', pointerDown);

      scene.traverse(object => {
        object.geometry?.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach(material => material.dispose());
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === node) {
        node.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section style={{ marginTop: 24, padding: 16, background: '#101827', borderRadius: 16 }}>
      <h3 style={{ color: 'white' }}>3D Exploration Prototype</h3>
      <div
        ref={host}
        style={{ width: '100%', height: 420, overflow: 'hidden', borderRadius: 12 }}
      />
      <p style={{ color: '#aab8ca' }}>{help}</p>
    </section>
  );
}
