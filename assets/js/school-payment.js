$(document).ready(function() {
    // Initialize school payment system
    initializeSchoolPaymentSystem();
    
    // Load students on page load
    loadStudents();
    loadPaymentCategories();
    
    // Student search functionality
    $('#studentSearch').on('input', function() {
        const query = $(this).val();
        if (query.length >= 2) {
            searchStudents(query);
        } else if (query.length === 0) {
            loadStudents();
        }
    });
    
    // Payment category filter
    $('#paymentTypeFilter').on('change', function() {
        filterPaymentsByType($(this).val());
    });
});

function initializeSchoolPaymentSystem() {
    // Check if we're in school mode
    if (!$('#schoolPaymentSystem').length) {
        return;
    }
    
    // Initialize student payment interface
    setupStudentPaymentInterface();
    setupPaymentCategoryManagement();
    setupStudentManagement();
}

function setupStudentPaymentInterface() {
    // Student selection handler
    $(document).on('click', '.student-card', function() {
        const studentId = $(this).data('student-id');
        selectStudent(studentId);
    });
    
    // Payment recording handler
    $('#recordPaymentBtn').on('click', function() {
        recordStudentPayment();
    });
    
    // View student balance handler
    $(document).on('click', '.view-balance-btn', function() {
        const studentId = $(this).data('student-id');
        viewStudentBalance(studentId);
    });
}

function setupPaymentCategoryManagement() {
    // Add payment category handler
    $('#addPaymentCategoryBtn').on('click', function() {
        showPaymentCategoryModal();
    });
    
    // Save payment category handler
    $('#savePaymentCategoryBtn').on('click', function() {
        savePaymentCategory();
    });
}

function setupStudentManagement() {
    // Add student handler
    $('#addStudentBtn').on('click', function() {
        showStudentModal();
    });
    
    // Save student handler
    $('#saveStudentBtn').on('click', function() {
        saveStudent();
    });
    
    // Edit student handler
    $(document).on('click', '.edit-student-btn', function() {
        const studentId = $(this).data('student-id');
        editStudent(studentId);
    });
}

function loadStudents() {
    $.get('/api/students/all', function(students) {
        displayStudents(students);
    });
}

function searchStudents(query) {
    $.get(`/api/students/search/${query}`, function(students) {
        displayStudents(students);
    });
}

