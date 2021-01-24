import * as THREE from 'three';
import * as CANNON from 'cannon';

class Player {
    constructor(sceneState, level) {
        this.sceneState = sceneState;
        this.player = {};
        this.createPlayer(level);
    }

    createPlayer(level) {
        // Add a box
        const bSize = [1, 1, 1];
        const bPos = level.getStartPosition();
        const boxGeo = new THREE.BoxBufferGeometry(bSize[0], bSize[1], bSize[2]);
        const boxMat = new THREE.MeshLambertMaterial({ color: 0xfff000 });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.set(bPos[0], bPos[1], bPos[2]);
        const boxBody = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(bPos[0] / 2, bPos[1] / 2, bPos[2] / 2),
            shape: new CANNON.Box(new CANNON.Vec3(bSize[0] / 2, bSize[1] / 2, bSize[2] / 2))
        });
        this.sceneState.physics.addShape(boxMesh, boxBody, 0xFF0000);
        this.player.mesh = boxMesh;
        this.player.body = boxBody;
    }

    getPlayer() {
        return this.player;
    }

    actionJump() {
        this.player.body.velocity.y = 5;
    }

    actionMove(dir) {
        if(dir === 'left') {
            this.player.body.velocity.x = -5;
        } else if(dir === 'right') {
            this.player.body.velocity.x = 5;
        }
    }
}

export default Player;