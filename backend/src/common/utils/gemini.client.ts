import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env';

const genAI  = new GoogleGenerativeAI(config.GEMINI.API_KEY);
const model  = genAI.getGenerativeModel({ model: config.GEMINI.MODEL });

export interface ReminderContext {
  patientName:  string;
  language:     string;
  disease:      string;
  drugName?:    string;
  dose?:        string;
  frequency?:   string;
  reminderType: 'MEDICATION' | 'APPOINTMENT' | 'LIFESTYLE';
  appointmentDate?: string;
  appointmentLocation?: string;
}

export async function generateReminderMessage(ctx: ReminderContext): Promise<string> {
  const languageInstruction = ctx.language === 'Pidgin English'
    ? 'Write in Nigerian Pidgin English. Use warm, friendly, conversational Pidgin.'
    : 'Write in clear, simple English suitable for a patient SMS.';

  let prompt: string;

  if (ctx.reminderType === 'MEDICATION') {
    prompt = `You are a compassionate healthcare reminder system for CarePulse, a Nigerian chronic disease management platform.

Generate a brief, warm SMS medication reminder for a patient.

Patient name: ${ctx.patientName}
Condition: ${ctx.disease}
Medication: ${ctx.drugName} ${ctx.dose}
Frequency: ${ctx.frequency}
Language: ${languageInstruction}

Requirements:
- Maximum 160 characters (one SMS)
- Include patient name
- Mention the medication
- End with: Reply CONFIRM when taken or SNOOZE for 1 hour
- Be empathetic, not clinical
- No hashtags, no emojis

Return ONLY the SMS message text. Nothing else.`;

  } else if (ctx.reminderType === 'APPOINTMENT') {
    prompt = `You are a compassionate healthcare reminder system for CarePulse, a Nigerian chronic disease management platform.

Generate a brief appointment reminder SMS.

Patient name: ${ctx.patientName}
Condition: ${ctx.disease}
Appointment: ${ctx.appointmentDate}
Location: ${ctx.appointmentLocation ?? 'the clinic'}
Language: ${languageInstruction}

Requirements:
- Maximum 160 characters
- Include patient name and date
- End with: Reply CONFIRM to confirm or RESCHEDULE to reschedule
- Be warm and encouraging

Return ONLY the SMS message text. Nothing else.`;

  } else {
    prompt = `You are a compassionate healthcare advisor for CarePulse, a Nigerian chronic disease management platform.

Generate a brief, encouraging lifestyle health tip SMS for a patient who needs support with medication adherence.

Patient name: ${ctx.patientName}
Condition: ${ctx.disease}
Language: ${languageInstruction}

Requirements:
- Maximum 160 characters
- Include patient name
- Give one specific, actionable tip for managing ${ctx.disease}
- Be warm, encouraging, not judgmental
- No medical jargon

Return ONLY the SMS message text. Nothing else.`;
  }

  const result   = await model.generateContent(prompt);
  const response = result.response;
  const text     = response.text().trim();

  // Strip any quotes Gemini sometimes wraps around the message
  return text.replace(/^["']|["']$/g, '');
}
