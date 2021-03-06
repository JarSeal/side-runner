import * as THREE from 'three';
import * as CANNON from 'cannon';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples//jsm/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { TimelineMax } from 'gsap-ssr';
import * as Stats from './vendor/stats.min.js';
import CannonHelper from './vendor/CannonHelper.js';
import LStorage from './utils/LocalStorage.js';
import Level from './Level.js';
import Player from './Player.js';
import Controls from './Controls.js';
import UI from './UI/UI.js';

class Root {
    constructor() {
        this.sceneState = {};

        // Setup renderer [START]
        const renderer = new THREE.WebGLRenderer();
        renderer.setClearColor('#000000');
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = Math.pow(1.1, 4.0);
        const screenSize = this.getScreenResolution();
        renderer.setSize(screenSize.x, screenSize.y);
        renderer.domElement.id = 'main-stage';
        document.body.appendChild(renderer.domElement);
        this.renderer = renderer;
        // Setup renderer [/END]

        // Setup scene and basic lights [START]
        const scene = new THREE.Scene();
        const hemi = new THREE.HemisphereLight(0xfefefe, 0x080808, 1);
        hemi.position.set(32, 32, 5);
        scene.add(hemi);
        scene.add(new THREE.AmbientLight(0xffffff, 0.25));
        // scene.add(new THREE.AxesHelper(10)); // Helper
        this.sceneState.scene = scene;
        this.scene = scene;
        // Setup scene and basic lights [/END]

        // Setup camera and aspect ratio [START]
        this.aspectRatio = screenSize.x / screenSize.y;
        const camera = new THREE.PerspectiveCamera(45, this.aspectRatio, 0.1, 64);
        const cameraControls = new OrbitControls(camera, renderer.domElement);
        cameraControls.update();
        this.cameraControls = cameraControls;
        this.cameraPan = { x: 2 };
        this.cameraMicroPan = { x: 0, y: 0 };
        this.cameraPanTL = null;
        this.camera = camera;
        this.sceneState.camera = camera;
        // Setup camera and aspect ratio [/END]

        // Setup physics (cannon.js) [START]
        const world = new CANNON.World();
        world.allowSleep = true;
        world.gravity.set(0, -9.82, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.iterations = 50;
        world.solver.iterations = 50;
        this.sceneState.physics = {};
        this.sceneState.physics.world = world;
        this.sceneState.physics.timeStep = 1 / 60;
        this.sceneState.physics.maxSubSteps = 5;
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
            showPhysicsHelpers: false,
            showStats: true,
            showVeloMeters: true,
            lockCamera: true,
            useSao: false,
            useBloom: false,
            useSmaa: false
        };
        this.sceneState.isGroundMeshes = [];
        this.sceneState.LStorage = new LStorage();
        this.initResizer();
        this.initSettings();
        // Other setup [/END]

        // Setup postprocessing [START]
        this.sceneState.postProcess = {};
        this.composer = new EffectComposer(renderer);
        this.composer.addPass(new RenderPass(scene, camera));

        this.sceneState.postProcess.saoPass = new SAOPass(scene, camera, false, true);
        this.sceneState.postProcess.saoPass.enabled = this.sceneState.settings.useSao;
        this.sceneState.postProcess.saoPass.params.saoBias = 0.73;
        this.sceneState.postProcess.saoPass.params.saoIntensity = 0.03;
        this.sceneState.postProcess.saoPass.params.saoScale = 2.3;
        this.sceneState.postProcess.saoPass.params.saoKernelRadius = 22;
        this.sceneState.postProcess.saoPass.params.saoBlurRadius = 53.8;
        this.sceneState.postProcess.saoPass.params.saoBlurStdDev = 6.7;
        this.sceneState.postProcess.saoPass.params.saoBlurDepthCutoff = 0.043;
        this.composer.addPass(this.sceneState.postProcess.saoPass);

        this.sceneState.postProcess.unrealBloom = new UnrealBloomPass(
            new THREE.Vector2(
                this.getScreenResolution().x,
                this.getScreenResolution().y
            ), 0.22, 0.008, 0.3);
        this.sceneState.postProcess.unrealBloom.enabled = this.sceneState.settings.useBloom;
        this.composer.addPass(this.sceneState.postProcess.unrealBloom);

        this.sceneState.postProcess.smaa = new SMAAPass(
            window.innerWidth * (window.devicePixelRatio || 1),
            window.innerHeight * (window.devicePixelRatio || 1)
        );
        this.sceneState.postProcess.smaa.enabled = this.sceneState.settings.useSmaa;
        this.composer.addPass(this.sceneState.postProcess.smaa);

        this.sceneState.postProcess.composer = this.composer;
        // Setup postprocessing [/END]

        // GUI setup [START]
        const gui = new GUI();
        this.addGuiItems(gui);
        this.sceneState.gui = gui;
        // GUI setup [/END]

        this.runApp(camera, this.sceneState);
    }

