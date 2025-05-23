// lib/schemaParser.js
const SwaggerParser = require('@apidevtools/swagger-parser');

async function extractFieldsFromSchema(schemaBuffer) {
  try {
    const schemaString = schemaBuffer.toString('utf-8');
    const schemaJson = JSON.parse(schemaString);

    const parsed = await SwaggerParser.parse(schemaJson);

    const allFields = [];

    if (parsed.components && parsed.components.schemas) {
      for (const [modelName, model] of Object.entries(parsed.components.schemas)) {
        const properties = model.properties || {};
        for (const [field, def] of Object.entries(properties)) {
          allFields.push({
            name: field,
            type: def.type || 'unknown'
          });
        }
      }
    }

    return allFields;
  } catch (error) {
    console.error('❌ schemaParser failed:', error);
    throw error;
  }
}

module.exports = { extractFieldsFromSchema };
