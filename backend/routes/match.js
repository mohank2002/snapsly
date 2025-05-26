const express = require('express');
const router = express.Router();
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { extractFieldsFromSchema } = require('../../lib/schemaParser');
const { generateSampleInput } = require('../../lib/generateSample');

// ✅ 1. Handle schema field extraction from uploaded files
router.post('/extract', async (req, res) => {
  try {
    const sourceSchema = req.files?.source;
    const targetSchema = req.files?.target;

    if (!sourceSchema || !targetSchema) {
      return res.status(400).json({ error: 'Both source and target files are required' });
    }

    const sourceFields = await extractFieldsFromSchema(sourceSchema.data);
    const targetFields = await extractFieldsFromSchema(targetSchema.data);

    res.json({ sourceFields, targetFields });
  } catch (err) {
    console.error('Schema parse error:', err);
    res.status(500).json({ error: 'Failed to parse schemas' });
  }
});

// ✅ 2. Handle field matching via Python semantic matcher
router.post('/', async (req, res) => {
  try {
    const { sourceFields, targetFields } = req.body;

    if (!sourceFields || !targetFields) {
      return res.status(400).json({ error: 'Missing source or target fields' });
    }

    const response = await axios.post('http://localhost:6000/match', {
      sourceFields,
      targetFields
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error calling Python matcher:', err.message);
    res.status(500).json({ error: 'Python match API failed' });
  }
});

// In-memory store for sessions (for demo purpose)
const savedMappings = {};

router.post('/save-mappings', (req, res) => {
  const { sessionId, mappings } = req.body;

  if (!sessionId || !mappings || typeof mappings !== 'object') {
    return res.status(400).json({ message: 'Invalid data' });
  }

  savedMappings[sessionId] = mappings;

  console.log(`✅ Mappings saved for session "${sessionId}":`, mappings);
  res.status(200).json({ message: 'Mappings saved successfully' });
});

router.get('/get-mappings/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const mappings = savedMappings[sessionId] || null;

  if (!mappings) {
    return res.status(404).json({ message: 'No mappings found for this session' });
  }

  res.json({ mappings });
});

// ✅ 3. Generate sample input
router.post('/generate-sample', async (req, res) => {
  try {
    const schema = req.body;
    if (!schema || typeof schema !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON schema' });
    }

    const sample = await generateSampleInput(schema);
    return res.json({ sampleInput: sample });
  } catch (err) {
    console.error('Error generating sample:', err);
    return res.status(500).json({ error: 'Failed to generate sample input' });
  }
});

// ✅ 4. Proxy to Python backend for ZIP export or other routes
router.use(
    '/python-api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      pathRewrite: { '^/python-api': '/api' }  // ✅ this is key
    })
  );


module.exports = router;
