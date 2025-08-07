// frontend/src/features/admin/pages/DataManagementPage.js

/**
 * @file Página para la gestión de importación y exportación de datos.
 * @description Proporciona una interfaz para que los administradores puedan exportar
 * datos maestros, importar catálogos y realizar operaciones especiales como la
 * carga de inventario inicial.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useState } from 'react';
import { Button, Typography, Paper, Box, Container, Divider, Alert, AlertTitle } from '@mui/material';
import { useSnackbar } from 'notistack';
import { saveAs } from 'file-saver';
import DownloadIcon from '@mui/icons-material/Download';
import InventoryIcon from '@mui/icons-material/Inventory';

// SECCIÓN 2: IMPORTACIONES DE COMPONENTES Y APIs
import {
    exportProductsAPI,
    importProductsAPI,
    importInitialInventoryAPI // <--- IMPORTANDO LA NUEVA FUNCIÓN
} from '../api/dataManagementAPI';
import { formatApiError } from '../../../utils/errorUtils';
import PageHeader from '../../../components/common/PageHeader';
import DataImporter from '../components/DataImporter';

// SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA
const DataManagementPage = () => {
    // Sub-sección 3.1: Hooks y Estado del Componente
    const { enqueueSnackbar } = useSnackbar();
    const [isExporting, setIsExporting] = useState(false);
    const [isImportingProducts, setIsImportingProducts] = useState(false);
    const [isUploadingInventory, setIsUploadingInventory] = useState(false);

    // Sub-sección 3.2: Manejadores de Lógica de Negocio
    const handleExportProducts = async () => {
        setIsExporting(true);
        try {
            enqueueSnackbar('Iniciando exportación de productos...', { variant: 'info' });
            const blob = await exportProductsAPI();
            saveAs(blob, `productos_backup_${new Date().toISOString().split('T')[0]}.csv`);
            enqueueSnackbar('Exportación completada exitosamente.', { variant: 'success' });
        } catch (error) {
            console.error("Error al exportar productos:", error);
            enqueueSnackbar(formatApiError(error), { variant: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportProducts = async (file) => {
        setIsImportingProducts(true);
        try {
            const result = await importProductsAPI(file);
            const { summary, errors } = result;
            const successMessage = `Importación completada: ${summary.products_created} creados, ${summary.products_updated} actualizados.`;
            enqueueSnackbar(successMessage, { variant: 'success', autoHideDuration: 8000 });

            if (errors && errors.length > 0) {
                console.error("Errores detallados de la importación:", errors);
                const errorMessage = `Se encontraron ${summary.rows_with_errors} errores. Revise la consola para detalles.`;
                enqueueSnackbar(errorMessage, { variant: 'warning', autoHideDuration: 10000 });
            }
        } catch (error) {
            console.error("Error grave al importar productos:", error);
            enqueueSnackbar(formatApiError(error), { variant: 'error', persist: true });
        } finally {
            setIsImportingProducts(false);
        }
    };

    const handleInitialInventoryImport = async (file) => {
        setIsUploadingInventory(true);
        try {
            const result = await importInitialInventoryAPI(file);
            const successMessage = `Inventario inicial cargado exitosamente. Se generó la Orden de Compra: ${result.order_number}.`;
            enqueueSnackbar(successMessage, { variant: 'success', autoHideDuration: 10000 });
        } catch (error) {
            console.error("Error al cargar inventario inicial:", error);
            enqueueSnackbar(formatApiError(error), { variant: 'error', persist: true });
        } finally {
            setIsUploadingInventory(false);
        }
    };

    // Sub-sección 3.3: Renderizado de la Interfaz de Usuario
    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <PageHeader
                    title="Gestión de Datos"
                    subtitle="Exportar datos maestros e importar información masiva al sistema."
                />
                
                <Box mt={4}>
                    <Typography variant="h6" gutterBottom>Exportar Datos Maestros</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Descargue una copia de seguridad completa del catálogo de productos en formato CSV.
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportProducts}
                        disabled={isExporting || isImportingProducts || isUploadingInventory}
                    >
                        {isExporting ? 'Exportando...' : 'Exportar Catálogo de Productos'}
                    </Button>
                </Box>

                <Divider sx={{ my: 4 }} />

                <Box>
                    <Typography variant="h6" gutterBottom>Importar Catálogo de Productos</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Cree o actualice productos en el catálogo subiendo un archivo CSV. Esta opción no modifica el stock.
                    </Typography>
                    <DataImporter
                        onImport={handleImportProducts}
                        isImporting={isImportingProducts}
                        entityName="Catálogo de Productos"
                        disabled={isExporting || isUploadingInventory}
                    />
                </Box>

                <Divider sx={{ my: 4 }} />

                <Box>
                    <Typography variant="h6" component="h2" gutterBottom>Operaciones Especiales</Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <AlertTitle>Carga de Inventario Inicial</AlertTitle>
                        Utilice esta opción <strong>una sola vez</strong> para registrar el stock y costo existentes al iniciar el sistema.
                        El archivo CSV debe contener exactamente las siguientes columnas en minúscula: <strong>sku, quantity, cost</strong>.
                    </Alert>
                    <DataImporter
                        onImport={handleInitialInventoryImport}
                        isImporting={isUploadingInventory}
                        entityName="Inventario Inicial"
                        buttonIcon={<InventoryIcon />}
                        disabled={isExporting || isImportingProducts}
                    />
                </Box>

            </Paper>
        </Container>
    );
};

export default DataManagementPage;