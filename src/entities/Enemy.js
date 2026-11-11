import Phaser from 'phaser';
import { ENEMY } from '../config.js';
import { SHEET_INFO } from '../sprites.js';

// Как выглядит каждый враг.
// tex — одна картинка (запасной вариант); faces — куда она смотрит; cx — центр тела по ширине (доля);
// bw/bh — хитбокс в долях картинки.
// sheet — лист анимации движения из src/sprites.js (если он есть, берётся вместо картинки);
// sw/sh — хитбокс в долях роста фигуры; stand — кадр стойки; attack и death — листы выпада и падения.
const LOOK = {
  spearman: {
    tex: 'spearman', faces: -1, cx: 0.68, bw: 0.34, bh: 0.86,
    sheet: 'spearman-walk', sw: 0.3, sh: 0.86, attack: 'spearman-attack', death: 'spearman-death',
  },
  // лучник — временная картинка: старый копейщик без копья и с луком, нарисованным кодом (см. Boot.makeArcher)
  archer: { tex: 'archer', faces: -1, cx: 0.68, bw: 0.34, bh: 0.86 },
  wolf: { tex: 'wolf-1', faces: 1, cx: 0.5, bw: 0.62, bh: 0.9, sheet: 'wolf-run', sw: 1.0, sh: 0.8 },
  boar: { tex: 'boar', faces: 1, cx: 0.5, bw: 0.66, bh: 0.9, sheet: 'boar-run', sw: 1.0, sh: 0.8 },
  bear: { tex: 'bear', faces: 1, cx: 0.5, bw: 0.66, bh: 0.8, sheet: 'bear-walk', sw: 1.0, sh: 0.85 },
  deer: { tex: 'deer', faces: 1, cx: 0.5, bw: 0.5, bh: 0.6, sheet: 'deer-run', sw: 0.6, sh: 0.55, stand: 2 },
};

