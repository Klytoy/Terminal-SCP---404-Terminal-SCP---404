export const CLEARANCE_LEVELS = {
  0: { name: 'ONLY FOR OFFICIAL USE', short: 'OFU', color: '#888', cardColor: 'none', description: 'Второстепенный персонал без аномальных объектов' },
  1: { name: 'UNRESTRICTED', short: 'UR', color: '#2ecc71', cardColor: '#1a5c38', description: 'Персонал объектов с аномальными объектами, класс D' },
  2: { name: 'LIMITED', short: 'RS', color: '#3498db', cardColor: '#1a3a5c', description: 'Сотрудники безопасности и исследователи' },
  3: { name: 'CONFIDENTIAL', short: 'K', color: '#f1c40f', cardColor: '#5c4a00', description: 'Старшие сотрудники, оперативники МОГ' },
  4: { name: 'TOP SECRET', short: 'SC', color: '#e67e22', cardColor: '#5c2a00', description: 'Директора объектов, высокопоставленный персонал' },
  5: { name: 'THAUMIEL', short: 'TS', color: '#e74c3c', cardColor: '#5c0000', description: 'Совет O5, АПАИБ, Комитет по этике' },
  6: { name: 'OVERSEER', short: 'OS', color: '#9b59b6', cardColor: '#2c0050', description: 'Высшее командование' }
};

export const EXTENSIONS = {
  A: { name: 'Administrator', description: 'Полный доступ к редактированию любой информации' },
  M: { name: 'Moderator', description: 'Доступ RAISA, манипуляции с УД сотрудников' },
  SI: { name: 'Special Internal', description: 'Директор ISD, доступ к МОГ и секретным службам' },
  I: { name: 'Internal', description: 'Агенты ISD, доступ к базе данных всех сотрудников' },
  T: { name: 'Tribunal', description: 'Internal Tribunal Service, судебные дела' },
  O: { name: 'Office', description: 'Руководящие структуры, доступ к досье подчинённых' },
  H: { name: 'Health', description: 'Медицинский департамент, медкарты' },
  P: { name: 'Progressive', description: 'Расширенный доступ в своей сфере' },
  ET: { name: 'Ethical', description: 'Ethics Committee & MTF Omega-1, доступ уровнем выше' },
  S: { name: 'Special', description: 'МОГ в чрезвычайных ситуациях' },
  R4: { name: 'Research', description: 'Сотрудники SCD, доступ к SCP выше основного УД' },
  T4: { name: 'Technical', description: 'Технический департамент, доступ к технологиям' },
  O5: { name: 'Overseer', description: 'Совет Смотрителей' }
};

export const getClearanceInfo = (level) => CLEARANCE_LEVELS[level] || CLEARANCE_LEVELS[0];

export const canUserAccess = (user, requiredLevel, requiredExtensions = []) => {
  if (!user) return false;
  if (user.role === 'superadmin' || user.role === 'admin') return true;
  if (user.clearanceLevel < requiredLevel) return false;
  if (requiredExtensions.length > 0) {
    return requiredExtensions.every(ext => user.clearanceExtensions?.includes(ext));
  }
  return true;
};
