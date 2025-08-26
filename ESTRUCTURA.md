



# ---------------------- 
# ---------------------- 
# ---------------------- 
# ---------------------- 


/backend/.venv/...                                        # Entorno virtual
/backend/.env.example
/backend/pyproject.toml                                   # Configuración de herramientas
/backend/requirements.txt                                 # Dependencias de producción/dev

# --- Archivos Estáticos ---
/backend/static/product_images/...                        # Imágenes de productos específicos
/backend/static/logos/...                                 (+) # Logos (PNG, SVG) para reportes y otros usos del backend

# --- Aplicación Principal ---
/backend/app/__init__.py
/backend/app/api.py                                       # Enrutador principal que agrupa todos los routers de los módulos
/backend/app/main.py                                      # EntryPoint principal de la aplicación FastAPI

# --- Núcleo (Core) de la Aplicación ---
/backend/app/core/__init__.py
/backend/app/core/config.py                               # Carga y validación de variables de entorno
/backend/app/core/database.py                             # Lógica de conexión a la base de datos (MongoDB)
/backend/app/core/security.py                             # Funciones de seguridad: JWT, hashing de contraseñas, etc.

# --- Dependencias Reutilizables ---
/backend/app/dependencies/__init__.py
/backend/app/dependencies/roles.py                        # Middleware/Dependencia para la verificación de roles
/backend/app/repositories/base_repository.py

# --- Modelos Compartidos ---
/backend/app/models/__init__.py
/backend/app/models/shared.py                             # Clases base reutilizables (ej: PyObjectId)

# --- Módulos de Negocio ---
/backend/app/modules/__init__.py

# ---------------------- AUTENTICACIÓN ----------------------
/backend/app/modules/auth/__init__.py
/backend/app/modules/auth/auth_routes.py
/backend/app/modules/auth/auth_service.py
/backend/app/modules/auth/auth_models.py
/backend/app/modules/auth/dependencies.py

# ---------------------- CRM: Clientes y Proveedores ----------------------
/backend/app/modules/crm/__init__.py
/backend/app/modules/crm/customer_routes.py
/backend/app/modules/crm/supplier_routes.py
/backend/app/modules/crm/crm_service.py
/backend/app/modules/crm/customer_models.py
/backend/app/modules/crm/supplier_models.py
/backend/app/modules/crm/repositories/customer_repository.py
/backend/app/modules/crm/repositories/supplier_repository.py

# ---------------------- GESTIÓN DE DATOS (Import/Export) ----------------------
/backend/app/modules/data_management/__init__.py
/backend/app/modules/data_management/data_management_routes.py
/backend/app/modules/data_management/data_management_service.py

# ---------------------- INVENTARIO ----------------------
/backend/app/modules/inventory/__init__.py
# --- Entidad: Producto (Catálogo) ---
/backend/app/modules/inventory/product_routes.py
/backend/app/modules/inventory/product_service.py
/backend/app/modules/inventory/product_models.py
/backend/app/modules/inventory/repositories/product_repository.py
# --- Entidad: Lotes de Inventario (Stock) ---
/backend/app/modules/inventory/inventory_routes.py
/backend/app/modules/inventory/inventory_service.py
/backend/app/modules/inventory/inventory_models.py
/backend/app/modules/inventory/repositories/inventory_lot_repository.py
# --- Entidad: Ajustes de Inventario ---
/backend/app/modules/inventory/adjustments_routes.py        (+) # Rutas para la nueva funcionalidad de ajustes
/backend/app/modules/inventory/adjustments_service.py       (+) # Lógica de negocio para mermas, pérdidas, etc.
/backend/app/modules/inventory/adjustments_models.py        (+) # Modelos Pydantic para los ajustes

# ---------------------- COMPRAS (Purchasing) ----------------------
/backend/app/modules/purchasing/__init__.py
/backend/app/modules/purchasing/purchasing_routes.py
/backend/app/modules/purchasing/purchasing_service.py
/backend/app/modules/purchasing/purchasing_models.py
backend/app/modules/purchasing/purchasing_service.py

backend/app/modules/purchasing/repositories/purchase_bill_repository.py
/backend/app/modules/purchasing/repositories/purchase_order_repository.py
backend/app/modules/purchasing/repositories/goods_receipt_repository.py

