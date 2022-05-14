const G  = {}; //GAME
G.canvas = document.getElementById('main');
G.C = G.canvas.getContext('2d'); //CANVAS
G.canvas.width = window.innerWidth;
G.canvas.height = window.innerHeight;
G.width = G.canvas.width; //GAME WIDTH
G.height = G.canvas.height; //GAME HEIGHT
G.map = "test";
G.path = [];
G.S = {}; //SETTINGS
// -----[SETTINGS]-----
G.S.extendedtargeting = false; //Extended targetting options
G.S.lives = 1.0; //Lives multiplier
G.M = {}; //MOUSE
G.M.X = 0; //MOUSE X
G.M.Y = 0; //MOUSE Y
G.scene = 'l'; //SCENE
G.A = {}; //ASSETS
G.A.S = 1; //SCALE
G.A.loaded = false; //GAME LOADED
G.D = ""; //CONSOLE
G.A.L = {}; //LOCATIONS
G.A.L.S = []; //SPAWNS
G.A.C = {}; //CURSOR
G.A.C.on = false;
G.A.C.pos = 0; //CURSOR ANIMATION FRAME
G.A.C.X = 2; //CURSOR X
G.A.C.Y = 2; //CURSOR Y
G.O = {}; //OFFSET
G.O.X = 0;
G.O.Y = 0;
G.T = {};
G.T.P = [];
G.T.T = [];
G.T.L = [];
G.T.B = [];
G.T.E = [];
G.U = {};
G.U.on = false;
G.U.anim = 0;
G.points = 250;
G.hp = Math.round(200 * G.S.lives);
G.maxhp = Math.round(200 * G.S.lives);

class Tile {
    constructor (type, x, y, texture, direction) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.texture = texture;
        this.direction = direction;
        this.tower = null;
        this.paths = '';
        G.T.T.push(this);
    }
}

