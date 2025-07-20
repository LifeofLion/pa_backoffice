'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LanguageSelector from '@/components/language-selector';
import { useLanguage } from '@/components/language-context';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import { API_ROUTES } from '@/src/lib/api-routes';
import { useAuth } from '@/src/hooks/useAuth';

interface RegisterProps {
	accountType: 'delivery-man' | 'service-provider' | 'shopkeeper';
}

export default function Register({ accountType }: RegisterProps) {
	const { t } = useLanguage();
	const router = useRouter();
	const { register } = useAuth();
	const [formData, setFormData] = useState({
		first_name: '',
		last_name: '',
		email: '',
		password: '',
		phone: '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');

	// Mapping des types de comptes pour l'affichage et les routes
	const accountTypeConfig = {
		'delivery-man': {
			label: 'Delivery man',
			redirectPath: '/documents-verification/deliveryman',
		},
		'service-provider': {
			label: 'Service Provider',
			redirectPath: '/documents-verification/service-provider',
		},
		shopkeeper: {
			label: 'Shopkeeper',
			redirectPath: '/documents-verification/shopkeeper',
		},
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		// Validation basique
		if (
			!formData.first_name ||
			!formData.last_name ||
			!formData.email ||
			!formData.password
		) {
			setError('Please fill in all required fields');
			return;
		}

		setIsSubmitting(true);

		try {
			// Créer le compte utilisateur
			await register({
				email: formData.email,
				password: formData.password,
				first_name: formData.first_name,
				last_name: formData.last_name,
				phone: formData.phone || undefined,
			});

			// Rediriger vers la page de vérification d'email
			router.push('/verify-email');
		} catch (err) {
			const errorMessage = getErrorMessage(err);
			setError(`Registration failed: ${errorMessage}`);
			console.error('Registration error:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-green-200'>
			<div className='absolute top-4 right-4'>
				<LanguageSelector />
			</div>

			<div className='bg-white rounded-lg p-8 w-full max-w-md mx-4 shadow-md'>
				<h1 className='text-2xl font-semibold text-center mb-2'>
					Create an Account
				</h1>
				<p className='text-gray-600 text-center mb-6'>
					Create an account as a{' '}
					{accountTypeConfig[accountType].label}
				</p>

				{error && (
					<div className='bg-red-50 text-red-500 p-3 rounded-md mb-4 text-center text-sm'>
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label
							htmlFor='first_name'
							className='block text-gray-700 mb-1'
						>
							First Name
						</label>
						<input
							id='first_name'
							name='first_name'
							type='text'
							value={formData.first_name}
							onChange={handleChange}
							placeholder='Enter your first name'
							className='w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400'
							required
						/>
					</div>

					<div>
						<label
							htmlFor='last_name'
							className='block text-gray-700 mb-1'
						>
							Last Name
						</label>
						<input
							id='last_name'
							name='last_name'
							type='text'
							value={formData.last_name}
							onChange={handleChange}
							placeholder='Enter your last name'
							className='w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400'
							required
						/>
					</div>

					<div>
						<label
							htmlFor='email'
							className='block text-gray-700 mb-1'
						>
							Email Address
						</label>
						<input
							id='email'
							name='email'
							type='email'
							value={formData.email}
							onChange={handleChange}
							placeholder='Enter your email'
							className='w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400'
							required
						/>
					</div>

					<div>
						<label
							htmlFor='password'
							className='block text-gray-700 mb-1'
						>
							Password
						</label>
						<input
							id='password'
							name='password'
							type='password'
							value={formData.password}
							onChange={handleChange}
							placeholder='Enter your password'
							className='w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400'
							required
						/>
					</div>

					<div>
						<label
							htmlFor='phone'
							className='block text-gray-700 mb-1'
						>
							Phone (Optional)
						</label>
						<input
							id='phone'
							name='phone'
							type='tel'
							value={formData.phone}
							onChange={handleChange}
							placeholder='Enter your phone number'
							className='w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400'
						/>
					</div>

					<div className='pt-4'>
						<button
							type='submit'
							disabled={isSubmitting}
							className='w-full py-3 bg-green-300 text-gray-700 rounded-md hover:bg-green-400 transition-colors disabled:opacity-70'
						>
							{isSubmitting
								? 'Creating account...'
								: 'Create Account'}
						</button>
					</div>
				</form>

				<div className='text-center mt-6'>
					<span className='text-gray-600'>
						Already have an account?{' '}
					</span>
					<Link
						href='/login'
						className='text-green-500 hover:underline'
					>
						Login
					</Link>
				</div>
			</div>
		</div>
	);
}
