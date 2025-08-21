/backend/
├── .venv/
├── static/
│   ├── product_images/
│   └── logos/              (+) # Carpeta dedicada para logos (PNG, SVG). Más limpio.
├── .env.example
├── pyproject.toml
└── requirements.txt
/backend/app/
├── __init__.py
├── api.py
├── main.py
├── core/
│   ├── __init__.py
│   ├── config.py
│   ├── database.py
│   └── security.py
├── dependencies/
│   ├── __init__.py
│   └── roles.py
├── models/
│   ├── __init__.py
│   └── shared.py
└── modules/
    ├── __init__.py
    ├── auth/
    │   # ... (Estructura actual es correcta)
    ├── crm/
    │   # ... (Estructura actual es correcta, aunque `crm_service.py` podría dividirse si crece mucho)
    ├── data_management/
    │   # ... (Estructura actual es correcta)
    ├── inventory/
    │   ├── __init__.py
    │   ├── product_routes.py
    │   ├── product_service.py
    │   ├── product_models.py
    │   ├── repositories/
    │   │   ├── product_repository.py
    │   │   └── inventory_lot_repository.py
    │   ├── inventory_routes.py
    │   ├── inventory_service.py
    │   ├── inventory_models.py
    │   ├── adjustments_routes.py     (+) # Rutas para la nueva funcionalidad de ajustes.
    │   ├── adjustments_service.py    (+) # Lógica de negocio para los ajustes.
    │   └── adjustments_models.py     (+) # Modelos Pydantic para los ajustes.
    ├── purchasing/
    │   ├── __init__.py
    │   ├── purchasing_routes.py
    │   ├── purchasing_service.py
    │   ├── purchasing_models.py
    │   └── repositories/
    │       └── purchase_order_repository.py (*) # Nombre más explícito que purchase_repository.py
    ├── reports/
    │   ├── __init__.py
    │   ├── reports_routes.py
    │   ├── reports_service.py
    │   ├── reports_models.py
    │   └── services/
    │       └── catalog_service.py
    ├── sales/
    │   # ... (Estructura actual es correcta)
    ├── roles/
    │   # ... (Estructura actual es correcta)
    └── users/
        # ... (Estructura actual es correcta)


