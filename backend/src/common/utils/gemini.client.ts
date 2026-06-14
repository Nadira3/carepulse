import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env';

const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
const model  = genAI.getGenerativeModel({ model: config.GEMINI.MODEL });

export interface ReminderContext {
  patientName:         string;
  language:            string;
  disease:             string;
  drugName?:           string;
  dose?:               string;
  frequency?:          string;
  reminderType:        'MEDICATION' | 'APPOINTMENT' | 'LIFESTYLE';
  appointmentDate?:    string;
  appointmentLocation?: string;
}

export async function generateReminderMessage(ctx: ReminderContext): Promise<string> {
  const isPidgin  = ctx.language === 'Pidgin English';
  const isHypertension = ctx.disease.toLowerCase().includes('hypertension');
  const isDiabetes     = ctx.disease.toLowerCase().includes('diabetes');

  let prompt: string;

  if (ctx.reminderType === 'MEDICATION') {
    if (isPidgin && isHypertension) {
      prompt = `Act as a friendly, localized health companion in Nigeria. Write a morning medication reminder for a high blood pressure ("BP") patient, but write it entirely in natural, everyday Nigerian Pidgin English.

The tone should be warm, relatable, and respectful (using words like "Abeg" and "Make we"). It should sound like a caring neighbor or relative checking in, not a rigid doctor. Keep it short, direct, and under 160 characters without any filler. End with: Reply CONFIRM when taken or SNOOZE for 1 hour.

Patient Name: ${ctx.patientName}
Medication Name: ${ctx.drugName} ${ctx.dose}

Return ONLY the SMS message text. Nothing else.`;

    } else if (isPidgin && isDiabetes) {
      prompt = `Act as a warm, community-focused health companion in Nigeria. Write an SMS reminder for a diabetes patient in natural, authentic Nigerian Pidgin English.

Use common local health phrasing like "blood sugar" instead of diabetes. Remind them to use their medication with their food so their body can balance well. Keep it under 160 characters and give me only the text message. End with: Reply CONFIRM when taken or SNOOZE for 1 hour.

Patient Name: ${ctx.patientName}
Action needed: take ${ctx.drugName} ${ctx.dose}

Return ONLY the SMS message text. Nothing else.`;

    } else if (isHypertension) {
      prompt = `Act as a warm, respectful healthcare assistant in Nigeria. Write a brief morning SMS text message reminding a patient with high blood pressure to take their medication today.

The tone should be gentle, polite, and culturally appropriate (using terms like Ma/Sir where appropriate). Keep the message under 160 characters so it fits in a single text message. End with: Reply CONFIRM when taken or SNOOZE for 1 hour.

Patient Name: ${ctx.patientName}
Medication Name: ${ctx.drugName} ${ctx.dose}
Clinic Name: ISTH Irrua

Return ONLY the SMS message text. Nothing else.`;

    } else if (isDiabetes) {
      prompt = `Act as an empathetic and practical medical assistant in Nigeria. Write a short morning SMS reminding a diabetes patient to take their medication.

Make sure the tone is encouraging but firm about keeping a routine. Remind them to take it with their breakfast so their sugar levels stay stable today. Keep it short (under 160 characters). End with: Reply CONFIRM when taken or SNOOZE for 1 hour.

Patient Name: ${ctx.patientName}
Medication Name: ${ctx.drugName} ${ctx.dose}
Clinic Name: ISTH Irrua

Return ONLY the SMS message text. Nothing else.`;

    } else {
      prompt = `Act as a warm, respectful healthcare assistant in Nigeria. Write a brief SMS medication reminder for a chronic disease patient.

The tone should be gentle, polite, and culturally appropriate. Keep the message under 160 characters. End with: Reply CONFIRM when taken or SNOOZE for 1 hour.

Patient Name: ${ctx.patientName}
Condition: ${ctx.disease}
Medication: ${ctx.drugName} ${ctx.dose}

Return ONLY the SMS message text. Nothing else.`;
    }

  } else if (ctx.reminderType === 'APPOINTMENT') {
    if (isDiabetes) {
      prompt = `Act as a respectful, clear-speaking medical secretary for a Nigerian clinic. Write an SMS reminder for a patient with diabetes who has an appointment in 3 days.

The tone should be warm but clear. Explicitly remind them to fast (no food or sweet drinks, only water) from 10:00 PM the night before so the doctor can check their fasting blood sugar accurately. Keep it under 160 characters. End with: Reply CONFIRM to confirm or RESCHEDULE to reschedule.

Patient Name: ${ctx.patientName}
Appointment Date: ${ctx.appointmentDate}
Location: ${ctx.appointmentLocation ?? 'ISTH Irrua'}

Return ONLY the SMS message text. Nothing else.`;

    } else {
      prompt = `Act as a caring, community-minded clinical coordinator at a Nigerian hospital. Write a short SMS reminder for a ${ctx.disease} patient who has a check-up coming up in 3 days.

The tone should be reassuring and relational, framing the visit as a way to stay healthy for their loved ones. Remind them to bring their clinic card and current medications. Keep it under 160 characters. End with: Reply CONFIRM to confirm or RESCHEDULE to reschedule.

Patient Name: ${ctx.patientName}
Appointment Date: ${ctx.appointmentDate}
Location: ${ctx.appointmentLocation ?? 'ISTH Irrua'}

Return ONLY the SMS message text. Nothing else.`;
    }

  } else {
    // LIFESTYLE tips
    if (isHypertension) {
      prompt = `Act as a preventative health expert in Nigeria. Write a weekly health tip SMS focused on helping a hypertensive patient reduce their salt intake.

Focus on hidden salt in standard seasoning cubes (like Maggi, Knorr, or Royco) and processed snacks, and encourage them to use local natural spices (like iru, crayfish, ginger, and garlic) to flavor food instead. The tone should be wise, supportive, and practical. Keep it under 320 characters.

Patient Name: ${ctx.patientName}
${isPidgin ? 'Write in natural Nigerian Pidgin English.' : 'Write in clear simple English.'}

Return ONLY the SMS message text. Nothing else.`;

    } else if (isDiabetes) {
      prompt = `Act as an expert doctor who understands traditional Nigerian diets and lifestyle habits. Write a weekly health tip SMS for a patient living with diabetes.

Focus the tip on managing heavy traditional swallows (like eba, pounded yam, or white garri), suggesting portion control, adding local vegetables (like ugwu or waterleaf), and avoiding sweet malt drinks. The tone should be educational, practical, and highly encouraging. Keep it under 320 characters.

Patient Name: ${ctx.patientName}
${isPidgin ? 'Write in natural Nigerian Pidgin English.' : 'Write in clear simple English.'}

Return ONLY the SMS message text. Nothing else.`;

    } else {
      prompt = `Act as a caring community health worker in Nigeria. Write a weekly lifestyle health tip for a chronic disease patient.

The tip should be practical, culturally appropriate, and focus on diet, exercise, or medication adherence. Keep it under 320 characters. Be warm and encouraging.

Patient Name: ${ctx.patientName}
Condition: ${ctx.disease}
${isPidgin ? 'Write in natural Nigerian Pidgin English.' : 'Write in clear simple English.'}

Return ONLY the SMS message text. Nothing else.`;
    }
  }

  const result   = await model.generateContent(prompt);
  const response = result.response;
  const text     = response.text().trim();

  // Strip any quotes Gemini sometimes wraps around the message
  return text.replace(/^["']|["']$/g, '');
}
