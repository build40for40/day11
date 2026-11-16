export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
}

/** Ben has not picked a provider. Resend is only an example in the architecture notes. */
export interface EmailSender {
  send(message: OutboundEmail): Promise<void>;
}

export class ConsoleEmail implements EmailSender {
  readonly sent: OutboundEmail[] = [];

  constructor(private readonly printBodies: boolean) {}

  async send(message: OutboundEmail): Promise<void> {
    this.sent.push(message);
    if (this.printBodies) {
      console.log(`email to ${message.to}: ${message.subject}\n${message.text}`);
    } else {
      console.log(`email queued for ${message.to}: ${message.subject}`);
    }
  }
}

export class ResendEmail implements EmailSender {
  constructor(private readonly apiKey: string) {}

  async send(message: OutboundEmail): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Glisten <setup@wish.local>",
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    });
    if (!response.ok) throw new Error(`email send failed (${response.status})`);
  }
}

export function emailSender(env: { EMAIL_PROVIDER?: string; EMAIL_API_KEY?: string; EMAIL_DEV_PRINT?: string }): EmailSender {
  if (env.EMAIL_PROVIDER === "resend" && env.EMAIL_API_KEY) return new ResendEmail(env.EMAIL_API_KEY);
  return new ConsoleEmail(env.EMAIL_DEV_PRINT === "1");
}
