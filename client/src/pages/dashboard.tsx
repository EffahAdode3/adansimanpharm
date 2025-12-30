import React, { useState, useMemo } from "react";
import { PRELOADED_PRODUCTS, Product } from "../data/products";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Calculator, CreditCard, DollarSign, Package, Percent } from "lucide-react";

// Types for user input state
type ProductInput = {
  quantityLeft: number | "";
  quantitySoldDiscount: number | "";
};

type InputsMap = Record<string, ProductInput>;

export default function Dashboard() {
  // State for product inputs
  const [inputs, setInputs] = useState<InputsMap>(() => {
    const initial: InputsMap = {};
    PRELOADED_PRODUCTS.forEach((p) => {
      initial[p.id] = { quantityLeft: "", quantitySoldDiscount: "" };
    });
    return initial;
  });

  // State for total credit debt
  const [totalCreditDebt, setTotalCreditDebt] = useState<number | "">("");

  // Handle input changes
  const handleInputChange = (id: string, field: keyof ProductInput, value: string) => {
    const numValue = value === "" ? "" : parseFloat(value);
    // Basic validation: verify non-negative
    if (typeof numValue === "number" && numValue < 0) return;
    
    setInputs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: numValue },
    }));
  };

  // Calculations
  const calculations = useMemo(() => {
    let totalSoldValue = 0;
    let totalDiscountGiven = 0;
    let totalQuantitySold = 0;
    let totalQuantityGiven = 0;
    let totalQuantityRemaining = 0;

    const productsCalculated = PRELOADED_PRODUCTS.map((product) => {
      const input = inputs[product.id];
      const qtyLeft = input.quantityLeft === "" ? 0 : input.quantityLeft;
      const qtySoldDiscount = input.quantitySoldDiscount === "" ? 0 : input.quantitySoldDiscount;
      
      const qtySold = Math.max(0, product.quantityGiven - qtyLeft);
      const soldValue = qtySold * product.cashPrice;

      // Discount logic: 10% if price >= 1000
      const isEligibleForDiscount = product.cashPrice >= 1000;
      // Discount only applies to the quantity user specified as "sold on discount"
      // But logically, "sold on discount" cannot exceed "total sold"
      // And we assume "sold on discount" implies these were CASH sales eligible for discount
      const validQtySoldDiscount = Math.min(qtySold, qtySoldDiscount);
      
      const discountAmount = isEligibleForDiscount 
        ? validQtySoldDiscount * product.cashPrice * 0.10 
        : 0;

      totalSoldValue += soldValue;
      totalDiscountGiven += discountAmount;
      totalQuantitySold += qtySold;
      totalQuantityGiven += product.quantityGiven;
      totalQuantityRemaining += qtyLeft;

      return {
        ...product,
        qtySold,
        soldValue,
        discountAmount,
        isEligibleForDiscount,
        validQtySoldDiscount
      };
    });

    const creditDebt = totalCreditDebt === "" ? 0 : totalCreditDebt;
    
    // Validation: Credit debt cannot exceed total sold value
    // (In a real app we might show an error, here we just cap logic or show it as is but warn?)
    // The prompt says "Total credit debt must not exceed total sold value". 
    // We will visually indicate error if this constraint is violated.
    const isCreditDebtInvalid = creditDebt > totalSoldValue;

    const cashValueBeforeDiscount = Math.max(0, totalSoldValue - creditDebt);
    const cashValueAfterDiscount = cashValueBeforeDiscount - totalDiscountGiven;

    return {
      productsCalculated,
      totalSoldValue,
      totalDiscountGiven,
      totalQuantitySold,
      totalQuantityGiven,
      totalQuantityRemaining,
      creditDebt,
      isCreditDebtInvalid,
      cashValueBeforeDiscount,
      cashValueAfterDiscount
    };
  }, [inputs, totalCreditDebt]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(val);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Daily Accounting</h1>
            <p className="text-slate-500 mt-1">Manage sales, calculate discounts, and track revenue.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border shadow-sm">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Top Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportCard 
            title="Cash Sales (Pre-Discount)" 
            value={formatCurrency(calculations.cashValueBeforeDiscount)}
            icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
            colorClass="text-emerald-700 bg-emerald-50/50 border-emerald-100"
          />
          <ReportCard 
            title="Total Discount Given" 
            value={formatCurrency(calculations.totalDiscountGiven)}
            icon={<Percent className="w-4 h-4 text-orange-600" />}
            colorClass="text-orange-700 bg-orange-50/50 border-orange-100"
          />
          <ReportCard 
            title="Final Cash (Post-Discount)" 
            value={formatCurrency(calculations.cashValueAfterDiscount)}
            icon={<Calculator className="w-4 h-4 text-blue-600" />}
            colorClass="text-blue-700 bg-blue-50/50 border-blue-100"
            highlight
          />
          <ReportCard 
            title="Inventory Remaining" 
            value={`${calculations.totalQuantityRemaining} / ${calculations.totalQuantityGiven}`}
            subValue="Units"
            icon={<Package className="w-4 h-4 text-slate-600" />}
            colorClass="text-slate-700 bg-white border-slate-200"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Product Table */}
          <Card className="lg:col-span-2 border shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle>Product Sales Data</CardTitle>
              <CardDescription>Enter quantity remaining and quantity sold on discount for each item.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-[200px]">Product</TableHead>
                      <TableHead className="text-right">Price (GHS)</TableHead>
                      <TableHead className="text-center">Given</TableHead>
                      <TableHead className="w-[120px] bg-amber-50/30 text-amber-900 border-l border-amber-100">Qty Left</TableHead>
                      <TableHead className="w-[120px] bg-blue-50/30 text-blue-900 border-l border-blue-100">
                         Qty Sold <br/><span className="text-[10px] opacity-70">(Discounted)</span>
                      </TableHead>
                      <TableHead className="text-right">Sold Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.productsCalculated.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium text-slate-700">
                          {product.name}
                          {product.isEligibleForDiscount && (
                            <Badge variant="secondary" className="ml-2 text-[10px] bg-green-100 text-green-700 hover:bg-green-100 border-none px-1.5 py-0">
                              Eligible
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono-numbers text-slate-600">
                          {product.cashPrice}
                        </TableCell>
                        <TableCell className="text-center font-mono-numbers text-slate-600">
                          {product.quantityGiven}
                        </TableCell>
                        <TableCell className="bg-amber-50/10 border-l border-amber-100/50 p-2">
                          <Input
                            type="number"
                            min="0"
                            max={product.quantityGiven}
                            className="h-8 font-mono-numbers text-right bg-white border-amber-200 focus-visible:ring-amber-500"
                            value={inputs[product.id]?.quantityLeft}
                            onChange={(e) => handleInputChange(product.id, "quantityLeft", e.target.value)}
                            data-testid={`input-qty-left-${product.id}`}
                          />
                        </TableCell>
                        <TableCell className="bg-blue-50/10 border-l border-blue-100/50 p-2">
                           <Input
                            type="number"
                            min="0"
                            disabled={!product.isEligibleForDiscount}
                            className={`h-8 font-mono-numbers text-right bg-white ${
                              product.isEligibleForDiscount 
                                ? "border-blue-200 focus-visible:ring-blue-500" 
                                : "opacity-50 cursor-not-allowed border-slate-100"
                            }`}
                            value={inputs[product.id]?.quantitySoldDiscount}
                            onChange={(e) => handleInputChange(product.id, "quantitySoldDiscount", e.target.value)}
                            data-testid={`input-qty-discount-${product.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono-numbers font-medium text-slate-700">
                          {formatCurrency(product.soldValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Controls */}
          <div className="space-y-6">
            
            {/* Global Input Card */}
            <Card className="border shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                   <CreditCard className="w-4 h-4 text-slate-500"/>
                   Total Credit Debt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="credit-debt" className="sr-only">Total Credit Debt</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">GHS</span>
                    <Input 
                      id="credit-debt"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      className={`pl-12 font-mono-numbers text-lg h-12 ${
                        calculations.isCreditDebtInvalid ? "border-red-300 focus-visible:ring-red-500 bg-red-50 text-red-900" : ""
                      }`}
                      value={totalCreditDebt}
                      onChange={(e) => {
                        const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                        setTotalCreditDebt(val);
                      }}
                      data-testid="input-credit-debt"
                    />
                  </div>
                  {calculations.isCreditDebtInvalid && (
                    <p className="text-xs text-red-600 font-medium animate-pulse">
                      Error: Debt cannot exceed total sold value ({formatCurrency(calculations.totalSoldValue)})
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Enter the total value of goods sold on credit. This is deducted from the total sales to find the cash revenue.
                  </p>
                </div>
              </CardContent>
            </Card>

             {/* Summary Breakdown */}
             <Card className="border shadow-sm bg-slate-900 text-slate-50">
              <CardHeader>
                <CardTitle className="text-slate-100">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Sold Value</span>
                  <span className="font-mono-numbers">{formatCurrency(calculations.totalSoldValue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Less: Credit Debt</span>
                  <span className="font-mono-numbers text-red-300">
                    - {formatCurrency(calculations.creditDebt)}
                  </span>
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-200">Cash Before Disc.</span>
                  <span className="font-mono-numbers">{formatCurrency(calculations.cashValueBeforeDiscount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Less: Discount (10%)</span>
                  <span className="font-mono-numbers text-emerald-300">
                    - {formatCurrency(calculations.totalDiscountGiven)}
                  </span>
                </div>
                <Separator className="bg-slate-700" />
                <div className="pt-2">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Final Cash Revenue</div>
                  <div className="text-3xl font-bold font-mono-numbers text-white tracking-tight">
                    {formatCurrency(calculations.cashValueAfterDiscount)}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, value, subValue, icon, colorClass, highlight = false }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl border p-5 shadow-sm ${colorClass} ${highlight ? 'ring-2 ring-blue-500/20' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{title}</p>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold font-mono-numbers tracking-tight">{value}</h3>
        {subValue && <span className="text-sm opacity-70">{subValue}</span>}
      </div>
    </motion.div>
  );
}
