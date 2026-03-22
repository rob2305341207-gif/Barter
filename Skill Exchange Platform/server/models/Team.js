const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String },
  competition: { type: String },
  description: { type: String },
  skillsNeeded: { type: [String], default: [] },
  teamSize: { type: Number, default: 1 },
  deadline: { type: Date },
  university: { type: String },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Team', teamSchema);
