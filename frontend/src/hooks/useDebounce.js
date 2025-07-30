// /frontend/src/hooks/useDebounce.js

/**
 * @file Hook de React personalizado para 'debouncing'.
 *
 * El 'debouncing' es una técnica de optimización del rendimiento que retrasa la
 * ejecución de una función hasta que ha pasado un cierto tiempo sin que se haya
 * invocado de nuevo. Este hook es ideal para escenarios como campos de búsqueda,
 * donde se quiere evitar realizar una llamada a la API en cada pulsación de tecla,
 * esperando en su lugar a que el usuario termine de escribir.
 */

// --- SECCIÓN 1: IMPORTACIONES ---

import { useState, useEffect } from 'react';


// --- SECCIÓN 2: DEFINICIÓN DEL HOOK ---

/**
 * Retrasa la actualización de un valor hasta que ha transcurrido un 'delay'
 * especificado sin que el valor original haya cambiado.
 *
 * @template T - El tipo de dato del valor que se está 'debouncing'.
 * @param {T} value - El valor que se desea 'debouncear' (ej. el texto de un input).
 * @param {number} delay - El tiempo en milisegundos que se debe esperar antes de actualizar el valor.
 * @returns {T} - El valor 'debounced', que solo se actualizará una vez transcurrido el 'delay'.
 */
const useDebounce = (value, delay) => {

  // --- 2.1: ESTADO INTERNO ---

  // 'debouncedValue' es el estado que almacena el valor final después del retraso.
  const [debouncedValue, setDebouncedValue] = useState(value);


  // --- 2.2: EFECTO DE SINCRONIZACIÓN ---

  useEffect(() => {
    // Se configura un temporizador (timer) que se ejecutará después del 'delay'.
    const handler = setTimeout(() => {
      // Una vez que el temporizador se completa, se actualiza el estado 'debouncedValue'
      // con el último valor recibido.
      setDebouncedValue(value);
    }, delay);

    // Función de limpieza del efecto:
    // Esta función se ejecuta cada vez que el 'value' o el 'delay' cambian, o cuando
    // el componente se desmonta. Su propósito es cancelar el temporizador anterior
    // antes de configurar uno nuevo. Esto es lo que logra el 'debouncing'.
    return () => {
      clearTimeout(handler);
    };
  },
  // El efecto se volverá a ejecutar solo si el 'value' original o el 'delay' cambian.
  [value, delay]);


  // --- 2.3: VALOR DE RETORNO ---

  // El hook devuelve el 'debouncedValue', que los componentes pueden usar de forma segura.
  return debouncedValue;
};

export default useDebounce;