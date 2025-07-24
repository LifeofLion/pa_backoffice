'use client';

import { useParams } from 'next/navigation';
import { useUser } from '@/src/stores/auth-store';
import { useEffect } from 'react';

export default function TestEditPage() {
	const params = useParams();
	const { isAuthenticated, user } = useUser();

	return (
		<div className='container mx-auto px-4 py-6'>
			<h1 className='text-2xl font-bold mb-4'>Page de Test d'Édition</h1>

			<div className='bg-gray-100 p-4 rounded'>
				<h2 className='font-semibold mb-2'>
					État de l'authentification :
				</h2>
				<ul className='space-y-1'>
					<li>
						<strong>Authentifié :</strong>{' '}
						{isAuthenticated ? '✅ Oui' : '❌ Non'}
					</li>
					<li>
						<strong>Utilisateur :</strong>{' '}
						{user ? `${user.firstName} ${user.lastName}` : 'Aucun'}
					</li>
					<li>
						<strong>Admin :</strong>{' '}
						{user && (user as any).admin ? '✅ Oui' : '❌ Non'}
					</li>
					<li>
						<strong>Params :</strong> {JSON.stringify(params)}
					</li>
					<li>
						<strong>URL :</strong>{' '}
						{typeof window !== 'undefined'
							? window.location.href
							: 'Serveur'}
					</li>
				</ul>
			</div>

			<div className='mt-6'>
				<h2 className='font-semibold mb-2'>Test terminé</h2>
				<p>Si vous voyez cette page, la navigation fonctionne !</p>
				<p>Vérifiez la console pour les logs de debug.</p>
			</div>
		</div>
	);
}
