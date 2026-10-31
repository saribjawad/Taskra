import { Resend } from 'resend';
import { env } from '../config/env';

// Init resend
const resend = new Resend(env.RESEND_SECRET);

export async function sendVerificationEmail(code: string, email: string) {
  const { error } = await resend.emails.send({
    from: env.RESEND_EMAIL_FROM,
    to: [email],
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

export async function sendResetPasswordLinkEmail(link: string, email: string) {
  const { error } = await resend.emails.send({
    from: env.RESEND_EMAIL_FROM,
    to: [email],
    template: {
      id: 'reset-password-link-template',
      variables: {
        RESET_LINK: link,
      },
    },
  });

  if (error) {
    console.log('Error while sending email', error);
    throw new Error('Something went wrong while sending email');
  }
}

export async function sendInviteToWorkspace(
  inviterName: string,
  workspaceName: string,
  link: string,
  email: string,
) {
  const { error } = await resend.emails.send({
    from: env.RESEND_EMAIL_FROM,
    to: [email],
    template: {
      id: 'workspace-invitation',
      variables: {
        INVITER_NAME: inviterName,
        WORKSPACE_NAME: workspaceName,
        INVITE_LINK: link,
      },
    },
  });

  if (error) {
    console.log('Error while sending email', error);
    throw new Error('Something went wrong while sending email');
  }
}
