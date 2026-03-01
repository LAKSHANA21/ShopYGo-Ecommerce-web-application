// Seller Authentication Functions
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the seller login page
    if (document.getElementById('sellerLoginForm')) {
        setupSellerLogin();
    }
    
    // Check if we're on the seller registration page
    if (document.getElementById('sellerRegisterForm')) {
        setupSellerRegistration();
    }
    
    // Check if we're on the seller dashboard
    if (document.getElementById('sellerDashboard')) {
        loadSellerDashboard();
    }
    
    // Check if we're on the seller profile page
    if (document.getElementById('sellerProfile')) {
        loadSellerProfile();
    }
});

function setupSellerLogin() {
    const loginForm = document.getElementById('sellerLoginForm');
    const otpSection = document.getElementById('otpSection');
    const passwordSection = document.getElementById('passwordSection');
    const toggleAuthMethod = document.getElementById('toggleAuthMethod');
    
    // Toggle between password and OTP login
    toggleAuthMethod.addEventListener('click', function(e) {
        e.preventDefault();
        if (otpSection.style.display === 'none') {
            otpSection.style.display = 'block';
            passwordSection.style.display = 'none';
            toggleAuthMethod.textContent = 'Use Password Instead';
        } else {
            otpSection.style.display = 'none';
            passwordSection.style.display = 'block';
            toggleAuthMethod.textContent = 'Use OTP Instead';
        }
    });
    
    // Handle OTP request
    const requestOtpBtn = document.getElementById('requestOtpBtn');
    if (requestOtpBtn) {
        requestOtpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const identifier = document.getElementById('identifier').value;
            if (!identifier) {
                alert('Please enter your email or phone number');
                return;
            }
            
            fetch('http://localhost:8082/api/auth/request-otp?identifier=' + encodeURIComponent(identifier), {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('OTP sent successfully!');
                } else {
                    alert('Failed to send OTP: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to send OTP');
            });
        });
    }
    
    // Handle login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password')?.value;
        const otp = document.getElementById('otp')?.value;
        
        const loginData = {
            identifier: identifier
        };
        
        if (password) {
            loginData.password = password;
        } else if (otp) {
            loginData.otp = otp;
        } else {
            alert('Please enter either password or OTP');
            return;
        }
        
        fetch('http://localhost:8082/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Login failed');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.accessToken) {
                // Store tokens and user ID
                localStorage.setItem('sellerAccessToken', data.accessToken);
                localStorage.setItem('sellerRefreshToken', data.refreshToken);
                localStorage.setItem('sellerId', data.userId);
				
				console.log("access",localStorage.getItem("sellerAccessToken"), "sellerId",localStorage.getItem("sellerId"));
				
                
                // Redirect to dashboard
                window.location.href = '/seller/dashboard';
            } else {
                throw new Error('Invalid response from server');
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            document.getElementById('loginError').textContent = error.message;
            document.getElementById('loginError').style.display = 'block';
        });
    });
}

function setupSellerRegistration() {
    const registerForm = document.getElementById('sellerRegisterForm');
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(registerForm);
        const sellerData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            phone: formData.get('phone'),
            addressLine1: formData.get('addressLine1'),
            addressLine2: formData.get('addressLine2'),
            city: formData.get('city'),
            state: formData.get('state'),
            postalCode: formData.get('postalCode'),
            country: formData.get('country'),
            dob: formData.get('dob'),
            gender: formData.get('gender'),
            storeName: formData.get('storeName'),
            businessDetails: formData.get('businessDetails'),
            contactNumber: formData.get('contactNumber'),
            gstNumber: formData.get('gstNumber'),
            bankDetails: formData.get('bankDetails'),
            businessEmail: formData.get('businessEmail')
        };
        
        fetch('http://localhost:8082/api/auth/sellerRegister', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sellerData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Registration failed');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Registration successful! Please login.');
                window.location.href = '/seller/login';
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        })
        .catch(error => {
            console.error('Registration error:', error);
            document.getElementById('registerError').textContent = error.message;
            document.getElementById('registerError').style.display = 'block';
        });
    });
}

function loadSellerDashboard() {
    const sellerId = localStorage.getItem('sellerId');
    const accessToken = localStorage.getItem('sellerAccessToken');
    
    if (!sellerId || !accessToken) {
        window.location.href = '/seller/login';
        return;
    }
    
    // Fetch seller dashboard data
    fetch(`http://localhost:8082/api/sellers/${sellerId}/dashboard`, {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                // Token might be expired, try to refresh
                return refreshSellerToken()
                    .then(() => loadSellerDashboard());
            }
            throw new Error('Failed to load dashboard data');
        }
        return response.json();
    })
    .then(data => {
        // Update dashboard stats
        document.getElementById('totalOrders').textContent = data.totalOrders;
        document.getElementById('pendingOrders').textContent = data.pendingOrders;
        document.getElementById('completedOrders').textContent = data.completedOrders;
        document.getElementById('totalRevenue').textContent = '$' + data.totalRevenue.toLocaleString();
    })
    .catch(error => {
        console.error('Dashboard error:', error);
        if (error.message.includes('Unauthorized')) {
            window.location.href = '/seller/login';
        }
    });
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('sellerAccessToken');
            localStorage.removeItem('sellerRefreshToken');
            localStorage.removeItem('sellerId');
            window.location.href = '/seller/login';
        });
    }
}

function loadSellerProfile() {
    const sellerId = localStorage.getItem('sellerId');
    const accessToken = localStorage.getItem('sellerAccessToken');
    
    if (!sellerId || !accessToken) {
        window.location.href = '/seller/login';
        return;
    }
    
    // Fetch seller profile data
    fetch(`http://localhost:8082/api/sellers/${sellerId}`, {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                // Token might be expired, try to refresh
                return refreshSellerToken()
                    .then(() => loadSellerProfile());
            }
            throw new Error('Failed to load profile data');
        }
        return response.json();
    })
    .then(seller => {
        // Update profile information
        document.getElementById('sellerName').textContent = `${seller.firstName} ${seller.lastName}`;
        document.getElementById('sellerEmail').textContent = seller.email;
        document.getElementById('sellerPhone').textContent = seller.phone;
        document.getElementById('sellerStore').textContent = seller.storeName;
        document.getElementById('sellerStatus').textContent = seller.status;
        
        // Update business details
        document.getElementById('businessDetails').textContent = seller.businessDetails;
        document.getElementById('gstNumber').textContent = seller.gstNumber;
        document.getElementById('contactNumber').textContent = seller.contactNumber;
        document.getElementById('businessEmail').textContent = seller.businessEmail;
        
        // Update address
        document.getElementById('addressLine1').textContent = seller.addressLine1;
        document.getElementById('addressLine2').textContent = seller.addressLine2 || '';
        document.getElementById('city').textContent = seller.city;
        document.getElementById('state').textContent = seller.state;
        document.getElementById('postalCode').textContent = seller.postalCode;
        document.getElementById('country').textContent = seller.country;
    })
    .catch(error => {
        console.error('Profile error:', error);
        if (error.message.includes('Unauthorized')) {
            window.location.href = '/seller/login';
        }
    });
}

function refreshSellerToken() {
    const refreshToken = localStorage.getItem('sellerRefreshToken');
    if (!refreshToken) {
        return Promise.reject('No refresh token available');
    }
    
    return fetch('http://localhost:8082/api/auth/refresh-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: refreshToken })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem('sellerAccessToken', data.accessToken);
        if (data.refreshToken) {
            localStorage.setItem('sellerRefreshToken', data.refreshToken);
        }
        return data;
    });
}