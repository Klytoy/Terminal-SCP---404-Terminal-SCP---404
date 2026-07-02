export const STATUS_LABELS = {
  active: 'Активен',
  inactive: 'Неактивен',
  kia: 'Погиб (KIA)',
  mia: 'Пропал без вести (MIA)',
  suspended: 'Отстранён',
  archived: 'В архиве',
  classified: 'Засекречен',
  fake: 'Фиктивный профиль',
  vacation: 'В отпуске',
};

export const STATUS_CHIP_TONE = {
  active: 'green',
  vacation: 'default',
  suspended: 'amber',
  inactive: 'default',
  archived: 'default',
  kia: 'red',
  mia: 'red',
  classified: 'red',
  fake: 'red',
};

export const NOTE_TYPE_TONE = {
  violation: 'red',
  commendation: 'green',
  warning: 'amber',
  note: 'default',
};

export const NOTE_TYPE_LABELS = {
  violation: 'Нарушение',
  commendation: 'Поощрение',
  warning: 'Предупреждение',
  note: 'Заметка',
};

export const OBJECT_CLASS_TONE = {
  SAFE: 'green',
  EUCLID: 'default',
  KETER: 'red',
  THAUMIEL: 'thaumiel',
  APOLLYON: 'red',
  NEUTRALIZED: 'default',
};
