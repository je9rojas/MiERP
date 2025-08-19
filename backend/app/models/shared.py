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
from pydantic import GetCoreSchemaHandler
from pydantic_core import CoreSchema, core_schema
from bson import ObjectId
from typing import Any

# ==============================================================================
# SECCIÓN 2: TIPO PERSONALIZADO PARA OBJECTID DE MONGODB
# ==============================================================================

class PyObjectId(ObjectId):
    """
    Clase de tipo personalizada para manejar los ObjectId de MongoDB en Pydantic.

    Esta clase proporciona una integración completa con Pydantic V2, manejando
    tanto la validación (entrada) como la serialización (salida).

    - Validación: Acepta un string que sea un ObjectId válido o una instancia
      existente de ObjectId.
    - Serialización: Convierte la instancia de ObjectId a un string cuando se
      genera una respuesta JSON, resolviendo el `PydanticSerializationError`.
    """
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> CoreSchema:
        """
        Define el esquema central para que Pydantic entienda este tipo.

        Se utiliza `json_or_python_schema` para separar la lógica de validación
        de la lógica de serialización, lo cual es una práctica recomendada.
        """
        
        # Esquema para la validación (cómo se procesan los datos de entrada)
        validation_schema = core_schema.union_schema(
            [
                # Permite que el valor de entrada ya sea una instancia de ObjectId.
                core_schema.is_instance_schema(ObjectId),
                # Si es un string, se aplica una cadena de validación.
                core_schema.chain_schema(
                    [
                        core_schema.str_schema(),
                        core_schema.no_info_plain_validator_function(cls.validate),
                    ]
                ),
            ],
            # Se añade un serializador específico para Python si es necesario
            # que devuelva un string en lugar de un ObjectId.
            serialization=core_schema.plain_serializer_function_ser_schema(lambda v: str(v)),
        )

        return core_schema.json_or_python_schema(
            # Para la validación, usamos el esquema definido arriba.
            python_schema=validation_schema,
            # Para la serialización a JSON, se convierte el ObjectId a string.
            # Esta es la corrección clave para el error de serialización.
            json_schema=core_schema.str_schema(),
            # Define cómo serializar el objeto Python a un tipo JSON compatible.
            serialization=core_schema.plain_serializer_function_ser_schema(lambda v: str(v))
        )

    @classmethod
    def validate(cls, v: str) -> ObjectId:
        """Valida que el string de entrada sea un ObjectId válido."""
        if not ObjectId.is_valid(v):
            raise ValueError(f"'{v}' is not a valid ObjectId")
        return ObjectId(v)