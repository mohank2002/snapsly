// components/DownloadZipButton.jsx

import React from 'react';

const DownloadZipButton = ({ transformCode, mappings, sampleInput }) => {
    const handleDownload = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/download-zip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transformJs: transformCode,
              mappings,
              sampleInput
            })
          });
      
          console.log("Download response:", response.status);
      
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'snapsly-export.zip';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          } else {
            const errorText = await response.text();
            console.error("Failed to download ZIP:", errorText);
            alert("❌ Failed to download ZIP");
          }
        } catch (err) {
          console.error("❌ ZIP download error:", err);
          alert("❌ Error connecting to backend");
        }
      };
    

  return (
    <button onClick={handleDownload} style={{ marginTop: '1rem' }}>
      📦 Export ZIP
    </button>
  );
};

export default DownloadZipButton;
