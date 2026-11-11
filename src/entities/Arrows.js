import { BOW, WORLD } from '../config.js';

// Запас стрел: стрелы не создаются заново при каждом выстреле, а берутся из запаса и возвращаются.
export default class Arrows {
  constructor(scene, size = BOW.poolSize, tint = 0xffffff) {
    this.scene = scene;
    this.tint = tint;
    this.group = scene.physics.add.group({ defaultKey: 'arrow', maxSize: size });
  }

  fire(x, y, vx, vy, opts = {}) {
    const a = this.group.get(x, y);
    if (!a) return null;
    a.enableBody(true, x, y, true, true);
    a.setDepth(55).setScale(1.25).setAlpha(1).setTint(opts.charged ? 0xffe9a8 : this.tint);
    a.body.setSize(26, 9).setOffset(36, 0);
    a.body.setAllowGravity(true);
    a.body.setGravityY((opts.gravity ?? BOW.gravity) - WORLD.gravity);
    a.setVelocity(vx, vy);
    a.rotation = Math.atan2(vy, vx);
    a.damage = opts.damage ?? 1;
    a.charged = !!opts.charged;
    a.stuck = false;
    a.dieAt = this.scene.time.now + BOW.flyMs;
    return a;
  }

  // стрела воткнулась в стену
  stick(a) {
    if (a.stuck) return;
    a.stuck = true;
    a.body.stop();
    a.body.setAllowGravity(false);
    a.body.enable = false;
    a.dieAt = this.scene.time.now + BOW.stuckMs;
    if (this.scene.game.sfx) this.scene.game.sfx.play('thud');
  }

  kill(a) {
    a.disableBody(true, true);
  }

  update(time) {
    const list = this.group.getChildren();
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a.active) continue;
      if (!a.stuck) a.rotation = Math.atan2(a.body.velocity.y, a.body.velocity.x);
      const left = a.dieAt - time;
      if (left <= 0 || a.y > WORLD.killY) this.kill(a);
      else if (a.stuck && left < 400) a.setAlpha(left / 400);
    }
  }
}
