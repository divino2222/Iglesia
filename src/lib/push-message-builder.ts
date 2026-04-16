type PrayerPushInput = {
  leaderName: string | null;
  dateLabel: string | null;
  isActiveNow: boolean;
};

export function buildPrayerPushMessage(input: PrayerPushInput) {
  if (input.isActiveNow) {
    return {
      title: "Comunidad VID",
      body: `La oración en línea ya inició. Dirige ${
        input.leaderName || "la persona asignada"
      }.`,
      url: "/en-vivo",
    };
  }

  return {
    title: "Comunidad VID",
    body: `Próxima oración en línea: dirige ${
      input.leaderName || "la persona asignada"
    }${input.dateLabel ? ` · ${input.dateLabel}` : ""}.`,
    url: "/eventos",
  };
}