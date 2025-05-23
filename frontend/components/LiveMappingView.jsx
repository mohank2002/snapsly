import React, { useState } from 'react';
import DraggableField from './DraggableField';
import DropTargetField from './DropTargetField';
import TransformTester from './TransformTester';

const cleanGeneratedCode = (raw) => {
  return raw.replace(/^```(javascript)?\n?/, '').replace(/```$/, '').trim();
};

const LiveMappingView = ({ sourcePaths, targetPaths }) => {
  const [mappings, setMappings] = useState({});
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const handleDrop = (source, target) => {
    setMappings(prev => ({ ...prev, [source]: target }));
  };

  const handleRemove = (source) => {
    const updated = { ...mappings };
    delete updated[source];
    setMappings(updated);
  };

  const handleSaveMappings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/match/save-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || 'temp-session',
          mappings,
        }),
      });

      if (response.ok) {
        alert('✅ Mappings saved!');
      } else {
        alert('❌ Failed to save mappings');
      }
    } catch (err) {
      console.error(err);
      alert('🚨 Error saving mappings');
    }
  };

  const handleLoadMappings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/match/get-mappings/${sessionId}`);
      if (!response.ok) throw new Error('No mappings found');
      const data = await response.json();
      setMappings(data.mappings);
      alert('✅ Mappings loaded!');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to load mappings');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = () => {
    if (Object.keys(mappings).length === 0) {
      alert("No mappings to export");
      return;
    }

    const lines = Object.entries(mappings).map(
      ([source, target]) => `    ${JSON.stringify(target)}: input[${JSON.stringify(source)}]`
    );

    const code = `function transform(input) {\n  return {\n${lines.join(',\n')}\n  };\n}`;
    setGeneratedCode(code);
  };

  const handleGenerateViaAI = async () => {
    try {
      const spec = Object.entries(mappings).map(([source, target]) => ({
        source,
        target,
      }));

      const response = await fetch('http://localhost:8000/transform/generate-transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llm: 'openai',
          spec,
        }),
      });

      const data = await response.json();
      const cleanedCode = cleanGeneratedCode(data.code || '');
      setGeneratedCode(cleanedCode);
    } catch (err) {
      console.error('Error generating via AI:', err);
      alert('🚨 AI generation failed');
    }
  };

  return (
    <div className="layout-wrapper">
      {/* Source Fields */}
      <div className="panel source">
        <h3>Source Fields</h3>
        {sourcePaths.map((src) => (
          <DraggableField key={src} name={src} />
        ))}
      </div>

      {/* Target Fields */}
      <div className="panel target">
        <h3>Target Fields</h3>
        {targetPaths.map((tgt) => (
          <DropTargetField
            key={tgt}
            name={tgt}
            onDrop={handleDrop}
            isMapped={Object.values(mappings).includes(tgt)}
          />
        ))}
      </div>

      {/* Mappings + Controls */}
      <div className="panel mapped">
        <h3>Mapped Fields</h3>
        <ul>
          {Object.entries(mappings).map(([src, tgt]) => (
            <li key={src} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{src} ➝ {tgt}</span>
              <button className="danger" onClick={() => handleRemove(src)}>✕</button>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: '1rem' }}>
          <input
            type="text"
            placeholder="Enter session ID"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="primary" onClick={handleLoadMappings} disabled={!sessionId || loading}>
              🔁 Load
            </button>
            <button className="primary" onClick={handleSaveMappings} disabled={!sessionId || !Object.keys(mappings).length}>
              💾 Save
            </button>
          </div>

          <button className="secondary" onClick={handleGenerateCode} style={{ marginTop: '0.75rem' }}>
            ⚙️ Export Function
          </button>

          <button className="secondary" onClick={handleGenerateViaAI} style={{ marginTop: '0.5rem' }}>
            🤖 Generate via AI
          </button>

          {generatedCode && (
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                📄 Show Generated JS Function
              </summary>
              <textarea
                className="code-block"
                readOnly
                value={generatedCode}
                style={{ height: '200px', marginTop: '0.5rem' }}
              />
            </details>
          )}

          {generatedCode && (
            <div style={{ marginTop: '1.5rem' }}>
              <TransformTester generatedCode={generatedCode} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LiveMappingView;
