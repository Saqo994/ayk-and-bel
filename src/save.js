import { AUDIO } from './config.js';

// Сохранение в браузере (localStorage). Если оно недоступно — игра просто работает без сохранения.
const KEY = 'ayk-and-bel';

export function loadSave() {
  const def = { level: 1, music: AUDIO.music, sfx: AUDIO.sfx };
  try {
    return { ...def, ...JSON.parse(window.localStorage.getItem(KEY) || '{}') };
  } catch (e) {
    return def;
  }
}

export function writeSave(patch) {
  const data = { ...loadSave(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    /* нет доступа к хранилищу — не страшно */
  }
  return data;
}
