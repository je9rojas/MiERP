/**
 * @file Página contenedora para crear una nueva Orden de Compra.
 * Se encarga de la lógica de alto nivel como la comunicación con la API
 * para crear la orden, manejar notificaciones y la navegación.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Container, Typography, Paper, Box } from '@mui/material';

import PurchaseOrderForm from '../components/PurchaseOrderForm';
import { createPurchaseOrderAPI } from '../api/purchasingAPI';

const NewPurchaseOrderPage = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreatePurchaseOrder = useCallback(async (formValues) => {
        setIsSubmitting(true);

        // Transformar los datos del formulario al payload que la API espera
        const payload = {
            supplier_id: formValues.supplier._id,
            order_date: formValues.order_date,
            expected_delivery_date: formValues.expected_delivery_date,
            notes: formValues.notes,
            items: formValues.items.map(item => ({
                product_id: item.product._id,
                quantity_ordered: parseInt(String(item.quantity), 10),
                unit_cost: parseFloat(String(item.unit_cost)),
            })),
        };

        try {
            await createPurchaseOrderAPI(payload);
            enqueueSnackbar('Orden de Compra creada exitosamente.', { variant: 'success' });
            navigate('/compras/ordenes');
        } catch (error) {
            console.error("Error al crear la orden de compra:", error);
            const errorMsg = error.response?.data?.detail || 'Ocurrió un error al guardar la orden.';
            enqueueSnackbar(errorMsg, { variant: 'error', persist: true });
        } finally {
            setIsSubmitting(false);
        }
    }, [navigate, enqueueSnackbar]);

    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Registrar Nueva Orden de Compra
                </Typography>
                <Box mt={3}>
                    <PurchaseOrderForm
                        onSubmit={handleCreatePurchaseOrder}
                        isSubmitting={isSubmitting}
                    />
                </Box>
            </Paper>
        </Container>
    );
};

export default NewPurchaseOrderPage;