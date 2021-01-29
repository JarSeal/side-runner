import * as THREE from 'three';
import * as CANNON from 'cannon';
import { TimelineMax } from 'gsap-ssr';

class Player {
    constructor(sceneState, level) {
        this.sceneState = sceneState;
        this.raycaster = new THREE.Raycaster();
        this.player = {
            mesh: null,
            body: null,
            updateFn: this.updateFn,
            causeDamageVeloLimit1: 10,
            causeDamageVeloLimit2: 14,
            maxSpeed: 7,
            maxTumblingSpeed: 15,
            maxJumpStrength: 8,
            maxJumpTarget: 300, // ms
            moveButtonDown: {
                left: false,
                right: false,
                leftInterval: null,
                rightInterval: null
            },
            isGrounded: false,
            yDir: 0,
            yDirPhase: 0,
            zDir: 0,
            zDirPhase: 0,
            tumbling: false,
            angledTilt: 0,
            landingOnFeetTL: null,
            fullSizeMesh: [0.5, 1, 0.5],
            smallSizeMesh: [0.5, 0.5, 0.5],
            fullSizeBody: [0.25, 0.5, 0.25],
            smallSizeBody: [0.25, 0.25, 0.25]
        };
        this.createPlayer(level);
    }

    createPlayer(level) {
        // Add a box
        console.log(this.player);
        const bSize = this.player.fullSizeMesh;
        const bPos = level.getStartPosition();
        const boxGeo = new THREE.BoxBufferGeometry(bSize[0], bSize[1], bSize[2]);
        const boxMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.set(bPos[0], bPos[1], bPos[2]);

        const dirMesh = new THREE.Mesh(boxGeo, boxMat.clone());
        dirMesh.scale.set(0.1, 0.1, 0.1);
        dirMesh.material.color = new THREE.Color(0xffffff);
        dirMesh.position.set(0.25, 0.5, 0);
        boxMesh.add(dirMesh);

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

        this.player.mesh = boxMesh;
        this.player.body = boxBody;
        this.sceneState.physics.addShape(this.player, true);
        this.setupCollisionEvent(boxBody);
    }

    isPlayerGrounded = () => {
        const player = this.player,
            startPoint = player.mesh.position,
            direction = new THREE.Vector3();
        direction.subVectors(new THREE.Vector3(player.mesh.position.x, -2000, 0), startPoint).normalize();
        this.raycaster.set(startPoint, direction, true);
        let intersects = this.raycaster.intersectObjects(this.sceneState.isGroundMeshes),
            isGrounded = false;
        if(intersects && intersects.length) {
            if(player.angledTilt) {
                if(intersects[0].distance < 0.55) isGrounded = true;
            } else {
                if(intersects[0].distance < 0.7) isGrounded = true;
            }
        }
        player.isGrounded = isGrounded;
        return isGrounded;
    }

    setupCollisionEvent(body) {
        let contactNormal = new CANNON.Vec3(); // Normal in the contact, pointing *out* of whatever the player touched
        const upAxis = new CANNON.Vec3(0, 1, 0);
        body.addEventListener('collide', (e) => {
            const contact = e.contact;
            const yVelo = this.player.body.velocity.y;
            const xVelo = this.player.body.velocity.x;
            const aVelo = this.player.body.velocity.z;
            let planeAngle = 0;
            // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
            // We do not yet know which one is which! Let's check.
            if(contact.bi.id == body.id) { // bi is the player body, flip the contact normal
                contact.ni.negate(contactNormal);
                if(contact.bj.isNotLeveled) {
                    planeAngle = contact.bj.eulerAngleZ;
                }
            } else {
                contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is
                if(contact.bi.isNotLeveled) {
                    planeAngle = contact.bi.eulerAngleZ;
                }
            }
            // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
            if(contactNormal.dot(upAxis) > 0.5) { // Use a "good" threshold value between 0 and 1 here!
                if(Math.abs(xVelo) > this.player.causeDamageVeloLimit2 || Math.abs(yVelo) > this.player.causeDamageVeloLimit2) {
                    console.log('TAKE DAMAGE!', yVelo);
                }
                const bodyPos = this.player.body.quaternion;
                this.setAngledTilt(planeAngle);
                if(bodyPos.z < -0.3 || bodyPos.z > 0.3) {
                    if(Math.abs(xVelo) > this.player.causeDamageVeloLimit1 || Math.abs(yVelo) > this.player.causeDamageVeloLimit1) {
                        console.log('TAKE DAMAGE!', yVelo);
                    }
                    if(!this.player.zIroning) {
                        let dir;
                        if(Math.abs(xVelo) > Math.abs(aVelo)) {
                            dir = this.player.body.velocity.x < 0 ? 1 : -1;
                        } else {
                            dir = this.player.body.angularVelocity.z > 0 ? 1: -1;
                        }
                        if(Math.abs(yVelo) > 5) {
                            this.doTumbling();
                        }
                        const curRot = this.player.mesh.rotation;
                        let flipCounter = 0;
                        this.player.zIroning = setInterval(() => {
                            this.player.body.angularVelocity.z = 10 * dir;
                            if((dir === -1 && curRot.z > 0) || (dir === 1 && curRot.z < 0)) flipCounter++;
                            if((dir === -1 && curRot.z < 0 && flipCounter) || (dir === 1 && curRot.z > 0 && flipCounter)) {
                                this.player.body.angularVelocity.z = 0;
                                bodyPos.z = 0;
                                clearInterval(this.player.zIroning);
                                this.player.zIroning = false;
                                this.doTumbling(true);
                            }
                        }, 10);
                    }
                } else {
                    // This is just to set the model straight aftet possible tumbling in the air.
                    this.doTumbling(true);
                    if(!this.player.angledTilt && !this.player.landingOnFeetTL) {
                        this.player.landingOnFeetTL = new TimelineMax().to(bodyPos, 0.2, {
                            z: 0,
                            onComplete: () => {
                                this.player.landingOnFeetTL = null;
                            }
                        });
                    }
                }
            }
        });
    }

