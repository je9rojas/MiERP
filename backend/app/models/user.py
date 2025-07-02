# /backend/app/models/user.py
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum importmacenero`, `contador`, etc.).
    *   Aquí los campos son correctos: `Nombre`, `Username`, `Rol`, `Sucursal`, `Contraseña`.

2.  **Nuevo Módulo: "Gestión de Enum

# --- Los roles internos se mantienen ---
class UserRole(str, Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    MANAGER = "manager"
    SALES = "vendedor"
     Clientes" (CRM)**
    *   **Ubicación en el Menú:** `Ventas y CRM > ClientesWAREHOUSE = "almacenero"

class Branch(BaseModel):
    name: str
    is`.
    *   **Propósito:** Mantener la base de datos de los clientes a los que se les vende.
_main: bool

class AuditLog(BaseModel):
    action: str
    ip: str
        *   **Campos Clave:** `Nombre/Razón Social`, `Tipo de Cliente (Persona/Empresatimestamp: datetime

# --- Schema para crear un USUARIO INTERNO (EMPLEADO) ---
class UserCreate(BaseModel)`, `RUC/DNI`, `Dirección Principal`, `Dirección de Envío`, `Contacto Principal ():
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    name: str = Field(email, teléfono)`, `Vendedor Asignado`, `Lista de Precios`, `Línea de Crédito`,..., min_length=3, max_length=100, description="Nombre completo del empleado")
    role etc.

---

### **Acción Inmediata: Refinar el Módulo de Usuarios Internos**

Bas: UserRole
    phone: str = Field(default="", max_length=20)
    # ---ado en tus comentarios, vamos a ajustar el módulo actual de "Gestión de Usuarios" para que sea exclusivamente para empleados. Esto La dirección es del empleado, no del cliente ---
    address: str = Field(default="", max_length= lo hará más limpio y directo.

#### **Paso 1: Ajuste en el Backend (Simplificar el200) 
    # --- El empleado pertenece a una sucursal ---
    branch: Branch
 Modelo de Usuario Interno)**

Modifiquemos el modelo para reflejar que estamos hablando de empleados. "Suc    password: str = Field(..., min_length=8)

# ... UserDB se mantiene igual ...
ursal" tiene más sentido que "Dirección Principal" para un empleado.

**Acción:** Modifica `/backend/appclass UserDB(UserCreate):
    _id: str
    status: str = "active"
    points: int = 0
    password_hash: str
    created_at: datetime = Field(default/models/user.py`.

```python
# /backend/app/models/user.py
#_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    audit_log (El resto del archivo se mantiene igual)

class UserCreate(BaseModel):
    username: str = Field(: List[AuditLog] = []

# --- SCHEMAS DE RESPUESTA MODIFICADOS PARA USUARIOS INTERNOS ---..., min_length=3, max_length=50, pattern=r"^[a-zA-Z
class UserOut(BaseModel):
    username: str
    name: str
    role: UserRole
    status0-9_]+$")
    # --- CAMBIO: Es el nombre del empleado ---
    name: str = Field: str
    phone: Optional[str]
    branch: Branch
    last_login: Optional[datetime(..., min_length=3, max_length=100, description="Nombre completo del empleado")
] = None

class RoleOut(BaseModel):
    name: str
    description: str

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3,    # --- ELIMINAMOS tax_id de aquí, ya que irá en el modelo de Cliente ---
     max_length=100)
    role: Optional[UserRole] = None
    phone: Optionalrole: UserRole
    phone: str = Field(default="", max_length=20)
    address: str =[str] = Field(None, max_length=20)
    address: Optional[str] = Field(default="", max_length=200, description="Dirección del empleado (opcional)")
     Field(None, max_length=200)
    branch: Optional[Branch] = None
    branch: Branch # La sucursal a la que pertenece el empleado
    password: str = Field(..., min_length=8)

# ... (El resto de los schemas se ajustan automáticamente, pero vamos a refinar Userstatus: Optional[str] = None