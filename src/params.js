// Параметры из адресной строки: ?level=2 &debug=1 &cp=1 &scene=story
const q = new URLSearchParams(window.location.search);

export const PARAMS = {
  level: q.has('level') ? Number(q.get('level')) : null,
  debug: q.get('debug') === '1',
  cp: q.has('cp') ? Number(q.get('cp')) : null, // начать с чекпоинта номер cp (с единицы)
  scene: q.get('scene'), // story, ending, gameover — для проверки
  i: q.has('i') ? Number(q.get('i')) : 0,
};
