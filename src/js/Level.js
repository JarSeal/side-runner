import * as THREE from 'three';
import * as CANNON from 'cannon';

class Level {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.createLevel();
    }

    createLevel() {
        // Add ground
        const gSize = [5, 0.2, 2];
        const gPos = [0, 0, 0];
        const groundGeo = new THREE.BoxBufferGeometry(gSize[0], gSize[1], gSize[2]);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.position.set(gPos[0], gPos[1], gPos[2]);
        const groundBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(gPos[0] / 2, gPos[1] / 2, gPos[2] / 2),
            shape: new CANNON.Box(new CANNON.Vec3(gSize[0] / 2, gSize[1] / 2, gSize[2] / 2))
        });
        this.sceneState.physics.addShape(groundMesh, groundBody);

        // Add upper level

    }

    getStartPosition() {
        return [0, 8, 0];
    }

    isPlayerDead(player) {
        if(player.body.position.y < -20) {
            // DEAD!
            console.log('WASTED!');
            const startPos = this.getStartPosition();
            player.body.quaternion.set(0, 0, 0, 1);
            player.body.velocity.setZero();
            player.body.initVelocity.setZero();
            player.body.angularVelocity.setZero();
            player.body.initAngularVelocity.setZero();
            player.body.force.setZero();
            player.body.torque.setZero();
            player.body.position = new CANNON.Vec3(startPos[0], startPos[1], startPos[2]);
        }
    }
}

export default Level;