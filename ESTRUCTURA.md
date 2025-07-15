

/backend/
├── .venv/                      # Entorno virtual aislado para las dependencias de Python
├── app/
│   ├── __init__.py
│   ├── main.py                 # Punto de entrada y orquestador principal de la API
│   │
│   ├── core/                   # Lógica central y configuración de la aplicación
│   │   ├── __init__.py
│   │   ├── config.py           # Gestión de variables de entorno con Pydantic
│   │   ├── database.py         # Configuración de la conexión a la base de datos
│   │   └── security.py         # Lógica de contraseñas y tokens JWT
│   │
│   ├── dependencies/           # Dependencias reutilizables de FastAPI
│   │   ├── __init__.py
│   │   └── roles.py            # El `role_checker` para proteger endpoints
│   │
│   ├── models/                 # Modelos Pydantic compartidos entre todos los módulos
│   │   ├── __init__.py
│   │   └── shared.py           # Contiene `PyObjectId` y otros modelos comunes
│   │
│   └── modules/                # <-- CORAZÓN DE LA ARQUITECTURA: Módulos de Negocio
│       ├── __init__.py
│       ├── auth/
│       │   ├── __init__.py
│       │   ├── auth_routes.py    # Endpoints para /auth
│       │   └── auth_service.py   # Lógica de negocio de autenticación
│       │
│       ├── crm/                  # Módulo de Gestión de Clientes y Proveedores
│       │   ├── __init__.py
│       │   ├── customer_models.py
│       │   ├── customer_routes.py
│       │   ├── supplier_models.py
│       │   ├── supplier_routes.py
│       │   ├── crm_service.py      # Servicio que puede contener lógica para ambos
│       │   └── repositories/
│       │       ├── __init__.py
│       │       ├── customer_repository.py
│       │       └── supplier_repository.py
│       │
│       ├── inventory/            # Módulo de Inventario
│       │   ├── __init__.py
│       │   ├── product_models.py
│       │   ├── product_routes.py
│       │   ├── product_service.py
│       │   └── repositories/
│       │       ├── __init__.py
│       │       └── product_repository.py
│       │
│       ├── purchasing/           # Módulo de Compras
│       │   ├── __init__.py
│       │   ├── purchase_order_models.py
│       │   ├── purchase_order_routes.py
│       │   ├── purchase_order_service.py
│       │   └── repositories/
│       │       ├── __init__.py
│       │       └── purchase_order_repository.py
│       │
│       ├── roles/                # Módulo de Gestión de Roles
│       │   ├── __init__.py
│       │   ├── role_routes.py
│       │   ├── role_service.py
│       │   └── repositories/
│       │       └── role_repository.py
│       │
│       └── users/                # Módulo de Gestión de Usuarios
│           ├── __init__.py
│           ├── user_models.py
│           ├── user_routes.py
│           ├── user_service.py
│           └── repositories/
│               └── user_repository.py
│
├── pyproject.toml              # Configuración de herramientas de desarrollo (black, ruff)
└── requirements.txt            # Dependencias de Python para producción



/frontend/
├── node_modules/               # Dependencias de JavaScript
├── public/
├── src/
│   ├── App.js                  # Componente contenedor raíz (muy simple)
│   ├── index.js                # Punto de entrada, renderizado y proveedores globales
│   │
│   ├── app/                    # Configuración y estado global de la aplicación
│   │   ├── axiosConfig.js      # Configuración centralizada de Axios
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   └── theme.js            # Tema y constantes de UI de Material-UI
│   │
│   ├── components/
│   │   ├── common/             # <-- Componentes de UI genéricos y reutilizables
│   │   │   ├── ConfirmationDialog.js
│   │   │   ├── FilterBar.js
│   │   │   ├── FullScreenLoader.js
│   │   │   ├── PageHeader.js
│   │   │   ├── ProductAutocomplete.js
│   │   │   └── SupplierAutocomplete.js
│   │   └── layout/             # Componentes de la estructura principal (Dashboard, etc.)
│   │       └── ...
│   │
│   ├── config/                 # (Opcional) Un buen lugar para la config de DataGrid
│   │   └── dataGridConfig.js
│   │
│   ├── constants/              # Archivos de constantes para toda la aplicación
│   │   ├── apiConfig.js
│   │   ├── productConstants.js
│   │   ├── rolesAndPermissions.js
│   │   └── validationSchemas.js
│   │
│   ├── features/               # <-- CORAZÓN DE LA ARQUITECTURA: Módulos de Negocio
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   └── authAPI.js
│   │   │   └── pages/
│   │   │       └── LoginPage.js
│   │   ├── inventory/
│   │   │   ├── api/
│   │   │   │   └── productsAPI.js
│   │   │   ├── components/
│   │   │   │   └── ProductForm.js
│   │   │   └── pages/
│   │   │       ├── EditProductPage.js
│   │   │       ├── NewProductPage.js
│   │   │       └── ProductListPage.js
│   │   └── purchasing/
│   │       └── ...
│   │
│   ├── hooks/                  # Hooks personalizados y reutilizables
│   │   └── useDebounce.js
│   │
│   ├── routes/                 # Definición central de las rutas de la aplicación
│   │   └── AppRoutes.js
│   │
│   └── utils/                  # Funciones de utilidad genéricas
│       └── auth/
│           └── auth.js
│
├── package.json                # Dependencias de JavaScript
└── .env.local                  # Variables de entorno del frontend






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




backend/app/repositories/base_repository.py




-----------------------------------


frontend/src/config/dataGridConfig.js.
frontend/src/components/layout/ListPageLayout.js






