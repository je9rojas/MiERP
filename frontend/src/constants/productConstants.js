// /frontend/src/constants/productConstants.js
// Archivo central para todas las constantes relacionadas con productos.

// Categoría Principal del Producto ("Producto")
// Backend: `category`
export const PRODUCT_CATEGORIES = [
    { value: 'filter', label: 'Filtro' },
    { value: 'battery', label: 'Batería' },
    { value: 'oil', label: 'Aceite' },
    { value: 'spare_part', label: 'Repuesto' },
];

// Tipo Específico, principalmente para filtros ("Tipo de producto")
// Backend: `product_type`
export const FILTER_TYPES = [
    { value: 'air', label: 'Aire' },
    { value: 'oil', label: 'Aceite' },
    { value: 'cabin', label: 'Cabina' },
    { value: 'fuel', label: 'Combustible' },
    { value: 'n_a', label: 'No Aplica' },
];

// Forma Física del Producto ("Forma")
// Backend: `shape`
export const PRODUCT_SHAPES = [
    { value: 'panel', label: 'Panel' },
    { value: 'round', label: 'Redondo' },
    { value: 'oval', label: 'Ovalado' },
    { value: 'cartridge', label: 'Elemento' },
    { value: 'spin_on', label: 'Roscado / Sellado' },
    { value: 'in_line_diesel', label: 'Lineal (Motor Diesel)' },
    { value: 'in_line_gasoline', label: 'Lineal (Motor Gasolina)' },
    { value: 'n_a', label: 'No Aplica' },
];