class Location {
    constructor (type, x, y, texture) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.texture = texture;
        G.T.L.push(this);
    }
}
class TowerPrototype {
    constructor (name, type, texture, turret, firerate, damage, range, color, offset, firewidth, fireduration, shots) {
        this.name = name;
        this.type = type;
        this.texture = texture;
        this.turret = turret;
        this.firerate = firerate;
        this.damage = damage;
        this.range = range;
        this.color = color;
        this.offset = offset;
        this.firewidth = firewidth;
        this.fireduration = fireduration;
        this.shots = shots;
    }
}
class Tower {
    /**
     * tower
     * @param {String} type 
     * @param {Number} x 
     * @param {Number} y 
     * @param {String} texture 
     * @param {String} turret 
     * @param {Number} rotspeed 
     * @param {Number} firerate 
     * @param {Number} damage 
     * @param {Number} range 
     * @param {String} color 
     * @param {Number} offset 
     */
    constructor (name, type, x, y, texture, turret, firerate, damage, range, color, offset, firewidth, fireduration, shots=1) {
        this.name = name;
        this.type = type;
        this.x = x;
        this.y = y;
        this.texture = texture;
        this.turret = turret;
        this.firerate = firerate;
        this.reload = 50/firerate;
        this.cooldown = 0;
        this.shots = shots;
        this.damage = damage;
        this.level = 1;
        this.direction = 0;
        this.range = range;
        this.color = color;
        this.offset = offset;
        this.left = false;
        this.right = false;
        this.width = firewidth;
        this.duration = fireduration;
        this.level = 1;
        this.earned = 0;
        this.kills = 0;
        this.targeting = 'f'; //First, Last, Health, Speed, Damage, Reward
        getTile(this.x, this.y).tower = this;
        G.T.B.push(getTile(this.x, this.y).tower);
    }
    tick () {
        //find enemy
        var shots = this.shots;
        var sort = [];
        var property = 'distance';
        var reverse = false;
        switch (this.targeting) {
            case 'f':
                property = 'distance';
                reverse = false;
                break;
            case 'l':
                property = 'distance';
                reverse = true;
                break;
            case 'h':
                property = 'hp';
                reverse = false;
                break;
            case 's':
                property = 'speed';
                reverse = false;
                break;
            case 'd':
                property = 'damage';
                reverse = false;
                break;
            case 'reward':
                property = 'reward';
                reverse = false;
                break;
        }
        for (var e = 0; e < G.T.E.length; e++) {
            sort.push([e, G.T.E[e][property], G.T.E[e].distance]);
        }
        sort.sort((a, b) => b[2] - a[2]);
        sort.sort((a, b) => b[1] - a[1]);
        if (reverse) sort.reverse();
        for (const s of sort) {
            var enemy = G.T.E[s[0]];
            var difx = enemy.x * G.A.A.config.scale[0] - (this.x + 0.5) * G.A.A.config.scale[0];
            var dify = enemy.y * G.A.A.config.scale[1] - (this.y + 0.5) * G.A.A.config.scale[1];
            if (!(difx ** 2 + dify ** 2 <= (this.range * G.A.A.config.scale[0]) ** 2)) continue;
            var direction = (Math.atan2(enemy.y * G.A.A.config.scale[1] - (this.y + 0.5) * G.A.A.config.scale[1], enemy.x * G.A.A.config.scale[0] - (this.x + 0.5) * G.A.A.config.scale[0]) * (180 / Math.PI)) + 90;
            var directionDiff = direction - this.direction;
            if (directionDiff > 180) directionDiff -= 360;
            else if (directionDiff < -180) directionDiff += 360;
            if (this.cooldown <= 0/*Math.abs(directionDiff) < this.rotspeed / 50*/) {
                this.direction = direction;
            }
            var distance = (difx / Math.cos((direction - 90) * (Math.PI/180)));
            var hit = [distance * Math.sin(this.direction * (Math.PI/180)), -distance * Math.cos(this.direction * (Math.PI/180))];
            //G.D = [difx, dify, hit];
            if (
                hit[0] >= difx - enemy.hitbox[0]/2 && 
                hit[0] <= difx + enemy.hitbox[0]/2 &&
                hit[1] >= dify - enemy.hitbox[1]/2 &&
                hit[1] <= dify + enemy.hitbox[1]/2 &&
                this.cooldown <= 0
            ) {
                var prevhp = JSON.parse(JSON.stringify(enemy.hp));
                enemy.hp -= this.damage;
                if (enemy.hp <= 0 && prevhp > 0) {this.kills++; this.earned += enemy.reward;}
                var offset = [this.offset * Math.sin(this.direction * (Math.PI/180)), -this.offset * Math.cos(this.direction * (Math.PI/180))];
                G.T.P.push(new Laser(this.width, this.color, hit[0] / G.A.A.config.scale[0] + (this.x + 0.5), hit[1] / G.A.A.config.scale[1] + (this.y + 0.5),
                    (this.x + 0.5) + offset[0] / G.A.A.config.scale[0],
                    (this.y + 0.5) + offset[1] / G.A.A.config.scale[1],
                    this.duration));
            }
            shots--
            if (shots <= 0) break;
        }
        if (this.cooldown <= 0) {
            this.cooldown = this.reload;
        }
        this.cooldown--;
    }
}

class Laser {
    constructor (width, color, x1, y1, x2, y2, duration) {
        this.width = width;
        this.color = color;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.duration = duration;
    }
    tick () {
        this.duration--;
        if (this.duration <= 0) return true;
    }
}

