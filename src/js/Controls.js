
class Controls {
    constructor(sceneState, player) {
        this.sceneState = sceneState;
        this.initKeyListeners(player);
        this.keysDown = {};
    }

    initKeyListeners(player) {
        document.addEventListener('keyup', event => {
            switch(event.code) {
            case 'Space':
                player.actionJump(this.keysDown.space);
                this.keysDown.space = null;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keysDown.left = false;
                player.actionStopMove('left');
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keysDown.right = false;
                player.actionStopMove('right');
            }
        });
        document.addEventListener('keydown', event => {
            switch(event.code) {
            case 'Space':
                !this.keysDown.space ? this.keysDown.space = performance.now() : null;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                !this.keysDown.left ? player.actionMove('left') : null;
                this.keysDown.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                !this.keysDown.right ? player.actionMove('right') : null;
                this.keysDown.right = true;
            }
        });
    }
}

export default Controls;