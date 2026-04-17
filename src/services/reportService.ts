import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ETLProject, ETLAnalysis } from '../types';

export function generateETLReport(project: ETLProject, analysis: ETLAnalysis | null) {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleString();

  // Header
  doc.setFillColor(37, 99, 235); // Primary color
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Informatiwho: Pipeline Report', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${timestamp}`, 20, 32);

  // Project Summary
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Summary', 20, 55);

  const stats = [
    ['Total Mappings', project.mappings.length.toString()],
    ['Total Workflows', project.workflows.length.toString()],
    ['Unique Sources', new Set(project.mappings.flatMap(m => m.sources.map(s => s.name))).size.toString()],
    ['Final Targets', new Set(project.mappings.flatMap(m => m.targets.map(t => t.name))).size.toString()],
    ['Maplets', project.maplets.length.toString()],
    ['Parameters', project.parameters.length.toString()],
  ];

  autoTable(doc, {
    startY: 65,
    head: [['Metric', 'Value']],
    body: stats,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105] },
  });

  // Pipeline Flow (Inferred)
  const currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Inferred Data Pipeline', 20, currentY);

  const pipelineData = project.mappings.map(m => {
    const upstream = project.mappings
      .filter(other => other.name !== m.name && other.targets.some(t => m.sources.some(s => s.name === t.name)))
      .map(other => other.name);
    
    return [
      m.name,
      m.sources.length.toString(),
      m.targets.length.toString(),
      upstream.length > 0 ? upstream.join(', ') : 'Direct Entry (Source)'
    ];
  });

  autoTable(doc, {
    startY: currentY + 10,
    head: [['Mapping Name', 'In', 'Out', 'Upstream Context']],
    body: pipelineData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [51, 65, 85] },
  });

  // Critical Transformations & Business Logic
  if (analysis) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Critical Business Logic', 20, 20);

    const logicData = analysis.businessLogic.map(b => [b.key, b.description]);

    autoTable(doc, {
      startY: 30,
      head: [['Transformation', 'Business Logic Summary']],
      body: logicData,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    });

    // Risk Assessment
    const riskY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk & Performance Audit', 20, riskY);

    const riskData = analysis.risks.map(r => [
      r.type.toUpperCase(),
      r.severity.toUpperCase(),
      r.description
    ]);

    autoTable(doc, {
      startY: riskY + 10,
      head: [['Risk Category', 'Severity', 'Detail']],
      body: riskData,
      theme: 'grid',
      headStyles: { fillColor: [185, 28, 28] }, // Red for risks
      styles: { fontSize: 9 },
    });
  }

  // Data Catalog Section
  doc.addPage();
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Data Catalog: Sources & Targets', 20, 20);

  const allSources = Array.from(new Map(project.mappings.flatMap(m => m.sources).map(s => [s.name, s])).values());
  const allTargets = Array.from(new Map(project.mappings.flatMap(m => m.targets).map(t => [t.name, t])).values());

  // Sources Table
  doc.setFontSize(12);
  doc.text('Source Systems', 20, 30);
  
  const sourceRows = allSources.map(s => [
    s.name,
    s.database,
    s.fields.length.toString(),
    s.fields.slice(0, 15).join(', ') + (s.fields.length > 15 ? '...' : '')
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['Source Table', 'Database', 'Fields', 'Sample Fields']],
    body: sourceRows,
    theme: 'striped',
    styles: { fontSize: 7 },
    headStyles: { fillColor: [22, 101, 52] }, // Green for sources
  });

  // Targets Table
  const targetY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text('Target Systems', 20, targetY);

  const targetRows = allTargets.map(t => [
    t.name,
    t.database,
    t.fields.length.toString(),
    t.fields.slice(0, 15).join(', ') + (t.fields.length > 15 ? '...' : '')
  ]);

  autoTable(doc, {
    startY: targetY + 5,
    head: [['Target Table', 'Database', 'Fields', 'Sample Fields']],
    body: targetRows,
    theme: 'striped',
    styles: { fontSize: 7 },
    headStyles: { fillColor: [194, 65, 12] }, // Orange for targets
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Informatiwho - High-Level Architecture Report - Page ${i} of ${pageCount}`, 20, 285);
  }

  doc.save(`${project.mappings[0]?.name || 'ETL'}_Pipeline_Report.pdf`);
}
