import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/components/language-context';
import { AuthProvider } from '@/src/components/auth-provider';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
	title: 'EcoDeli - World First Ecologic Delivery Website',
	description: "EcoDeli is the world's first ecological delivery service",
	generator: 'killian_bx',
	metadataBase: new URL('http://localhost:3000'),
	other: {
		charset: 'utf-8',
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='fr' suppressHydrationWarning>
			<head>
				<meta charSet='utf-8' />
			</head>
			<body className={inter.className}>
				<AuthProvider>
					<LanguageProvider>{children}</LanguageProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
