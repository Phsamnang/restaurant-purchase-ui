'use client';

import React from 'react';
import { OrderRequest } from '@/lib/orders';
import { useAuth } from '@/lib/auth-context';

const RESTAURANT_NAMES: Record<string, string> = {
  'rest-1': 'Malis Restaurant Phnom Penh / ភោជនីយដ្ឋាន ម្លិះ ភ្នំពេញ',
  'rest-2': 'Kroya by Chef Chanrith / ភោជនីយដ្ឋាន ក្រោយ៉ា',
};

function toDDMMYYYY(dateInput: string | Date): string {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-');
    return `${day}/${month}/${year}`;
  }
  if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) {
    return dateInput;
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput : '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function PrintSheet({ orders: printOrders, currency }: { orders: OrderRequest[]; currency?: 'KHR' | 'USD' }) {
  const { user } = useAuth();
  const restaurantName = RESTAURANT_NAMES[user?.restaurantId || 'rest-1'] || 'Malis Restaurant Phnom Penh / ភោជនីយដ្ឋាន ម្លិះ ភ្នំពេញ';
  const today = toDDMMYYYY(new Date());

  const isCombined = printOrders.length > 1;
  const orderIds = printOrders.map(o => o.id).join(', ');
  const requestedBy = [...new Set(printOrders.map(o => o.createdBy.replace(/\s*\(.*?\)\s*/g, '').trim()))].join(', ');
  const requestDates = [...new Set(printOrders.map(o => toDDMMYYYY(o.date)))].join(', ');

  // Group orders by currency field on each request
  const khrOrders = printOrders.filter(o => (o.currency || currency || 'KHR') === 'KHR');
  const usdOrders = printOrders.filter(o => (o.currency || currency || 'KHR') === 'USD');

  return (
    <div id="print-sheet" style={{ display: 'none' }}>
      <style>{`
        @media print {
          body > *:not(#print-sheet) { display: none !important; }
          #print-sheet { display: block !important; }
          @page { size: A4 portrait; margin: 16mm 14mm 16mm 14mm; }
          .ps-page { font-family: 'Kantumruy Pro', 'Khmer OS', Arial, sans-serif; font-size: 11pt; color: #000; background: #fff; }
          .ps-header { border-bottom: 2pt solid #000; padding-bottom: 8pt; margin-bottom: 12pt; }
          .ps-restaurant-name { font-size: 17pt; font-weight: 900; color: #000; margin-bottom: 2pt; text-transform: uppercase; letter-spacing: 0.3pt; }
          .ps-title { font-size: 13pt; font-weight: bold; margin-bottom: 3pt; color: #111; }
          .ps-sub { font-size: 9.5pt; color: #555; margin-bottom: 8pt; font-style: italic; }
          .ps-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4pt 16pt; margin-top: 8pt; font-size: 10pt; }
          .ps-meta-line { border-bottom: 1pt solid #999; padding-bottom: 3pt; }
          .ps-meta-label { font-size: 9pt; color: #555; }
          .ps-table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
          .ps-table th { border: 1pt solid #000; padding: 6pt 5pt; font-size: 9pt; font-weight: bold; text-align: center; background: #f5f5f5; line-height: 1.3; }
          .ps-table td { border: 1pt solid #000; padding: 8pt 5pt; font-size: 10pt; vertical-align: top; min-height: 28pt; }
          .ps-item-en { font-weight: bold; display: block; }
          .ps-item-kh { font-size: 8.5pt; color: #333; display: block; margin-top: 2pt; font-style: normal; }
          .ps-num { text-align: center; }
          .ps-qty { text-align: center; font-weight: bold; }
          .ps-blank { min-height: 24pt; }
          .ps-section-heading { font-size: 11pt; font-weight: bold; margin-top: 16pt; margin-bottom: 4pt; border-bottom: 1.5pt solid #000; padding-bottom: 3pt; }
          .ps-totals-row td { font-weight: bold; background: #f9f9f9; padding: 8pt 6pt; }
          .ps-footer { margin-top: 24pt; border-top: 1pt solid #000; padding-top: 12pt; }
          .ps-sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20pt; margin-top: 16pt; }
          .ps-sig-block { border-top: 1pt solid #000; padding-top: 6pt; font-size: 10pt; }
          .ps-sig-label { font-size: 9pt; color: #555; margin-bottom: 18pt; }
        }
      `}</style>

      <div className="ps-page">
        {/* Header */}
        <div className="ps-header">
          <div className="ps-restaurant-name">{restaurantName}</div>
          <div className="ps-title">Market Buying List / បញ្ជីទិញទំនិញ</div>
          <div className="ps-sub">RestaurantAI — Cambodian Restaurant Procurement System</div>
          <div className="ps-meta-grid">
            <div>
              <div className="ps-meta-label">Order ID{isCombined ? 's' : ''} / លេខបញ្ជាទិញ</div>
              <div>{orderIds}</div>
            </div>
            <div>
              <div className="ps-meta-label">Date Requested / ថ្ងៃស្នើ</div>
              <div>{requestDates}</div>
            </div>
            <div>
              <div className="ps-meta-label">Requested By / ស្នើដោយ</div>
              <div>{requestedBy}</div>
            </div>
            <div>
              <div className="ps-meta-label">Printed On / កាលបរិច្ឆេទបោះពុម្ព</div>
              <div>{today}</div>
            </div>
          </div>
          {/* Buyer fill-in fields */}
          <div className="ps-meta-grid" style={{ marginTop: '10pt' }}>
            <div>
              <div className="ps-meta-label">Buyer Name / ឈ្មោះអ្នកទិញ</div>
              <div className="ps-meta-line">&nbsp;</div>
            </div>
            <div>
              <div className="ps-meta-label">Date Purchased / ថ្ងៃទិញ</div>
              <div className="ps-meta-line">&nbsp;</div>
            </div>
          </div>
        </div>

        {/* KHR Orders Section */}
        {khrOrders.length > 0 && (
          <div>
            {isCombined && usdOrders.length > 0 && (
              <div className="ps-section-heading">Orders in KHR (រៀល): {khrOrders.map(o => o.id).join(', ')}</div>
            )}
            {(() => {
              const rows = isCombined
                ? khrOrders.flatMap((order, oi) =>
                    order.items.map((item, ii) => ({ item, rowNum: khrOrders.slice(0, oi).reduce((a, o) => a + o.items.length, 0) + ii + 1 }))
                  )
                : khrOrders[0].items.map((item, i) => ({ item, rowNum: i + 1 }));
              return (
                <table className="ps-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}># / ល.រ.</th>
                      <th style={{ width: '35%' }}>Item / ទំនិញ</th>
                      <th style={{ width: '10%' }}>Qty<br />ចំនួន</th>
                      <th style={{ width: '10%' }}>Unit<br />ឯកតា</th>
                      <th style={{ width: '20%' }}>Unit Price (KHR)<br />តម្លៃរៀល</th>
                      <th style={{ width: '20%' }}>Total (KHR)<br />សរុបរៀល</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ item, rowNum }) => (
                      <tr key={`${rowNum}-${item.id}`}>
                        <td className="ps-num">{rowNum}</td>
                        <td>
                          <span className="ps-item-en">{item.nameEn}</span>
                          <span className="ps-item-kh">{item.nameKh}</span>
                        </td>
                        <td className="ps-qty">{item.ordered}</td>
                        <td className="ps-num">{item.unit.split('(')[0].trim()}</td>
                        <td className="ps-blank"></td>
                        <td className="ps-blank"></td>
                      </tr>
                    ))}
                    {/* Grand Total spans colSpan={4}, then exactly 1 blank cell for Unit Price and 1 for Total */}
                    <tr className="ps-totals-row">
                      <td colSpan={4} style={{ textAlign: 'right', paddingRight: '10pt' }}>Grand Total (KHR) / សរុបរួម (រៀល)</td>
                      <td className="ps-blank"></td>
                      <td className="ps-blank"></td>
                    </tr>
                  </tbody>
                </table>
              );
            })()}
          </div>
        )}

        {/* USD Orders Section */}
        {usdOrders.length > 0 && (
          <div style={{ marginTop: khrOrders.length > 0 ? '18pt' : '0' }}>
            {isCombined && khrOrders.length > 0 && (
              <div className="ps-section-heading">Orders in USD (ដុល្លារ): {usdOrders.map(o => o.id).join(', ')}</div>
            )}
            {(() => {
              const rows = isCombined
                ? usdOrders.flatMap((order, oi) =>
                    order.items.map((item, ii) => ({ item, rowNum: usdOrders.slice(0, oi).reduce((a, o) => a + o.items.length, 0) + ii + 1 }))
                  )
                : usdOrders[0].items.map((item, i) => ({ item, rowNum: i + 1 }));
              return (
                <table className="ps-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}># / ល.រ.</th>
                      <th style={{ width: '35%' }}>Item / ទំនិញ</th>
                      <th style={{ width: '10%' }}>Qty<br />ចំនួន</th>
                      <th style={{ width: '10%' }}>Unit<br />ឯកតា</th>
                      <th style={{ width: '20%' }}>Unit Price (USD)<br />តម្លៃដុល្លារ</th>
                      <th style={{ width: '20%' }}>Total (USD)<br />សរុបដុល្លារ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ item, rowNum }) => (
                      <tr key={`${rowNum}-${item.id}`}>
                        <td className="ps-num">{rowNum}</td>
                        <td>
                          <span className="ps-item-en">{item.nameEn}</span>
                          <span className="ps-item-kh">{item.nameKh}</span>
                        </td>
                        <td className="ps-qty">{item.ordered}</td>
                        <td className="ps-num">{item.unit.split('(')[0].trim()}</td>
                        <td className="ps-blank"></td>
                        <td className="ps-blank"></td>
                      </tr>
                    ))}
                    {/* Grand Total spans colSpan={4}, then exactly 1 blank cell for Unit Price and 1 for Total */}
                    <tr className="ps-totals-row">
                      <td colSpan={4} style={{ textAlign: 'right', paddingRight: '10pt' }}>Grand Total (USD) / សរុបរួម (ដុល្លារ)</td>
                      <td className="ps-blank"></td>
                      <td className="ps-blank"></td>
                    </tr>
                  </tbody>
                </table>
              );
            })()}
          </div>
        )}

        {/* Footer — signature lines */}
        <div className="ps-footer">
          <div className="ps-sig-grid">
            <div className="ps-sig-block">
              <div className="ps-sig-label">Buyer Signature / ហត្ថលេខាអ្នកទិញ</div>
              <div className="ps-sig-label">Date / កាលបរិច្ឆេទ: ___________________</div>
            </div>
            <div className="ps-sig-block">
              <div className="ps-sig-label">Verified by Manager / ត្រួតពិនិត្យដោយអ្នកគ្រប់គ្រង</div>
              <div className="ps-sig-label">Date / កាលបរិច្ឆេទ: ___________________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
