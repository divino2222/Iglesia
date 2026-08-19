export type BibleVerse = {
  verse: number;
  text: string;
};

export type BibleChapter = {
  chapter: number;
  verses: BibleVerse[];
};

export type BibleBook = {
  id: string;
  name: string;
  shortName: string;
  chapters: BibleChapter[];
};

export const bibleBooks: BibleBook[] = [
  {
    id: "genesis",
    name: "Génesis",
    shortName: "Gn",
    chapters: [
      {
        chapter: 1,
        verses: [
          {
            verse: 1,
            text: "En el principio creó Dios los cielos y la tierra.",
          },
          {
            verse: 2,
            text: "Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía sobre la faz de las aguas.",
          },
          {
            verse: 3,
            text: "Y dijo Dios: Sea la luz; y fue la luz.",
          },
          {
            verse: 4,
            text: "Y vio Dios que la luz era buena; y separó Dios la luz de las tinieblas.",
          },
          {
            verse: 5,
            text: "Y llamó Dios a la luz Día, y a las tinieblas llamó Noche. Y fue la tarde y la mañana un día.",
          },
        ],
      },
      {
        chapter: 2,
        verses: [
          {
            verse: 1,
            text: "Fueron, pues, acabados los cielos y la tierra, y todo el ejército de ellos.",
          },
          {
            verse: 2,
            text: "Y acabó Dios en el día séptimo la obra que hizo; y reposó el día séptimo de toda la obra que hizo.",
          },
          {
            verse: 3,
            text: "Y bendijo Dios al día séptimo, y lo santificó, porque en él reposó de toda la obra que había hecho en la creación.",
          },
        ],
      },
    ],
  },
  {
    id: "salmos",
    name: "Salmos",
    shortName: "Sal",
    chapters: [
      {
        chapter: 23,
        verses: [
          {
            verse: 1,
            text: "Jehová es mi pastor; nada me faltará.",
          },
          {
            verse: 2,
            text: "En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.",
          },
          {
            verse: 3,
            text: "Confortará mi alma; me guiará por sendas de justicia por amor de su nombre.",
          },
          {
            verse: 4,
            text: "Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo; tu vara y tu cayado me infundirán aliento.",
          },
          {
            verse: 5,
            text: "Aderezas mesa delante de mí en presencia de mis angustiadores; unges mi cabeza con aceite; mi copa está rebosando.",
          },
          {
            verse: 6,
            text: "Ciertamente el bien y la misericordia me seguirán todos los días de mi vida, y en la casa de Jehová moraré por largos días.",
          },
        ],
      },
      {
        chapter: 91,
        verses: [
          {
            verse: 1,
            text: "El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente.",
          },
          {
            verse: 2,
            text: "Diré yo a Jehová: Esperanza mía, y castillo mío; mi Dios, en quien confiaré.",
          },
          {
            verse: 3,
            text: "Él te librará del lazo del cazador, de la peste destructora.",
          },
          {
            verse: 4,
            text: "Con sus plumas te cubrirá, y debajo de sus alas estarás seguro; escudo y adarga es su verdad.",
          },
        ],
      },
    ],
  },
  {
    id: "juan",
    name: "Juan",
    shortName: "Jn",
    chapters: [
      {
        chapter: 1,
        verses: [
          {
            verse: 1,
            text: "En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.",
          },
          {
            verse: 2,
            text: "Este era en el principio con Dios.",
          },
          {
            verse: 3,
            text: "Todas las cosas por él fueron hechas, y sin él nada de lo que ha sido hecho, fue hecho.",
          },
          {
            verse: 4,
            text: "En él estaba la vida, y la vida era la luz de los hombres.",
          },
          {
            verse: 5,
            text: "La luz en las tinieblas resplandece, y las tinieblas no prevalecieron contra ella.",
          },
        ],
      },
      {
        chapter: 3,
        verses: [
          {
            verse: 16,
            text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
          },
          {
            verse: 17,
            text: "Porque no envió Dios a su Hijo al mundo para condenar al mundo, sino para que el mundo sea salvo por él.",
          },
          {
            verse: 18,
            text: "El que en él cree, no es condenado; pero el que no cree, ya ha sido condenado, porque no ha creído en el nombre del unigénito Hijo de Dios.",
          },
        ],
      },
    ],
  },
  {
    id: "romanos",
    name: "Romanos",
    shortName: "Ro",
    chapters: [
      {
        chapter: 8,
        verses: [
          {
            verse: 1,
            text: "Ahora, pues, ninguna condenación hay para los que están en Cristo Jesús, los que no andan conforme a la carne, sino conforme al Espíritu.",
          },
          {
            verse: 2,
            text: "Porque la ley del Espíritu de vida en Cristo Jesús me ha librado de la ley del pecado y de la muerte.",
          },
          {
            verse: 3,
            text: "Porque lo que era imposible para la ley, por cuanto era débil por la carne, Dios, enviando a su Hijo en semejanza de carne de pecado y a causa del pecado, condenó al pecado en la carne.",
          },
        ],
      },
    ],
  },
];