import Phaser from 'phaser';
import { BOSS } from '../config.js';
import Enemy from './Enemy.js';
import { SHEET_INFO } from '../sprites.js';

// номера кадров на листе bel-sheet
const FRAME = { stand: 5, windup: 2, strike: 3 };

// Бел. Обычные стрелы отскакивают от щита, ранят только заряженные выстрелы.
// Атаки: рывок с мечом и удар по земле с волной. На половине здоровья зовёт двух копейщиков.
export default class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, d) {
    // если есть лист анимации — берём его, иначе одну картинку bel.png
    const info = SHEET_INFO['bel-sheet'] || null;
    super(scene, d.x, d.y, info ? 'bel-sheet' : 'bel', info ? FRAME.stand : undefined);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.info = info;
    if (info) {
      this.baseScale = BOSS.height / info.figH;
      this.setOrigin(info.cx / info.W, info.baseline / info.H).setScale(this.baseScale).setDepth(46);
      const w = info.figH * 0.32;
      const h = info.figH * 0.86;
      this.body.setSize(w, h).setOffset(info.cx - w / 2, info.baseline - h);
    } else {
      this.baseScale = BOSS.height / this.height;
      this.setOrigin(0.5, 1).setScale(this.baseScale).setDepth(46);
      const w = this.width * 0.36;
      const h = this.height * 0.84;
      this.body.setSize(w, h).setOffset((this.width - w) / 2, this.height - h);
    }
    this.d = d;
    this.arena = [d.arenaX + 130, d.arenaX + d.arenaW - 130];
    this.hp = this.maxHp = BOSS.hp;
    this.awake = false;
    this.dead = false;
    this.state = 'sleep';
    this.timer = 0;
    this.dir = -1;
    this.invulnUntil = 0;
    this.summoned = false;
    this.lastAttack = 'slam';
    this.slowArrow = null;
    this.lean = 0;
    this.stretch = 1;
    this.shadow = scene.add.image(d.x, d.y, 'shadow').setDepth(45).setScale(2, 0.3).setAlpha(0.55);

