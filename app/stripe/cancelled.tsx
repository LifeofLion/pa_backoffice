import React from 'react';

export default function Cancelled() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Paiement annulé 😕</h1>
      <p>Vous avez annulé le processus de paiement.</p>
      <p>Si vous souhaitez réessayer, cliquez sur le bouton ci-dessous.</p>
      <button onClick={() => window.history.back()}>Retour</button>
    </div>
  );
}
