import * as THREE from 'three';
import * as CANNON from 'cannon';

class Player {
    constructor(sceneState, level) {
        this.sceneState = sceneState;
        this.player = {
            maxSpeed: 5,
            maxJumpStrength: 8,
            maxJumpTarget: 300, // ms
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
        boxBody.allowSleep = true;
        boxBody.sleepSpeedLimit = 0.1;
        boxBody.sleepTimeLimit = 1;
        this.sceneState.physics.addShape(boxMesh, boxBody, true, 0xFF0000);
        this.player.mesh = boxMesh;
        this.player.body = boxBody;
        this.player.mesh.scale.x = 0.5;
        this.setupCollisionEvent(boxBody);
    }

    isPlayerGrounded() {
        let curY = parseFloat(this.player.body.position.y).toFixed(5);
        return performance.now() - this.player.lastCollisionTime < 100 ||
            (parseFloat(this.player.lastCollisionHeight) > parseFloat(curY) - 0.1 &&
            parseFloat(this.player.lastCollisionHeight) < parseFloat(curY) + 0.1);
    }

    setupCollisionEvent(body) {
        let contactNormal = new CANNON.Vec3(); // Normal in the contact, pointing *out* of whatever the player touched
        const upAxis = new CANNON.Vec3(0, 1, 0);
        body.addEventListener('collide', (e) => {
            const contact = e.contact;
            // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
            // We do not yet know which one is which! Let's check.
            if(contact.bi.id == body.id) { // bi is the player body, flip the contact normal
                contact.ni.negate(contactNormal);
            } else {
                contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is
            }
            // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
            if(contactNormal.dot(upAxis) > 0.5) { // Use a "good" threshold value between 0 and 1 here!
                this.player.lastCollisionTime = performance.now();
                this.player.lastCollisionHeight = parseFloat(body.position.y).toFixed(5);
            }
        });
        // let prevY = 0;
        // setInterval(() => {
        //     if(body.sleepState !== 2) {
        //         const curY = parseFloat(body.position.y).toFixed(5);
        //         if(body.position.y === prevY) {
        //             this.player.lastCollisionHeight = curY;
        //         }
        //         prevY = curY;
        //     }
        // }, 200);
    }

    getPlayer() {
        return this.player;
    }

    actionJump(startTime) {
        this.player.body.wakeUp();
        if(this.isPlayerGrounded()) {
            const maxTarget = this.player.maxJumpTarget;
            let time = performance.now() - startTime;
            console.log(time);
            if(time > maxTarget && time < maxTarget + 100) {
                time = maxTarget;
            } else if(time > maxTarget) {
                time = maxTarget - (time - maxTarget);
            }
            if(time < 170) time = 170;
            const jumpStrength = time / maxTarget * this.player.maxJumpStrength;
            this.player.body.velocity.y = jumpStrength;
        }
    }

    actionMove = (dir) => {
        let velo = this.player.body.velocity,
            aVelo = this.player.body.angularVelocity;
        console.log(this.sceneState.keysDown);
        this.player.body.wakeUp();
        this.player.moveButtonDown[dir] = true;
        clearInterval(this.player.moveButtonDown[dir+'Interval']);
        this.player.moveButtonDown[dir+'Interval'] = setInterval(() => {
            if(!this.player.moveButtonDown[dir]) {
                clearInterval(this.player.moveButtonDown[dir+'Interval']);
                return;
            }
            if(Math.abs(velo.x) < this.player.maxSpeed) {
                if(dir === 'left') {
                    if(this.sceneState.keysDown.shiftLeft) {
                        // if(!this.isPlayerGrounded()) {
                            aVelo.z += 0.8;
                        // }
                    } else {
                        velo.x -= 0.4;
                    }
                } else if(dir === 'right') {
                    if(this.sceneState.keysDown.shiftLeft) {
                        // if(!this.isPlayerGrounded()) {
                            aVelo.z -= 0.8;
                        // }
                    } else {
                        velo.x += 0.4;
                    }
                }
                if(Math.abs(velo.x) > this.player.maxSpeed) {
                    velo.x = this.player.maxSpeed * (dir == 'left' ? -1 : 1);
                }
                if(Math.abs(aVelo.z) > this.player.maxSpeed) {
                    aVelo.z = this.player.maxSpeed * (dir == 'right' ? -1 : 1);
                }
            }
        }, 20);
    }

    actionStopMove(dir) {
        this.player.moveButtonDown[dir] = false;
        clearInterval(this.player.moveButtonDown[dir+'Interval']);
        this.player.moveButtonDown[dir+'Interval'] = null;
        this.player.body.wakeUp();
    }
}

export default Player;