    runApp(camera, sceneState) {

        // Main app logic [START]
        camera.position.set(1, 1, 10);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        const level = new Level(sceneState);
        const playerClass = new Player(sceneState, level);
        new Controls(sceneState, playerClass);
        sceneState.levelClass = level;
        sceneState.playerClass = playerClass;
        sceneState.player = playerClass.getPlayer();
        sceneState.uiClass = new UI(sceneState);

        // Main app logic [/END]

        this.resize(this.sceneState, this.renderer);
        this.cameraMicroMove();
        this.renderLoop();

    }

    renderLoop = () => {
        requestAnimationFrame(this.renderLoop);
        const delta = this.sceneState.clock.getDelta();
        const player = this.sceneState.player;
        this.updatePhysics(delta);
        this.updateCamera(player);
        this.sceneState.uiClass.renderLoop(this.sceneState);
        this.sceneState.levelClass.isPlayerDead(player);
        this.composer.render();
        // this.renderer.render(this.scene, this.camera);
        if(this.sceneState.settings.showStats) this.stats.update(); // Debug statistics
    }

    updateCamera(player) {
        // Camera
        if(!this.sceneState.settings.lockCamera) return;
        const pos = player.body.position;
        const backMesh = this.sceneState.backgroundMesh;
        const panLimits = {
            xPositive: 2,
            xNegative: -2
        };
        let time;
        if (this.cameraPan.x < panLimits.xPositive &&
            player.moveButtonDown.left)
        {
            time = (performance.now() - player.moveButtonDown.leftStarted) / 1000;
            this.cameraPan.x += time / 5 * panLimits.xPositive;
        } else if (this.cameraPan.x > panLimits.xNegative &&
            player.moveButtonDown.right)
        {
            time = (performance.now() - player.moveButtonDown.rightStarted) / 1000;
            this.cameraPan.x += time / 5 * panLimits.xNegative;
        }
        this.camera.position.set(
            pos.x + this.cameraPan.x + this.cameraMicroPan.x,
            pos.y + 4 + this.cameraMicroPan.y,
            pos.z + 15
        );
        this.camera.lookAt(new THREE.Vector3(
            pos.x,
            pos.y + 1,
            pos.z
        ));
        backMesh.position.x = this.camera.position.x;
        backMesh.position.y = this.camera.position.y;
        backMesh.quaternion.copy(this.camera.quaternion);
    }

    cameraMicroMove() {
        const time = Math.floor(Math.random() * (7 - 5 + 1) + 5);
        const xDir = Math.random() < 0.5 ? 1 : -1;
        const yDir = Math.random() < 0.5 ? 1 : -1;
        const amount = Math.floor(Math.random() * (35 - 15 + 1) + 15) / 100;
        this.cameraPanTL = new TimelineMax().to(this.cameraMicroPan, time, {
            x: amount * xDir,
            y: amount * yDir,
            onComplete: () => {
                this.cameraMicroMove();
            }
        });
    }

    updatePhysics(delta) {
        let i, shape;
        const l = this.sceneState.physics.shapesLength,
            s = this.sceneState.physics.shapes,
            settings = this.sceneState.settings;
        this.world.step(this.sceneState.physics.timeStep, delta, this.sceneState.physics.maxSubSteps);
        for(i=0; i<l; i++) {
            shape = s[i];
            shape.body.position.z = shape.mesh.position.z;
            shape.body.quaternion.x = 0;
            shape.body.quaternion.y = 0;
            shape.mesh.position.copy(shape.body.position);
            shape.mesh.quaternion.copy(shape.body.quaternion);
            if(shape.updateFn) shape.updateFn(shape);
        }
        if(settings.showPhysicsHelpers) this.helper.update();
    }

    addShapeToPhysics = (object, moving, helperColor) => {
        const mesh = object.mesh,
            body = object.body,
            updateFn = object.updateFn || null,
            id = 'phyShape-' + performance.now();
        mesh.name = id;
        body.bodyID = id;
        if(!this.sceneState.settings.showPhysicsHelpers) this.scene.add(mesh);
        this.world.addBody(body);
        if(moving) {
            this.sceneState.physics.shapes.push({ id, mesh, body, updateFn });
        }
        this.sceneState.physics.shapesLength = this.sceneState.physics.shapes.length;
        if(this.sceneState.settings.showPhysicsHelpers) {
            let color = helperColor;
            if(!color) moving ? color = 0xFF0000 : color = 0xFFFFFFF;
            this.helper.addVisual(body, color);
        }
    }

