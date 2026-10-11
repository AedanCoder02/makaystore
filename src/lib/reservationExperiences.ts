export interface Experience {
  key: string;
  nameEs: string;
  nameEn: string;
  /** Flat price. Omit and use priceWeekday/priceWeekend for day-based pricing. */
  price?: number;
  priceWeekday?: number;
  priceWeekend?: number;
  paxMin: number;
  paxIncluded: number;
  extraPaxPrice: number;
  tierNoteEs?: string;
  tierNoteEn?: string;
  benefitsEs: string[];
  benefitsEn: string[];
  /** Provide a real photo URL when available; falls back to a themed gradient card. */
  image?: string;
}

export const EXPERIENCES: Experience[] = [
  {
    key: 'tipi-makay',
    nameEs: 'Experiencia Tipi Makay',
    nameEn: 'Makay Tipi Experience',
    price: 750,
    paxMin: 1,
    paxIncluded: 10,
    extraPaxPrice: 75,
    benefitsEs: [
      '1 masaje promo por pax',
      '1 servicio de toalla por pax',
      '1 tabla Makay para picar',
      '2 servicios de Mionetto',
      '1 Mackaland 12 Sherry',
      '1 cava Makay + hielo + 8 Minalba',
      '1 helado por pax',
      '1 kit Mionetto',
      '1 full night Makay La Marina',
    ],
    benefitsEn: [
      '1 promo massage per guest',
      '1 towel service per guest',
      '1 Makay charcuterie board',
      '2 Mionetto services',
      '1 Mackaland 12 Sherry',
      '1 Makay cooler + ice + 8 Minalba waters',
      '1 ice cream per guest',
      '1 Mionetto kit',
      '1 full night at Makay La Marina',
    ],
  },
  {
    key: 'tipi',
    nameEs: 'Experiencia Tipi',
    nameEn: 'Tipi Experience',
    price: 400,
    paxMin: 1,
    paxIncluded: 10,
    extraPaxPrice: 40,
    benefitsEs: [
      '1 toalla por pax',
      '1 servicio de Mionetto',
      '1 kit Mionetto',
      'Descorches ilimitados (mostrando factura de bodeguero)',
    ],
    benefitsEn: [
      '1 towel per guest',
      '1 Mionetto service',
      '1 Mionetto kit',
      'Unlimited corkage (with liquor store receipt)',
    ],
  },
  {
    key: 'sombra-palmera-makay',
    nameEs: 'Exp. Sombra Palmera Makay',
    nameEn: 'Makay Palm Shade Experience',
    price: 500,
    paxMin: 1,
    paxIncluded: 8,
    extraPaxPrice: 60,
    benefitsEs: [
      '1 masaje promo por pax',
      '1 servicio de toalla por pax',
      '1 tabla Makay',
      '1 servicio de Mionetto',
      '1 Mackaland 12 Sherry',
      '1 kit Mionetto',
      '1 cava Makay + hielo + 8 Minalba',
      '1 full night Makay La Marina',
    ],
    benefitsEn: [
      '1 promo massage per guest',
      '1 towel service per guest',
      '1 Makay board',
      '1 Mionetto service',
      '1 Mackaland 12 Sherry',
      '1 Mionetto kit',
      '1 Makay cooler + ice + 8 Minalba waters',
      '1 full night at Makay La Marina',
    ],
  },
  {
    key: 'sombra-palmera',
    nameEs: 'Exp. Sombra Palmera',
    nameEn: 'Palm Shade Experience',
    price: 300,
    paxMin: 1,
    paxIncluded: 8,
    extraPaxPrice: 35,
    benefitsEs: [
      '1 servicio de Mionetto',
      '1 toalla por pax',
      '1 kit Mionetto',
      'Descorches ilimitados (mostrando factura de bodeguero)',
    ],
    benefitsEn: [
      '1 Mionetto service',
      '1 towel per guest',
      '1 Mionetto kit',
      'Unlimited corkage (with liquor store receipt)',
    ],
  },
  {
    key: 'oro',
    nameEs: 'Experiencia Oro',
    nameEn: 'Gold Experience',
    price: 120,
    paxMin: 1,
    paxIncluded: 4,
    extraPaxPrice: 30,
    tierNoteEs: '1ª / 2ª / 3ª línea',
    tierNoteEn: '1st / 2nd / 3rd row',
    benefitsEs: [
      '1 toldo (2 sillas + 2 poof cama)',
      '1 masaje promo por pax',
      '1 servicio de toalla por pax',
      '1 servicio de Mionetto',
      '1 cava Makay + hielo + 4 Minalba',
      '1 full night Makay La Marina',
    ],
    benefitsEn: [
      '1 cabana (2 chairs + 2 poof beds)',
      '1 promo massage per guest',
      '1 towel service per guest',
      '1 Mionetto service',
      '1 Makay cooler + ice + 4 Minalba waters',
      '1 full night at Makay La Marina',
    ],
  },
  {
    key: 'plata',
    nameEs: 'Experiencia Plata',
    nameEn: 'Silver Experience',
    price: 60,
    paxMin: 1,
    paxIncluded: 4,
    extraPaxPrice: 15,
    tierNoteEs: '2ª y 3ª línea',
    tierNoteEn: '2nd & 3rd row',
    benefitsEs: [
      '1 toldo (2 sillas + 2 poof cama)',
      '1 servicio de toalla por pax',
      '1 cava Makay + hielo + 4 Polar o 4 Minalba',
      '1 full night Makay La Marina',
    ],
    benefitsEn: [
      '1 cabana (2 chairs + 2 poof beds)',
      '1 towel service per guest',
      '1 Makay cooler + ice + 4 Polar beers or 4 Minalba waters',
      '1 full night at Makay La Marina',
    ],
  },
  {
    key: 'mionetto-gold',
    nameEs: 'Experiencia Mionetto Gold',
    nameEn: 'Mionetto Gold Experience',
    priceWeekday: 120,
    priceWeekend: 190,
    paxMin: 1,
    paxIncluded: 6,
    extraPaxPrice: 0,
    tierNoteEs: 'Tipi central 1 o 3 en zona Mionetto',
    tierNoteEn: 'Central Tipi 1 or 3 in the Mionetto zone',
    benefitsEs: [
      '1 servicio de Mionetto',
      '1 kit Mionetto (bolso, gorra, pañoleta, lentes)',
      'Servicio de tequeños',
      '1 ceviche',
      '1 masaje promo',
    ],
    benefitsEn: [
      '1 Mionetto service',
      '1 Mionetto kit (bag, cap, bandana, sunglasses)',
      'Tequeños service',
      '1 ceviche',
      '1 promo massage',
    ],
  },
  {
    key: 'lobby',
    nameEs: 'Lobby',
    nameEn: 'Lobby',
    price: 200,
    paxMin: 1,
    paxIncluded: 4,
    extraPaxPrice: 0,
    benefitsEs: [
      '1 servicio de Mionetto',
      '1 tabla para compartir',
      '1 cava + hielo + 4 aguas',
    ],
    benefitsEn: [
      '1 Mionetto service',
      '1 sharing board',
      '1 cooler + ice + 4 waters',
    ],
  },
];

