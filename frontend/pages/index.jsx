import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import axios from 'axios';
import LiveMappingView from '../components/LiveMappingView';


const IndexPage = () => {
  const [sourceFile, setSourceFile] = useState(null);
  const [targetFile, setTargetFile] = useState(null);
  const [sourceFields, setSourceFields] = useState([]);
  const [targetFields, setTargetFields] = useState([]);
  const [editableMatches, setEditableMatches] = useState([]);

  console.log("🔥 Rendering Snapsly Index Page");


  const handleExtractFields = async () => {
    if (!sourceFile || !targetFile) {
      alert("Please upload both source and target schema files.");
      return;
    }

    const formData = new FormData();
    formData.append('source', sourceFile);
    formData.append('target', targetFile);

    try {
      const response = await axios.post('http://localhost:5000/api/match/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("Extracted sourceFields:", response.data.sourceFields);
      console.log("Extracted targetFields:", response.data.targetFields);

      setSourceFields(response.data.sourceFields);
      setTargetFields(response.data.targetFields);
      setEditableMatches([]);
    } catch (error) {
      console.error('Error extracting fields:', error);
      alert('Failed to extract fields');
    }
  };

  const handleMatch = async () => {
    try {
      console.log("Sending sourceFields:", sourceFields);
      console.log("Sending targetFields:", targetFields);

      const mappedSource = Array.isArray(sourceFields) && typeof sourceFields[0] === 'object'
        ? sourceFields.map(f => f.name)
        : sourceFields;

      const mappedTarget = Array.isArray(targetFields) && typeof targetFields[0] === 'object'
        ? targetFields.map(f => f.name)
        : targetFields;

      const response = await axios.post('http://localhost:5000/api/match', {
        sourceFields: mappedSource,
        targetFields: mappedTarget
      });

      const matched = response.data.matches || response.data;
      setEditableMatches(matched.map(m => ({ ...m })));
    } catch (error) {
      console.error('Error matching fields:', error);
      alert('Matching failed. Check console for errors.');
    }
  };

  const updateMatch = (index, newTarget) => {
    const updated = [...editableMatches];
    updated[index].target = newTarget;
    setEditableMatches(updated);
  };

  const exportToCSV = () => {
    const csvRows = [
      ['Source Field', 'Matched Field', 'Confidence'],
      ...editableMatches.map(m => [m.source, m.target, m.confidence])
    ];

    const csvString = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'field-matches.csv');
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Snapsly Field Matcher</h1>

      {/* Step 1: Upload */}
      <div style={{ border: '1px solid #ccc', padding: 15, marginBottom: 20 }}>
        <h3>Step 1: Upload OpenAPI Schemas</h3>
        <input type="file" onChange={(e) => setSourceFile(e.target.files[0])} />
        <input type="file" onChange={(e) => setTargetFile(e.target.files[0])} />
        <button onClick={handleExtractFields} style={{ marginLeft: 10 }}>Extract Fields</button>
      </div>

      {/* Fields Preview */}
      <div style={{ marginBottom: 20 }}>
        <h4>Source Fields</h4>
        <ul>{sourceFields.map((f, i) => (
          <li key={i}>{typeof f === 'string' ? f : `${f.name} (${f.type})`}</li>
        ))}</ul>

        <h4>Target Fields</h4>
        <ul>{targetFields.map((f, i) => (
          <li key={i}>{typeof f === 'string' ? f : `${f.name} (${f.type})`}</li>
        ))}</ul>
      </div>

      {/* Step 2: Match + Export */}
      <div style={{ border: '1px solid #ccc', padding: 15, marginBottom: 20 }}>
        <h3>Step 2: Match Fields</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleMatch}>Match Fields</button>
          <button onClick={exportToCSV}>Export Matches as CSV</button>
        </div>
      </div>

      {/* Step 3: Drag-and-Drop Mapping */}
        {sourceFields.length > 0 && targetFields.length > 0 && (
        <div style={{ border: '1px solid #ccc', padding: 15, marginBottom: 20 }}>
            <h3>Step 3: Live Drag-and-Drop Mapping</h3>
            <LiveMappingView
            sourcePaths={
                Array.isArray(sourceFields) && typeof sourceFields[0] === 'object'
                ? sourceFields.map(f => f.name)
                : sourceFields
            }
            targetPaths={
                Array.isArray(targetFields) && typeof targetFields[0] === 'object'
                ? targetFields.map(f => f.name)
                : targetFields
            }
            />
        </div>
        )}


      {/* Editable Matches */}
      {editableMatches.length > 0 && (
        <div style={{ border: '1px solid #ccc', padding: 15 }}>
          <h3>Editable Matches</h3>
          <ul>
            {editableMatches.map((match, index) => (
              <li key={index}>
                <strong>{match.source}</strong> →
                <select
                  value={match.target}
                  onChange={(e) => updateMatch(index, e.target.value)}
                  style={{ margin: '0 10px' }}
                >
                  {targetFields.map((f, i) => (
                    <option key={i} value={typeof f === 'string' ? f : f.name}>
                      {typeof f === 'string' ? f : f.name}
                    </option>
                  ))}
                </select>
                <span>({match.confidence})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default IndexPage;
