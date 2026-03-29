import { Resend } from 'resend';
import { env } from '../config/env';

// Init resend
const resend = new Resend(env.RESEND_SECRET);

export async function sendVerificationEmail(code: string) {
  const { error } = await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: ['msssarib12@gmail.com'],
    template: {
      id: 'verification-template',
      variables: {
        CODE: code,
      },
    },
  });

  if (error) {
    console.log('Error while sending email', error);
    throw new Error('Something went wrong while sending email');
  }
}
