export interface Product {
  id: string;
  name: string;
  cashPrice: number;
  quantityGiven: number;
}

export const PRELOADED_PRODUCTS: Product[] = [
  { id: "p1", name: "Bexcoplex Syrup", cashPrice: 6.50, quantityGiven: 50 },
  { id: "p2", name: "Dexferon tonic", cashPrice: 13.90, quantityGiven: 50 },
  { id: "p3", name: "Deoferon Syrup", cashPrice: 18.50, quantityGiven: 50 },
  { id: "p4", name: "Dexvite Syrup", cashPrice: 10.50, quantityGiven: 50 },
  { id: "p5", name: "Happitamin-C Syrup", cashPrice: 17.50, quantityGiven: 50 },
  { id: "p6", name: "Happivita", cashPrice: 14.50, quantityGiven: 50 },
  { id: "p7", name: "Dexvite plus syrup", cashPrice: 16.50, quantityGiven: 50 },
  { id: "p8", name: "Linctus-A (Adults)", cashPrice: 8.90, quantityGiven: 50 },
  { id: "p9", name: "Linctus-P (Paediatric)", cashPrice: 8.50, quantityGiven: 50 },
  { id: "p10", name: "Paracetamol Syrup", cashPrice: 6.99, quantityGiven: 50 },
  { id: "p11", name: "Decold Syrup", cashPrice: 11.50, quantityGiven: 50 },
  { id: "p12", name: "Quinine Syrup", cashPrice: 8.98, quantityGiven: 50 },
  { id: "p13", name: "Mag Trisilicate Mixture", cashPrice: 3.80, quantityGiven: 100 },
  { id: "p14", name: "Methylated Spirit", cashPrice: 2.90, quantityGiven: 100 },
  { id: "p15", name: "Hydrogen Peroxide", cashPrice: 3.80, quantityGiven: 100 },
  { id: "p16", name: "Mist Pot Cit", cashPrice: 3.80, quantityGiven: 100 },
  { id: "p17", name: "F.A.C", cashPrice: 3.80, quantityGiven: 100 },
  { id: "p18", name: "Expect Sed", cashPrice: 3.80, quantityGiven: 100 },
  { id: "p19", name: "Eusol Lotion", cashPrice: 3.80, quantityGiven: 100 },
  { id: "p20", name: "Mist Senna", cashPrice: 3.80, quantityGiven: 100 },
  { id: "p21", name: "GV Paint", cashPrice: 1.90, quantityGiven: 100 },
];