/frontend/
├── node_modules/
├── public/
│   ├── images/              (*) # Carpeta dedicada para imágenes estáticas como logos.
│   └── index.html
├── src/
│   ├── App.js
│   ├── index.js
│   ├── app/
│   │   ├── axiosConfig.js
│   │   ├── theme.js
│   │   └── contexts/
│   │       └── AuthContext.js
│   ├── components/
│   │   ├── common/              # Componentes 100% genéricos (Botones, Diálogos, etc.)
│   │   │   ├── ConfirmationDialog.js
│   │   │   ├── DataGridToolbar.js
│   │   │   ├── Logo.js
│   │   │   └── PageHeader.js
│   │   └── layout/              # Componentes de estructura de la página
│   │       ├── AuthLayout.js
│   │       ├── DashboardLayout.js
│   │       └── DashboardSidebar.js
│   ├── constants/               # Constantes y configuraciones globales de la UI
│   │   ├── crmConstants.js
│   │   ├── productConstants.js
│   │   ├── rolesAndPermissions.js
│   │   └── validationSchemas.js
│   ├── features/                # El corazón de la aplicación, separado por dominio de negocio
│   │   ├── admin/
│   │   │   ├── api/             (+) # Cada módulo tiene su propia carpeta de API
│   │   │   │   └── dataManagementAPI.js
│   │   │   ├── components/
│   │   │   │   └── DataImporter.js
│   │   │   └── pages/
│   │   │       ├── DataManagementPage.js
│   │   │       └── UserManagementPage.js
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   └── authAPI.js
│   │   │   └── pages/
│   │   │       └── LoginPage.js
│   │   ├── crm/
│   │   │   ├── api/
│   │   │   │   ├── customersAPI.js
│   │   │   │   └── suppliersAPI.js
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── inventory/
│   │   │   ├── api/
│   │   │   │   └── productsAPI.js
│   │   │   ├── components/
│   │   │   │   ├── product/     # Sub-componentes específicos del formulario de producto
│   │   │   │   ├── InventoryLotsModal.js
│   │   │   │   └── ProductForm.js
│   │   │   ├── mappers/         (*) # Lógica de "traducción" de datos en su propia carpeta
│   │   │   │   └── productMappers.js
│   │   │   └── pages/
│   │   │       ├── EditProductPage.js
│   │   │       ├── NewProductPage.js
│   │   │       └── ProductListPage.js
│   │   ├── purchasing/
│   │   │   ├── api/
│   │   │   │   └── purchasingAPI.js
│   │   │   ├── components/
│   │   │   │   ├── PurchaseOrderDataGrid.js
│   │   │   │   └── PurchaseOrderForm.js
│   │   │   └── pages/
│   │   │       ├── EditPurchaseOrderPage.js
│   │   │       ├── NewPurchaseOrderPage.js
│   │   │       └── PurchaseOrderListPage.js
│   │   ├── reports/
│   │   │   ├── api/
│   │   │   │   └── reportsAPI.js
│   │   │   └── pages/
│   │   │       └── ProductCatalogPage.js
│   │   └── sales/
│   │       # ... (Seguiría la misma estructura: api/, components/, pages/)
│   ├── hooks/                   # Hooks reutilizables en toda la aplicación
│   │   ├── useDebounce.js
│   │   └── usePermissions.js
│   ├── routes/
│   │   └── AppRoutes.js
│   └── utils/                   # Funciones de utilidad puras y genéricas
│       ├── auth/
│       │   ├── auth.js
│       │   └── roles.js
│       ├── errorUtils.js
│       └── formatters.js        (+) # Para formateadores de moneda, fecha, etc.
├── .env.local
└── package.json



BACKEND
-----------------------------------------------


/backend/.venv/...                                        # Entorno virtual
/backend/.env.example

/backend/app/__init__.py
/backend/app/api.py
/backend/app/main.py                                      # EntryPoint principal FastAPI

/backend/app/core/__init__.py
/backend/app/core/config.py                               # Variables de entorno
/backend/app/core/database.py                             # Conexión MongoDB o similar
/backend/app/core/security.py                             # Seguridad: JWT, hash, etc.

/backend/app/dependencies/__init__.py
/backend/app/dependencies/roles.py                        # Role checker y dependencias comunes

/backend/app/models/__init__.py
/backend/app/models/shared.py                             # PyObjectId, base models reutilizables

/backend/app/modules/__init__.py

# ---------------------- AUTENTICACIÓN ----------------------
/backend/app/modules/auth/__init__.py
/backend/app/modules/auth/auth_routes.py
/backend/app/modules/auth/auth_service.py
/backend/app/modules/auth/dependencies.py
/backend/app/modules/auth/auth_models.py

# ---------------------- CRM: Clientes y Proveedores ----------------------
/backend/app/modules/crm/__init__.py
/backend/app/modules/crm/customer_models.py
/backend/app/modules/crm/customer_routes.py
/backend/app/modules/crm/supplier_models.py
/backend/app/modules/crm/supplier_routes.py
/backend/app/modules/crm/crm_service.py
/backend/app/modules/crm/repositories/customer_repository.py
/backend/app/modules/crm/repositories/supplier_repository.py

# ---------------------- IMPORTACIÓN / EXPORTACIÓN ----------------------
/backend/app/modules/data_management/__init__.py
/backend/app/modules/data_management/data_management_routes.py
/backend/app/modules/data_management/data_management_service.py

# ---------------------- INVENTARIO ----------------------
/backend/app/modules/inventory/__init__.py

/backend/app/modules/inventory/inventory_models.py
/backend/app/modules/inventory/inventory_service.py
/backend/app/modules/inventory/inventory_routes.py
/backend/app/modules/inventory/product_models.py
/backend/app/modules/inventory/product_routes.py
/backend/app/modules/inventory/product_service.py
/backend/app/modules/inventory/repositories/product_repository.py
/backend/app/modules/inventory/repositories/inventory_lot_repository.py




