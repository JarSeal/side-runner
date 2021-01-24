import * as THREE from 'three';
import * as CANNON from 'cannon';

class Controls {
    constructor(sceneState, player) {
        this.sceneState = sceneState;
        this.initKeyListeners(player);
    }

    initKeyListeners(player) {
        document.addEventListener('keyup', event => {
            switch(event.code) {
            case 'Space':
                player.actionJump();
                break;
            case 'KeyA':
            case 'ArrowLeft':
                player.actionMove('left');
                break;
            case 'KeyD':
            case 'ArrowRight':
                player.actionMove('right');
            }
        });
    }
}

export default Controls;