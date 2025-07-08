mierp/
├── backend/
│   ├── app/
│   │   ├── main.py                  # Punto de entrada FastAPI
│   │   ├── core/                    # Configuraciones centrales
│   │   │   ├── config.py            # Configuración de la aplicación
│   │   │   ├── security.py          # Autenticación JWT
│   │   │   └── database.py          # Conexión MongoDB
│   │   ├── models/                  # Modelos Pydantic
│   │   │   ├── product.py
│   │   │   ├── user.py
│   │   │   └── ...
│   │   ├── schemas/                 # Esquemas MongoDB
│   │   ├── routes/                  # Endpoints API
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   └── ...
│   │   ├── services/                # Lógica de negocio
│   │   ├── utils/                   # Utilidades comunes
│   │   └── tests/                   # Pruebas unitarias
│   ├── requirements.txt             # Dependencias de producción
│   ├── requirements-dev.txt         # Dependencias de desarrollo
│   └── Dockerfile                   # Docker (por ahora no)
│


├── frontend/
│   ├── public/                      # Assets estáticos
│   ├── src/
│   │   ├── components/              # Componentes reutilizables
│   │   ├── pages/                   # Vistas por módulo
│   │   ├── layouts/                 # Diseños (incluye menú lateral)
│   │   ├── hooks/                   # Custom hooks
│   │   ├── context/                 # Contextos React
│   │   ├── services/                # Llamadas a API
│   │   ├── utils/                   # Utilidades
│   │   ├── App.js                   # Configuración de rutas
│   │   └── index.js                 # Punto de entrada
│   ├── package.json
│   └── Dockerfile
│
├── docs/                            # Documentación
├── scripts/                         # Scripts de despliegue
├── .github/workflows/               # GitHub Actions CI/CD
├── .env.example                     # Variables de entorno ejemplo
├── setup.py                         # Configuración del paquete Python
├── pyproject.toml                   # Configuración moderna del proyecto
└── README.md                        # Documentación inicial



frontend/
├── public/
│   ├── index.html
│   ├── assets/            # Assets globales
│   │   ├── images/        # Imágenes compartidas
│   │   ├── fonts/         # Fuentes custom
│   │   └── styles/        # Estilos globales
│   └── robots.txt
│
└── src/
    ├── api/               # Configuración API y endpoints
    │   ├── axiosConfig.js # Interceptores, headers
    │   ├── authAPI.js     # Endpoints de autenticación
    │   └── ...           # Otros servicios API
    │
    ├── app/               # Configuración global de la app
    │   ├── constants/     # Constantes reutilizables
    │   ├── contexts/      # Contextos globales
    │   │   └── AuthContext.js # Contexto de autenticación
    │   └── store/         # Estado global (si usas Redux/Zustand)
    │
    ├── components/
    │   ├── auth/          # Componentes específicos de auth
    │   │   ├── LoginForm/
    │   │   └── ProtectedRoute.js
    │   ├── common/        # Componentes UI reutilizables
    │   ├── layout/        # Componentes estructurales
    │   │   ├── MainLayout/
    │   │   ├── DashboardLayout/
    │   │   └── AuthLayout/
    │   └── ui/           # Componentes UI atómicos
    │
    ├── features/          # Organizado por features/modulos
    │   ├── auth/          # Todo lo relacionado a autenticación
    │   │   ├── hooks/     # Custom hooks específicos
    │   │   ├── pages/
    │   │   │   ├── LoginPage/
    │   │   │   ├── RegisterPage/
    │   │   │   └── ForgotPasswordPage/
    │   │   └── utils/     # Utilidades específicas
    │   ├── dashboard/     # Módulo dashboard
    │   └── ...           # Otros módulos
    │
    ├── hooks/             # Hooks globales
    ├── routes/            # Configuración de rutas
    │   ├── AppRoutes.js   # Rutas principales
    │   ├── PrivateRoutes.js # Rutas protegidas
    │   └── PublicRoutes.js # Rutas públicas
    │
    ├── styles/           # Estilos globales/theming
    │   ├── theme.js       # Config MUI theme
    │   └── globalStyles.js
    │
    ├── utils/            # Utilidades globales
    │   ├── auth/         # Helpers de autenticación
    │   │   ├── auth.js   # Manejo de tokens
    │   │   └── roles.js # Utilidades para roles
    │   ├── http/         # Helpers HTTP
    │   └── validators/   # Schemas de validación
    │
    ├── App.js            # Componente raíz
    └── main.js           # Punto de entrada (antes index.js)


----------------------------------

