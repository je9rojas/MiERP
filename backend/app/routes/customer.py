# /backend/app
  role: Yup.string().required('El rol es requerido'),
  branch: Yup.object().shape({
    name: Yup.string().required('El nombre de la sucursal es requerido')
  }),/routes/customers.py
from fastapi import APIRouter, Depends
from typing import List
from app.models.customer import CustomerCreate, CustomerOut
from app.routes.auth import get_current_user
# ... (más
  password: Yup.string()
    .when('isEditing', {
      is: false,
      then: (schema) => schema.min(8, 'Debe tener al menos 8 caracteres').required('La contraseña es requerida'),
      otherwise: (schema) => schema.min(8, 'Debe imports que necesitarás, como db_client, HTTPException)

router = APIRouter()

# --- Protegeremos estas rutas para que solo vendedores y roles superiores puedan acceder ---
async def get_sales_user(current_user tener al menos 8 caracteres'),
    }),
});

const UserFormModal = ({ open, onClose, onSubmit, initialValues, roles }) => {
  const isEditing = !!initialValues.username;

  return (
    : dict = Depends(get_current_user)):
    # ... lógica para verificar que el rol sea vendedor o superior ...
    return current_user

@router.post("/", response_model=CustomerOut, status_code=2<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Formik
        initialValues={{ ...initialValues, isEditing }}
        validationSchema={validationSchema}
        onSubmit={(values,01)
async def create_customer(
    customer_data: CustomerCreate,
    user: dict = Depends(get_sales_user)
):
    # ... Lógica para crear un cliente en una nueva colección "customers { setSubmitting }) => {
          const { isEditing, ...submissionData } = values;
          onSubmit" en MongoDB ...
    pass # Dejamos la lógica para después

@router.get("/", response_model=List[(submissionData);
          setSubmitting(false);
        }}
        enableReinitialize
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <DialogTitle>{isEditing ? 'Editar Empleado' : 'Crear Nuevo Empleado'}</DialogTitle>
            <DialogContent dividersCustomerOut])
async def get_all_customers(user: dict = Depends(get_sales_user)):>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Esta sección es para crear las cuentas de los empleados que accederán al sistema. La gestión de clientes se realiza en el
    # ... Lógica para listar todos los clientes ...
    pass # Dejamos la lógica para después

# ... (Aquí irían los endpoints GET por id, PUT y DELETE) ...