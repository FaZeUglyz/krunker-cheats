const cStruct = (...keys) => ((...v) => keys.reduce((o, k, i) => {
            o[k] = v[i];
            return o
        }, {}))
        const Vector3 = (x, y, z) => {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            return this;
        }
        const fmt = (format, ...args) => {
            return format
                .split("%%")
                .reduce((aggregate, chunk, i) => aggregate + chunk + (args[i] || ""), "");
        }
        class Utilities {
            constructor() {
                this.inputs;
                this.exports;
                this.control;
                this.functions;
                this.weapons;
                this.wpnClasses;
                this.self;
                this.ui;
                this.settings = {
                    scopingOut: false,
                    canShoot: true,
                    targetCoolDown: 500,
                    weaponIndex: 0,
                    isSliding: false,
                    dirtyCanvas: false,
                    espMode: 0,
                    espFontMlt: 10,
                };
                this.playerInfo = false;
                this.canvas;
                this.ctx;
                this.spinTimer = 1800;
                this.features = [];
                this.onLoad();
                this.colors = {
                    aqua: '#7fdbff',
                    blue: '#0074d9',
                    lime: '#01ff70',
                    navy: '#001f3f',
                    teal: '#39cccc',
                    olive: '#3d9970',
                    green: '#2ecc40',
                    red: '#ff4136',
                    maroon: '#85144b',
                    orange: '#ff851b',
                    purple: '#b10dc9',
                    yellow: '#ffdc00',
                    fuchsia: '#f012be',
                    greyDark: '#808080',
                    greyMed: '#A9A9A9',
                    greyLight: '#D3D3D3',
                    white: '#ffffff',
                    black: '#111111',
                    silver: '#dddddd',
                    hostile: '#EB5656',
                    friendly: '#9EEB56',
                };
            }
        
            onLoad() {
                this.newFeature('Gaming Mouses', "1", ['Trash Mouse', 'Tfue's Mouse', 'Daequan's Mouse', 'Shroud's Mouse']);
                this.newFeature('Perfect Jump', "2", ['Off', 'Auto Jump', 'Auto SlideJump']);
                this.newFeature('AutoReload', "3", []);
                this.newFeature('NoRecoil', "4", []);
                this.newFeature('AimDelta', "5", ['Off', 'Slow', 'Medium', 'Fast', 'Insane']);
                this.newFeature('BurstShot', "6", []);
                this.newFeature('ForceScope', "7", []);
                this.newFeature('NoDeathDelay', "8", []);
                this.newFeature('SuperGun', '9', []);
                this.newFeature('SpinBot', '0', []);
                this.newFeature('EspMode', "U", ['Off', 'Walls', 'Walls/Tracers', 'Walls/Tracers/2d', 'Full Esp']);
                window.addEventListener("keydown", event => this.onKeyDown(event));
                const interval = setInterval(() => {
                    if (document.querySelector('#leaderDisplay') !== null) {
                        clearInterval(interval);
                        this.createInfoBox();
                        this.createCanvas();
                    }
                }, 100);
            }
        
            onTick() {
                for (let i = 0, sz = this.features.length; i < sz; i++) {
                    const feature = this.features[i];
                    switch (feature.name) {
                        case 'Gaming Mouses':
                            if (feature.value) this.AutoAim(feature.value);
                            break;
                        case 'AutoReload':
                            if (feature.value) this.wpnReload();
                            break;
                        case 'NoRecoil':
                            if (feature.value) this.self.recoilTweenY = this.self.recoilForce = 0;
                            break;
                        case 'AimDelta':
                            this.world.config.deltaMlt = this.inputs[9] === 0 && (this.control.mouseDownL === 0 || feature.value === 0) ? 1 : feature.value === 1 ? .75 : feature.value === 2 ? 1.25 : feature.value === 3 ? 2 : feature.value === 4 || this.inputs[9] === 1 ? 5 : 1;
                            break;
                        case 'SuperGun':
                            if (feature.value && this.control.mouseDownL == 1) {
                                const sniperRifle = this.weapons[0];
                                const revolver = this.weapons[4];
                                const alienBlaster = this.weapons[11];
                                if (this.self.weapon.src == "weapon_1")
                                    this.self.weapon = revolver;
                                else if (this.self.weapon.src == "weapon_5")
                                    this.self.weapon = alienBlaster;
                                else this.self.weapon = sniperRifle;
                            }
                            break;
                        case 'BurstShot':
                            if (feature.value) this.self.weapon.shots = this.self.weapon.ammo;
                            break;
                        case 'Perfect Jump':
                            if (feature.value) this.AutoBhop(feature.value);
                            break;
                        case 'NoDeathDelay':
                            if (feature.value && this.self && this.self.health === 0) {
                                this.server.deathDelay = 0;
                                this.world.players.forcePos();   
                            }
                            break;
                        case 'EspMode': 
                            this.settings.espMode = feature.value;
                             break;
                    }
                }
                this.server.viewDist = Infinity; // 2000 default
                this.self.weapon.range = Infinity;
                this.self.weapon.pierce = Infinity;
                this.world.config.impulseMlt = 3; //1 default / max 3
                for (let i = 0, sz = this.wpnClasses.length; i < sz; i++) {
                    this.wpnClasses[i].speed = 1.05; // 1.05 max
                }
                this.playerInfo = (this.settings.espMode == 0 || this.settings.espMode == 4) ? false : true;
                if (this.settings.espMode) {
                    window.requestAnimationFrame(() => {
                        this.ctx.clearRect(0, 0, innerWidth, innerHeight);
                        this.drawESP();
                    });
                } else if (this.settings.dirtyCanvas) {
                    this.ctx.clearRect(0, 0, innerWidth, innerHeight);
                    this.settings.dirtyCanvas = false;
                }
            }
            // Ui
            line(x1, y1, x2, y2, lW, sS) {
                this.ctx.save();
                this.ctx.lineWidth = lW + 2;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
                this.ctx.stroke();
                this.ctx.lineWidth = lW;
                this.ctx.strokeStyle = sS;
                this.ctx.stroke();
                this.ctx.restore();
            }
        
            rect(x, y, ox, oy, w, h, color, fill) {
                this.ctx.save();
                this.pixelTranslate(this.ctx, x, y);
                this.ctx.beginPath();
                fill ? this.ctx.fillStyle = color : this.ctx.strokeStyle = color;
                this.ctx.rect(ox, oy, w, h);
                fill ? this.ctx.fill() : this.ctx.stroke();
                this.ctx.closePath();
                this.ctx.restore();
            }
        
            circle(x, y, r, w, color, fill = false) {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.lineWidth = w;
                fill ? this.ctx.fillStyle = color : this.ctx.strokeStyle = color;
                this.ctx.arc(x, y, r, 0, 2 * Math.PI);
                fill ? this.ctx.fill() : this.ctx.stroke();
                this.ctx.closePath();
                this.ctx.restore();
            }
        
            text(txt, font, color, x, y) {
                this.ctx.save();
                this.pixelTranslate(this.ctx, x, y);
                this.ctx.fillStyle = color;
                this.ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
                this.ctx.font = font;
                this.ctx.lineWidth = 1;
                this.ctx.strokeText(txt, 0, 0);
                this.ctx.fillText(txt, 0, 0);
                this.ctx.restore();
            }
        
            image(x, y, img, ox, oy) {
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.beginPath();
                this.ctx.drawImage(img, ox, oy);
                this.ctx.closePath();
                this.ctx.restore();
                this.drawn = true;
            }
        
            pixelTranslate(ctx, x, y) {
                ctx.translate(~~x, ~~y);
            }
        
            gradient(x, y, w, h, colors) {
                let grad = this.ctx.createLinearGradient(x, y, w, h);
                for (let i = 0; i < colors.length; i++) {
                    grad.addColorStop(i, colors[i]);
                }
                return grad;
            }
        
            getTextMeasurements(arr) {
                for (let i = 0; i < arr.length; i++) {
                    arr[i] = ~~this.ctx.measureText(arr[i]).width;
                }
                return arr;
            }
        
            world2Screen(pos3d, camera) {
                // this.canvas.width / window.innerWidth
                // this.canvas.height / window.innerHeight
                let pos = pos3d.clone();
                let width = this.canvas.width,
                    height = this.canvas.height;
                let widthHalf = width / 2,
                    heightHalf = height / 2;
                pos.project(camera);
                pos.x = (pos.x * widthHalf) + widthHalf;
                pos.y = -(pos.y * heightHalf) + heightHalf;
                return pos;
            }
        
            teamCol(player, secondary) {
                return player.team === null ? secondary ? this.colors.red : this.colors.hostile : this.self.team === player.team ? secondary ? this.colors.green : this.colors.friendly : secondary ? this.colors.red : this.colors.hostile;
            }
        
            drawESP() {
                const players = this.world.players.list.filter(x => !x.isYou).filter(x => x.active).filter(x => this.ui.frustum.containsPoint(x)).sort((a, b) => this.getDistance(this.self, a) - this.getDistance(this.self, b));
                for (const player of players) {
                    let offset = Vector3(0, this.server.playerHeight + this.server.nameOffsetHat - player.crouchVal * this.server.crouchDst, 0);
                    let screenG = this.world2Screen(player.objInstances.position.clone(), this.ui.camera);
                    let screenH = this.world2Screen(player.objInstances.position.clone().add(offset), this.ui.camera);
                    let hDiff = ~~(screenG.y - screenH.y);
                    let bWidth = ~~(hDiff * 0.6);
                    
                    if (this.settings.espMode > 1) this.line(innerWidth / 2, innerHeight - 1, screenG.x, screenG.y, 2, this.teamCol(player, 0));
                    if (this.settings.espMode > 2) {
						if (this.settings.espMode > 3) {
                        let health = this.getPercentage(player.health, player.maxHealth);
                        this.rect((screenH.x - bWidth / 2) - 7, ~~screenH.y - 1, -3, 0, 6, hDiff + 2, this.colors.black, false);
                        this.rect((screenH.x - bWidth / 2) - 7, ~~screenH.y - 1, -3, 0, 6, hDiff + 2, health > 75 ? this.colors.green : health > 50 ? this.colors.orange : this.colors.red, true);
                        this.rect((screenH.x - bWidth / 2) - 7, ~~screenH.y - 1, -3, 0, 6, ~~((player.maxHealth - player.health) / player.maxHealth * (hDiff + 2)), this.colors.black, true);
                        }
						this.ctx.save();
                        this.ctx.lineWidth = 4;
                        this.pixelTranslate(this.ctx, screenH.x - bWidth / 2, screenH.y);
                        this.ctx.beginPath();
                        this.ctx.rect(0, 0, bWidth, hDiff);
                        this.ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
                        this.ctx.stroke();
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeStyle = this.teamCol(player, 0);
                        this.ctx.stroke();
                        this.ctx.closePath();
                        this.ctx.restore();
                        if (this.settings.espMode > 3) {
                            let playerDist = (Math.round(this.getDistance(this.ui.camera.getWorldPosition(), player)) / 10).toFixed(0);
                            let FontSize = this.settings.espFontMlt*(Math.max(0.3,1.0-playerDist/600));
                            this.ctx.save();   
                            let meas = this.getTextMeasurements(["[", playerDist, "]", player.level, '000', player.name, player.weapon.name+'0000']);
                            this.ctx.restore();
                            let padding = 2;
                            let grad2 = this.gradient(0, 0, meas[4] * 5, 0, ["rgba(0, 0, 0, 0.25)", "rgba(0, 0, 0, 0)"]);
                            this.rect(~~(screenH.x + bWidth / 2) + padding, ~~screenH.y - padding, 0, 0, (meas[4] * 5), (meas[4] * 4) + (padding * 2), grad2, true);
        
                            this.text(player.name, (FontSize + 2) + 'px GameFont', this.colors.white, (screenH.x + bWidth / 2) + 4, screenH.y + meas[4] * 1)
                            if (player.clan) this.text("["+player.clan+"]", FontSize + 'px GameFont', "#AAAAAA", (screenH.x + bWidth / 2) + 8 + meas[5], screenH.y + meas[4] * 1)
        
                            this.text(fmt("Level:%%", player.level ? player.level : 0), FontSize + 'px GameFont', this.colors.yellow, (screenH.x + bWidth / 2) + 4, screenH.y + meas[4] * 2)
        
                            this.text(player.weapon.name, FontSize + 'px GameFont', this.colors.greyMed, (screenH.x + bWidth / 2) + 4, screenH.y + meas[4] * 3)
                            //this.text(fmt("[%%/%%]", player.weapon.ammo ? player.ammos[player.weaponIndex] : 0, player.weapon.ammo ? player.weapon.ammo : 0), FontSize + 'px GameFont', this.colors.greyDark, (screenH.x + bWidth / 2) + 8 + meas[6], screenH.y + meas[4] * 3)
                            //this.text("[", FontSize + 'px GameFont', this.colors.greyMed, (screenH.x + bWidth / 2) + 4, screenH.y + meas[4] * 4)
                            this.text(playerDist, FontSize + 'px GameFont', this.colors.white, (screenH.x + bWidth / 2) + 4 + meas[0], screenH.y + meas[4] * 4)
                            this.text("mt", FontSize + 'px GameFont', this.colors.white, (screenH.x + bWidth / 2) + 4 + meas[0] + meas[1], screenH.y + meas[4] * 4)
                        }               
                    }
                }
        
                this.settings.canvasNeedsClean = true;
            }
        
            onRender() {
                window.requestAnimationFrame(() => {
                    this.onRender()
                })
            }
        
            createCanvas() {
                const hookedCanvas = window.document.createElement("canvas");
                hookedCanvas.id = "canvas_overlay";
                hookedCanvas.width = innerWidth;
                hookedCanvas.height = innerHeight;
        
                function resize() {
                    const ws = innerWidth / 1700;
                    const hs = innerHeight / 900;
                    hookedCanvas.width = innerWidth;
                    hookedCanvas.height = innerHeight;
                    hookedCanvas.style.width = (hs < ws ? (innerWidth / hs).toFixed(3) : 1700) + "px";
                    hookedCanvas.style.height = (ws < hs ? (innerHeight / ws).toFixed(3) : 900) + "px";
                }
                window.addEventListener('resize', resize);
                resize();
                this.canvas = hookedCanvas;
                this.ctx = hookedCanvas.getContext("2d");
                const hookedUI = window.inGameUI;
                hookedUI.insertAdjacentElement("beforeend", hookedCanvas);
                window.requestAnimationFrame(() => {
                    this.onRender()
                })
            }
        
            onUpdated(feature) {
                if (feature.container.length) {
                    feature.value += 1;
                    if (feature.value > feature.container.length - 1) {
                        feature.value = 0;
                    }
                    feature.valueStr = feature.container[feature.value];
                } else {
                    feature.value ^= 1;
                    feature.valueStr = feature.value ? "true" : "false";
                }
                switch (feature.name) {
                    case 'ForceScope':
                        feature.value || this.self.weapon.name === "Sniper Rifle" || this.self.weapon.name === "Semi Auto" ? this.self.weapon.scope = 1 : delete this.self.weapon.scope; 
                        break;
                    case 'EspMode': 
                        this.settings.dirtyCanvas = true;
                        break;
                }
                window.saveVal("utilities_" + feature.name, feature.value);
                this.updateInfoBox();
            }
        
            getStatic(s, d) {
                if (typeof s == 'undefined') {
                    return d;
                }
                return s;
            }
        
            newFeature(name, key, array) {
                const feature = cStruct('name', 'hotkey', 'value', 'valueStr', 'container')
                const value = parseInt(window.getSavedVal("utilities_" + name) || 0);
                this.features.push(feature(name, key, value, array.length ? array[value] : value ? "true" : "false", array));
            }
        
            getFeature(name) {
                for (const feature of this.features) {
                    if (feature.name.toLowerCase() === name.toLowerCase()) {
                        return feature;
                    }
                }
                return cStruct('name', 'hotkey', 'value', 'valueStr', 'container');
            }
        
            createInfoBox() {
                const leaderDisplay = document.querySelector('#leaderDisplay');
                if (leaderDisplay) {
                    let infoBox = document.createElement('div');
                    if (infoBox) infoBox.innerHTML = '<div> <style> #InfoBox { text-align: left; width: 310px; z-index: 3; padding: 10px; padding-left: 20px; padding-right: 20px; color: rgba(255, 255, 255, 0.7); line-height: 25px; margin-top: 0px; background-color: rgba(0, 0, 0, 0.3); } #InfoBox .utilitiesTitle { font-size: 16px; font-weight: bold; text-align: center; color: #1A72B8; margin-top: 5px; margin-bottom: 5px; } #InfoBox .leaderItem { font-size: 14px; } </style> <div id="InfoBox"></div> </div>'.trim();
                    leaderDisplay.parentNode.insertBefore(infoBox.firstChild, leaderDisplay.nextSibling);
                    this.updateInfoBox();
                }
            }
        
            upperCase(str) {
                return str.toUpperCase();
            }
        
            toProperCase(str) {
                str = str.replace(/([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g, '$1 $2');
                str = str.replace(/\s[a-z]/g, this.upperCase)
                return str;
            }
        
            updateInfoBox() {
                const infoBox = document.querySelector('#InfoBox');
                if (infoBox) {
                    const lines = this.features.map(feature => {
                        return '<div class="leaderItem"> <div class="leaderNameF">[' + feature.hotkey.toUpperCase() + '] ' + this.toProperCase(feature.name) + '</div> <div class="leaderScore">' + feature.valueStr + '</div> </div>';
                    });
                    infoBox.innerHTML = '<div class="utilitiesTitle">FaZe_Uglyz krunker cheat</div>' + lines.join('').trim();
                }
            }
        
            onKeyDown(event) {
                if (document.activeElement.tagName === "INPUT") return;
                const key = event.key.toUpperCase();
                switch (key) {
                    case 'M': {
                        const infoBox = document.querySelector('#InfoBox');
                        if (infoBox) infoBox.style.display = !infoBox.style.display || infoBox.style.display === "inline-block" ? "none" : "inline-block";
                    }
                    break;
                case 'DELETE':
                    this.resetSettings();
                    break;
                default:
                    for (const feature of this.features) {
                        if (feature.hotkey.toUpperCase() === key) {
                            this.onUpdated(feature);
                        }
                    }
                    break;
                }
            }
        
            getPercentage(a, b) {
                return Math.round((a / b) * 100);
            }
        
            getDistance3D(fromX, fromY, fromZ, toX, toY, toZ) {
                var distX = fromX - toX,
                    distY = fromY - toY,
                    distZ = fromZ - toZ;
                return Math.sqrt(distX * distX + distY * distY + distZ * distZ)
            }
        
            getDistance(player1, player2) {
                return this.getDistance3D(player1.x, player1.y, player1.z, player2.x, player2.y, player2.z);
            }
        
            getDirection(fromZ, fromX, toZ, toX) {
                return Math.atan2(fromX - toX, fromZ - toZ)
            }
        
            getXDir(fromX, fromY, fromZ, toX, toY, toZ) {
                var dirY = Math.abs(fromY - toY),
                    dist = this.getDistance3D(fromX, fromY, fromZ, toX, toY, toZ);
                return Math.asin(dirY / dist) * (fromY > toY ? -1 : 1)
            }
        
            getAngleDist(start, end) {
                return Math.atan2(Math.sin(end - start), Math.cos(start - end));
            }
        
            camLookAt(X, Y, Z) {
                var xdir = this.getXDir(this.control.object.position.x, this.control.object.position.y, this.control.object.position.z, X, Y, Z),
                    ydir = this.getDirection(this.control.object.position.z, this.control.object.position.x, Z, X),
                    camChaseDst = this.server.camChaseDst;
                this.control.target = {
                    xD: xdir,
                    yD: ydir,
                    x: X + this.server.camChaseDst * Math.sin(ydir) * Math.cos(xdir),
                    y: Y - this.server.camChaseDst * Math.sin(xdir),
                    z: Z + this.server.camChaseDst * Math.cos(ydir) * Math.cos(xdir)
                }
            }
        
            Gaming Mouses(value) {
                if (this.self.didShoot) {
                    if (this.control.mouseDownL === 1) {
                        this.control.mouseDownL = 0;
                    }
                    setTimeout(() => {
                        this.settings.canShoot = true;
                        this.settings.forceScope || this.self.weapon.name === "Sniper Rifle" || this.self.weapon.name === "Semi Auto" ? this.self.weapon.scope = 1 : delete this.self.weapon.scope;
                    }, this.self.weapon.rate / 1.75);
                }
                const target = this.getTarget();
                if (target) {
                    switch (value) {
                        case 1:
                            /*Aim Assist*/
                            if (this.control.mouseDownR === 1) {
                                this.lookAtHead(target);
                            }
                            break;
                        case 2:
                            /*Aim Bot*/
                            this.lookAtHead(target);
                            if (this.control.mouseDownR === 0) {
                                this.control.mouseDownR = 1;
                            }
                            break;
                        case 3:
                            /*Trigger Bot*/
                            if (this.control.mouseDownL === 1) {
                                this.control.mouseDownL = 0;
                                this.control.mouseDownR = 0;
                                this.settings.scopingOut = true;
                            }
                            else if (this.self.aimVal === 1) {
                                this.settings.scopingOut = false;
                            }
                    
                            if (!this.settings.scopingOut && this.settings.canShoot) {
                                this.lookAtHead(target);
                                if (this.control.mouseDownR === 0)  this.control.mouseDownR = 2;
                                if (this.self.aimVal === 0) this.control.mouseDownL ^= 1; 
                                this.self.recoilForce -= this.self.recoilForce;
                            }
                            else
                            {
                                this.world.players.resetAim();
                                this.self.aimVal = 1;
                            }
                            break;
                    }
                } else {
                    this.wpnReload(this.getFeature('AutoReload').value && this.self.ammos[this.self.weaponIndex] < ((this.self.weapon.ammo / 2) + 1));
                    this.control.target = null;
                    if (this.control.mouseDownR === 2) {
                        setTimeout(() => {
                            this.control.mouseDownR = 0;
                            this.self.aimVal = 1;
                            this.settings.scopingOut = false;
                            this.settings.canShoot = true;
                        }, this.settings.targetCoolDown);
                    }
                }
            }
        
            Perfect Jump(value) {
                if (this.control['keys'][this.control['moveKeys'][0x0]] && value) {
                    this.control.keys[this.control.jumpKey] = this.self.onGround;
                    if (value === 2) {
                        if (this.settings.isSliding) {
                            this.inputs[8] = 1;
                            return;
                        }
                        if (this.self.yVel < -0.04 && this.self.canSlide) {
                            this.settings.isSliding = true;
                            setTimeout(() => {
                                this.settings.isSliding = false;
                            }, this.self.slideTimer);
                            this.inputs[8] = 1;
                        }
                    }
                }
            }
        
            wpnReload(force = false) {
                const ammoLeft = this.self.ammos[this.self.weaponIndex];
                if (force || ammoLeft === 0) this.world.players.reload(this.self);
            }
        
            resetSettings() {
                if (confirm("Are you sure you want to reset all your hero settings? This will also refresh the page")) {
                    Object.keys(window.localStorage).filter(x => x.includes("utilities_")).forEach(x => window.localStorage.removeItem(x));
                    location.reload();
                }
            }
        
            getTarget() {
                const enemies = this.world.players.list
                    .filter(player => {
                        return player.active && (player.inView || this.self.dmgReceived[player.id]) && !player.isYou && (!player.team || player.team !== this.self.team);
                    })
                    .sort((p1, p2) => this.getDistance(this.self, p1) - this.getDistance(this.self, p2));
                return enemies.length ? enemies[0] : null;
            }
        
            lookAtHead(target) {
                if (this.getFeature("SpinBot").value) this.spinTick();
                this.camLookAt(target.x2, target.y2 + target.height - target.headScale * 0.75 - this.server.crouchDst * target.crouchVal - this.self.recoilAnimY * this.server.recoilMlt, target.z2);
            }
        
            spinTick() {
                if (this.control.mouseDownL === 1) return;
                //this.world.players.getSpin(this.self);
                //this.world.players.saveSpin(this.self, angle);
                const last = this.inputs[2];
                const angle = this.getAngleDist(this.inputs[2], this.self.xDire);
                this.spins = this.getStatic(this.spins, new Array());
                this.spinTimer = this.getStatic(this.spinTimer, this.server.spinTimer);
                this.serverTickRate = this.getStatic(this.serverTickRate, this.server.serverTickRate);
                (this.spins.unshift(angle), this.spins.length > this.spinTimer / this.serverTickRate && (this.spins.length = Math.round(this.spinTimer / this.serverTickRate)))
                for (var e = 0, i = 0; i < this.spins.length; ++i) e += this.spins[i];
                const count = Math.abs(e * (180 / Math.PI));
                if (count < 360) {
                    this.inputs[2] = this.self.xDire + Math.PI;
                } else console.log('count', count);
            }
        
            inputsTick(self, inputs, world) {
                //Hooked
                if (this.control && this.exports && self && inputs && world) {
                    this.inputs = inputs;
                    this.world = world;
                    this.self = self;
                    if(!this.server){
                        console.dir(this.exports.c[7].exports)
                    }
                    this.server = this.exports.c[7].exports;
                    this.functions = this.exports.c[8].exports;
                    this.weapons = this.exports.c[22].exports;
                    this.wpnClasses = this.exports.c[69].exports;
                    this.onTick();
                }
            }
 
