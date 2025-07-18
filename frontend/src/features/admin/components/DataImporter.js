// /frontend/src/features/admin/components/DataImporter.js
import React, { useState } from 'react';
import { Box, Button, Typography, Alert, LinearProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { styled } from '@mui/material/styles';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const DataImporter = ({ onImport, isImporting, entityName }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
      alert("Por favor, seleccione un archivo CSV.");
    }
  };

  const handleImportClick = () => {
    if (selectedFile) {
      onImport(selectedFile);
    }
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Seleccione un archivo CSV para importar <strong>{entityName}</strong>. Asegúrese de que las columnas coincidan con la plantilla de exportación.
      </Alert>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          component="label"
          variant="outlined"
          startIcon={<UploadFileIcon />}
          disabled={isImporting}
        >
          Seleccionar Archivo
          <VisuallyHiddenInput type="file" accept=".csv" onChange={handleFileChange} />
        </Button>
        {selectedFile && <Typography variant="body2">{selectedFile.name}</Typography>}
      </Box>
      {selectedFile && (
        <Button
          variant="contained"
          onClick={handleImportClick}
          disabled={isImporting || !selectedFile}
          sx={{ mt: 2 }}
        >
          {isImporting ? 'Importando...' : `Importar ${entityName}`}
        </Button>
      )}
      {isImporting && <LinearProgress sx={{ mt: 2 }} />}
    </Box>
  );
};

export default DataImporter;