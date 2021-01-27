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

    createJumpMeter = () => {
        const html = `
            <div id="jumpMeter">
                <div class="gaugeWrapper">
                    <div id="jumpGauge"></div>
                </div>
            </div>
        `;
        this.mainUiElem.innerHTML += html;
        this.anims.jumpMeter = {
            run: false,
            startTime: null,
            jmElem: document.getElementById('jumpGauge'),
            updateFn: (sceneState) => {
                const maxTarget = sceneState.player.maxJumpTarget,
                    startTime = this.anims.jumpMeter.startTime;
                let time = performance.now() - startTime;
                if(time > 2000) time = 2000;
                const barPercentage = time / maxTarget * 100;
                this.anims.jumpMeter.jmElem.style.opacity = 1;
                this.anims.jumpMeter.jmElem.style.height = barPercentage + '%';
            }
        };
        
    }

    updateJumpMeter = (startTime) => {
        const jmElem = document.getElementById('jumpGauge');
        this.anims.jumpMeter.startTime = startTime;
        this.anims.jumpMeter.jmElem = jmElem;
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
                    Y: <span id="yVelo"></span>
                </div>
                <div class="veloMeters__xVelo">
                    A: <span id="aVelo"></span>
                </div>
            </div>
        `;
        this.anims.veloMeters = {
            run: this.sceneState.settings.showVeloMeters,
            html,
            xVeloElem: null,
            yVeloElem: null,
            aVeloElem: null,
            updateFn: (sceneState) => {
                this.anims.veloMeters.xVeloElem.innerHTML = sceneState.player.body.velocity.x.toFixed(2);
                this.anims.veloMeters.yVeloElem.innerHTML = sceneState.player.body.velocity.y.toFixed(2);
                this.anims.veloMeters.aVeloElem.innerHTML = sceneState.player.body.angularVelocity.z.toFixed(2);
            },
            removeFn: () => {
                const elem = document.getElementById('veloMeters');
                if(elem) elem.remove();
            },
            addFn: () => {
                this.mainUiElem.innerHTML += this.anims.veloMeters.html;
                this.anims.veloMeters.xVeloElem = document.getElementById('xVelo');
                this.anims.veloMeters.yVeloElem = document.getElementById('yVelo');
                this.anims.veloMeters.aVeloElem = document.getElementById('aVelo');
            },
            checkSettingsFn: (sceneState) => {
                if(this.anims.veloMeters.run !== sceneState.settings.showVeloMeters) {
                    this.anims.veloMeters.removeFn();
                    if(sceneState.settings.showVeloMeters) {
                        this.anims.veloMeters.addFn();
                    }
                }
                this.anims.veloMeters.run = sceneState.settings.showVeloMeters;
            }
        };
        if(this.sceneState.settings.showVeloMeters) this.anims.veloMeters.addFn();
    }
    
    renderLoop = (sceneState) => {
        let i;
        const animKeys = Object.keys(this.anims),
            animKeysLength = animKeys.length;
        for(i=0; i<animKeysLength; i++) {
            const anim = this.anims[animKeys[i]];
            if(anim.checkSettingsFn) anim.checkSettingsFn(sceneState);
            if(anim.run) {
                anim.updateFn(sceneState);
            }
        }
    }
}

export default UI;