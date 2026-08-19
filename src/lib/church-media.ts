export type ChurchGalleryImage = {
  id: string;
  src: string;
  alt: string;
  album: string;
  caption?: string;
};

export type ChurchGalleryVideo = {
  id: string;
  src: string;
  title: string;
  description: string;
  poster?: string;
};

export const churchMedia = {
  heroImage: "/images/church-hero.jpg",

  gallery: [
    "/images/church-hero.jpg",
    "/images/church-community.jpg",
    "/images/church-hero.jpg",
    "/images/church-community.jpg",
  ],

  images: [
    {
      id: "servicio-1",
      src: "/images/church-hero.jpg",
      alt: "Servicio de Comunidad VID",
      album: "Servicio dominical",
      caption: "Momentos de adoración y palabra en Comunidad VID.",
    },
    {
      id: "comunidad-1",
      src: "/images/church-community.jpg",
      alt: "Comunidad reunida",
      album: "Comunidad",
      caption: "Un espacio para crecer, creer y pertenecer.",
    },
    {
      id: "servicio-2",
      src: "/images/church-hero.jpg",
      alt: "Reunión de iglesia",
      album: "Servicio dominical",
      caption: "Nuestra familia reunida para buscar a Dios.",
    },
    {
      id: "comunidad-2",
      src: "/images/church-community.jpg",
      alt: "Vida de iglesia",
      album: "Comunidad",
      caption: "Vida de iglesia, amistad y comunidad.",
    },
    {
      id: "bautizos-1",
      src: "/images/events/bautizos-pueblo-nuevo.jpg",
      alt: "Balneario Pueblo Nuevo",
      album: "Bautizos",
      caption: "Lugar de nuestro próximo evento de bautizos.",
    },
  ] satisfies ChurchGalleryImage[],

  videos: [
    {
      id: "intro",
      src: "/videos/church-intro.mp4",
      title: "Comunidad VID en vivo",
      description: "Un vistazo real de nuestra iglesia.",
      poster: "/images/church-hero.jpg",
    },
  {
    id: "bautizos",
    src: "/videos/bautizos.mp4",
    title: "Bautizos Comunidad VID",
    description: "Un momento especial como comunidad.",
    poster: "/images/events/bautizos-pueblo-nuevo.jpg",
  },
  ] satisfies ChurchGalleryVideo[],

  introVideo: "/videos/church-intro.mp4",
};