# ---------------------- COMPRAS (purchasing) ----------------------
/backend/app/modules/purchasing/__init__.py
/backend/app/modules/purchasing/purchasing_models.py
/backend/app/modules/purchasing/purchasing_routes.py
/backend/app/modules/purchasing/purchasing_service.py
/backend/app/modules/purchasing/repositories/purchase_repository.py


# ---------------------- Reportes ----------------------


/backend/app/modules/reports/services/catalog_service.py
/backend/app/modules/reports/reports_service.py
/backend/app/modules/reports/reports_routes.py
/backend/app/modules/reports/reports_models.py
/backend/app/modules/reports/services/sales_order_service.py


# ---------------------- Ventas ----------------------

/backend/app/modules/sales/sales_models.py
/backend/app/modules/sales/sales_service.py
/backend/app/modules/sales/repositories/sales_repository.py
/backend/app/modules/sales/sales_routes.py

# ---------------------- ROLES ----------------------
/backend/app/modules/roles/__init__.py
/backend/app/modules/roles/role_models.py
/backend/app/modules/roles/role_routes.py
/backend/app/modules/roles/role_service.py
/backend/app/modules/roles/repositories/role_repository.py



# ---------------------- USUARIOS ----------------------
/backend/app/modules/users/__init__.py
/backend/app/modules/users/user_models.py
/backend/app/modules/users/user_routes.py
/backend/app/modules/users/user_service.py
/backend/app/modules/users/repositories/user_repository.py

# ---------------------- ARCHIVOS ESTÁTICOS ----------------------
/backend/static/product_images/...                         # Carpeta para respaldos de imágenes
/backend/static/logos/logo_empresa.png


# ---------------------- ARCHIVOS DE CONFIGURACIÓN ----------------------
/backend/pyproject.toml                                    # Configuración de herramientas
/backend/requirements.txt                                  # Dependencias de producción/dev




FRONTEND
-----------------------------------------------



/frontend/node_modules/...                                  # Dependencias de NPM/Yarn

/frontend/public/index.html
/frontend/public/favicon.ico
/frontend/public/...                                         # Otros archivos públicos

/frontend/src/App.js                                         # Componente raíz
/frontend/src/index.js                                       # Punto de entrada React

/frontend/src/app/axiosConfig.js                             # Axios configurado
/frontend/src/app/theme.js                                   # Material UI theme

/frontend/src/app/contexts/AuthContext.js                    # Contexto de autenticación

# ---------------------- Componentes ------------

/frontend/src/components/common/ConfirmationDialog.js
/frontend/src/components/common/FilterBar.js
/frontend/src/components/common/PageHeader.js
/frontend/src/components/common/DataGridToolbar.js
frontend/src/components/common/Logo.js

/frontend/src/components/layout/AuthLayout.js
/frontend/src/components/layout/DashboardLayout.js
/frontend/src/components/layout/DashboardSidebar.js

/frontend/src/constants/productConstants.js
/frontend/src/constants/rolesAndPermissions.js
/frontend/src/constants/validationSchemas.js
/frontend/src/constants/permissions.js
/frontend/src/constants/crmConstants.js

# ---------------------- MÓDULOS DE NEGOCIO ----------------------

/frontend/src/features/admin/api/dataManagementAPI.js
/frontend/src/features/admin/components/DataImporter.js
/frontend/src/features/admin/pages/DataManagementPage.js
/frontend/src/features/admin/pages/UserManagementPage.js

/frontend/src/features/auth/api/authAPI.js
/frontend/src/features/auth/pages/LoginPage.js
/frontend/src/features/auth/pages/RegisterPage.js
/frontend/src/features/auth/
/frontend/src/features/auth/


# ---------------------- CRM ------------------



/frontend/src/features/crm/api/suppliersAPI.js
/frontend/src/features/crm/api/customersAPI.js

