# /backend/app/models/shared.py

"""
Utilidades y Tipos de Datos Compartidos para los Modelos Pydantic.

Este archivo centraliza la lógica que es reutilizada a través de diferentes
módulos del proyecto, como el manejo de tipos de datos específicos de MongoDB.
Seguir este patrón (DRY - Don't Repeat Yourself) es crucial para la mantenibilidad.
"""

from pydantic import GetCoreSchemaHandler
from pydantic_core import CoreSchema, core_schema
from bson import ObjectId

class PyObjectId(ObjectId):
    """
    Clase de tipo personalizada para manejar los ObjectId de MongoDB en Pydantic.

    Esta es la ÚNICA definición de PyObjectId en todo el proyecto. Está corregida
    para permitir que Pydantic maneje la serialización de forma flexible, en lugar
    de forzar siempre la conversión a string.
    """
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source: any, handler: GetCoreSchemaHandler
    ) -> CoreSchema:
        """
        Define cómo Pydantic debe validar y manejar este tipo.

        Permite que la entrada sea una instancia de ObjectId o un string válido,
        y deja que Pydantic decida cómo serializarlo según el contexto (JSON o Python).
        """
        return core_schema.union_schema(
            [
                # Permite que el valor ya sea una instancia de ObjectId.
                core_schema.is_instance_schema(ObjectId),
                # Si no, intenta validar un string.
                core_schema.chain_schema(
                    [
                        core_schema.str_schema(),
                        core_schema.no_info_plain_validator_function(cls.validate),
                    ]
                ),
            ]
            # No se define una regla de serialización global aquí. Este es el punto clave.
        )

    @classmethod
    def validate(cls, v: str) -> ObjectId:
        """Valida que el string de entrada sea un ObjectId válido."""
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)