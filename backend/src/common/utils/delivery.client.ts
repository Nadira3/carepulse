import { sendSMS } from './africastalking.client';
import { makeVoiceCall } from './africastalking.voice';

export interface DeliveryResult {
  success:   boolean;
  messageId?: string;
  callId?:    string;
  channel:   'SMS' | 'VOICE';
  error?:    string;
}

export async function deliverMessage(
  phone:   string,
  message: string,
  channel: 'SMS' | 'VOICE' | string,
): Promise<DeliveryResult> {
  if (channel === 'VOICE') {
    const result = await makeVoiceCall(phone, message);

    // Graceful fallback to SMS when voice is pending registration
    if (!result.success && result.error === 'VOICE_PENDING_REGISTRATION') {
      console.log(`[Delivery] Voice pending — falling back to SMS for ${phone}`);
      const smsResult = await sendSMS(phone, message);
      return {
        ...smsResult,
        channel:  'SMS',
        callId:   undefined,
      };
    }

    return {
      success: result.success,
      callId:  result.callId,
      channel: 'VOICE',
      error:   result.error,
    };
  }

  // Default: SMS
  const result = await sendSMS(phone, message);
  return {
    ...result,
    channel: 'SMS',
  };
}