frontend/
├── public/
│   ├── index.html
│   ├── assets/
│   │   ├── images/
│   │   ├── fonts/
│   │   └── styles/
│   │       └── global.css
│   └── robots.txt
│
└── src/
    ├── api/
    │   ├── axiosConfig.js
    │   ├── authAPI.js
    │   └── apiConstants.js
    │
    ├── app/
    │   ├── constants/
    │   │   └── appConstants.js
    │   ├── contexts/
    │   │   └── AuthContext.js
    │   └── store/
    │       └── store.js
    │
    ├── components/
    │   ├── auth/
    │   │   ├── LoginForm/
    │   │   │   ├── LoginForm.js
    │   │   │   └── LoginForm.css
    │   │   └── ProtectedRoute.js
    │   ├── common/
    │   │   └── LoadingSpinner.js
    │   ├── layout/
    │   │   ├── MainLayout/
    │   │   │   ├── MainLayout.js
    │   │   │   └── MainLayout.css
    │   │   ├── DashboardLayout/
    │   │   │   ├── DashboardLayout.js
    │   │   │   └── DashboardLayout.css
    │   │   └── AuthLayout/
    │   │       ├── AuthLayout.js
    │   │       └── AuthLayout.css
    │   └── ui/
    │       ├── CustomButton.js
    │       └── CustomInput.js
    │
    ├── features/
    │   ├── auth/
    │   │   ├── hooks/
    │   │   │   └── useAuth.js
    │   │   ├── pages/
    │   │   │   ├── LoginPage/
    │   │   │   │   ├── LoginPage.js
    │   │   │   │   └── LoginPage.css
    │   │   │   ├── RegisterPage/
    │   │   │   └── ForgotPasswordPage/
    │   │   └── utils/
    │   │       └── authUtils.js
    │   └── dashboard/
    │       ├── pages/
    │       │   └── DashboardPage.js
    │       └── components/
    │           └── DashboardHeader.js
    │
    ├── hooks/
    │   └── useWindowSize.js
    │
    ├── routes/
    │   ├── AppRoutes.js
    │   ├── PrivateRoutes.js
    │   └── PublicRoutes.js
    │
    ├── styles/
    │   ├── theme.js
    │   └── globalStyles.js
    │
    ├── utils/
    │   ├── auth/
    │   │   ├── auth.js
    │   │   └── roles.js
    │   ├── http/
    │   │   └── http.js
    │   └── validators/
    │       └── authValidators.js
    │
    ├── App.js
    └── main.js



-----------------------------------

/setup.py

/backend/requirements.txt
/backend/requirements-dev.txt 
/pyproject.toml

/backend/app/main.py

backend/app/core/database.py
backend/app/core/security.py
backend/app/core/config.py
backend/app/core/secrets_manager.py

/backend/app/dependencies/roles.py

backend/app/models/customer.py
backend/app/models/product.py
backend/app/models/user.py
/backend/app/models/supplier.py
/backend/app/models/purchase_order.py
/backend/app/models/credit_note.py


/backend/app/routes/__init__.py
/backend/app/routes/auth.py
backend/app/routes/products.py
/backend/app/routes/roles.py
/backend/app/routes/users.py
/backend/app/routes/customers.py
/backend/app/routes/suppliers.py
/backend/app/routes/purchase_orders.py

/backend/app/schemas/purchase_order.py


backend/app/services/__init__.py
backend/app/services/auth_service.py
backend/app/services/templates/catalog_template.html
backend/app/services/catalog_service.py


/backend/scripts/create_superadmin.py

----------------------------------

/frontend/src/main.js
/frontend/src/App.js
/frontend/src/index.js

/frontend/src/api/axiosConfig.js
/frontend/src/api/authAPI.js
/frontend/src/api/adminAPI.js.
/frontend/src/api/productsAPI.js
/frontend/src/api/purchasingAPI.js
/frontend/src/api/supplierAPI.js

/frontend/src/app/contexts/AuthContext.js
/frontend/src/app/store.js
/frontend/src/app/theme.js


/frontend/src/components/auth/LoginForm.js
/frontend/src/components/auth/LoginForm.js
/frontend/src/components/layout/AuthLayout.js
/frontend/src/components/layout/DashboardAppBar.js
/frontend/src/components/layout/DashboardLayout.js
/frontend/src/components/layout/DashboardSidebar.js

/frontend/src/features/auth/pages/LoginPage.js

/frontend/src/features/admin/components/UserFormModal.js
/frontend/src/features/admin/pages/UserManagementPage.js
/frontend/src/features/dashboard/pages/DashboardPage.js
/frontend/src/features/auth/pages/RegisterPage.js
/frontend/src/features/home/pages/HomePage.js
/frontend/src/features/inventory/pages/ProductCatalogPage.js
/frontend/src/features/inventory/components/CatalogFilterForm.js
/frontend/src/features/purchasing/pages/NewPurchaseOrderPage.js
/frontend/src/features/purchasing/components/SupplierAutocomplete.js
/frontend/src/features/purchasing/components/ProductAutocomplete.js


/frontend/src/routes/AppRoutes.js

/frontend/src/utils/auth/auth.js
/frontend/src/utils/auth/roles.js



----------------------------



NO VA
/frontend/src/features/auth/authSlice.js

/frontend/src/components/auth/ProtectedRoute.js