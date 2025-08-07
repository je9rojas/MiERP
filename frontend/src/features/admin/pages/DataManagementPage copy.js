// /frontend/src/features/admin/pages/DataManagementPage.js
// PÁGINA DEDICADA A LA GESTIÓN DE IMPORTACIÓN Y EXPORTACIÓN DE DATOS MAESTROS

import React, { useState } from 'react';
import {
  Button, Typography, Paper, Box, Container, Divider, Alert
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { saveAs } from 'file-saver';

// --- SECCIÓN 1: IMPORTACIONES DE COMPONENTES Y APIs ---
// Se importan los componentes reutilizables y las funciones de API necesarias para esta página.

import { exportProductsAPI, importProductsAPI } from '../api/dataManagementAPI';
import PageHeader from '../../../components/common/PageHeader';
import DataImporter from '../components/DataImporter';
import DownloadIcon from '@mui/icons-material/Download';

/**
 * Componente de página que proporciona una interfaz para que los administradores
 * puedan exportar datos maestros a CSV e importar datos desde archivos CSV.
 */
const DataManagementPage = () => {
  // --- SECCIÓN 2: HOOKS Y ESTADO DEL COMPONENTE ---
  // Se gestiona el estado de carga para las operaciones de exportación e importación.

  const { enqueueSnackbar } = useSnackbar();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // --- SECCIÓN 3: MANEJADORES DE LÓGICA DE NEGOCIO ---
  // Funciones que se ejecutan en respuesta a las acciones del usuario.

  /**
   * Maneja la lógica de exportación de productos. Llama a la API,
   * guarda el archivo resultante y proporciona feedback al usuario.
   */
  const handleExportProducts = async () => {
    setIsExporting(true);
    try {
      enqueueSnackbar('Iniciando exportación de productos...', { variant: 'info' });
      const blob = await exportProductsAPI();
      saveAs(blob, `productos_backup_${new Date().toISOString().split('T')[0]}.csv`);
      enqueueSnackbar('Exportación completada exitosamente.', { variant: 'success' });
    } catch (error) {
      console.error("Error al exportar productos:", error);
      enqueueSnackbar('Error al exportar los productos. Revise la consola.', { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Maneja la lógica de importación de productos. Llama a la API con el archivo
   * seleccionado y muestra un resumen detallado del resultado.
   * @param {File} file - El archivo CSV seleccionado por el usuario.
   */
  const handleImportProducts = async (file) => {
    setIsImporting(true);
    try {
      const result = await importProductsAPI(file);
      
      const { summary, errors } = result;
      const successMessage = `Importación completada: ${summary.products_created} creados, ${summary.products_updated} actualizados, ${summary.products_deactivated} desactivados.`;
      enqueueSnackbar(successMessage, { variant: 'success', autoHideDuration: 8000 });

      if (errors && errors.length > 0) {
        console.error("Errores detallados de la importación:", errors);
        const errorMessage = `Se encontraron ${summary.rows_with_errors} errores. Revise la consola del navegador para más detalles.`;
        enqueueSnackbar(errorMessage, { variant: 'warning', autoHideDuration: 10000 });
      }
    } catch (error) {
      console.error("Error grave al importar productos:", error);
      const serverError = error.response?.data?.detail || 'El proceso de importación se detuvo por un error inesperado.';
      enqueueSnackbar(serverError, { variant: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  // --- SECCIÓN 4: RENDERIZADO DEL COMPONENTE ---
  // Estructura JSX de la página, dividida en secciones de exportación e importación.

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <PageHeader
          title="Gestión de Datos"
          subtitle="Exportar o importar datos maestros del sistema en formato CSV."
        />
        
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>Exportar Datos Maestros</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Descargue una copia de seguridad completa de sus datos en formato CSV.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportProducts}
              disabled={isExporting || isImporting}
            >
              {isExporting ? 'Exportando...' : 'Exportar Productos'}
            </Button>
            {/* Aquí se pueden añadir botones para exportar Clientes, Proveedores, etc. */}
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box>
          <Typography variant="h6" gutterBottom>Importar Datos Maestros</Typography>
          <DataImporter
            onImport={handleImportProducts}
            isImporting={isImporting}
            entityName="Productos"
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default DataManagementPage;