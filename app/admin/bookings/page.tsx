'use client';

import { Suspense } from 'react';
import AdminSideBar from '@/components/back-office/admin-sidebar';
import AdminResponsiveHeader from '@/components/back-office/admin-responsive-header';
import { BookingsManagement } from '@/components/back-office/bookings-management';

export default function AdminBookingsPage() {
	return (
		<div className='flex min-h-screen bg-gray-50'>
			<AdminSideBar activePage='bookings' />

			<div className='flex-1 flex flex-col overflow-hidden'>
				<AdminResponsiveHeader />

				<main className='flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6'>
					<Suspense
						fallback={
							<div className='flex items-center justify-center h-64'>
								<div className='animate-spin rounded-full h-32 w-32 border-b-2 border-green-500'></div>
							</div>
						}
					>
						<BookingsManagement />
					</Suspense>
				</main>
			</div>
		</div>
	);
}
