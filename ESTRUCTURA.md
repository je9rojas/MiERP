/backend/
├── .venv/                      # Entorno virtual de Python
├── app/
│   ├── __init__.py
│   ├── main.py                 # Punto de entrada y orquestador principal de la API
│   │
│   ├── core/                   # Lógica central y configuración
│   │   ├── __init__.py
│   │   ├── config.py           # Gestión de variables de entorno
│   │   ├── database.py         # Conexión a la base de datos
│   │   └── security.py         # Lógica de contraseñas y JWT
│   │
│   ├── dependencies/           # Dependencias reutilizables de FastAPI
│   │   ├── __init__.py
│   │   └── roles.py            # El `role_checker` para proteger endpoints
│   │
│   ├── models/                 # Modelos Pydantic compartidos
│   │   ├── __init__.py
│   │   └── shared.py           # Contiene `PyObjectId` y otros modelos comunes
│   │
│   └── modules/                # <-- CORAZÓN DE LA ARQUITECTURA: Módulos de Negocio
│       ├── __init__.py
│       ├── auth/               # Módulo de Autenticación
│       │   ├── __init__.py
│       │   ├── auth_routes.py
│       │   └── auth_service.py
│       │
│       ├── crm/                # Módulo de Clientes y Proveedores
│       │   ├── __init__.py
│       │   ├── customer_models.py
│       │   ├── customer_routes.py
│       │   ├── supplier_models.py
│       │   ├── supplier_routes.py
│       │   ├── crm_service.py
│       │   └── repositories/
│       │       ├── customer_repository.py
│       │       └── supplier_repository.py
│       │
│       ├── data_management/    # <-- ¡NUEVO! Módulo de Importación/Exportación
│       │   ├── __init__.py
│       │   ├── data_management_routes.py
│       │   └── data_management_service.py
│       │
│       ├── inventory/          # Módulo de Inventario (Ahora más limpio)
│       │   ├── __init__.py
│       │   ├── catalog_generator.py # <-- ¡NUEVO! Lógica de diseño del PDF
│       │   ├── product_models.py
│       │   ├── product_routes.py
│       │   ├── product_service.py   # Ahora enfocado en el CRUD y la lógica de negocio
│       │   └── repositories/
│       │       └── product_repository.py
│       │
│       ├── purchasing/         # Módulo de Compras
│       │   └── ... (su estructura)
│       │
│       ├── roles/              # Módulo de Gestión de Roles
│       │   └── ... (su estructura)
│       │
│       └── users/              # Módulo de Gestión de Usuarios
│           └── ... (su estructura)
│
├── static/                     # <-- ¡NUEVO! Carpeta para archivos estáticos
│   └── product_images/         # Carpeta de respaldo para las imágenes de productos
│
├── pyproject.toml              # Configuración de herramientas de desarrollo
└── requirements.txt            # Dependencias de Python

-------------------------------------