class EnemyPrototype {
    constructor (type, id, size, texture, hp, damage, speed, hitbox, reward) {
        this.type = type;
        this.id = id;
        this.size = size;
        this.texture = texture;
        this.hp = hp;
        this.damage = damage;
        this.speed = speed;
        this.hitbox = hitbox;
        this.reward = reward;
    }
    generate (hpmult, speedmult, rewardmult) {
        var tile = Math.floor(Math.random() * G.A.L.S.length);
        G.T.E.push(new Enemy(
            (G.A.L.S[tile][0] + this.size[0] / (2 * G.A.A.config.scale[0])) + Math.floor(Math.random() * (1 - this.size[0] / G.A.A.config.scale[0]) * G.A.A.config.scale[0])/G.A.A.config.scale[0],
            (G.A.L.S[tile][1] + this.size[1] / (2 * G.A.A.config.scale[1])) + Math.floor(Math.random() * (1 - this.size[1] / G.A.A.config.scale[1]) * G.A.A.config.scale[1])/G.A.A.config.scale[1],
            // G.A.L.S[tile][0] * G.A.A.config.scale[0],
            // G.A.L.S[tile][1] * G.A.A.config.scale[1],
            G.A.L.S[tile], this.type, this.size, this.texture, this.hp * hpmult, this.damage, this.speed * speedmult,
            this.hitbox, Math.round(this.reward * rewardmult)));
    }
}

class Enemy {
    constructor (x, y, tile, type, size, texture, hp, damage, speed, hitbox, reward) {
        this.x = JSON.parse(JSON.stringify(x));
        this.y = JSON.parse(JSON.stringify(y));
        this.tile = JSON.parse(JSON.stringify(tile));
        this.size = size;
        this.type = type;
        this.texture = texture;
        this.hp = JSON.parse(JSON.stringify(hp));
        this.damage = JSON.parse(JSON.stringify(damage));
        this.speed = JSON.parse(JSON.stringify(speed));
        this.direction = [0, 0];
        this.movement = 0;
        this.hitbox = hitbox;
        this.reward = reward;
        this.distance = 0;
    }
    tick () {
        if (this.movement <= 0) {
            switch (getTile(this.tile[0], this.tile[1], true).direction) {
                case 'l':
                    this.direction = [-1, 0];
                    this.movement += 1;
                    this.tile[0] -= 1;
                    break;
                case 'r':
                    this.direction = [1, 0];
                    this.movement += 1;
                    this.tile[0] += 1;
                    break;
                case 'u':
                    this.direction = [0, -1];
                    this.movement += 1;
                    this.tile[1] -= 1;
                    break;
                case 'd':
                    this.direction = [0, 1];
                    this.movement += 1;
                    this.tile[1] += 1;
                    break;
                case 'b':
                    G.hp -= this.damage;
                    return true;
                    break;
            }
        } else {
            this.x += this.direction[0] * this.speed / 50;
            this.y += this.direction[1] * this.speed / 50;
            this.movement -= Math.abs(((this.direction[0] * this.speed) + (this.direction[1] * this.speed)) / 50);
        }
        this.distance = G.path.indexOf(Math.floor(this.x) + ',' + Math.floor(this.y));
        if (this.direction[0] > 0) {
            this.distance += this.x - Math.floor(this.x);
        }
        if (this.direction[0] < 0) {
            this.distance += 1 - (this.x - Math.floor(this.x));
        }
        if (this.direction[1] > 0) {
            this.distance += this.y - Math.floor(this.y);
        }
        if (this.direction[1] < 0) {
            this.distance += 1 - (this.y - Math.floor(this.y));
        }
        if (this.hp <= 0) {
            G.points += this.reward;
            return true;
        }
    }
}

function getTile (x, y, object=false) {
    for (const tile of G.T.T) {
        //Check if matching tile
        if (tile.x == x && tile.y == y) {
            return tile; //Return tile
        }
    }
    //Return null if no tile
    if (object) return {type: null, x: null, y: null, texture: null, direction: null, tower: null, paths: null};
    else return null;
}