/frontend/src/features/crm/components/SupplierForm.js
/frontend/src/features/crm/components/SupplierDataGrid.js
/frontend/src/features/crm/pages/NewSupplierPage.js
/frontend/src/features/crm/pages/SupplierListPage.js



# ---------------------- Inventario


frontend/src/features/inventory/productMappers.js

/frontend/src/features/inventory/api/productsAPI.js

frontend/src/features/inventory/components/product/ProductPrimaryInfoSection.js
frontend/src/features/inventory/components/product/ProductCommercialDataSection.js
frontend/src/features/inventory/components/product/ProductSpecificationsSection.js
frontend/src/features/inventory/components/product/ProductReferenceSection.js

/frontend/src/features/inventory/components/ProductForm.js
/frontend/src/features/inventory/components/ProductGridToolbar.js
frontend/src/features/inventory/components/InventoryLotsModal.js
/frontend/src/features/inventory/pages/EditProductPage.js
/frontend/src/features/inventory/pages/InactiveProductListPage.js
/frontend/src/features/inventory/pages/NewProductPage.js
/frontend/src/features/inventory/pages/ProductListPage.js
/frontend/src/features/inventory/pages/ProductMovementPage.js

# ---------------------- Compras ----------------------

/frontend/src/features/purchasing/api/purchasingAPI.js              
/frontend/src/features/purchasing/components/PurchaseOrderForm.js
/frontend/src/features/purchasing/components/PurchaseOrderGridToolbar.js
/frontend/src/features/purchasing/pages/
/frontend/src/features/purchasing/pages/
/frontend/src/features/purchasing/components/PurchaseOrderDataGrid.js
frontend/src/features/purchasing/pages/EditPurchaseOrderPage.js


# ---------------------- Reportes ----------------------

/frontend/src/features/reports/api/reportsAPI.js
/frontend/src/features/reports/pages/ProductCatalogPage.js

# ---------------------- Ventas ----------------------

/frontend/src/features/sales/components/SalesOrderForm.js
/frontend/src/features/sales/api/salesAPI.js
/frontend/src/features/sales/pages/NewSalesOrderPage.js
/frontend/src/features/sales/pages/SalesOrderListPage.js
/frontend/src/features/sales/components/SalesOrderDataGrid.js

# ---------------------- HOOKS PERSONALIZADOS ----------------------
/frontend/src/hooks/useDebounce.js
/frontend/src/hooks/usePermissions.js

# ---------------------- RUTAS ----------------------
/frontend/src/routes/AppRoutes.js

# ---------------------- UTILIDADES ----------------------

/frontend/src/utils/errorUtils.js
/frontend/src/utils/auth/auth.js
/frontend/src/utils/auth/roles.js
/frontend/src/utils/fileUtils.js

# ---------------------- CONFIGURACIÓN DE PROYECTO ----------------------
/frontend/package.json                                        # Dependencias y scripts
/frontend/.env.local                                          # Variables de entorno locales





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

/frontend/src/features/crm/pages/NewSupplierPage.js
/frontend/src/features/crm/pages/SupplierListPage.js
frontend/src/features/crm/pages/CustomerListPage.js
// frontend/src/features/crm/pages/NewCustomerPage.js

# --- Módulo: Inventario ---
/frontend/src/features/inventory/api/productsAPI.js
/frontend/src/features/inventory/mappers/productMappers.js           (*) # Mappers en su propia carpeta para mayor claridad
/frontend/src/features/inventory/components/ProductForm.js
/frontend/src/features/inventory/components/InventoryLotsModal.js
/frontend/src/features/inventory/components/product/ProductPrimaryInfoSection.js
/frontend/src/features/inventory/components/product/ProductCommercialDataSection.js
/frontend/src/features/inventory/components/product/ProductSpecificationsSection.js
/frontend/src/features/inventory/components/product/ProductReferenceSection.js
/frontend/src/features/inventory/pages/ProductListPage.js
/frontend/src/features/inventory/pages/NewProductPage.js
/frontend/src/features/inventory/pages/EditProductPage.js

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


(+) # Centralizar formateadores (moneda, fecha)



