'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllAppointments } from '@/lib/appointment-service'
import { TransactionProvider, useTransactions } from '@/lib/transaction-provider'
import { TransactionStatus } from '@/lib/transaction-types'

function RevenueDiagnosticContent() {
  const [diagnosticData, setDiagnosticData] = useState<any>(null)
  const { transactions } = useTransactions()

  useEffect(() => {
    const runDiagnostic = () => {
      const appointments = getAllAppointments()

      // Filter pending appointments
      const pendingStatuses = ['confirmed', 'arrived', 'service-started']
      const pendingAppointments = appointments.filter(apt => 
        pendingStatuses.includes(apt.status) && !apt.isReflected
      )

      // Calculate pending revenue
      let totalPendingRevenue = 0
      const pendingDetails: any[] = []

      pendingAppointments.forEach(apt => {
        // Check if has completed transaction
        const existingTransaction = transactions.find(tx => {
          const hasReferenceMatch = tx.reference?.type === 'appointment' && tx.reference?.id === apt.id
          const hasAppointmentIdMatch = (tx as any).appointmentId === apt.id
          const isCompleted = tx.status === TransactionStatus.COMPLETED || tx.status === 'completed'
          
          return (hasReferenceMatch || hasAppointmentIdMatch) && isCompleted
        })

        const alreadyPaid = apt.transactionRecorded === true || apt.paymentStatus === 'paid'
        const shouldCount = !existingTransaction && !alreadyPaid

        const revenue = apt.price || 0

        if (shouldCount) {
          totalPendingRevenue += revenue
        }

        pendingDetails.push({
          clientName: apt.clientName,
          service: apt.service,
          status: apt.status,
          price: apt.price,
          hasTransaction: !!existingTransaction,
          transactionId: existingTransaction?.id,
          alreadyPaid,
          shouldCount,
          transactionRecorded: apt.transactionRecorded,
          paymentStatus: apt.paymentStatus
        })
      })

      // Analyze transactions by source
      const completedTransactions = transactions.filter(tx => 
        tx.status === TransactionStatus.COMPLETED || tx.status === 'completed'
      )

      const bySource = {
        POS: 0,
        CALENDAR: 0,
        CLIENT_PORTAL: 0,
        HOME_SERVICE: 0,
        UNKNOWN: 0
      }

      const transactionsWithoutSource: any[] = []

      completedTransactions.forEach(tx => {
        const source = tx.source || 'UNKNOWN'
        bySource[source as keyof typeof bySource] = (bySource[source as keyof typeof bySource] || 0) + tx.amount
        
        if (!tx.source) {
          transactionsWithoutSource.push({
            id: tx.id,
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            date: tx.date,
            reference: tx.reference,
            appointmentId: (tx as any).appointmentId
          })
        }
      })

      const totalRevenue = Object.values(bySource).reduce((a, b) => a + b, 0)
      const inPersonSales = bySource.POS + bySource.CALENDAR
      const onlineSales = bySource.CLIENT_PORTAL
      const homeServiceSales = bySource.HOME_SERVICE
      const unknownSales = bySource.UNKNOWN

      setDiagnosticData({
        pendingAppointments: {
          total: pendingAppointments.length,
          byStatus: {
            confirmed: pendingAppointments.filter(a => a.status === 'confirmed').length,
            arrived: pendingAppointments.filter(a => a.status === 'arrived').length,
            serviceStarted: pendingAppointments.filter(a => a.status === 'service-started').length
          },
          totalRevenue: totalPendingRevenue,
          details: pendingDetails
        },
        transactions: {
          total: transactions.length,
          completed: completedTransactions.length,
          totalRevenue,
          bySource,
          inPersonSales,
          onlineSales,
          homeServiceSales,
          unknownSales,
          transactionsWithoutSource
        },
        discrepancy: {
          totalRevenue,
          sumOfSources: inPersonSales + onlineSales + homeServiceSales,
          difference: totalRevenue - (inPersonSales + onlineSales + homeServiceSales),
          unknownRevenue: unknownSales
        }
      })
    }

    runDiagnostic()
  }, [])

  if (!diagnosticData) {
    return <div className="p-8">Loading diagnostic data...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Revenue Diagnostic Report</h1>

      {/* Pending Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Revenue Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Pending Appointments</p>
                <p className="text-2xl font-bold">{diagnosticData.pendingAppointments.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pending Revenue</p>
                <p className="text-2xl font-bold">QAR {diagnosticData.pendingAppointments.totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-xl font-semibold">{diagnosticData.pendingAppointments.byStatus.confirmed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Arrived</p>
                <p className="text-xl font-semibold">{diagnosticData.pendingAppointments.byStatus.arrived}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service Started</p>
                <p className="text-xl font-semibold">{diagnosticData.pendingAppointments.byStatus.serviceStarted}</p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">Pending Appointments Details:</h3>
              <div className="space-y-2">
                {diagnosticData.pendingAppointments.details.map((apt: any, idx: number) => (
                  <div key={idx} className={`p-3 rounded border ${apt.shouldCount ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{apt.clientName} - {apt.service}</p>
                        <p className="text-sm text-muted-foreground">Status: {apt.status}</p>
                        {apt.hasTransaction && (
                          <p className="text-sm text-red-600">Has transaction: {apt.transactionId}</p>
                        )}
                        {apt.alreadyPaid && (
                          <p className="text-sm text-red-600">Already paid (transactionRecorded: {String(apt.transactionRecorded)}, paymentStatus: {apt.paymentStatus})</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">QAR {apt.price}</p>
                        <p className={`text-sm ${apt.shouldCount ? 'text-green-600' : 'text-red-600'}`}>
                          {apt.shouldCount ? '✓ Counted' : '✗ Skipped'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Revenue Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{diagnosticData.transactions.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">QAR {diagnosticData.transactions.totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">In-Person Sales (POS + Calendar)</p>
                <p className="text-xl font-semibold">QAR {diagnosticData.transactions.inPersonSales.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">POS: QAR {diagnosticData.transactions.bySource.POS.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Calendar: QAR {diagnosticData.transactions.bySource.CALENDAR.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Online Sales</p>
                <p className="text-xl font-semibold">QAR {diagnosticData.transactions.onlineSales.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Home Service Sales</p>
                <p className="text-xl font-semibold">QAR {diagnosticData.transactions.homeServiceSales.toFixed(2)}</p>
              </div>
              <div className={diagnosticData.transactions.unknownSales > 0 ? 'bg-yellow-50 p-3 rounded' : ''}>
                <p className="text-sm text-muted-foreground">Unknown Source</p>
                <p className="text-xl font-semibold text-yellow-600">QAR {diagnosticData.transactions.unknownSales.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discrepancy Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Discrepancy Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold">QAR {diagnosticData.discrepancy.totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sum of Sources</p>
                <p className="text-xl font-bold">QAR {diagnosticData.discrepancy.sumOfSources.toFixed(2)}</p>
              </div>
              <div className={diagnosticData.discrepancy.difference !== 0 ? 'bg-red-50 p-3 rounded' : 'bg-green-50 p-3 rounded'}>
                <p className="text-sm text-muted-foreground">Difference</p>
                <p className={`text-xl font-bold ${diagnosticData.discrepancy.difference !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                  QAR {diagnosticData.discrepancy.difference.toFixed(2)}
                </p>
              </div>
            </div>

            {diagnosticData.transactions.transactionsWithoutSource.length > 0 && (
              <div className="mt-4 bg-yellow-50 p-4 rounded">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  ⚠️ Transactions Without Source ({diagnosticData.transactions.transactionsWithoutSource.length})
                </h3>
                <div className="space-y-2">
                  {diagnosticData.transactions.transactionsWithoutSource.map((tx: any, idx: number) => (
                    <div key={idx} className="p-2 bg-white rounded border border-yellow-200">
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">Amount: QAR {tx.amount}</p>
                      <p className="text-sm text-muted-foreground">Type: {tx.type}</p>
                      <p className="text-sm text-muted-foreground">ID: {tx.id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RevenueDiagnosticPage() {
  return (
    <TransactionProvider>
      <RevenueDiagnosticContent />
    </TransactionProvider>
  )
}
