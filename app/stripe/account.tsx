import React from "react"
import { GetServerSideProps } from "next"

interface Props {
  message?: string
}

export default function Account({ message }: Props) {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Mon compte</h1>
      {message ? (
        <p style={{ color: "green" }}>{message}</p>
      ) : (
        <p>Bienvenue ! Gérez ici votre abonnement via Stripe Customer Portal.</p>
      )}
    </div>
  )
}

// Optionnel : si vous voulez afficher un message contextuel après redirection Stripe
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { portal } = context.query
  // ex. https://votre-front.com/account?portal=success
  let message
  if (portal === "success") {
    message = "Vous êtes de retour après votre session de gestion d'abonnement."
  }
  return { props: { message: message || null } }
}
