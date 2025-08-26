// School Payment Reports Module

function generatePaymentReport() {
    const dateRange = $('#reportDateRange').data('daterangepicker');
    const paymentType = $('#reportPaymentType').val();
    
    const startDate = dateRange.startDate.format('YYYY-MM-DD');
    const endDate = dateRange.endDate.format('YYYY-MM-DD');
    
    $.get(`/api/student-payments/by-date?start=${startDate}&end=${endDate}&payment_type=${paymentType}`, 
        function(payments) {
            displayPaymentReport(payments, startDate, endDate, paymentType);
        }
    );
}

function displayPaymentReport(payments, startDate, endDate, paymentType) {
    const container = $('#reportResults');
    
    if (payments.length === 0) {
        container.html('<div class="alert alert-info">No payments found for the selected criteria.</div>');
        return;
    }
    
    // Calculate summary statistics
    const summary = calculatePaymentSummary(payments);
    
    // Create report HTML
    const reportHtml = `
        <div class="report-summary mb-4">
            <h6>Report Summary (${startDate} to ${endDate})</h6>
            <div class="row">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h6>Total Payments</h6>
                            <h4>${summary.totalCount}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h6>Total Amount</h6>
                            <h4>$${summary.totalAmount.toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h6>Compulsory</h6>
                            <h4>$${summary.compulsoryAmount.toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body text-center">
                            <h6>Optional</h6>
                            <h4>$${summary.optionalAmount.toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="report-actions mb-3">
            <button class="btn btn-success" onclick="exportReportToExcel()">
                <i class="ti-download"></i> Export to Excel
            </button>
            <button class="btn btn-info" onclick="printReport()">
                <i class="ti-printer"></i> Print Report
            </button>
        </div>
        
        <div class="table-responsive">
            <table class="table table-striped" id="paymentReportTable">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Class</th>
                        <th>Payment Type</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${payments.map(payment => `
                        <tr>
                            <td>${new Date(payment.date).toLocaleDateString()}</td>
                            <td>${payment.student_name || 'N/A'}</td>
                            <td>${payment.student_id || 'N/A'}</td>
                            <td>${payment.student_class || 'N/A'}</td>
                            <td>
                                <span class="badge badge-${payment.payment_type === 'compulsory' ? 'danger' : 'info'}">
                                    ${payment.payment_type}
                                </span>
                            </td>
                            <td>${payment.category_name || 'N/A'}</td>
                            <td>$${payment.amount_paid ? payment.amount_paid.toFixed(2) : '0.00'}</td>
                            <td>${payment.payment_method}</td>
                            <td>
                                <span class="badge badge-${payment.status === 'paid' ? 'success' : 'warning'}">
                                    ${payment.status}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.html(reportHtml);
    
    // Initialize DataTable for better functionality
    $('#paymentReportTable').DataTable({
        dom: 'Bfrtip',
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
        pageLength: 25,
        order: [[0, 'desc']] // Sort by date descending
    });
}

function calculatePaymentSummary(payments) {
    return payments.reduce((summary, payment) => {
        summary.totalCount++;
        summary.totalAmount += payment.amount_paid || 0;
        
        if (payment.payment_type === 'compulsory') {
            summary.compulsoryAmount += payment.amount_paid || 0;
        } else {
            summary.optionalAmount += payment.amount_paid || 0;
        }
        
        return summary;
    }, {
        totalCount: 0,
        totalAmount: 0,
        compulsoryAmount: 0,
        optionalAmount: 0
    });
}

function exportReportToExcel() {
    // Use DataTables export functionality
    $('#paymentReportTable').DataTable().button('.buttons-excel').trigger();
}

function printReport() {
    // Use DataTables print functionality
    $('#paymentReportTable').DataTable().button('.buttons-print').trigger();
}

// Outstanding payments report
function generateOutstandingPaymentsReport() {
    $.get('/api/students/all', function(students) {
        const promises = students.map(student => {
            return new Promise((resolve) => {
                $.get(`/api/student-payments/summary/${student._id}`, function(summary) {
                    resolve({
                        student: student,
                        summary: summary
                    });
                });
            });
        });
        
        Promise.all(promises).then(results => {
            const outstandingStudents = results.filter(result => 
                result.summary.total_outstanding > 0
            );
            
            displayOutstandingPaymentsReport(outstandingStudents);
        });
    });
}

