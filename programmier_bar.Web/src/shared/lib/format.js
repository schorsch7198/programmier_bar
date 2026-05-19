const dateFormat = new Intl.DateTimeFormat(navigator.language, {
  dateStyle: 'medium',
  timeStyle: 'short',
  hour12: false,
});

export function formatDate(d) {
  try {
    if (!d) return '-';
    const parsed = d instanceof Date ? d : new Date(d);
    return isNaN(parsed.getTime()) ? '-' : dateFormat.format(parsed);
  } catch {
    return '-';
  }
}
