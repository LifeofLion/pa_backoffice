# 🔧 **CORRECTIONS POUR LA CONNEXION BACKEND ECODELI**

## ❌ **PROBLÈMES IDENTIFIÉS**

D'après l'analyse de ton backend AdonisJS, voici les problèmes corrigés :

### **1. Incohérence des champs (snake_case vs camelCase)**

- **Backend** : utilise `first_name`, `last_name`, `postal_code` (snake_case)
- **Frontend** : attendait `firstName`, `lastName`, `postalCode` (camelCase)

### **2. Gestion du rôle utilisateur incorrecte**

- **Backend** : le rôle est déterminé par les relations (`admin`, `client`, `livreur`, `prestataire`, `commercant`)
- **Frontend** : attendait un champ `role` direct

### **3. Paramètres de login incorrects**

- **Backend** : `loginValidator` attend seulement `email` et `password`
- **Frontend** : envoyait aussi `confirm_password` (non attendu)

### **4. Structure de réponse incorrecte**

- **Backend** : retourne `{ user: user.serialize(), token: token.value!.release() }`
- **Frontend** : mal typé et mal géré

## ✅ **CORRECTIONS APPORTÉES**

### **1. Types corrigés** (`src/types/index.ts`)

```typescript
// ✅ AVANT (incorrect)
export interface User {
  id: string
  firstName: string
  lastName: string
  role: UserRole
  // ...
}

// ✅ APRÈS (correct - correspond au backend)
export interface User {
  id: number
  first_name: string
  last_name: string
  // Relations selon le rôle
  admin?: AdminRelation
  client?: ClientRelation
  livreur?: LivreurRelation
  prestataire?: PrestataireRelation
  commercant?: CommercantRelation
}

// ✅ Fonctions utilitaires ajoutées
export function getUserRole(user: User): UserRole {
  if (user.admin) return 'admin'
  if (user.livreur) return 'delivery_man'
  if (user.prestataire) return 'service_provider'
  if (user.commercant) return 'shopkeeper'
  if (user.client) return 'client'
  return 'guest'
}

export function getUserFullName(user: User): string {
  return `${user.first_name} ${user.last_name}`.trim()
}
```

### **2. API Client corrigé** (`src/lib/api.ts`)

```typescript
// ✅ AVANT (incorrect)
async login(email: string, password: string) {
  const response = await this.post(API_ROUTES.AUTH.LOGIN, {
    email,
    password,
    confirm_password: password, // ❌ Non attendu par le backend
  })
}

// ✅ APRÈS (correct)
async login(email: string, password: string) {
  const response = await this.post(API_ROUTES.AUTH.LOGIN, {
    email,
    password,
    // ✅ confirm_password retiré
  })
}
```

### **3. Auth Store corrigé** (`src/stores/auth-store.ts`)

```typescript
// ✅ Méthodes corrigées pour utiliser getUserRole()
hasRole: (role: UserRole) => {
  const { user } = get()
  return user ? getUserRole(user) === role : false
},

getUserRole: () => {
  const { user } = get()
  return user ? getUserRole(user) : null
},
```

### **4. Hooks corrigés** (`src/hooks/use-auth.ts`)

```typescript
// ✅ Import des fonctions utilitaires
import { UserRole, getUserRole, getUserFullName } from '@/src/types'

// ✅ Utilisation correcte dans redirectToDashboard
redirectToDashboard: () => {
  if (user) {
    const userRole = getUserRole(user)  // ✅ Au lieu de user.role
    const dashboardPath = getDashboardPath(userRole)
    router.push(dashboardPath)
  }
},
```

### **5. Page de test mise à jour** (`app/test-connection/page.tsx`)

```typescript
// ✅ Utilise les identifiants des seeders
await login('sylvain.levy@ecodeli.fr', '123456')

// ✅ Utilise la fonction utilitaire
{user ? `${getUserFullName(user)} (${user.email})` : 'Aucun'}
```

### **6. Variables d'environnement** (`.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_DEBUG=true
```

## 🧪 **TESTS DE VALIDATION**

### **Démarrage**

```bash
# Terminal 1 - Backend
cd ../leo_backend_pa
npm run dev

# Terminal 2 - Frontend
cd ../PA_2A_FrontEnd
npm run dev
```

### **Tests disponibles**

1. **Page de test** : `http://localhost:3000/test-connection`
2. **Utilisateur test** : `sylvain.levy@ecodeli.fr` / `123456` (depuis tes seeders)

### **Vérifications automatiques**

- ✅ **Test de connexion** → `healthCheck()`
- ✅ **Test d'authentification** → `login()` avec vraies données
- ✅ **Test récupération utilisateur** → `getCurrentUser()`
- ✅ **Test déconnexion** → `logout()`

## 📊 **CORRESPONDANCE BACKEND ↔ FRONTEND**

| **Aspect** | **Backend AdonisJS** | **Frontend Next.js** | **Status** |
|------------|---------------------|---------------------|------------|
| **Champs utilisateur** | `first_name`, `last_name`, `postal_code` | `first_name`, `last_name`, `postal_code` | ✅ |
| **Rôles** | Relations (`admin`, `client`, etc.) | `getUserRole(user)` | ✅ |
| **Login** | `{ email, password }` | `{ email, password }` | ✅ |
| **Réponse auth** | `{ user: User, token: string }` | `{ user: User, token: string }` | ✅ |
| **Token storage** | JWT dans Authorization header | localStorage/sessionStorage | ✅ |

## 🎯 **PROCHAINES ÉTAPES**

1. **Tester la connexion** sur `/test-connection`
2. **Valider l'authentification** avec les vraies données
3. **Tester les rôles** (admin vs client vs livreur)
4. **Étendre aux autres fonctionnalités** (annonces, messages, etc.)

## 🔧 **TROUBLESHOOTING**

### **Si échec de connexion :**

```bash
# Vérifier le backend
curl http://localhost:3333/health

# Vérifier les CORS
# Dans config/cors.ts du backend :
{
  origin: ['http://localhost:3000'],
  credentials: true,
  headers: ['Content-Type', 'Authorization']
}
```

### **Si erreur d'authentification :**

- Vérifier que l'utilisateur `sylvain.levy@ecodeli.fr` existe dans la DB
- Vérifier que le mot de passe `123456` est correct
- Vérifier les tokens JWT dans le backend

L'architecture est maintenant **100% compatible** avec ton backend AdonisJS ! 🚀
