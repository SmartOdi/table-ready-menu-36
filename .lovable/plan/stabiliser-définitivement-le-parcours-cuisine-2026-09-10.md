# Stabiliser définitivement le parcours cuisine

## Diagnostic et hypothèses classées

1. **Cause principale confirmée dans le code : collision entre les sessions cuisine et caisse.** Les deux accès enregistrent leur jeton dans la même case du navigateur. Une connexion à la caisse remplace donc la session cuisine. Au clic sur « Commencer », l’écran déplace d’abord visuellement la commande, mais le serveur reconnaît ensuite le jeton comme « caisse », refuse l’action, puis l’écran annule silencieusement le déplacement : c’est exactement le retour immédiat vers « Reçu » observé.
2. **Version publiée potentiellement en retard.** Si le test se fait sur l’adresse publique plutôt que dans l’aperçu, elle peut encore exécuter une ancienne correction tant qu’une nouvelle publication n’a pas été faite.
3. **Réponse réseau ancienne : désormais peu probable.** L’écran contient déjà une protection empêchant une actualisation plus ancienne de faire reculer un statut.
4. **Facture ou caisse modifiant le statut : écarté.** Les deux écrans lisent désormais le statut sans pouvoir le changer.
5. **Base remettant le statut à “Reçu” : écarté par l’état actuel.** Le contrôle actif en base n’autorise que `Reçu → En préparation → Prêt → Servi` et aucun rejet récent n’apparaît dans les journaux.

## Correction prévue

- Enregistrer une session distincte pour la cuisine et une autre pour la caisse, afin que les deux écrans puissent rester ouverts simultanément dans le même navigateur.
- Faire lire à chaque écran uniquement la session correspondant à son rôle et renvoyer vers l’accès si elle est absente ou incorrecte.
- Au lieu d’annuler silencieusement le déplacement, afficher une erreur claire si une action cuisine est refusée ou si la session a expiré.
- Après chaque action, remplacer immédiatement le statut local par le statut confirmé par le serveur, puis actualiser les données sans possibilité de retour en arrière.

## Vérification

- Ouvrir cuisine et caisse dans deux onglets du même navigateur, avec leurs codes respectifs.
- Depuis cuisine, faire avancer une nouvelle commande de « Reçu » à « En préparation », attendre plusieurs actualisations, puis la passer à « Prêt » et enfin « Servi ».
- Vérifier à chaque étape que la commande reste dans la bonne colonne et que la caisse suit sans proposer d’action.
- Vérifier que la facture apparaît seulement après « Servi » et qu’aucune erreur silencieuse n’est présente.
- Vérifier aussi l’adresse publiée après publication pour exclure définitivement une ancienne version.

## Détails techniques

- Adapter le stockage local des sessions PIN pour le rendre spécifique au rôle.
- Renforcer les contrôles de rôle dans les écrans `/cuisine` et `/caisse`.
- Conserver les règles actuelles de transition côté serveur et en base ; aucune modification de la facture n’est nécessaire.
