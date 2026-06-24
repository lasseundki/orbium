export type ContactStatus   = 'lead' | 'aktiv' | 'inaktiv' | 'vip';
export type ContactPriority = 'hoch' | 'mittel' | 'niedrig';
export type InteractionType = 'anruf' | 'email' | 'treffen' | 'nachricht' | 'sonstiges';
export type InteractionOutcome = 'positiv' | 'neutral' | 'negativ';
export type PipelineStage   = 'lead' | 'kontakt' | 'praesentation' | 'angebot' | 'abschluss';
export type ReminderStatus  = 'offen' | 'erledigt' | 'uebersprungen';
export type TriggerType     = 'status_change' | 'stage_change' | 'manual';

export interface SequenceStep {
  id:         string;
  offsetDays: number;
  message:    string;
}

export interface Contact {
  id:              string;
  name:            string;
  phone?:          string;
  email?:          string;
  company?:        string;
  role?:           string;
  socialMedia?:    string;
  city?:           string;
  country?:        string;
  language?:       string;
  age?:            number;
  profession?:     string;
  strengths?:      string;
  needs?:          string;
  birthday?:       number;
  category:        string[];
  priority:        ContactPriority;
  status:          ContactStatus;
  referredBy?:     string;
  source?:         string;
  notes?:          string;
  createdAt:       number;
  updatedAt:       number;
  statusChangedAt?: number;
}

export interface Interaction {
  id:            string;
  contactId:     string;
  date:          number;
  type:          InteractionType;
  summary:       string;
  outcome:       InteractionOutcome;
  nextAction?:   string;
  nextActionDue?: number;
}

export interface Pipeline {
  id:             string;
  contactId:      string;
  project:        string;
  stage:          string;
  stageChangedAt: number;
  notes?:         string;
  updatedAt:      number;
}

export interface ReminderSequence {
  id:            string;
  name:          string;
  triggerType:   TriggerType;
  triggerValue:  string;
  project?:      string;
  tagFilter?:    string;
  isActive:      boolean;
  steps:         SequenceStep[];
  createdAt:     number;
}

export interface ScheduledReminder {
  id:              string;
  contactId:       string;
  contactName:     string;
  sequenceId?:     string;
  sequenceName?:   string;
  stepNumber?:     number;
  dueDate:         number;
  message:         string;
  status:          ReminderStatus;
  isManual?:       boolean;
  completedAt?:    number;
}