# ---------------------- REPORTES ----------------------
/backend/app/modules/reports/__init__.py
/backend/app/modules/reports/reports_routes.py
/backend/app/modules/reports/reports_service.py
/backend/app/modules/reports/reports_models.py
/backend/app/modules/reports/services/catalog_service.py    # Generador específico del catálogo PDF

# ---------------------- VENTAS (Sales) ----------------------
/backend/app/modules/sales/__init__.py
/backend/app/modules/sales/sales_routes.py
/backend/app/modules/sales/sales_service.py
/backend/app/modules/sales/sales_models.py
/backend/app/modules/sales/repositories/sales_repository.py
backend/app/modules/sales/repositories/shipment_repository.py
backend/app/modules/sales/repositories/sales_invoice_repository.py

# ---------------------- ROLES Y PERMISOS ----------------------
/backend/app/modules/roles/__init__.py
/backend/app/modules/roles/role_routes.py
/backend/app/modules/roles/role_service.py
/backend/app/modules/roles/role_models.py
/backend/app/modules/roles/repositories/role_repository.py

# ---------------------- USUARIOS ----------------------
/backend/app/modules/users/__init__.py
/backend/app/modules/users/user_routes.py
/backend/app/modules/users/user_service.py
/backend/app/modules/users/user_models.py
/backend/app/modules/users/repositories/user_repository.py


/frontend/node_modules/...
/frontend/package.json
/frontend/.env.local

# --- Carpeta Pública ---
/frontend/public/index.html
/frontend/public/favicon.ico
/frontend/public/images/logo-full.png                     (*) # Todos los assets estáticos en carpetas dedicadas
/frontend/public/images/logo-icon.png                     (*)

# --- Entrypoint y Configuración de la App ---
/frontend/src/App.js
/frontend/src/index.js
/frontend/src/app/axiosConfig.js
/frontend/src/app/theme.js
/frontend/src/app/contexts/AuthContext.js

# --- Componentes Reutilizables ---
/frontend/src/components/common/ConfirmationDialog.js
/frontend/src/components/common/DataGridToolbar.js
/frontend/src/components/common/Logo.js
/frontend/src/components/common/PageHeader.js

/frontend/src/components/layout/AuthLayout.js
/frontend/src/components/layout/DashboardLayout.js
/frontend/src/components/layout/DashboardSidebar.js
/frontend/src/components/layout/sidebarConfig.js

# --- Constantes Globales ---
/frontend/src/constants/crmConstants.js
/frontend/src/constants/productConstants.js
/frontend/src/constants/validationSchemas.js

# ---------------------- MÓDULOS DE NEGOCIO (FEATURES) ----------------------

# --- Módulo: Administración ---
/frontend/src/features/admin/api/dataManagementAPI.js
/frontend/src/features/admin/components/DataImporter.js
/frontend/src/features/admin/pages/DataManagementPage.js
/frontend/src/features/admin/pages/UserManagementPage.js

# --- Módulo: Autenticación ---
/frontend/src/features/auth/api/authAPI.js
/frontend/src/features/auth/pages/LoginPage.js

# --- Módulo: CRM ---
/frontend/src/features/crm/api/customersAPI.js
/frontend/src/features/crm/api/suppliersAPI.js

/frontend/src/features/crm/components/SupplierForm.js
/frontend/src/features/crm/components/SupplierDataGrid.js
frontend/src/features/crm/components/customerGridConfig.js
frontend/src/features/crm/components/CustomerDataGrid.js
frontend/src/features/crm/components/CustomerForm.js
/frontend/src/features/crm/components/supplierGridConfig.js

/frontend/src/features/crm/pages/NewSupplierPage.js
/frontend/src/features/crm/pages/SupplierListPage.js
frontend/src/features/crm/pages/CustomerListPage.js
// frontend/src/features/crm/pages/NewCustomerPage.js

# --- Módulo: Inventario ---
/frontend/src/features/inventory/api/productsAPI.js

