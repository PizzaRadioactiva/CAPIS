import { Resend } from "resend";
import { env } from "../lib/env";
import { ApiError } from "../lib/ApiError";

let client: Resend | null = null;

function getClient(): Resend {
  if (!env.RESEND_API_KEY) {
    throw ApiError.badRequest(
      "El envío de emails no está configurado. Definí RESEND_API_KEY en las variables de entorno."
    );
  }
  if (!client) {
    client = new Resend(env.RESEND_API_KEY);
  }
  return client;
}

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const resend = getClient();
  const { to, subject, html } = params;

  if (!to) {
    throw ApiError.badRequest("No hay un email de destino configurado");
  }

  const { data, error } = await resend.emails.send({
    from: `CAPS Stock <${env.RESEND_FROM_EMAIL}>`,
    to: [to],
    subject,
    html,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[RESEND ERROR]", error);
    throw ApiError.internal("No se pudo enviar el email. Intentá nuevamente más tarde.");
  }

  return data;
}
