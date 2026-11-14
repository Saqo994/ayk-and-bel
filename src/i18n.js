import { loadSave, writeSave } from './save.js';

// Все тексты игры на трёх языках: русском, английском и армянском. Язык выбирается в настройках меню и запоминается.
// t('ключ') возвращает текст на текущем языке; {n} в тексте заменяется на переданное значение.
export const LANGS = ['ru', 'en', 'hy'];

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
    'boss.hint': 'Щит Бела отбивает обычные стрелы.\nУдерживайте X, пока полоска не станет золотой, — такой выстрел пробьёт доспех.',
    'boss.hintShort': 'Стрела отскочила! Удерживайте X до золотой полоски.',
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
      ['Род Айка обрёл свою землю у подножия Арарата.', 56, '#e8dcc0'],
      ['', 70],
      ['По мотивам «Истории Армении» Мовсеса Хоренаци', 52, '#d8c9a0'],
      ['', 90],
      ['Спасибо за игру', 72, '#f3e3b0'],
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
    'boss.hint': 'Bel’s shield deflects ordinary arrows.\nHold X until the bar turns gold — that shot will pierce his armour.',
    'boss.hintShort': 'The arrow bounced off! Hold X until the bar turns gold.',
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
      ['The people of Hayk found their land at the foot of Ararat.', 56, '#e8dcc0'],
      ['', 70],
      ['Based on the “History of Armenia” by Movses Khorenatsi', 52, '#d8c9a0'],
      ['', 90],
      ['Thank you for playing', 72, '#f3e3b0'],
    ],
    'end.menu': 'Enter — main menu',
  },

  hy: {
    langName: 'Հայերեն',
    title: 'Հայկ և Բել',
    subtitle: 'ավանդազրույց հայոց նահապետի մասին',
    'menu.start': 'Նոր խաղ',
    'menu.continue': 'Շարունակել',
    'menu.continueLevel': 'Շարունակել (մակարդակ {n})',
    'menu.settings': 'Կարգավորումներ',
    'menu.music': 'Երաժշտություն',
    'menu.sfx': 'Ձայնային էֆեկտներ',
    'menu.lang': 'Լեզու',
    'menu.back': 'Հետ',
    'hint.main': '↑ ↓ — ընտրել     Enter — հաստատել',
    'hint.settings': '↑ ↓ — ընտրել     ← → — փոխել     Esc — հետ',
    level0: 'Շարժման ստուգում',
    level1: 'Բաբելոն',
    level2: 'Ճանապարհ դեպի հյուսիս',
    level3: 'Արարատի երկիր',
    level4: 'Հայոց ձոր',
    loading: 'Բեռնում…',
    pause: 'Դադար',
    pauseHint: 'Esc — շարունակել     M — դուրս գալ ընտրացանկ',
    boss: 'Բել',
    'boss.hint': 'Բելի վահանը ետ է մղում սովորական նետերը։\nՊահեք X-ը, մինչև գոտին ոսկեգույն դառնա. այդ կրակոցը կծակի զրահը։',
    'boss.hintShort': 'Նետը ետ թռավ։ Պահեք X-ը մինչև ոսկեգույն գոտին։',
    heartReward: '+1 սիրտ',
    debug: 'ՍՏՈՒԳՈՒՄ  1–4՝ մակարդակ   G՝ անխոցելիություն {n}',
    on: 'ՄԻԱՑ',
    off: 'անջ',
    'over.title': 'Հայկն ընկավ',
    'over.sub': 'Բայց նրա տոհմը սպասում է։ Ոտքի ելիր և շարունակիր ճանապարհը։',
    'over.again': '▸ Նորից  (Enter կամ Space)',
    'over.menu': 'M — ընտրացանկ',
    anyKey: 'Սեղմեք ցանկացած ստեղն',
    story: [
      'Բաբելոնում իշխեց հսկա Բելը և հրամայեց բոլոր ազգերին պաշտել իրեն որպես աստծո։\nՀայկը՝ Թորգոմի տոհմից հզոր աղեղնավորը, գլուխ չխոնարհեց նրա առաջ։',
      'Հայկը հավաքեց իր որդիներին, թոռներին և ողջ տոհմը՝ մոտ երեք հարյուր այր, և Բաբելոնից տարավ նրանց հյուսիս՝ դեպի ցուրտ լեռները։',
      'Լեռնանցքներից այն կողմ բացվեց մի երկիր Արարատի ստորոտին, և Հայկն այնտեղ բնակեցրեց իր տոհմը։\nԲայց Բելի պատգամաբերները գտան նրան նաև այստեղ. «Հնազանդվիր և ապրիր խաղաղությամբ»։',
      'Հայկը մերժեց։ Այն ժամանակ Բելն անհամար զորքով շարժվեց դեպի հյուսիս։\nԱղի լճի ափին՝ լեռնային հովտում, հանդիպեցին երկու հսկաները։',
      'Հայկի լայնալիճ աղեղից արձակված նետը ծակեց Բելի պղնձե զրահը, և բռնակալն ընկավ, իսկ նրա զորքը փախավ։\nԱյդ հովիտն այն օրից կոչվում է Հայոց ձոր, իսկ երկիրը Հայկի անունով՝ Հայք։',
    ],
    credits: [
      ['Հայկի տոհմը գտավ իր հողը Արարատի ստորոտին։', 56, '#e8dcc0'],
      ['', 70],
      ['Ըստ Մովսես Խորենացու «Հայոց պատմության»', 52, '#d8c9a0'],
      ['', 90],
      ['Շնորհակալություն խաղալու համար', 72, '#f3e3b0'],
    ],
    'end.menu': 'Enter — գլխավոր ընտրացանկ',
  },
};

// названия языков на них самих — для экрана выбора языка
export const LANG_NAMES = Object.fromEntries(LANGS.map((l) => [l, TEXT[l].langName]));

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
