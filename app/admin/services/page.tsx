'use client';

import React from 'react';
import BackOfficeLayout from '@/src/components/layouts/back-office-layout';
import { ServicesManagement } from '@/components/back-office/services-management';
import { useRequireRole } from '@/src/hooks/use-auth';

/**
 * Page Gestion Services Admin utilisant ServicesManagement
 */
export default function ServicesPage() {
	// Protection par rôle avec l'architecture /src
	const isAuthorized = useRequireRole('admin', '/login');

	if (!isAuthorized) {
		return null; // Redirection en cours
	}

	return (
		<BackOfficeLayout activeRoute='services'>
			<ServicesManagement />
		</BackOfficeLayout>
	);
}