function loadMap (mapdata) {
    for (var y = 0; y < mapdata.track.length; y++) {
        for (var x = 0; x < mapdata.track[y].length; x++) {
            switch (mapdata.track[y][x]) {
                case 0:
                    break;
                case 1:
                    new Tile('platform', x, y, 'tower');
                    break;
                case 'l':
                    new Tile('track', x, y, 'track-', 'l');
                    break;
                case 'r':
                    new Tile('track', x, y, 'track-', 'r');
                    break;
                case 'u':
                    new Tile('track', x, y, 'track-', 'u');
                    break;
                case 'd':
                    new Tile('track', x, y, 'track-', 'd');
                    break;
                case 'b':
                    new Tile('track', x, y, 'track-', 'b');
                    break;
            }
        }
    }
    for (var i = 0; i < mapdata.locations.length; i++) {
        new Location(mapdata.locations[i].type, mapdata.locations[i].pos[0], mapdata.locations[i].pos[1], mapdata.locations[i].type);
        if (mapdata.locations[i].type == "spawn") G.A.L.S.push(mapdata.locations[i].pos);
    }
    for (const tile of G.T.T) {
        if (tile.type != 'track' || tile.paths != '') continue;
        if (getTile(tile.x + 1, tile.y, true).type == 'track') tile.paths += 'r';
        if (getTile(tile.x - 1, tile.y, true).type == 'track') tile.paths += 'l';
        if (getTile(tile.x, tile.y - 1, true).type == 'track') tile.paths += 'u';
        if (getTile(tile.x, tile.y + 1, true).type == 'track') tile.paths += 'd';
        tile.texture = 'track-' + tile.paths;
    }
    for (const path of mapdata.path) {
        G.path.push(path.replaceAll(/\s/g, ''));
    }
}

setInterval(() => {
    G.A.C.pos += 3;
    if (G.A.C.pos >= 360) {
        G.A.C.pos -= 360;
    }
}, 20);

G.nodes = [];

G.canvas.addEventListener('mousemove', e => {
    G.M.X = e.offsetX;
    G.M.Y = e.offsetY;
});

G.canvas.addEventListener('click', e => {
    if (e.offsetY < 64) return;
    if (e.offsetY > G.height - 192 && G.U.on) return;
    //if (G.A.loaded) G.nodes.push([Math.round(e.offsetX/G.A.A.config.scale[0])*G.A.A.config.scale[0], Math.round(e.offsetY/G.A.A.config.scale[1])*G.A.A.config.scale[1]]);
    G.A.C.X = Math.round((e.offsetX - G.O.X - G.A.A.config.scale[0]/2)/G.A.A.config.scale[0]);
    G.A.C.Y = Math.round((e.offsetY - G.O.Y - G.A.A.config.scale[1]/2)/G.A.A.config.scale[1]);
    G.A.C.on = true;
});

