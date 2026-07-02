// backend/seed/factions.js
// Сидинг фракций Site-81, включая боевые МОГ-отряды по образцу
// Omega-1 «Расколотый шип».

const Faction = require('../models/Faction');

const FACTIONS = [
  {
    name: 'Ω-1 «Расколотый шип»',
    description: 'Элитный штурмовой отряд быстрого реагирования, специализирующийся на прорыве укреплённых аномальных зон и нейтрализации объектов класса Keter.',
    type: 'combat',
    minClearanceLevel: 3,
    callsignPrefix: 'Ω-1',
    specialization: 'штурм',
    status: 'active',
    color: '#ffb4ab',
  },
  {
    name: 'Ψ-7 «Немой Хор»',
    description: 'Отряд зачистки аномалий когнитивного и меметического профиля. Работает в информационной изоляции.',
    type: 'combat',
    minClearanceLevel: 3,
    callsignPrefix: 'Ψ-7',
    specialization: 'зачистка аномалий',
    status: 'active',
    color: '#fdaf00',
  },
  {
    name: 'Λ-12 «Тихий Конвой»',
    description: 'Специализируется на сопровождении и транспортировке особо опасных объектов и ключевого персонала между площадками.',
    type: 'combat',
    minClearanceLevel: 2,
    callsignPrefix: 'Λ-12',
    specialization: 'эскорт',
    status: 'active',
    color: '#00e639',
  },
  {
    name: 'Δ-4 «Слепой Ворон»',
    description: 'Разведывательное подразделение, ведущее наблюдение за GOI и внедрение в подозрительные структуры вблизи периметра.',
    type: 'combat',
    minClearanceLevel: 3,
    callsignPrefix: 'Δ-4',
    specialization: 'разведка',
    status: 'active',
    color: '#84967e',
  },
  {
    name: 'Л-МОГ «Молот Аполлиона»',
    description: 'Подразделение ликвидации последней инстанции. Активируется исключительно по прямому распоряжению Офиса Администратора при попытке несанкционированного доступа к материалам уровня 6.',
    type: 'combat',
    minClearanceLevel: 6,
    callsignPrefix: 'Л-МОГ',
    specialization: 'штурм',
    status: 'classified',
    color: '#93000a',
  },
  {
    name: 'Административный департамент Site-81',
    description: 'Гражданское руководство площадки: логистика, кадровый учёт, документооборот.',
    type: 'civilian',
    minClearanceLevel: 0,
    callsignPrefix: 'ADM',
    specialization: 'администрирование',
    status: 'active',
    color: '#00e639',
  },
  {
    name: 'Научный отдел Site-81',
    description: 'Исследование и тестирование аномальных объектов, содержащихся на площадке.',
    type: 'civilian',
    minClearanceLevel: 1,
    callsignPrefix: 'SCI',
    specialization: 'иное',
    status: 'active',
    color: '#00e639',
  },
];

async function seedFactions() {
  for (const f of FACTIONS) {
    await Faction.findOneAndUpdate({ name: f.name }, f, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  console.log(`[SEED] Загружено фракций: ${FACTIONS.length}`);
}

module.exports = seedFactions;
module.exports.FACTIONS = FACTIONS;
