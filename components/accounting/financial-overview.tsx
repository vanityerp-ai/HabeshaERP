"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import type { DateRange } from "react-day-picker"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, PieChart, Pie, Cell } from "recharts"
import { useAuth } from "@/lib/auth-provider"
import { useTransactions } from "@/lib/transaction-provider"
import { aggregateFinancialSummary, aggregateDailySalesData } from "@/lib/accounting-data-aggregator"
import { format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns"

interface FinancialOverviewProps {
  dateRange?: DateRange
}

export function FinancialOverview({ dateRange }: FinancialOverviewProps) {
  const { currentLocation } = useAuth()
  const { transactions } = useTransactions()
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    serviceRevenue: 0,
    productRevenue: 0,
    totalExpenses: 0,
    operatingExpenses: 0,
    cogs: 0,
    netProfit: 0,
    inventoryValue: 25000,
    profitMargin: 0
  })

  const [revenueBreakdown, setRevenueBreakdown] = useState([
    { name: "Services", value: 0, color: "#8884d8" },
    { name: "Products", value: 0, color: "#82ca9d" }
  ])

  const [expenseBreakdown, setExpenseBreakdown] = useState([
    { name: "Operating", value: 0, color: "#ffc658" },
    { name: "COGS", value: 0, color: "#ff7c7c" }
  ])

  const [revenueData, setRevenueData] = useState<any[]>([])

  useEffect(() => {
    // Calculate financial data from actual transactions
    if (transactions && Array.isArray(transactions)) {
      console.log('📊 FinancialOverview: Calculating from transactions:', {
        transactionCount: transactions.length,
        dateRange,
        currentLocation
      })
      const safeDateRange = dateRange && dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined;
      const summary = aggregateFinancialSummary(transactions, [], safeDateRange, currentLocation !== "all" ? currentLocation : undefined)
      console.log('📊 FinancialOverview: Summary calculated:', summary)

      // Calculate service and product revenue from transactions
      let serviceRevenue = 0
      let productRevenue = 0

      transactions.forEach(t => {
        // Check if transaction is within date range
        if (safeDateRange?.from && safeDateRange?.to) {
          const txDate = new Date(t.date)
          if (txDate < startOfDay(safeDateRange.from) || txDate > endOfDay(safeDateRange.to)) {
            return
          }
        }

        // Check if transaction is in the correct location
        if (currentLocation && currentLocation !== 'all' && t.location !== currentLocation) {
          return
        }

        // Only count completed transactions
        if (t.status !== 'completed') {
          return
        }

        // Calculate service and product revenue based on transaction type
        if (t.type === 'consolidated_sale') {
          // For consolidated sales, use the serviceAmount and productAmount fields
          if (t.serviceAmount) {
            serviceRevenue += t.serviceAmount
          }
          if (t.productAmount) {
            productRevenue += t.productAmount
          }
        } else if (t.type === 'service_sale') {
          // For service sales, add to service revenue
          serviceRevenue += (t.amount || 0)
        } else if (t.type === 'product_sale') {
          // For product sales, add to product revenue
          productRevenue += (t.amount || 0)
        }
      })

      let totalExpenses = 0
      transactions.forEach(t => {
        // Check if transaction is an expense
        if (t.type !== 'expense') {
          return
        }

        // Check if transaction is within date range
        if (safeDateRange?.from && safeDateRange?.to) {
          const txDate = new Date(t.date)
          if (txDate < startOfDay(safeDateRange.from) || txDate > endOfDay(safeDateRange.to)) {
            return
          }
        }

        // Check if transaction is in the correct location
        if (currentLocation && currentLocation !== 'all' && t.location !== currentLocation) {
          return
        }

        totalExpenses += (t.amount || 0)
      })

      const netProfit = summary.totalRevenue - totalExpenses
      const profitMargin = summary.totalRevenue > 0 ? (netProfit / summary.totalRevenue) * 100 : 0

      setFinancialData({
        totalRevenue: summary.totalRevenue,
        serviceRevenue,
        productRevenue,
        totalExpenses,
        operatingExpenses: totalExpenses * 0.7, // Estimate
        cogs: totalExpenses * 0.3, // Estimate
        netProfit,
        inventoryValue: 25000,
        profitMargin
      })

      setRevenueBreakdown([
        { name: "Services", value: serviceRevenue, color: "#8884d8" },
        { name: "Products", value: productRevenue, color: "#82ca9d" }
      ])

      setExpenseBreakdown([
        { name: "Operating", value: totalExpenses * 0.7, color: "#ffc658" },
        { name: "COGS", value: totalExpenses * 0.3, color: "#ff7c7c" }
      ])

      // Generate daily revenue data
      if (safeDateRange?.from && safeDateRange?.to) {
        const dailySales = aggregateDailySalesData(transactions, safeDateRange, currentLocation !== "all" ? currentLocation : undefined)
        setRevenueData(dailySales.map(day => ({
          date: day.date,
          services: day.grossSales * 0.7, // Estimate
          products: day.grossSales * 0.3, // Estimate
          expenses: day.grossSales * 0.2, // Estimate
          profit: day.netSales * 0.5 // Estimate
        })))
      }
    }
  }, [transactions, dateRange, currentLocation])

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={financialData.totalRevenue} /></div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Services:</span>
                <span><CurrencyDisplay amount={financialData.serviceRevenue} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Products:</span>
                <span><CurrencyDisplay amount={financialData.productRevenue} /></span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={financialData.totalExpenses} /></div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operating:</span>
                <span><CurrencyDisplay amount={financialData.operatingExpenses} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">COGS:</span>
                <span><CurrencyDisplay amount={financialData.cogs} /></span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={financialData.netProfit} /></div>
            <p className="text-xs text-muted-foreground">+25% from last month</p>
            <div className="mt-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin:</span>
                <span className="font-medium">{financialData.profitMargin}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={financialData.inventoryValue} /></div>
            <p className="text-xs text-muted-foreground">Current stock value</p>
            <div className="mt-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Turnover:</span>
                <span className="font-medium">6.2x/year</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Product Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">44.2%</div>
            <p className="text-xs text-muted-foreground">Average product margin</p>
            <div className="mt-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">vs Services:</span>
                <span className="font-medium">48.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Revenue Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
          <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
          <TabsTrigger value="margins">Profit Margins</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Profit Trends</CardTitle>
              <CardDescription>Combined services and product revenue with profit analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        <CurrencyDisplay amount={Number(value)} />,
                        name === 'services' ? 'Services' :
                        name === 'products' ? 'Products' :
                        name === 'profit' ? 'Net Profit' : name
                      ]}
                    />
                    <Line type="monotone" dataKey="services" stroke="#8884d8" strokeWidth={2} name="Services" />
                    <Line type="monotone" dataKey="products" stroke="#82ca9d" strokeWidth={2} name="Products" />
                    <Line type="monotone" dataKey="profit" stroke="#ffc658" strokeWidth={3} name="Net Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
                <CardDescription>Breakdown of revenue by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {revenueBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => <CurrencyDisplay amount={Number(value)} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {revenueBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium"><CurrencyDisplay amount={item.value} /></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service vs Product Revenue</CardTitle>
                <CardDescription>Daily comparison of revenue streams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => <CurrencyDisplay amount={Number(value)} />} />
                      <Bar dataKey="services" fill="#8884d8" name="Services" />
                      <Bar dataKey="products" fill="#82ca9d" name="Products" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Operating expenses vs Cost of Goods Sold</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => <CurrencyDisplay amount={Number(value)} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {expenseBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium"><CurrencyDisplay amount={item.value} /></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Trends</CardTitle>
                <CardDescription>Operating expenses and COGS over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => <CurrencyDisplay amount={Number(value)} />} />
                      <Bar dataKey="expenses" fill="#ffc658" name="Operating" />
                      <Bar dataKey="cogs" fill="#ff7c7c" name="COGS" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="margins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit Margin Analysis</CardTitle>
              <CardDescription>Service margins vs Product margins comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Service Margins</h4>
                  <div className="text-2xl font-bold text-blue-600">48.5%</div>
                  <p className="text-sm text-muted-foreground">Average service profit margin</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Hair Services:</span>
                      <span className="font-medium">52%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nail Services:</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skin Services:</span>
                      <span className="font-medium">47%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Product Margins</h4>
                  <div className="text-2xl font-bold text-green-600">44.2%</div>
                  <p className="text-sm text-muted-foreground">Average product profit margin</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Hair Products:</span>
                      <span className="font-medium">46%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skin Products:</span>
                      <span className="font-medium">42%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tools:</span>
                      <span className="font-medium">38%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Combined Margin</h4>
                  <div className="text-2xl font-bold text-purple-600">47.1%</div>
                  <p className="text-sm text-muted-foreground">Overall business margin</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Target:</span>
                      <span className="font-medium">50%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Industry Avg:</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>vs Last Month:</span>
                      <span className="font-medium text-green-600">+2.1%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

