import Phaser from 'phaser';
import { PLAYER, BOW, BLOOD } from '../config.js';

const FEET_Y = 188; // линия ног в кадре 200×196
const WAIST_Y = 116; // линия пояса в кадре: выше — торс, ниже — ноги
const LEGS_SHIFT = 20; // на сколько сдвинуть бегущие ноги вперёд, чтобы они встали под торс с луком

function toward(v, target, step) {
  if (v < target) return Math.min(v + step, target);
  if (v > target) return Math.max(v - step, target);
  return v;
}

// Айк: бег с разгоном, прыжок (coyote time, буфер, переменная высота), лук.
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'hayk', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, FEET_Y / 196).setScale(PLAYER.scale).setDepth(50);
    this.body.setSize(PLAYER.bodyW, PLAYER.bodyH);
    this.body.setOffset(104 - PLAYER.bodyW / 2, FEET_Y - PLAYER.bodyH);
    this.body.setMaxVelocityY(PLAYER.maxFall);

    this.keys = scene.input.keyboard.addKeys('LEFT,RIGHT,UP,A,D,W,SPACE,X');
    this.facing = 1;
    this.hp = PLAYER.maxHp;
    this.lastGround = -1e9;
    this.bufferUntil = 0;
    this.jumping = false;
    this.wasOnGround = false;
    this.invulnUntil = 0;
    this.stunUntil = 0;
    this.chargeStart = 0; // 0 — тетива не натянута
    this.nextShot = 0;
    this.shotAnimUntil = 0;
    this.stepAt = 0;
    this.groundObj = null; // на чём стоим (ставит сцена при столкновении)
    this.frozen = false;

    this.shadow = scene.add.image(x, y, 'shadow').setDepth(49).setScale(1.1, 0.22).setAlpha(0.5);
    // Отдельные «ноги»: когда герой идёт с натянутым луком, верх тела берётся из кадра выстрела,
    // а низ — из анимации бега (кадров «ходьба с натянутым луком» на ленте нет).
    this.legs = scene.add.sprite(x, y, 'hayk', 1).setOrigin(0.5, FEET_Y / 196).setScale(PLAYER.scale).setDepth(49.9).setVisible(false);
    this.legs.setCrop(0, WAIST_Y, 200, 196 - WAIST_Y);
    this.bar = scene.add.graphics().setDepth(60); // полоска заряда
  }

  get onGround() {
    return this.body.blocked.down || this.body.touching.down;
  }

  get charge() {
    return this.chargeStart ? Math.min(1, (this.scene.time.now - this.chargeStart) / BOW.chargeMs) : 0;
  }

  update(time, delta) {
    const dt = delta / 1000;
    const k = this.keys;
    const body = this.body;
    const onGround = this.onGround;
    const sfx = this.scene.game.sfx;
    const ice = onGround && this.groundObj && this.groundObj.ice;
    const stunned = time < this.stunUntil || this.frozen;

    // движение
    let dir = 0;
    if (!stunned) dir = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
    let vx = body.velocity.x;
    const mul = ice ? PLAYER.iceMul : 1;
    // порыв ветра сносит только в воздухе: сдвигает скорость, к которой стремится герой
    const wind = onGround ? 0 : this.scene.windSpeed || 0;
    if (dir !== 0) {
      vx = toward(vx, dir * PLAYER.runSpeed + wind, (onGround ? PLAYER.accel * mul : PLAYER.airAccel) * dt);
      this.facing = dir;
    } else if (!stunned || onGround) {
      vx = toward(vx, wind, (onGround ? PLAYER.decel * mul : wind ? PLAYER.airAccel : PLAYER.airDecel) * dt);
    }
    body.setVelocityX(vx);

    // прыжок
    if (onGround) {
      this.lastGround = time;
      if (!this.wasOnGround && sfx) sfx.play('land', this.surface());
    }
    const jumpDown = k.SPACE.isDown || k.UP.isDown || k.W.isDown;
    if (!stunned && (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.UP) || Phaser.Input.Keyboard.JustDown(k.W))) {
      this.bufferUntil = time + PLAYER.bufferMs;
    }
    if (time < this.bufferUntil && time - this.lastGround < PLAYER.coyoteMs) {
      body.setVelocityY(-PLAYER.jumpVelocity);
      this.bufferUntil = 0;
      this.lastGround = -1e9;
      this.jumping = true;
      if (sfx) sfx.play('jump');
    } else if (this.jumping) {
      if (body.velocity.y >= 0) this.jumping = false;
      else if (!jumpDown) {
        body.setVelocityY(body.velocity.y * PLAYER.jumpCut);
        this.jumping = false;
      }
    }

    // лук
    if (!stunned) {
      if (k.X.isDown && !this.chargeStart && time > this.nextShot) {
        this.chargeStart = time;
        if (sfx) sfx.play('draw');
      } else if (!k.X.isDown && this.chargeStart) this.shoot(time);
    } else this.chargeStart = 0;

    // кадр анимации
    this.setFlipX(this.facing < 0);
    const aimWalk = !!this.chargeStart && onGround && Math.abs(vx) > 40;
    if (aimWalk) {
      // торс с луком + бегущие ноги
      this.setCrop(0, 0, 200, WAIST_Y);
      // в кадрах бега таз сдвинут назад относительно кадра выстрела — подвигаем ноги под торс
      this.legs.setVisible(true).setPosition(this.x + this.facing * LEGS_SHIFT, this.y).setFlipX(this.facing < 0);
      this.legs.anims.play('hayk-run', true);
      if (time > this.stepAt) {
        this.stepAt = time + 290;
        if (sfx) sfx.play('step', this.surface());
      }
    } else if (this.legs.visible) {
      this.setCrop();
      this.legs.setVisible(false);
      this.legs.anims.stop();
    }
    if (this.chargeStart) {
      this.anims.stop();
      this.setFrame(time - this.chargeStart < 120 ? 11 : 12);
    } else if (time < this.shotAnimUntil) {
      this.anims.stop();
      this.setFrame(13);
    } else if (!onGround) {
      this.anims.stop();
      this.setFrame(8);
    } else if (Math.abs(vx) > 40) {
      this.anims.play('hayk-run', true);
      if (time > this.stepAt) {
        this.stepAt = time + 290;
        if (sfx) sfx.play('step', this.surface());
      }
    } else {
      this.anims.stop();
      this.setFrame(0);
    }

    // мигание при неуязвимости
    this.setAlpha(time < this.invulnUntil && Math.floor(time / 70) % 2 ? 0.35 : 1);
    this.legs.setAlpha(this.alpha);

    // тень и полоска заряда
    this.shadow.setVisible(onGround).setPosition(this.x, this.y + 2);
    this.bar.clear();
    if (this.chargeStart) {
      const c = this.charge;
      const bx = this.x - 45;
      const by = this.y - 215;
      this.bar.fillStyle(0x000000, 0.6).fillRect(bx - 2, by - 2, 94, 12);
      this.bar.fillStyle(c >= 1 ? 0xffd75e : 0xd8c9a0, 1).fillRect(bx, by, 90 * c, 8);
    }

    this.wasOnGround = onGround;
    this.groundObj = null;
  }

  surface() {
    return (this.groundObj && this.groundObj.surface) || this.scene.surface || 'stone';
  }

  shoot(time) {
    const c = this.charge;
    const full = c >= 1;
    this.chargeStart = 0;
    this.nextShot = time + BOW.cooldownMs;
    this.shotAnimUntil = time + 170;
    const speed = BOW.speedMin + (BOW.speedMax - BOW.speedMin) * c;
    this.scene.arrows.fire(this.x + this.facing * BOW.forward, this.y - BOW.height, this.facing * speed, -30 - 50 * c, {
      damage: full ? BOW.damageCharged : BOW.damage,
      charged: full,
      gravity: full ? BOW.gravityCharged : BOW.gravity,
    });
    if (this.scene.game.sfx) this.scene.game.sfx.play('shoot', full);
  }

  hurt(dmg, fromX) {
    const time = this.scene.time.now;
    if (time < this.invulnUntil || this.scene.god || this.frozen || this.hp <= 0) return false;
    this.hp -= dmg;
    this.invulnUntil = time + PLAYER.invulnMs;
    this.stunUntil = time + PLAYER.stunMs;
    if (this.scene.bleed) this.scene.bleed(this.x, this.y - 110, BLOOD.hero);
    this.chargeStart = 0;
    this.body.setVelocity((this.x < fromX ? -1 : 1) * PLAYER.knockX, -PLAYER.knockY);
    this.jumping = false;
    this.scene.cameras.main.shake(140, 0.006);
    if (this.scene.game.sfx) this.scene.game.sfx.play('hurt');
    this.scene.onPlayerHp();
    return true;
  }

  // поставить героя в точку (возрождение)
  place(x, y) {
    this.setPosition(x, y);
    this.body.reset(x, y);
    this.chargeStart = 0;
    this.jumping = false;
  }
}
