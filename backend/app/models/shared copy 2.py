# /backend/app/models/shared.py

"""
Utilidades y Tipos de Datos Compartidos para los Modelos Pydantic.

Este archivo centraliza la lógica que es reutilizada a través de diferentes
módulos del proyecto, como el manejo de tipos de datos específicos de MongoDB.
Seguir este patrón (DRY - Don't Repeat Yourself) es crucial para la mantenibilidad.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================
from typing import Any
from bson import ObjectId
from pydantic import GetCoreSchemaHandler
from pydantic_core import CoreSchema, core_schema

# ==============================================================================
# SECCIÓN 2: TIPO PERSONALIZADO PARA OBJECTID DE MONGODB
# ==============================================================================

class PyObjectId(ObjectId):
    """
    Clase de tipo personalizada para manejar los ObjectId de MongoDB en Pydantic V2.

    Esta clase proporciona una integración completa, manejando tanto la
    validación de datos de entrada como la serialización para datos de salida.

    - Validación: Acepta un string que sea un ObjectId válido. Si el dato
      de entrada ya es una instancia de ObjectId, se acepta directamente.
    - Serialización: Convierte de forma fiable la instancia de ObjectId a un
      string en cualquier representación de salida (ej. JSON), lo que previene
      errores de serialización en FastAPI para modelos anidados.
    """

    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        source_type: Any,
        handler: GetCoreSchemaHandler,
    ) -> CoreSchema:
        """
        Define el esquema central que Pydantic utiliza para este tipo.
        """
        
        def validate_from_str(value: str) -> ObjectId:
            """Valida que el string de entrada sea un ObjectId válido."""
            if not ObjectId.is_valid(value):
                raise ValueError(f"'{value}' is not a valid ObjectId")
            return ObjectId(value)

        # Define un esquema que acepta una instancia de ObjectId o un string.
        # Si es un string, se aplica la función de validación 'validate_from_str'.
        from_python_schema = core_schema.union_schema(
            [
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(validate_from_str),
                ]),
            ],
        )

        return core_schema.json_or_python_schema(
            # Define cómo validar los datos cuando vienen de Python.
            python_schema=from_python_schema,
            # Define cómo serializar el objeto Python a un tipo JSON compatible (string).
            # Esta es la configuración clave que resuelve el problema globalmente.
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda instance: str(instance)
            ),
        )