// кадры на листе выпада копейщика: стойка, замах, присел перед ударом, удар
const ATTACK = { stand: 0, back: 1, brace: 2, thrust: 3 };

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, d, range) {
    const look = LOOK[d.type];
    const info = look.sheet ? SHEET_INFO[look.sheet] : null;
    super(scene, d.x, d.y, info ? look.sheet : d.type === 'wolf' && d.x % 2 ? 'wolf-2' : look.tex);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.type = d.type;
    this.look = look;
    this.cfg = ENEMY[d.type];
    this.info = info || null; // данные текущего листа (null — враг из одной картинки)
    this.sheetKey = info ? look.sheet : null;
    this.hasAttack = !!(info && look.attack && SHEET_INFO[look.attack]);
    this.setDepth(45);
    this.baseTint = d.tint ?? look.tint ?? 0xffffff;
    this.setTint(this.baseTint);
    this.hp = this.cfg.hp ?? 1;
    this.harmful = d.type !== 'deer';
    this.range = range;
    this.state = 'patrol';
    this.timer = 0;
    this.nextShot = scene.time.now + 800 + (d.x % 700);
    this.lean = 0;
    this.seed = d.x * 0.013;
    this.dead = false;
    this.dir = -1;
    this.fit();
    this.shadow = scene.add.image(d.x, d.y, 'shadow').setDepth(44).setScale((this.cfg.height * (look.sw ?? 0.5) + 60) / 110, 0.2).setAlpha(0.5);
  }

  // Подгоняет размер, точку опоры (центр фигуры на линии ног) и хитбокс под текущую картинку и направление.
  fit() {
    const I = this.info;
    const L = this.look;
    const flipped = this.dir !== (I ? I.faces : L.faces);
    this.setFlipX(flipped);
    let ref, cx, bottom, w, h;
    if (I) {
      ref = I.refH;
      cx = I.cx;
      bottom = I.baseline;
      w = ref * L.sw;
      h = ref * L.sh;
    } else {
      ref = this.height;
      cx = this.width * L.cx;
      bottom = this.height;
      w = this.width * L.bw;
      h = this.height * L.bh;
    }
    // картинка отражается относительно середины кадра, поэтому центр фигуры при отражении переезжает
    if (flipped) cx = this.width - cx;
    this.setScale(this.cfg.height / ref);
    this.setOrigin(I ? cx / this.width : 0.5, bottom / this.height);
    this.body.setSize(w, h);
    this.body.setOffset(cx - w / 2, bottom - h);
  }

  // переключиться на другой лист (например, с бега на выпад) и показать кадр
  use(key, frame = 0) {
    if (this.sheetKey !== key) {
      const I = SHEET_INFO[key];
      if (!I) return false;
      this.anims.stop();
      this.setTexture(key, frame);
      this.sheetKey = key;
      this.info = I;
      this.fit();
    } else if (!this.anims.isPlaying) this.setFrame(frame);
    return true;
  }

  setFacing(dir) {
    if (dir === this.dir) return;
    this.dir = dir;
    this.fit();
  }

  sees(player, sight, dyMax = 170) {
    return Math.abs(player.x - this.x) < sight && Math.abs(player.y - this.y) < dyMax && player.hp > 0;
  }

  walk(speed) {
    if (this.x <= this.range[0]) this.setFacing(1);
    else if (this.x >= this.range[1]) this.setFacing(-1);
    this.body.setVelocityX(this.dir * speed);
  }

  // не даём выйти за край платформы
  clamp() {
    if ((this.x <= this.range[0] && this.body.velocity.x < 0) || (this.x >= this.range[1] && this.body.velocity.x > 0)) {
      this.body.setVelocityX(0);
      return true;
    }
    return false;
  }

  update(time, player) {
    if (this.dead) return;
    const c = this.cfg;
    const dx = player.x - this.x;
    const toP = dx < 0 ? -1 : 1;
    const sfx = this.scene.game.sfx;
    let lean = 0;

    switch (this.type) {
      case 'spearman':
        if (this.state === 'patrol') {
          this.walk(c.speed);
          if (this.sees(player, c.sight)) {
            this.setFacing(toP);
            this.state = 'windup';
            this.timer = time + c.windupMs;
            this.body.setVelocityX(0);
          }
        } else if (this.state === 'windup') {
          lean = -14;
          this.setTint(Math.floor(time / 90) % 2 ? 0xffb0a0 : this.baseTint);
          if (time > this.timer) {
            this.state = 'lunge';
            this.timer = time + c.lungeMs;
            this.body.setVelocityX(this.dir * c.lungeSpeed);
            this.setTint(this.baseTint);
            if (sfx) sfx.play('swing');
          }
        } else if (this.state === 'lunge') {
          lean = 16;
          this.clamp();
          if (time > this.timer) {
            this.state = 'rest';
            this.timer = time + c.restMs;
            this.body.setVelocityX(0);
          }
        } else if (time > this.timer) this.state = 'patrol';
        break;

      case 'archer':
        this.body.setVelocityX(0);
        if (this.state !== 'aim') {
          this.setFacing(toP);
          if (time > this.nextShot && this.sees(player, c.sight, 520) && this.scene.cameras.main.worldView.contains(this.x, this.y - 100)) {
            this.state = 'aim';
            this.timer = time + c.aimMs;
            if (sfx) sfx.play('draw');
          }
        } else {
          lean = -8;
          this.setTint(Math.floor(time / 100) % 2 ? 0xffe27a : this.baseTint);
          if (time > this.timer) {
            this.state = 'patrol';
            this.nextShot = time + c.reloadMs;
            this.setTint(this.baseTint);
            this.fireAt(player);
          }
        }
        break;

      case 'wolf':
      case 'bear':
        if (this.sees(player, c.sight)) {
          this.setFacing(toP);
          this.body.setVelocityX(Math.abs(dx) > 30 ? this.dir * c.chaseSpeed : 0);
          this.clamp();
          lean = 5;
        } else this.walk(c.speed);
        break;

      case 'boar':
        if (this.state === 'patrol') {
          this.walk(c.speed);
          if (this.sees(player, c.sight, 110)) {
            this.setFacing(toP);
            this.state = 'windup';
            this.timer = time + c.windupMs;
            this.body.setVelocityX(0);
          }
        } else if (this.state === 'windup') {
          lean = -10;
          this.x += Math.sin(time * 0.09) * 1.2;
          if (time > this.timer) {
            this.state = 'charge';
            this.timer = time + c.chargeMs;
            this.body.setVelocityX(this.dir * c.chargeSpeed);
            if (sfx) sfx.play('swing');
          }
        } else if (this.state === 'charge') {
          lean = 8;
          if (this.clamp() || time > this.timer) {
            this.state = 'rest';
            this.timer = time + c.restMs;
            this.body.setVelocityX(0);
          }
        } else if (time > this.timer) this.state = 'patrol';
        break;

      case 'deer':
        if (Math.abs(dx) < c.sight) {
          this.setFacing(-toP);
          this.body.setVelocityX(this.dir * c.speed);
          this.clamp();
        } else this.body.setVelocityX(0);
        break;
    }

    const moving = Math.abs(this.body.velocity.x) > 10;
    if (this.sheetKey) this.pose(moving, time);

    // враги без листа анимации оживляются кодом: покачивание и наклон; с листом — только лёгкий наклон
    if (this.hasAttack) lean = 0;
    else if (this.sheetKey) lean *= 0.4;
    const bob = this.sheetKey ? 0 : moving ? Math.sin(time * 0.016 + this.seed) * 3 : Math.sin(time * 0.003 + this.seed) * 0.8;
    this.lean += (lean - this.lean) * 0.2;
    this.setAngle((this.lean + bob) * this.dir);
    this.shadow.setPosition(this.x, this.y + 2);
  }

  // какой кадр показывать врагу с листами анимации
  pose(moving, time) {
    const L = this.look;
    if (this.hasAttack) {
      const st = this.state;
      if (st === 'windup') {
        this.anims.stop();
        this.use(L.attack, this.timer - time > this.cfg.windupMs / 2 ? ATTACK.back : ATTACK.brace);
        return;
      }
      if (st === 'lunge') {
        this.anims.stop();
        this.use(L.attack, ATTACK.thrust);
        return;
      }
      if (!moving) {
        this.anims.stop();
        this.use(L.attack, ATTACK.stand);
        return;
      }
    }
    this.use(L.sheet, L.stand ?? 0);
    if (moving) {
      // чем быстрее враг, тем быстрее сменяются кадры
      this.anims.play(L.sheet, true);
      this.anims.timeScale = Math.min(2.2, 0.6 + Math.abs(this.body.velocity.x) / 250);
    } else if (this.anims.isPlaying) {
      this.anims.stop();
      this.setFrame(L.stand ?? 0);
    }
  }

  fireAt(player) {
    const c = this.cfg;
    const sx = this.x + this.dir * 30;
    const sy = this.y - this.displayHeight * 0.62;
    const dx = player.x - sx;
    const dy = player.y - 95 - sy;
    const t = Phaser.Math.Clamp(Math.abs(dx) / c.arrowSpeed, 0.35, 1.6);
    this.scene.enemyArrows.fire(sx, sy, dx / t, dy / t - (c.arrowGravity * t) / 2, { gravity: c.arrowGravity });
    if (this.scene.game.sfx) this.scene.game.sfx.play('shoot', false);
  }

  hit(arrow) {
    if (this.dead) return;
    this.hp -= arrow.damage;
    const sfx = this.scene.game.sfx;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => {
      if (!this.active) return;
      if (!this.dead) this.setTint(this.baseTint);
      else this.clearTint();
    });
    if (this.hp <= 0) this.die();
    else if (sfx) sfx.play('hit');
  }

  die() {
    const scene = this.scene;
    this.dead = true;
    this.harmful = false;
    this.body.enable = false;
    this.shadow.destroy();
    if (scene.game.sfx) scene.game.sfx.play('die');
    const death = this.look.death;
    if (this.sheetKey && death && SHEET_INFO[death]) {
      // настоящая анимация падения: кадры по очереди, потом тело тает
      this.anims.stop();
      this.setAngle(0);
      this.use(death, 0);
      const n = SHEET_INFO[death].count;
      for (let i = 1; i < n; i++) {
        scene.time.delayedCall(i * 150, () => {
          if (this.active) this.setFrame(i);
        });
      }
      scene.tweens.add({ targets: this, alpha: 0, delay: n * 150 + 700, duration: 500, onComplete: () => this.destroy() });
      return;
    }
    scene.tweens.add({
      targets: this, alpha: 0, angle: this.dir * -80, y: this.y + 10, duration: 550, ease: 'Quad.easeIn',
      onComplete: () => this.destroy(),
    });
  }
}
