# Coding 4 Tomorrow NestJS Interview

## ☑️ Instructions

1. Créer une authentication avec JWT
  - Création de compte
  - Login

2. CRUD de films contenant les champs suivants :
  - title (120 caractères max)
  - description (500 caractères max)
  - releaseDate (date dans le passé)
  - rating (1 à 5)
  - genre (enum)
  - actors name (array de string)
  - poster (image url)

3. Gestion d'accès
  - Public : Récupérer la liste des films
  - Privé (auth) : Création / modification / suppression d'un film

### Pré-requis
- Utilisation de MongoDB avec Mongoose
- Tests unitaires pour tous les services
- Tests end to end (in memory database) pour toutes les routes
- Documentation de l'API avec Swagger
- DTO + validation
- Gestion d'erreur
- Typage de toutes les variables avec Typescript
