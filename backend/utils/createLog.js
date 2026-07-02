const ActivityLog = require('../models/ActivityLog');

/**
 * Хелпер логирования действий для АпАИБ.
 * @param {object} params
 * @param {object} params.user - req.user (может быть null для системных действий)
 * @param {string} params.action - краткое машинное описание действия
 * @param {string} params.objectType - тип объекта (см. enum ActivityLog)
 * @param {string|null} params.objectId
 * @param {string} params.details - человекочитаемое описание на русском
 * @param {object} params.meta - произвольные дополнительные данные
 */
async function createLog({ user, action, objectType = 'other', objectId = null, details = '', meta = {} }) {
  try {
    await ActivityLog.create({
      user: user ? user._id : null,
      userCallsign: user ? user.callsign || user.fio : 'SYSTEM',
      action,
      objectType,
      objectId,
      details,
      meta,
      at: new Date(),
    });
  } catch (err) {
    console.error('[createLog] Ошибка записи в ActivityLog:', err.message);
  }
}

module.exports = createLog;
