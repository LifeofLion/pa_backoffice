# Nouvelle fonctionnalité : Démarrer des conversations

## Vue d'ensemble

Ajout de la fonctionnalité permettant aux utilisateurs de démarrer de nouvelles conversations avec d'autres utilisateurs selon leur rôle.

## Fonctionnalités ajoutées

### 1. Bouton "Nouvelle conversation"
- **Emplacement** : En haut de la liste des conversations
- **Action** : Ouvre le sélecteur d'utilisateur
- **Fallback** : Boutons dans les états vides (pas de conversations/pas de sélection)

### 2. Sélecteur d'utilisateur (UserSelector)
- **Type** : Modal overlay avec liste scrollable
- **Fonctionnalités** :
  - Recherche en temps réel par nom/rôle
  - Filtrage automatique selon les permissions du rôle
  - Affichage des avatars et rôles
  - État de chargement avec spinner
  - Gestion des états vides

### 3. Permissions par rôle

#### Client
- Peut parler aux : **Livreurs** et **Prestataires de service**
- Filtres disponibles : Tous, Livraison, Service

#### Livreur  
- Peut parler aux : **Clients** et **Commerçants**
- Filtres disponibles : Tous

#### Prestataire de service
- Peut parler aux : **Clients**
- Filtres disponibles : Tous

#### Commerçant
- Peut parler aux : **Clients** et **Livreurs**
- Filtres disponibles : Tous, Livraison, Client

## Implémentation technique

### Hook useMessaging - Nouvelles fonctions
```typescript
// État
const [availableUsers, setAvailableUsers] = useState<User[]>([])
const [isLoadingUsers, setIsLoadingUsers] = useState(false)

// Fonctions
loadAvailableUsers() // Charge la liste des utilisateurs depuis l'API
startConversation(recipientId, recipientUser) // Démarre une nouvelle conversation
```

### Composant UserSelector
```typescript
interface UserSelectorProps {
  isOpen: boolean
  onClose: () => void
  availableUsers: User[]
  isLoading: boolean
  onSelectUser: (userId: number, user: User) => void
  onLoadUsers: () => void
  userConfig: { canMessageRoles: string[] }
}
```

### API utilisée
- **Route** : `/messages/available-users`
- **Méthode** : GET
- **Retour** : `{ data: User[] }`

## Flux utilisateur

1. **Clic sur "Nouvelle conversation"**
   → Ouvre le sélecteur d'utilisateur
   
2. **Chargement automatique**
   → Récupère les utilisateurs disponibles via API
   → Filtre selon les permissions du rôle
   
3. **Recherche/Sélection**
   → L'utilisateur peut rechercher par nom
   → Clic sur un utilisateur pour le sélectionner
   
4. **Création de conversation**
   → Vérifie si la conversation existe déjà
   → Si oui : redirige vers la conversation existante
   → Si non : crée une nouvelle conversation vide
   → Sélectionne automatiquement la conversation

## États gérés

### États de chargement
- `isLoadingUsers` : Spinner pendant le chargement des utilisateurs
- Boutons désactivés pendant les opérations

### États vides
- **Aucun utilisateur disponible** : Message informatif avec rôles autorisés
- **Aucun résultat de recherche** : Message "Aucun utilisateur trouvé"
- **Première conversation** : Bouton d'appel à l'action

### Gestion d'erreurs
- Erreurs API loggées dans la console
- Fallback gracieux vers tableau vide
- Messages utilisateur informatifs

## Interface utilisateur

### Design
- **Modal** : Centré avec overlay sombre
- **Header** : Titre avec icône et bouton fermer
- **Search** : Barre de recherche avec icône
- **Liste** : Cards utilisateur avec avatar, nom, rôle
- **Footer** : Texte d'aide utilisateur

### Responsive
- **Mobile** : Modal pleine largeur avec padding
- **Desktop** : Modal fixe max-width-md
- **Scroll** : Liste des utilisateurs scrollable

### Accessibilité
- Focus management
- Keyboard navigation (Escape pour fermer)
- Alt text sur les images
- Roles ARIA appropriés

## Traductions ajoutées

```json
{
  "messages": {
    "conversations": "Conversations",
    "newConversation": "Nouvelle conversation", 
    "startFirstConversation": "Démarrer une conversation",
    "searchUsers": "Rechercher des utilisateurs...",
    "noUsersFound": "Aucun utilisateur trouvé",
    "noAvailableUsers": "Aucun utilisateur disponible",
    "canMessageRoles": "Vous pouvez envoyer des messages à",
    "selectUserToStart": "Sélectionnez un utilisateur pour démarrer une conversation"
  }
}
```

## Tests recommandés

### Tests fonctionnels
1. **Démarrage de conversation** avec chaque type de rôle
2. **Recherche d'utilisateurs** par nom et rôle  
3. **Gestion des conversations existantes** (redirection)
4. **États vides** et messages d'erreur
5. **Responsive** sur mobile/desktop

### Tests d'intégration
1. **API calls** - Chargement des utilisateurs disponibles
2. **WebSocket** - Nouveau message dans conversation créée
3. **Permissions** - Filtrage correct selon le rôle
4. **Navigation** - Ouverture/fermeture modal

## Améliorations futures

1. **Cache utilisateurs** - Éviter de recharger à chaque ouverture
2. **Photos de profil** - Intégration avatars réels
3. **Statut en ligne** - Indicateur temps réel dans le sélecteur
4. **Groupes** - Support conversations de groupe
5. **Suggestions** - Utilisateurs recommandés selon l'historique 