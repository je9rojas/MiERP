# base_repository.py
class BaseRepository:
    def __init__(self, db, collection_name: str):
        self.collection = db[collection_name]

    async def find_one_by_id(self, id: str):
        return await self.collection.find_one({"_id": ObjectId(id)})

    async def insert_one(self, doc: dict):
        return await self.collection.insert_one(doc)
    # ... otros métodos genéricos