# Analyse OWASP API Security Top 10 (2023)

| Risque OWASP | Concerne notre API ? | Mesure dans ce TP |
|---|---|---|
| API1 Broken Object Level Authorization | Non : aucune ressource lue par identifiant, la seule route est un `POST` de création | Aucune nécessaire ici |
| API2 Broken Authentication | Non traité : le formulaire de contact est public par conception | Hors périmètre ; le rate limiting réduit les abus |
| API3 Broken Object Property Level Authorization | **Oui** : `req.body` est transmis tel quel au repository (mass assignment) | `.strict()` refuse les champs en trop |
| API4 Unrestricted Resource Consumption | **Oui** : pas de limite de débit, pas de limite explicite du corps | rate limiting, `express.json({ limit: "10kb" })` |
| API5 Broken Function Level Authorization | Non : pas de rôles ni de routes d'administration | Aucune |
| API6 Unrestricted Access to Sensitive Business Flows | Partiellement : le formulaire peut être spammé en masse | rate limiting sur `/api/contact` |
| API7 Server Side Request Forgery | Non : l'API ne fait aucune requête sortante | Aucune |
| API8 Security Misconfiguration | **Oui** : stack trace renvoyée, `x-powered-by` exposé, pas de Helmet | Helmet, `INTERNAL_ERROR` sans détail, `x-powered-by` désactivé |
| API9 Improper Inventory Management | Faible : un seul endpoint métier, pas de versions | Aucune |
| API10 Unsafe Consumption of APIs | Non : aucune API tierce consommée | Aucune |

## Trois attaques que la version de départ laisse passer

1. **Fuite d'informations** : une erreur provoque une réponse 500 contenant `err.message` et `err.stack` (chemins de fichiers, détails SQL). Cause : `errorHandler.js` (API8).
2. **Entrées non validées et mass assignment** : n'importe quel contenu est accepté (email invalide, types inattendus, champs en trop), car `validate` laisse tout passer et `req.body` va directement au repository (API3).
3. **Rafales de requêtes** : aucune limitation de débit ni de taille choisie pour le corps, donc spam ou saturation possibles (API4, API6).
