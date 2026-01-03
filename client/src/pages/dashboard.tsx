import React, { useState, useMemo } from "react";
import { PRELOADED_PRODUCTS } from "../data/products";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { DollarSign, CreditCard, Percent, AlertCircle } from "lucide-react";

type ProductInput = {
  quantityGiven: number | "";
  quantityLeft: number | "";
  quantitySoldDiscount: number | "";
};

type InputsMap = Record<string, ProductInput>;

export default function Dashboard() {
  const [inputs, setInputs] = useState<InputsMap>(() => {
    const initial: InputsMap = {};
    PRELOADED_PRODUCTS.forEach((p) => {
      initial[p.id] = { quantityGiven: "", quantityLeft: "", quantitySoldDiscount: "" };
    });
    return initial;
  });

  const [totalCreditDebt, setTotalCreditDebt] = useState<number | "">("");
  const [totalDifferences, setTotalDifferences] = useState<number | "">("");

  const handleInputChange = (id: string, field: keyof ProductInput, value: string) => {
    // Basic sanitization: only allow digits and decimals
    const sanitizedValue = value.replace(/[^0-9.]/g, "");
    const numValue = sanitizedValue === "" ? "" : parseFloat(sanitizedValue);
    
    // Safety check for NaN or negative numbers
    if (sanitizedValue !== "" && (isNaN(Number(numValue)) || Number(numValue) < 0)) return;
    
    setInputs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: numValue },
    }));
  };

  const calculations = useMemo(() => {
    let totalSoldQuantity = 0;
    let totalSoldValue = 0;
    let totalDiscountedValue = 0;
    let totalQuantityRemaining = 0;
    let totalQuantityGiven = 0;

    const productsCalculated = PRELOADED_PRODUCTS.map((product) => {
      const input = inputs[product.id];
      const qtyGiven = input.quantityGiven === "" ? 0 : input.quantityGiven;
      const qtyLeft = input.quantityLeft === "" ? 0 : input.quantityLeft;
      const qtyDiscount = input.quantitySoldDiscount === "" ? 0 : input.quantitySoldDiscount;
      
      // Validation: Qty left cannot exceed qty given
      const validQtyLeft = Math.min(qtyLeft, qtyGiven);
      
      // Calculate quantities
      const qtySold = Math.max(0, qtyGiven - validQtyLeft);
      const qtyNormal = Math.max(0, qtySold - qtyDiscount);
      
      // Check eligibility for discount (cash price >= 1000)
      const isEligibleForDiscount = product.cashPrice >= 1000;
      
      // Calculate values: Normal uses CREDIT PRICE, Discounted uses CASH PRICE
      const normalValue = qtyNormal * product.creditPrice;
      const discountedValue = qtyDiscount * product.cashPrice; // Calculate: Qty Discount * Cash Price
      const totalProductValue = normalValue + discountedValue;

      totalSoldQuantity += qtySold;
      totalSoldValue += normalValue;  // Only add normal value (credit price based)
      totalDiscountedValue += discountedValue;  // Track all discounted values
      totalQuantityRemaining += validQtyLeft;
      totalQuantityGiven += qtyGiven;

      return {
        ...product,
        qtySold,
        qtyNormal,
        qtyDiscount,
        normalValue,
        discountedValue,
        totalProductValue,
        isEligibleForDiscount,
        validQtyLeft
      };
    });

    const creditDebt = totalCreditDebt === "" ? 0 : totalCreditDebt;
    const differences = totalDifferences === "" ? 0 : totalDifferences;
    const isCreditDebtInvalid = creditDebt > totalSoldValue;
    
    // Calculate cash before discount (total normal sales - credit debt - differences)
    const cashValueBeforeDiscount = Math.max(0, totalSoldValue - creditDebt - differences);
    
    // Apply 10% discount ONLY on the total discounted value
    const totalDiscountAmount = totalDiscountedValue * 0.10;
    
    // Cash after discount = cash before discount + (total discounted value - total discount amount)
    const cashValueAfterDiscount = cashValueBeforeDiscount + (totalDiscountedValue - totalDiscountAmount);

    return {
      productsCalculated,
      totalSoldQuantity,
      totalSoldValue,
      totalDiscountedValue,
      totalDiscountAmount,
      totalQuantityRemaining,
      totalQuantityGiven,
      creditDebt,
      differences,
      isCreditDebtInvalid,
      cashValueBeforeDiscount,
      cashValueAfterDiscount
    };
  }, [inputs, totalCreditDebt, totalDifferences]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 2 }).format(val);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-300 pb-4 md:pb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight">Pharmacy Accounting System</h1>
          <p className="text-sm md:text-base text-slate-600 mt-1 md:mt-2">Daily sales tracking with automatic discount and credit calculations</p>
          <p className="text-[10px] md:text-sm text-slate-500 mt-1">
            Date: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <MetricCard 
            label="Total Sales" 
            value={formatCurrency(calculations.totalSoldValue)}
            icon={<DollarSign className="w-4 h-4 md:w-5 md:h-5" />}
            color="blue"
          />
          <MetricCard 
            label="Credit Debt" 
            value={formatCurrency(calculations.creditDebt)}
            icon={<CreditCard className="w-4 h-4 md:w-5 md:h-5" />}
            color="purple"
          />
          <MetricCard 
            label="Discount" 
            value={formatCurrency(calculations.totalDiscountAmount)}
            icon={<Percent className="w-4 h-4 md:w-5 md:h-5" />}
            color="orange"
          />
          <MetricCard 
            label="Final Cash" 
            value={formatCurrency(calculations.cashValueAfterDiscount)}
            icon={<DollarSign className="w-4 h-4 md:w-5 md:h-5" />}
            color="emerald"
            highlight
          />
        </div>

        {/* Main Table */}
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="bg-[#f8fafc] border-b px-4 py-3 md:px-6 md:py-4">
            <CardTitle className="text-base md:text-lg">Product Sales Data</CardTitle>
            <CardDescription className="mt-1 flex items-start gap-2 text-[11px] md:text-sm">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#2563eb]" />
              <span>
                Enter Qty Given, Qty Left, and Qty Discount. 10% discount applies if cash price ≥ 1000 GHS.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
              <Table className="min-w-[1200px] w-full border-collapse">
                <TableHeader>
                  <TableRow className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <TableHead className="table-header-sticky w-[160px] md:w-[200px] min-w-[160px] md:min-w-[200px] font-bold text-[#0f172a] text-xs md:text-sm">Product Name</TableHead>
                    <TableHead className="text-right whitespace-nowrap px-2 md:px-4 font-bold text-[#334155] text-xs md:text-sm">Cash Price</TableHead>
                    <TableHead className="text-right whitespace-nowrap px-2 md:px-4 font-bold text-[#94a3b8] text-xs md:text-sm">Credit Price</TableHead>
                    <TableHead className="bg-purple-input text-[#4c1d95] border-l border-[#ddd6fe] text-center font-bold px-2 md:px-4 text-xs md:text-sm">Qty Given</TableHead>
                    <TableHead className="bg-red-input text-[#7f1d1d] border-l border-[#fecaca] text-center font-bold px-2 md:px-4 text-xs md:text-sm">Qty Left</TableHead>
                    <TableHead className="text-center font-bold px-2 md:px-4 text-xs md:text-sm">Qty Sold</TableHead>
                    <TableHead className="text-center font-bold px-2 md:px-4 text-xs md:text-sm">Qty Normal</TableHead>
                    <TableHead className="bg-yellow-input text-[#713f12] border-l border-[#fef08a] text-center font-bold px-2 md:px-4 text-xs md:text-sm">Qty Discount</TableHead>
                    <TableHead className="text-right font-bold px-2 md:px-4 text-xs md:text-sm">Normal Val</TableHead>
                    <TableHead className="text-right font-bold px-2 md:px-4 text-xs md:text-sm">Disc Val</TableHead>
                    <TableHead className="text-right font-bold px-2 md:px-4 bg-[#f1f5f9] border-l border-[#e2e8f0] text-xs md:text-sm">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.productsCalculated.map((product) => (
                    <TableRow key={product.id} className="border-b border-[#f1f5f9] hover:bg-[#eff6ff]/50 transition-colors">
                      <TableCell className="table-cell-sticky py-2 md:py-3 text-xs md:text-sm">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[140px] md:max-w-[180px] font-semibold text-[#0f172a]">{product.name}</span>
                          {product.isEligibleForDiscount && (
                            <Badge variant="outline" className="mt-1 w-fit text-[9px] md:text-[10px] py-0 bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]">Eligible</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-[11px] md:text-sm px-2 md:px-4">
                        {product.cashPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[11px] md:text-sm text-[#94a3b8] px-2 md:px-4">
                        {product.creditPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="bg-[#f5f3ff]/30 border-l border-[#ede9fe] p-1.5 md:p-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder="0"
                          className="h-8 md:h-9 text-center font-mono text-[11px] md:text-sm bg-white border-[#ddd6fe] focus:ring-[#8b5cf6]"
                          value={inputs[product.id]?.quantityGiven}
                          onChange={(e) => handleInputChange(product.id, "quantityGiven", e.target.value)}
                          data-testid={`input-qty-given-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="bg-[#fef2f2]/30 border-l border-[#fee2e2] p-1.5 md:p-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder="0"
                          className="h-8 md:h-9 text-center font-mono text-[11px] md:text-sm bg-white border-[#fecaca] focus:ring-[#ef4444]"
                          value={inputs[product.id]?.quantityLeft}
                          onChange={(e) => handleInputChange(product.id, "quantityLeft", e.target.value)}
                          data-testid={`input-qty-left-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-center font-mono font-medium text-[#0f172a] px-2 md:px-4 text-[11px] md:text-sm">
                        {product.qtySold}
                      </TableCell>
                      <TableCell className="text-center font-mono text-[#475569] px-2 md:px-4 text-[11px] md:text-sm">
                        {product.qtyNormal}
                      </TableCell>
                      <TableCell className="bg-[#fefce8]/30 border-l border-[#fef9c3] p-1.5 md:p-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder="0"
                          className="h-8 md:h-9 text-center font-mono text-[11px] md:text-sm bg-white border-[#fef08a] focus:ring-[#eab308]"
                          value={inputs[product.id]?.quantitySoldDiscount}
                          onChange={(e) => handleInputChange(product.id, "quantitySoldDiscount", e.target.value)}
                          data-testid={`input-qty-discount-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono text-[11px] md:text-sm text-[#475569] px-2 md:px-4">
                        {product.normalValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[11px] md:text-sm text-[#c2410c] font-medium px-2 md:px-4">
                        {product.discountedValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-[#0f172a] bg-[#f8fafc]/50 border-l border-[#e2e8f0] px-2 md:px-4 py-2 md:py-3 text-[11px] md:text-sm">
                        {product.totalProductValue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Credit Debt, Differences & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs Section */}
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader className="bg-[#f5f3ff] border-b border-[#ddd6fe] px-4 py-3 md:px-6 md:py-4">
                <CardTitle className="text-base text-[#4c1d95]">Total Credit Debt</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Label htmlFor="credit-debt" className="text-sm font-medium text-[#1e1b4b]">Value of products sold on credit (GHS)</Label>
                <div className="relative mt-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6366f1] font-bold">GHS</span>
                  <Input 
                    id="credit-debt"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`pl-12 font-mono text-lg h-10 ${
                      calculations.isCreditDebtInvalid ? "border-[#ef4444] bg-[#fef2f2]" : "border-[#c7d2fe] focus:ring-[#6366f1]"
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
                  <p className="text-xs text-[#ef4444] font-bold mt-2">
                    ⚠ Credit debt cannot exceed total sales ({formatCurrency(calculations.totalSoldValue)})
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="bg-[#eff6ff] border-b border-[#bfdbfe] px-4 py-3 md:px-6 md:py-4">
                <CardTitle className="text-base text-[#1e40af]">Total Differences</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Label htmlFor="differences" className="text-sm font-medium text-[#1e3a8a]">Enter total differences (GHS)</Label>
                <div className="relative mt-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3b82f6] font-bold">GHS</span>
                  <Input 
                    id="differences"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-12 font-mono text-lg h-10 border-[#bfdbfe] focus:ring-[#3b82f6]"
                    value={totalDifferences}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                      setTotalDifferences(val);
                    }}
                    data-testid="input-differences"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="lg:col-span-2 shadow-md summary-card overflow-hidden">
            <CardHeader className="p-4 md:p-6 border-b border-white/10">
              <CardTitle className="text-white text-base md:text-lg">Daily Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4 text-xs md:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Total Sales Value</span>
                <span className="font-mono font-semibold">{formatCurrency(calculations.totalSoldValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Less: Total Credit Debt</span>
                <span className="font-mono text-red-300">- {formatCurrency(calculations.creditDebt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Less: Total Differences</span>
                <span className="font-mono text-blue-300">- {formatCurrency(calculations.differences)}</span>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-between items-center font-medium">
                <span className="text-slate-100">Cash Sales Before Discount</span>
                <span className="font-mono">{formatCurrency(calculations.cashValueBeforeDiscount)}</span>
              </div>
              <div className="pt-1 md:pt-2">
                <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-1">10% Discount Applied to:</p>
                <p className="text-xs md:text-sm font-mono text-orange-300 ml-2 md:ml-4 flex justify-between">
                  <span>Total Discounted Value:</span>
                  <span>{formatCurrency(calculations.totalDiscountedValue)}</span>
                </p>
              </div>
              <div className="flex justify-between items-center pt-1 md:pt-2">
                <span className="text-slate-300">Less: Total Discount Amount</span>
                <span className="font-mono text-orange-300">- {formatCurrency(calculations.totalDiscountAmount)}</span>
              </div>
              <Separator className="bg-white/10" />
              <div className="pt-2 md:pt-4">
                <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-2">Final Cash Revenue</p>
                <p className="text-2xl md:text-4xl font-black font-mono text-emerald-400 leading-none">
                  {formatCurrency(calculations.cashValueAfterDiscount)}
                </p>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-between items-center text-[10px] md:text-xs pt-1">
                <span className="text-slate-400">Inventory Remaining</span>
                <span className="font-mono">{calculations.totalQuantityRemaining} / {calculations.totalQuantityGiven} units</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, highlight = false }: any) {
  const colorClasses = {
    blue: "metric-card-blue",
    purple: "metric-card-purple",
    orange: "metric-card-orange",
    emerald: "metric-card-emerald",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`border rounded-xl p-5 ${colorClasses[color as keyof typeof colorClasses]} ${highlight ? 'ring-2 ring-[#10b981] shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="space-y-0.5 min-w-0">
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider opacity-70 leading-none truncate">{label}</p>
          <p className="text-base md:text-2xl font-black font-mono mt-0.5 md:mt-1 tracking-tight truncate leading-tight">{value}</p>
        </div>
        <div className="p-1 md:p-2 bg-white/50 rounded-lg shadow-inner flex-shrink-0">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
