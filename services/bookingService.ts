interface BookingData {
	id: number;
	clientId: number;
	serviceId: number;
	bookingDate: string;
	status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
	notes?: string;
	totalPrice?: number;
}

interface CreateBookingData {
	client_id: number;
	service_id: number;
	booking_date: string;
	notes?: string;
	total_price?: number;
}

interface UpdateBookingStatusData {
	status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

class BookingService {
	private getAuthHeaders() {
		const token = localStorage.getItem('auth_token');
		return {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		};
	}

	async getAllBookings(): Promise<BookingData[]> {
		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/bookings`,
				{
					headers: this.getAuthHeaders(),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return data.bookings || [];
		} catch (error) {
			console.error('Error fetching bookings:', error);
			throw error;
		}
	}

	async getBookingById(id: number): Promise<BookingData> {
		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/bookings/${id}`,
				{
					headers: this.getAuthHeaders(),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Error fetching booking:', error);
			throw error;
		}
	}

	async createBooking(bookingData: CreateBookingData): Promise<BookingData> {
		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/bookings`,
				{
					method: 'POST',
					headers: this.getAuthHeaders(),
					body: JSON.stringify(bookingData),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.message ||
						`HTTP error! status: ${response.status}`
				);
			}

			return await response.json();
		} catch (error) {
			console.error('Error creating booking:', error);
			throw error;
		}
	}

	async updateBookingStatus(
		id: number,
		statusData: UpdateBookingStatusData
	): Promise<BookingData> {
		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/bookings/${id}/status`,
				{
					method: 'PUT',
					headers: this.getAuthHeaders(),
					body: JSON.stringify(statusData),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.message ||
						`HTTP error! status: ${response.status}`
				);
			}

			return await response.json();
		} catch (error) {
			console.error('Error updating booking status:', error);
			throw error;
		}
	}

	async deleteBooking(id: number): Promise<void> {
		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/bookings/${id}`,
				{
					method: 'DELETE',
					headers: this.getAuthHeaders(),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
		} catch (error) {
			console.error('Error deleting booking:', error);
			throw error;
		}
	}

	async getBookingsByClient(clientId: number): Promise<BookingData[]> {
		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/bookings/client/${clientId}`,
				{
					headers: this.getAuthHeaders(),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return data.bookings || [];
		} catch (error) {
			console.error('Error fetching client bookings:', error);
			throw error;
		}
	}

	async getBookingsByProvider(providerId: number): Promise<BookingData[]> {
		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/bookings/provider/${providerId}`,
				{
					headers: this.getAuthHeaders(),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return data.bookings || [];
		} catch (error) {
			console.error('Error fetching provider bookings:', error);
			throw error;
		}
	}

	async getBookingStats(): Promise<any> {
		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/bookings/admin/stats`,
				{
					headers: this.getAuthHeaders(),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Error fetching booking stats:', error);
			throw error;
		}
	}
}

export const bookingService = new BookingService();
export default BookingService;
export type { BookingData, CreateBookingData, UpdateBookingStatusData };
