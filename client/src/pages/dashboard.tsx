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

  const handleInputChange = (id: string, field: keyof ProductInput, value: string) => {
    const numValue = value === "" ? "" : parseFloat(value);
    if (typeof numValue === "number" && numValue < 0) return;
    
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
      
      // Calculate values using CASH PRICE
      const normalValue = qtyNormal * product.cashPrice;
      const discountedValue = isEligibleForDiscount ? qtyDiscount * product.cashPrice : 0;
      const totalProductValue = normalValue + discountedValue;

      totalSoldQuantity += qtySold;
      totalSoldValue += totalProductValue;
      totalDiscountedValue += discountedValue;
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
    const isCreditDebtInvalid = creditDebt > totalSoldValue;
    
    // Calculate cash before discount (total sold value - credit debt)
    const cashValueBeforeDiscount = Math.max(0, totalSoldValue - creditDebt);
    
    // Apply 10% discount ONLY on the total discounted value
    const totalDiscountAmount = totalDiscountedValue * 0.10;
    
    // Cash after discount = cash before discount - total discount
    const cashValueAfterDiscount = cashValueBeforeDiscount - totalDiscountAmount;

    return {
      productsCalculated,
      totalSoldQuantity,
      totalSoldValue,
      totalDiscountedValue,
      totalDiscountAmount,
      totalQuantityRemaining,
      totalQuantityGiven,
      creditDebt,
      isCreditDebtInvalid,
      cashValueBeforeDiscount,
      cashValueAfterDiscount
    };
  }, [inputs, totalCreditDebt]);

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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[180px]">Product Name</TableHead>
                    <TableHead className="text-right">Cash Price (GHS)</TableHead>
                    <TableHead className="text-right text-slate-600">Credit Price (GHS)</TableHead>
                    <TableHead className="bg-purple-50 text-purple-900 border-l border-purple-200">Qty Given</TableHead>
                    <TableHead className="bg-red-50 text-red-900 border-l border-red-200">Qty Left</TableHead>
                    <TableHead className="text-center">Qty Sold</TableHead>
                    <TableHead className="text-center">Qty Normal</TableHead>
                    <TableHead className="bg-yellow-50 text-yellow-900 border-l border-yellow-200">Qty Discount</TableHead>
                    <TableHead className="text-right">Normal Value</TableHead>
                    <TableHead className="text-right">Discount Value</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.productsCalculated.map((product) => (
                    <TableRow key={product.id} className="border-b hover:bg-slate-50">
                      <TableCell className="font-semibold text-slate-900">
                        {product.name}
                        {product.isEligibleForDiscount && (
                          <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">Eligible</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono-numbers font-medium">
                        {product.cashPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono-numbers text-slate-600 text-sm">
                        {product.creditPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="bg-purple-50 border-l border-purple-200 p-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="h-8 text-center font-mono-numbers text-sm bg-white border-purple-200"
                          value={inputs[product.id]?.quantityGiven}
                          onChange={(e) => handleInputChange(product.id, "quantityGiven", e.target.value)}
                          data-testid={`input-qty-given-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="bg-red-50 border-l border-red-200 p-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="h-8 text-center font-mono-numbers text-sm bg-white border-red-200"
                          value={inputs[product.id]?.quantityLeft}
                          onChange={(e) => handleInputChange(product.id, "quantityLeft", e.target.value)}
                          data-testid={`input-qty-left-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-center font-mono-numbers font-medium">
                        {product.qtySold}
                      </TableCell>
                      <TableCell className="text-center font-mono-numbers text-slate-700">
                        {product.qtyNormal}
                      </TableCell>
                      <TableCell className="bg-yellow-50 border-l border-yellow-200 p-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="h-8 text-center font-mono-numbers text-sm bg-white border-yellow-200"
                          value={inputs[product.id]?.quantitySoldDiscount}
                          onChange={(e) => handleInputChange(product.id, "quantitySoldDiscount", e.target.value)}
                          data-testid={`input-qty-discount-${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono-numbers text-slate-700">
                        {formatCurrency(product.normalValue)}
                      </TableCell>
                      <TableCell className="text-right font-mono-numbers text-orange-600 font-medium">
                        {formatCurrency(product.discountedValue)}
                      </TableCell>
                      <TableCell className="text-right font-mono-numbers font-medium text-slate-900">
                        {formatCurrency(product.totalProductValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Credit Debt Input & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credit Debt Input */}
          <Card className="shadow-md">
            <CardHeader className="bg-purple-50 border-b">
              <CardTitle className="text-base">Total Credit Debt</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Label htmlFor="credit-debt" className="text-sm font-medium">Enter total value of products sold on credit (GHS)</Label>
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
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]} ${highlight ? 'ring-2 ring-offset-2 ring-emerald-500' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-75">{label}</p>
          <p className="text-2xl font-bold font-mono-numbers mt-1 tracking-tight">{value}</p>
        </div>
        {icon}
      </div>
    </motion.div>
  );
}