    // две волны от удара по земле (берутся из запаса)
    this.waves = scene.physics.add.group({ allowGravity: false });
    for (let i = 0; i < 2; i++) {
      const wv = this.waves.create(0, 0, 'glow').setTint(0xd8c4a0).setScale(0.75, 0.42).setDepth(47).setBlendMode('ADD');
      wv.body.setSize(70, 150).setOffset(93, 60);
      wv.disableBody(true, true);
    }
  }

  get phase() {
    return Math.min(2, Math.floor(((this.maxHp - this.hp) * 3) / this.maxHp));
  }

  face(dir) {
    this.dir = dir;
    // bel.png смотрит влево, лист анимации — вправо
    this.setFlipX(this.info ? dir < 0 : dir > 0);
    const I = this.info;
    if (I) {
      // картинка отражается относительно середины кадра — переносим точку опоры и хитбокс на центр фигуры
      const cx = dir < 0 ? I.W - I.cx : I.cx;
      this.setOrigin(cx / I.W, I.baseline / I.H);
      this.body.setOffset(cx - this.body.width / 2 / this.scaleX, I.baseline - this.body.height / this.scaleY);
    }
  }

  wake(time) {
    this.awake = true;
    this.state = 'idle';
    this.timer = time + 1600;
    if (this.scene.game.sfx) this.scene.game.sfx.play('horn');
  }

  update(time) {
    const scene = this.scene;
    const pl = scene.player;
    if (this.dead) return;
    if (!this.awake) {
      if (pl.x > this.d.arenaX + 260) {
        this.wake(time);
        scene.lockArena(this.d);
      }
      return;
    }
    const ph = this.phase;
    const dx = pl.x - this.x;
    const sfx = scene.game.sfx;
    let lean = 0;
    let stretch = 1;

    switch (this.state) {
      case 'idle':
        this.face(dx < 0 ? -1 : 1);
        this.body.setVelocityX(Math.abs(dx) > 280 ? this.dir * BOSS.walkSpeed[ph] : 0);
        this.clamp();
        if (time > this.timer) this.pickAttack(time, pl, dx);
        break;
      case 'dashWind':
        this.body.setVelocityX(0);
        lean = -12;
        this.setTint(Math.floor(time / 90) % 2 ? 0xff8a70 : 0xffffff);
        if (time > this.timer) {
          this.state = 'dash';
          this.timer = time + BOSS.dashMs;
          this.clearTint();
          this.body.setVelocityX(this.dir * BOSS.dashSpeed[ph]);
          if (sfx) sfx.play('swing');
        }
        break;
      case 'dash':
        lean = 14;
        if (this.clamp() || time > this.timer) this.rest(time);
        break;
      case 'slamWind':
        this.body.setVelocityX(0);
        lean = -6;
        stretch = 1.1;
        this.setTint(Math.floor(time / 90) % 2 ? 0xffe27a : 0xffffff);
        if (time > this.timer) {
          this.clearTint();
          this.slam();
          this.rest(time);
        }
        break;
      case 'summon':
        this.body.setVelocityX(0);
        stretch = 1.06;
        if (time > this.timer) {
          for (const x of [this.arena[0] + 40, this.arena[1] - 40]) {
            const e = new Enemy(scene, { type: 'spearman', x, y: this.d.y }, [this.arena[0], this.arena[1]]);
            e.setAlpha(0);
            scene.tweens.add({ targets: e, alpha: 1, duration: 500 });
            scene.enemies.add(e);
          }
          this.rest(time);
        }
        break;
    }

    if (this.info) {
      // кадры: замах перед атакой, удар в рывке, шаг при ходьбе, стойка
      const st = this.state;
      if (st === 'dashWind' || st === 'slamWind') {
        this.anims.stop();
        this.setFrame(FRAME.windup);
      } else if (st === 'dash') {
        this.anims.stop();
        this.setFrame(FRAME.strike);
      } else if (Math.abs(this.body.velocity.x) > 10) this.anims.play('bel-walk', true);
      else {
        this.anims.stop();
        this.setFrame(FRAME.stand);
      }
    }
    this.lean += (lean - this.lean) * 0.2;
    const bob = this.info ? 0 : Math.abs(this.body.velocity.x) > 10 ? Math.sin(time * 0.012) * 2 : Math.sin(time * 0.003) * 0.6;
    this.setAngle((this.lean + bob) * this.dir);
    this.stretch += (stretch - this.stretch) * 0.15;
    this.setScale(this.baseScale, this.baseScale * this.stretch);
    this.setAlpha(time < this.invulnUntil && Math.floor(time / 60) % 2 ? 0.55 : 1);
    this.shadow.setPosition(this.x, this.y + 2);

    // волны исчезают у края арены
    const ws = this.waves.getChildren();
    for (let i = 0; i < ws.length; i++) {
      const wv = ws[i];
      if (wv.active && (wv.x < this.arena[0] - 110 || wv.x > this.arena[1] + 110)) wv.disableBody(true, true);
    }

    this.updateFinalShot(time);
  }

  clamp() {
    const v = this.body.velocity.x;
    if ((this.x <= this.arena[0] && v < 0) || (this.x >= this.arena[1] && v > 0)) {
      this.body.setVelocityX(0);
      return true;
    }
    return false;
  }

  rest(time) {
    this.state = 'idle';
    this.timer = time + BOSS.restMs[this.phase];
    this.body.setVelocityX(0);
  }

  pickAttack(time, pl, dx) {
    const ph = this.phase;
    const sfx = this.scene.game.sfx;
    if (!this.summoned && this.hp <= this.maxHp / 2) {
      this.summoned = true;
      this.state = 'summon';
      this.timer = time + 1000;
      if (sfx) sfx.play('horn');
      return;
    }
    // если герой наверху или далеко — удар по земле, иначе чередуем
    const high = pl.y < this.y - 150;
    let atk = this.lastAttack === 'dash' ? 'slam' : 'dash';
    if (high || Math.abs(dx) > 800) atk = 'slam';
    this.lastAttack = atk;
    this.face(dx < 0 ? -1 : 1);
    if (atk === 'dash') {
      this.state = 'dashWind';
      this.timer = time + BOSS.dashWindupMs[ph];
    } else {
      this.state = 'slamWind';
      this.timer = time + BOSS.slamWindupMs[ph];
    }
    if (sfx) sfx.play('warn');
  }

  slam() {
    const scene = this.scene;
    scene.cameras.main.shake(260, 0.012);
    if (scene.game.sfx) scene.game.sfx.play('slam');
    const ws = this.waves.getChildren();
    [-1, 1].forEach((dir, i) => {
      const wv = ws[i];
      wv.enableBody(true, this.x + dir * 90, this.y - 60, true, true);
      wv.body.setAllowGravity(false);
      wv.setVelocityX(dir * BOSS.waveSpeed[this.phase]);
    });
  }

  // попадание стрелы
  onArrow(a) {
    if (this.dead || a.stuck || a.spent) return;
    const scene = this.scene;
    const time = scene.time.now;
    const sfx = scene.game.sfx;
    if (!a.charged) {
      // щит отбивает обычную стрелу
      a.spent = true;
      a.setVelocity(-a.body.velocity.x * 0.4, -300);
      if (sfx) sfx.play('clang');
      return;
    }
    scene.arrows.kill(a);
    if (time < this.invulnUntil) return;
    this.hp--;
    this.invulnUntil = time + BOSS.hurtInvulnMs;
    this.setTintFill(0xffffff);
    scene.time.delayedCall(100, () => this.clearTint());
    if (sfx) sfx.play('bosshit');
    if (this.hp <= 0) this.die();
    else if (this.state === 'dashWind' || this.state === 'slamWind') this.rest(time); // меткий выстрел срывает атаку
  }

  // последний удар: время замедляется, камера летит за стрелой
  updateFinalShot(time) {
    const scene = this.scene;
    if (this.slowArrow) {
      const a = this.slowArrow;
      if (!a.active || a.stuck || a.spent) this.endSlow();
      return;
    }
    if (this.hp !== 1 || time < this.invulnUntil) return;
    const list = scene.arrows.group.getChildren();
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a.active || a.stuck || a.spent || !a.charged) continue;
      const dx = this.x - a.x;
      if (Math.abs(dx) < 700 && Math.abs(dx) > 60 && Math.sign(dx) === Math.sign(a.body.velocity.x) && Math.abs(a.y - (this.y - 150)) < 170) {
        this.slowArrow = a;
        a.dieAt += 8000;
        scene.physics.world.timeScale = 5;
        scene.cameras.main.startFollow(a, false, 0.25, 0.25);
        scene.cameras.main.zoomTo(1.3, 500);
        if (scene.game.sfx) scene.game.sfx.play('slow');
        break;
      }
    }
  }

  endSlow() {
    const scene = this.scene;
    this.slowArrow = null;
    scene.physics.world.timeScale = 1;
    scene.cameras.main.zoomTo(1, 500);
    scene.cameras.main.startFollow(this.dead ? this : scene.player, false, 0.09, 1);
  }

  die() {
    const scene = this.scene;
    this.dead = true;
    this.body.enable = false;
    this.setAlpha(1).setScale(this.baseScale);
    if (this.info) {
      this.anims.stop();
      this.setFrame(FRAME.stand);
    }
    const ws = this.waves.getChildren();
    for (let i = 0; i < ws.length; i++) ws[i].disableBody(true, true);
    scene.onBossDefeated();
    scene.cameras.main.flash(500, 255, 240, 200);
    scene.cameras.main.shake(400, 0.01);
    scene.cameras.main.startFollow(this, false, 0.1, 0.1);
    scene.tweens.add({ targets: this, angle: -this.dir * 88, y: this.y + 6, duration: 1600, ease: 'Quad.easeIn' });
    scene.time.delayedCall(1700, () => {
      scene.physics.world.timeScale = 1;
      this.slowArrow = null;
      scene.cameras.main.zoomTo(1, 800);
      scene.cameras.main.shake(300, 0.012);
      if (scene.game.sfx) scene.game.sfx.play('slam');
    });
    scene.time.delayedCall(4200, () => scene.finish());
  }
}