function displayStudents(students) {
    const container = $('#studentsContainer');
    container.empty();
    
    if (students.length === 0) {
        container.html('<div class="alert alert-info">No students found.</div>');
        return;
    }
    
    students.forEach(student => {
        const studentCard = `
            <div class="col-md-4 mb-3">
                <div class="card student-card" data-student-id="${student._id}">
                    <div class="card-body">
                        <h5 class="card-title">${student.name}</h5>
                        <p class="card-text">
                            <strong>Student ID:</strong> ${student.student_id}<br>
                            <strong>Class:</strong> ${student.class}<br>
                            <strong>Guardian:</strong> ${student.guardian_name}
                        </p>
                        <div class="btn-group">
                            <button class="btn btn-primary btn-sm view-balance-btn" data-student-id="${student._id}">
                                View Balance
                            </button>
                            <button class="btn btn-secondary btn-sm edit-student-btn" data-student-id="${student._id}">
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.append(studentCard);
    });
}

function selectStudent(studentId) {
    $.get(`/api/students/student/${studentId}`, function(student) {
        $('#selectedStudentInfo').html(`
            <div class="alert alert-info">
                <h5>${student.name} (${student.student_id})</h5>
                <p>Class: ${student.class} | Guardian: ${student.guardian_name}</p>
            </div>
        `);
        
        $('#selectedStudentId').val(student._id);
        loadStudentPayments(studentId);
        loadStudentBalance(studentId);
    });
}

function loadStudentPayments(studentId) {
    $.get(`/api/student-payments/student/${studentId}`, function(payments) {
        displayStudentPayments(payments);
    });
}

function loadStudentBalance(studentId) {
    $.get(`/api/student-payments/summary/${studentId}`, function(summary) {
        $('#studentBalanceSummary').html(`
            <div class="row">
                <div class="col-md-6">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6>Total Paid</h6>
                            <h4>$${summary.total_paid.toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <h6>Outstanding</h6>
                            <h4>$${summary.total_outstanding.toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-6">
                    <small>Compulsory Paid: $${summary.compulsory_paid.toFixed(2)}</small><br>
                    <small>Optional Paid: $${summary.optional_paid.toFixed(2)}</small>
                </div>
                <div class="col-md-6">
                    <small>Compulsory Outstanding: $${summary.compulsory_outstanding.toFixed(2)}</small><br>
                    <small>Optional Outstanding: $${summary.optional_outstanding.toFixed(2)}</small>
                </div>
            </div>
        `);
    });
}

function loadPaymentCategories() {
    $.get('/api/payment-categories/all', function(categories) {
        const select = $('#paymentCategorySelect');
        select.empty();
        select.append('<option value="">Select Payment Type</option>');
        
        categories.forEach(category => {
            select.append(`<option value="${category._id}" data-amount="${category.amount}" data-type="${category.type}">
                ${category.name} - $${category.amount} (${category.type})
            </option>`);
        });
        
        displayPaymentCategories(categories);
    });
}

function displayPaymentCategories(categories) {
    const container = $('#paymentCategoriesContainer');
    container.empty();
    
    const compulsory = categories.filter(c => c.type === 'compulsory');
    const optional = categories.filter(c => c.type === 'optional');
    
    if (compulsory.length > 0) {
        container.append('<h6>Compulsory Payments</h6>');
        compulsory.forEach(category => {
            container.append(createPaymentCategoryCard(category));
        });
    }
    
    if (optional.length > 0) {
        container.append('<h6 class="mt-3">Optional Payments</h6>');
        optional.forEach(category => {
            container.append(createPaymentCategoryCard(category));
        });
    }
}

function createPaymentCategoryCard(category) {
    return `
        <div class="card mb-2">
            <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${category.name}</strong><br>
                        <small>$${category.amount} - ${category.description}</small>
                    </div>
                    <div>
                        <span class="badge badge-${category.type === 'compulsory' ? 'danger' : 'info'}">
                            ${category.type}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function recordStudentPayment() {
    const studentId = $('#selectedStudentId').val();
    const categoryId = $('#paymentCategorySelect').val();
    const amount = parseFloat($('#paymentAmount').val());
    const paymentMethod = $('#paymentMethod').val();
    
    if (!studentId || !categoryId || !amount) {
        Swal.fire('Error', 'Please fill in all required fields', 'error');
        return;
    }
    
    const selectedOption = $('#paymentCategorySelect option:selected');
    const fullAmount = parseFloat(selectedOption.data('amount'));
    const paymentType = selectedOption.data('type');
    
    const paymentData = {
        student_id: parseInt(studentId),
        payment_category_id: parseInt(categoryId),
        amount: fullAmount,
        amount_paid: amount,
        payment_method: paymentMethod,
        payment_type: paymentType,
        status: amount >= fullAmount ? 'paid' : 'partial',
        user_id: getCurrentUserId(),
        till: getCurrentTillId()
    };
    
    $.post('/api/student-payments/payment', paymentData, function(response) {
        Swal.fire('Success', 'Payment recorded successfully', 'success');
        
        // Print receipt
        printStudentPaymentReceipt(paymentData);
        
        // Refresh displays
        loadStudentPayments(studentId);
        loadStudentBalance(studentId);
        
        // Clear form
        $('#paymentCategorySelect').val('');
        $('#paymentAmount').val('');
    }).fail(function() {
        Swal.fire('Error', 'Failed to record payment', 'error');
    });
}

function printStudentPaymentReceipt(paymentData) {
    // Get student and category details for receipt
    $.get(`/api/students/student/${paymentData.student_id}`, function(student) {
        $.get(`/api/payment-categories/all`, function(categories) {
            const category = categories.find(c => c._id === paymentData.payment_category_id);
            
            const receiptData = {
                student: student,
                category: category,
                payment: paymentData,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString()
            };
            
            generateStudentPaymentReceipt(receiptData);
        });
    });
}

function generateStudentPaymentReceipt(data) {
    const receiptHtml = `
        <div class="receipt" style="width: 300px; font-family: monospace;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h3>SCHOOL PAYMENT RECEIPT</h3>
                <p>Date: ${data.date} ${data.time}</p>
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>Student Information:</strong><br>
                Name: ${data.student.name}<br>
                ID: ${data.student.student_id}<br>
                Class: ${data.student.class}<br>
                Guardian: ${data.student.guardian_name}
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>Payment Details:</strong><br>
                Type: ${data.category.name}<br>
                Amount Due: $${data.payment.amount.toFixed(2)}<br>
                Amount Paid: $${data.payment.amount_paid.toFixed(2)}<br>
                Status: ${data.payment.status}<br>
                Method: ${data.payment.payment_method}
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <p>Thank you for your payment!</p>
            </div>
        </div>
    `;
    
    // Print the receipt
    printJS({
        printable: receiptHtml,
        type: 'raw-html',
        style: 'font-family: monospace; font-size: 12px;'
    });
}

function saveStudent() {
    const studentData = {
        name: $('#studentName').val(),
        student_id: $('#studentIdNumber').val(),
        class: $('#studentClass').val(),
        guardian_name: $('#guardianName').val(),
        guardian_phone: $('#guardianPhone').val(),
        guardian_email: $('#guardianEmail').val(),
        address: $('#studentAddress').val(),
        date_enrolled: $('#dateEnrolled').val() || new Date().toJSON()
    };
    
    const studentId = $('#editStudentId').val();
    
    if (studentId) {
        // Update existing student
        studentData._id = parseInt(studentId);
        $.ajax({
            url: '/api/students/student',
            method: 'PUT',
            data: studentData,
            success: function() {
                Swal.fire('Success', 'Student updated successfully', 'success');
                $('#studentModal').modal('hide');
                loadStudents();
            },
            error: function() {
                Swal.fire('Error', 'Failed to update student', 'error');
            }
        });
    } else {
        // Add new student
        $.post('/api/students/student', studentData, function() {
            Swal.fire('Success', 'Student added successfully', 'success');
            $('#studentModal').modal('hide');
            loadStudents();
        }).fail(function() {
            Swal.fire('Error', 'Failed to add student', 'error');
        });
    }
}

function savePaymentCategory() {
    const categoryData = {
        name: $('#categoryName').val(),
        description: $('#categoryDescription').val(),
        amount: parseFloat($('#categoryAmount').val()),
        type: $('#categoryType').val(),
        is_active: $('#categoryActive').is(':checked')
    };
    
    const categoryId = $('#editCategoryId').val();
    
    if (categoryId) {
        // Update existing category
        categoryData._id = parseInt(categoryId);
        $.ajax({
            url: '/api/payment-categories/category',
            method: 'PUT',
            data: categoryData,
            success: function() {
                Swal.fire('Success', 'Payment category updated successfully', 'success');
                $('#paymentCategoryModal').modal('hide');
                loadPaymentCategories();
            },
            error: function() {
                Swal.fire('Error', 'Failed to update payment category', 'error');
            }
        });
    } else {
        // Add new category
        $.post('/api/payment-categories/category', categoryData, function() {
            Swal.fire('Success', 'Payment category added successfully', 'success');
            $('#paymentCategoryModal').modal('hide');
            loadPaymentCategories();
        }).fail(function() {
            Swal.fire('Error', 'Failed to add payment category', 'error');
        });
    }
}

function viewStudentBalance(studentId) {
    $.get(`/api/students/student/${studentId}`, function(student) {
        $.get(`/api/student-payments/summary/${studentId}`, function(summary) {
            $.get(`/api/student-payments/student/${studentId}`, function(payments) {
                showStudentBalanceModal(student, summary, payments);
            });
        });
    });
}

function showStudentBalanceModal(student, summary, payments) {
    const modalContent = `
        <div class="modal fade" id="studentBalanceModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Payment Summary - ${student.name}</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="card bg-success text-white">
                                    <div class="card-body text-center">
                                        <h6>Total Paid</h6>
                                        <h4>$${summary.total_paid.toFixed(2)}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card bg-warning text-white">
                                    <div class="card-body text-center">
                                        <h6>Outstanding</h6>
                                        <h4>$${summary.total_outstanding.toFixed(2)}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <h6>Payment History</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Payment Type</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${payments.map(payment => `
                                        <tr>
                                            <td>${new Date(payment.date).toLocaleDateString()}</td>
                                            <td>${payment.payment_type}</td>
                                            <td>$${payment.amount_paid ? payment.amount_paid.toFixed(2) : '0.00'}</td>
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
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal and add new one
    $('#studentBalanceModal').remove();
    $('body').append(modalContent);
    $('#studentBalanceModal').modal('show');
}

function showStudentModal(studentData = null) {
    const isEdit = studentData !== null;
    const modalTitle = isEdit ? 'Edit Student' : 'Add New Student';
    
    const modalContent = `
        <div class="modal fade" id="studentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${modalTitle}</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="studentForm">
                            <input type="hidden" id="editStudentId" value="${isEdit ? studentData._id : ''}">
                            
                            <div class="form-group">
                                <label for="studentName">Student Name *</label>
                                <input type="text" class="form-control" id="studentName" 
                                       value="${isEdit ? studentData.name : ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="studentIdNumber">Student ID *</label>
                                <input type="text" class="form-control" id="studentIdNumber" 
                                       value="${isEdit ? studentData.student_id : ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="studentClass">Class *</label>
                                <input type="text" class="form-control" id="studentClass" 
                                       value="${isEdit ? studentData.class : ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="guardianName">Guardian Name *</label>
                                <input type="text" class="form-control" id="guardianName" 
                                       value="${isEdit ? studentData.guardian_name : ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="guardianPhone">Guardian Phone</label>
                                <input type="tel" class="form-control" id="guardianPhone" 
                                       value="${isEdit ? studentData.guardian_phone || '' : ''}">
                            </div>
                            
                            <div class="form-group">
                                <label for="guardianEmail">Guardian Email</label>
                                <input type="email" class="form-control" id="guardianEmail" 
                                       value="${isEdit ? studentData.guardian_email || '' : ''}">
                            </div>
                            
                            <div class="form-group">
                                <label for="studentAddress">Address</label>
                                <textarea class="form-control" id="studentAddress" rows="3">${isEdit ? studentData.address || '' : ''}</textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="dateEnrolled">Date Enrolled</label>
                                <input type="date" class="form-control" id="dateEnrolled" 
                                       value="${isEdit && studentData.date_enrolled ? new Date(studentData.date_enrolled).toISOString().split('T')[0] : ''}">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="saveStudentBtn">Save Student</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal and add new one
    $('#studentModal').remove();
    $('body').append(modalContent);
    $('#studentModal').modal('show');
}

function showPaymentCategoryModal(categoryData = null) {
    const isEdit = categoryData !== null;
    const modalTitle = isEdit ? 'Edit Payment Category' : 'Add New Payment Category';
    
    const modalContent = `
        <div class="modal fade" id="paymentCategoryModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${modalTitle}</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="paymentCategoryForm">
                            <input type="hidden" id="editCategoryId" value="${isEdit ? categoryData._id : ''}">
                            
                            <div class="form-group">
                                <label for="categoryName">Payment Name *</label>
                                <input type="text" class="form-control" id="categoryName" 
                                       value="${isEdit ? categoryData.name : ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="categoryDescription">Description</label>
                                <textarea class="form-control" id="categoryDescription" rows="3">${isEdit ? categoryData.description || '' : ''}</textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="categoryAmount">Amount *</label>
                                <input type="number" step="0.01" class="form-control" id="categoryAmount" 
                                       value="${isEdit ? categoryData.amount : ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="categoryType">Payment Type *</label>
                                <select class="form-control" id="categoryType" required>
                                    <option value="">Select Type</option>
                                    <option value="compulsory" ${isEdit && categoryData.type === 'compulsory' ? 'selected' : ''}>
                                        Compulsory
                                    </option>
                                    <option value="optional" ${isEdit && categoryData.type === 'optional' ? 'selected' : ''}>
                                        Optional
                                    </option>
                                </select>
                            </div>
                            
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="categoryActive" 
                                       ${isEdit ? (categoryData.is_active ? 'checked' : '') : 'checked'}>
                                <label class="form-check-label" for="categoryActive">
                                    Active
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="savePaymentCategoryBtn">Save Category</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal and add new one
    $('#paymentCategoryModal').remove();
    $('body').append(modalContent);
    $('#paymentCategoryModal').modal('show');
}

function editStudent(studentId) {
    $.get(`/api/students/student/${studentId}`, function(student) {
        showStudentModal(student);
    });
}

function getCurrentUserId() {
    // This should be implemented based on your current user session management
    return 1; // Default admin user
}

function getCurrentTillId() {
    // This should be implemented based on your current till management
    return 1; // Default till
}

// Utility functions for barcode generation (if needed)
function generateStudentBarcode(studentId) {
    // Implementation for generating student ID barcodes
    // This can use the existing barcode generation functionality
}