'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/language-context';
import { 
  Search, 
  FileText, 
  User, 
  Calendar, 
  Check, 
  X, 
  Eye, 
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  JustificationPieceTransformed,
  JustificationPiecesApiResponse,
  JustificationVerifyApiResponse,
  JustificationPieceData,
  JustificationReviewRequest,
  UserData,
  FrontendValidators
} from '@/src/types/validators';

export function ValidationsContent() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [justifications, setJustifications] = useState<JustificationPieceTransformed[]>([]);
  const [filteredJustifications, setFilteredJustifications] = useState<JustificationPieceTransformed[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedJustification, setSelectedJustification] = useState<JustificationPieceTransformed | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'verify' | 'reject'>('verify');
  const [reviewComments, setReviewComments] = useState('');
  const [processing, setProcessing] = useState(false);

  // Charger toutes les justifications
  const loadJustifications = async (forceReload = false) => {
    setLoading(true);
    try {
      // 🚀 FORCE RELOAD: Ajouter timestamp pour éviter le cache
      const timestamp = forceReload ? `?_t=${Date.now()}` : '';
      const response = await apiClient.get<JustificationPiecesApiResponse>(`/justification-pieces/all${timestamp}`);
      
      console.log('🔍 Response brute:', response);
      
      // Extraire les données selon le format de réponse
      let rawData: JustificationPieceData[] = [];
      if (Array.isArray(response)) {
        rawData = response;
      } else if (response && Array.isArray(response.data)) {
        rawData = response.data;
      } else {
        console.warn('🔍 Structure de données inattendue:', response);
        rawData = [];
      }
      
      console.log('🔍 Raw data:', rawData);
      
      // Transformer les données pour correspondre à l'interface frontend
      const transformedData: JustificationPieceTransformed[] = rawData.map((item: JustificationPieceData) => {
        console.log('🔍 Item brut:', item);
        
        // Extraire les infos utilisateur de façon sûre
        const user: any = item.utilisateur; // any pour contourner les contraintes de type
        const firstName = user?.firstName || user?.first_name || 'N/A';
        const lastName = user?.lastName || user?.last_name || 'N/A';
        const email = user?.email || 'N/A';
        
        console.log('🔍 Extraction des noms utilisateur:', {
          user: user,
          firstName_extracted: firstName,
          lastName_extracted: lastName,
          user_firstName: user?.firstName,
          user_first_name: user?.first_name,
          user_lastName: user?.lastName,
          user_last_name: user?.last_name
        });
        
        // 🔧 CORRECTION: Support des formats camelCase ET snake_case
        const utilisateur_id = item.utilisateur_id || (item as any).utilisateurId;
        const document_type = item.document_type || (item as any).documentType;
        const file_path = item.file_path || (item as any).filePath;
        const account_type = item.account_type || (item as any).accountType || 'livreur';
        const verification_status = item.verification_status || (item as any).verificationStatus || 'pending';
        const uploaded_at = item.uploaded_at || (item as any).uploadedAt;
        const verified_at = item.verified_at || (item as any).verifiedAt;
        const createdAt = item.createdAt || (item as any).createdAt;
        const updatedAt = item.updatedAt || (item as any).updatedAt;

        // Extraire le nom de fichier du chemin
        const fileName = file_path ? file_path.split('/').pop() || file_path : 'Fichier inconnu';
        
        // Mapper les dates
        const submittedAt = uploaded_at || createdAt;
        const reviewedAt = verified_at || updatedAt;
        
        console.log('🔧 Propriétés extraites:', {
          utilisateur_id,
          document_type,
          account_type,
          verification_status,
          format_detected: item.utilisateur_id ? 'snake_case' : 'camelCase'
        });
        
        // 🔍 DEBUGGING: Log des propriétés critiques
        console.log('🔍 account_type brut:', account_type);
        console.log('🔍 verification_status brut:', verification_status);
        console.log('🔍 file_path brut:', file_path);
        console.log('🔍 fileName extrait:', fileName);
        console.log('🔧 Format détecté:', item.utilisateur_id ? 'snake_case' : 'camelCase');
        
        const transformed: JustificationPieceTransformed = {
          id: item.id,
          utilisateur_id,
          document_type,
          file_path,
          account_type,
          verification_status,
          uploaded_at,
          verified_at,
          createdAt,
          updatedAt,
          
          // Propriétés extraites et calculées
          firstName,
          lastName,
          email,
          fileName,
          submittedAt,
          reviewedAt,
          reviewComments: '', // Pas de champ review_comments pour l'instant
          reviewedBy: '', // Pas de champ reviewed_by pour l'instant
        };
        
        console.log('🔍 Item transformé:', transformed);
        console.log('🔍 account_type final:', account_type);
        console.log('🔍 verification_status final:', verification_status);
        return transformed;
      });
      
      console.log('🔍 Données transformées:', transformedData);
      setJustifications(transformedData);
      setFilteredJustifications(transformedData);
    } catch (error) {
      console.error('❌ Error loading justifications:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: getErrorMessage(error)
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les justifications
  useEffect(() => {
    let filtered = justifications;

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.verification_status === statusFilter);
    }

    // Filtre par type de compte
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.account_type === typeFilter);
    }

    setFilteredJustifications(filtered);
  }, [justifications, searchTerm, statusFilter, typeFilter]);

  // Traiter une justification (vérifier ou rejeter)
  const handleReviewSubmit = async () => {
    if (!selectedJustification) return;

    // 🔍 VALIDATION FRONTEND avant envoi
    const reviewData: JustificationReviewRequest = { comments: reviewComments };
    const validationErrors = FrontendValidators.validateJustificationReviewRequest(reviewData);
    
    if (validationErrors.length > 0) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: validationErrors.join(', ')
      });
      return;
    }

    setProcessing(true);
    try {
      const endpoint = reviewAction === 'verify' 
        ? `/justification-pieces/verify/${selectedJustification.id}`
        : `/justification-pieces/reject/${selectedJustification.id}`;
      
      console.log('🔍 Envoi validation vers:', endpoint);
      const response = await apiClient.put<JustificationVerifyApiResponse>(endpoint, reviewData);
      console.log('🔍 Réponse backend:', response);
      
      // Gérer différents types de réponses avec le bon typage
      let successMessage = `Document ${reviewAction === 'verify' ? 'approuvé' : 'rejeté'} avec succès`;
      
      if (response && response.message) {
        successMessage = response.message;
      }
      
      // Cas spécial : auto-validation multiple
      if (response.data && typeof response.data === 'object' && 'validatedDocuments' in response.data) {
        successMessage = `${response.data.validatedDocuments} document(s) auto-validé(s) (rôle déjà existant)`;
      }
      
      toast({
        title: "Succès",
        description: successMessage,
        variant: "default"
      });

      setReviewDialogOpen(false);
      setReviewComments('');
      
      // 🚀 IMPORTANT: Forcer le rechargement des données avec délai pour synchronisation
      console.log('🔄 Rechargement des données...');
      
      // Attendre un délai pour que le backend se synchronise
      setTimeout(async () => {
        await loadJustifications(true);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error processing justification:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: getErrorMessage(error)
      });
    } finally {
      setProcessing(false);
    }
  };

  // Télécharger un document
  const handleDownload = (justificationId: number, fileName: string) => {
    try {
      const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/justification-pieces/${justificationId}/download`;
      console.log('🔍 Téléchargement:', downloadUrl);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le fichier"
      });
    }
  };

  // Ouvrir la boîte de dialogue de révision
  const openReviewDialog = (justification: JustificationPieceTransformed, action: 'verify' | 'reject') => {
    setSelectedJustification(justification);
    setReviewAction(action);
    setReviewComments('');
    setReviewDialogOpen(true);
  };

  useEffect(() => {
    loadJustifications(false);
  }, []);

  const getStatusBadge = (status: string) => {
    console.log('🔍 getStatusBadge appelé avec:', status);
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800">Vérifié</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        console.log('🔍 Statut non reconnu:', status);
        return <Badge variant="outline">{status || 'Statut inconnu'}</Badge>;
    }
  };

  const getAccountTypeBadge = (type: string) => {
    console.log('🔍 getAccountTypeBadge appelé avec:', type);
    const types = {
      'livreur': { label: 'Livreur', className: 'bg-blue-100 text-blue-800' },
      'commercant': { label: 'Commerçant', className: 'bg-purple-100 text-purple-800' },
      'prestataire': { label: 'Prestataire', className: 'bg-orange-100 text-orange-800' }
    };
    
    const typeInfo = types[type as keyof typeof types] || { 
      label: type || 'Type inconnu', 
      className: 'bg-gray-100 text-gray-800' 
    };
    
    console.log('🔍 typeInfo calculé:', typeInfo);
    return <Badge variant="outline" className={typeInfo.className}>{typeInfo.label}</Badge>;
  };

  // Fonction formatDate améliorée avec gestion d'erreurs
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) {
      return 'Date non définie';
    }
    
    try {
      const date = new Date(dateString);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn('🔍 Date invalide:', dateString);
        return 'Date invalide';
      }
      
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('🔍 Erreur formatage date:', error, 'pour:', dateString);
      return 'Erreur de date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des validations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.validations')}</h1>
          <p className="text-gray-600">Gestion des validations de documents</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadJustifications(true)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{justifications.length}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {justifications.filter(j => j.verification_status === 'pending').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vérifiés</p>
                <p className="text-2xl font-bold text-green-600">
                  {justifications.filter(j => j.verification_status === 'verified').length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejetés</p>
                <p className="text-2xl font-bold text-red-600">
                  {justifications.filter(j => j.verification_status === 'rejected').length}
                </p>
              </div>
              <X className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email ou fichier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="verified">Vérifiés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type de compte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="livreur">Livreurs</SelectItem>
                <SelectItem value="commercant">Commerçants</SelectItem>
                <SelectItem value="prestataire">Prestataires</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des justifications */}
      <Card>
        <CardHeader>
          <CardTitle>Documents à valider ({filteredJustifications.length})</CardTitle>
          <CardDescription>
            Cliquez sur un document pour le visualiser et le traiter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredJustifications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun document trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJustifications.map((justification) => (
                <div
                  key={justification.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <User className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {justification.firstName} {justification.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{justification.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getAccountTypeBadge(justification.account_type)}
                        {getStatusBadge(justification.verification_status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm text-gray-600">
                      <p>{justification.fileName || 'Fichier inconnu'}</p>
                      <p>Soumis le {formatDate(justification.submittedAt)}</p>
                      {justification.reviewedAt && (
                        <p>Traité le {formatDate(justification.reviewedAt)}</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(justification.id, justification.fileName || '')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {justification.verification_status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openReviewDialog(justification, 'verify')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openReviewDialog(justification, 'reject')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de révision */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'verify' ? 'Approuver le document' : 'Rejeter le document'}
            </DialogTitle>
            <DialogDescription>
              {selectedJustification && (
                <>
                  Document de {selectedJustification.firstName} {selectedJustification.lastName}
                  <br />
                  Fichier: {selectedJustification.fileName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Commentaires {reviewAction === 'reject' ? '(obligatoire)' : '(optionnel)'}
              </label>
              <Textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder={
                  reviewAction === 'verify' 
                    ? "Commentaires sur l'approbation..." 
                    : "Raison du refus..."
                }
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={processing || (reviewAction === 'reject' && !reviewComments.trim())}
              className={reviewAction === 'verify' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={reviewAction === 'verify' ? 'default' : 'destructive'}
            >
              {processing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {reviewAction === 'verify' ? 'Approuver' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 