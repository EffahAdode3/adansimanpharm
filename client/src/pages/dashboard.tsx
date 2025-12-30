import React, { useState, useMemo } from "react";
import { PRELOADED_PRODUCTS, Product } from "../data/products";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Calculator, CreditCard, DollarSign, Package, Percent, Info } from "lucide-react";

// Types for user input state
type ProductInput = {
  quantityGiven: number | "";
  quantityLeft: number | "";
  discountAmount: number | "";
};

type InputsMap = Record<string, ProductInput>;

export default function Dashboard() {
  // State for product inputs
  const [inputs, setInputs] = useState<InputsMap>(() => {
    const initial: InputsMap = {};
    PRELOADED_PRODUCTS.forEach((p) => {
      initial[p.id] = { quantityGiven: "", quantityLeft: "", discountAmount: "" };
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
      const qtyGiven = input.quantityGiven === "" ? 0 : input.quantityGiven;
      const qtyLeft = input.quantityLeft === "" ? 0 : input.quantityLeft;
      const discountAmount = input.discountAmount === "" ? 0 : input.discountAmount;
      
      const qtySold = Math.max(0, qtyGiven - qtyLeft);
      const soldValue = qtySold * product.cashPrice;

      // Discount is entered directly by user (in units or amount)
      // We'll assume it's the discount amount in GHS
      const validDiscountAmount = Math.min(discountAmount, soldValue);

      totalSoldValue += soldValue;
      totalDiscountGiven += validDiscountAmount;
      totalQuantitySold += qtySold;
      totalQuantityGiven += qtyGiven;
      totalQuantityRemaining += qtyLeft;

      return {
        ...product,
        qtySold,
        soldValue,
        discountAmount: validDiscountAmount,
      };
    });

    const creditDebt = totalCreditDebt === "" ? 0 : totalCreditDebt;
    
    // Validation: Credit debt cannot exceed total sold value
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
    new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 2 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pharmacy Accounting</h1>
            <p className="text-slate-500 mt-1">Track inventory, calculate discounts, and manage daily revenue.</p>
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
            title="Total Sales Value" 
            value={formatCurrency(calculations.totalSoldValue)}
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
            title="Cash Revenue (Final)" 
            value={formatCurrency(calculations.cashValueAfterDiscount)}
            icon={<Calculator className="w-4 h-4 text-blue-600" />}
            colorClass="text-blue-700 bg-blue-50/50 border-blue-100"
            highlight
          />
          <ReportCard 
            title="Inventory Remaining" 
            value={`${calculations.totalQuantityRemaining}`}
            subValue={`of ${calculations.totalQuantityGiven} units`}
            icon={<Package className="w-4 h-4 text-slate-600" />}
            colorClass="text-slate-700 bg-white border-slate-200"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Product Table */}
          <Card className="lg:col-span-2 border shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle>Product Inventory & Sales</CardTitle>
              <CardDescription className="flex items-start gap-2 mt-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>Enter: (1) Quantity Given, (2) Quantity Left Unsold, (3) Discount Amount in GHS</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-[160px]">Product Name</TableHead>
                      <TableHead className="text-right">Price (GHS)</TableHead>
                      <TableHead className="w-[100px] bg-purple-50/30 text-purple-900 border-l border-purple-100">
                        Qty Given
                      </TableHead>
                      <TableHead className="w-[100px] bg-amber-50/30 text-amber-900 border-l border-amber-100">
                        Qty Left
                      </TableHead>
                      <TableHead className="text-center">Qty Sold</TableHead>
                      <TableHead className="text-right">Sold Value</TableHead>
                      <TableHead className="w-[100px] bg-orange-50/30 text-orange-900 border-l border-orange-100">
                        Discount (GHS)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.productsCalculated.map((product) => (
                      <TableRow key={product.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-700">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-right font-mono-numbers text-slate-600">
                          {product.cashPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="bg-purple-50/10 border-l border-purple-100/50 p-2">
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="h-8 font-mono-numbers text-center bg-white border-purple-200 focus-visible:ring-purple-500"
                            value={inputs[product.id]?.quantityGiven}
                            onChange={(e) => handleInputChange(product.id, "quantityGiven", e.target.value)}
                            data-testid={`input-qty-given-${product.id}`}
                          />
                        </TableCell>
                        <TableCell className="bg-amber-50/10 border-l border-amber-100/50 p-2">
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="h-8 font-mono-numbers text-center bg-white border-amber-200 focus-visible:ring-amber-500"
                            value={inputs[product.id]?.quantityLeft}
                            onChange={(e) => handleInputChange(product.id, "quantityLeft", e.target.value)}
                            data-testid={`input-qty-left-${product.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-center font-mono-numbers font-medium text-slate-700">
                          {inputs[product.id]?.quantityGiven && inputs[product.id]?.quantityLeft
                            ? Math.max(0, (inputs[product.id]?.quantityGiven as number) - (inputs[product.id]?.quantityLeft as number))
                            : 0}
                        </TableCell>
                        <TableCell className="text-right font-mono-numbers font-medium text-slate-700">
                          {formatCurrency(product.soldValue)}
                        </TableCell>
                        <TableCell className="bg-orange-50/10 border-l border-orange-100/50 p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="h-8 font-mono-numbers text-center bg-white border-orange-200 focus-visible:ring-orange-500"
                            value={inputs[product.id]?.discountAmount}
                            onChange={(e) => handleInputChange(product.id, "discountAmount", e.target.value)}
                            data-testid={`input-discount-${product.id}`}
                          />
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
                      step="0.01"
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
                      ⚠ Error: Debt cannot exceed total sales
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Total value of items sold on credit (deducted from sales)
                  </p>
                </div>
              </CardContent>
            </Card>

             {/* Summary Breakdown */}
             <Card className="border shadow-sm bg-slate-900 text-slate-50">
              <CardHeader>
                <CardTitle className="text-slate-100">Revenue Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Sales Value</span>
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
                  <span className="text-slate-200">Cash Sales Value</span>
                  <span className="font-mono-numbers">{formatCurrency(calculations.cashValueBeforeDiscount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Less: Total Discount</span>
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
