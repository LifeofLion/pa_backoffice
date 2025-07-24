'use client';

import { useEffect, useState } from 'react';
import { useWarehouses, type Warehouse, type CreateWarehouseData, type UpdateWarehouseData } from '../../../hooks/use-warehouses';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Trash2, Edit, Plus, MapPin, Package } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { BackOfficeLayout } from '../../../src/components/layouts';

export default function WarehousesPage() {
  const {
    warehouses,
    loading,
    error,
    fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseCapacity
  } = useWarehouses();

  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [capacities, setCapacities] = useState<Record<number, any>>({});

  // Formulaire de création
  const [createForm, setCreateForm] = useState<CreateWarehouseData>({
    location: '',
    capacity: 0
  });

  // Formulaire d'édition
  const [editForm, setEditForm] = useState<UpdateWarehouseData>({
    location: '',
    capacity: 0
  });

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // Charger les capacités pour tous les entrepôts
  useEffect(() => {
    const loadCapacities = async () => {
      const newCapacities: Record<number, any> = {};
      for (const warehouse of warehouses) {
        const capacity = await getWarehouseCapacity(warehouse.id);
        if (capacity) {
          newCapacities[warehouse.id] = capacity;
        }
      }
      setCapacities(newCapacities);
    };

    if (warehouses.length > 0) {
      loadCapacities();
    }
  }, [warehouses, getWarehouseCapacity]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.location || createForm.capacity <= 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs correctement',
        variant: 'destructive'
      });
      return;
    }

    const success = await createWarehouse(createForm);
    if (success) {
      toast({
        title: 'Succès',
        description: 'Entrepôt créé avec succès'
      });
      setCreateForm({ location: '', capacity: 0 });
      setIsCreateDialogOpen(false);
    } else {
      toast({
        title: 'Erreur',
        description: error || 'Erreur lors de la création',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouse) return;

    const success = await updateWarehouse(editingWarehouse.id, editForm);
    if (success) {
      toast({
        title: 'Succès',
        description: 'Entrepôt modifié avec succès'
      });
      setIsEditDialogOpen(false);
      setEditingWarehouse(null);
    } else {
      toast({
        title: 'Erreur',
        description: error || 'Erreur lors de la modification',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (warehouse: Warehouse) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'entrepôt "${warehouse.location}" ?`)) {
      return;
    }

    const success = await deleteWarehouse(warehouse.id);
    if (success) {
      toast({
        title: 'Succès',
        description: 'Entrepôt supprimé avec succès'
      });
    } else {
      toast({
        title: 'Erreur',
        description: error || 'Erreur lors de la suppression',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setEditForm({
      location: warehouse.location,
      capacity: warehouse.capacity
    });
    setIsEditDialogOpen(true);
  };

  if (loading && warehouses.length === 0) {
    return (
      <BackOfficeLayout activeRoute="warehouses">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Chargement...</div>
        </div>
      </BackOfficeLayout>
    );
  }

  return (
    <BackOfficeLayout activeRoute="warehouses">
      <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des Entrepôts</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Entrepôt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouvel entrepôt</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  placeholder="Adresse de l'entrepôt"
                  required
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacité</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={createForm.capacity}
                  onChange={(e) => setCreateForm({ ...createForm, capacity: parseInt(e.target.value) || 0 })}
                  placeholder="Nombre de colis maximum"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  Créer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((warehouse) => {
          const capacity = capacities[warehouse.id];
          return (
            <Card key={warehouse.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    {warehouse.location}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(warehouse)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(warehouse)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Capacité totale:</span>
                    <span className="font-medium">{warehouse.capacity} colis</span>
                  </div>
                  {capacity && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Utilisé:</span>
                        <span className="font-medium">{capacity.usedCapacity} colis</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Disponible:</span>
                        <span className="font-medium text-green-600">{capacity.availableCapacity} colis</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(capacity.usedCapacity / capacity.totalCapacity) * 100}%`
                          }}
                        ></div>
                      </div>
                    </>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    ID: {warehouse.id}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {warehouses.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun entrepôt</h3>
          <p className="text-gray-500">Commencez par créer votre premier entrepôt.</p>
        </div>
      )}

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'entrepôt</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-location">Localisation</Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="Adresse de l'entrepôt"
              />
            </div>
            <div>
              <Label htmlFor="edit-capacity">Capacité</Label>
              <Input
                id="edit-capacity"
                type="number"
                min="1"
                value={editForm.capacity}
                onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 0 })}
                placeholder="Nombre de colis maximum"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                Modifier
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </BackOfficeLayout>
  );
}