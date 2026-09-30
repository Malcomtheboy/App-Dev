// Local calendar date, not UTC — startOfWeek/addDays below do their day math
// in local time (setDate/setHours), so this has to match or dates drift by a
// day near midnight depending on the device's timezone offset.
export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Monday as the start of the week, matching the M T W T F S S order already
// used for the weekly charts on Home and Progress.
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// How many days of the current week (Mon..today, inclusive) have happened so far.
export function daysElapsedThisWeek(date: Date): number {
  return Math.floor((date.getTime() - startOfWeek(date).getTime()) / 86_400_000) + 1;
}