export const EXTRA_ADDON = {
  pricePerPax: 50,
  labelEs: 'Extra por persona',
  labelEn: 'Extra per guest',
  descEs: 'Barra libre Makay (3 tragos + cervezas + aguas + refresco) + 1 entrada + 1 plato fuerte de carta especial + bebidas + helado + café',
  descEn: 'Makay open bar (3 cocktails + beers + water + soda) + 1 starter + 1 special-menu main course + drinks + ice cream + coffee',
};

/** Resolves an experience's price for a given date, handling weekday/weekend variants. */
export function priceForDate(exp: Experience, dateISO: string): number {
  if (exp.price != null) return exp.price;
  const day = new Date(`${dateISO}T00:00:00`).getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = day === 0 || day === 6;
  return (isWeekend ? exp.priceWeekend : exp.priceWeekday) ?? 0;
}

export function extraPaxCount(exp: Experience, partySize: number): number {
  return Math.max(0, partySize - exp.paxIncluded);
}

export function totalPrice(exp: Experience, dateISO: string, partySize: number, addExtra: boolean): number {
  const base = priceForDate(exp, dateISO);
  const extra = extraPaxCount(exp, partySize) * exp.extraPaxPrice;
  const addon = addExtra ? partySize * EXTRA_ADDON.pricePerPax : 0;
  return base + extra + addon;
}
