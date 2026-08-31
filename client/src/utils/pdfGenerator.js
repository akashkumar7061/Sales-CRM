import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper for consistent headers & footers
const addHeaderAndFooter = (doc, title, subtitle) => {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Top Header Banner
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, doc.internal.pageSize.width, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SalesPulse CRM', 14, 11);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Customer Management & Operations Report', 14, 15);

    doc.text(
      `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      doc.internal.pageSize.width - 14,
      12,
      { align: 'right' }
    );

    // Page Title beneath banner (Page 1 only)
    if (i === 1 && title) {
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, 28);

      if (subtitle) {
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, 14, 33);
      }
    }

    // Bottom Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, doc.internal.pageSize.height - 12, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 12);

    doc.setTextColor(148, 163, 184); // Slate 400
    doc.setFontSize(7.5);
    doc.text('Confidential — Internal Company Document', 14, doc.internal.pageSize.height - 6);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 6, {
      align: 'right',
    });
  }
};

// 1. Customers Leads PDF Export
export const generateCustomersPdf = (customers, filters = {}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const tableData = customers.map((c, i) => [
    i + 1,
    c.date ? new Date(c.date).toISOString().split('T')[0] : '-',
    c.customerName || '-',
    c.companyName || 'SofaShine',
    c.priority || 'Warm',
    c.mobileNumber || '-',
    `${c.city || ''}, ${c.state || ''}`,
    c.productInterested || '-',
    c.followUpDate ? new Date(c.followUpDate).toISOString().split('T')[0] : '-',
    c.followUpStatus || 'New Lead',
    c.salesEmployeeName || '-',
  ]);

  doc.autoTable({
    startY: 38,
    head: [['#', 'Date', 'Customer Name', 'Brand', 'Priority', 'Mobile', 'Location', 'Product/Service', 'Follow-up', 'Status', 'Sales Rep']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 38, bottom: 18, left: 14, right: 14 },
  });

  addHeaderAndFooter(
    doc,
    'Customers & Leads Management Report',
    `Total Records: ${customers.length} | Exported on ${new Date().toLocaleDateString()}`
  );

  doc.save(`customers_leads_report_${Date.now()}.pdf`);
};

// 2. Call History Logs PDF Export
export const generateCallLogsPdf = (calls) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const tableData = calls.map((cl, i) => [
    i + 1,
    new Date(cl.callDate).toLocaleString(),
    cl.customerName || '-',
    cl.mobileNumber || '-',
    cl.employeeName || '-',
    cl.callResult || '-',
    cl.callDuration || '0m',
    cl.nextAction || '-',
    cl.callNotes || '-',
  ]);

  doc.autoTable({
    startY: 38,
    head: [['#', 'Call Date & Time', 'Customer', 'Mobile', 'Sales Rep', 'Outcome', 'Duration', 'Next Action', 'Call Discussion Notes']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 38, bottom: 18, left: 14, right: 14 },
  });

  addHeaderAndFooter(
    doc,
    'Phone Outreach & Call History Log',
    `Total Calls Recorded: ${calls.length}`
  );

  doc.save(`call_history_report_${Date.now()}.pdf`);
};

// 3. Sales Targets & Performance Quotas PDF Export
export const generateTargetsPdf = (targets, month) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const tableData = targets.map((t, i) => [
    i + 1,
    t.month || month,
    t.employeeName || t.employee?.name || '-',
    t.monthlyLeadTarget || t.target?.monthlyLeadTarget || 0,
    t.dailyLeadTarget || t.target?.dailyLeadTarget || 0,
    t.monthlyCallTarget || t.target?.monthlyCallTarget || 0,
    t.dailyCallTarget || t.target?.dailyCallTarget || 0,
    t.monthlyConversionTarget || t.target?.monthlyConversionTarget || 0,
    t.notes || t.target?.notes || '-',
  ]);

  doc.autoTable({
    startY: 38,
    head: [['#', 'Month', 'Sales Employee', 'Monthly Leads', 'Daily Leads', 'Monthly Calls', 'Daily Calls', 'Monthly Deals Won', 'Strategy Notes']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 38, bottom: 18, left: 14, right: 14 },
  });

  addHeaderAndFooter(
    doc,
    'Sales Targets & Team Performance Quotas',
    `Quota Allocation Month: ${month || new Date().toISOString().substring(0, 7)}`
  );

  doc.save(`sales_targets_report_${Date.now()}.pdf`);
};

// 4. Daily Attendance & Work Reports PDF Export
export const generateDailyReportsPdf = (reports) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const tableData = reports.map((r, i) => [
    i + 1,
    new Date(r.date).toLocaleDateString(),
    r.employeeName || '-',
    r.attendanceStatus || 'Present',
    `${r.clockInTime || '-'} / ${r.clockOutTime || '-'}`,
    r.customersContacted || 0,
    r.followupsCompleted || 0,
    r.newLeadsAdded || 0,
    r.dealsConverted || 0,
    r.remarks || '-',
  ]);

  doc.autoTable({
    startY: 38,
    head: [['#', 'Date', 'Employee', 'Status', 'Clock In / Out', 'Calls Made', 'Follow-ups', 'Leads Added', 'Won Deals', 'Daily Summary Remarks']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [245, 158, 11],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 38, bottom: 18, left: 14, right: 14 },
  });

  addHeaderAndFooter(
    doc,
    'Team Attendance & Daily Work Summaries',
    `Total Reports: ${reports.length}`
  );

  doc.save(`attendance_daily_reports_${Date.now()}.pdf`);
};

// 5. Activity Audit Logs PDF Export
export const generateActivityLogsPdf = (logs) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const tableData = logs.map((l, i) => [
    i + 1,
    new Date(l.createdAt).toLocaleString(),
    `${l.userName || '-'} (${l.userRole || '-'})`,
    l.action || '-',
    l.details || '-',
  ]);

  doc.autoTable({
    startY: 38,
    head: [['#', 'Timestamp', 'User (Role)', 'Action', 'Audit Details']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [147, 51, 234],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 38, bottom: 18, left: 14, right: 14 },
  });

  addHeaderAndFooter(
    doc,
    'System Security & Activity Audit Log',
    `Audit Records Exported: ${logs.length}`
  );

  doc.save(`activity_audit_logs_${Date.now()}.pdf`);
};

// 6. Employees Directory PDF Export
export const generateEmployeesPdf = (employees) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const tableData = employees.map((e, i) => [
    i + 1,
    e.name || '-',
    e.email || '-',
    e.phone || '-',
    e.designation || '-',
    e.role || 'employee',
    e.status || 'approved',
  ]);

  doc.autoTable({
    startY: 38,
    head: [['#', 'Employee Name', 'Work Email', 'Phone Number', 'Designation', 'Role', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [225, 29, 72],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 38, bottom: 18, left: 14, right: 14 },
  });

  addHeaderAndFooter(
    doc,
    'Sales Team & Employee Directory',
    `Total Active Team Members: ${employees.length}`
  );

  doc.save(`sales_employees_directory_${Date.now()}.pdf`);
};

// 7. Master Complete CRM Executive PDF Report
export const generateMasterCrmPdf = async (apiInstance) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Fetch data
  const [custRes, callRes, repRes] = await Promise.all([
    apiInstance.get('/customers?limit=100'),
    apiInstance.get('/calls/recent?limit=50').catch(() => ({ data: { calls: [] } })),
    apiInstance.get('/reports/all?limit=50').catch(() => ({ data: { reports: [] } })),
  ]);

  const customers = custRes.data?.customers || [];
  const calls = callRes.data?.calls || [];
  const reports = repRes.data?.reports || [];

  // Section 1: Customer Leads
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Active Customer Pipeline & Leads', 14, 28);

  const customerRows = customers.slice(0, 40).map((c, i) => [
    i + 1,
    c.customerName,
    c.companyName,
    c.priority,
    c.mobileNumber,
    `${c.city || ''}`,
    c.productInterested,
    c.followUpDate ? new Date(c.followUpDate).toISOString().split('T')[0] : '-',
    c.followUpStatus,
    c.salesEmployeeName,
  ]);

  doc.autoTable({
    startY: 32,
    head: [['#', 'Customer Name', 'Brand', 'Priority', 'Mobile', 'City', 'Product', 'Follow-up', 'Status', 'Sales Rep']],
    body: customerRows,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], fontSize: 7.5 },
    bodyStyles: { fontSize: 6.5, cellPadding: 1.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  // Section 2: Call Log
  if (calls.length > 0) {
    doc.addPage();
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Recent Client Phone Calls & Outreach', 14, 28);

    const callRows = calls.slice(0, 40).map((cl, i) => [
      i + 1,
      new Date(cl.callDate).toLocaleString(),
      cl.customerName,
      cl.employeeName,
      cl.callResult,
      cl.nextAction,
      cl.callNotes,
    ]);

    doc.autoTable({
      startY: 32,
      head: [['#', 'Date & Time', 'Customer', 'Sales Rep', 'Outcome', 'Next Action', 'Notes']],
      body: callRows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], fontSize: 7.5 },
      bodyStyles: { fontSize: 6.5, cellPadding: 1.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
  }

  addHeaderAndFooter(
    doc,
    'SalesPulse CRM — Complete Executive Master Report',
    `Consolidated Business Intelligence & Operations Backup`
  );

  doc.save(`CRM_EXECUTIVE_MASTER_REPORT_${Date.now()}.pdf`);
};
