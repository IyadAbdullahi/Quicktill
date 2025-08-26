// Enhanced student search functionality with barcode support

$(document).ready(function() {
    initializeStudentSearch();
});

function initializeStudentSearch() {
    // Enhanced search with debouncing
    let searchTimeout;
    
    $('#studentSearchPayment').on('input', function() {
        const query = $(this).val();
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (query.length >= 2) {
                searchStudentsForPayment(query);
            } else {
                $('#studentSearchResults').empty();
            }
        }, 300);
    });
    
    // Barcode scanner support
    $('#studentSearchPayment').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            const query = $(this).val();
            if (query.length > 0) {
                searchStudentByIdOrBarcode(query);
            }
        }
    });
    
    // Create search results container
    if (!$('#studentSearchResults').length) {
        $('#studentSearchPayment').after('<div id="studentSearchResults" class="mt-2"></div>');
    }
}

function searchStudentsForPayment(query) {
    $.get(`/api/students/search/${query}`, function(students) {
        displayStudentSearchResults(students);
    });
}

function searchStudentByIdOrBarcode(query) {
    // First try to find by exact student ID
    $.get(`/api/students/by-student-id/${query}`, function(student) {
        if (student) {
            selectStudentFromSearch(student);
            $('#studentSearchResults').empty();
            $('#studentSearchPayment').val('');
        } else {
            // If not found by ID, try general search
            searchStudentsForPayment(query);
        }
    }).fail(function() {
        // If API call fails, try general search
        searchStudentsForPayment(query);
    });
}

