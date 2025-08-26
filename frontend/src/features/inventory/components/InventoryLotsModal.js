// File: /frontend/src/features/inventory/components/InventoryLotsModal.js

/**
 * @file Componente de modal para visualizar los lotes de inventario de un producto.
 * @description Este componente encapsula la lógica y la UI para obtener y mostrar
 * los lotes de inventario asociados a un ID de producto específico.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Alert, CircularProgress, Typography, Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import { getInventoryLotsByProductIdAPI } from '../api/productsAPI';
import { formatApiError } from '../../../utils/errorUtils';
import { lotColumns } from './inventoryGridConfig'; // Se importa la configuración externa

// ==============================================================================
// SECCIÓN 2: SUB-COMPONENTES DE UI
// ==============================================================================

const ModalContent = ({ productId }) => {
    const { data: lots, isLoading, isError, error } = useQuery({
        queryKey: ['inventoryLots', productId],
        queryFn: () => getInventoryLotsByProductIdAPI(productId),
        enabled: !!productId,
        staleTime: 5 * 60 * 1000, // Cache de 5 minutos
    });

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return <Alert severity="error" sx={{ my: 2 }}>{`Error al cargar los lotes: ${formatApiError(error)}`}</Alert>;
    }

    if (!lots || lots.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography color="text.secondary">No se encontraron lotes para este producto.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: 400, width: '100%', mt: 2 }}>
            <DataGrid
                rows={lots}
                columns={lotColumns}
                getRowId={(row) => row.id} // Se utiliza `id`
                density="compact"
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                hideFooter
                sx={{ border: 'none' }}
            />
        </Box>
    );
};

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL
// ==============================================================================

const InventoryLotsModal = ({ open, onClose, productId, productName }) => {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
            <DialogTitle>
                Lotes de Inventario
                <Typography variant="body2" color="text.secondary">
                    {productName}
                </Typography>
            </DialogTitle>
            <Divider />
            <DialogContent>
                {/* Se renderiza el contenido solo si hay un productId para evitar llamadas innecesarias */}
                {productId && <ModalContent productId={productId} />}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

InventoryLotsModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    productId: PropTypes.string,
    productName: PropTypes.string,
};

export default InventoryLotsModal;