# Adapter un sujet au parcours des quatre refuges

Le pilote historique reste la question existante de Débat sur la souffrance.
Le Mode église propose maintenant une salle de préparation pour créer un scénario
avec l’IA à partir de n’importe quel sujet ou d’une question existante de Débat.

## Préparation dans le Mode église

La carte Mode église ouvre `evangelism-pilot.html` sur les paramètres : sujet,
contexte facultatif, difficulté, attitude du personnage, durée visée, public,
langue et valeurs chrétiennes. La génération utilise la connexion Think Bible
existante via `POST /api/ai/church-scenario`, avec les mêmes contrôles d’accès
et de consommation que les autres fonctions IA.

L’IA écrit quatre scènes principales et quatre scènes de reprise, chacune avec
quatre réponses, une réaction du personnage, une explication pédagogique et
une référence biblique. Le compilateur `src/shared/church-scenario.js` valide
ces données et construit les transitions : une réponse constructive accomplit
l’objectif ; les autres mènent à la reprise correspondante. Le modèle ne peut
pas créer de destination manquante ni sauter un objectif.

L’animateur peut relire les scènes et les enseignements avant « Commencer la
partie ». Changer un paramètre invalide l’aperçu et demande une nouvelle
génération. Chaque lancement crée une session distincte. La préparation et la
partie sont sauvegardées localement ; la projection suit la même session sur
le même navigateur et le même ordinateur. Le pilote historique reste accessible
avec `?legacy=1`. Les scénarios générés ne deviennent pas des sujets publiés
dans la bibliothèque.

## Structure commune

Le module `src/shared/discussion-refuges.js` ne connaît ni Marc, ni la souffrance,
ni les noms des scènes du pilote. Il expose :

- `discussionRefuges` : quatre objectifs pédagogiques communs ;
- `refugeProgress(scenario, history)` : objectifs accomplis, prochain refuge,
  fin et suggestion de pause ;
- `refugeNextScene(scenario, entry, history)` : transition selon la réponse,
  sans seuil émotionnel ;
- `validateRefugeScenario(scenario)` : vérification des objectifs et destinations.

Un scénario fournit `completionNode`, `refuges` et `nodes`. Chaque refuge a
un `id` de 1 à 4, un `name`, un `objective` et une scène `entry`.
Chaque scène a un `stage` (son refuge), un titre, un contexte, la question
précise du personnage et quatre `choices` A/B/C/D. Chaque réponse précise
contient `text`, `reaction`, `review`, `quality` et `next`.

Une réponse qui accomplit l’objectif déclare `completesRefuge: stage`. Une
bonne réponse intermédiaire peut améliorer l’échange sans déclarer l’objectif
accompli. La dernière invitation mène au `completionNode` avec
`completesRefuge: 4`. Le moteur vérifie que les objectifs précédents ont été
accomplis ; on ne peut pas sauter directement au sommet.

## Écriture par sujet

1. Choisir la question déjà présente dans Débat, puis le personnage et la situation.
2. Écrire les quatre scènes principales : écouter la question, rejoindre la
   préoccupation, expliquer le contenu de foi concerné, proposer une suite libre.
3. Ajouter des détours qui répondent à des erreurs précises : esquive, jargon,
   culpabilisation, promesse excessive ou pression. Ne pas utiliser une simple
   reformulation de la même question comme seul enrichissement.
4. Écrire pour chaque choix une réaction et une explication pédagogique cohérentes.
   Prévoir au moins une réponse constructive pour sortir de chaque détour.
5. Relier les scènes de réparation à l’objectif du refuge concerné. Le nombre
   de refuges est fixe ; le nombre d’échanges varie selon les réponses.
6. Relire les références bibliques et les arguments propres au sujet avant publication.

L’adaptateur du pilote ajoute actuellement les objectifs aux anciens choix
solides qui passent à un refuge suivant. Un nouveau scénario peut déclarer
`completesRefuge` directement dans ses données.