function displayStudentSearchResults(students) {
    const container = $('#studentSearchResults');
    container.empty();
    
    if (students.length === 0) {
        container.html('<div class="alert alert-warning">No students found.</div>');
        return;
    }
    
    const resultsHtml = students.map(student => `
        <div class="card mb-2 student-search-result" data-student-id="${student._id}" 
             style="cursor: pointer;">
            <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${student.name}</strong><br>
                        <small>ID: ${student.student_id} | Class: ${student.class}</small>
                    </div>
                    <div>
                        <small class="text-muted">Guardian: ${student.guardian_name}</small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.html(resultsHtml);
    
    // Add click handlers for search results
    $('.student-search-result').on('click', function() {
        const studentId = $(this).data('student-id');
        const student = students.find(s => s._id === studentId);
        selectStudentFromSearch(student);
        container.empty();
        $('#studentSearchPayment').val('');
    });
}

function selectStudentFromSearch(student) {
    $('#selectedStudentInfo').html(`
        <div class="alert alert-info">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="mb-1">${student.name}</h5>
                    <p class="mb-0">
                        <strong>ID:</strong> ${student.student_id} | 
                        <strong>Class:</strong> ${student.class}<br>
                        <strong>Guardian:</strong> ${student.guardian_name}
                        ${student.guardian_phone ? ` | <strong>Phone:</strong> ${student.guardian_phone}` : ''}
                    </p>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="generateStudentIdCard(${student._id})">
                        <i class="ti-id-badge"></i> ID Card
                    </button>
                </div>
            </div>
        </div>
    `);
    
    $('#selectedStudentId').val(student._id);
    loadStudentPayments(student._id);
    loadStudentBalance(student._id);
    loadOutstandingPaymentsForStudent(student._id);
}

function loadOutstandingPaymentsForStudent(studentId) {
    $.get(`/api/student-payments/outstanding/${studentId}`, function(outstandingPayments) {
        if (outstandingPayments.length > 0) {
            displayOutstandingPayments(outstandingPayments);
        }
    });
}

function displayOutstandingPayments(payments) {
    const container = $('#studentPaymentHistory');
    
    if (payments.length === 0) {
        container.html('<div class="alert alert-success">No outstanding payments!</div>');
        return;
    }
    
    const paymentsHtml = `
        <div class="alert alert-warning">
            <h6>Outstanding Payments:</h6>
            ${payments.map(payment => `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <strong>${payment.category_name || 'Payment'}</strong><br>
                        <small>Due: $${payment.amount.toFixed(2)} | 
                               Paid: $${(payment.amount_paid || 0).toFixed(2)} | 
                               Outstanding: $${(payment.amount - (payment.amount_paid || 0)).toFixed(2)}</small>
                    </div>
                    <button class="btn btn-sm btn-warning" onclick="quickPayment(${payment._id})">
                        Quick Pay
                    </button>
                </div>
            `).join('')}
        </div>
    `;
    
    container.html(paymentsHtml);
}

function quickPayment(paymentId) {
    // Auto-fill payment form with outstanding payment details
    $.get(`/api/student-payments/payment/${paymentId}`, function(payment) {
        $('#paymentCategorySelect').val(payment.payment_category_id);
        const outstanding = payment.amount - (payment.amount_paid || 0);
        $('#paymentAmount').val(outstanding.toFixed(2));
        
        // Scroll to payment form
        $('html, body').animate({
            scrollTop: $('#paymentForm').offset().top - 100
        }, 500);
        
        // Highlight the form
        $('#paymentForm').addClass('border border-warning');
        setTimeout(() => {
            $('#paymentForm').removeClass('border border-warning');
        }, 3000);
    });
}

function generateStudentIdCard(studentId) {
    $.get(`/api/students/student/${studentId}`, function(student) {
        const idCardHtml = `
            <div class="student-id-card" style="width: 300px; height: 200px; border: 2px solid #007bff; border-radius: 10px; padding: 15px; background: linear-gradient(135deg, #007bff, #0056b3); color: white; font-family: Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 10px;">
                    <h6 style="margin: 0; font-size: 14px;">STUDENT ID CARD</h6>
                </div>
                <div style="display: flex; align-items: center;">
                    <div style="flex: 1;">
                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${student.name}</div>
                        <div style="font-size: 12px; margin-bottom: 3px;">ID: ${student.student_id}</div>
                        <div style="font-size: 12px; margin-bottom: 3px;">Class: ${student.class}</div>
                        <div style="font-size: 10px;">Guardian: ${student.guardian_name}</div>
                    </div>
                    <div style="text-align: center;">
                        <div id="studentBarcode${studentId}" style="background: white; padding: 5px; border-radius: 3px;"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Show ID card in modal
        Swal.fire({
            title: 'Student ID Card',
            html: idCardHtml,
            width: 400,
            showConfirmButton: true,
            confirmButtonText: 'Print ID Card',
            showCancelButton: true,
            cancelButtonText: 'Close'
        }).then((result) => {
            if (result.isConfirmed) {
                printStudentIdCard(student);
            }
        });
        
        // Generate barcode
        if (typeof JsBarcode !== 'undefined') {
            JsBarcode(`#studentBarcode${studentId}`, student.student_id, {
                format: "CODE128",
                width: 1,
                height: 30,
                displayValue: false
            });
        }
    });
}

function printStudentIdCard(student) {
    const idCardHtml = `
        <div style="width: 300px; height: 200px; border: 2px solid #007bff; border-radius: 10px; padding: 15px; background: linear-gradient(135deg, #007bff, #0056b3); color: white; font-family: Arial, sans-serif; margin: 20px auto;">
            <div style="text-align: center; margin-bottom: 10px;">
                <h6 style="margin: 0; font-size: 14px;">STUDENT ID CARD</h6>
            </div>
            <div style="display: flex; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${student.name}</div>
                    <div style="font-size: 12px; margin-bottom: 3px;">ID: ${student.student_id}</div>
                    <div style="font-size: 12px; margin-bottom: 3px;">Class: ${student.class}</div>
                    <div style="font-size: 10px;">Guardian: ${student.guardian_name}</div>
                </div>
                <div style="text-align: center;">
                    <canvas id="printBarcode" style="background: white; padding: 5px; border-radius: 3px;"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Generate barcode for printing
    if (typeof JsBarcode !== 'undefined') {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, student.student_id, {
            format: "CODE128",
            width: 1,
            height: 30,
            displayValue: false
        });
        
        // Print the ID card
        printJS({
            printable: idCardHtml,
            type: 'raw-html',
            style: 'body { margin: 0; padding: 20px; }'
        });
    }
}