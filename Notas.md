Nota Importante sobre Rendimiento
Para asegurar que las búsquedas de usuarios por username sean instantáneas (que no demoren en cargar), es crucial crear un índice en tu colección users de MongoDB. Puedes hacerlo una vez desde el shell de MongoDB o desde la interfaz de MongoDB Atlas.
Comando para crear el índice:
db.users.createIndex({ "username": 1 }, { unique: true })
Esto le dice a la base de datos que mantenga una lista ordenada de todos los nombres de usuario, haciendo que encontrarlos sea extremadamente rápido y asegurando que no haya duplicados.


# --- MODIFICACIÓN: Incluir los nuevos routers ---
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"]) # Ajustado prefijo
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(users.router, prefix="/api/users", tags=["Users Management"])
app.include_router(roles.router, prefix="/api/roles", tags=["Roles Management"])
