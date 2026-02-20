import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { FamilyTree } from '../types';

export async function exportPng(canvasEl: HTMLElement): Promise<void> {
  const dataUrl = await toPng(canvasEl, { cacheBust: true });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'family-tree.png';
  a.click();
}

export async function exportPdf(canvasEl: HTMLElement): Promise<void> {
  const dataUrl = await toPng(canvasEl, { cacheBust: true });
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve) => { img.onload = () => resolve(); });

  const pdf = new jsPDF({
    orientation: img.width > img.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [img.width, img.height],
  });
  pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
  pdf.save('family-tree.pdf');
}

export function exportJson(tree: FamilyTree): void {
  const json = JSON.stringify(tree, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tree.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(tree: FamilyTree): void {
  const headers = ['id', 'firstName', 'lastName', 'gender', 'birthDate', 'birthPlace', 'deathDate', 'deathPlace', 'notes'];
  const rows = tree.persons.map((p) =>
    headers.map((h) => {
      const val = (p as Record<string, unknown>)[h] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tree.name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