/frontend/
├── node_modules/               # Dependencias de JavaScript
├── public/                     # Archivos públicos (index.html, favicon, etc.)
├── src/
│   ├── App.js                  # Componente raíz (renderiza AppRoutes)
│   ├── index.js                # Punto de entrada (renderiza App, proveedores)
│   │
│   ├── app/                    # Configuración y estado global
│   │   ├── axiosConfig.js      # Configuración centralizada de Axios
│   │   ├── contexts/
│   │   │   └── AuthContext.js  # Contexto de autenticación
│   │   └── theme.js            # Tema de Material-UI
│   │
│   ├── components/
│   │   ├── common/             # Componentes de UI genéricos y reutilizables
│   │   │   ├── ConfirmationDialog.js
│   │   │   ├── FilterBar.js
│   │   │   └── PageHeader.js
│   │   └── layout/             # Componentes de la estructura principal
│   │       ├── DashboardLayout.js
│   │       ├── DashboardSidebar.js
│   │       └── AuthLayout.js
│   │
│   ├── constants/              # Constantes de la aplicación
│   │   ├── productConstants.js
│   │   ├── rolesAndPermissions.js # ¡NUEVO! Sistema de permisos basado en acciones
│   │   └── validationSchemas.js   # Esquemas de validación de Yup
│   │
│   ├── features/               # <-- CORAZÓN DE LA ARQUITECTURA: Módulos de Negocio
│   │   ├── admin/              # Módulo de Administración
│   │   │   ├── api/
│   │   │   │   └── dataManagementAPI.js # <-- ¡NUEVO! API para import/export
│   │   │   ├── components/
│   │   │   │   └── DataImporter.js      # <-- ¡NUEVO! Componente para subir archivos
│   │   │   └── pages/
│   │   │       ├── DataManagementPage.js # <-- ¡NUEVA! Página de gestión de datos
│   │   │       └── UserManagementPage.js
│   │   ├── auth/
│   │   │   └── ... (su estructura)
│   │   ├── inventory/
│   │   │   ├── api/
│   │   │   │   └── productsAPI.js
│   │   │   ├── components/
│   │   │   │   ├── ProductForm.js         # Formulario compartido
│   │   │   │   └── ProductGridToolbar.js  # <-- ¡NUEVO! Toolbar para el DataGrid
│   │   │   └── pages/
│   │   │       ├── EditProductPage.js
│   │   │       ├── InactiveProductListPage.js # <-- ¡NUEVA! Página para reactivar
│   │   │       ├── NewProductPage.js
│   │   │       ├── ProductListPage.js
│   │   │       └── ProductMovementPage.js   # <-- ¡NUEVA! Página de historial
│   │   └── purchasing/
│   │       └── ... (su estructura)
│   │
│   ├── hooks/                  # Hooks personalizados
│   │   └── useDebounce.js
│   │
│   ├── routes/                 # Definición central de las rutas
│   │   └── AppRoutes.js
│   │
│   └── utils/                  # Funciones de utilidad genéricas
│       ├── auth/
│       │   ├── auth.js
│       │   └── roles.js
│
├── package.json                # Dependencias de JavaScript
└── .env.local                  # Variables de entorno

-----------------------------------

/setup.py

/backend/requirements.txt
/backend/requirements-dev.txt 

/backend/app/main.py

backend/app/core/database.py
backend/app/core/security.py
backend/app/core/config.py
backend/app/core/secrets_manager.py

/backend/app/dependencies/roles.py



backend/app/modules/users/user_models.py
backend/app/modules/users/user_service.py
backend/app/modules/users/user_routes.py
/backend/app/modules/users/repositories/user_repository.py

backend/app/modules/auth/auth_service.py
backend/app/modules/auth/auth_routes.py

backend/app/modules/roles/role_service.py
backend/app/modules/roles/role_routes.py

backend/app/modules/crm/supplier_models.py
backend/app/modules/crm/crm_service.py

backend/app/modules/inventory/product_models.py.

backend/app/modules/inventory/product_service.py.
backend/app/modules/inventory/product_routes.py.
/modules/inventory/repositories/product_repository.py


backend/app/modules/purchasing/purchase_order_models.py
backend/app/modules/purchasing/purchase_order_routes.py.
backend/app/modules/purchasing/purchasing_models.py

backend/app/modules/crm/supplier_routes.py.








/backend/scripts/create_superadmin.py

----------------------------------

/frontend/src/main.js
/frontend/src/App.js
/frontend/src/index.js



/frontend/src/app/contexts/AuthContext.js
/frontend/src/app/store.js
/frontend/src/app/theme.js


/frontend/src/components/auth/LoginForm.js
/frontend/src/components/auth/LoginForm.js

/frontend/src/components/common/PageHeader.js
/frontend/src/components/common/ConfirmationDialog.js
/frontend/src/components/common/FilterBar.js