/frontend/src/features/inventory/components/ProductForm.js
/frontend/src/features/inventory/components/InventoryLotsModal.js
/frontend/src/features/inventory/components/product/ProductPrimaryInfoSection.js
/frontend/src/features/inventory/components/product/ProductCommercialDataSection.js
/frontend/src/features/inventory/components/product/ProductSpecificationsSection.js
/frontend/src/features/inventory/components/product/ProductReferenceSection.js
/frontend/src/features/inventory/components/productGridConfig.js
/frontend/src/features/inventory/components/inventoryGridConfig.js


/frontend/src/features/inventory/pages/ProductListPage.js
/frontend/src/features/inventory/pages/NewProductPage.js
/frontend/src/features/inventory/pages/EditProductPage.js
/frontend/src/features/inventory/mappers/inventoryMappers.js

# --- Módulo: Compras ---


/frontend/src/features/purchasing/api/purchasingAPI.js
frontend/src/features/purchasing/mappers/purchaseOrderMappers.js

/frontend/src/features/purchasing/components/PurchaseOrderDataGrid.js
/frontend/src/features/purchasing/components/PurchaseOrderForm.js
frontend/src/features/purchasing/components/PurchaseBillForm.js
frontend/src/features/purchasing/components/purchaseOrderGridConfig.js
frontend/src/features/purchasing/components/purchaseBillGridConfig.js
frontend/src/features/purchasing/components/PurchaseBillDataGrid.js
frontend/src/features/purchasing/components/PurchaseBillDetails.js
frontend/src/features/purchasing/components/goodsReceiptGridConfig.js
frontend/src/features/purchasing/components/GoodsReceiptDataGrid.js
frontend/src/features/purchasing/components/GoodsReceiptForm.js
frontend/src/features/purchasing/components/GoodsReceiptDetails.js

frontend/src/features/purchasing/pages/PurchaseBillListPage.js
frontend/src/features/purchasing/pages/CreateReceiptPage.js.js
frontend/src/features/purchasing/pages/CreatePurchaseBillPage.js
/frontend/src/features/purchasing/pages/PurchaseOrderListPage.js
/frontend/src/features/purchasing/pages/NewPurchaseOrderPage.js
/frontend/src/features/purchasing/pages/EditPurchaseOrderPage.js
frontend/src/features/purchasing/pages/RegisterReceiptPage.js
frontend/src/features/purchasing/pages/PurchaseBillDetailsPage.js
frontend/src/features/purchasing/pages/GoodsReceiptListPage.js
frontend/src/features/purchasing/pages/GoodsReceiptDetailsPage.js


# --- Módulo: Reportes ---
/frontend/src/features/reports/api/reportsAPI.js
/frontend/src/features/reports/pages/ProductCatalogPage.js

# --- Módulo: Roles ---

/frontend/src/features/roles/api/rolesAPI.js

# --- Módulo: Users ---
/frontend/src/features/users/api/usersAPI.js



# --- Módulo: Ventas ---
/frontend/src/features/sales/api/salesAPI.js
/frontend/src/features/sales/components/SalesOrderDataGrid.js
/frontend/src/features/sales/components/SalesOrderForm.js
frontend/src/features/sales/components/salesOrderGridConfig.js
frontend/src/features/sales/components/ShipmentForm.js
frontend/src/features/sales/components/shipmentGridConfig.js
frontend/src/features/sales/components/ShipmentDataGrid.js

/frontend/src/features/sales/pages/SalesOrderListPage.js
/frontend/src/features/sales/pages/NewSalesOrderPage.js
frontend/src/features/sales/pages/EditSalesOrderPage.js
frontend/src/features/sales/pages/CreateShipmentPage.js
/frontend/src/features/sales/pages/ShipmentListPage.j

frontend/src/features/sales/mappers/salesMappers.js

# --- Hooks Personalizados ---
/frontend/src/hooks/useDebounce.js
/frontend/src/hooks/usePermissions.js

# --- Rutas ---
/frontend/src/routes/AppRoutes.js

# --- Utilidades ---
/frontend/src/utils/auth/auth.js
/frontend/src/utils/auth/roles.js
/frontend/src/utils/errorUtils.js
/frontend/src/utils/formatters.js    
frontend/src/utils/dataMappers.js                 
/frontend/src/utils/formatters.js

(+) # Centralizar formateadores (moneda, fecha)



