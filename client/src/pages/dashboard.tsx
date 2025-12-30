import React, { useState, useMemo } from "react";
import { PRELOADED_PRODUCTS, Product } from "../data/products";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Calculator, CreditCard, DollarSign, Package, Percent, Info, AlertCircle } from "lucide-react";

// Types for user input state
type ProductInput = {
  quantityGiven: number | "";
  quantityLeft: number | "";
  quantityCredit: number | "";
  discountItems: number | "";
};

type InputsMap = Record<string, ProductInput>;

export default function Dashboard() {
  // State for product inputs
  const [inputs, setInputs] = useState<InputsMap>(() => {
    const initial: InputsMap = {};
    PRELOADED_PRODUCTS.forEach((p) => {
      initial[p.id] = { quantityGiven: "", quantityLeft: "", quantityCredit: "", discountItems: "" };
    });
    return initial;
  });

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
    let totalCashSalesValue = 0;
    let totalCreditDebt = 0;
    let totalDiscountValue = 0;
    let totalQuantityRemaining = 0;
    let totalQuantityGiven = 0;

    const productsCalculated = PRELOADED_PRODUCTS.map((product) => {
      const input = inputs[product.id];
      const qtyGiven = input.quantityGiven === "" ? 0 : input.quantityGiven;
      const qtyLeft = input.quantityLeft === "" ? 0 : input.quantityLeft;
      const qtyCredit = input.quantityCredit === "" ? 0 : input.quantityCredit;
      const discountItems = input.discountItems === "" ? 0 : input.discountItems;
      
      const qtySold = Math.max(0, qtyGiven - qtyLeft);
      const qtyCash = Math.max(0, qtySold - qtyCredit);
      
      // Cash sales value (before discount)
      const cashSalesValue = qtyCash * product.cashPrice;
      
      // Credit sales value
      const creditSalesValue = qtyCredit * product.creditPrice;
      
      // Discount: 10% on cash sales for the discount items
      const validDiscountItems = Math.min(discountItems, qtyCash);
      const discountValue = validDiscountItems * product.cashPrice * 0.10;
      
      totalCashSalesValue += (cashSalesValue - discountValue);
      totalCreditDebt += creditSalesValue;
      totalDiscountValue += discountValue;
      totalQuantityRemaining += qtyLeft;
      totalQuantityGiven += qtyGiven;

      return {
        ...product,
        qtySold,
        qtyCash,
        qtyCredit,
        cashSalesValue,
        creditSalesValue,
        discountValue,
        validDiscountItems,
      };
    });

    return {
      productsCalculated,
      totalCashSalesValue,
      totalCreditDebt,
      totalDiscountValue,
      totalQuantityRemaining,
      totalQuantityGiven,
      finalCashRevenue: totalCashSalesValue,
    };
  }, [inputs]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 2 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pharmacy Accounting</h1>
            <p className="text-slate-500 mt-1">Track inventory, manage credit sales, and apply discounts.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border shadow-sm">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Top Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportCard 
            title="Cash Sales (After Discount)" 
            value={formatCurrency(calculations.totalCashSalesValue)}
            icon={<DollarSign className="w-4 h-4 text-blue-600" />}
            colorClass="text-blue-700 bg-blue-50/50 border-blue-100"
          />
          <ReportCard 
            title="Total Credit Debt" 
            value={formatCurrency(calculations.totalCreditDebt)}
            icon={<CreditCard className="w-4 h-4 text-purple-600" />}
            colorClass="text-purple-700 bg-purple-50/50 border-purple-100"
          />
          <ReportCard 
            title="Total Discount (10%)" 
            value={formatCurrency(calculations.totalDiscountValue)}
            icon={<Percent className="w-4 h-4 text-orange-600" />}
            colorClass="text-orange-700 bg-orange-50/50 border-orange-100"
          />
          <ReportCard 
            title="Items Remaining" 
            value={`${calculations.totalQuantityRemaining}`}
            subValue={`of ${calculations.totalQuantityGiven} total`}
            icon={<Package className="w-4 h-4 text-slate-600" />}
            colorClass="text-slate-700 bg-white border-slate-200"
          />
        </div>

        {/* Main Product Table */}
        <Card className="border shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle>Product Sales Entry</CardTitle>
            <CardDescription className="flex items-start gap-2 mt-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>Enter Qty Given, Qty Left (unsold), Qty Sold on Credit, and number of items to discount (10% applied automatically)</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[140px] sticky left-0 bg-slate-50">Product Name</TableHead>
                    <TableHead className="text-center text-xs">Cash<br/>Price</TableHead>
                    <TableHead className="text-center text-xs">Credit<br/>Price</TableHead>
                    <TableHead className="w-[80px] bg-purple-50/30 text-purple-900 border-l border-purple-100">
                      Qty<br/>Given
                    </TableHead>
                    <TableHead className="w-[80px] bg-amber-50/30 text-amber-900 border-l border-amber-100">
                      Qty<br/>Left
                    </TableHead>
                    <TableHead className="text-center text-xs">Qty<br/>Sold</TableHead>
                    <TableHead className="w-[80px] bg-indigo-50/30 text-indigo-900 border-l border-indigo-100">
                      Qty Credit<br/>Sold
                    </TableHead>
                    <TableHead className="text-center text-xs">Cash<br/>Qty</TableHead>
                    <TableHead className="text-right text-xs">Cash<br/>Value</TableHead>
                    <TableHead className="text-right text-xs">Credit<br/>Value</TableHead>
                    <TableHead className="w-[80px] bg-orange-50/30 text-orange-900 border-l border-orange-100">
                      Items to<br/>Discount
                    </TableHead>
                    <TableHead className="text-right text-xs">Discount<br/>10%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.productsCalculated.map((product) => (
                    <TableRow key={product.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-700 sticky left-0 bg-white hover:bg-slate-50">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-center font-mono-numbers text-sm text-slate-600">
                        {product.cashPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center font-mono-numbers text-sm text-slate-600">
                        {product.creditPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="bg-purple-50/10 border-l border-purple-100/50 p-1">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="h-7 font-mono-numbers text-center text-sm bg-white border-purple-200 focus-visible:ring-purple-500"
                          value={inputs[product.id]?.quantityGiven}
                          onChange={(e) => handleInputChange(product.id, "quantityGiven", e.target.value)}
                          data-testid={`input-qty-given-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="bg-amber-50/10 border-l border-amber-100/50 p-1">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="h-7 font-mono-numbers text-center text-sm bg-white border-amber-200 focus-visible:ring-amber-500"
                          value={inputs[product.id]?.quantityLeft}
                          onChange={(e) => handleInputChange(product.id, "quantityLeft", e.target.value)}
                          data-testid={`input-qty-left-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-center font-mono-numbers text-sm font-medium text-slate-700">
                        {product.qtySold}
                      </TableCell>
                      <TableCell className="bg-indigo-50/10 border-l border-indigo-100/50 p-1">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="h-7 font-mono-numbers text-center text-sm bg-white border-indigo-200 focus-visible:ring-indigo-500"
                          value={inputs[product.id]?.quantityCredit}
                          onChange={(e) => handleInputChange(product.id, "quantityCredit", e.target.value)}
                          data-testid={`input-qty-credit-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-center font-mono-numbers text-sm text-slate-700">
                        {product.qtyCash}
                      </TableCell>
                      <TableCell className="text-right font-mono-numbers text-sm text-slate-600">
                        {formatCurrency(product.cashSalesValue)}
                      </TableCell>
                      <TableCell className="text-right font-mono-numbers text-sm text-slate-600">
                        {formatCurrency(product.creditSalesValue)}
                      </TableCell>
                      <TableCell className="bg-orange-50/10 border-l border-orange-100/50 p-1">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="h-7 font-mono-numbers text-center text-sm bg-white border-orange-200 focus-visible:ring-orange-500"
                          value={inputs[product.id]?.discountItems}
                          onChange={(e) => handleInputChange(product.id, "discountItems", e.target.value)}
                          data-testid={`input-discount-items-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono-numbers text-sm text-orange-600 font-medium">
                        {formatCurrency(product.discountValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="border shadow-sm bg-slate-900 text-slate-50">
          <CardHeader>
            <CardTitle className="text-slate-100">Daily Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Discount (10%)</span>
                  <span className="font-mono-numbers text-orange-300">- {formatCurrency(calculations.totalDiscountValue)}</span>
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-200">Cash Revenue</span>
                  <span className="font-mono-numbers text-blue-300">{formatCurrency(calculations.totalCashSalesValue)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Credit Debt</span>
                  <span className="font-mono-numbers text-purple-300">{formatCurrency(calculations.totalCreditDebt)}</span>
                </div>
                <Separator className="bg-slate-700" />
                <div className="pt-2 border-t border-slate-700">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Total Outstanding</div>
                  <div className="text-2xl font-bold font-mono-numbers text-slate-100 tracking-tight">
                    {formatCurrency(calculations.totalCreditDebt)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
      className={`relative overflow-hidden rounded-xl border p-4 shadow-sm ${colorClass} ${highlight ? 'ring-2 ring-emerald-500/30' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{title}</p>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-bold font-mono-numbers tracking-tight">{value}</h3>
        {subValue && <span className="text-sm opacity-70">{subValue}</span>}
      </div>
    </motion.div>
  );
}
