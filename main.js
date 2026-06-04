import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

// 1. シーン・カメラ・レンダラーの設定
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 7);

const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// ライト
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(2, 4, 5);
scene.add(directionalLight);

// 床（グリッド）
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// カウンター要素
const countElement = document.getElementById('object-count');
function updateCounter() {
    if (countElement) countElement.textContent = objects.length;
}

// 2. 初期立体図形の配置
const geometries = [
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.SphereGeometry(0.6, 32, 32),
    new THREE.ConeGeometry(0.6, 1.2, 32),
    new THREE.ConeGeometry(0.7, 1.2, 4)
];
const objects = [];

for (let i = 0; i < geometries.length; i++) {
    const geometry = geometries[i];
    // 個別にマテリアルを生成（複製時に色が独立するように）
    const material = new THREE.MeshStandardMaterial({ 
        color: Math.random() * 0xffffff,
        roughness: 0.4
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((i - 1.5) * 2, 0.6, 0);
    if (i === 3) mesh.rotation.y = Math.PI / 4;

    scene.add(mesh);
    objects.push(mesh);
}

updateCounter();

// 3. TransformControlsの設定
const transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls.getHelper());

// 4. マウスとレイキャスターの設定
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    if (transformControls.dragging) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        transformControls.attach(hitObject);
    } else {
        transformControls.detach();
    }
});

// 5. キーボード操作（追加・回転・モード切替・削除）
window.addEventListener('keydown', (event) => {
    const selectedObject = transformControls.object;

    switch (event.key) {
        case 'w':
            transformControls.setMode('translate');
            break;
        case 'e':
            transformControls.setMode('rotate');
            break;
        case 'r':
            transformControls.setMode('scale');
            break;
        
        // ★ 新機能：選択した立体図形を複製して追加（Cキー）
        case 'c':
        case 'C':
            if (selectedObject) {
                // 形状（Geometry）とマテリアル（Material）をコピー
                const clonedGeometry = selectedObject.geometry.clone();
                const clonedMaterial = selectedObject.material.clone();
                
                // 新しいメッシュを作成
                const clonedMesh = new THREE.Mesh(clonedGeometry, clonedMaterial);
                
                // 元のオブジェクトのパラメータを継承
                clonedMesh.position.copy(selectedObject.position);
                clonedMesh.rotation.copy(selectedObject.rotation);
                clonedMesh.scale.copy(selectedObject.scale);
                
                // 重なって見えなくならないように、少しだけ位置をずらす（X軸とZ軸に+0.5）
                clonedMesh.position.x += 0.5;
                clonedMesh.position.z += 0.5;
                
                // シーンと管理配列に追加
                scene.add(clonedMesh);
                objects.push(clonedMesh);
                
                // カウンターの更新
                updateCounter();
                
                // 操作対象を新しく作った図形に自動で切り替える
                transformControls.attach(clonedMesh);
            }
            break;
        
        // 矢印キーでの精密回転
        case 'ArrowLeft':
            if (selectedObject) selectedObject.rotation.y -= Math.PI / 12;
            break;
        case 'ArrowRight':
            if (selectedObject) selectedObject.rotation.y += Math.PI / 12;
            break;
        case 'ArrowUp':
            if (selectedObject) selectedObject.rotation.x -= Math.PI / 12;
            break;
        case 'ArrowDown':
            if (selectedObject) selectedObject.rotation.x += Math.PI / 12;
            break;

        // 削除
        case 'Delete':
        case 'Backspace':
            if (selectedObject) {
                transformControls.detach();
                scene.remove(selectedObject);
                selectedObject.geometry.dispose();
                selectedObject.material.dispose();
                objects.splice(objects.indexOf(selectedObject), 1);
                updateCounter();
            }
            break;
    }
});

// 6. アニメーションループ
function animate() {
    requestAnimationFrame(animate);

    objects.forEach(obj => {
        if (obj === transformControls.object && transformControls.dragging) return;
        obj.rotation.y += 0.005;
    });

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();