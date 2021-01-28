import * as THREE from 'three';
import * as CANNON from 'cannon';

class Level {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.createLevel();
    }

    createLevel() {
        // Basic ground material
        const groundMaterial = new CANNON.Material({
            friction: 0.3
        });

        // Add ground
        const gSize = [20, 0.2, 2];
        const gPos = [8, 0, 0];
        const groundGeo = new THREE.BoxBufferGeometry(gSize[0], gSize[1], gSize[2]);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.position.set(gPos[0], gPos[1], gPos[2]);
        const groundBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(gPos[0], gPos[1], gPos[2]),
            shape: new CANNON.Box(new CANNON.Vec3(gSize[0] / 2, gSize[1] / 2, gSize[2] / 2)),
            material: groundMaterial
        });
        this.sceneState.physics.addShape({ mesh: groundMesh, body: groundBody }, false);

        // Add upper level
        const g2Size = [5, 0.2, 2];
        const g2Pos = [10, 3, 0];
        const ground2Geo = new THREE.BoxBufferGeometry(g2Size[0], g2Size[1], g2Size[2]);
        const ground2Mat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const ground2Mesh = new THREE.Mesh(ground2Geo, ground2Mat);
        ground2Mesh.position.set(g2Pos[0], g2Pos[1], g2Pos[2]);
        const ground2Body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(g2Pos[0], g2Pos[1], g2Pos[2]),
            shape: new CANNON.Box(new CANNON.Vec3(g2Size[0] / 2, g2Size[1] / 2, g2Size[2] / 2)),
            material: groundMaterial
        });
        this.sceneState.physics.addShape({ mesh: ground2Mesh, body: ground2Body }, false);

        // Add another level
        const g3Size = [2, 0.2, 2];
        const g3Pos = [15, 1.65, 0];
        const ground3Geo = new THREE.BoxBufferGeometry(g3Size[0], g3Size[1], g3Size[2]);
        const ground3Mat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const ground3Mesh = new THREE.Mesh(ground3Geo, ground3Mat);
        ground3Mesh.position.set(g3Pos[0], g3Pos[1], g3Pos[2]);
        const ground3Body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(g3Pos[0], g3Pos[1], g3Pos[2]),
            shape: new CANNON.Box(new CANNON.Vec3(g3Size[0] / 2, g3Size[1] / 2, g3Size[2] / 2)),
            material: groundMaterial
        });
        this.sceneState.physics.addShape({ mesh: ground3Mesh, body: ground3Body }, false);

        this.createRandomBoxes();
    }

    createRandomBoxes() {
        const amount = 100;
        let created = 0;
        const createBox = (xVelo, aVelo, color) => {
            const bSize = [0.5, 0.5, 0.5];
            const bPos = [10, 12, this.randomIntFromInterval(-12, 12) / 100];
            const boxGeo = new THREE.BoxBufferGeometry(bSize[0], bSize[1], bSize[2]);
            const boxMat = new THREE.MeshLambertMaterial({ color: color || 0xffffff });
            const boxMesh = new THREE.Mesh(boxGeo, boxMat);
            boxMesh.position.set(bPos[0], bPos[1], bPos[2]);
            const boxBody = new CANNON.Body({
                mass: 10,
                position: new CANNON.Vec3(bPos[0], bPos[1], bPos[2]),
                shape: new CANNON.Box(new CANNON.Vec3(bSize[0] / 2, bSize[1] / 2, bSize[2] / 2)),
                material: new CANNON.Material({ friction: 0.3 })
            });
            boxBody.velocity.x = xVelo;
            boxBody.angularVelocity.z = aVelo;
            boxBody.allowSleep = true;
            boxBody.sleepSpeedLimit = 0.1;
            boxBody.sleepTimeLimit = 1;
            const updateFn = (shape) => {
                if(shape.body.position.y < -20) {
                    console.log('kill box..');
                    shape.mesh.geometry.dispose();
                    shape.mesh.material.dispose();
                    this.sceneState.scene.remove(shape.mesh);
                    this.sceneState.physics.world.remove(shape.body);
                    const id = shape.id;
                    this.sceneState.physics.shapes = this.sceneState.physics.shapes.filter(shape => id !== shape.id);
                    this.sceneState.physics.shapesLength--;
                }
            };
            this.sceneState.physics.addShape({ mesh: boxMesh, body: boxBody, updateFn }, true);
        };
        const interval = setInterval(() => {
            let xVelo = this.randomIntFromInterval(0, 2);
            if(Math.random > 0.5) xVelo *= -1;
            let aVelo = this.randomIntFromInterval(0, 5);
            if(Math.random > 0.5) aVelo *= -1;
            const colors = [0xffffff, 0x333333, 0x777777, 0xcccccc, 0x999999];
            const color = colors[this.randomIntFromInterval(0, 4)];
            createBox(xVelo, aVelo, color);
            created++;
            if(created === amount) clearInterval(interval);
        }, 500);
    }

    randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    getStartPosition() {
        return [0, 8, 0];
    }

    isPlayerDead(player) {
        if(player.body.position.y < -20) {
            // DEAD!
            alert('WASTED!');
            this.sceneState.playerClass.actionStopMove('left');
            this.sceneState.playerClass.actionStopMove('right');
            const startPos = this.getStartPosition();
            player.body.quaternion.set(0, 0, 0, 1);
            player.body.velocity.setZero();
            player.body.initVelocity.setZero();
            player.body.angularVelocity.setZero();
            player.body.initAngularVelocity.setZero();
            player.body.force.setZero();
            player.body.torque.setZero();
            player.body.position = new CANNON.Vec3(startPos[0], startPos[1], startPos[2]);
            if(player.zIroning) clearInterval(player.zIroning);
            player.zIroning = false;
            this.sceneState.playerClass.doTumbling(true);
        }
    }
}

export default Level;