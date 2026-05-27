# Mur LSDJ — Une infinité d'histoires

Plateforme participative pour les 30 ans du Silence des Justes.

## Démarrage rapide

### 1. Base de données

Ouvre pgAdmin ou un terminal PowerShell et crée la base :

```sql
CREATE DATABASE mur_lsdj;
```

### 2. Backend

```bash
cd backend

# Copier et remplir le .env
copy .env.example .env
# Modifier DATABASE_URL avec ton mot de passe PostgreSQL

# Installer les dépendances Python
pip install -r requirements.txt

# Générer et appliquer la migration
alembic revision --autogenerate -m "initial"
alembic upgrade head

# Initialiser les tokens (contribution + admin)
python seed.py

# Lancer le serveur
uvicorn app.main:app --reload
```

Le backend tourne sur http://localhost:8000  
La doc API est sur http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm run dev
```

Le frontend tourne sur http://localhost:5173

### 4. Utiliser l'app

Le script `seed.py` affiche les deux liens à utiliser :

```
🔗 Lien contribution : http://localhost:5173/contribuer?token=xxxxxxxx-...
🔐 Lien admin        : http://localhost:5173/admin?secret=xxxxxxxx-...
```

## Cloudinary

Une fois ton compte créé sur cloudinary.com, remplis dans `backend/.env` :
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Structure

```
mur-LSDJ/
├── backend/          FastAPI + PostgreSQL + Cloudinary
└── frontend/         React + Vite + TypeScript + Tailwind
```