## Émotions et fin

Les émotions servent à écrire les réactions et à animer la jauge, sans être
une condition de réussite. Un sommet atteint signifie qu’une prochaine étape
est acceptée librement, pas une conversion ni une confiance à 100 %.

Une mauvaise réponse garde le même objectif et peut faire descendre le chemin.
Une réparation adéquate permet de rejoindre le refuge. Trois réponses
partielles ou problématiques consécutives proposent une pause et un débrief,
sans imposer la fin ni bloquer la reprise. La pause est configurable avec
`pauseAfterSetbacks`.

## Compatibilité et vérification

Les sauvegardes du pilote conservent la version des routes déjà jouées pour
ne pas réécrire les échanges. Seules les nouvelles réponses adoptent le nouveau
fonctionnement. Annulation, rechargement et projection utilisent le même historique.

Tester un nouveau scénario avec `validateRefugeScenario`, un parcours direct,
les réparations, une fin avec une confiance encore basse, et une annulation.
Vérifier aussi les textes et les choix sur la projection 16:9. Le test
`tests/discussion-refuges.test.mjs` emploie un second jeu de données minimal
pour vérifier l’indépendance du moteur ; ce n’est pas un autre sujet publié.

## Conversation partagée et votes par équipe

Depuis les réglages, « Create & share team session » crée une session dans
`bible_sessions` avec le type `church-team-competition-v1`. Aucune migration SQL
supplémentaire n’est nécessaire. Le bouton principal ouvre l’animateur de cette
session sur le même site, pour conserver son accès local. Les liens à partager
utilisent `https://logicbible.vercel.app` et ne contiennent aucun secret.

Tous les appareils affichent la conversation d’origine : bulles, narration,
portrait, montagne et quatre cartes A/B/C/D communes. Chaque carte ajoute deux
pastilles avec les nombres de votes de l’équipe bleue et de l’équipe orange.
Un clic invité enregistre immédiatement son vote ; cliquer une autre carte
le modifie. Un invité qui rejoint une question ouverte peut voter tout de suite.
Les équipes sont attribuées aléatoirement à effectifs égaux, sinon à la plus petite.

Les votes ne déclenchent aucune réponse automatiquement. L’animateur sélectionne
la réponse commune, puis la confirme manuellement, même si elle n’a aucun vote.
Le compte à rebours et la réaction gardent le rythme de la conversation locale.
« Continue » publie les paroles suivantes du personnage et la question suivante.
« Back » restaure la question précédente, ses votes et le parcours ; les requêtes
en retard ne peuvent pas entrer dans cette question restaurée. Le panneau latéral,
la carte agrandie et le débrief suivent aussi l’animateur sur les appareils invités.
Le démarrage est autorisé avec zéro invité. La session dure au plus huit échanges,
expire après 24 heures et accueille au maximum 100 invités.

L’API `/api/church/competition` réserve la création aux comptes connectés et les
commandes d’animation à l’organisateur. Le mot de passe choisi permet de gérer
la session depuis un autre appareil. Les accès restent locaux et seuls leurs
condensats sont stockés côté serveur. Le navigateur invité reçoit uniquement
la scène actuelle, les paroles publiées et les explications déjà révélées.

Le rafraîchissement automatique s’effectue environ chaque seconde au premier
plan. Les requêtes expirent après dix secondes et reprennent après une coupure,
un retour sur la page ou une reconnexion. Les révisions conditionnelles en base
préservent les votes concurrents. Une connexion Internet est nécessaire.
Les anciennes invitations gardent leurs participants et leur historique ; leur
parcours bleu devient la conversation commune et les anciens parcours restent
conservés côté serveur.

Les tests couvrent le rendu commun, les compteurs, les votes simultanés, les
permissions, les arrivées tardives, le démarrage sans invité, la confirmation
manuelle, le retour en arrière, le débrief et la reprise de synchronisation.
