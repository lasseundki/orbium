import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { ReminderSequence, ScheduledReminder } from '../types/index';

export async function triggerSequences(params: {
  uid: string;
  contactId: string;
  contactName?: string;
  triggerType: 'status_change' | 'stage_change';
  triggerValue: string;
  project?: string;
  contactCategories?: string[];
  referenceDate?: number;
}): Promise<number> {
  const {
    uid, contactId, contactName = '',
    triggerType, triggerValue,
    project, contactCategories = [],
    referenceDate = Date.now(),
  } = params;

  const seqCol = collection(db, 'users', uid, 'reminderSequences');
  const q = query(
    seqCol,
    where('isActive', '==', true),
    where('triggerType', '==', triggerType),
    where('triggerValue', '==', triggerValue),
  );
  const snap = await getDocs(q);

  let created = 0;
  const remCol = collection(db, 'users', uid, 'scheduledReminders');

  for (const seqDoc of snap.docs) {
    const seq = { id: seqDoc.id, ...seqDoc.data() } as ReminderSequence;

    if (seq.tagFilter) {
      const tag = seq.tagFilter.toLowerCase();
      if (!contactCategories.some(c => c.toLowerCase().includes(tag))) continue;
    }
    if (project && seq.project && seq.project !== project) continue;

    for (let i = 0; i < seq.steps.length; i++) {
      const step = seq.steps[i];
      const dueDate = new Date(referenceDate);
      dueDate.setDate(dueDate.getDate() + step.offsetDays);
      dueDate.setHours(0, 0, 0, 0);

      const reminder: Omit<ScheduledReminder, 'id'> = {
        contactId,
        contactName,
        sequenceId: seq.id,
        sequenceName: seq.name,
        stepNumber: i + 1,
        dueDate: dueDate.getTime(),
        message: step.message,
        status: 'offen',
      };
      await addDoc(remCol, reminder);
      created++;
    }
  }

  return created;
}

export const DEFAULT_SEQUENCES: Omit<ReminderSequence, 'id' | 'createdAt'>[] = [
  {
    name: '30-Tage-Betreuung AWAQE',
    triggerType: 'status_change',
    triggerValue: 'aktiv',
    tagFilter: 'awaqe',
    isActive: true,
    steps: [
      { id: '1', offsetDays: 1,  message: "Begrüßungsnachricht senden + Einnahmeplan + Trinkmenge erklären. Satz: 'Ich begleite dich die ersten 30 Tage, damit du das beste Ergebnis bekommst.'" },
      { id: '2', offsetDays: 2,  message: "Check-in: Alles angekommen? Erste Einnahme okay?" },
      { id: '3', offsetDays: 3,  message: "Check-in: Wie fühlst du dich? Erste Fragen beantworten." },
      { id: '4', offsetDays: 7,  message: "Woche 1 abschließen: Motivation geben, erste kleine Erfolge feiern. Kunden in Support-Gruppe einladen (optional)." },
      { id: '5', offsetDays: 10, message: "Woche 2: Nachfragen zu Schlaf, Energie, Haut, Verdauung, Wohlbefinden." },
      { id: '6', offsetDays: 14, message: "Woche 2 abschließen: Vergleichsfoto anfragen. Erste Story sammeln. Zweites Produkt empfehlen falls passend." },
      { id: '7', offsetDays: 18, message: "Woche 3: Produktwissen vertiefen. Empfehlungen ansprechen: 'Kennst du jemanden mit ähnlichen Zielen?'" },
      { id: '8', offsetDays: 21, message: "Woche 3 abschließen: Kundenstory dokumentieren. Beziehung stärken." },
      { id: '9', offsetDays: 25, message: "WICHTIG – Nachbestellung vorbereiten! Fragen: 'Willst du weiter machen?' Bestellung rechtzeitig auslösen." },
      { id: '10', offsetDays: 30, message: "Abschluss 30 Tage: Ergebnis feiern. 'Kennst du jemanden mit ähnlichen Zielen?' Begeisterte Kunden als potenzielle Partner markieren." },
    ],
  },
  {
    name: 'Neuer Partner (AWAQE)',
    triggerType: 'stage_change',
    triggerValue: 'abschluss',
    project: 'awaqe',
    isActive: true,
    steps: [
      { id: '1', offsetDays: 1,  message: "Partner-Onboarding: Eigene Produkte nutzen lassen. Eigene Story dokumentieren starten." },
      { id: '2', offsetDays: 7,  message: "Woche 1 Check: 10-20 Kontakte für Kundenliste erarbeitet? 3-5 erste Kunden?" },
      { id: '3', offsetDays: 14, message: "Woche 2: 1-2 Kunden gemeinsam betreuen. Erste Ergebnisse sammeln. Social Proof posten." },
      { id: '4', offsetDays: 21, message: "Woche 3: Eigenes Mini-Onboarding lernen. Ersten neuen Partner einschreiben?" },
      { id: '5', offsetDays: 30, message: "Woche 4: Monatliches Ziel setzen. Kunden verlängern. Partner aktivieren." },
    ],
  },
  {
    name: 'Neuer Lead',
    triggerType: 'status_change',
    triggerValue: 'lead',
    isActive: true,
    steps: [
      { id: '1', offsetDays: 2,  message: "Follow-up: Hat er/sie die Infos gelesen? Fragen?" },
      { id: '2', offsetDays: 7,  message: "Zweiter Versuch: Interesse noch da? Anderen Einstieg versuchen." },
      { id: '3', offsetDays: 14, message: "Letzter Versuch: Offen ansprechen oder auf inaktiv setzen." },
    ],
  },
  {
    name: 'Nach Präsentation',
    triggerType: 'stage_change',
    triggerValue: 'praesentation',
    isActive: true,
    steps: [
      { id: '1', offsetDays: 1, message: "Follow-up nach Präsentation: Eindrücke? Offene Fragen?" },
      { id: '2', offsetDays: 3, message: "Zweites Nachfassen: Entscheidung schon gefallen?" },
      { id: '3', offsetDays: 7, message: "Entscheidungs-Push: Verbindliches Gespräch anfragen oder Stage auf 'Angebot' setzen." },
    ],
  },
  {
    name: 'Preply-Schüler',
    triggerType: 'status_change',
    triggerValue: 'aktiv',
    tagFilter: 'preply',
    isActive: true,
    steps: [
      { id: '1', offsetDays: 7,  message: "Erste Woche: Wie läuft der Unterricht? Feedback einholen." },
      { id: '2', offsetDays: 30, message: "Monatsgespräch: Fortschritte? Ziele für nächsten Monat setzen." },
    ],
  },
];
