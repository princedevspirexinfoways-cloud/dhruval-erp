import jsPDF from 'jspdf';

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
  
  // Vehicle details
  let yPosition = 95;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const vehicleDetails = [
    ['Vehicle Number', gatePass.vehicleNumber],
    ['Driver Name', gatePass.driverName],
    ['Driver Phone', gatePass.driverPhone],
    ['Purpose', gatePass.purpose.charAt(0).toUpperCase() + gatePass.purpose.slice(1)],
    ['Reason', gatePass.reason]
  ];
  
  if (gatePass.personToMeet) {
    vehicleDetails.push(['Person to Meet', gatePass.personToMeet]);
  }
  
  if (gatePass.department) {
    vehicleDetails.push(['Department', gatePass.department]);
  }
  
  vehicleDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 15, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, yPosition);
    yPosition += 8;
  });
  
  // Time Information
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('TIME INFORMATION', 15, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const timeIn = new Date(gatePass.timeIn).toLocaleString('en-IN');
  const timeOut = gatePass.timeOut ? new Date(gatePass.timeOut).toLocaleString('en-IN') : 'Not checked out';
  const duration = gatePass.timeOut ? 
    `${Math.floor((new Date(gatePass.timeOut).getTime() - new Date(gatePass.timeIn).getTime()) / (1000 * 60))} minutes` : 
    'In progress';
  
  doc.setFont('helvetica', 'bold');
  doc.text('Time In:', 15, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(timeIn, 50, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Time Out:', 15, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(timeOut, 50, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Duration:', 15, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(duration, 50, yPosition);
  
  // Items Section (if any)
  if (gatePass.items && gatePass.items.length > 0) {
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('ITEMS', 15, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 15, yPosition);
    doc.text('Qty', 100, yPosition);
    doc.text('Value', 130, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    gatePass.items.forEach(item => {
      doc.text(item.description, 15, yPosition);
      doc.text(item.quantity.toString(), 100, yPosition);
      doc.text(item.value ? `₹${item.value}` : 'N/A', 130, yPosition);
      yPosition += 8;
    });
  }
  
  // Security Notes (if any)
  if (gatePass.securityNotes) {
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('SECURITY NOTES', 15, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    const splitNotes = doc.splitTextToSize(gatePass.securityNotes, 180);
    doc.text(splitNotes, 15, yPosition);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 20;
  
  // QR Code placeholder
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
  
  // Table headers
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
  
  gatePasses.forEach(gatePass => {
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(gatePass.gatePassNumber, 15, yPosition);
    doc.text(gatePass.vehicleNumber, 45, yPosition);
    doc.text(gatePass.driverName, 75, yPosition);
    doc.text(gatePass.purpose.charAt(0).toUpperCase() + gatePass.purpose.slice(1), 105, yPosition);
    doc.text(new Date(gatePass.timeIn).toLocaleDateString('en-IN'), 135, yPosition);
    doc.text(new Date(gatePass.timeIn).toLocaleTimeString('en-IN'), 165, yPosition);
    doc.text(gatePass.status.charAt(0).toUpperCase() + gatePass.status.slice(1), 185, yPosition);
    yPosition += 8;
  });
  
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
