import { formatInTimeZone } from "date-fns-tz";

import { normalizeRoPhone } from "@/lib/phone";

const TZ = "Europe/Bucharest";

export type SmsProvider = "twilio" | "messagebird";

export type ReminderSmsInput = {
  clientPhone: string;
  salonName: string;
  serviceName: string;
  startsAt: Date;
  sender?: string | null;
  provider: SmsProvider;
};

function twilioAuthHeader(accountSid: string, authToken: string): string {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

export function buildReminderSmsText(input: { salonName: string; serviceName: string; startsAt: Date; type: "24h" | "2h" | "morning" }): string {
  const data = formatInTimeZone(input.startsAt, TZ, "dd.MM.yyyy");
  const ora = formatInTimeZone(input.startsAt, TZ, "HH:mm");
  const lead = input.type === "24h" ? "Reminder: ai programare maine." : "Reminder: ai programare in curand.";
  return `${lead} ${input.salonName} - ${input.serviceName}, ${data} ${ora}.`;
}

async function sendWithTwilio(input: ReminderSmsInput, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  const defaultFrom = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!accountSid || !authToken) {
    return false;
  }

  const to = normalizeRoPhone(input.clientPhone);
  if (!to) {
    return false;
  }

  const form = new URLSearchParams();
  form.set("To", to);
  form.set("Body", message);
  if (messagingServiceSid) {
    form.set("MessagingServiceSid", messagingServiceSid);
  } else {
    const from = input.sender?.trim() || defaultFrom;
    if (!from) {
      return false;
    }
    form.set("From", from);
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: twilioAuthHeader(accountSid, authToken),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString()
  });

  return res.ok;
}

async function sendWithMessageBird(input: ReminderSmsInput, message: string): Promise<boolean> {
  const apiKey = process.env.MESSAGEBIRD_API_KEY?.trim();
  const defaultOriginator = process.env.MESSAGEBIRD_ORIGINATOR?.trim();
  if (!apiKey) {
    return false;
  }

  const to = normalizeRoPhone(input.clientPhone);
  if (!to) {
    return false;
  }

  const originator = input.sender?.trim() || defaultOriginator;
  if (!originator) {
    return false;
  }

  const res = await fetch("https://rest.messagebird.com/messages", {
    method: "POST",
    headers: {
      Authorization: `AccessKey ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      originator,
      recipients: [to],
      body: message
    })
  });

  return res.ok;
}

export async function sendReminderSms(input: ReminderSmsInput, type: "24h" | "2h" | "morning"): Promise<boolean> {
  const message = buildReminderSmsText({
    salonName: input.salonName,
    serviceName: input.serviceName,
    startsAt: input.startsAt,
    type
  });

  if (input.provider === "twilio") {
    return sendWithTwilio(input, message);
  }

  return sendWithMessageBird(input, message);
}
