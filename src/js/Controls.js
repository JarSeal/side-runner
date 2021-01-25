
class Controls {
    constructor(sceneState, playerClass) {
        this.sceneState = sceneState;
        this.initKeyListeners(playerClass);
        this.keysDown = {};
    }

    initKeyListeners(playerClass) {
        document.addEventListener('keydown', event => {
            switch(event.code) {
            case 'Space':
                !this.keysDown.space ? this.keysDown.space = performance.now() : null;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                !this.keysDown.left ? playerClass.actionMove('left') : null;
                this.keysDown.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                !this.keysDown.right ? playerClass.actionMove('right') : null;
                this.keysDown.right = true;
            }
        });
        document.addEventListener('keyup', event => {
            switch(event.code) {
            case 'Space':
                playerClass.actionJump(this.keysDown.space, this.keysDown.space2);
                this.keysDown.space = null;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keysDown.left = false;
                playerClass.actionStopMove('left');
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keysDown.right = false;
                playerClass.actionStopMove('right');
            }
        });
    }
}

export default Controls;