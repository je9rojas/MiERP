// /frontend/src/features/crm/pages/NewSupplierPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Box, Typography } from '@mui/material';

import SupplierForm from '../components/SupplierForm';
import { createSupplierAPI } from '../api/suppliersAPI';
import PageHeader from '../../../components/common/PageHeader'; // Asumo que tienes un componente así

const NewSupplierPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Valores iniciales para un proveedor nuevo.
  const initialValues = {
    ruc: '',
    business_name: '',
    trade_name: '',
    address: '',
    phone: '',
    email: '',
    contact_person: {
      name: '',
      email: '',
      phone: '',
      position: '',
    },
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await createSupplierAPI(values);
      enqueueSnackbar('Proveedor creado exitosamente', { variant: 'success' });
      // Redirigir a la lista de proveedores (asumiendo que la ruta será /crm/proveedores)
      navigate('/crm/proveedores');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error al crear el proveedor.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Registrar Nuevo Proveedor"
        subtitle="Complete los datos para añadir un nuevo proveedor al sistema."
      />
      
      <SupplierForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </Box>
  );
};

export default NewSupplierPage;