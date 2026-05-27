# Feed TikTok — Mur LSDJ

**Date:** 2026-05-27
**Scope:** Remplacement de la page d'accueil par un feed TikTok avec likes, commentaires, partage et mode kiosque.

---

## 1. Vue d'ensemble

La page `/` est entièrement remplacée par un feed plein écran à défilement vertical magnétique (snap scroll). Chaque souvenir approuvé occupe 100% de la hauteur du viewport. L'ancien `Home.tsx` est supprimé.

---

## 2. Structure d'une slide

**Fond :** média plein écran
- Photo → `object-fit: cover`, fond noir
- Vidéo → lecture automatique, muette, en boucle, `object-fit: cover`
- Témoignage texte → fond dégradé bleu/encre, texte centré

**Overlay bas-gauche :** auteur + légende + date (gradient noir transparent → bas)

**Overlay bas-droit :** colonne de 3 boutons (❤️ likes / 💬 commentaires / ↗️ partage)

**Header fixe :** logo LSDJ discret + liens Galerie, Timeline, Histoire — disparaît en mode kiosque

---

## 3. Chargement des données

- Source : `GET /api/media/public?page=N&per_page=10`
- Chargement initial : 10 slides
- Infinite scroll : charge la page suivante quand il reste 3 slides
- Deep link : `/?media=<uuid>` → le feed s'ouvre directement sur ce souvenir

---

## 4. Like ❤️

**Frontend**
- Cœur animé au tap (scale up + burst de particules)
- État stocké dans `localStorage` clé `lsdj_liked_<media_id>` (booléen)
- Une seule fois par appareil — si déjà liké, le cœur reste rouge et désactivé
- Compteur affiché sous le bouton

**Backend**
- Nouveau champ `likes: Integer, default=0` sur le modèle `Media`
- Nouvelle route : `POST /api/media/{id}/like`
  - Incrémente `likes` de 1
  - Pas d'auth requise
  - Rate limit : 3 likes/minute par IP (anti-spam)
  - Retourne `{ likes: N }`
- `GET /api/media/public` retourne le champ `likes` dans chaque item

---

## 5. Commentaires 💬

- Tap → panneau slide-up depuis le bas (hauteur 70vh), fond blanc
- Contenu : liste des commentaires approuvés (auteur + contenu + date)
- Formulaire en bas : champ auteur + champ message + bouton envoyer
- Soumission via `POST /api/comments/{media_id}` (existant, modération admin)
- Compteur sous le bouton = nombre de commentaires approuvés
- Fermeture : tap sur l'overlay ou swipe down

---

## 6. Partage ↗️

- Tap → modale centrée avec 4 boutons :
  - **WhatsApp** → `https://wa.me/?text=<url+légende>`
  - **SMS** → `sms:?body=<url>`
  - **Facebook** → `https://www.facebook.com/sharer/sharer.php?u=<url>`
  - **Autres** → `navigator.share({ url, title })` (ouvre le menu natif iOS/Android)
- URL partagée : `https://[domaine]/?media=<id>`

---

## 7. Mode kiosque

**Activation :** bouton icône plein écran (coin haut-droit), disponible uniquement hors mode kiosque

**Comportement :**
- Fullscreen API (`document.documentElement.requestFullscreen()`)
- Défilement automatique toutes les **3 secondes**
- **Rien n'est visible** : pas de header, pas de boutons, pas de légende, pas d'auteur — uniquement le média brut plein écran
- Désactivation : tap, touche clavier, ou sortie fullscreen (Esc)

---

## 8. Fichiers à créer / modifier

**Backend**
- `backend/app/models/media.py` — ajouter champ `likes`
- `backend/app/routers/media.py` — ajouter route `POST /{id}/like` avec rate limit
- `backend/app/routers/media.py` — inclure `likes` dans `_serialize()`

**Frontend**
- `frontend/src/pages/Home.tsx` → remplacé par `frontend/src/pages/Feed.tsx`
- `frontend/src/components/FeedSlide.tsx` — composant d'une slide
- `frontend/src/components/ShareModal.tsx` — modale de partage
- `frontend/src/components/CommentsPanel.tsx` — panneau commentaires (extrait de Lightbox.tsx existant)
- `frontend/src/lib/api.ts` — ajouter `likeMedia(id)`
- `frontend/src/App.tsx` — remplacer la route `/` vers Feed

---

## 9. Hors scope

- Système de compte utilisateur
- Likes persistés côté serveur par utilisateur
- Stories / contenu éphémère
- Algorithme de recommandation
- Modification de la galerie, timeline, ou admin
