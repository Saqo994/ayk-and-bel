import Phaser from 'phaser';
import { ENEMY } from '../config.js';
import { SHEET_INFO } from '../sprites.js';

// sheet — лист анимации из src/sprites.js (если он есть, берётся вместо картинки); sw/sh — хитбокс в долях роста фигуры на листе.
// Описание картинок: faces — куда смотрит исходная картинка, cx — где центр тела по ширине (доля),
// bw/bh — размер хитбокса в долях картинки.
const LOOK = {
  spearman: { tex: 'spearman', faces: -1, cx: 0.68, bw: 0.34, bh: 0.86, sheet: 'spearman-walk', sw: 0.3, sh: 0.86 },
  archer: { tex: 'spearman', faces: -1, cx: 0.68, bw: 0.34, bh: 0.86, tint: 0x8ea4d6 },
  wolf: { tex: 'wolf-1', faces: 1, cx: 0.5, bw: 0.62, bh: 0.9, sheet: 'wolf-run', sw: 1.0, sh: 0.8 },
  boar: { tex: 'boar', faces: 1, cx: 0.5, bw: 0.66, bh: 0.9 },
  bear: { tex: 'bear', faces: 1, cx: 0.5, bw: 0.66, bh: 0.8, sheet: 'bear-walk', sw: 1.0, sh: 0.85 },
  deer: { tex: 'deer', faces: 1, cx: 0.5, bw: 0.5, bh: 0.6, sheet: 'deer-run', sw: 0.6, sh: 0.55, stand: 2 },
};

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, d, range) {
    const look = LOOK[d.type];
    // если для врага есть лист анимации — берём его, иначе одну картинку
    const info = look.sheet ? SHEET_INFO[look.sheet] : null;
    super(scene, d.x, d.y, info ? look.sheet : d.type === 'wolf' && d.x % 2 ? 'wolf-2' : look.tex);
    this.info = info || null;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.type = d.type;
    this.look = look;
    this.cfg = ENEMY[d.type];
    // размеры тела в пикселях кадра: ширина, высота, центр по ширине, линия ног, рост фигуры
    this.geom = info
      ? { w: info.figH * look.sw, h: info.figH * look.sh, cx: info.cx, bottom: info.baseline, figH: info.figH, faces: info.faces }
      : { w: this.width * look.bw, h: this.height * look.bh, cx: this.width * look.cx, bottom: this.height, figH: this.height, faces: look.faces };
    this.setOrigin(info ? info.cx / info.W : 0.5, this.geom.bottom / this.height).setScale(this.cfg.height / this.geom.figH).setDepth(45);
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
    this.setFacing(-1);
    this.shadow = scene.add.image(d.x, d.y, 'shadow').setDepth(44).setScale(this.displayWidth / 150, 0.2).setAlpha(0.5);
  }

  setFacing(dir) {
    this.dir = dir;
    const G = this.geom;
    const flipped = dir !== G.faces;
    this.setFlipX(flipped);
    // картинка отражается относительно середины кадра, поэтому центр фигуры при отражении переезжает
    const cx = flipped ? this.width - G.cx : G.cx;
    if (this.info) this.setOrigin(cx / this.width, G.bottom / this.height);
    this.body.setSize(G.w, G.h);
    this.body.setOffset(cx - G.w / 2, G.bottom - G.h);
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

    // оживление без кадров анимации: покачивание и наклон
    const moving = Math.abs(this.body.velocity.x) > 10;
    if (this.info) {
      // настоящая анимация шага; чем быстрее враг, тем быстрее кадры
      if (moving) {
        this.anims.play(this.look.sheet, true);
        this.anims.timeScale = Math.min(2.2, 0.6 + Math.abs(this.body.velocity.x) / 250);
      } else if (this.anims.isPlaying) {
        this.anims.stop();
        this.setFrame(this.look.stand ?? 0);
      }
    }
    const bob = this.info ? 0 : moving ? Math.sin(time * 0.016 + this.seed) * 3 : Math.sin(time * 0.003 + this.seed) * 0.8;
    this.lean += (lean - this.lean) * 0.2;
    this.setAngle((this.lean + bob) * this.dir);
    this.shadow.setPosition(this.x, this.y + 2);
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
      if (!this.dead) this.setTint(this.baseTint);
      else this.clearTint();
    });
    if (this.hp <= 0) this.die();
    else if (sfx) sfx.play('hit');
  }

  die() {
    this.dead = true;
    this.harmful = false;
    this.body.enable = false;
    this.shadow.destroy();
    if (this.scene.game.sfx) this.scene.game.sfx.play('die');
    this.scene.tweens.add({
      targets: this, alpha: 0, angle: this.dir * -80, y: this.y + 10, duration: 550, ease: 'Quad.easeIn',
      onComplete: () => this.destroy(),
    });
  }
}
