import AfricasTalking from 'africastalking';
import { config } from '../../config/env';

const at  = AfricasTalking({
  apiKey:   config.AT.API_KEY,
  username: config.AT.USERNAME,
});

const sms = at.SMS;

export interface SendSMSResult {
  success:    boolean;
  messageId?: string;
  error?:     string;
}

function normalisePhone(phone: string): string {
  // Remove hyphens, spaces, parentheses
  // +234-815-094-5468 → +2348150945468
  return phone.replace(/[-\s()]/g, '');
}

export async function sendSMS(
  to:      string,
  message: string,
): Promise<SendSMSResult> {
  try {
    const normalisedTo = normalisePhone(to);

    const opts: any = {
      to:      [normalisedTo],
      message,
    };
    if (config.AT.SENDER_ID) opts.from = config.AT.SENDER_ID;

    const response  = await sms.send(opts);
    const recipient = response.SMSMessageData?.Recipients?.[0];

    if (recipient?.status === 'Success') {
      return { success: true, messageId: recipient.messageId };
    }

    return {
      success: false,
      error:   recipient?.status ?? 'Unknown AT error',
    };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'SMS send failed' };
  }
}
