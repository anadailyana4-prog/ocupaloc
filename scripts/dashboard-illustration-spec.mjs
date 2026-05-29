/**
 * Prompt APIYI — ilustrație /dashboard (paletă light = globals.css + lux-card).
 */

export const DASHBOARD_PALETTE = {
  pageBg: "#F8F6F1",
  pageText: "#1E293B",
  accentTeal: "#0F766E",
  navMuted: "#64748B",
  borderLight: "#E2E8F0",
  cardBg: "#FFFFFF",
  cardBorder: "#E2E8F0",
  tealSoft: "#EEF7F6",
  kpiLabel: "#64748B",
  kpiNumber: "#1E293B",
  kpiSub: "#64748B",
  pendingNumber: "#EA580C",
  semaforGreen: "#10B981",
  filterActiveBg: "#FCD34D",
  filterActiveText: "#0F172A",
  filterInactiveBorder: "#E2E8F0",
  filterInactiveText: "#64748B",
  formPanelBg: "#FFFFFF",
  formPanelBorder: "#E2E8F0",
  inputBg: "#FFFFFF",
  inputBorder: "#E2E8F0",
  inputText: "#1E293B",
  labelMuted: "#64748B",
  tableHeadBg: "#EEF7F6",
  tableHeadText: "#64748B",
  tableRowBorder: "#E2E8F0",
  tableCellText: "#1E293B",
  statusConfirmBg: "#ECFDF5",
  statusConfirmText: "#047857",
  statusConfirmBorder: "#6EE7B7",
  btnFinalizeBg: "#047857",
  btnCancelText: "#DC2626",
  todayTileBorder: "#FCD34D",
  todayTileBg: "#FFFBEB",
  todayDayText: "#B45309",
  dayWithBookingsBorder: "rgba(15,118,110,0.25)",
  dayWithBookingsBg: "#EEF7F6",
  dayOpenBorder: "#E2E8F0",
  dayOpenBg: "#FFFFFF",
  dayLabelMuted: "#64748B",
  dayCountText: "#1E293B",
};

export const DASHBOARD_PALETTE_BLOCK = Object.entries(DASHBOARD_PALETTE)
  .map(([k, v]) => `${k}=${v}`)
  .join(", ");

