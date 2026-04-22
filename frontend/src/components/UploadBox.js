import React from "react";

function UploadBox({ onFileChange, onSubmit }) {
  return (
    <div>
      <input type="file" onChange={(e) => onFileChange(e.target.files[0])} />
      <button onClick={onSubmit}>Analyze</button>
    </div>
  );
}

export default UploadBox;