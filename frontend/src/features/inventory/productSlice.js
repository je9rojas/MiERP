import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getProductsAPI } from '../../api/productsAPI';

// 1. Definimos la acción asíncrona (Thunk) para obtener los productos.
// Esto manejará la llamada a la API y los estados de pending/fulfilled/rejected.
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getProductsAPI(params);
      // Aplanamos los datos aquí, en la lógica de datos, no en el componente.
      const flattenedProducts = response.items.map(p => ({ ...p, ...(p.specifications || {}) }));
      return { items: flattenedProducts, total: response.total };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error al cargar productos');
    }
  }
);

// 2. Definimos el estado inicial para este "slice".
const initialState = {
  items: [],
  rowCount: 0,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// 3. Creamos el slice, que contiene el reducer y las acciones.
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {}, // Aquí irían acciones síncronas si las tuviéramos
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.rowCount = action.payload.total;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default productSlice.reducer;