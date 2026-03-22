const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');

// Get all conversations for user
router.get('/', auth, async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user.id }).populate('participants', 'fullName email');
    res.json(convs);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create or get conversation between two users
router.post('/conversation', auth, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    let conv = await Conversation.findOne({ participants: { $all: [req.user.id, otherUserId] } });
    if (!conv) {
      conv = new Conversation({ participants: [req.user.id, otherUserId] });
      await conv.save();
    }
    res.json(conv);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Add message
router.post('/:conversationId/message', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    conv.messages.push({ senderId: req.user.id, text });
    await conv.save();
    res.json(conv);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
