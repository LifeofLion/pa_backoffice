'use client';

import React from 'react';
import BackOfficeLayout from '@/src/components/layouts/back-office-layout';
import { AnnoncesContent } from '@/components/back-office/annonces-content';
import { useRequireRole } from '@/src/hooks/use-auth';

export default function AdminAnnoncesPage() {
	const isAuthorized = useRequireRole('admin', '/login');

	if (!isAuthorized) {
		return null;
	}

	return (
		<BackOfficeLayout activeRoute='annonces'>
			<AnnoncesContent />
		</BackOfficeLayout>
	);
}
