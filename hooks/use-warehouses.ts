import { useState, useCallback } from 'react';
import { apiClient } from '@/src/lib/api';

// =============================================================================
// TYPES
// =============================================================================

export interface Warehouse {
  id: number;
  location: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  stockage?: any[];
}

export interface WarehouseCapacity {
  warehouseId: number;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
}

export interface CreateWarehouseData {
  location: string;
  capacity: number;
}

export interface UpdateWarehouseData {
  location?: string;
  capacity?: number;
}

// =============================================================================
// HOOK USE-WAREHOUSES
// =============================================================================

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer tous les entrepôts
  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/wharehouses');
      setWarehouses(response.wharehouses || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des entrepôts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer un entrepôt spécifique
  const fetchWarehouse = useCallback(async (id: number): Promise<Warehouse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/wharehouses/${id}`);
      return response.wharehouse;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération de l\'entrepôt');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un nouvel entrepôt
  const createWarehouse = useCallback(async (data: CreateWarehouseData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/wharehouses/create', data);
      await fetchWarehouses(); // Recharger la liste
      return true;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'entrepôt');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchWarehouses]);

  // Mettre à jour un entrepôt
  const updateWarehouse = useCallback(async (id: number, data: UpdateWarehouseData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/wharehouses/${id}`, data);
      await fetchWarehouses(); // Recharger la liste
      return true;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de l\'entrepôt');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchWarehouses]);

  // Supprimer un entrepôt
  const deleteWarehouse = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/wharehouses/${id}`);
      await fetchWarehouses(); // Recharger la liste
      return true;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de l\'entrepôt');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchWarehouses]);

  // Récupérer la capacité disponible d'un entrepôt
  const getWarehouseCapacity = useCallback(async (id: number): Promise<WarehouseCapacity | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/wharehouses/${id}/capacity`);
      return response;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération de la capacité');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    warehouses,
    loading,
    error,
    fetchWarehouses,
    fetchWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseCapacity,
  };
}