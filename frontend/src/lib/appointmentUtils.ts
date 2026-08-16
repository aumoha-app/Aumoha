export function isAppointmentExpired(appt: { date?: string; time?: string }): boolean {
  if (!appt || !appt.date || !appt.time) return false;

  try {
    const now = new Date();
    let apptYear = now.getFullYear();
    let apptMonth = now.getMonth();
    let apptDay = now.getDate();

    const dStr = appt.date.trim().toLowerCase();

    if (dStr === 'today' || dStr === 'daily') {
      // Keep today's date
    } else if (dStr === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      apptYear = tomorrow.getFullYear();
      apptMonth = tomorrow.getMonth();
      apptDay = tomorrow.getDate();
    } else {
      // Standard ISO format e.g. '2026-08-16'
      const isoMatch = appt.date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (isoMatch) {
        apptYear = parseInt(isoMatch[1], 10);
        apptMonth = parseInt(isoMatch[2], 10) - 1;
        apptDay = parseInt(isoMatch[3], 10);
      } else {
        // Month name + Day e.g. 'Aug 16' or 'August 16'
        const monthDayMatch = appt.date.match(/^([a-z]+)\s+(\d{1,2})/i);
        if (monthDayMatch) {
          const monthStr = monthDayMatch[1].toLowerCase();
          apptDay = parseInt(monthDayMatch[2], 10);

          const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          const mIdx = monthNames.findIndex(m => monthStr.startsWith(m));
          if (mIdx !== -1) {
            apptMonth = mIdx;
          }
          apptYear = now.getFullYear();
        } else {
          // Fallback parsing with explicit current year appended
          const yearInStr = appt.date.match(/\d{4}/);
          const dateToParse = yearInStr ? appt.date : `${appt.date} ${now.getFullYear()}`;
          const parsedDate = new Date(dateToParse);
          if (!isNaN(parsedDate.getTime())) {
            apptYear = parsedDate.getFullYear();
            apptMonth = parsedDate.getMonth();
            apptDay = parsedDate.getDate();
          }
        }
      }
    }

    const timeMatch = appt.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!timeMatch) return false;

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const apptDateTime = new Date(apptYear, apptMonth, apptDay, hours, minutes, 0, 0);

    // Session expires 1 hour after scheduled start time
    const expirationTime = new Date(apptDateTime.getTime() + 60 * 60 * 1000);
    return now > expirationTime;
  } catch (err) {
    console.error('Error checking appointment expiration:', err);
  }

  return false;
}

export function isSlotTimePast(slotTimeStr: string, selectedDateNum?: number): boolean {
  if (!slotTimeStr) return false;

  const now = new Date();
  const todayNum = now.getDate();

  if (selectedDateNum && selectedDateNum !== todayNum) {
    if (selectedDateNum > todayNum || (todayNum > 25 && selectedDateNum < 7)) {
      return false;
    }
  }

  const match = slotTimeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return false;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  const slotDateTime = new Date();
  slotDateTime.setHours(hours, minutes, 0, 0);

  return now > slotDateTime;
}

export function getAppointmentDisplayStatus(appt: any): { label: string; statusClass: string; isExpired: boolean } {
  if (!appt) return { label: 'UNKNOWN', statusClass: 'bg-stone-100 text-stone-600 border-stone-200', isExpired: false };

  const rawStatus = (appt.status || '').toLowerCase();
  const expired = isAppointmentExpired(appt);

  if (rawStatus === 'cancelled') {
    return {
      label: 'CANCELLED',
      statusClass: 'bg-rose-50 text-rose-600 border-rose-200',
      isExpired: expired
    };
  }

  if (rawStatus === 'completed' || expired) {
    return {
      label: 'HAPPENED',
      statusClass: 'bg-slate-100 text-slate-700 border-slate-300 font-extrabold',
      isExpired: true
    };
  }

  return {
    label: appt.status ? appt.status.toUpperCase() : 'CONFIRMED',
    statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    isExpired: false
  };
}