document.addEventListener('keydown', e => {
    try {
    switch (e.code) {
        case 'Escape':
            G.A.C.on = false;
            break;
        case 'KeyR':
            G.O.X -= G.width / 2 * (1 - G.A.S);
            G.O.Y -= G.height / 2 * (1 - G.A.S);
            G.A.S = 1;
            G.A.A.config.scale[0] = G.A.S * G.A.A.config.defaultscale[0];
            G.A.A.config.scale[1] = G.A.S * G.A.A.config.defaultscale[1];
            G.P = new OffscreenCanvas(G.A.A.config.scale[0], G.A.A.config.scale[1]); //PRELOAD
            G.PC = G.P.getContext('2d');
            break;
        case 'KeyH':
            G.O.X = 0;
            G.O.Y = 0;
            break;
        case 'ArrowRight':
            if (e.ctrlKey) G.O.X -= G.A.A.config.scale[0] * 0.1;
            else if (e.shiftKey) G.O.X -= G.A.A.config.scale[0] * 5;
            else G.O.X -= G.A.A.config.scale[0];
            break;
        case 'ArrowUp':
            if (e.ctrlKey) G.O.Y += G.A.A.config.scale[1] * 0.1;
            else if (e.shiftKey) G.O.Y += G.A.A.config.scale[1] * 5;
            else G.O.Y += G.A.A.config.scale[1];
            break;
        case 'ArrowLeft':
            if (e.ctrlKey) G.O.X += G.A.A.config.scale[0] * 0.1;
            else if (e.shiftKey) G.O.X += G.A.A.config.scale[0] * 5;
            else G.O.X += G.A.A.config.scale[0];
            break;
        case 'ArrowDown':
            if (e.ctrlKey) G.O.Y -= G.A.A.config.scale[1] * 0.1;
            else if (e.shiftKey) G.O.Y -= G.A.A.config.scale[1] * 5;
            else G.O.Y -= G.A.A.config.scale[1];
            break;
        case 'KeyC':
            if (getTile(G.A.C.X, G.A.C.Y, true).type == 'platform' && getTile(G.A.C.X, G.A.C.Y).tower == null) {
                new Tower("Basic", 'basic', G.A.C.X, G.A.C.Y, 'basic', 'basic-turret', 2, 10, 2.5, '#007eeb', 20, 2, 10, 1);
            } 
            break;
        case 'KeyV':
            if (getTile(G.A.C.X, G.A.C.Y, true).type == 'platform' && getTile(G.A.C.X, G.A.C.Y).tower == null) {
                new Tower("Sniper", 'sniper', G.A.C.X, G.A.C.Y, 'sniper', 'sniper-turret', 0.5, 40, 4.5, '#00cb3e', 26, 1, 25, 1);
            } 
            break;
        case 'KeyB':
            if (getTile(G.A.C.X, G.A.C.Y, true).type == 'platform' && getTile(G.A.C.X, G.A.C.Y).tower == null) {
                new Tower("Beam", 'beam', G.A.C.X, G.A.C.Y, 'beam', 'beam-turret', 50, 0.1, 1.25, '#b700dc', 9, 4, 2, 5);
            } 
            break;
        case 'KeyN':
            if (getTile(G.A.C.X, G.A.C.Y, true).type == 'platform' && getTile(G.A.C.X, G.A.C.Y).tower == null) {
                new Tower("Multishot", 'multi', G.A.C.X, G.A.C.Y, 'multi', 'multi-turret', 2, 5, 2, '#eded00', 4, 2, 10, 3);
            }
            break;
        case 'KeyM':
            if (getTile(G.A.C.X, G.A.C.Y, true).type == 'platform' && getTile(G.A.C.X, G.A.C.Y).tower == null) {
                new Tower("Aura", 'aura', G.A.C.X, G.A.C.Y, 'aura', 'aura-turret', 50, 0.02, 1.5, '#f17a00', 0, 0.2, 2, 200);
            }
            break;
        case 'KeyZ':
            if (getTile(G.A.C.X, G.A.C.Y, true).type == 'platform' && getTile(G.A.C.X, G.A.C.Y).tower == null) {
                new Tower("Ultimate", 'super', G.A.C.X, G.A.C.Y, 'super', 'super-turret', 4, 20, 3.5, '#f30000', 20, 2, 10, 2);
            }
            break;
        case 'KeyE':
            var enemy = Math.floor(Math.random() * 17);
            switch (enemy) {
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                    G.A.E.basic.generate(1, 1, 1);
                    break;
                case 7:
                case 8:
                case 9:
                    G.A.E.heavy.generate(1, 1, 1);
                    break;
                case 10:
                case 11:
                case 12:
                case 13:
                    G.A.E.fast.generate(1, 1, 1);
                    break;  
                case 14:
                    G.A.E.tank.generate(1, 1, 1);
                    break;
                case 15:
                case 16:
                    G.A.E.speeder.generate(1, 1, 1);
                    break;     
            }
            break;
        case 'KeyX':
        case 'Backspace':
        case 'Delete':
            for (var i = 0; i < G.T.B.length; i++) {
                if (G.T.B[i].x == G.A.C.X && G.T.B[i].y == G.A.C.Y && getTile(G.T.B[i].x, G.T.B[i].y, true).tower != null) {
                    getTile(G.T.B[i].x, G.T.B[i].y).tower = null;
                    G.T.B.splice(i, 1);
                } 
            }
    }
    } catch (err) {
        G.D = err.stack;
    } 
});