/frontend/src/components/layout/AuthLayout.js
/frontend/src/components/layout/DashboardAppBar.js
/frontend/src/components/layout/DashboardLayout.js
/frontend/src/components/layout/DashboardSidebar.js
/frontend/src/components/common/SupplierAutocomplete.js
/frontend/src/components/common/ProductAutocomplete.js

/frontend/src/constants/productConstants.js
/frontend/src/constants/apiConfig.js
/frontend/src/constants/rolesAndPermissions.js
/frontend/src/constants/validationSchemas.js

/frontend/src/features/auth/pages/LoginPage.js

frontend/src/features/inventory/api/productsAPI.js.
/frontend/src/features/admin/components/UserFormModal.js
/frontend/src/features/admin/pages/UserManagementPage.js
/frontend/src/features/dashboard/pages/DashboardPage.js
/frontend/src/features/auth/pages/RegisterPage.js
/frontend/src/features/home/pages/HomePage.js

/frontend/src/features/inventory/pages/ProductCatalogPage.js
/frontend/src/features/inventory/components/CatalogFilterForm.js
frontend/src/features/inventory/pages/NewProductPage.js
frontend/src/features/inventory/components/ProductForm.js
frontend/src/features/inventory/pages/ProductListPage.j
/frontend/src/features/inventory/pages/EditProductPage.js
/frontend/src/features/inventory/productSlice.js


/frontend/src/features/purchasing/pages/NewPurchaseOrderPage.js


/frontend/src/hooks/useDebounce.js

/frontend/src/routes/AppRoutes.js

/frontend/src/utils/auth/auth.js
/frontend/src/utils/auth/roles.js



----------------------------



NO VA
/frontend/src/features/auth/authSlice.js

/frontend/src/components/auth/ProtectedRoute.js


backend/app/models/customer.py
backend/app/models/product.py
backend/app/models/user.py
/backend/app/models/supplier.py
/backend/app/models/purchase_order.py
/backend/app/models/credit_note.py
/backend/app/models/shared.py
backend/app/models/reception.py
backend/app/models/movements.py



/backend/app/routes/__init__.py
/backend/app/routes/auth.py
backend/app/routes/products.py
/backend/app/routes/roles.py
/backend/app/routes/users.py
/backend/app/routes/customers.py
/backend/app/routes/suppliers.py
/backend/app/routes/purchase_orders.py

backend/app/services/__init__.py
backend/app/services/auth_service.py
backend/app/services/templates/catalog_template.html
backend/app/services/catalog_service.py
backend/app/services/user_service.py
backend/app/services/role_service.py
backend/app/services/product_service.py


/backend/app/schemas/purchase_order.py


/frontend/src/api/axiosConfig.js
/frontend/src/api/authAPI.js
/frontend/src/api/adminAPI.js.
/frontend/src/api/productsAPI.js
/frontend/src/api/purchasingAPI.js
/frontend/src/api/supplierAPI.js

-------------------------------------------
--------------------------------------------
--------------------------------------------


/backend
\backend\static\product_images\

/app/




/backend/app/core/
/backend/app/core/config.py
/backend/app/core/database.py
/backend/app/core/secrets_manager.py
/backend/app/core/security.py
/backend/app/dependencies/
/backend/app/dependencies/roles.py
/backend/app/models/shared.py

/backend/app/modules/auth/auth_routes.py
/backend/app/modules/auth/auth_service.py


/backend/app/modules/crm/repositories/customer_repository.py
/backend/app/modules/crm/repositories/supplier_repository.py
/backend/app/modules/crm/crm_service.py
/backend/app/modules/crm/customer_models.py
/backend/app/modules/crm/customer_routes.py
/backend/app/modules/crm/supplier_models.py
/backend/app/modules/crm/supplier_routes.py


/backend/app/modules/data_management/data_management_service.py

/backend/app/modules/inventory/repositories/product_repository.py
/backend/app/modules/inventory/
/backend/app/modules/inventory/
/backend/app/modules/inventory/
/backend/app/modules/inventory/
/backend/app/modules/inventory/
/backend/app/modules/inventory/
/backend/app/modules/inventory/catalog_generator.py