    resize = (sceneState, renderer) => {
        const width = sceneState.getScreenResolution().x;
        const height = sceneState.getScreenResolution().y;
        const pixelRatio = window.devicePixelRatio || 1;
        document.getElementsByTagName('body')[0].style.width = width + 'px';
        document.getElementsByTagName('body')[0].style.height = height + 'px';
        sceneState.camera.aspect = width / height;
        sceneState.camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(pixelRatio);
        this.resizePostProcessors(width, height, pixelRatio);
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

    resizePostProcessors(width, height, pixelRatio) {
        if(this.sceneState.postProcess.unrealBloom) {
            this.sceneState.postProcess.unrealBloom.resolution = new THREE.Vector2(width, height);
            this.sceneState.postProcess.unrealBloom.setSize(
                width,
                height
            );
        }
        if(this.sceneState.postProcess.smaa) {
            this.sceneState.postProcess.smaa.setSize(
                width * pixelRatio,
                height * pixelRatio
            );
        }
        this.sceneState.postProcess.composer.setSize(width, height);
        this.sceneState.postProcess.composer.setPixelRatio(pixelRatio);
    }

    getScreenResolution() {
        return {
            x: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            y: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    }

    initSettings() {
        const ls = this.sceneState.LStorage,
            defaults = this.sceneState.defaultSettings,
            defKeys = Object.keys(defaults);
        this.sceneState.settings = {};
        let data;
        defKeys.forEach(key => {
            data = ls.getItem(key);
            if(data) {
                if(typeof defaults[key] === 'boolean') {
                    this.sceneState.settings[key] = (data === 'true');
                } else if(typeof defaults[key] === 'number') {
                    this.sceneState.settings[key] = Number(data);
                } else {
                    // typeof string
                    this.sceneState.settings[key] = data;
                }
            } else {
                this.sceneState.settings[key] = defaults[key];
            }
        });
    }

    addGuiItems(gui) {
        gui.close();
        gui.add(this.sceneState.settings, 'lockCamera').name('Lock camera').onChange(value => {
            this.sceneState.LStorage.setItem('lockCamera', value);
        });
        gui.add(this.sceneState.settings, 'showVeloMeters').name('Show velo meters').onChange(value => {
            this.sceneState.LStorage.setItem('showVeloMeters', value);
        });
        gui.add(this.sceneState.settings, 'showStats').name('Show stats').onChange((value) => {
            document.getElementById('debug-stats-wrapper').style.display = value ? 'block' : 'none';
            this.sceneState.LStorage.setItem('showStats', value);
        });
        gui.add(this.sceneState.settings, 'useSmaa').name('Post: use SMAA').onChange((value) => {
            this.sceneState.postProcess.smaa.enabled = value;
            this.sceneState.LStorage.setItem('useSmaa', value);
        });
        gui.add(this.sceneState.settings, 'useSao').name('Post: use AO').onChange((value) => {
            this.sceneState.postProcess.saoPass.enabled = value;
            this.sceneState.LStorage.setItem('useSao', value);
        });
        gui.add(this.sceneState.settings, 'useBloom').name('Post: use Bloom').onChange((value) => {
            this.sceneState.postProcess.unrealBloom.enabled = value;
            this.sceneState.LStorage.setItem('useBloom', value);
        });

        // const unrealParams = {
        //     exposure: 1.05,
        //     bloomStrength: 0.22,
        //     bloomThreshold: 0.08,
        //     bloomRadius: 0.008
        // };
        // gui.add(unrealParams, 'exposure', 0.1, 2 ).onChange((value) => { this.renderer.toneMappingExposure = Math.pow(value, 4.0); });
        // gui.add(unrealParams, 'bloomThreshold', 0.0, 1.0 ).step( 0.01 ).onChange((value) => { this.sceneState.postProcess.unrealBloom.threshold = Number( value ); });
        // gui.add(unrealParams, 'bloomStrength', 0.0, 3.0 ).onChange((value) => { this.sceneState.postProcess.unrealBloom.strength = Number( value ); });
        // gui.add(unrealParams, 'bloomRadius', 0.0, 1.0 ).step( 0.00001 ).onChange((value) => { this.sceneState.postProcess.unrealBloom.radius = Number( value ); });
        // gui.add(this.sceneState.postProcess.saoPass.params, 'saoBias', - 1, 1 );
        // gui.add(this.sceneState.postProcess.saoPass.params, 'saoIntensity', 0, 1 );
        // gui.add(this.sceneState.postProcess.saoPass.params, 'saoScale', 0, 10 );
        // gui.add(this.sceneState.postProcess.saoPass.params, 'saoKernelRadius', 1, 100 );
        // gui.add(this.sceneState.postProcess.saoPass.params, 'saoMinResolution', 0, 1 );
        // gui.add(this.sceneState.postProcess.saoPass.params, 'saoBlur' );
        // gui.add(this.sceneState.postProcess.saoPass.params, 'saoBlurRadius', 0, 200 );
        // gui.add(this.sceneState.postProcess.saoPass.params, 'saoBlurStdDev', 0.5, 150 );
        // gui.add(this.sceneState.postProcess.saoPass.params, 'saoBlurDepthCutoff', 0.0, 0.1 );
    }
}

new Root();