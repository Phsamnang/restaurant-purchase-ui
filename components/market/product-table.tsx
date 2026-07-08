'use client';

import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import type { IngredientItem } from '@/types/market';

export interface ProductTableProps {
  items: IngredientItem[];
  orderItems: Record<string, { quantity: number; unit: string; name: string }>;
  onQuantityChange: (item: IngredientItem, qty: number) => void;
  customUnits: Record<string, string>;
  onUnitChange: (item: IngredientItem, unit: string) => void;
}

function splitBilingualName(fullName: string) {
  if (fullName.includes('/')) {
    const parts = fullName.split('/');
    return { nameEn: parts[0].trim(), nameKh: parts[1].trim() };
  }
  if (fullName.includes('·')) {
    const parts = fullName.split('·');
    return { nameEn: parts[0].trim(), nameKh: parts[1].trim() };
  }
  if (fullName.includes('(')) {
    const parts = fullName.split('(');
    return { nameEn: parts[0].trim(), nameKh: parts[1].replace(')', '').trim() };
  }
  return { nameEn: fullName, nameKh: '' };
}

export function ProductTable({
  items,
  orderItems,
  onQuantityChange,
  customUnits,
  onUnitChange,
}: ProductTableProps) {
  // 2. UX & Keyboard Accessibility: ArrowDown / ArrowUp / Tab Column Jumping
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, totalRows: number) => {
    if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      const nextIndex = Math.min(rowIndex + 1, totalRows - 1);
      const nextInput = document.querySelector<HTMLInputElement>(`input[data-row-index="${nextIndex}"]`);
      nextInput?.focus();
      nextInput?.select();
    } else if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
      e.preventDefault();
      const prevIndex = Math.max(rowIndex - 1, 0);
      const prevInput = document.querySelector<HTMLInputElement>(`input[data-row-index="${prevIndex}"]`);
      prevInput?.focus();
      prevInput?.select();
    }
  };

  const columns = useMemo<ColumnDef<IngredientItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: () => <span className="font-extrabold text-xs tracking-wider uppercase text-slate-700">Ingredient Name / ឈ្មោះទំនិញ</span>,
        cell: ({ row }) => {
          const item = row.original;
          const { nameEn, nameKh } = splitBilingualName(item.name || item.nameEn || '');
          return (
            <div className="flex flex-col py-0.5">
              <span className="font-bold text-sm text-slate-900 tracking-tight leading-snug">
                {nameEn}
              </span>
              {nameKh && (
                <span className="font-kantumruy text-xs text-slate-600 leading-[1.65] mt-0.5 tracking-normal">
                  {nameKh}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'unit',
        header: () => <span className="font-extrabold text-xs tracking-wider uppercase text-slate-700">Unit</span>,
        cell: ({ row }) => {
          const item = row.original;
          const currentUnit = customUnits[item.id] || item.unit || item.defaultUnit || '';
          return (
            <input
              type="text"
              value={currentUnit}
              onChange={(e) => onUnitChange(item, e.target.value)}
              className="w-16 px-2 py-1 text-xs font-bold text-center bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 shadow-2xs transition-all"
              title="Type or edit unit"
            />
          );
        },
      },
      {
        id: 'quantity',
        header: () => <span className="font-extrabold text-xs tracking-wider uppercase text-slate-700 text-center block">Order Qty</span>,
        cell: ({ row, table }) => {
          const item = row.original;
          const currentQty = orderItems[item.id]?.quantity || 0;
          const rowIndex = row.index;
          const totalRows = table.getRowModel().rows.length;

          return (
            <div className="flex items-center justify-center">
              {/* Clean centered numeric input removing wide +/- stepper buttons entirely */}
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0"
                value={currentQty === 0 ? '' : currentQty}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onQuantityChange(item, isNaN(val) ? 0 : val);
                }}
                onKeyDown={(e) => handleKeyDown(e, rowIndex, totalRows)}
                data-row-index={rowIndex}
                className={`w-20 h-8 text-center font-black text-sm transition-all shadow-2xs ${
                  currentQty > 0
                    ? 'bg-primary/15 border-primary text-primary-hover dark:text-primary ring-1 ring-primary/30 font-black'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 focus:border-primary'
                }`}
              />
            </div>
          );
        },
      },
    ],
    [orderItems, customUnits, onQuantityChange, onUnitChange]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-white rounded-2xl border border-border shadow-2xs overflow-hidden">
      <Table className="w-full">
        <TableHeader className="bg-slate-50 border-b border-border">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="h-9 px-4 text-left font-bold text-slate-600 align-middle"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const isSelected = (orderItems[row.original.id]?.quantity || 0) > 0;
              return (
                <TableRow
                  key={row.id}
                  data-state={isSelected ? 'selected' : undefined}
                  className={`transition-colors [&_td]:py-1.5 [&_td]:px-4 border-b border-slate-100 last:border-0 ${
                    isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                  <AlertCircle className="w-6 h-6 stroke-1" />
                  <span className="text-sm font-medium">No ingredients found in this category.</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