/backend/app/modules/purchasing/
/backend/app/modules/purchasing/
/backend/app/modules/purchasing/
/backend/app/modules/purchasing/
/backend/app/modules/purchasing/
/backend/app/modules/purchasing/

/backend/app/modules/roles/
/backend/app/modules/roles/
/backend/app/modules/roles/
/backend/app/modules/roles/
/backend/app/modules/roles/
/backend/app/modules/roles/

/backend/app/modules/users/
/backend/app/modules/users/
/backend/app/modules/users/
/backend/app/modules/users/
/backend/app/modules/users/



/repositories/base.repository.py












/scripts
/secure
/venv










/frontend










backend/app/repositories/base_repository.py




-----------------------------------


frontend/src/config/dataGridConfig.js.
frontend/src/components/layout/ListPageLayout.js


/frontend/src/features/admin/api/dataManagementAPI.js

/frontend/src/features/admin/components/DataImporter.js

/frontend/src/features/inventory/components/ProductGridToolbar.js


BACKEND
-----------------------------------------------


/backend/.venv/...                                        # Entorno virtual

/backend/app/__init__.py
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
/backend/app/modules/inventory/catalog_generator.py
/backend/app/modules/inventory/product_models.py
/backend/app/modules/inventory/product_routes.py
/backend/app/modules/inventory/product_service.py
/backend/app/modules/inventory/repositories/product_repository.py

# ---------------------- COMPRAS (purchasing) ----------------------
/backend/app/modules/purchasing/__init__.py
/backend/app/modules/purchasing/purchasing_models.py
/backend/app/modules/purchasing/purchasing_routes.py
/backend/app/modules/purchasing/purchasing_service.py
/backend/app/modules/purchasing/repositories/purchase_repository.py

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

/frontend/src/components/common/ConfirmationDialog.js
/frontend/src/components/common/FilterBar.js
/frontend/src/components/common/PageHeader.js

/frontend/src/components/layout/AuthLayout.js
/frontend/src/components/layout/DashboardLayout.js
/frontend/src/components/layout/DashboardSidebar.js

/frontend/src/constants/productConstants.js
/frontend/src/constants/rolesAndPermissions.js
/frontend/src/constants/validationSchemas.js
/frontend/src/constants/permissions.js

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


# ----------------------

/frontend/src/features/inventory/api/productsAPI.js
/frontend/src/features/inventory/components/ProductForm.js
/frontend/src/features/inventory/components/ProductGridToolbar.js
/frontend/src/features/inventory/pages/EditProductPage.js
/frontend/src/features/inventory/pages/InactiveProductListPage.js
/frontend/src/features/inventory/pages/NewProductPage.js
/frontend/src/features/inventory/pages/ProductListPage.js
/frontend/src/features/inventory/pages/ProductMovementPage.js

/frontend/src/features/purchasing/api/purchasingAPI.js              
/frontend/src/features/purchasing/components/PurchaseOrderForm.js
/frontend/src/features/purchasing/components/PurchaseOrderGridToolbar.js
/frontend/src/features/purchasing/pages/
/frontend/src/features/purchasing/pages/


# ---------------------- (estructura pendiente de detallar) 



/frontend/src/features/crm/api/suppliersAPI.js

# ---------------------- HOOKS PERSONALIZADOS ----------------------
/frontend/src/hooks/useDebounce.js

# ---------------------- RUTAS ----------------------
/frontend/src/routes/AppRoutes.js

# ---------------------- UTILIDADES ----------------------
/frontend/src/utils/auth/auth.js
/frontend/src/utils/auth/roles.js

# ---------------------- CONFIGURACIÓN DE PROYECTO ----------------------
/frontend/package.json                                        # Dependencias y scripts
/frontend/.env.local                                          # Variables de entorno locales
