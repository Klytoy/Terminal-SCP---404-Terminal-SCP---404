const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const BlackMarket = require('../models/BlackMarket');
const User = require('../models/User');

// Получить все активные лоты
router.get('/', auth, async (req, res) => {
  try {
    const items = await BlackMarket.find({ status: 'active' })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Создать лот
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const item = await BlackMarket.create({
      ...req.body,
      seller: req.user.userId,
      sellerCallsign: user.callsign
    });
    res.json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Купить лот
router.post('/:id/buy', auth, async (req, res) => {
  try {
    const item = await BlackMarket.findById(req.params.id);
    if (!item || item.status !== 'active') return res.status(400).json({ message: 'Лот недоступен' });
    if (item.seller.toString() === req.user.userId) return res.status(400).json({ message: 'Нельзя купить у себя' });

    const buyer = await User.findById(req.user.userId);
    const seller = await User.findById(item.seller);

    if (buyer.balance < item.price) return res.status(400).json({ message: 'Недостаточно средств' });

    buyer.balance -= item.price;
    seller.balance += item.price;
    await buyer.save();
    await seller.save();

    item.status = 'sold';
    item.buyer = req.user.userId;
    item.buyerCallsign = buyer.callsign;
    item.soldAt = new Date();
    await item.save();

    res.json({ message: 'Покупка успешна', newBalance: buyer.balance });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Удалить свой лот
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await BlackMarket.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Не найдено' });
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    if (item.seller.toString() !== req.user.userId && !isAdmin)
      return res.status(403).json({ message: 'Нет доступа' });
    item.status = 'cancelled';
    await item.save();
    res.json({ message: 'Снято с продажи' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
