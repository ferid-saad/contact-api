# contact-api

API Express de formulaire de contact, sécurisée et testée (TP8, Master DevOps & Cloud, ISET Tozeur).

## Objectif

Rendre une API volontairement fragile robuste : validation des entrées (Zod),
durcissement HTTP (Helmet, limite de taille, rate limiting), tests automatisés
(Vitest, Supertest) et test d'intégration contre PostgreSQL.

## Prérequis

- Node.js 24, npm
- Docker et Docker Compose

## Installation

    npm install
    npm test

## Avancement

- [x] Mise en place du projet
- [x] Partie 1 : tableau OWASP (voir OWASP.md)
- [x] Partie 2 : validation et gestion des erreurs
- [x] Partie 3 : durcissement HTTP
- [ ] Partie 4 : tests de routes
- [ ] Partie 5 : intégration PostgreSQL et migrations

## Captures

Les captures sont dans le dossier `captures/`.
