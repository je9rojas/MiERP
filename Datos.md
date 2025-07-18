
# Inicializar backend
cd mierp/backend
python -m venv venv
.\venv\Scripts\activate

uvicorn src.main:app --reload
uvicorn app.main:app --reload

# Inicializar frontend
cd ../frontend
npm install

npm start

pip freeze > requirements.txt

initadmin_55b97dcd
HsQQH8MUN3vLFcyVTcCeYQ

pip install reportlab==4.2.0 Pillow==10.4.0


# Eliminar node_modules y package-lock.json:
rm -rf node_modules
rm package-lock.json


Muestrame la versión final y profesional del codigo absolutamente completo, corregido, seccionado y optimizado con las mejores prácticas sin ninguna abreviaturas ni comentarios que reemplacen el código y ordénalo en secciones lógicas para máxima claridad y mantenibilidad.


Me centraré exclusivamente en señalarte los cambios necesarios en los dos archivos que me has pasado. usando comentarios y resumenes



Cuando prepares tu archivo CSV para importarlo, la primera columna se llamará operation. En esa columna, para cada fila (cada producto), debes escribir una de estas dos palabras (en minúsculas):
upsert:
Significa "UPdate" (actualizar) o "inSERT" (insertar).
¿Cuándo usarla? Úsala para crear nuevos productos y para modificar productos existentes. Es la operación más común.
¿Cómo funciona? El sistema buscará el producto por su sku.
Si lo encuentra, actualizará solo los campos que tengan un valor en esa fila del CSV.
Si no lo encuentra, creará un producto nuevo con los datos de esa fila.
delete:
Significa "borrar" o, en nuestro caso, "desactivar".
¿Cuándo usarla? Úsala cuando quieras descontinuar un producto y que ya no aparezca en las listas o búsquedas normales.
¿Cómo funciona? El sistema buscará el producto por su sku.
Si lo encuentra, cambiará el campo is_active de true a false (un soft delete). El producto no se borra de la base de datos, solo se oculta.
Para esta operación, solo necesitas rellenar las columnas operation y sku. El resto de columnas de esa fila pueden estar vacías.
En resumen, para tu archivo CSV:
operation	sku	name	... (otros campos)
upsert	PROD-001	Nuevo Producto	... (datos completos)
upsert	PROD-002	Producto Modificado	... (solo los campos a cambiar)
delete	PROD-003	