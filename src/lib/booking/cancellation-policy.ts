/**
 * Generates cancellation/reschedule policy text based on cancellation window.
 * Used in booking UI and email templates.
 */
export function generateCancellationPolicy(cancelWindowDays: number | null | undefined): string {
  const window = cancelWindowDays && cancelWindowDays > 0 ? Math.max(1, Math.min(365, cancelWindowDays)) : 60;
  
  // Convert days to hours for display
  const hours = window * 24;
  
  return `Poți reschedula sau anula gratuit până în ${hours} ore înainte de programare.`;
}

export function getCancellationPolicyForProfessional(smartCancelWindowDays: number | null | undefined): string {
  return generateCancellationPolicy(smartCancelWindowDays);
}
