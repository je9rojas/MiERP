
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


📌 Comandos Rápidos en Terminales Separadas
Terminal 1 (Backend)	Terminal 2 (Frontend)
cd backend && source venv/bin/activate && uvicorn src.main:app --reload	cd frontend && npm start



MONGODB_URI="mongodb+srv://db_admin:dQ6n5znkCVO0ANm6@erp-cluster.fzyhb.mongodb.net/midb?retryWrites=true&w=majority&appName=ERP-cluster"


SUPERADMIN_INITIAL_PASSWORD=Admin123!
python init_superadmin.py

db.users.findOne({role: "superadmin"})

# Eliminar node_modules y package-lock.json:
rm -rf node_modules
rm package-lock.json


sin abreviaturas ni comentarios que reemplacen código