# 🔗 **GUIDE DE CONNEXION BACKEND ECODELI**

## 📋 **ÉTAPES DE CONFIGURATION**

### **1. Configuration des variables d'environnement**

Créez un fichier `.env.local` à la racine du projet :

```bash
# =============================================================================
# CONFIGURATION BACKEND API - ECODELI
# =============================================================================

# URL du backend AdonisJS (modifiez selon votre configuration)
NEXT_PUBLIC_API_URL=http://localhost:3333

# Configuration Stripe (si nécessaire pour les paiements)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here

# Mode de débogage
NEXT_PUBLIC_DEBUG=true

# Délai d'expiration des requêtes API (en millisecondes)
NEXT_PUBLIC_API_TIMEOUT=10000
```

### **2. Architecture des API Routes**

Notre système utilise des **routes centralisées** qui mappent parfaitement votre backend AdonisJS :

```typescript
// ✅ Exemple d'utilisation des routes centralisées
import { apiClient } from '@/src/lib/api'

// Authentification
await apiClient.login('user@example.com', 'password')      // POST /auth/login
await apiClient.getCurrentUser()                           // GET /auth/me
await apiClient.logout()                                   // POST /auth/logout

// Annonces
await apiClient.getAnnouncements()                         // GET /annonces/
await apiClient.createAnnouncement(data)                   // POST /annonces/create
await apiClient.getAnnouncement('123')                     // GET /annonces/123

// Messages
await apiClient.getConversations()                         // GET /messages/conversations
await apiClient.sendMessage(messageData)                   // POST /messages/

// Réclamations
await apiClient.getComplaints()                            // GET /complaints/
await apiClient.createComplaint(complaintData)             // POST /complaints/
```

### **3. Gestion des erreurs**

Le système gère automatiquement les erreurs avec des utilitaires :

```typescript
import { apiClient, getErrorMessage, isAuthError } from '@/src/lib/api'

try {
  const user = await apiClient.getCurrentUser()
} catch (error) {
  if (isAuthError(error)) {
    // Rediriger vers login
    router.push('/login')
  } else {
    // Afficher le message d'erreur
    toast.error(getErrorMessage(error))
  }
}
```

### **4. Hooks personnalisés**

Utilisez les hooks pour gérer l'authentification :

```typescript
import { useAuth } from '@/src/hooks/use-auth'

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth()
  
  if (isLoading) return <div>Chargement...</div>
  if (!user) return <div>Non connecté</div>
  
  return <div>Bienvenue {user.name}</div>
}
```

## 🧪 **TESTS DE CONNEXION**

### **1. Test de base**

Créez une page de test pour vérifier la connexion :

```typescript
// pages/test-connection.tsx
import { useState } from 'react'
import { apiClient } from '@/src/lib/api'

export default function TestConnection() {
  const [status, setStatus] = useState<string>('Non testé')
  
  const testConnection = async () => {
    try {
      setStatus('Test en cours...')
      const health = await apiClient.healthCheck()
      setStatus(health ? '✅ Connexion OK' : '❌ Connexion échouée')
    } catch (error) {
      setStatus(`❌ Erreur: ${error.message}`)
    }
  }
  
  return (
    <div className="p-8">
      <h1>Test de connexion Backend</h1>
      <button onClick={testConnection}>Tester la connexion</button>
      <p>Status: {status}</p>
    </div>
  )
}
```

### **2. Test d'authentification**

```typescript
const testAuth = async () => {
  try {
    // Test d'authentification
    const response = await apiClient.login('test@example.com', 'password')
    console.log('✅ Login successful:', response.user)
    
    // Test récupération utilisateur
    const user = await apiClient.getCurrentUser()
    console.log('✅ Current user:', user)
    
  } catch (error) {
    console.error('❌ Auth error:', error)
  }
}
```

## 🚀 **PROCHAINES ÉTAPES**

### **1. Configuration du Backend**

Assurez-vous que votre backend AdonisJS :
- ✅ Fonctionne sur `http://localhost:3333`
- ✅ Accepte les requêtes CORS depuis le frontend
- ✅ Utilise les bonnes routes (voir fichier `api-routes.ts`)

### **2. Test des composants refactorisés**

Testez les composants avec la vraie API :

```bash
# Démarrer le backend
cd ../leo_backend_pa
npm run dev

# Démarrer le frontend
cd ../PA_2A_FrontEnd
npm run dev
```

### **3. Configuration CORS**

Ajoutez dans votre backend AdonisJS (`config/cors.ts`) :

```typescript
{
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  headers: ['Content-Type', 'Authorization']
}
```

## 🎯 **MAPPING BACKEND → FRONTEND**

| **Fonctionnalité** | **Route Backend** | **Composant Frontend** |
|-------------------|------------------|----------------------|
| Connexion | `POST /auth/login` | `src/components/refactored/auth/login.tsx` |
| Dashboard Client | `GET /clients/:id` | `src/components/refactored/app-client.tsx` |
| Annonces | `GET /annonces/` | `app/app_client/announcements/page.tsx` |
| Messages | `GET /messages/conversations` | `app/app_client/messages/page.tsx` |
| Réclamations | `GET /complaints/` | `src/components/refactored/complaint-client.tsx` |
| Tracking | `GET /colis/:tracking` | `app/app_client/tracking/[id]/page.tsx` |

## 🔧 **RÉSOLUTION DE PROBLÈMES**

### **Erreur CORS**
```bash
# Dans le backend, vérifiez config/cors.ts
origin: ['http://localhost:3000']
```

### **Erreur 404**
```bash
# Vérifiez que les routes correspondent à api-routes.ts
GET /auth/me → AuthController.me()
POST /auth/login → AuthController.login()
```

### **Token d'authentification**
```typescript
// Le token est automatiquement géré par apiClient
localStorage.getItem('authToken') // Vérifier la présence
``` 