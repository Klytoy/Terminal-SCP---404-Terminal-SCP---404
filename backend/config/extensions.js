// backend/config/extensions.js
// Справочник расширений допуска (clearanceExtensions) — единая точка правды
// для роутов и фронтенда. Использовать hasExtension(user, code) вместо
// прямых сравнений строк по всему коду.

const EXTENSIONS = {
  A: {
    code: 'A',
    fullName: 'Административный допуск',
    description: 'Доступ к административной документации Фонда и внутренним регламентам.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  M: {
    code: 'M',
    fullName: 'Медицинский допуск',
    description: 'Доступ к медицинским картам персонала и объектов.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  SI: {
    code: 'SI',
    fullName: 'Special Intelligence',
    description: 'Доступ к разведывательным сводкам и оперативным данным.',
    defaultPermissions: { canViewTerminalKeys: true, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  I: {
    code: 'I',
    fullName: 'Информационный допуск',
    description: 'Доступ к внутренним базам данных сверх стандартного уровня допуска.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  T: {
    code: 'T',
    fullName: 'Тактический допуск',
    description: 'Доступ к тактическим планам операций МОГ.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  O: {
    code: 'O',
    fullName: 'Оперативный допуск',
    description: 'Доступ к текущим оперативным сводкам сайта.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  H: {
    code: 'H',
    fullName: 'Гуманитарный допуск',
    description: 'Доступ к данным о работе с гуманоидными объектами и персоналом.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  P: {
    code: 'P',
    fullName: 'Психологический допуск',
    description: 'Доступ к психологическим досье персонала.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  ET: {
    code: 'ET',
    fullName: 'Этический допуск',
    description: 'Доступ к материалам Этического комитета.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  S: {
    code: 'S',
    fullName: 'Секретный допуск',
    description: 'Расширенный доступ к секретным материалам сверх базового уровня УД.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  R4: {
    code: 'R4',
    fullName: 'Reserved-4',
    description: 'Зарезервированный допуск особого назначения.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  T4: {
    code: 'T4',
    fullName: 'Thaumiel-4',
    description: 'Допуск к проектам класса Таумиэль уровня 4.',
    defaultPermissions: { canViewTerminalKeys: true, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  O5: {
    code: 'O5',
    fullName: 'Совет O5',
    description: 'Высшее руководство Фонда. Полный доступ ко всем материалам без исключений.',
    defaultPermissions: { canViewTerminalKeys: true, canViewViolations: true, canManageFactionBalance: true, canIssueFakeIdentity: true },
  },
  КпЭ: {
    code: 'КпЭ',
    fullName: 'Комитет по Этике',
    description: 'Надзор за этичностью экспериментов и обращения с объектами/персоналом.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: true, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  АпАИБ: {
    code: 'АпАИБ',
    fullName: 'Аппарат Антикризисного и Информационного Блока',
    description: 'Внутренняя безопасность: расследования, доступ к логам, компромату и нарушениям.',
    defaultPermissions: { canViewTerminalKeys: true, canViewViolations: true, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  СО: {
    code: 'СО',
    fullName: 'Специальный Отдел (внедрение)',
    description: 'Разведывательное внедрение в другие фракции по легенде, работа с фальшивыми удостоверениями.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: true },
  },
  МТФ: {
    code: 'МТФ',
    fullName: 'Мобильная Тактическая Группа',
    description: 'Полевые боевые операции, зачистки, сопровождение и штурмовые задачи.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  НРП: {
    code: 'НРП',
    fullName: 'Нештатные Реагирующие Подразделения',
    description: 'Реагирование на нештатные ситуации; доступ к профильным документам и разделу «Розыск».',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
  ФФ: {
    code: 'ФФ',
    fullName: 'Фонд-Фронт',
    description: 'Прикрытие и связи с внешним миром, легендирование деятельности Фонда.',
    defaultPermissions: { canViewTerminalKeys: false, canViewViolations: false, canManageFactionBalance: false, canIssueFakeIdentity: false },
  },
};

// Каноничная градация уровней допуска (используется в тултипах фронтенда)
const CLEARANCE_LEVELS = [
  { level: 0, name: 'Общий', description: 'Общедоступная информация, не представляющая угрозы при разглашении.' },
  { level: 1, name: 'Служебный', description: 'Информация для служебного пользования сотрудниками Фонда.' },
  { level: 2, name: 'Ограниченный', description: 'Информация ограниченного доступа, требующая обоснования необходимости знать.' },
  { level: 3, name: 'Секретно', description: 'Секретные материалы, доступ строго по подразделениям.' },
  { level: 4, name: 'Совершенно секретно', description: 'Требуется одобрение RAISA. Материалы высшей степени секретности.' },
  { level: 5, name: 'Таумиэль', description: 'Доступно только Совету O5 и RAISA. Проекты стратегического назначения.' },
  { level: 6, name: 'Apollyon', description: 'Доступно только Офису Администратора. Несанкционированный доступ влечёт вызов Л-МОГ и устранение.' },
];

function hasExtension(user, code) {
  if (!user || !Array.isArray(user.clearanceExtensions)) return false;
  return user.clearanceExtensions.includes(code);
}

function isAdmin(user) {
  return !!user && (user.role === 'admin' || user.role === 'superadmin');
}

module.exports = { EXTENSIONS, CLEARANCE_LEVELS, hasExtension, isAdmin };
