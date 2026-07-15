export type LotStatus = "LIVE" | "UPCOMING" | "ENDED" | "OUTBID" | "WINNING";
export type Category = "Arte" | "Relojes" | "Deportes" | "Coleccionables" | "Joyería";

export interface Lot {
  id: string;
  slug: string;
  lotNumber: string;
  title: string;
  titleEn: string;
  category: Category;
  status: LotStatus;
  currentBid: number;
  estimateLow: number;
  estimateHigh: number;
  buyerPremium: number;
  image: string;
  seller: string;
  sellerInitials: string;
  endsAt: Date;
  bidCount: number;
  description: string;
  descriptionEn: string;
  certified: boolean;
}

export interface Auction {
  id: string;
  title: string;
  titleEn: string;
  status: "LIVE" | "UPCOMING" | "ENDED";
  startDate: Date;
  endDate: Date;
  lotCount: number;
  buyerPremium: number;
  heroImage: string;
  description: string;
}

const now = new Date();
const addMinutes = (m: number) => new Date(now.getTime() + m * 60000);
const addHours = (h: number) => new Date(now.getTime() + h * 3600000);
const addDays = (d: number) => new Date(now.getTime() + d * 86400000);

export const mockLots: Lot[] = [
  {
    id: "1",
    slug: "patek-philippe-nautilus-5711",
    lotNumber: "RV-2024-001",
    title: "Patek Philippe Nautilus 5711/1A-010",
    titleEn: "Patek Philippe Nautilus 5711/1A-010",
    category: "Relojes",
    status: "LIVE",
    currentBid: 95000,
    estimateLow: 80000,
    estimateHigh: 120000,
    buyerPremium: 20,
    image: "/manus-storage/rv-lot-watch_160166ab.jpg",
    seller: "Colección Privada MX",
    sellerInitials: "CP",
    endsAt: addMinutes(47),
    bidCount: 23,
    description: "Patek Philippe Nautilus referencia 5711/1A-010 en acero inoxidable con esfera azul. Año 2019, con caja y papeles originales. Excelente condición.",
    descriptionEn: "Patek Philippe Nautilus reference 5711/1A-010 in stainless steel with blue dial. Year 2019, with original box and papers. Excellent condition.",
    certified: true,
  },
  {
    id: "2",
    slug: "oleo-abstracto-torres-garcia",
    lotNumber: "RV-2024-002",
    title: "Óleo abstracto — Escuela Torres García",
    titleEn: "Abstract Oil — Torres García School",
    category: "Arte",
    status: "LIVE",
    currentBid: 18500,
    estimateLow: 15000,
    estimateHigh: 25000,
    buyerPremium: 20,
    image: "/manus-storage/rv-lot-art_b318fc6b.jpg",
    seller: "Galería Sur",
    sellerInitials: "GS",
    endsAt: addHours(2),
    bidCount: 11,
    description: "Óleo sobre tela, 80x100cm. Firmado y fechado 1965. Certificado de autenticidad por la Fundación Torres García.",
    descriptionEn: "Oil on canvas, 80x100cm. Signed and dated 1965. Certificate of authenticity by the Torres García Foundation.",
    certified: true,
  },
  {
    id: "3",
    slug: "jersey-firmado-maradona-1986",
    lotNumber: "RV-2024-003",
    title: "Jersey firmado Diego Maradona — Mundial 1986",
    titleEn: "Signed Diego Maradona Jersey — 1986 World Cup",
    category: "Deportes",
    status: "LIVE",
    currentBid: 42000,
    estimateLow: 35000,
    estimateHigh: 55000,
    buyerPremium: 20,
    image: "/manus-storage/rv-lot-sports_51a583e1.jpg",
    seller: "Sports Heritage",
    sellerInitials: "SH",
    endsAt: addHours(5),
    bidCount: 34,
    description: "Jersey original de la Selección Argentina, firmado por Diego Armando Maradona. Incluye certificado de autenticidad PSA/DNA.",
    descriptionEn: "Original Argentina National Team jersey, signed by Diego Armando Maradona. Includes PSA/DNA certificate of authenticity.",
    certified: true,
  },
  {
    id: "4",
    slug: "rolex-daytona-116500ln",
    lotNumber: "RV-2024-004",
    title: "Rolex Cosmograph Daytona 116500LN",
    titleEn: "Rolex Cosmograph Daytona 116500LN",
    category: "Relojes",
    status: "UPCOMING",
    currentBid: 0,
    estimateLow: 28000,
    estimateHigh: 38000,
    buyerPremium: 20,
    image: "/manus-storage/rv-lot-watch_160166ab.jpg",
    seller: "Luxury Timepieces",
    sellerInitials: "LT",
    endsAt: addDays(3),
    bidCount: 0,
    description: "Rolex Daytona en acero inoxidable con esfera negra Oysterflex. Año 2021, caja y papeles completos.",
    descriptionEn: "Rolex Daytona in stainless steel with black Oysterflex dial. Year 2021, complete box and papers.",
    certified: true,
  },
  {
    id: "5",
    slug: "escultura-bronce-botero",
    lotNumber: "RV-2024-005",
    title: "Escultura en bronce — Estilo Botero",
    titleEn: "Bronze Sculpture — Botero Style",
    category: "Arte",
    status: "UPCOMING",
    currentBid: 0,
    estimateLow: 12000,
    estimateHigh: 18000,
    buyerPremium: 20,
    image: "/manus-storage/rv-lot-art_b318fc6b.jpg",
    seller: "Arte Latinoamericano",
    sellerInitials: "AL",
    endsAt: addDays(5),
    bidCount: 0,
    description: "Escultura en bronce fundido, 45cm altura. Edición limitada 3/8. Certificado del artista incluido.",
    descriptionEn: "Cast bronze sculpture, 45cm height. Limited edition 3/8. Artist certificate included.",
    certified: true,
  },
  {
    id: "6",
    slug: "tarjeta-rookie-messi-2004",
    lotNumber: "RV-2024-006",
    title: "Tarjeta Rookie Lionel Messi — Panini 2004 PSA 10",
    titleEn: "Lionel Messi Rookie Card — Panini 2004 PSA 10",
    category: "Coleccionables",
    status: "LIVE",
    currentBid: 8900,
    estimateLow: 7000,
    estimateHigh: 12000,
    buyerPremium: 20,
    image: "/manus-storage/rv-lot-sports_51a583e1.jpg",
    seller: "Cards Premium",
    sellerInitials: "CP",
    endsAt: addMinutes(120),
    bidCount: 18,
    description: "Tarjeta rookie de Lionel Messi, Panini 2004. Calificación PSA 10 Gem Mint. Pieza excepcional para coleccionistas.",
    descriptionEn: "Lionel Messi rookie card, Panini 2004. PSA 10 Gem Mint grade. Exceptional piece for collectors.",
    certified: true,
  },
  {
    id: "7",
    slug: "audemars-piguet-royal-oak",
    lotNumber: "RV-2024-007",
    title: "Audemars Piguet Royal Oak 15400ST",
    titleEn: "Audemars Piguet Royal Oak 15400ST",
    category: "Relojes",
    status: "ENDED",
    currentBid: 52000,
    estimateLow: 45000,
    estimateHigh: 60000,
    buyerPremium: 20,
    image: "/manus-storage/rv-lot-watch_160166ab.jpg",
    seller: "Swiss Collection",
    sellerInitials: "SC",
    endsAt: addDays(-1),
    bidCount: 41,
    description: "Audemars Piguet Royal Oak en acero con esfera azul. Año 2020, completo.",
    descriptionEn: "Audemars Piguet Royal Oak in steel with blue dial. Year 2020, complete.",
    certified: true,
  },
  {
    id: "8",
    slug: "moneda-oro-libertad-1921",
    lotNumber: "RV-2024-008",
    title: "Moneda de oro Libertad — México 1921",
    titleEn: "Gold Libertad Coin — Mexico 1921",
    category: "Coleccionables",
    status: "UPCOMING",
    currentBid: 0,
    estimateLow: 3500,
    estimateHigh: 5000,
    buyerPremium: 20,
    image: "/manus-storage/rv-lot-art_b318fc6b.jpg",
    seller: "Numismática Elite",
    sellerInitials: "NE",
    endsAt: addDays(7),
    bidCount: 0,
    description: "Moneda de oro puro 50 pesos, México 1921. Conmemorativa del Centenario de la Independencia. Excelente conservación.",
    descriptionEn: "50 peso pure gold coin, Mexico 1921. Commemorating the Centennial of Independence. Excellent preservation.",
    certified: true,
  },
];

