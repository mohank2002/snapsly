import React from 'react';
import styles from '../styles/LiveMappingView.module.css';

const SchemaUploadPanel = ({
  sourceFile,
  targetFile,
  setSourceFile,
  setTargetFile,
  onExtract,
  onClose
}) => {
  return (
    <div className={styles.schemaUploadPanel}>
      <div className={styles.schemaUploadHeader}>
        <h3>📁 Upload OpenAPI Schemas</h3>
        <button onClick={onClose} className={styles.closeBtn}>✕</button>
      </div>

      <div className={styles.schemaUploadBody}>
        <label>
          Source Schema:
          <input type="file" onChange={(e) => setSourceFile(e.target.files[0])} />
        </label>

        <label style={{ marginTop: '1rem' }}>
          Target Schema:
          <input type="file" onChange={(e) => setTargetFile(e.target.files[0])} />
        </label>

        <button onClick={onExtract} className="primary" style={{ marginTop: '1rem' }}>
          🔍 Extract Fields
        </button>
      </div>
    </div>
  );
};

export default SchemaUploadPanel;
