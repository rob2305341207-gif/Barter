const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');

// Create team
router.post('/', auth, async (req, res) => {
  try {
    const data = req.body;
    const team = new Team({ ...data, createdBy: req.user.id, members: [req.user.id] });
    await team.save();
    res.json(team);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get teams
router.get('/', auth, async (req, res) => {
  try {
    const teams = await Team.find().populate('createdBy', 'fullName email');
    res.json(teams);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