    getPlayer() {
        return this.player;
    }

    actionJump = (startTime) => {
        this.player.body.wakeUp();
        if(this.isPlayerGrounded()) {
            const maxTarget = this.player.maxJumpTarget;
            let time = performance.now() - startTime;
            if(time > maxTarget && time < maxTarget + 200) {
                time = maxTarget;
            } else if(time > maxTarget) {
                time = maxTarget - (time - maxTarget);
            }
            if(time < 170) time = 170;
            const jumpStrength = time / maxTarget * this.player.maxJumpStrength;
            this.player.body.velocity.y = jumpStrength;
        }
        setTimeout(() => {
            this.setAngledTilt(0);
        }, 120);
    }

    actionMove = (dir) => {
        let velo = this.player.body.velocity,
            aVelo = this.player.body.angularVelocity;
        this.player.body.wakeUp();
        this.player.moveButtonDown[dir] = true;
        clearInterval(this.player.moveButtonDown['rightInterval']);
        clearInterval(this.player.moveButtonDown['leftInterval']);
        this.player.moveButtonDown[dir+'Interval'] = setInterval(() => {
            const isGrounded = this.isPlayerGrounded(),
                increaseTumbling = 0.5,
                increaseVelo = 0.5,
                breakingForce = 0.2;
            if(!this.player.moveButtonDown[dir]) {
                clearInterval(this.player.moveButtonDown[dir+'Interval']);
                return;
            }
            if(dir === 'left') {
                if(!isGrounded) {
                    aVelo.z += increaseTumbling;
                    velo.x -= increaseVelo * 0.32;
                } else {
                    if(this.sceneState.keysDown.shiftLeft) {
                        velo.x += breakingForce;
                        if(velo.x > 0) velo.x = 0;
                    } else {
                        velo.x -= increaseVelo;
                    }
                    this.changeDirection(1);
                }
            } else if(dir === 'right') {
                if(!isGrounded) {
                    aVelo.z -= increaseTumbling;
                    velo.x += increaseVelo * 0.32;
                } else {
                    if(this.sceneState.keysDown.shiftLeft) {
                        velo.x -= breakingForce;
                        if(velo.x < 0) velo.x = 0;
                    } else {
                        velo.x += increaseVelo;
                    }
                    this.changeDirection(0);
                }
            }
            if(Math.abs(velo.x) > this.player.maxSpeed) {
                velo.x = this.player.maxSpeed * (dir == 'left' ? -1 : 1);
            }
            if(Math.abs(aVelo.z) > this.player.maxTumblingSpeed) {
                aVelo.z = this.player.maxTumblingSpeed * (dir == 'right' ? -1 : 1);
            }
            if(!isGrounded) {
                if(Math.abs(aVelo.z) > this.player.maxTumblingSpeed * 0.95) {
                    this.doTumbling();
                } else {
                    this.doTumbling(true);
                }
            }
            this.player.zDirPhase = this.player.body.quaternion.z;
        }, 20);
    }

