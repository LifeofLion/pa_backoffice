'use client'

import React, { useState, useEffect } from 'react'
import { apiClient } from '@/src/lib/api'
import { API_ROUTES } from '@/src/lib/api-routes'
import { User, UserRole } from '@/src/types'
import { AdminUserCreationRequest } from '@/src/types/validators'

/**
 * Gestion des utilisateurs pour l'admin  
 * Utilise l'API centralisée et les types stricts du projet
 */
export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Formulaire de création d'utilisateur
  const [newUser, setNewUser] = useState<AdminUserCreationRequest>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    city: '',
    postalCode: '',
    country: 'France',
    roles: [],
    privileges: 'basic'
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAllUsers()
      setUsers(response)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Créer un nouvel utilisateur via l'API admin
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Utiliser l'endpoint admin pour créer un utilisateur avec des rôles
      await apiClient.post(API_ROUTES.ADMIN.CREATE_USER, newUser)
      await loadUsers()
      setShowCreateForm(false)
      // Reset form
      setNewUser({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        city: '',
        postalCode: '',
        country: 'France',
        roles: [],
        privileges: 'basic'
      })
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error)
    }
  }

  // Changer le statut d'un utilisateur (actif/inactif)
  const toggleUserStatus = async (userId: number) => {
    try {
      await apiClient.put(API_ROUTES.ADMIN.TOGGLE_USER_STATUS(userId.toString()), {})
      await loadUsers()
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error)
    }
  }

  // Obtenir le rôle principal d'un utilisateur
  const getUserMainRole = (user: User): string => {
    if (user.admin) return 'admin'
    if (user.client) return 'client'
    if (user.livreur) return 'livreur'
    if (user.prestataire) return 'prestataire'
    if (user.commercant) return 'commercant'
    return 'guest'
  }

  // Filtrer les utilisateurs par rôle
  const filteredUsers = users.filter(user => {
    if (roleFilter === 'all') return true
    return getUserMainRole(user) === roleFilter
  })

  // Badge de statut utilisateur
  const getStatusBadge = (state: string) => {
    const styles = {
      open: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800',
      banned: 'bg-gray-100 text-gray-800'
    }
    return styles[state as keyof typeof styles] || styles.open
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion des Utilisateurs
        </h1>
        <div className="flex space-x-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="client">Clients</option>
            <option value="livreur">Livreurs</option>
            <option value="prestataire">Prestataires</option>
            <option value="commercant">Commerçants</option>
          </select>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Créer un utilisateur
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Utilisateurs</h3>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Clients</h3>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.client).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Livreurs</h3>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.livreur).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Prestataires</h3>
          <p className="text-2xl font-bold text-orange-600">
            {users.filter(u => u.prestataire).length}
          </p>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">
                        ID: {user.id} | Créé le: {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getUserMainRole(user)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.state)}`}>
                      {user.state}
                    </span>
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`px-3 py-1 text-xs rounded ${
                        user.state === 'open' 
                          ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {user.state === 'open' ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal de création d'utilisateur */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 shadow-lg rounded-md bg-white">
            <form onSubmit={createUser}>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Créer un nouvel utilisateur
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <input
                    type="text"
                    required
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input
                    type="text"
                    required
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ville</label>
                  <input
                    type="text"
                    required
                    value={newUser.city}
                    onChange={(e) => setNewUser({...newUser, city: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code postal</label>
                  <input
                    type="text"
                    required
                    value={newUser.postalCode}
                    onChange={(e) => setNewUser({...newUser, postalCode: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Rôles</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {['livreur', 'commercant', 'prestataire', 'administrateur'].map(role => (
                    <label key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newUser.roles?.includes(role as any) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUser({
                              ...newUser, 
                              roles: [...(newUser.roles || []), role as any]
                            })
                          } else {
                            setNewUser({
                              ...newUser,
                              roles: newUser.roles?.filter(r => r !== role) || []
                            })
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Créer l'utilisateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 