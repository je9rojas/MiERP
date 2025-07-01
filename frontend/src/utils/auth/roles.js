export const checkUserRole = (userRole, allowedRoles) => {
  if (!allowedRoles) return true;
  return allowedRoles.includes(userRole);
};

export const ROLES = {
  ADMIN: 'admin',
  SALES: 'vendedor',
  WAREHOUSE: 'almacenero'
};