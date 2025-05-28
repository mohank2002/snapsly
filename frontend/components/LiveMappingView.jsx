import React, { useState, useEffect } from 'react';
import DraggableField from './DraggableField';
import DropTargetField from './DropTargetField';
import TransformTester from './TransformTester';
import styles from '../styles/LiveMappingView.module.css';
import DownloadZipButton from './DownloadZipButton';
import toast from 'react-hot-toast';
import SidebarPanel from './SidebarPanel';
import { Upload, List, Sparkles, Settings2, SaveAll, BrainCircuit } from 'lucide-react';



const cleanGeneratedCode = (raw) => {
  return raw.replace(/^```(javascript)?\n?/, '').replace(/```$/, '').trim();
};

const safePath = (path) =>
  path.split('.').reduce((acc, seg, i) =>
    i === 0 ? `input.${seg}` : `${acc}?.${seg}`, '');

const LiveMappingView = ({
  sourcePaths,
  targetPaths,
  onSourcePathsUpdate,
  onTargetPathsUpdate,
  initialMappings = {},
  initialSample = {},
  initialCode = ''
}) => {
  const [mappings, setMappings] = useState(initialMappings);
  const [sampleSourceJson, setSampleSourceJson] = useState(initialSample);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(initialCode);

  useEffect(() => {
    if (Object.keys(initialMappings).length > 0) {
      setMappings(initialMappings);
    }
    if (Object.keys(initialSample).length > 0) {
      setSampleSourceJson(initialSample);
    }
    if (initialCode) {
      setGeneratedCode(initialCode);
    }
  }, [initialMappings, initialSample, initialCode]);

  useEffect(() => {
    async function fetchSampleInput() {
      try {
        const response = await fetch('http://localhost:5000/api/match/generate-sample', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'object',
            properties: Object.fromEntries(sourcePaths.map(path => {
              const parts = path.split('.');
              let nested = {};
              let current = nested;
              for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (i === parts.length - 1) {
                  current[part] = { type: 'string' };
                } else {
                  current[part] = { type: 'object', properties: {} };
                  current = current[part].properties;
                }
              }
              return [path, nested[path]];
            }))
          })
        });

        const data = await response.json();
        if (data.sampleInput) setSampleSourceJson(data.sampleInput);
      } catch (err) {
        console.error('Failed to fetch sample input', err);
        toast.error('Failed to fetch sample input');
      }
    }

    if (sourcePaths.length > 0) fetchSampleInput();
  }, [sourcePaths]);

  const clearScreen = () => {
    setMappings({});
    setSampleSourceJson({});
    setGeneratedCode('');
    setSessionId('');
    onSourcePathsUpdate([]);
    onTargetPathsUpdate([]);
  };
  

  const handleRunDemo = async () => {
    try {
      setLoading(true);
      toast('⏳ Running demo...');

      const sourceSchema = await fetch('/demo/demo-source.json').then(res => res.json());
      const targetSchema = await fetch('/demo/demo-target.json').then(res => res.json());
      const sample = await fetch('/demo/sample-input.json').then(res => res.json());

      const extractPaths = (schema, prefix = '') => {
        const fields = [];
        for (const [key, value] of Object.entries(schema.properties || {})) {
          const path = prefix ? `${prefix}.${key}` : key;
          if (value.type === 'object' && value.properties) {
            fields.push(...extractPaths(value, path));
          } else {
            fields.push(path);
          }
        }
        return fields;
      };

      const sourceFields = extractPaths(sourceSchema);
      const targetFields = extractPaths(targetSchema);

      setSampleSourceJson(sample);
      setMappings({});
      setGeneratedCode('');
      setSessionId('demo-session');
      onSourcePathsUpdate?.(sourceFields);
      onTargetPathsUpdate?.(targetFields);

      const matchResp = await fetch('http://localhost:8000/match/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceFields, targetFields })
      });

      const matchData = await matchResp.json();
      const matched = {};
      for (const [src, info] of Object.entries(matchData.mappings)) {
        matched[src] = {
          target: info.target,
          confidence: info.confidence,
          transform: `input.${src}`
        };
      }
      setMappings(matched);

      const aiResp = await fetch('http://localhost:8000/transform/generate-transform-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceJson: sample,
          mappings: matched,
          llm: 'openai'
        })
      });

      const aiData = await aiResp.json();
      const cleaned = cleanGeneratedCode(aiData.code || '');
      setGeneratedCode(cleaned);

      setTimeout(() => {
        document.querySelector('#demo-output')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
      toast.success('🎉 Demo is ready! Preview and download your ZIP.');

      //alert('🎉 Demo is ready! Preview and download your ZIP.');
    } catch (err) {
      console.error('❌ Demo failed:', err);
      toast.error('❌ Demo flow failed');
    } finally {
      setLoading(false);
    }
  };


  const handleDrop = (source, target) => {
    setMappings(prev => ({
      ...prev,
      [source]: {
        target,
        transform: safePath(source)
      }
    }));
  };

  const handleAutoMatch = async () => {
    try {
      const response = await fetch('http://localhost:8000/match/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceFields: sourcePaths,
          targetFields: targetPaths
        })
      });

      const data = await response.json();

      const autoMappings = {};
      for (const [source, match] of Object.entries(data.mappings)) {
        autoMappings[source] = {
          target: match.target,
          confidence: match.confidence,
          transform: safePath(source)
        };
      }

      setMappings(autoMappings);
    } catch (err) {
      console.error("Auto match failed:", err);
      toast.error("\u274C Failed to auto-match fields.");
    }
  };

  const handleRemove = (source) => {
    const updated = { ...mappings };
    delete updated[source];
    setMappings(updated);
  };

  const handleTransformChange = (source, value) => {
    setMappings(prev => ({
      ...prev,
      [source]: {
        ...prev[source],
        transform: value
      }
    }));
  };

  const handleFallbackChange = (source, value) => {
    setMappings(prev => ({
      ...prev,
      [source]: {
        ...prev[source],
        fallback: value
      }
    }));
  };

  const handleSuggestTransform = async (source) => {
    const target = mappings[source]?.target;
    if (!target) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/transform/suggest-transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceField: source,
          targetField: target,
          sampleInput: sampleSourceJson,
          existingMappings: Object.fromEntries(
            Object.entries(mappings).map(([src, val]) => [src, val.target])
          )
        })
      });

      const data = await response.json();
      if (data.transform) {
        handleTransformChange(source, data.transform);
      } else {
        toast.error('No suggestion returned');
      }
    } catch (err) {
      console.error('Suggestion failed:', err);
      toast.error('\ud83d\udea8 Suggestion failed');
    } finally {
      setLoading(false);
    }
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
        alert('\u2705 Mappings saved!');
      } else {
        toast.error('\u274C Failed to save mappings');
      }
    } catch (err) {
      console.error(err);
      toast.error('\ud83d\udea8 Error saving mappings');
    }
  };

  const handleLoadMappings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/match/get-mappings/${sessionId}`);
      if (!response.ok) throw new Error('No mappings found');
      const data = await response.json();
      setMappings(data.mappings);
      toast.success('\u2705 Mappings loaded!');
    } catch (err) {
      console.error(err);
      toast.error('\u274C Failed to load mappings');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = () => {
    if (Object.keys(mappings).length === 0) {
      alert("No mappings to export");
      return;
    }

    const lines = Object.entries(mappings).map(([source, config]) => {
      const target = config.target;
      const rawExpr = config.transform?.trim() || safePath(source);
      const fallback = config.fallback?.trim();
      const finalExpr = fallback ? `(${rawExpr}) ?? ${fallback}` : rawExpr;
      return `    ${JSON.stringify(target)}: ${finalExpr}`;
    });

    const code = `function transform(input) {\n  return {\n${lines.join(',\n')}\n  };\n}`;
    setGeneratedCode(code);
  };

  const handleGenerateViaAI = async () => {
    try {
      const response = await fetch('http://localhost:8000/transform/generate-transform-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceJson: sampleSourceJson,
          mappings: mappings,
          llm: 'openai'
        }),
      });

      const data = await response.json();
      const cleanedCode = cleanGeneratedCode(data.code || '');
      setGeneratedCode(cleanedCode);
    } catch (err) {
      console.error('Error generating via AI:', err);
      toast.error('\ud83d\udea8 AI generation failed');
    }
  };

  const handleUploadZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload-zip', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        toast.error(`❌ ${err.error || 'Upload failed'}`);
        return;
      }

      const data = await response.json();
      console.log('🧩 After ZIP Upload:', data.mappings, data.sampleInput);
      setMappings(data.mappings);
      setSampleSourceJson(data.sampleInput);
      setGeneratedCode(data.transformJs);
      onSourcePathsUpdate?.(Object.keys(data.mappings));
      onTargetPathsUpdate?.(Object.values(data.mappings).map(m => m.target));
      toast.success('✅ ZIP imported successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('❌ Failed to import ZIP');
    }
  };

  const sourcePathsWithTypes = sourcePaths.map(path => ({ name: path, type: 'string' }));

  return (
    <>
       <div className={styles.container}>
        <aside className={styles.sidebarLeft}>
          <SidebarPanel
            onRunDemo={handleRunDemo}
            onUploadZip={handleUploadZip}
            onAutoMatch={handleAutoMatch}
          />
        </aside>
        <main className={styles.mappingMain}>
          <div className={styles.statusLine}>
            ✅ Extracted {sourcePaths.length} source fields and {targetPaths.length} target fields.
          </div>
          <div className={`${styles['layout-columns']} ${styles.fadeInUp}`}>
            <div className={`${styles['panel']} ${styles['source']}`}>
              <h3>Source Fields</h3>
              {sourcePaths.map((src) => (
                <DraggableField key={src} name={src} />
              ))}
            </div>

            <div className={`${styles['panel']} ${styles['target']}`}>
              <h3>Target Fields</h3>
              {targetPaths.map((tgt) => (
                <DropTargetField
                  key={tgt}
                  name={tgt}
                  onDrop={handleDrop}
                  isMapped={Object.values(mappings).some(m => m.target === tgt)}
                />
              ))}
            </div>

            <div className={`${styles['panel']} ${styles['mapped']} ${styles['stickyPanel']}`}>
              <h3>Mapped Fields</h3>
          <div className={styles.mappingGrid}>
            <div className={styles.gridHeader}>Field</div>
            <div className={styles.gridHeader}>Transform Expression 🧠</div>
            <div className={styles.gridHeader}>Default Value</div>
            <div className={styles.gridHeader}>Output</div>
            <div className={styles.gridHeader}>❌</div>


            {Object.entries(mappings).map(([src, config]) => {
              let outputPreview = '';
              try {
                const fn = new Function('input', `return ${config.transform}`);
                outputPreview = fn(sampleSourceJson);
              } catch (e) {
                console.warn(`Transform error for field "${src}":`, e.message);
                outputPreview = `❌ ${e.name}: ${e.message}`;
              }

              return (
                <React.Fragment key={src}>
                  <div className={styles['field-label']}>
                    {src} ➝ {config.target}
                    {config.confidence !== undefined && (
                      <div style={{ marginTop: '4px' }}>
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#eee', borderRadius: '3px' }}>
                          <div style={{
                            width: `${Math.round(config.confidence * 100)}%`,
                            height: '100%',
                            backgroundColor: config.confidence > 0.7 ? '#4caf50' : '#f44336',
                            borderRadius: '3px'
                          }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', textAlign: 'right', color: config.confidence < 0.7 ? '#f44336' : '#4caf50' }}>
                          Confidence: {(config.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className={styles['grid-input']}
                      value={config.transform}
                      onChange={(e) => handleTransformChange(src, e.target.value)}
                      placeholder="e.g. input.qty * 2"
                    />
                    <button
                      className={styles['suggest-btn']}
                      onClick={() => handleSuggestTransform(src)}
                      disabled={loading}
                    >
                      💡
                    </button>
                  </div>
                  <input
                    type="text"
                    className={styles['grid-input']}
                    value={config.fallback || ''}
                    onChange={(e) => handleFallbackChange(src, e.target.value)}
                    placeholder='e.g. "UNKNOWN", 0'
                  />
                  <div className={styles['grid-preview']}>
                    {typeof outputPreview === 'object' ? JSON.stringify(outputPreview) : String(outputPreview)}
                  </div>
                  <button
                    onClick={() => handleRemove(src)}
                    className={styles['remove-btn']}
                    title="Remove mapping"
                  >
                    ✕
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <input
              type="text"
              placeholder="Enter session ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className={styles.input}
            />

            <div className={styles.buttonGroup}>
              <button className="primary">🔁 Load</button>
              <button className="primary">💾 Save</button>
              <button className="secondary">⚙️ Export</button>
              <button className="secondary">🤖 Generate</button>
              <button className="danger" onClick={clearScreen}>🗑️ Clear All</button>
            </div>


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
              <div className={styles.fadeInUp} style={{ marginTop: '1.5rem' }}>
                <TransformTester generatedCode={generatedCode} sourceFields={sourcePathsWithTypes} />
                <div style={{ marginTop: '1rem' }}>
                  <DownloadZipButton
                    transformCode={cleanGeneratedCode(generatedCode)}
                    mappings={mappings}
                    sampleInput={sampleSourceJson}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
    </div>
    </>
  );
};

export default LiveMappingView;
