import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface GatePassPDFData {
  _id: string;
  gatePassNumber: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  purpose: string;
  reason: string;
  personToMeet?: string;
  department?: string;
  timeIn: string;
  timeOut?: string;
  status: string;
  securityNotes?: string;
  items?: Array<{
    description: string;
    quantity: number;
    value?: number;
  }>;
  images?: string[];
  printedAt?: string;
  printedBy?: string;
  createdBy?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export const generateGatePassPDF = (gatePass: GatePassPDFData, companyName?: string): void => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Colors
  const primaryColor = '#1f2937'; // gray-800
  const secondaryColor = '#6b7280'; // gray-500
  const accentColor = '#3b82f6'; // blue-500
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('GATE PASS', 105, 20, { align: 'center' });
  
  // Company name
  if (companyName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    doc.text(companyName, 105, 30, { align: 'center' });
  }
  
  // Gate Pass Number
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentColor);
  doc.text(`Pass No: ${gatePass.gatePassNumber}`, 105, 45, { align: 'center' });
  
  // Date and Time
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor);
  const currentDate = new Date().toLocaleDateString('en-IN');
  const currentTime = new Date().toLocaleTimeString('en-IN');
  doc.text(`Generated on: ${currentDate} at ${currentTime}`, 105, 55, { align: 'center' });
  
  // Status Badge
  const statusColor = gatePass.status === 'active' ? '#10b981' : 
                     gatePass.status === 'completed' ? '#3b82f6' : 
                     gatePass.status === 'cancelled' ? '#ef4444' : '#6b7280';
  
  doc.setFillColor(statusColor);
  doc.roundedRect(15, 65, 30, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(gatePass.status.toUpperCase(), 30, 70, { align: 'center' });
  
  // Vehicle Information Section
  doc.setTextColor(primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('VEHICLE INFORMATION', 15, 85);
  
  // Vehicle details table
  const vehicleData = [
    ['Vehicle Number', gatePass.vehicleNumber],
    ['Driver Name', gatePass.driverName],
    ['Driver Phone', gatePass.driverPhone],
    ['Purpose', gatePass.purpose.charAt(0).toUpperCase() + gatePass.purpose.slice(1)],
    ['Reason', gatePass.reason]
  ];
  
  if (gatePass.personToMeet) {
    vehicleData.push(['Person to Meet', gatePass.personToMeet]);
  }
  
  if (gatePass.department) {
    vehicleData.push(['Department', gatePass.department]);
  }
  
  try {
    doc.autoTable({
      startY: 90,
      head: [],
      body: vehicleData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246], // blue-500
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [31, 41, 55], // gray-800
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 60 }
      },
      margin: { left: 15, right: 15 },
      tableWidth: 'auto'
    });
  } catch (error) {
    console.error('AutoTable error, falling back to simple table:', error);
    // Fallback to simple text-based table
    let yPosition = 90;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor);
    
    vehicleData.forEach(row => {
      doc.setFont('helvetica', 'bold');
      doc.text(row[0] + ':', 15, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], 70, yPosition);
      yPosition += 8;
    });
  }
  
  // Time Information
  const timeData = [
    ['Time In', new Date(gatePass.timeIn).toLocaleString('en-IN')],
    ['Time Out', gatePass.timeOut ? new Date(gatePass.timeOut).toLocaleString('en-IN') : 'Not checked out'],
    ['Duration', gatePass.timeOut ? 
      `${Math.floor((new Date(gatePass.timeOut).getTime() - new Date(gatePass.timeIn).getTime()) / (1000 * 60))} minutes` : 
      'In progress'
    ]
  ];
  
  try {
    doc.autoTable({
      startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 150,
      head: [],
      body: timeData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [31, 41, 55],
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 60 }
      },
      margin: { left: 15, right: 15 }
    });
  } catch (error) {
    console.error('AutoTable error for time data, falling back to simple text:', error);
    // Fallback to simple text
    let yPosition = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : 160;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor);
    
    timeData.forEach(row => {
      doc.setFont('helvetica', 'bold');
      doc.text(row[0] + ':', 15, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], 70, yPosition);
      yPosition += 8;
    });
  }
  
  // Items Section (if any)
  if (gatePass.items && gatePass.items.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('ITEMS', 15, (doc as any).lastAutoTable.finalY + 20);
    
    const itemsData = gatePass.items.map(item => [
      item.description,
      item.quantity.toString(),
      item.value ? `₹${item.value}` : 'N/A'
    ]);
    
    try {
      doc.autoTable({
        startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 25 : 200,
        head: [['Description', 'Quantity', 'Value']],
        body: itemsData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: [31, 41, 55],
          fontSize: 10
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: 15, right: 15 }
      });
    } catch (error) {
      console.error('AutoTable error for items, falling back to simple text:', error);
      // Fallback to simple text
      let yPosition = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 35 : 210;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 15, yPosition);
      doc.text('Qty', 100, yPosition);
      doc.text('Value', 130, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      itemsData.forEach(row => {
        doc.text(row[0], 15, yPosition);
        doc.text(row[1], 100, yPosition);
        doc.text(row[2], 130, yPosition);
        yPosition += 8;
      });
    }
  }
  
  // Security Notes (if any)
  if (gatePass.securityNotes) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('SECURITY NOTES', 15, (doc as any).lastAutoTable.finalY + 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    const splitNotes = doc.splitTextToSize(gatePass.securityNotes, 180);
    doc.text(splitNotes, 15, (doc as any).lastAutoTable.finalY + 30);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 20;
  
  // QR Code placeholder (you can add actual QR code generation here)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor);
  doc.text('QR Code: ' + gatePass.gatePassNumber, 15, footerY);
  
  // Print timestamp
  if (gatePass.printedAt) {
    doc.text(`Printed: ${new Date(gatePass.printedAt).toLocaleString('en-IN')}`, 105, footerY, { align: 'center' });
  }
  
  // Page number
  doc.text('Page 1 of 1', 195, footerY, { align: 'right' });
  
  // Border
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 190, pageHeight - 20);
  
  // Download the PDF
  const fileName = `GatePass_${gatePass.gatePassNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateBulkGatePassPDF = (gatePasses: GatePassPDFData[], companyName?: string): void => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Colors
  const primaryColor = '#1f2937';
  const secondaryColor = '#6b7280';
  const accentColor = '#3b82f6';
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('GATE PASSES REPORT', 105, 20, { align: 'center' });
  
  if (companyName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    doc.text(companyName, 105, 30, { align: 'center' });
  }
  
  // Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor);
  doc.text(`Total Gate Passes: ${gatePasses.length}`, 15, 45);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 15, 50);
  
  // Table data
  const tableData = gatePasses.map(gatePass => [
    gatePass.gatePassNumber,
    gatePass.vehicleNumber,
    gatePass.driverName,
    gatePass.purpose.charAt(0).toUpperCase() + gatePass.purpose.slice(1),
    new Date(gatePass.timeIn).toLocaleDateString('en-IN'),
    new Date(gatePass.timeIn).toLocaleTimeString('en-IN'),
    gatePass.status.charAt(0).toUpperCase() + gatePass.status.slice(1)
  ]);
  
  try {
    doc.autoTable({
      startY: 60,
      head: [['Pass No', 'Vehicle', 'Driver', 'Purpose', 'Date', 'Time', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [31, 41, 55],
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 }
      },
      margin: { left: 15, right: 15 }
    });
  } catch (error) {
    console.error('AutoTable error, falling back to simple table:', error);
    // Fallback to simple text-based table
    let yPosition = 60;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Pass No', 15, yPosition);
    doc.text('Vehicle', 45, yPosition);
    doc.text('Driver', 75, yPosition);
    doc.text('Purpose', 105, yPosition);
    doc.text('Date', 135, yPosition);
    doc.text('Time', 165, yPosition);
    doc.text('Status', 185, yPosition);
    
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    
    tableData.forEach(row => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(row[0], 15, yPosition);
      doc.text(row[1], 45, yPosition);
      doc.text(row[2], 75, yPosition);
      doc.text(row[3], 105, yPosition);
      doc.text(row[4], 135, yPosition);
      doc.text(row[5], 165, yPosition);
      doc.text(row[6], 185, yPosition);
      yPosition += 8;
    });
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 20;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 15, footerY);
  doc.text(`Page 1 of 1`, 195, footerY, { align: 'right' });
  
  // Download the PDF
  const fileName = `GatePasses_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
