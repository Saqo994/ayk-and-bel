import { AUDIO } from '../config.js';
import { loadSave } from '../save.js';

// Временные звуки, собранные кодом (WebAudio), пока нет настоящих записей.
// play(name) — короткий эффект, ambient(kind) — фоновая атмосфера уровня с плавным переходом.
export default class Sfx {
  constructor(game) {
    this.game = game;
    this.ctx = game.sound && game.sound.context ? game.sound.context : null;
    this.amb = null;
    this.ambKind = null;
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.sfxGain = ctx.createGain();
    this.ambGain = ctx.createGain();
    this.sfxGain.connect(ctx.destination);
    this.ambGain.connect(ctx.destination);
    // две секунды шума — основа для шагов, ветра, грома
    this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = loadSave();
    this.setVolumes(s.music, s.sfx);
  }

  setVolumes(music, sfx) {
    this.music = music;
    this.sfx = sfx;
    if (!this.ctx) return;
    this.sfxGain.gain.value = sfx;
    this.ambGain.gain.value = music;
  }

  get ready() {
    return this.ctx && this.ctx.state === 'running';
  }

  // тон: частота f (с плавным уходом к f2), длительность, громкость
  tone(f, dur, vol = 0.2, type = 'sine', f2 = null, delay = 0, out = this.sfxGain) {
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.01, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // шум через фильтр: тип фильтра, частота f (с уходом к f2)
  noise(dur, vol = 0.2, type = 'lowpass', f = 800, f2 = null, delay = 0, out = this.sfxGain, attack = 0.005) {
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const flt = ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.setValueAtTime(f, t);
    if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt).connect(g).connect(out);
    src.start(t, Math.random());
    src.stop(t + dur + 0.02);
  }

  play(name, arg) {
    if (!this.ready) return;
    switch (name) {
      case 'step':
        if (arg === 'snow') this.noise(0.11, 0.16, 'highpass', 1700);
        else if (arg === 'grass') this.noise(0.08, 0.12, 'bandpass', 500);
        else if (arg === 'wood') {
          this.tone(150, 0.06, 0.12, 'triangle', 90);
          this.noise(0.04, 0.08, 'lowpass', 900);
        } else if (arg === 'ice') this.noise(0.05, 0.1, 'bandpass', 2600);
        else this.noise(0.06, 0.16, 'bandpass', 1000);
        break;
      case 'jump': this.noise(0.13, 0.14, 'bandpass', 350, 1000); break;
      case 'land':
        this.noise(0.1, arg === 'snow' ? 0.2 : 0.3, 'lowpass', arg === 'snow' ? 1500 : 350);
        break;
      case 'draw': this.tone(90, 0.22, 0.05, 'sawtooth', 150); break;
      case 'shoot':
        this.tone(arg ? 380 : 320, 0.14, arg ? 0.22 : 0.15, 'triangle', 110);
        this.noise(arg ? 0.3 : 0.16, arg ? 0.16 : 0.1, 'highpass', 2500);
        break;
      case 'thud':
        this.noise(0.05, 0.2, 'lowpass', 600);
        this.tone(190, 0.07, 0.1, 'triangle', 120);
        break;
      case 'hit':
        this.noise(0.09, 0.25, 'bandpass', 1300);
        this.tone(210, 0.12, 0.14, 'square', 80);
        break;
      case 'bosshit':
        this.noise(0.2, 0.35, 'bandpass', 900);
        this.tone(140, 0.3, 0.25, 'square', 50);
        this.tone(1500, 0.25, 0.08, 'triangle', 900);
        break;
      case 'hurt': this.tone(230, 0.26, 0.22, 'sawtooth', 85); break;
      case 'coin':
        this.tone(1250, 0.07, 0.12);
        this.tone(1880, 0.16, 0.12, 'sine', null, 0.06);
        break;
      case 'heart':
        [620, 830, 1240].forEach((f, i) => this.tone(f, 0.16, 0.13, 'sine', null, i * 0.08));
        break;
      case 'die':
        this.noise(0.4, 0.25, 'lowpass', 900, 120);
        this.tone(160, 0.35, 0.16, 'sawtooth', 50);
        break;
      case 'swing': this.noise(0.22, 0.22, 'bandpass', 500, 1700); break;
      case 'checkpoint':
        this.tone(520, 0.18, 0.12);
        this.tone(780, 0.3, 0.12, 'sine', null, 0.14);
        break;
      case 'crumble': this.noise(0.6, 0.3, 'lowpass', 500, 150); break;
      case 'gust': this.noise(2.6, 0.3, 'bandpass', 350, 1100, 0, this.sfxGain, 1.0); break;
      case 'thunder':
        this.noise(2.8, 0.7, 'lowpass', 260, 70, 0, this.sfxGain, 0.05);
        this.noise(0.25, 0.35, 'lowpass', 1500, 300);
        break;
      case 'horn':
        this.tone(110, 1.3, 0.14, 'sawtooth', 104);
        this.tone(165, 1.3, 0.09, 'sawtooth', 156);
        break;
      case 'warn': this.tone(300, 0.18, 0.08, 'square', 240); break;
      case 'slam':
        this.noise(0.6, 0.7, 'lowpass', 200, 60);
        this.tone(70, 0.5, 0.5, 'sine', 30);
        break;
      case 'clang':
        this.tone(1900, 0.18, 0.12, 'triangle');
        this.tone(2750, 0.12, 0.08, 'triangle');
        break;
      case 'slow': this.tone(420, 1.4, 0.12, 'sine', 90); break;
      case 'ui': this.tone(700, 0.05, 0.08); break;
      default: break;
    }
  }

