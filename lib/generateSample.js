const jsf = require('json-schema-faker');

// Optional: make faker always generate optional fields
jsf.option({ alwaysFakeOptionals: true });

function nestSchemaProperties(flatProps) {
  const nested = {};

  for (const [path, schema] of Object.entries(flatProps)) {
    const keys = path.split('.');
    let curr = nested;

    keys.forEach((key, idx) => {
      if (!curr[key]) {
        curr[key] = idx === keys.length - 1 ? schema : { type: 'object', properties: {} };
      }

      if (idx < keys.length - 1) {
        if (!curr[key].properties) {
          curr[key].properties = {};
        }
        curr = curr[key].properties;
      }
    });
  }

  return {
    type: 'object',
    properties: nested
  };
}

function generateSampleInput(schema) {
  const nestedSchema = nestSchemaProperties(schema.properties);
  return jsf.generate(nestedSchema);
}

module.exports = { generateSampleInput };
