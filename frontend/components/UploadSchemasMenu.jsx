import React, { useState, useRef } from 'react';
import styles from '../styles/LiveMappingView.module.css';

const UploadSchemasMenu = ({ onSourceSelect, onTargetSelect, onExtract }) => {
  const [open, setOpen] = useState(false);
  const sourceRef = useRef(null);
  const targetRef = useRef(null);

  return (
    <div className={styles.uploadMenuWrapper}>
      <button className="primary" onClick={() => setOpen((prev) => !prev)}>
        📁 Upload Schemas
      </button>
  
      {open && (
        <div className={styles.uploadDropdown}>
          {/* ✅ Add Close Header */}
          <div className={styles.uploadDropdownHeader}>
            <span>Upload Schemas</span>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>✖</button>
          </div>
  
          <label>
            Source JSON:
            <input
              type="file"
              accept=".json"
              ref={sourceRef}
              onChange={(e) => onSourceSelect(e.target.files[0])}
            />
          </label>
  
          <label>
            Target JSON:
            <input
              type="file"
              accept=".json"
              ref={targetRef}
              onChange={(e) => onTargetSelect(e.target.files[0])}
            />
          </label>
  
          <button className="secondary" onClick={()=> {onExtract(), setOpen(false);}} style={{ marginTop: '0.5rem' }}>
            ⚙️ Extract Fields
          </button>
        </div>
      )}
    </div>
  );
  
};

export default UploadSchemasMenu;
