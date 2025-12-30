export interface Product {
  id: string;
  name: string;
  cashPrice: number;
  quantityGiven: number;
}

export const PRELOADED_PRODUCTS: Product[] = [
  { id: "p1", name: "Premium Cement (50kg)", cashPrice: 1200, quantityGiven: 100 },
  { id: "p2", name: "Steel Rods (16mm)", cashPrice: 850, quantityGiven: 200 },
  { id: "p3", name: "Roofing Sheets (Long)", cashPrice: 1500, quantityGiven: 50 },
  { id: "p4", name: "Paint Bucket (20L)", cashPrice: 450, quantityGiven: 80 },
  { id: "p5", name: "Floor Tiles (Box)", cashPrice: 320, quantityGiven: 150 },
  { id: "p6", name: "Plumbing Pipe (PVC)", cashPrice: 150, quantityGiven: 300 },
  { id: "p7", name: "Water Tank (2000L)", cashPrice: 3500, quantityGiven: 10 },
  { id: "p8", name: "Wheelbarrow (Heavy Duty)", cashPrice: 600, quantityGiven: 25 },
];
