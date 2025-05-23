const express = require('express');
const router = express.Router();
const generateTransform = require('../services/generateTransform');

router.post('/generate-transform', async (req, res) => {
  try {
    const { spec, llm = 'openai' } = req.body;
    const code = await generateTransform(spec, llm);
    res.json({ code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate transform code' });
  }
});

module.exports = router;