  // ---------- фоновая атмосфера ----------

  loopNoise(type, f, vol, out) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const flt = ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(flt).connect(g).connect(out);
    src.start();
    return { src, flt };
  }

  ambient(kind) {
    if (!this.ctx || kind === this.ambKind) return;
    const ctx = this.ctx;
    const fade = AUDIO.fadeMs / 1000;
    const old = this.amb;
    if (old) {
      old.timers.forEach((t) => clearInterval(t));
      old.gain.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
      setTimeout(() => {
        old.nodes.forEach((n) => {
          try { n.stop(); } catch (e) { /* уже остановлен */ }
        });
        old.gain.disconnect();
      }, AUDIO.fadeMs * 2);
    }
    this.amb = null;
    this.ambKind = kind;
    if (!kind) return;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(1, ctx.currentTime, fade / 3);
    gain.connect(this.ambGain);
    const amb = (this.amb = { gain, nodes: [], timers: [] });
    const every = (ms, fn) => amb.timers.push(setInterval(() => this.ready && fn(), ms));
    const drum = (f, vol, delay = 0) => this.tone(f, 0.28, vol, 'sine', f * 0.5, delay, gain);

    if (kind === 'city') {
      // гул большого города, далёкие барабаны, треск факелов
      amb.nodes.push(this.loopNoise('lowpass', 220, 0.3, gain).src);
      amb.nodes.push(this.loopNoise('bandpass', 700, 0.03, gain).src);
      every(2400, () => {
        drum(75, 0.22);
        drum(75, 0.14, 0.6);
        drum(95, 0.16, 0.9);
        drum(75, 0.2, 1.2);
      });
      every(170, () => Math.random() < 0.5 && this.noise(0.03, 0.05, 'highpass', 3000, null, 0, gain));
    } else if (kind === 'wind') {
      // вой ветра (частота фильтра медленно плавает), редкий крик орла
      const a = this.loopNoise('bandpass', 500, 0.32, gain);
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 0.13;
      lg.gain.value = 260;
      lfo.connect(lg).connect(a.flt.frequency);
      lfo.start();
      amb.nodes.push(a.src, lfo, this.loopNoise('lowpass', 150, 0.25, gain).src);
      every(14000, () => {
        this.tone(2300, 0.5, 0.05, 'sawtooth', 1500, 0, gain);
        this.tone(2200, 0.45, 0.04, 'sawtooth', 1400, 0.7, gain);
      });
    } else if (kind === 'meadow') {
      // ручей, лёгкий ветер и птицы
      amb.nodes.push(this.loopNoise('bandpass', 2600, 0.035, gain).src, this.loopNoise('lowpass', 400, 0.06, gain).src);
      every(900, () => {
        if (Math.random() < 0.6) {
          const f = 2400 + Math.random() * 1800;
          const n = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < n; i++) this.tone(f, 0.09, 0.05, 'sine', f * 1.25, i * 0.13, gain);
        }
      });
    } else if (kind === 'battle') {
      // гул войска, боевые барабаны
      amb.nodes.push(this.loopNoise('lowpass', 180, 0.35, gain).src, this.loopNoise('bandpass', 900, 0.04, gain).src);
      every(1600, () => {
        drum(62, 0.34);
        drum(62, 0.24, 0.4);
        drum(84, 0.3, 0.8);
        drum(62, 0.2, 1.0);
      });
      every(5200, () => Math.random() < 0.5 && this.tone(98, 1.6, 0.05, 'sawtooth', 92, 0, gain));
    }
  }
}
