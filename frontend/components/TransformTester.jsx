import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

function pathsToSchema(fields) {
  const schema = { type: 'object', properties: {} };

  fields.forEach(({ name, type }) => {
    const parts = name.split('.');
    let current = schema.properties;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = {
          type: index === parts.length - 1 ? type : 'object',
          ...(index < parts.length - 1 ? { properties: {} } : {})
        };
      }
      if (index < parts.length - 1) {
        current = current[part].properties;
      }
    });
  });

  return schema;
}

const TransformTester = ({ generatedCode, sourceFields = [] }) => {
  const [inputJSON, setInputJSON] = useState('');
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSampleInput() {
      try {
        const schema = pathsToSchema(sourceFields);
        const response = await fetch('http://localhost:5000/api/match/generate-sample', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schema)
        });

        const data = await response.json();
        console.log('🧪 Sample input received from backend:', data.sampleInput);
        setInputJSON(JSON.stringify(data.sampleInput, null, 2));
      } catch (err) {
        console.error('Failed to load sample input:', err);
        setInputJSON('{}');
      }
    }

    if (sourceFields.length > 0) fetchSampleInput();
  }, [sourceFields]);

  const runTransform = () => {
    try {
      setError(null);
      const input = JSON.parse(inputJSON);
      const wrappedCode = `
        ${generatedCode}
        return transform(${JSON.stringify(input)});
      `;
      const result = new Function(wrappedCode)();
      setOutput(result);
    } catch (err) {
      console.error(err);
      setOutput(null);
      setError('⚠️ Failed to run transform: ' + err.message);
    }
  };

  useEffect(() => {
    setOutput(null);
    setError(null);
  }, [generatedCode]);

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <h3>🧪 Test Transform</h3>

      <label>Input JSON</label>
      <textarea
        rows="8"
        value={inputJSON}
        onChange={(e) => setInputJSON(e.target.value)}
        placeholder='Paste raw input JSON here'
        style={{ fontFamily: 'monospace', width: '100%' }}
      />

      <button className="secondary" onClick={runTransform} style={{ margin: '0.75rem 0' }}>
        ▶️ Run Transform
      </button>

      {error && <div style={{ color: 'red', marginBottom: '0.5rem' }}>{error}</div>}

      {output && (
        <>
          <label>Transformed Output (Tree View)</label>
          <div style={{ background: '#f4f4f4', padding: '1rem' }}>
            <ReactJson
              src={output}
              name={false}
              displayDataTypes={false}
              enableClipboard={true}
              collapsed={false}
              style={{ fontSize: '0.85rem' }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TransformTester;