export const DASHBOARD_ILLUSTRATION_PROMPT = `
Create a sharp static UI illustration — OcupaLoc salon dashboard (/dashboard). Flat 2D product screenshot, 1536×1024, NO laptop, NO hands, NO 3D, NO photo background.

LIGHT THEME ONLY — cream page ${DASHBOARD_PALETTE.pageBg}, white cards ${DASHBOARD_PALETTE.cardBg}, teal titles ${DASHBOARD_PALETTE.accentTeal}. FORBIDDEN: dark zinc/slate panels, neon green semafor on calendar, one mega dark box around KPIs, gold #D4AF37.

COLORS — use ONLY:
${DASHBOARD_PALETTE_BLOCK}

=== WEEK DAY TILES (centered column in each tile) ===
Each of 7 tiles = small vertical white/teal-tinted card on cream. flex-col items-center text-center.
Stack TOP to BOTTOM, all centered:
  line1: Du, Lu, Ma… (10px uppercase ${DASHBOARD_PALETTE.dayLabelMuted})
  line2: dd.MM (10px)
  line3: count bold 16px ${DASHBOARD_PALETTE.dayCountText} or "—"
  line4: "prog." 9px only if count > 0

FORBIDDEN: Jo top-left + count bottom-right, diagonal text, green dots on day tiles, dark-tinted week cards.

Tile styles on ${DASHBOARD_PALETTE.pageBg}:
- Today Lu: border ${DASHBOARD_PALETTE.todayTileBorder} bg ${DASHBOARD_PALETTE.todayTileBg}
- With bookings Ma/Jo: border ${DASHBOARD_PALETTE.dayWithBookingsBorder} bg ${DASHBOARD_PALETTE.dayWithBookingsBg}
- Open empty Mi/Vi: border ${DASHBOARD_PALETTE.dayOpenBorder} bg ${DASHBOARD_PALETTE.dayOpenBg}, count 0
- Closed Du/Sâ: opacity 40%, count "—"

Example Jo (centered):
    Jo
   22.05
    4
  prog.

=== HEADER (marketing — no auth) ===
Cream ${DASHBOARD_PALETTE.pageBg}, border-bottom ${DASHBOARD_PALETTE.borderLight}.
Logo "OcupaLoc" ${DASHBOARD_PALETTE.accentTeal} semibold 14px.
Nav ${DASHBOARD_PALETTE.navMuted}: Acasă, Servicii, Program, Billing, Pagină publică, Previzualizare, Setări.
Right side EMPTY. FORBIDDEN: Ieși din cont, Login, Înapoi, onboarding checklist.

=== REZUMAT OPERAȚIONAL — on cream, six separate WHITE cards ===
Title "Rezumat operațional" Cormorant Garamond ${DASHBOARD_PALETTE.accentTeal} on cream (NOT amber on dark).
Subtitle ${DASHBOARD_PALETTE.kpiSub} "KPI operaționali pentru ultimele 7 zile."

Six separate lux-cards in one row, gap 16px, cream visible between:
rounded-2xl, border ${DASHBOARD_PALETTE.cardBorder}, bg ${DASHBOARD_PALETTE.cardBg}, subtle shadow.

Card1 Locuri disponibile: ONLY here a small 12px green dot ${DASHBOARD_PALETTE.semaforGreen} left of label. Text + sub, no big number.
Card2 Programări (7 zile): number 12 ${DASHBOARD_PALETTE.kpiNumber}, label ${DASHBOARD_PALETTE.kpiLabel}.
Card3 În așteptare (7z): number 2 ${DASHBOARD_PALETTE.pendingNumber}.
Card4 Reminder-e trimise azi: 5.
Card5 Rată confirmare client (7z): 85%.
Card6 Anulări client (7z): 0.

Label "Săptămâna în curs" uppercase ${DASHBOARD_PALETTE.kpiLabel}.
Week: Du18.05—, Lu19.05 today amber tint 2 prog, Ma20.05 teal tint 1 prog, Mi21.05 0, Jo22.05 centered 4 prog, Vi23.05 0, Sâ24.05—.

=== PROGRAMĂRI ===
Title ${DASHBOARD_PALETTE.pageText}. Subtitle ${DASHBOARD_PALETTE.kpiSub}.
Buttons: + Programare manuală amber gradient; pill Azi active ${DASHBOARD_PALETTE.filterActiveBg}; Viitoare/Toate outline ${DASHBOARD_PALETTE.filterInactiveBorder}; Export CSV outline.

Filter panel white ${DASHBOARD_PALETTE.formPanelBg} border ${DASHBOARD_PALETTE.formPanelBorder}:
labels ${DASHBOARD_PALETTE.labelMuted}; inputs white; Aplică filtrele amber pill.

TABLE exactly 8 columns: Data, Ora, Client, Telefon, Serviciu, Notițe, Status, Acțiuni.
Thead ${DASHBOARD_PALETTE.tableHeadBg}, text ${DASHBOARD_PALETTE.tableHeadText}.
Tbody rows on white/cream, border ${DASHBOARD_PALETTE.tableRowBorder}.
3 sample rows 20.05.2026. Status pill ${DASHBOARD_PALETTE.statusConfirmBg} ${DASHBOARD_PALETTE.statusConfirmText}.
Actions: Anulează red outline; Marchează finalizat ${DASHBOARD_PALETTE.btnFinalizeBg} white text; Neprezent orange outline.

FORBIDDEN: Specialist, Plată, date range picker, dark KPI panel, MacBook, English UI.
Romanian diacritics: ă â î ș ț. Sâ not Să.
`.trim();
