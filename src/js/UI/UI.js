class UI {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.mainId = 'mainUi';
        this.mainUiElem = document.getElementById(this.mainId);
        this.elems = {};
        this.anims = {};
        sceneState.resizeFns.push(this.resize);
        this.createUI();
        this.resize(sceneState);
    }

    createUI() {
        this.createJumpMeter();
        this.createVelocityMeters();
    }

    resize = (sceneState) => {
        this.mainUiElem.style.width = sceneState.getScreenResolution().x + 'px';
        this.mainUiElem.style.height = sceneState.getScreenResolution().y + 'px';
    }

    createJumpMeter() {
        const html = `
            <div id="jumpMeter">
                <div class="gaugeWrapper">
                    <div id="jumpGauge"></div>
                </div>
            </div>
        `;
        this.mainUiElem.innerHTML += html;
        this.elems.jumpMeter = document.getElementById('jumpGauge');
        this.anims.jumpMeter = {
            run: false,
            startTime: null,
            jmElem: this.elems.jumpMeter,
            updateFn: (sceneState) => {
                const maxTarget = sceneState.player.maxJumpTarget,
                    startTime = this.anims.jumpMeter.startTime;
                let time = performance.now() - startTime;
                if(time > 2000) time = 2000;
                const barPercentage = time / maxTarget * 100;
                this.anims.jumpMeter.jmElem.style.height = barPercentage + '%';
            }
        };
        
    }

    updateJumpMeter(startTime) {
        const jmElem = this.elems.jumpMeter;
        this.anims.jumpMeter.startTime = startTime;
        if(startTime) {
            jmElem.style.height = 0;
            jmElem.style.opacity = 1;
            jmElem.style.transitionTime = 0;
            this.anims.jumpMeter.run = true;
        } else {
            this.anims.jumpMeter.run = false;
            jmElem.style.opacity = 0;
        }
    }

    createVelocityMeters() {
        const html = `
            <div id="veloMeters">
                <div class="veloMeters__xVelo">
                    X: <span id="xVelo"></span>
                </div>
                <div class="veloMeters__xVelo">
                    Y: <span id="xVelo"></span>
                </div>
                <div class="veloMeters__xVelo">
                    A: <span id="xVelo"></span>
                </div>
            </div>
        `;
        this.mainUiElem.innerHTML += html;
    }
    
    renderLoop = (sceneState) => {
        let i;
        const animKeys = Object.keys(this.anims),
            animKeysLength = animKeys.length;
        for(i=0; i<animKeysLength; i++) {
            const anim = this.anims[animKeys[i]];
            if(anim.run) {
                anim.updateFn(sceneState);
            }
        }
    }
}

export default UI;