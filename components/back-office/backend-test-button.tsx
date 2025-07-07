'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Wifi } from 'lucide-react';

export function BackendTestButton() {
	const [testing, setTesting] = useState(false);
	const [result, setResult] = useState<any>(null);

	const BACKEND_URL =
		process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

	const testBackend = async () => {
		setTesting(true);
		setResult(null);

		try {
			const response = await fetch(`${BACKEND_URL}/service-types`);
			const data = await response.json();
			setResult(data);
		} catch (error) {
			setResult({
				success: false,
				error: 'Erreur de requête',
				details:
					error instanceof Error ? error.message : 'Erreur inconnue',
			});
		} finally {
			setTesting(false);
		}
	};

	return (
		<div className='space-y-4'>
			<Button
				onClick={testBackend}
				disabled={testing}
				variant='outline'
				className='w-full'
			>
				{testing ? (
					<>
						<Loader2 className='h-4 w-4 mr-2 animate-spin' />
						Test en cours...
					</>
				) : (
					<>
						<Wifi className='h-4 w-4 mr-2' />
						Tester la connectivité backend
					</>
				)}
			</Button>

			{result && (
				<Alert variant={result.success ? 'default' : 'destructive'}>
					<div className='flex items-center gap-2'>
						{result.success ? (
							<CheckCircle className='h-4 w-4 text-green-600' />
						) : (
							<XCircle className='h-4 w-4 text-red-600' />
						)}
						<AlertDescription>
							<div className='space-y-2'>
								<p className='font-medium'>
									{result.success
										? '✅ Backend accessible'
										: '❌ Backend non accessible'}
								</p>
								{result.backendUrl && (
									<p className='text-sm'>
										URL: {result.backendUrl}
									</p>
								)}
								{result.error && (
									<p className='text-sm'>
										Erreur: {result.error}
									</p>
								)}
								{result.details && (
									<details className='text-xs'>
										<summary>Détails techniques</summary>
										<pre className='mt-1 p-2 bg-gray-100 rounded'>
											{typeof result.details === 'string'
												? result.details
												: JSON.stringify(
														result.details,
														null,
														2
												  )}
										</pre>
									</details>
								)}
								{result.success && result.data && (
									<details className='text-xs'>
										<summary>Données reçues</summary>
										<pre className='mt-1 p-2 bg-green-50 rounded'>
											{JSON.stringify(
												result.data,
												null,
												2
											)}
										</pre>
									</details>
								)}
							</div>
						</AlertDescription>
					</div>
				</Alert>
			)}
		</div>
	);
}
