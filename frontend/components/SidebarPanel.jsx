import React from 'react';
import { Upload, List, Sparkles } from 'lucide-react';
import styles from '../styles/LiveMappingView.module.css';

const SidebarPanel = ({ onRunDemo, onUploadZip, onAutoMatch }) => {
  return (
    <div className={styles.sidebarMenu}>
      <button onClick={onRunDemo} className={styles.sidebarItem}>
        <Sparkles size={18} />
        <span>Run Demo</span>
      </button>

      <label className={styles.sidebarItem}>
        <Upload size={18} />
        <span>Upload ZIP</span>
        <input
          type="file"
          accept=".zip"
          onChange={onUploadZip}
          style={{ display: 'none' }}
        />
      </label>

      <button onClick={onAutoMatch} className={styles.sidebarItem}>
        <List size={18} />
        <span>Match Fields</span>
      </button>
    </div>
  );
};

export default SidebarPanel;