function Main () {
    try {
        for (const b of G.T.B) {
            b.tick();
        }
        for (var e = 0; e < G.T.E.length; e++) {
            if (G.T.E[e].tick()) {
                G.T.E.splice(e, 1);
                e--;
            }
        }
        for (var p = 0; p < G.T.P.length; p++) {
            if (G.T.P[p].tick()) {
                G.T.P.splice(p, 1);
                p--;
            }
        }
        Draw();
    } catch (e) {
        G.D = e.stack;
    }
    DrawConsole();
}

function DrawConsole() {
    G.C.fillStyle = 'red';
    G.C.font = '14px sans-serif';
    G.C.fillText(G.D, 10 + G.O.X, 24 + G.O.Y);
    //G.D = "";
}

function Draw () {
    G.C.clearRect(0, 0, G.width, G.height);
    G.C.fillStyle = 'black';
    G.C.fillRect(0, 0, G.width, G.height);
    switch (G.scene) {
        case 'l':
            DrawL();
            break;
        case 'm':
            DrawM();
    }
}

function DrawL () {
    G.C.fillStyle = 'white';
    G.C.font = '24px sans-serif';
    G.C.fillText('Loading...', 100, 100);
}

function DrawM () {
    DrawTrack();
    DrawEnemy();
    DrawTower();
    if (G.A.C.on) {
        texture = 'selected-invalid';
        try { if (getTile(G.A.C.X, G.A.C.Y).type == 'platform') {texture = 'selected';} } catch {};
        G.PC.clearRect(0, 0, G.A.A.config.scale[0], G.A.A.config.scale[1]);
        G.PC.drawImage(
            G.A.T,
            G.A.A.atlas[texture][0],
            G.A.A.atlas[texture][1],
            G.A.A.config.size[0],
            G.A.A.config.size[1],
            0,0,
            G.A.A.config.scale[0],
            G.A.A.config.scale[1]
        )
        G.C.save();
        G.C.translate(G.A.A.config.scale[0] * (G.A.C.X + 0.5) + G.O.X, G.A.A.config.scale[1] * (G.A.C.Y + 0.5) + G.O.Y);
        G.C.rotate(G.A.C.pos * Math.PI / 180);
        G.C.drawImage(
            G.P,
            -G.A.A.config.scale[0]/2,
            -G.A.A.config.scale[1]/2
        );
        G.C.restore();
    }
    DrawUI();
}

function DrawTrack() {
    for (const tile of G.T.T) {
        G.C.drawImage(G.A.T, 
            G.A.A.atlas[tile.texture][0], 
            G.A.A.atlas[tile.texture][1], 
            G.A.A.config.size[0], 
            G.A.A.config.size[1],
            tile.x * G.A.A.config.scale[0] + G.O.X,
            tile.y * G.A.A.config.scale[1] + G.O.Y,
            G.A.A.config.scale[0],
            G.A.A.config.scale[1]);
    }
    for (const location of G.T.L) {
        G.C.drawImage(G.A.T, 
            G.A.A.atlas[location.texture][0], 
            G.A.A.atlas[location.texture][1], 
            G.A.A.config.size[0], 
            G.A.A.config.size[1],
            location.x * G.A.A.config.scale[0] + G.O.X,
            location.y * G.A.A.config.scale[1] + G.O.Y,
            G.A.A.config.scale[0],
            G.A.A.config.scale[1]);
    }
}

