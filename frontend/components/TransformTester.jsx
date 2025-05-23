import React, { useState } from 'react';

const TransformTester = ({ generatedCode }) => {
  const [inputJSON, setInputJSON] = useState('');
  const [outputJSON, setOutputJSON] = useState('');
  const [error, setError] = useState(null);

  const runTransform = () => {
    try {
      setError(null);
      const input = JSON.parse(inputJSON);
      const fullCode = `${generatedCode}\nreturn transform(${JSON.stringify(input)});`;

      // eslint-disable-next-line no-new-func
      const result = new Function(fullCode)();
      setOutputJSON(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(err);
      setError('⚠️ Failed to run transform: ' + err.message);
    }
  };

  return (
    <div className="card">
      <h3>🧪 Test Transform</h3>

      <label>Input JSON</label>
      <textarea
        rows="8"
        value={inputJSON}
        onChange={(e) => setInputJSON(e.target.value)}
        placeholder='Paste raw input JSON here'
        style={{ fontFamily: 'monospace', width: '100%' }}
      />

      <button className="secondary" onClick={runTransform} style={{ marginBottom: '1rem' }}>
        ▶️ Run Transform
      </button>

      {error && <div style={{ color: 'red', marginBottom: '0.5rem' }}>{error}</div>}

      {outputJSON && (
        <>
          <label>Transformed Output</label>
          <textarea
            readOnly
            rows="8"
            className="code-block"
            value={outputJSON}
          />
        </>
      )}
    </div>
  );
};

export default TransformTester;
