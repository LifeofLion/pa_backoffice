"use client"

import { useState, useEffect } from 'react'
import { Star, User, MessageSquare, Clock, Award, TrendingUp } from 'lucide-react'
import { apiClient } from '@/src/lib/api'

// =============================================================================
// TYPES
// =============================================================================

interface Rating {
  id: number
  overall_rating: number
  punctuality_rating?: number
  quality_rating?: number
  communication_rating?: number
  comment?: string
  created_at: string
  reviewer: {
    id: number
    first_name: string
    last_name: string
  }
  rating_type: 'delivery' | 'service'
  rating_for_id: number
}

interface RatingStats {
  average_overall_rating: number
  average_punctuality_rating: number
  average_quality_rating: number
  average_communication_rating: number
  total_ratings: number
  rating_distribution: Record<string, number>
}

// =============================================================================
// COMPOSANT ÉTOILES POUR AFFICHAGE
// =============================================================================

interface StarDisplayProps {
  rating: number
  maxStars?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

function StarDisplay({ rating, maxStars = 5, size = 'md', showValue = false }: StarDisplayProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {[...Array(maxStars)].map((_, index) => (
          <Star
            key={index}
            className={`${sizeClasses[size]} ${
              index < Math.floor(rating)
                ? "text-yellow-400 fill-yellow-400"
                : index < rating
                ? "text-yellow-400 fill-yellow-200"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}/5
        </span>
      )}
    </div>
  )
}

// =============================================================================
// COMPOSANT STATISTIQUES DE RATING
// =============================================================================

interface RatingStatsProps {
  userId: string
  userType: 'livreur' | 'prestataire'
}

export function RatingStatsDisplay({ userId, userType }: RatingStatsProps) {
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [userId])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getRatingStats(userId)
      if (response.success) {
        setStats(response.stats)
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats || stats.total_ratings === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">
          Aucune évaluation pour le moment
        </p>
        <p className="text-gray-500 text-xs">
          Les évaluations apparaîtront après les premières {userType === 'livreur' ? 'livraisons' : 'prestations'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">
          📊 Évaluations ({stats.total_ratings})
        </h3>
        <div className="flex items-center">
          <StarDisplay rating={stats.average_overall_rating} showValue />
        </div>
      </div>

      {/* Détails par catégorie */}
      <div className="space-y-3">
        {stats.average_punctuality_rating > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm text-gray-600">Ponctualité</span>
            </div>
            <StarDisplay rating={stats.average_punctuality_rating} size="sm" showValue />
          </div>
        )}

        {stats.average_quality_rating > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Award className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">
                {userType === 'livreur' ? 'Qualité livraison' : 'Qualité service'}
              </span>
            </div>
            <StarDisplay rating={stats.average_quality_rating} size="sm" showValue />
          </div>
        )}

        {stats.average_communication_rating > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 text-purple-500 mr-2" />
              <span className="text-sm text-gray-600">Communication</span>
            </div>
            <StarDisplay rating={stats.average_communication_rating} size="sm" showValue />
          </div>
        )}
      </div>

      {/* Distribution des notes */}
      {stats.rating_distribution && Object.keys(stats.rating_distribution).length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Distribution des notes</h4>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.rating_distribution[rating.toString()] || 0
              const percentage = stats.total_ratings > 0 ? (count / stats.total_ratings) * 100 : 0
              
              return (
                <div key={rating} className="flex items-center text-xs">
                  <span className="w-4 text-gray-600">{rating}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mx-1" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-gray-500 w-8">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COMPOSANT LISTE DES RATINGS
// =============================================================================

interface RatingListProps {
  userId: string
  maxItems?: number
  showTitle?: boolean
}

export function RatingList({ userId, maxItems = 5, showTitle = true }: RatingListProps) {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRatings()
  }, [userId])

  const loadRatings = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getUserRatings(userId)
      if (response.success) {
        setRatings(response.ratings.slice(0, maxItems))
      }
    } catch (error) {
      console.error('Erreur chargement ratings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (ratings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Aucune évaluation pour le moment</p>
      </div>
    )
  }

  return (
    <div>
      {showTitle && (
        <h3 className="font-semibold text-gray-800 mb-4">
          💬 Dernières évaluations
        </h3>
      )}
      
      <div className="space-y-3">
        {ratings.map((rating) => (
          <div key={rating.id} className="bg-white border border-gray-200 rounded-lg p-4">
            {/* En-tête */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {rating.reviewer.first_name} {rating.reviewer.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(rating.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <StarDisplay rating={rating.overall_rating} size="sm" />
            </div>

            {/* Ratings détaillés */}
            {(rating.punctuality_rating || rating.quality_rating || rating.communication_rating) && (
              <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                {rating.punctuality_rating && (
                  <div className="text-center">
                    <p className="text-gray-500 mb-1">Ponctualité</p>
                    <StarDisplay rating={rating.punctuality_rating} size="sm" />
                  </div>
                )}
                {rating.quality_rating && (
                  <div className="text-center">
                    <p className="text-gray-500 mb-1">Qualité</p>
                    <StarDisplay rating={rating.quality_rating} size="sm" />
                  </div>
                )}
                {rating.communication_rating && (
                  <div className="text-center">
                    <p className="text-gray-500 mb-1">Communication</p>
                    <StarDisplay rating={rating.communication_rating} size="sm" />
                  </div>
                )}
              </div>
            )}

            {/* Commentaire */}
            {rating.comment && (
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-sm text-gray-700 italic">
                  "{rating.comment}"
                </p>
              </div>
            )}

            {/* Badge type */}
            <div className="mt-3 flex justify-end">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                rating.rating_type === 'delivery' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {rating.rating_type === 'delivery' ? '📦 Livraison' : '🛠️ Service'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// COMPOSANT COMPACT POUR AFFICHAGE RAPIDE
// =============================================================================

interface CompactRatingProps {
  userId: string
  userType?: 'livreur' | 'prestataire'
  showCount?: boolean
}

export function CompactRating({ userId, userType = 'livreur', showCount = true }: CompactRatingProps) {
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [userId])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getRatingStats(userId)
      if (response.success) {
        setStats(response.stats)
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3 h-3 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="animate-pulse h-3 bg-gray-200 rounded w-8"></div>
      </div>
    )
  }

  if (!stats || stats.total_ratings === 0) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <StarDisplay rating={0} size="sm" />
        <span className="text-xs">Nouveau {userType}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <StarDisplay rating={stats.average_overall_rating} size="sm" />
      {showCount && (
        <span className="text-xs text-gray-600">
          ({stats.total_ratings})
        </span>
      )}
    </div>
  )
}

export default { RatingStatsDisplay, RatingList, CompactRating } 