export const APP_TIME_ZONE = "America/Mexico_City";

/* =========================================================
   PARTES DE FECHA/HORA ACTUAL EN CDMX
========================================================= */

export function getAppDateTimeParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

/* =========================================================
   FECHA YYYY-MM-DD
========================================================= */

export function buildAppDateString(
  year: number,
  month: number,
  day: number
) {
  return [
    String(year),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

/* =========================================================
   HOY YYYY-MM-DD
========================================================= */

export function getAppTodayString() {
  const { year, month, day } =
    getAppDateTimeParts();

  return buildAppDateString(
    year,
    month,
    day
  );
}

/* =========================================================
   HORA ACTUAL HH:MM
========================================================= */

export function getAppCurrentTimeString() {
  const { hour, minute } =
    getAppDateTimeParts();

  return `${String(hour).padStart(
    2,
    "0"
  )}:${String(minute).padStart(
    2,
    "0"
  )}`;
}

/* =========================================================
   MINUTOS ACTUALES DEL DÍA
========================================================= */

export function getAppCurrentMinutes() {
  const { hour, minute } =
    getAppDateTimeParts();

  return hour * 60 + minute;
}

/* =========================================================
   SUMAR DÍAS A YYYY-MM-DD
========================================================= */

export function addDaysToAppDate(
  dateValue: string,
  days: number
) {
  const [year, month, day] =
    dateValue
      .split("-")
      .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return buildAppDateString(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

/* =========================================================
   DÍA DE LA SEMANA
   0 domingo ... 6 sábado
========================================================= */

export function getAppWeekday(
  dateValue: string
) {
  const [year, month, day] =
    dateValue
      .split("-")
      .map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  ).getUTCDay();
}

/* =========================================================
   DIFERENCIA DE DÍAS
========================================================= */

export function getDaysUntil(
  dateValue: string
) {
  const today =
    getAppTodayString();

  const [
    todayYear,
    todayMonth,
    todayDay,
  ] = today
    .split("-")
    .map(Number);

  const [
    targetYear,
    targetMonth,
    targetDay,
  ] = dateValue
    .split("-")
    .map(Number);

  const todayUtc = Date.UTC(
    todayYear,
    todayMonth - 1,
    todayDay
  );

  const targetUtc = Date.UTC(
    targetYear,
    targetMonth - 1,
    targetDay
  );

  return Math.round(
    (targetUtc - todayUtc) /
      86_400_000
  );
}

/* =========================================================
   ¿ES HOY?
========================================================= */

export function isAppToday(
  dateValue: string
) {
  return (
    dateValue ===
    getAppTodayString()
  );
}

/* =========================================================
   ¿YA PASÓ?
========================================================= */

export function isAppPastDate(
  dateValue: string
) {
  return (
    getDaysUntil(dateValue) < 0
  );
}

/* =========================================================
   ¿HOY O FUTURO?
========================================================= */

export function isAppTodayOrFuture(
  dateValue: string
) {
  return (
    getDaysUntil(dateValue) >= 0
  );
}

/* =========================================================
   PRÓXIMA OCURRENCIA SEMANAL

   targetWeekday:
   0 domingo
   1 lunes
   2 martes
   ...
========================================================= */

export function getNextWeeklyOccurrence({
  weekday,
  hour = 0,
  minute = 0,
}: {
  weekday: number;
  hour?: number;
  minute?: number;
}) {
  const today =
    getAppTodayString();

  const currentWeekday =
    getAppWeekday(today);

  let difference =
    weekday - currentWeekday;

  if (difference < 0) {
    difference += 7;
  }

  /*
   * Si el evento corresponde a hoy,
   * comprobamos si ya pasó su hora.
   */
  if (difference === 0) {
    const targetMinutes =
      hour * 60 + minute;

    if (
      getAppCurrentMinutes() >=
      targetMinutes
    ) {
      difference = 7;
    }
  }

  return addDaysToAppDate(
    today,
    difference
  );
}

/* =========================================================
   FORMATEAR FECHA
========================================================= */

export function formatAppDate(
  dateValue: string,
  options?: Intl.DateTimeFormatOptions
) {
  const [year, month, day] =
    dateValue
      .split("-")
      .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12,
      0,
      0
    )
  );

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      timeZone: APP_TIME_ZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
      ...options,
    }
  ).format(date);
}

/* =========================================================
   FORMATO LARGO
========================================================= */

export function formatAppDateLong(
  dateValue: string
) {
  return formatAppDate(
    dateValue,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

/* =========================================================
   FORMATO PARA TARJETA
========================================================= */

export function formatAppCardDate(
  dateValue: string
) {
  const weekday = formatAppDate(
    dateValue,
    {
      weekday: "short",
    }
  );

  const day = formatAppDate(
    dateValue,
    {
      day: "numeric",
      month: "short",
    }
  );

  return {
    weekday,
    day,
  };
}

/* =========================================================
   HH:MM → MINUTOS
========================================================= */

export function parseTimeToMinutes(
  value?: string | null
) {
  if (!value) {
    return null;
  }

  const clean =
    value.trim();

  const match =
    clean.match(
      /^(\d{1,2}):(\d{2})/
    );

  if (!match) {
    return null;
  }

  const hour =
    Number(match[1]);

  const minute =
    Number(match[2]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return (
    hour * 60 + minute
  );
}

/* =========================================================
   ¿YA LLEGÓ UNA HORA?
========================================================= */

export function hasAppTimeStarted(
  timeValue?: string | null
) {
  const targetMinutes =
    parseTimeToMinutes(
      timeValue
    );

  if (
    targetMinutes === null
  ) {
    return false;
  }

  return (
    getAppCurrentMinutes() >=
    targetMinutes
  );
}

/* =========================================================
   ¿ESTAMOS ENTRE DOS HORAS?
========================================================= */

export function isAppTimeBetween(
  startTime: string,
  endTime: string
) {
  const start =
    parseTimeToMinutes(
      startTime
    );

  const end =
    parseTimeToMinutes(
      endTime
    );

  if (
    start === null ||
    end === null
  ) {
    return false;
  }

  const current =
    getAppCurrentMinutes();

  return (
    current >= start &&
    current <= end
  );
}

/* =========================================================
   ¿YA INICIÓ EL SERVICIO?
========================================================= */

export function hasServiceStarted({
  serviceDate,
  serviceTime,
}: {
  serviceDate: string;
  serviceTime?: string | null;
}) {
  const daysAway =
    getDaysUntil(
      serviceDate
    );

  if (daysAway < 0) {
    return true;
  }

  if (daysAway > 0) {
    return false;
  }

  return hasAppTimeStarted(
    serviceTime
  );
}