export const mockAuctions: Auction[] = [
  {
    id: "a1",
    title: "Gran Subasta de Relojes de Lujo — Julio 2024",
    titleEn: "Grand Luxury Watch Auction — July 2024",
    status: "LIVE",
    startDate: addDays(-1),
    endDate: addDays(1),
    lotCount: 48,
    buyerPremium: 20,
    heroImage: "/manus-storage/rv-lot-watch_160166ab.jpg",
    description: "La selección más exclusiva de relojes de manufactura suiza y japonesa.",
  },
  {
    id: "a2",
    title: "Arte Latinoamericano Contemporáneo",
    titleEn: "Contemporary Latin American Art",
    status: "LIVE",
    startDate: addDays(-2),
    endDate: addDays(2),
    lotCount: 32,
    buyerPremium: 20,
    heroImage: "/manus-storage/rv-lot-art_b318fc6b.jpg",
    description: "Obras de artistas emergentes y consagrados de América Latina.",
  },
  {
    id: "a3",
    title: "Memorabilia Deportiva Premium",
    titleEn: "Premium Sports Memorabilia",
    status: "UPCOMING",
    startDate: addDays(5),
    endDate: addDays(8),
    lotCount: 60,
    buyerPremium: 20,
    heroImage: "/manus-storage/rv-lot-sports_51a583e1.jpg",
    description: "Piezas firmadas y certificadas de los grandes del deporte mundial.",
  },
  {
    id: "a4",
    title: "Coleccionables & Numismática",
    titleEn: "Collectibles & Numismatics",
    status: "UPCOMING",
    startDate: addDays(10),
    endDate: addDays(13),
    lotCount: 85,
    buyerPremium: 20,
    heroImage: "/manus-storage/rv-lot-art_b318fc6b.jpg",
    description: "Monedas, billetes, tarjetas y objetos de colección de alto valor.",
  },
];

export const mockBidHistory = [
  { user: "J***z", amount: 95000, time: "hace 3 min", winning: true },
  { user: "M***a", amount: 92000, time: "hace 8 min", winning: false },
  { user: "C***r", amount: 88000, time: "hace 15 min", winning: false },
  { user: "L***s", amount: 85000, time: "hace 22 min", winning: false },
  { user: "A***n", amount: 82000, time: "hace 31 min", winning: false },
];

export const formatCurrency = (amount: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
