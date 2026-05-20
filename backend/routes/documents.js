const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Document = require('../models/Document');

router.use(auth);

// Helper: check if user can access document
const canAccessDoc = (user, doc) => {
  if (user.role === 'superadmin' || user.role === 'admin') return true;
  if (user.clearanceLevel < doc.minClearanceLevel) return false;
  if (doc.requiredExtensions?.length > 0) {
    const hasAll = doc.requiredExtensions.every(ext => user.clearanceExtensions?.includes(ext));
    if (!hasAll) return false;
  }
  if (doc.allowedFractions?.length > 0) {
    if (!doc.allowedFractions.includes(user.fraction)) return false;
  }
  return true;
};

// GET /api/documents - list documents visible to user
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isArchived: false };
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };
    
    const docs = await Document.find(filter)
      .select('title category subcategory minClearanceLevel requiredExtensions allowedFractions tags createdAt')
      .sort('-createdAt');
    
    // Tag each doc with access info
    const result = docs.map(doc => ({
      ...doc.toObject(),
      canAccess: canAccessDoc(req.user, doc)
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/documents/:id - get single document
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('createdBy', 'username fio');
    
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (!canAccessDoc(req.user, doc)) {
      return res.status(403).json({ 
        message: 'Insufficient clearance',
        requiredLevel: doc.minClearanceLevel,
        requiredExtensions: doc.requiredExtensions,
        canRequest: true
      });
    }
    
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/documents - create document (admin+)
router.post('/', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const doc = new Document({
      ...req.body,
      createdBy: req.user._id
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/documents/:id
router.patch('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id, updatedAt: new Date() },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', requireRole('superadmin'), async (req, res) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
