
class Controls {
    constructor(sceneState, playerClass) {
        this.sceneState = sceneState;
        this.initKeyListeners(playerClass);
        this.keysDown = {};
    }

    initKeyListeners = (playerClass) => {
        document.addEventListener('keydown', event => {
            switch(event.code) {
            case 'Space':
                if(!this.keysDown.space) {
                    this.keysDown.space = performance.now();
                    this.sceneState.uiClass.updateJumpMeter(this.keysDown.space);
                }
                break;
            case 'KeyA':
            case 'ArrowLeft':
                if(!this.keysDown.left) playerClass.actionMove('left');
                this.keysDown.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                if(!this.keysDown.right) playerClass.actionMove('right');
                this.keysDown.right = true;
                break;
            case 'ShiftLeft':
                if(!this.keysDown.shiftLeft) playerClass.actionStopSpin();
                this.keysDown.shiftLeft = true;
                break;
            }
            this.sceneState.keysDown = this.keysDown;
        });
        document.addEventListener('keyup', event => {
            switch(event.code) {
            case 'Space':
                playerClass.actionJump(this.keysDown.space, this.keysDown.space2);
                this.sceneState.uiClass.updateJumpMeter(null);
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
                break;
            case 'ShiftLeft':
                this.keysDown.shiftLeft = false;
                break;
            }
            this.sceneState.keysDown = this.keysDown;
        });
    }
}

export default Controls;