# /backend/app/models/shared.py
# Utilidades compartidas para los modelos Pydantic con MongoDB

from pydantic import GetCoreSchemaHandler
from pydantic_core import CoreSchema, core_schema
from bson import ObjectId

class PyObjectId(ObjectId):
    """Clase personalizada para manejar los ObjectId de MongoDB en Pydantic."""
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: any, handler: GetCoreSchemaHandler) -> CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)