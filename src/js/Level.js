import * as THREE from 'three';
import * as CANNON from 'cannon';

class Level {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.createLevel();
    }

    createLevel() {
        this.createBoxPlane([20, 0.2, 2], [8, 0, 0]);
        this.createBoxPlane([5, 0.2, 2], [10, 3, 0]);
        this.createBoxPlane([2, 0.2, 2], [15, 1.65, 0]);
        this.createBoxPlane([20, 0.2, 2], [27, 5, 0], Math.PI / 8); // Hill
        this.createBoxPlane([20, 0.2, 2], [46.2, 8.82, 0]);

        this.createRandomBoxes();
    }

    createBoxPlane(size, pos, rotation, color, addToGui) {
        if(!rotation) rotation = 0;
        const groundMaterial = new CANNON.Material({
            friction: size.length > 3 ? size[4] : 0.3
        });
        const boxPlaneGeo = new THREE.BoxBufferGeometry(size[0], size[1], size[2]);
        const boxPlaneMat = new THREE.MeshLambertMaterial({ color: color || 0x666666 });
        const boxPlaneMesh = new THREE.Mesh(boxPlaneGeo, boxPlaneMat);
        boxPlaneMesh.position.set(pos[0], pos[1], pos[2]);
        boxPlaneMesh.rotation.z = rotation;
        const boxPlaneBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(pos[0], pos[1], pos[2]),
            shape: new CANNON.Box(new CANNON.Vec3(size[0] / 2, size[1] / 2, size[2] / 2)),
            material: groundMaterial
        });
        boxPlaneBody.quaternion.setFromEuler(0, 0, rotation, 'XYZ');
        boxPlaneBody.allowSleep = true;
        boxPlaneBody.sleepSpeedLimit = 0.1;
        boxPlaneBody.sleepTimeLimit = 1;
        this.sceneState.physics.addShape({ mesh: boxPlaneMesh, body: boxPlaneBody }, false);
        if(addToGui) {
            this.sceneState.gui.add(boxPlaneBody.position, 'x', -250, 250).name('Pos X:').step(0.1).onChange(() => {
                boxPlaneMesh.position.copy(boxPlaneBody.position);
            });
            this.sceneState.gui.add(boxPlaneBody.position, 'y', -250, 250).name('Pos Y:').step(0.1).onChange(() => {
                boxPlaneMesh.position.copy(boxPlaneBody.position);
            });
            this.sceneState.gui.add(boxPlaneBody.position, 'z', -250, 250).name('Pos Z:').step(0.1).onChange(() => {
                boxPlaneMesh.position.copy(boxPlaneBody.position);
            });
            this.sceneState.gui.add(boxPlaneMesh.rotation, 'z', 0, Math.PI * 2).name('Angle:').step(0.001).onChange((value) => {
                boxPlaneBody.quaternion.setFromEuler(0, 0, value, 'XYZ');
                boxPlaneMesh.quaternion.copy(boxPlaneBody.quaternion);
            });
        }
    }

    createRandomBoxes() {
        const amount = 25;
        let created = 0;
        const createBox = (xVelo, aVelo, color) => {
            const bSize = [0.5, 0.5, 0.5];
            const bPos = [10, 12, this.randomIntFromInterval(-12, 12) / 100];
            const boxGeo = new THREE.BoxBufferGeometry(bSize[0], bSize[1], bSize[2]);
            const boxMat = new THREE.MeshLambertMaterial({ color: color || 0xffffff });
            const boxMesh = new THREE.Mesh(boxGeo, boxMat);
            boxMesh.position.set(bPos[0], bPos[1], bPos[2]);
            const boxBody = new CANNON.Body({
                mass: 1,
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