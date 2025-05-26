const SwaggerParser = require('@apidevtools/swagger-parser');

function flattenProperties(properties, prefix = '') {
  const fields = [];

  for (const [key, def] of Object.entries(properties)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;

    if (def.type === 'object' && def.properties) {
      fields.push(...flattenProperties(def.properties, fullPath));
    } else {
      fields.push({
        name: fullPath,
        type: def.type || 'unknown'
      });
    }
  }

  return fields;
}

async function extractFieldsFromSchema(schemaBuffer) {
  try {
    const schemaString = schemaBuffer.toString('utf-8');
    const schemaJson = JSON.parse(schemaString);

    const parsed = await SwaggerParser.parse(schemaJson);

    const allFields = [];

    if (parsed.components && parsed.components.schemas) {
      for (const [modelName, model] of Object.entries(parsed.components.schemas)) {
        const properties = model.properties || {};
        allFields.push(...flattenProperties(properties));
      }
    }

    return allFields;
  } catch (error) {
    console.error('❌ schemaParser failed:', error);
    throw error;
  }
}

module.exports = { extractFieldsFromSchema };
