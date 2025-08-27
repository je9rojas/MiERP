# /backend/app/core/services/document_numbering_service.py

"""
Servicio Centralizado para la Generación de Números de Documento Secuenciales.

Este módulo proporciona una utilidad reutilizable para generar números de secuencia
para diferentes tipos de documentos (ej. OC-2025-00001, RM-2025-00001).
Centralizar esta lógica asegura un formato consistente en todo el ERP y previene
la duplicación de código, adhiriéndose al principio DRY.

La lógica está diseñada para ser genérica:
- Reinicia la secuencia cada nuevo año.
- Maneja correctamente el caso inicial donde no existen documentos previos.
- Es resistente a errores de formato en números de secuencia antiguos.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

import logging
from datetime import datetime, timezone
from typing import Any

from pymongo import DESCENDING

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================

logger = logging.getLogger(__name__)


# ==============================================================================
# SECCIÓN 3: FUNCIÓN PRINCIPAL DEL SERVICIO
# ==============================================================================

async def generate_sequential_number(
    repository: Any,
    prefix: str,
    field_name: str
) -> str:
    """
    Genera un número de documento secuencial y anual.

    Formato: [PREFIJO]-[AÑO]-[SECUENCIA DE 5 DÍGITOS]

    Args:
        repository: La instancia del repositorio para el tipo de documento.
                    Debe tener un método `find_one_sorted`.
        prefix: El prefijo del documento (ej. "OC", "RM", "FC").
        field_name: El nombre del campo en el documento que almacena el número
                    (ej. "order_number", "receipt_number").

    Returns:
        Un string con el nuevo número de documento secuencial.
    """
    current_year = datetime.now(timezone.utc).year
    
    # Busca el último documento creado para obtener la secuencia más reciente.
    # Se asume que los documentos tienen un campo 'created_at' para ordenamiento.
    last_document = await repository.find_one_sorted([(field_name, DESCENDING)])
    
    new_sequence_number = 1

    if last_document and (last_doc_num := last_document.get(field_name)):
        try:
            parts = last_doc_num.split('-')
            # Si el último documento es del mismo año, incrementa la secuencia.
            # Si es de un año anterior, la secuencia se reinicia a 1.
            if len(parts) == 3 and int(parts[1]) == current_year:
                new_sequence_number = int(parts[2]) + 1
        except (ValueError, IndexError):
            # Si el formato del último número es inesperado, se registra una advertencia
            # y se inicia una nueva secuencia de forma segura.
            logger.warning(
                f"No se pudo parsear el número de secuencia '{last_doc_num}'. "
                f"Se reiniciará la secuencia para el prefijo '{prefix}'."
            )
            
    # Formatea el número final con ceros a la izquierda para mantener la longitud.
    return f"{prefix}-{current_year}-{str(new_sequence_number).zfill(5)}"