    actionStopSpin = () => {
        if(!this.isPlayerGrounded()) {
            this.player.body.angularVelocity.z = 0;
            this.doTumbling(true);
        } else {
            const velo = this.player.body.velocity;
            if(this.player.stopInterval) clearInterval(this.player.stopInterval);
            this.player.stopInterval = setInterval(() => {
                if(this.player.yDir === 0) {
                    velo.x -= 0.2;
                    if(velo.x < 0) {
                        velo.x = 0;
                        clearInterval(this.player.stopInterval);
                    }
                } else {
                    velo.x += 0.2;
                    if(velo.x > 0) {
                        velo.x = 0;
                        clearInterval(this.player.stopInterval);
                    }
                }
            }, 20);
            setTimeout(() => {
                clearInterval(this.player.stopInterval);
            }, 500);
        }
    }

    actionStopMove = (dir) => {
        this.player.moveButtonDown[dir] = false;
        clearInterval(this.player.moveButtonDown[dir+'Interval']);
        this.player.moveButtonDown[dir+'Interval'] = null;
        this.player.body.wakeUp();
    }

    doTumbling(stopTumbling) {
        if((!stopTumbling && this.player.tumbling) ||
            (stopTumbling && !this.player.tumbling) ||
            this.player.angledTilt) return;
        if(stopTumbling) {
            // TEMP TRANSFORMATION, replace with tumbling when model is imported
            this.player.mesh.scale.y = this.player.fullSizeMesh[1];
            this.player.body.shapes[0].halfExtents.y = this.player.fullSizeBody[1];
            this.player.body.shapes[0].boundingSphereRadiusNeedsUpdate = true;
            this.player.body.shapes[0].updateConvexPolyhedronRepresentation();
            this.player.tumbling = false;
        } else {
            // TEMP TRANSFORMATION, replace with tumbling when model is imported
            this.player.mesh.scale.y = this.player.smallSizeMesh[1];
            this.player.body.shapes[0].halfExtents.y = this.player.smallSizeBody[1];
            this.player.body.shapes[0].boundingSphereRadiusNeedsUpdate = true;
            this.player.body.shapes[0].updateConvexPolyhedronRepresentation();
            this.player.tumbling = true;
        }
    }

    setAngledTilt(angle) {
        if(this.player.angledTilt === angle) return;
        if(angle) {
            // TEMP TRANSFORMATION, replace with tumbling when model is imported
            this.player.mesh.scale.x = 2;
            this.player.mesh.scale.y = 0.75;
            this.player.body.shapes[0].halfExtents.x = this.player.fullSizeBody[0] * 2;
            this.player.body.shapes[0].halfExtents.y = this.player.fullSizeBody[1] * 0.75;
            this.player.body.shapes[0].boundingSphereRadiusNeedsUpdate = true;
            this.player.body.shapes[0].updateConvexPolyhedronRepresentation();
        } else {
            // TEMP TRANSFORMATION, replace with tumbling when model is imported
            this.player.mesh.scale.y = 1;
            this.player.mesh.scale.x = 1;
            this.player.body.shapes[0].halfExtents.x = this.player.fullSizeBody[0];
            this.player.body.shapes[0].halfExtents.y = this.player.fullSizeBody[1];
            this.player.body.shapes[0].boundingSphereRadiusNeedsUpdate = true;
            this.player.body.shapes[0].updateConvexPolyhedronRepresentation();
        }
        this.player.angledTilt = angle;
        this.player.body.quaternion.setFromEuler(0, 0, angle, 'XYZ');
    }

    changeDirection(newDir) {
        if(this.player.yDir === newDir) return;
        this.player.mesh.children[0].position.x = newDir === 0 ? 0.25 : -0.25; // FOR ROTATING THE DIRECTION INDICATOR
        this.player.yDir = newDir;
        this.player.yDirPhase = newDir; // TODO, change to animating, when model and anim exists
    }

    updateFn = () => {
        const bodyVelo = this.player.body.velocity,
            bodyAVelo = this.player.body.angularVelocity,
            absAVelo = Math.abs(bodyAVelo.z);
        if(this.isPlayerGrounded()) {
            if(Math.abs(bodyVelo.y) < 0.1) bodyVelo.y = 0;
            if(absAVelo < 0.2) bodyAVelo.z = 0;
        }
        if(absAVelo > 8.5) this.setAngledTilt(0);
    }
}

export default Player;