"use client"

import { Transaction } from "@/lib/transaction-types"
import { SettingsStorage } from "@/lib/settings-storage"

/**
 * Print a bilingual (English/Arabic) receipt for a transaction
 */
export function printReceipt(transaction: Transaction, getLocationName?: (id: string) => string): void {
  // Get company branding settings
  const settings = SettingsStorage.getGeneralSettings()
  const companyName = settings.branding?.companyName || settings.businessName || "Vanity Hub"
  // Helper for Arabic numerals
  function toArabicNumber(num: number | string) {
    return String(num).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
  }

  // Simple English to Arabic phonetic transliteration (fallback)
  function toPhoneticArabic(text: string): string {
    // This is a basic mapping for demonstration. For production, use a proper transliteration library.
    const map: Record<string, string> = {
      'a': 'ا', 'b': 'ب', 'c': 'ك', 'd': 'د', 'e': 'ي', 'f': 'ف', 'g': 'ج', 'h': 'ه', 'i': 'ي', 'j': 'ج', 'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'o': 'و', 'p': 'ب', 'q': 'ق', 'r': 'ر', 's': 'س', 't': 'ت', 'u': 'و', 'v': 'ف', 'w': 'و', 'x': 'كس', 'y': 'ي', 'z': 'ز', 'A': 'ا', 'B': 'ب', 'C': 'ك', 'D': 'د', 'E': 'ي', 'F': 'ف', 'G': 'ج', 'H': 'ه', 'I': 'ي', 'J': 'ج', 'K': 'ك', 'L': 'ل', 'M': 'م', 'N': 'ن', 'O': 'و', 'P': 'ب', 'Q': 'ق', 'R': 'ر', 'S': 'س', 'T': 'ت', 'U': 'و', 'V': 'ف', 'W': 'و', 'X': 'كس', 'Y': 'ي', 'Z': 'ز', ' ': ' ', '-': '-', '_': '_', '.': '.', ',': ',', '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤', '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
    };
    return text.split('').map(char => map[char] || char).join('');
  }

  // Format items if available - Single row with English and Arabic
  let itemsHtml = '';
  if (transaction.items && transaction.items.length > 0) {
    itemsHtml = transaction.items.map(function (item) {
      return `
        <div style="border-bottom: 1px dashed #aaa; padding: 4px 0;">
          <div style="display: flex; font-size: 12px; margin-bottom: 2px;">
            <div style="flex: 2;">${item.name}</div>
            <div style="flex: 1;">${item.type}</div>
            <div style="flex: 1; text-align: right;">QAR ${item.originalPrice ?? '-'}</div>
            <div style="flex: 1; text-align: right;">${item.discountApplied ? (item.discountPercentage || 0) + '%' : '-'}</div>
            <div style="flex: 1; text-align: right;">QAR ${item.totalPrice}</div>
          </div>
          <div style="display: flex; font-size: 10px; direction: rtl; color: #666;">
            <div style="flex: 2;">${toPhoneticArabic(item.name)}</div>
            <div style="flex: 1;">${toPhoneticArabic(item.type)}</div>
            <div style="flex: 1; text-align: left;">${item.originalPrice ? toArabicNumber(item.originalPrice) + ' ر.ق' : '-'}</div>
            <div style="flex: 1; text-align: left;">${item.discountApplied ? toArabicNumber(item.discountPercentage || 0) + '٪' : '-'}</div>
            <div style="flex: 1; text-align: left;">${item.totalPrice ? toArabicNumber(item.totalPrice) + ' ر.ق' : '-'}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  const date = typeof transaction.date === 'string'
    ? new Date(transaction.date)
    : transaction.date;
  const formattedDate = date.toLocaleString();

  const locationName = getLocationName ? getLocationName(transaction.location) : transaction.location;

  // Use transactionNumber (5-digit) if available, otherwise fall back to id
  const displayTransactionId = transaction.transactionNumber || transaction.id;

  const receiptHtml = `
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body { width: 300px; font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 8px; }
          .title { font-weight: bold; font-size: 16px; }
          .subtitle { font-weight: bold; font-size: 14px; }
          .subtitle-ar { font-weight: bold; font-size: 14px; direction: rtl; }
          .info, .summary { margin-bottom: 8px; }
          .label { font-weight: bold; }
          .label-ar { font-weight: bold; direction: rtl; font-size: 11px; }
          .total { font-weight: bold; font-size: 14px; }
          .discount { color: #15803d; font-weight: bold; }
          .thankyou { text-align: center; margin-top: 10px; font-size: 12px; }
          .thankyou-ar { text-align: center; direction: rtl; font-size: 11px; }
          hr { margin: 8px 0; border: none; border-top: 1px solid #000; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${companyName}</div>
          <div class="subtitle">Receipt</div>
          <div class="subtitle-ar">فاتورة</div>
        </div>
        <div class="info">
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span><span class="label">Transaction ID:</span> ${displayTransactionId}</span>
            <span class="label-ar" style="direction: rtl;">معرّف المعاملة: ${displayTransactionId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span><span class="label">Date:</span> ${formattedDate}</span>
            <span class="label-ar" style="direction: rtl;">التاريخ: ${toArabicNumber(formattedDate)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span><span class="label">Client:</span> ${transaction.clientName || '-'}</span>
            <span class="label-ar" style="direction: rtl;">العميل: ${transaction.clientName ? toPhoneticArabic(transaction.clientName) : '-'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span><span class="label">Staff:</span> ${transaction.staffName || '-'}</span>
            <span class="label-ar" style="direction: rtl;">الموظف: ${transaction.staffName ? toPhoneticArabic(transaction.staffName) : '-'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span><span class="label">Location:</span> ${locationName}</span>
            <span class="label-ar" style="direction: rtl;">الموقع: ${toPhoneticArabic(locationName)}</span>
          </div>
        </div>
        <hr/>
        <div style="border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 2px;">
          <div style="display: flex; font-weight: bold; font-size: 12px;">
            <div style="flex: 2;">Item</div>
            <div style="flex: 1;">Type</div>
            <div style="flex: 1; text-align: right;">Price</div>
            <div style="flex: 1; text-align: right;">Discount</div>
            <div style="flex: 1; text-align: right;">Total</div>
          </div>
          <div style="display: flex; font-weight: bold; font-size: 10px; direction: rtl; color: #666;">
            <div style="flex: 2;">الصنف</div>
            <div style="flex: 1;">النوع</div>
            <div style="flex: 1; text-align: left;">السعر</div>
            <div style="flex: 1; text-align: left;">الخصم</div>
            <div style="flex: 1; text-align: left;">الإجمالي</div>
          </div>
        </div>
        ${itemsHtml}
        <hr/>
        <div class="summary">
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span><span class="label">Payment Method:</span> ${transaction.paymentMethod || '-'}</span>
            <span class="label-ar" style="direction: rtl;">طريقة الدفع: ${transaction.paymentMethod || '-'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span><span class="label">Status:</span> ${transaction.status || '-'}</span>
            <span class="label-ar" style="direction: rtl;">الحالة: ${transaction.status || '-'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span><span class="label">Original Total:</span> ${transaction.originalServiceAmount ? '<s>QAR ' + transaction.originalServiceAmount + '</s>' : '-'}</span>
            <span class="label-ar" style="direction: rtl;">الإجمالي الأصلي: ${transaction.originalServiceAmount ? '<s>' + toArabicNumber(transaction.originalServiceAmount) + ' ر.ق</s>' : '-'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span><span class="label">Discount:</span> ${transaction.discountAmount ? '<span class="discount">QAR ' + transaction.discountAmount + (transaction.discountPercentage ? ' (' + transaction.discountPercentage + '%)' : '') + '</span>' : '-'}</span>
            <span class="label-ar" style="direction: rtl;">الخصم: ${transaction.discountAmount ? '<span class="discount">' + toArabicNumber(transaction.discountAmount) + ' ر.ق' + (transaction.discountPercentage ? ' (' + toArabicNumber(transaction.discountPercentage) + '٪)' : '') + '</span>' : '-'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 6px; padding-top: 6px; border-top: 1px solid #000;">
            <span class="total"><span class="label">Final Amount Paid:</span> QAR ${transaction.amount}</span>
            <span class="total label-ar" style="direction: rtl;">المبلغ النهائي المدفوع: ${toArabicNumber(transaction.amount)} ر.ق</span>
          </div>
        </div>
        <div class="thankyou">Thank you for your business!</div>
        <div class="thankyou-ar">شكراً لتعاملكم معنا!</div>
      </body>
    </html>
  `;

  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=350,height=600');
  if (printWindow) {
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  }
}

