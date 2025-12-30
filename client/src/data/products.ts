export interface Product {
  id: string;
  name: string;
  cashPrice: number;
  creditPrice: number;
}

export const PRELOADED_PRODUCTS: Product[] = [
  { id: "p1", name: "Bexcoplex Syrup", cashPrice: 6.50, creditPrice: 7.20 },
  { id: "p2", name: "Dexferon tonic", cashPrice: 13.90, creditPrice: 14.60 },
  { id: "p3", name: "Deoferon Syrup", cashPrice: 18.50, creditPrice: 19.20 },
  { id: "p4", name: "Dexvite Syrup", cashPrice: 10.50, creditPrice: 11.20 },
  { id: "p5", name: "Happitamin-C Syrup", cashPrice: 17.50, creditPrice: 18.20 },
  { id: "p6", name: "Happivita", cashPrice: 14.50, creditPrice: 15.20 },
  { id: "p7", name: "Dexvite plus syrup", cashPrice: 16.50, creditPrice: 17.20 },
  { id: "p8", name: "Linctus-A (Adults)", cashPrice: 8.90, creditPrice: 9.60 },
  { id: "p9", name: "Linctus-P (Paediatric)", cashPrice: 8.50, creditPrice: 9.20 },
  { id: "p10", name: "Paracetamol Syrup", cashPrice: 6.99, creditPrice: 7.69 },
  { id: "p11", name: "Decold Syrup", cashPrice: 11.50, creditPrice: 12.20 },
  { id: "p12", name: "Quinine Syrup", cashPrice: 8.98, creditPrice: 9.68 },
  { id: "p13", name: "Mag Trisilicate Mixture", cashPrice: 3.80, creditPrice: 4.50 },
  { id: "p14", name: "Methylated Spirit", cashPrice: 2.90, creditPrice: 3.60 },
  { id: "p15", name: "Hydrogen Peroxide", cashPrice: 3.80, creditPrice: 4.50 },
  { id: "p16", name: "Mist Pot Cit", cashPrice: 3.80, creditPrice: 4.50 },
  { id: "p17", name: "F.A.C", cashPrice: 3.80, creditPrice: 4.50 },
  { id: "p18", name: "Expect Sed", cashPrice: 3.80, creditPrice: 4.50 },
  { id: "p19", name: "Eusol Lotion", cashPrice: 3.80, creditPrice: 4.50 },
  { id: "p20", name: "Mist Senna", cashPrice: 3.80, creditPrice: 4.50 },
  { id: "p21", name: "GV Paint", cashPrice: 1.90, creditPrice: 2.60 },
];
