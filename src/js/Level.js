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
        this.sceneState.physics.addShape(groundMesh, groundBody, false);

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
        this.sceneState.physics.addShape(ground2Mesh, ground2Body, false);

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
        this.sceneState.physics.addShape(ground3Mesh, ground3Body, false, 0xff0000, true);

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