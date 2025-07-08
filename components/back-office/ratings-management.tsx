'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/components/language-context';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import { 
  RatingData, 
  RatingStats, 
  RatingFilters,
  RatingType,
  AdminRatingResponse,
  RatingValidators 
} from '@/src/types/validators';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, Eye, EyeOff, Filter, Search, Reply, Award, TrendingUp, Users, ThumbsUp } from 'lucide-react';

export function RatingsManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();

  // ==========================================================================
  // ÉTAT DU COMPOSANT
  // ==========================================================================

  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [stats, setStats] = useState<RatingStats>({
    total: 0,
    visible: 0,
    hidden: 0,
    with_admin_response: 0,
    average_rating: 0,
    ratings_by_type: {
      service: 0,
      delivery: 0,
      prestataire: 0,
      livreur: 0
    },
    ratings_distribution: {}
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filtres et recherche
  const [filters, setFilters] = useState<RatingFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Dialogues
  const [selectedRating, setSelectedRating] = useState<RatingData | null>(null);
  const [responseDialog, setResponseDialog] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');

  // ==========================================================================
  // FONCTIONS DE CHARGEMENT DES DONNÉES
  // ==========================================================================

  /**
   * Transforme les données brutes de l'API en RatingData typé
   */
  const transformRatingData = useCallback((rawRating: any): RatingData => {
    return {
      id: rawRating.id || 0,
      user_id: rawRating.user_id || rawRating.userId || 0,
      item_id: rawRating.item_id || rawRating.itemId || 0,
      rating_type: rawRating.rating_type || rawRating.ratingType || 'service',
      rating: rawRating.rating || 0,
      comment: rawRating.comment || null,
      is_visible: rawRating.is_visible !== undefined ? rawRating.is_visible : (rawRating.isVisible !== undefined ? rawRating.isVisible : true),
      admin_response: rawRating.admin_response || rawRating.adminResponse || null,
      created_at: rawRating.created_at || rawRating.createdAt || '',
      updated_at: rawRating.updated_at || rawRating.updatedAt || '',
      // Relations
      user_name: rawRating.user_name || rawRating.userName || `Utilisateur ${rawRating.user_id || rawRating.userId || 'N/A'}`,
      user_email: rawRating.user_email || rawRating.userEmail || '',
      item_name: rawRating.item_name || rawRating.itemName || `${rawRating.rating_type || rawRating.ratingType || 'Item'} ${rawRating.item_id || rawRating.itemId || 'N/A'}`
    };
  }, []);

  /**
   * Charge les avis depuis l'API
   */
  const loadRatings = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📦 Chargement des avis...');
      
      const response = await apiClient.getAllRatingsAdmin(filters);
      console.log('📦 Réponse API ratings:', response);

      // Traitement de la réponse selon sa structure
      let rawRatingsData: any[] = [];
      
      if (Array.isArray(response)) {
        rawRatingsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        rawRatingsData = response.data;
      } else if (response && response.ratings && Array.isArray(response.ratings)) {
        rawRatingsData = response.ratings;
      } else {
        console.warn('⚠️ Structure de réponse inattendue:', response);
        rawRatingsData = [];
      }

      // Transformation des données
      const transformedRatings = rawRatingsData.map(transformRatingData);
      
      setRatings(transformedRatings);
      calculateStats(transformedRatings);
      
      console.log(`✅ ${transformedRatings.length} avis chargés`);
    } catch (error) {
      console.error('❌ Erreur chargement avis:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les avis: ${getErrorMessage(error)}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, transformRatingData, toast]);

  /**
   * Calcule les statistiques localement à partir des données
   */
  const calculateStats = useCallback((ratingsData: RatingData[]) => {
    const stats: RatingStats = {
      total: ratingsData.length,
      visible: ratingsData.filter(r => r.is_visible).length,
      hidden: ratingsData.filter(r => !r.is_visible).length,
      with_admin_response: ratingsData.filter(r => r.admin_response && r.admin_response.trim()).length,
      average_rating: 0,
      ratings_by_type: {
        service: ratingsData.filter(r => r.rating_type === 'service').length,
        delivery: ratingsData.filter(r => r.rating_type === 'delivery').length,
        prestataire: ratingsData.filter(r => r.rating_type === 'prestataire').length,
        livreur: ratingsData.filter(r => r.rating_type === 'livreur').length
      },
      ratings_distribution: {}
    };

    // Calcul de la moyenne des notes
    if (ratingsData.length > 0) {
      stats.average_rating = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
    }

    // Distribution des notes (1-5 étoiles)
    for (let i = 1; i <= 5; i++) {
      stats.ratings_distribution[`${i}_stars`] = ratingsData.filter(r => r.rating === i).length;
    }

    setStats(stats);
  }, []);

  /**
   * Actualise toutes les données
   */
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadRatings();
    } finally {
      setRefreshing(false);
    }
  }, [loadRatings]);

  // ==========================================================================
  // ACTIONS DE GESTION DES AVIS
  // ==========================================================================

  /**
   * Ajoute une réponse admin à un avis
   */
  const handleAddAdminResponse = useCallback(async () => {
    if (!selectedRating || !adminResponse.trim()) return;

    try {
      const responseData: AdminRatingResponse = {
        admin_response: adminResponse.trim()
      };

      // Validation des données
      const validationErrors = RatingValidators.validateAdminRatingResponse(responseData);
      if (validationErrors.length > 0) {
        toast({
          title: "Erreur de validation",
          description: validationErrors.join(', '),
          variant: "destructive",
        });
        return;
      }

      await apiClient.addAdminRatingResponse(selectedRating.id.toString(), adminResponse.trim());
      
      toast({
        title: "Succès",
        description: "Réponse admin ajoutée avec succès",
      });

      // Fermer le dialogue et actualiser
      setResponseDialog(false);
      setSelectedRating(null);
      setAdminResponse('');
      await refreshData();
    } catch (error) {
      console.error('❌ Erreur ajout réponse admin:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'ajouter la réponse: ${getErrorMessage(error)}`,
        variant: "destructive",
      });
    }
  }, [selectedRating, adminResponse, apiClient, toast, refreshData]);

  /**
   * Bascule la visibilité d'un avis
   */
  const handleToggleVisibility = useCallback(async (rating: RatingData) => {
    try {
      await apiClient.toggleRatingVisibility(rating.id.toString());
      
      toast({
        title: "Succès",
        description: `Avis ${rating.is_visible ? 'masqué' : 'rendu visible'}`,
      });

      await refreshData();
    } catch (error) {
      console.error('❌ Erreur toggle visibilité:', error);
      toast({
        title: "Erreur",
        description: `Impossible de modifier la visibilité: ${getErrorMessage(error)}`,
        variant: "destructive",
      });
    }
  }, [apiClient, toast, refreshData]);

  // ==========================================================================
  // FILTRAGE ET RECHERCHE
  // ==========================================================================

  /**
   * Filtre les avis selon les critères
   */
  const filteredRatings = useCallback(() => {
    let filtered = [...ratings];

    // Recherche textuelle
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rating => 
        rating.user_name.toLowerCase().includes(term) ||
        rating.user_email.toLowerCase().includes(term) ||
        rating.item_name.toLowerCase().includes(term) ||
        (rating.comment && rating.comment.toLowerCase().includes(term)) ||
        rating.id.toString().includes(term)
      );
    }

    return filtered;
  }, [ratings, searchTerm]);

  /**
   * Applique les filtres
   */
  const applyFilters = useCallback(async () => {
    setShowFilters(false);
    await loadRatings(); // Recharge avec les nouveaux filtres
  }, [loadRatings]);

  /**
   * Remet à zéro les filtres
   */
  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setShowFilters(false);
  }, []);

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ==========================================================================
  // UTILITAIRES UI
  // ==========================================================================

  const getTypeColor = (type: RatingType): string => {
    switch (type) {
      case 'service': return 'bg-blue-100 text-blue-800';
      case 'delivery': return 'bg-green-100 text-green-800';
      case 'prestataire': return 'bg-purple-100 text-purple-800';
      case 'livreur': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisibilityBadgeVariant = (isVisible: boolean): "default" | "secondary" | "destructive" | "outline" => {
    return isVisible ? 'default' : 'outline';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getTypeLabel = (type: RatingType): string => {
    switch (type) {
      case 'service': return 'Service';
      case 'delivery': return 'Livraison';
      case 'prestataire': return 'Prestataire';
      case 'livreur': return 'Livreur';
      default: return type;
    }
  };

  // ==========================================================================
  // RENDU DU COMPOSANT
  // ==========================================================================

  if (loading && ratings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Avis</h1>
          <p className="text-muted-foreground">
            Gérez tous les avis et évaluations de la plateforme
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtres
          </Button>
          <Button 
            onClick={refreshData} 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              "Actualiser"
            )}
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Avis</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.visible} visibles, {stats.hidden} masqués
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average_rating.toFixed(1)}/5</div>
            <div className="flex items-center gap-1">
              {renderStars(Math.round(stats.average_rating))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réponses Admin</CardTitle>
            <Reply className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.with_admin_response}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.with_admin_response / stats.total) * 100) : 0}% avec réponse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">5 Étoiles</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ratings_distribution['5_stars'] || 0}</div>
            <p className="text-xs text-muted-foreground">
              Excellentes évaluations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
            <CardDescription>Filtrez les avis selon vos critères</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>Type d'avis</Label>
                <Select 
                  value={filters.rating_type || ''} 
                  onValueChange={(value) => setFilters({...filters, rating_type: value && value !== 'all' ? value as RatingType : undefined})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="delivery">Livraison</SelectItem>
                    <SelectItem value="prestataire">Prestataire</SelectItem>
                    <SelectItem value="livreur">Livreur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            
              <div>
                <Label>Note</Label>
                <Select 
                  value={filters.rating?.toString() || ''} 
                  onValueChange={(value) => setFilters({...filters, rating: value && value !== 'all' ? parseInt(value) : undefined})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les notes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="5">5 étoiles</SelectItem>
                    <SelectItem value="4">4 étoiles</SelectItem>
                    <SelectItem value="3">3 étoiles</SelectItem>
                    <SelectItem value="2">2 étoiles</SelectItem>
                    <SelectItem value="1">1 étoile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            
              <div>
                <Label>Visibilité</Label>
                <Select 
                  value={filters.is_visible !== undefined ? filters.is_visible.toString() : ''} 
                  onValueChange={(value) => setFilters({...filters, is_visible: value && value !== 'all' ? value === 'true' : undefined})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les visibilités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="true">Visible</SelectItem>
                    <SelectItem value="false">Masqué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            
              <div>
                <Label>Réponse admin</Label>
                <Select 
                  value={filters.has_admin_response !== undefined ? filters.has_admin_response.toString() : ''} 
                  onValueChange={(value) => setFilters({...filters, has_admin_response: value && value !== 'all' ? value === 'true' : undefined})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les réponses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="true">Avec réponse</SelectItem>
                    <SelectItem value="false">Sans réponse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={applyFilters}>Appliquer</Button>
              <Button variant="outline" onClick={resetFilters}>Réinitialiser</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recherche */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par utilisateur, commentaire..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tableau des avis */}
      <Card>
        <CardHeader>
          <CardTitle>Avis ({filteredRatings().length})</CardTitle>
          <CardDescription>
            Liste de tous les avis avec leurs détails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Élément évalué</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRatings().map((rating) => (
                <TableRow key={rating.id}>
                  <TableCell className="font-medium">#{rating.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rating.user_name}</div>
                      <div className="text-sm text-muted-foreground">{rating.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(rating.rating_type)}>
                      {getTypeLabel(rating.rating_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{rating.item_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {renderStars(rating.rating)}
                      <span className="text-sm font-medium">{rating.rating}/5</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {rating.comment ? (
                        <p className="text-sm truncate" title={rating.comment}>
                          {rating.comment}
                        </p>
                      ) : (
                        <span className="text-sm text-muted-foreground">Aucun commentaire</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={getVisibilityBadgeVariant(rating.is_visible)}>
                        {rating.is_visible ? 'Visible' : 'Masqué'}
                      </Badge>
                      {rating.admin_response && (
                        <Badge variant="secondary" className="block">
                          Réponse admin
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(rating.created_at)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleVisibility(rating)}
                        title={rating.is_visible ? 'Masquer' : 'Rendre visible'}
                      >
                        {rating.is_visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRating(rating);
                          setAdminResponse(rating.admin_response || '');
                          setResponseDialog(true);
                        }}
                        title="Répondre"
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRatings().length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun avis trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de réponse admin */}
      <Dialog open={responseDialog} onOpenChange={setResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Répondre à l'avis #{selectedRating?.id}</DialogTitle>
            <DialogDescription>
              Ajouter ou modifier la réponse administrateur à cet avis
            </DialogDescription>
          </DialogHeader>

          {selectedRating && (
            <div className="space-y-4">
              {/* Détails de l'avis */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{selectedRating.user_name}</span>
                        <Badge className={`ml-2 ${getTypeColor(selectedRating.rating_type)}`}>
                          {getTypeLabel(selectedRating.rating_type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(selectedRating.rating)}
                        <span className="font-medium">{selectedRating.rating}/5</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedRating.item_name} • {formatDate(selectedRating.created_at)}
                    </div>
                    {selectedRating.comment && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm">{selectedRating.comment}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Zone de réponse */}
              <div>
                <Label>Réponse administrateur</Label>
                <Textarea
                  placeholder="Tapez votre réponse ici..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cette réponse sera visible par tous les utilisateurs
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setResponseDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddAdminResponse}
                  disabled={!adminResponse.trim()}
                >
                  {selectedRating.admin_response ? 'Modifier la réponse' : 'Ajouter la réponse'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 