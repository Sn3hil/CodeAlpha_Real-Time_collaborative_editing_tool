const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
