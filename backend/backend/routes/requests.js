const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Request = require('../models/Request');

router.use(auth);

// GET /api/requests/my - get my requests
router.get('/my', async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user._id })
      .populate('documentId', 'title')
      .sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/requests/clearance - request clearance upgrade
router.post('/clearance', async (req, res) => {
  try {
    const { requestedLevel, requestedExtensions, reason } = req.body;
    
    const existing = await Request.findOne({
      requester: req.user._id,
      type: 'clearance_upgrade',
      status: 'pending'
    });
    if (existing) return res.status(400).json({ message: 'You already have a pending clearance request' });
    
    const request = new Request({
      type: 'clearance_upgrade',
      requester: req.user._id,
      requestedLevel,
      requestedExtensions: requestedExtensions || [],
      reason
    });
    
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/requests/document - request access to a document
router.post('/document', async (req, res) => {
  try {
    const { documentId, reason } = req.body;
    
    const existing = await Request.findOne({
      requester: req.user._id,
      type: 'document_access',
      documentId,
      status: 'pending'
    });
    if (existing) return res.status(400).json({ message: 'Already requested' });
    
    const request = new Request({
      type: 'document_access',
      requester: req.user._id,
      documentId,
      reason
    });
    
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
