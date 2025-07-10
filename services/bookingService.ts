import { ApiClient } from '@/lib/api-client';
import type {
	BookingData,
	BookingStatusUpdateRequest,
} from '@/src/types/validators';

// Adapter l'interface pour la création si elle diffère du type principal
interface CreateBookingPayload {
	client_id: number;
	service_id: number;
	booking_date: string;
	notes?: string;
}

class BookingService {
	async getAllBookings(): Promise<BookingData[]> {
		try {
			const response = await ApiClient.get(
				`${process.env.NEXT_PUBLIC_API_URL}/api/bookings` // Ajout du préfixe /api
			);
			return response.data || []; // Les données sont dans la propriété `data` de la réponse paginée
		} catch (error) {
			console.error('Error fetching bookings:', error);
			throw error;
		}
	}

	async getBookingById(id: number): Promise<BookingData> {
		try {
			return await ApiClient.get(
				`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}`
			);
		} catch (error) {
			console.error('Error fetching booking:', error);
			throw error;
		}
	}

	async createBooking(
		bookingData: CreateBookingPayload
	): Promise<BookingData> {
		try {
			return await ApiClient.post(
				`${process.env.NEXT_PUBLIC_API_URL}/api/bookings`,
				bookingData
			);
		} catch (error) {
			console.error('Error creating booking:', error);
			throw error;
		}
	}

	async updateBookingStatus(
		id: number,
		statusData: BookingStatusUpdateRequest
	): Promise<BookingData> {
		try {
			return await ApiClient.put(
				`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}/status`,
				statusData
			);
		} catch (error) {
			console.error('Error updating booking status:', error);
			throw error;
		}
	}

	async deleteBooking(id: number): Promise<void> {
		try {
			await ApiClient.delete(
				`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}`
			);
		} catch (error) {
			console.error('Error deleting booking:', error);
			throw error;
		}
	}

	async getBookingsByClient(clientId: number): Promise<BookingData[]> {
		try {
			const data = await ApiClient.get(
				`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/client/${clientId}`
			);
			return data.bookings || [];
		} catch (error) {
			console.error('Error fetching client bookings:', error);
			throw error;
		}
	}

	async getBookingsByProvider(providerId: number): Promise<BookingData[]> {
		try {
			const data = await ApiClient.get(
				`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/provider/${providerId}`
			);
			return data.bookings || [];
		} catch (error) {
			console.error('Error fetching provider bookings:', error);
			throw error;
		}
	}

	async getBookingStats(): Promise<any> {
		try {
			return await ApiClient.get(
				`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/admin/stats`
			);
		} catch (error) {
			console.error('Error fetching booking stats:', error);
			throw error;
		}
	}
}

export const bookingService = new BookingService();
