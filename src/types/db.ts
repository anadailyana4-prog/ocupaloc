export type ProfesionistRow = {
  id: string;
  user_id: string;
  nume_business: string;
  tip_activitate: string;
  slug: string;
  logo_url: string | null;
  telefon: string | null;
  /** Text public pe /[slug] (migrare 010) */
  description?: string | null;
  email_contact: string | null;
  lucreaza_acasa: boolean;
  adresa_publica: string | null;
  mesaj_dupa_programare: string;
  program: Record<string, unknown>;
  pauza_intre_clienti: number;
  timp_pregatire: number;
  notificari_email_nou: boolean;
  onboarding_pas: number;
  created_at: string;
};

export type ServiciuRow = {
  id: string;
  profesionist_id: string;
  nume: string;
  descriere: string | null;
  pret: number;
  durata_minute: number;
  culoare: string;
  activ: boolean;
  ordine: number;
  created_at: string;
};

export type ProgramareRow = {
  id: string;
  profesionist_id: string;
  serviciu_id: string;
  nume_client: string;
  telefon_client: string;
  email_client: string | null;
  data_start: string;
  data_final: string;
  status: string;
  observatii: string | null;
  creat_de: string;
  created_at: string;
};

export type ClientBlocatRow = {
  id: string;
  profesionist_id: string;
  telefon: string;
  nume: string | null;
  motiv: string | null;
  created_at: string;
};