function DrawTower() {
    //RENDERING ORDER: TOWERS
    for (const defense of G.T.B) {
        G.C.drawImage(G.A.T, 
            G.A.A.atlas[defense.texture][0], 
            G.A.A.atlas[defense.texture][1], 
            G.A.A.config.size[0], 
            G.A.A.config.size[1],
            defense.x * G.A.A.config.scale[0] + G.O.X,
            defense.y * G.A.A.config.scale[1] + G.O.Y,
            G.A.A.config.scale[0],
            G.A.A.config.scale[1]);
        G.PC.clearRect(0, 0, G.A.A.config.scale[0], G.A.A.config.scale[1]);
        G.PC.drawImage(
            G.A.T,
            G.A.A.atlas[defense.turret][0],
            G.A.A.atlas[defense.turret][1],
            G.A.A.config.size[0],
            G.A.A.config.size[1],
            0,0,
            G.A.A.config.scale[0],
            G.A.A.config.scale[1]
        )
        G.C.save();
        G.C.translate(G.A.A.config.scale[0] * (defense.x + 0.5) + G.O.X, G.A.A.config.scale[1] * (defense.y + 0.5) + G.O.Y);
        G.C.rotate(defense.direction * Math.PI / 180);
        G.C.drawImage(
            G.P,
            - G.A.A.config.scale[0]/2,
            - G.A.A.config.scale[1]/2
        );
        G.C.restore();
    }
    for (const projectile of G.T.P) {
        G.C.strokeStyle = projectile.color;
        G.C.lineWidth = projectile.width;
        G.C.beginPath();
        G.C.moveTo(projectile.x1 * G.A.A.config.scale[0] + G.O.X, projectile.y1 * G.A.A.config.scale[0] + G.O.Y);
        G.C.lineTo(projectile.x2 * G.A.A.config.scale[1] + G.O.X, projectile.y2 * G.A.A.config.scale[1] + G.O.Y);
        G.C.stroke();
    }
    //RENDERING ORDER: TOWER RANGE
    for (const defense of G.T.B) {
        if (defense.x != G.A.C.X || defense.y != G.A.C.Y || !G.A.C.on) continue;
        G.C.strokeStyle = defense.color;
        G.C.lineWidth = 2;
        gradient = G.C.createRadialGradient(G.A.A.config.scale[0] * (defense.x + 0.5) + G.O.X, G.A.A.config.scale[1] * (defense.y + 0.5) + G.O.Y, 0,
        G.A.A.config.scale[0] * (defense.x + 0.5) + G.O.X, G.A.A.config.scale[1] * (defense.y + 0.5) + G.O.Y, 
        defense.range * G.A.A.config.scale[0]);
        gradient.addColorStop(0, defense.color + '00');
        gradient.addColorStop(0.7, defense.color + '22');
        gradient.addColorStop(1, defense.color + 'cc');
        G.C.fillStyle = gradient;
        G.C.beginPath();
        G.C.arc(G.A.A.config.scale[0] * (defense.x + 0.5) + G.O.X, G.A.A.config.scale[1] * (defense.y + 0.5) + G.O.Y, 
        defense.range * G.A.A.config.scale[0], 0, 2 * Math.PI);
        G.C.stroke();
        G.C.fill();
    }
}

function DrawEnemy() {
    for (const enemy of G.T.E) {
        G.C.drawImage(G.A.T, 
            G.A.A.atlas[enemy.texture][0], 
            G.A.A.atlas[enemy.texture][1], 
            G.A.A.config.size[0], 
            G.A.A.config.size[1],
            enemy.x * G.A.A.config.scale[0] - G.A.A.config.scale[0] / 2 + G.O.X,
            enemy.y * G.A.A.config.scale[1] - G.A.A.config.scale[1] / 2 + G.O.Y,
            G.A.A.config.scale[0],
            G.A.A.config.scale[1]);
    }
}

