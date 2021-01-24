import * as THREE from 'three';
import * as CANNON from 'cannon';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import * as Stats from './vendor/stats.min.js';
import CannonHelper from './vendor/CannonHelper.js';
import Level from './Level.js';
import Player from './Player.js';
import Controls from './Controls.js';

class Root {
    constructor() {
        this.sceneState = {};

        // Setup renderer [START]
        const renderer = new THREE.WebGLRenderer();
        renderer.setClearColor('#000000');
        const screenSize = this.getScreenResolution();
        renderer.setSize(screenSize.x, screenSize.y);
        renderer.domElement.id = 'main-stage';
        document.body.appendChild(renderer.domElement);
        this.renderer = renderer;
        // Setup renderer [/END]

        // Setup scene and basic lights [START]
        const scene = new THREE.Scene();
        const hemi = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.65);
        hemi.position.set(32, -32, 5);
        scene.add(hemi);
        scene.add(new THREE.AmbientLight(0xffffff, 0.25));
        scene.add(new THREE.AxesHelper(10)); // Helper
        this.scene = scene;
        // Setup scene and basic lights [/END]

        // Setup camera and aspect ratio [START]
        this.aspectRatio = screenSize.x / screenSize.y;
        const camera = new THREE.PerspectiveCamera(45, this.aspectRatio, 0.1, 64);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update();
        this.controls = controls;
        this.camera = camera;
        // Setup camera and aspect ratio [/END]

        // Setup physics (cannon.js) [START]
        const world = new CANNON.World();
        world.gravity.set(0, -9.82, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;
        this.sceneState.physics = {};
        this.sceneState.physics.world = world;
        this.sceneState.physics.timeStep = 1 / 60;
        this.sceneState.physics.maxSubSteps = 3;
        this.sceneState.physics.addShape = this.addShapeToPhysics;
        this.sceneState.physics.shapes = [];
        this.world = world;
        this.helper = new CannonHelper(scene, world);
        // Setup physics (cannon.js) [/END]

        // Setup debug statisctics [START]
        const createStats = () => {
            const s = new Stats();
            s.setMode(0);
            return s;
        };
        this.stats = createStats();
        this.stats.domElement.id = 'debug-stats-wrapper';
        document.body.appendChild(this.stats.domElement);
        // Setup debug statisctics [/END]

        // Other setup [START]
        this.sceneState.clock = new THREE.Clock(),
        this.sceneState.resizeFns = [this.resize],
        this.sceneState.getScreenResolution = this.getScreenResolution;
        this.sceneState.defaultSettings = {
            showStats: true
        };
        this.sceneState.settings = { ...this.sceneState.defaultSettings };
        this.initResizer();
        // Other setup [/END]

        // GUI setup [START]
        const gui = new GUI();
        gui.close();
        gui.add(this.sceneState.settings, 'showStats').name('Show stats').onChange((value) => {
            document.getElementById('debug-stats-wrapper').style.display = value ? 'block' : 'none';
        });
        this.sceneState.gui = gui;
        // GUI setup [/END]

        this.runApp(camera, this.sceneState);
    }

    runApp(camera, sceneState) {

        // Main app logic [START]
        camera.position.set(1, 1, 10);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        const level = new Level(sceneState);
        const player = new Player(sceneState, level);
        const controls = new Controls(sceneState, player);
        sceneState.level = level;
        sceneState.player = player;

        // Main app logic [/END]

        this.resize(this.sceneState, this.renderer);
        this.renderLoop();

    }

    renderLoop = () => {
        requestAnimationFrame(this.renderLoop);
        const delta = this.sceneState.clock.getDelta();
        const player = this.sceneState.player.getPlayer();
        this.updatePhysics(delta);
        this.updateCamera(player);
        this.sceneState.level.isPlayerDead(player);
        this.renderer.render(this.scene, this.camera);
        if(this.sceneState.settings.showStats) this.stats.update(); // Debug statistics
    }

    updateCamera(player) {
        this.camera.position.set(
            player.body.position.x + 1,
            player.body.position.y + 1,
            player.body.position.z + 10
        );
        this.camera.lookAt(new THREE.Vector3(
            player.body.position.x,
            player.body.position.y,
            player.body.position.z
        ));
    }

    updatePhysics(delta) {
        let i;
        const l = this.sceneState.physics.shapesLength,
            s = this.sceneState.physics.shapes,
            settings = this.sceneState.settings;
        this.world.step(this.sceneState.physics.timeStep, delta, this.sceneState.physics.maxSubSteps);
        for(i=0; i<l; i++) {
            s[i].mesh.position.copy(s[i].body.position);
            s[i].mesh.quaternion.copy(s[i].body.quaternion);
        }
        if(settings.showPhysicsHelpers) this.helper.update();
    }

    addShapeToPhysics = (mesh, body, helperColor) => {
        if(!this.sceneState.settings.showPhysicsHelpers) this.scene.add(mesh);
        this.world.addBody(body);
        this.sceneState.physics.shapes.push({ mesh, body });
        this.sceneState.physics.shapesLength = this.sceneState.physics.shapes.length;
        if(this.sceneState.settings.showPhysicsHelpers) this.helper.addVisual(body, helperColor || 0xFFFFFF);
    }

    resize(sceneState, renderer) {
        const width = sceneState.getScreenResolution().x;
        const height = sceneState.getScreenResolution().y;
        const pixelRatio = window.devicePixelRatio || 1;
        document.getElementsByTagName('body')[0].style.width = width + 'px';
        document.getElementsByTagName('body')[0].style.height = height + 'px';
        renderer.setSize(width, height);
        renderer.setPixelRatio(pixelRatio);
    }

    initResizer() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                let i;
                const fns = this.sceneState.resizeFns,
                    fnsLength = fns.length;
                for(i=0; i<fnsLength; i++) {
                    fns[i](
                        this.sceneState,
                        this.renderer,
                        this.scene,
                        this.camera
                    );
                }
            }, 500);
        });
    }

    getScreenResolution() {
        return {
            x: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            y: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    }
}

new Root();