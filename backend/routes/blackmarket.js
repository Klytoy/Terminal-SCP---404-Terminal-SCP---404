const express = require('express');
const router = express.Router();

const BlackMarket = require('../models/BlackMarket');
const TerminalKey = require('../models/TerminalKey');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { hasExtension, isAdmin } = require('../config/extensions');
const createLog = require('../utils/createLog');

function sanitizeListing(listing, viewer) {
  const obj = listing.toObject ? listing.toObject() : listing;
  if (obj.anonymous && !isAdmin(viewer) && !hasExtension(viewer, 'АпАИБ')) {
    obj.sellerCallsign = 'АНОНИМНЫЙ_ПРОДАВЕЦ';
    obj.seller = null;
  }
  return obj;
}

// GET /api/blackmarket — активные лоты, доступные по УД
router.get('/', auth, async (req, res) => {
  const listings = await BlackMarket.find({ status: 'active', minClearance: { $lte: req.user.clearanceLevel || 0 } }).sort({ createdAt: -1 });
  res.json({ listings: listings.map((l) => sanitizeListing(l, req.user)) });
});

// POST /api/blackmarket — создать лот
router.post('/', auth, async (req, res) => {
  const { title, description, category, price, minClearance, anonymous, linkedKeyId } = req.body;
  if (!title || !category || price === undefined) return res.status(400).json({ error: 'Укажите title, category, price' });

  if (category === 'key') {
    if (!linkedKeyId) return res.status(400).json({ error: 'Для категории key укажите linkedKeyId' });
    const key = await TerminalKey.findById(linkedKeyId);
    if (!key) return res.status(404).json({ error: 'Ключ не найден' });
    const owns = key.holders.map(String).includes(String(req.user._id));
    if (!owns) return res.status(403).json({ error: 'Нельзя продать ключ, которым вы не владеете' });
  }

  const listing = await BlackMarket.create({
    title,
    description,
    category,
    price,
    minClearance: minClearance || 0,
    seller: req.user._id,
    sellerCallsign: req.user.callsign || req.user.fio,
    anonymous: !!anonymous,
    linkedKey: category === 'key' ? linkedKeyId : null,
  });

  await createLog({ user: req.user, action: 'blackmarket_listing_create', objectType: 'blackmarket', objectId: listing._id, details: `Создан лот "${title}" (${category}, ${price})` });

  res.status(201).json({ listing });
});

// POST /api/blackmarket/:id/buy
router.post('/:id/buy', auth, async (req, res) => {
  const listing = await BlackMarket.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Лот не найден' });
  if (listing.status !== 'active') return res.status(400).json({ error: 'Лот уже недоступен' });
  if (String(listing.seller) === String(req.user._id)) return res.status(400).json({ error: 'Нельзя купить собственный лот' });
  if ((req.user.clearanceLevel || 0) < listing.minClearance) return res.status(403).json({ error: 'Недостаточный уровень допуска' });
  if (req.user.balance < listing.price) return res.status(400).json({ error: 'Недостаточно средств на счёте' });

  const seller = await User.findById(listing.seller);

  req.user.balance -= listing.price;
  await req.user.save();
  if (seller) {
    seller.balance += listing.price;
    await seller.save();
  }

  listing.status = 'sold';
  listing.buyer = req.user._id;
  listing.soldAt = new Date();
  await listing.save();

  let compromisedKeyTransfer = false;
  if (listing.category === 'key' && listing.linkedKey) {
    const key = await TerminalKey.findById(listing.linkedKey);
    if (key) {
      if (!key.holders.map(String).includes(String(req.user._id))) key.holders.push(req.user._id);
      if (key.ownerFraction !== req.user.fraction) {
        key.isCompromised = true;
        compromisedKeyTransfer = true;
      }
      key.usageLog.push({ user: req.user._id, action: 'access', at: new Date(), details: 'Ключ приобретён на чёрном рынке' });
      await key.save();
    }
  }

  await createLog({
    user: req.user,
    action: 'blackmarket_purchase',
    objectType: 'blackmarket',
    objectId: listing._id,
    details: `Покупка лота "${listing.title}" за ${listing.price}${compromisedKeyTransfer ? ' — КЛЮЧ ПОМЕЧЕН КАК КОМПРОМЕТИРОВАННЫЙ (продан вне фракции)' : ''}`,
    meta: { price: listing.price, compromisedKeyTransfer },
  });

  res.json({ listing, compromisedKeyTransfer });
});

// POST /api/blackmarket/:id/withdraw — снять лот с продажи (продавец)
router.post('/:id/withdraw', auth, async (req, res) => {
  const listing = await BlackMarket.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Лот не найден' });
  if (String(listing.seller) !== String(req.user._id) && !isAdmin(req.user)) {
    return res.status(403).json({ error: 'Нет доступа' });
  }
  listing.status = 'withdrawn';
  await listing.save();

  await createLog({ user: req.user, action: 'blackmarket_withdraw', objectType: 'blackmarket', objectId: listing._id, details: `Лот "${listing.title}" снят с продажи` });

  res.json({ listing });
});

module.exports = router;
