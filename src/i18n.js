import { loadSave, writeSave } from './save.js';

// Все тексты игры на двух языках. Язык выбирается в настройках меню и запоминается.
// t('ключ') возвращает текст на текущем языке; {n} в тексте заменяется на переданное значение.
export const LANGS = ['ru', 'en'];

const TEXT = {
  ru: {
    langName: 'Русский',
    title: 'Айк и Бел',
    subtitle: 'легенда о родоначальнике армян',
    'menu.start': 'Начать игру',
    'menu.continue': 'Продолжить',
    'menu.continueLevel': 'Продолжить (уровень {n})',
    'menu.settings': 'Настройки',
    'menu.music': 'Музыка',
    'menu.sfx': 'Эффекты',
    'menu.lang': 'Язык',
    'menu.back': 'Назад',
    'hint.main': '↑ ↓ — выбор     Enter — подтвердить',
    'hint.settings': '↑ ↓ — выбор     ← → — изменить     Esc — назад',
    level0: 'Проверка движения',
    level1: 'Вавилон',
    level2: 'Путь на север',
    level3: 'Страна Арарат',
    level4: 'Айоц-Дзор',
    loading: 'Загрузка…',
    pause: 'Пауза',
    pauseHint: 'Esc — продолжить     M — выйти в меню',
    boss: 'Бел',
    heartReward: '+1 сердце',
    debug: 'ОТЛАДКА  1–4: уровень   G: неуязвимость {n}',
    on: 'ВКЛ',
    off: 'выкл',
    'over.title': 'Айк пал',
    'over.sub': 'Но род его ждёт. Поднимись и продолжай путь.',
    'over.again': '▸ Заново  (Enter или пробел)',
    'over.menu': 'M — в меню',
    anyKey: 'Нажмите любую клавишу',
    story: [
      'В Вавилоне воцарился исполин Бел и велел всем народам поклоняться ему как богу.\nАйк, могучий лучник из рода Торгома, не склонил перед ним головы.',
      'Айк собрал сыновей, внуков и весь свой род — около трёхсот мужей — и увёл их из Вавилона на север, в холодные горы.',
      'За перевалами открылась страна у подножия Арарата, и Айк поселил в ней свой род.\nНо гонцы Бела нашли его и здесь: «Покорись — и живи в мире».',
      'Айк ответил отказом. Тогда Бел повёл на север несметное войско.\nУ берега солёного озера, в горной долине, сошлись два исполина.',
      'Стрела из широкого лука Айка пробила бронзовый доспех Бела, и тиран пал, а войско его бежало.\nДолину с тех пор зовут Айоц-Дзор, а страну по имени Айка — Айк.',
    ],
    // титры: [текст, размер шрифта, цвет]; пустая строка — отступ
    credits: [
      ['Айк и Бел', 120, '#f3e3b0'],
      ['Род Айка обрёл свою землю у подножия Арарата.', 48, '#e8dcc0'],
      ['', 60],
      ['По мотивам «Истории Армении» Мовсеса Хоренаци', 44, '#d8c9a0'],
      ['', 40],
      ['Графика', 40, '#b08a3c'],
      ['сгенерирована автором в Gemini и других генераторах изображений', 40, '#e8dcc0'],
      ['', 30],
      ['Музыка главного меню', 40, '#b08a3c'],
      ['предоставлена автором', 40, '#e8dcc0'],
      ['', 30],
      ['Звуки уровней', 40, '#b08a3c'],
      ['временные, собраны кодом', 40, '#e8dcc0'],
      ['', 30],
      ['Сделано на Phaser 3', 40, '#d8c9a0'],
      ['', 80],
      ['Спасибо за игру', 64, '#f3e3b0'],
    ],
    'end.menu': 'Enter — в главное меню',
  },

  en: {
    langName: 'English',
    title: 'Hayk and Bel',
    subtitle: 'the legend of the forefather of the Armenians',
    'menu.start': 'New Game',
    'menu.continue': 'Continue',
    'menu.continueLevel': 'Continue (level {n})',
    'menu.settings': 'Settings',
    'menu.music': 'Music',
    'menu.sfx': 'Sound effects',
    'menu.lang': 'Language',
    'menu.back': 'Back',
    'hint.main': '↑ ↓ — select     Enter — confirm',
    'hint.settings': '↑ ↓ — select     ← → — change     Esc — back',
    level0: 'Movement Test',
    level1: 'Babylon',
    level2: 'The Road North',
    level3: 'The Land of Ararat',
    level4: 'Hayots Dzor',
    loading: 'Loading…',
    pause: 'Paused',
    pauseHint: 'Esc — resume     M — quit to menu',
    boss: 'Bel',
    heartReward: '+1 heart',
    debug: 'DEBUG  1–4: level   G: invulnerable {n}',
    on: 'ON',
    off: 'off',
    'over.title': 'Hayk has fallen',
    'over.sub': 'But his people are waiting. Rise and carry on.',
    'over.again': '▸ Try again  (Enter or Space)',
    'over.menu': 'M — menu',
    anyKey: 'Press any key',
    story: [
      'In Babylon the giant Bel seized power and ordered every nation to worship him as a god.\nHayk, a mighty archer of the house of Torgom, would not bow his head.',
      'Hayk gathered his sons, his grandsons and all his kin — some three hundred men — and led them out of Babylon, north into the cold mountains.',
      'Beyond the passes lay a land at the foot of Ararat, and there Hayk settled his people.\nBut the messengers of Bel found him even here: “Submit, and live in peace.”',
      'Hayk refused. Then Bel marched north with a countless host.\nBy the shore of a salt lake, in a mountain valley, the two giants met.',
      'An arrow from Hayk’s broad bow pierced the bronze armour of Bel, and the tyrant fell, and his army fled.\nThe valley has been called Hayots Dzor ever since, and the land bears the name of Hayk.',
    ],
    credits: [
      ['Hayk and Bel', 120, '#f3e3b0'],
      ['The people of Hayk found their land at the foot of Ararat.', 48, '#e8dcc0'],
      ['', 60],
      ['Based on the “History of Armenia” by Movses Khorenatsi', 44, '#d8c9a0'],
      ['', 40],
      ['Art', 40, '#b08a3c'],
      ['generated by the author in Gemini and other image generators', 40, '#e8dcc0'],
      ['', 30],
      ['Main menu music', 40, '#b08a3c'],
      ['provided by the author', 40, '#e8dcc0'],
      ['', 30],
      ['Level sounds', 40, '#b08a3c'],
      ['temporary, made in code', 40, '#e8dcc0'],
      ['', 30],
      ['Made with Phaser 3', 40, '#d8c9a0'],
      ['', 80],
      ['Thank you for playing', 64, '#f3e3b0'],
    ],
    'end.menu': 'Enter — main menu',
  },
};

let lang = LANGS.includes(loadSave().lang) ? loadSave().lang : 'ru';

export function getLang() {
  return lang;
}

export function setLang(l) {
  lang = LANGS.includes(l) ? l : 'ru';
  writeSave({ lang });
}

export function t(key, n) {
  const v = TEXT[lang][key] ?? TEXT.ru[key] ?? key;
  return typeof v === 'string' && n !== undefined ? v.replace('{n}', n) : v;
}
