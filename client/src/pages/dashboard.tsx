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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-300 pb-6">
          <h1 className="text-4xl font-bold text-slate-900">Pharmacy Accounting System</h1>
          <p className="text-slate-600 mt-2">Daily sales tracking with automatic discount and credit calculations</p>
          <p className="text-sm text-slate-500 mt-1">
            Date: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard 
            label="Total Sales Value" 
            value={formatCurrency(calculations.totalSoldValue)}
            icon={<DollarSign className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard 
            label="Credit Debt" 
            value={formatCurrency(calculations.creditDebt)}
            icon={<CreditCard className="w-5 h-5" />}
            color="purple"
          />
          <MetricCard 
            label="Total Discount (10%)" 
            value={formatCurrency(calculations.totalDiscountAmount)}
            icon={<Percent className="w-5 h-5" />}
            color="orange"
          />
          <MetricCard 
            label="Cash After Discount" 
            value={formatCurrency(calculations.cashValueAfterDiscount)}
            icon={<DollarSign className="w-5 h-5" />}
            color="emerald"
            highlight
          />
        </div>

        {/* Main Table */}
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="bg-slate-100 border-b">
            <CardTitle className="text-lg">Product Sales Data</CardTitle>
            <CardDescription className="mt-2 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>
                <strong>User inputs per product:</strong> Quantity Given, Quantity Left (unsold), and Quantity on Discount.<br/>
                <strong>Calculations:</strong> Qty Sold = Qty Given - Qty Left. Values use Cash Price. Discount (10%) applies only to discounted items with cash price ≥ 1000 GHS. Discount is calculated on total discounted value.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
              <Table className="min-w-[1000px] lg:min-w-full">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200">
                    <TableHead className="sticky left-0 z-10 bg-slate-50 w-[200px] min-w-[200px] font-bold text-slate-900 border-r">Product Name</TableHead>
                    <TableHead className="text-right whitespace-nowrap px-4 font-bold text-slate-700">Cash Price</TableHead>
                    <TableHead className="text-right whitespace-nowrap px-4 font-bold text-slate-400">Credit Price</TableHead>
                    <TableHead className="bg-purple-50 text-purple-900 border-l border-purple-200 text-center font-bold px-4">Qty Given</TableHead>
                    <TableHead className="bg-red-50 text-red-900 border-l border-red-200 text-center font-bold px-4">Qty Left</TableHead>
                    <TableHead className="text-center font-bold px-4">Qty Sold</TableHead>
                    <TableHead className="text-center font-bold px-4">Qty Normal</TableHead>
                    <TableHead className="bg-yellow-50 text-yellow-900 border-l border-yellow-200 text-center font-bold px-4">Qty Discount</TableHead>
                    <TableHead className="text-right font-bold px-4">Normal Val</TableHead>
                    <TableHead className="text-right font-bold px-4">Disc Val</TableHead>
                    <TableHead className="text-right font-bold px-4 bg-slate-100 border-l">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.productsCalculated.map((product) => (
                    <TableRow key={product.id} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors">
                      <TableCell className="sticky left-0 z-10 bg-white group-hover:bg-blue-50/30 font-semibold text-slate-900 border-r py-3">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[180px]">{product.name}</span>
                          {product.isEligibleForDiscount && (
                            <Badge variant="outline" className="mt-1 w-fit text-[10px] py-0 bg-green-50 text-green-700 border-green-200">Eligible</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm px-4">
                        {product.cashPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-slate-400 px-4">
                        {product.creditPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="bg-purple-50/30 border-l border-purple-100 p-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder="0"
                          className="h-9 text-center font-mono text-sm bg-white border-purple-200 focus:ring-purple-500"
                          value={inputs[product.id]?.quantityGiven}
                          onChange={(e) => handleInputChange(product.id, "quantityGiven", e.target.value)}
                          data-testid={`input-qty-given-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="bg-red-50/30 border-l border-red-100 p-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder="0"
                          className="h-9 text-center font-mono text-sm bg-white border-red-200 focus:ring-red-500"
                          value={inputs[product.id]?.quantityLeft}
                          onChange={(e) => handleInputChange(product.id, "quantityLeft", e.target.value)}
                          data-testid={`input-qty-left-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-center font-mono font-medium text-slate-900 px-4">
                        {product.qtySold}
                      </TableCell>
                      <TableCell className="text-center font-mono text-slate-600 px-4">
                        {product.qtyNormal}
                      </TableCell>
                      <TableCell className="bg-yellow-50/30 border-l border-yellow-100 p-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder="0"
                          className="h-9 text-center font-mono text-sm bg-white border-yellow-200 focus:ring-yellow-500"
                          value={inputs[product.id]?.quantitySoldDiscount}
                          onChange={(e) => handleInputChange(product.id, "quantitySoldDiscount", e.target.value)}
                          data-testid={`input-qty-discount-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-slate-600 px-4">
                        {product.normalValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-orange-600 font-medium px-4">
                        {product.discountedValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-slate-900 bg-slate-50/50 border-l px-4 py-3">
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
              <CardHeader className="bg-purple-50 border-b">
                <CardTitle className="text-base">Total Credit Debt</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Label htmlFor="credit-debt" className="text-sm font-medium">Value of products sold on credit (GHS)</Label>
                <div className="relative mt-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">GHS</span>
                  <Input 
                    id="credit-debt"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`pl-12 font-mono-numbers text-lg h-10 ${
                      calculations.isCreditDebtInvalid ? "border-red-400 bg-red-50" : "border-purple-300"
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
                  <p className="text-xs text-red-600 font-medium mt-2">
                    ⚠ Credit debt cannot exceed total sales ({formatCurrency(calculations.totalSoldValue)})
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="text-base">Total Differences</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Label htmlFor="differences" className="text-sm font-medium">Enter total differences (GHS)</Label>
                <div className="relative mt-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">GHS</span>
                  <Input 
                    id="differences"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-12 font-mono-numbers text-lg h-10 border-blue-300"
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
          <Card className="lg:col-span-2 shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-white">Daily Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-300">Total Sales Value (Cash Price)</span>
                <span className="font-mono-numbers font-semibold">{formatCurrency(calculations.totalSoldValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Less: Total Credit Debt</span>
                <span className="font-mono-numbers text-red-300">- {formatCurrency(calculations.creditDebt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Less: Total Differences</span>
                <span className="font-mono-numbers text-blue-300">- {formatCurrency(calculations.differences)}</span>
              </div>
              <Separator className="bg-slate-700" />
              <div className="flex justify-between font-medium">
                <span className="text-slate-100">Cash Sales Before Discount</span>
                <span className="font-mono-numbers">{formatCurrency(calculations.cashValueBeforeDiscount)}</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">10% Discount Applied to:</p>
                <p className="text-sm font-mono-numbers text-orange-300 ml-4">Total Discounted Value: {formatCurrency(calculations.totalDiscountedValue)}</p>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-300">Less: Total Discount Amount (10%)</span>
                <span className="font-mono-numbers text-orange-300">- {formatCurrency(calculations.totalDiscountAmount)}</span>
              </div>
              <Separator className="bg-slate-700" />
              <div className="pt-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Final Cash Revenue</p>
                <p className="text-3xl font-bold font-mono-numbers text-emerald-400">
                  {formatCurrency(calculations.cashValueAfterDiscount)}
                </p>
              </div>
              <Separator className="bg-slate-700" />
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Inventory Remaining</span>
                <span className="font-mono-numbers">{calculations.totalQuantityRemaining} / {calculations.totalQuantityGiven} units</span>
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
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`border rounded-xl p-5 ${colorClasses[color as keyof typeof colorClasses]} ${highlight ? 'ring-2 ring-emerald-500 shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 leading-none">{label}</p>
          <p className="text-2xl font-black font-mono mt-1 tracking-tight truncate leading-tight">{value}</p>
        </div>
        <div className="p-2 bg-white/50 rounded-lg shadow-inner">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
