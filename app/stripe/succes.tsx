import { GetServerSideProps } from 'next';
import Stripe from 'stripe';
import React from 'react';

type Props = {
  session: Stripe.Checkout.Session | null;
};

export default function Success({ session }: Props) {
  if (!session) {
    return <p>Session introuvable ou invalide.</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Paiement réussi ! 🎉</h1>
      <p>
        Merci pour votre achat. Votre commande a bien été payée pour un total
        de <strong>{session.amount_total! / 100} €</strong>.
      </p>
      <p>Identifiant de la session : <code>{session.id}</code></p>
      <p>
        Un e-mail de confirmation a été envoyé à : <strong>{session.customer_details?.email}</strong>
      </p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { session_id } = context.query;
  if (!session_id || typeof session_id !== 'string') {
    return { props: { session: null } };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil',
  });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items'], // si vous souhaitez récupérer les détails des produits
    });
    return { props: { session } };
  } catch (err) {
    console.error('Erreur récupération session :', err);
    return { props: { session: null } };
  }
};