function displayOutstandingPaymentsReport(outstandingStudents) {
    const container = $('#reportResults');
    
    if (outstandingStudents.length === 0) {
        container.html('<div class="alert alert-success">No outstanding payments found!</div>');
        return;
    }
    
    const reportHtml = `
        <h6>Outstanding Payments Report</h6>
        <div class="table-responsive">
            <table class="table table-striped" id="outstandingReportTable">
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Class</th>
                        <th>Guardian</th>
                        <th>Compulsory Outstanding</th>
                        <th>Optional Outstanding</th>
                        <th>Total Outstanding</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${outstandingStudents.map(item => `
                        <tr>
                            <td>${item.student.name}</td>
                            <td>${item.student.student_id}</td>
                            <td>${item.student.class}</td>
                            <td>${item.student.guardian_name}</td>
                            <td class="text-danger">$${item.summary.compulsory_outstanding.toFixed(2)}</td>
                            <td class="text-warning">$${item.summary.optional_outstanding.toFixed(2)}</td>
                            <td class="text-danger"><strong>$${item.summary.total_outstanding.toFixed(2)}</strong></td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="selectStudent(${item.student._id}); showSection('payments');">
                                    Record Payment
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.html(reportHtml);
    
    // Initialize DataTable
    $('#outstandingReportTable').DataTable({
        dom: 'Bfrtip',
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
        pageLength: 25,
        order: [[6, 'desc']] // Sort by total outstanding descending
    });
}

// Class-wise payment summary
function generateClassPaymentSummary() {
    $.get('/api/students/all', function(students) {
        const classSummary = {};
        
        const promises = students.map(student => {
            return new Promise((resolve) => {
                $.get(`/api/student-payments/summary/${student._id}`, function(summary) {
                    if (!classSummary[student.class]) {
                        classSummary[student.class] = {
                            studentCount: 0,
                            totalPaid: 0,
                            totalOutstanding: 0,
                            compulsoryPaid: 0,
                            compulsoryOutstanding: 0,
                            optionalPaid: 0,
                            optionalOutstanding: 0
                        };
                    }
                    
                    classSummary[student.class].studentCount++;
                    classSummary[student.class].totalPaid += summary.total_paid;
                    classSummary[student.class].totalOutstanding += summary.total_outstanding;
                    classSummary[student.class].compulsoryPaid += summary.compulsory_paid;
                    classSummary[student.class].compulsoryOutstanding += summary.compulsory_outstanding;
                    classSummary[student.class].optionalPaid += summary.optional_paid;
                    classSummary[student.class].optionalOutstanding += summary.optional_outstanding;
                    
                    resolve();
                });
            });
        });
        
        Promise.all(promises).then(() => {
            displayClassPaymentSummary(classSummary);
        });
    });
}

function displayClassPaymentSummary(classSummary) {
    const container = $('#reportResults');
    
    const reportHtml = `
        <h6>Class-wise Payment Summary</h6>
        <div class="table-responsive">
            <table class="table table-striped" id="classSummaryTable">
                <thead>
                    <tr>
                        <th>Class</th>
                        <th>Students</th>
                        <th>Total Paid</th>
                        <th>Total Outstanding</th>
                        <th>Compulsory Paid</th>
                        <th>Optional Paid</th>
                        <th>Collection Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(classSummary).map(className => {
                        const data = classSummary[className];
                        const totalDue = data.totalPaid + data.totalOutstanding;
                        const collectionRate = totalDue > 0 ? (data.totalPaid / totalDue * 100) : 0;
                        
                        return `
                            <tr>
                                <td><strong>${className}</strong></td>
                                <td>${data.studentCount}</td>
                                <td class="text-success">$${data.totalPaid.toFixed(2)}</td>
                                <td class="text-danger">$${data.totalOutstanding.toFixed(2)}</td>
                                <td>$${data.compulsoryPaid.toFixed(2)}</td>
                                <td>$${data.optionalPaid.toFixed(2)}</td>
                                <td>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar bg-success" style="width: ${collectionRate}%">
                                            ${collectionRate.toFixed(1)}%
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.html(reportHtml);
    
    // Initialize DataTable
    $('#classSummaryTable').DataTable({
        dom: 'Bfrtip',
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
        pageLength: 25
    });
}

// Bind report generation events
$(document).ready(function() {
    $('#generateReportBtn').on('click', generatePaymentReport);
    
    // Add additional report buttons
    $('#reports-section .card-box').append(`
        <div class="mt-3">
            <button class="btn btn-info mr-2" onclick="generateOutstandingPaymentsReport()">
                Outstanding Payments Report
            </button>
            <button class="btn btn-warning" onclick="generateClassPaymentSummary()">
                Class Summary Report
            </button>
        </div>
    `);
});