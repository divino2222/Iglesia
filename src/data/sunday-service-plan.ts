export type ServiceStatus = "ready" | "pending" | "attention";

export type ServiceScheduleItem = {
  time: string;
  title: string;
  description: string;
};

export type ServiceTeam = {
  id: string;
  name: string;
  emoji: string;
  leader: string;
  arrivalTime: string;
  serviceTime: string;
  status: ServiceStatus;
  members: string[];
  checklist: string[];
};

export const sundayServicePlan = {
  dateLabel: "Domingo 12 de julio",
  serviceTitle: "Servicio dominical",
  serviceTime: "11:00 AM",
  location: "Comunidad VID Iztapalapa",
  status: "pending" as ServiceStatus,
  notes:
    "Llegar con tiempo, confirmar asistencia y mantener comunicación con el responsable de cada equipo.",

  schedule: [
    {
      time: "9:30 AM",
      title: "Llegada de servidores",
      description: "Preparación general y revisión de áreas.",
    },
    {
      time: "9:45 AM",
      title: "Oración de servidores",
      description: "Breve tiempo de oración antes de iniciar actividades.",
    },
    {
      time: "10:00 AM",
      title: "Montaje y revisión",
      description: "Audio, multimedia, recepción, cafetería y salones listos.",
    },
    {
      time: "10:30 AM",
      title: "Recepción abierta",
      description: "Ujieres y bienvenida listos para recibir personas.",
    },
    {
      time: "11:00 AM",
      title: "Inicio del servicio",
      description: "Alabanza, enseñanza bíblica y comunidad.",
    },
    {
      time: "1:00 PM",
      title: "Cierre y desmontaje",
      description: "Apoyo para dejar todo en orden.",
    },
  ] satisfies ServiceScheduleItem[],

  teams: [
    {
      id: "alabanza",
      name: "Alabanza",
      emoji: "🎤",
      leader: "Por confirmar",
      arrivalTime: "9:30 AM",
      serviceTime: "11:00 AM",
      status: "pending",
      members: ["Brenda", "Elizabeth", "Ricardo Bajo", "Ricardo Guitarra", "Sonia"],
      checklist: [
        "Confirmar canciones",
        "Revisar instrumentos",
        "Prueba de micrófonos",
        "Orar con el equipo",
      ],
    },
    {
      id: "multimedia",
      name: "Multimedia",
      emoji: "🎥",
      leader: "Por confirmar",
      arrivalTime: "9:30 AM",
      serviceTime: "10:30 AM",
      status: "pending",
      members: ["Ricardo", "Ruth", "Alex", "Emmanuel", "Vanessa"],
      checklist: [
        "Encender equipo",
        "Revisar presentación",
        "Probar audio",
        "Revisar cámara o transmisión",
      ],
    },
    {
      id: "ujieres",
      name: "Ujieres",
      emoji: "🚪",
      leader: "Por confirmar",
      arrivalTime: "10:15 AM",
      serviceTime: "10:30 AM",
      status: "pending",
      members: ["Por confirmar"],
      checklist: [
        "Recibir personas",
        "Apoyar con lugares",
        "Estar atentos durante el servicio",
      ],
    },
    {
      id: "cafeteria",
      name: "Cafetería",
      emoji: "☕",
      leader: "Por confirmar",
      arrivalTime: "10:00 AM",
      serviceTime: "10:30 AM",
      status: "pending",
      members: ["Por confirmar"],
      checklist: [
        "Preparar mesa",
        "Revisar insumos",
        "Servir con orden y amabilidad",
      ],
    },
    {
      id: "ninos",
      name: "Niños",
      emoji: "👧",
      leader: "Por confirmar",
      arrivalTime: "10:15 AM",
      serviceTime: "11:00 AM",
      status: "pending",
      members: ["Por confirmar"],
      checklist: [
        "Preparar material",
        "Revisar espacio",
        "Recibir niños con seguridad",
      ],
    },
    {
      id: "ofrendas",
      name: "Ofrendas",
      emoji: "🤲",
      leader: "Por confirmar",
      arrivalTime: "10:30 AM",
      serviceTime: "Durante servicio",
      status: "pending",
      members: ["Por confirmar"],
      checklist: [
        "Coordinar momento",
        "Apoyar con orden",
        "Entregar responsablemente",
      ],
    },
  ] satisfies ServiceTeam[],
};