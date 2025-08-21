// /frontend/src/utils/fileUtils.js

/**
 * @file Contiene funciones de utilidad para el manejo de archivos en el cliente.
 */

/**
 * Inicia la descarga de un archivo en el navegador a partir de un Blob.
 *
 * @param {Blob} blob - El contenido del archivo como un objeto Blob.
 * @param {string} filename - El nombre con el que se guardará el archivo.
 */
export const downloadFile = (blob, filename) => {
  // Crea una URL temporal para el Blob
  const url = window.URL.createObjectURL(blob);
  
  // Crea un elemento de enlace <a> invisible
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  
  // Añade el enlace al DOM, simula un clic y luego lo elimina
  document.body.appendChild(link);
  link.click();
  
  // Limpia el DOM y revoca la URL del objeto para liberar memoria
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};