function DrawUI () {
    if (getTile(G.A.C.X, G.A.C.Y, true).type == 'platform' && G.A.C.on) G.U.on = true;
    else G.U.on = false;
    if (G.U.on && G.U.anim < 50) G.U.anim += 10;
    if (!G.U.on && G.U.anim > 0) G.U.anim -= 10;
    offset = (96 * Math.sin((Math.PI / 50) * (G.U.anim - 25)) + 96)
    G.C.fillStyle = '#444';
    G.C.fillRect(0, 0, G.width, 48);
    G.C.fillRect(0, G.height - offset, G.width, 192);
    if (getTile(G.A.C.X, G.A.C.Y, true).tower == null) G.C.fillStyle = 'white';
    else G.C.fillStyle = getTile(G.A.C.X, G.A.C.Y, true).tower.color;
    G.C.textBaseline = 'top';
    G.C.font = "24px 'Press Start 2P', sans-serif";
    if (getTile(G.A.C.X, G.A.C.Y, true).tower == null && G.U.on) {
        G.C.fillText("Platform [Lv. -]", 10, G.height - offset + 10,);
    } else if (G.U.on) {
        tower = getTile(G.A.C.X, G.A.C.Y, true).tower;
        G.C.fillText(tower.name + ` [Lv. ${tower.level}]`, 10, G.height - offset + 10);
        G.C.font = "16px 'Press Start 2P', sans-serif";
        G.C.fillText("Kills: " + tower.kills.toLocaleString(), 10, G.height - offset + 44);
        G.C.fillText("Earned: " + tower.earned.toLocaleString() + "p", 10, G.height - offset + 64);
        G.C.fillText("Fire Rate: " + tower.firerate.toFixed(1) + "/s", 10, G.height - offset + 84);
        G.C.fillText("Damage: " + tower.damage.toFixed(1), 10, G.height - offset + 104);
        G.C.fillText("DPS: " + (tower.firerate * tower.damage).toFixed(1) + "/s", 10, G.height - offset + 124); 
        G.C.fillText("Range: " + tower.range.toFixed(2), 10, G.height - offset + 144);
        G.C.fillText("Shots: " + tower.shots.toFixed(0) + " (" + (tower.firerate * tower.damage * tower.shots).toFixed(0) + " DPS)", 10, G.height - offset + 164);
    }
    G.C.textBaseline = 'alphabetic';
    G.C.fillStyle = 'gold';
    G.C.font = "24px 'Press Start 2P', sans-serif";
    G.C.fillText(G.points.toLocaleString() + 'p', 12, 36);
    G.C.textAlign = 'right';
    if (G.hp / G.maxhp > 1) G.C.fillStyle = 'rgb(0, 255, ' + Math.round((G.hp / G.maxhp - 1) * 255) + ')';
    if (G.hp / G.maxhp > 0.5 && G.hp / G.maxhp <= 1) G.C.fillStyle = 'rgb(' + Math.round(255 - (G.hp / G.maxhp - 0.5) * 2 * 255) + ', 255, 0)';
    if (G.hp / G.maxhp <= 0.5) G.C.fillStyle = 'rgb(255, ' + Math.round((G.hp / G.maxhp) * 2 * 255) + ',0)';
    G.C.fillText('HP: ' + Math.max(Math.round(G.hp / G.maxhp * 100), 0) + '%|' + Math.max(Math.round(G.hp), 0), G.width - 12, 36);
    G.C.textAlign = 'left';
}

function StartLoad() {
    try {
    G.A.T = new Image();
    G.A.T.src = "tiles.png";
    G.A.T.style.display = 'none';
    G.A.T.onload = () => {
        EndLoad();
    }
    document.body.appendChild(G.A.T);
    } catch (e) {
        G.D = e.stack;
    }
}

function EndLoad() {
    G.scene = 'm';
    G.A.loaded = true;
}

StartLoad();

G.loop = setInterval(Main, 20);

G.canvas.addEventListener('wheel', (e) => {
    G.O.X -= G.M.X * (Math.max(0.5, Math.min(2, G.A.S - e.deltaY * 0.0005)) - G.A.S);
    G.O.Y -= G.M.Y * (Math.max(0.5, Math.min(2, G.A.S - e.deltaY * 0.0005)) - G.A.S);
    G.A.S = Math.max(0.5, Math.min(2, G.A.S - e.deltaY * 0.0005));
    G.A.A.config.scale[0] = G.A.S * G.A.A.config.defaultscale[0];
    G.A.A.config.scale[1] = G.A.S * G.A.A.config.defaultscale[1];
    G.P = new OffscreenCanvas(G.A.A.config.scale[0], G.A.A.config.scale[1]); //PRELOAD
    G.PC = G.P.getContext('2d');
});