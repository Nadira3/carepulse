import { config } from '../../config/env';

export interface VoiceCallResult {
  success: boolean;
  callId?:  string;
  error?:   string;
}

export async function makeVoiceCall(
  to:      string,
  message: string,
): Promise<VoiceCallResult> {
  // Voice calls require a dedicated AT virtual number (Nigerian caller ID).
  // Feature is pending number registration.
  // TODO: uncomment AT Voice implementation once number is provisioned.
  console.log(`[VoiceClient] Voice call to ${to} — feature pending AT number registration`);
  console.log(`[VoiceClient] Message that would be delivered: ${message}`);

  return {
    success: false,
    error:   'VOICE_PENDING_REGISTRATION',
  };
}

/*
REAL IMPLEMENTATION — uncomment when AT virtual number is ready:

import AfricasTalking from 'africastalking';

const at    = AfricasTalking({
  apiKey:   config.AT.API_KEY,
  username: config.AT.USERNAME,
});
const voice = at.VOICE;

export async function makeVoiceCall(
  to:      string,
  message: string,
): Promise<VoiceCallResult> {
  try {
    const response = await voice.call({
      callTo:   to,
      callFrom: config.AT.CALLER_ID, // your registered AT number
    });

    // Store message for voice XML callback
    // AT calls your webhook, you respond with XML that says the message
    return {
      success: true,
      callId:  response?.entries?.[0]?.sessionId,
    };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Voice call failed' };
  }
}
*/
