import * as THREE from 'three';
import * as CANNON from 'cannon';

class Player {
    constructor(sceneState, level) {
        this.sceneState = sceneState;
        this.player = {
            maxSpeed: 5,
            jumpStrength: 7,
            moveButtonDown: {
                left: false,
                right: false,
                leftInterval: null,
                rightInterval: null
            }
        };
        this.createPlayer(level);
    }

    createPlayer(level) {
        // Add a box
        const bSize = [1, 1, 1];
        const bPos = level.getStartPosition();
        const boxGeo = new THREE.BoxBufferGeometry(bSize[0], bSize[1], bSize[2]);
        const boxMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.set(bPos[0], bPos[1], bPos[2]);
        const boxMaterial = new CANNON.Material();
        boxMaterial.friction = 0.01;
        const boxBody = new CANNON.Body({
            mass: 50,
            position: new CANNON.Vec3(bPos[0], bPos[1], bPos[2]),
            shape: new CANNON.Box(new CANNON.Vec3(bSize[0] / 2, bSize[1] / 2, bSize[2] / 2)),
            material: boxMaterial
        });
        this.sceneState.physics.addShape(boxMesh, boxBody, true, 0xFF0000);
        this.player.mesh = boxMesh;
        this.player.body = boxBody;
    }

    getPlayer() {
        return this.player;
    }

    actionJump() {
        this.player.body.velocity.y = this.player.jumpStrength;
    }

    actionMove(dir) {
        let velo = this.player.body.velocity,
            directionInfluence = 1;
        this.player.moveButtonDown[dir] = true;
        this.player.moveButtonDown[dir+'Interval'] = setInterval(() => {
            if(!this.player.moveButtonDown[dir]) {
                clearInterval(this.player.moveButtonDown[dir+'Interval']);
                return;
            }
            if(Math.abs(velo.x) < this.player.maxSpeed) {
                if(dir === 'left') {
                    velo.x -= .4;
                    directionInfluence = -1;
                } else if(dir === 'right') {
                    velo.x += .4;
                }
                if(Math.abs(velo.x) > this.player.maxSpeed) {
                    velo.x = this.player.maxSpeed * directionInfluence;
                }
            }
        }, 20);
    }

    actionStopMove(dir) {
        this.player.moveButtonDown[dir] = false;
        clearInterval(this.player.moveButtonDown[dir+'Interval']);
        this.player.moveButtonDown[dir+'Interval'] = null;
    }
}

export default Player;