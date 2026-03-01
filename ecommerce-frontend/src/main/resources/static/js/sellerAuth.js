document.addEventListener("DOMContentLoaded", function () {
        const themeToggle = document.getElementById("themeToggle");
        const icon = themeToggle.querySelector("i");
        let isOtpMode = false;

        // Theme handling
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        let darkMode =
          localStorage.getItem("darkMode") === "true" ||
          (localStorage.getItem("darkMode") === null && prefersDark);
        updateTheme();

        themeToggle.addEventListener("click", function () {
          darkMode = !darkMode;
          localStorage.setItem("darkMode", darkMode);
          updateTheme();
        });

        function updateTheme() {
          if (darkMode) {
            document.documentElement.style.setProperty("--light-bg", "#0f0f1a");
            document.documentElement.style.setProperty("--card-bg", "#16213e");
            document.documentElement.style.setProperty(
              "--dark-text",
              "#f8f9fa"
            );
            document.documentElement.style.setProperty(
              "--medium-text",
              "#cccccc"
            );
            document.documentElement.style.setProperty(
              "--light-text",
              "#999999"
            );
            document.documentElement.style.setProperty(
              "--border-color",
              "#2a2a3a"
            );
            icon.classList.replace("fa-sun", "fa-moon");
          } else {
            document.documentElement.style.setProperty("--light-bg", "#f8f9fa");
            document.documentElement.style.setProperty("--card-bg", "#ffffff");
            document.documentElement.style.setProperty(
              "--dark-text",
              "#333333"
            );
            document.documentElement.style.setProperty(
              "--medium-text",
              "#555555"
            );
            document.documentElement.style.setProperty(
              "--light-text",
              "#888888"
            );
            document.documentElement.style.setProperty(
              "--border-color",
              "#e0e0e0"
            );
            icon.classList.replace("fa-moon", "fa-sun");
          }
        }

        // Form toggle logic
        const loginForm = document.getElementById("loginForm");
        const signupForm = document.getElementById("registerForm");
        const overlayTitle = document.getElementById("overlayTitle");
        const overlayDesc = document.getElementById("overlayDesc");

        document.getElementById("showSignup").addEventListener("click", (e) => {
          e.preventDefault();
          loginForm.style.display = "none";
          signupForm.style.display = "flex";
          showStep(1);
          document.querySelector(".signup-content").scrollTop = 0;
          overlayTitle.textContent = "Join Us Today!";
          overlayDesc.textContent =
            "Create an account to explore our seller platform and grow your business.";
          clearAlerts();
        });

        document.getElementById("showLogin").addEventListener("click", (e) => {
          e.preventDefault();
          signupForm.style.display = "none";
          loginForm.style.display = "block";
          overlayTitle.textContent = "Welcome Back!";
          overlayDesc.textContent =
            "Login to access your personalized dashboard and continue your journey with us.";
          resetLoginForm();
          clearAlerts();
        });

        // OTP toggle logic
        document.getElementById("toggleOtp").addEventListener("click", (e) => {
          e.preventDefault();
          isOtpMode = !isOtpMode;
          console.log("Toggling OTP mode:", isOtpMode);
          document.getElementById("passwordFields").style.display = isOtpMode
            ? "none"
            : "block";
          document.getElementById("otpFields").style.display = isOtpMode
            ? "block"
            : "none";
          document.getElementById("otpRequestFields").style.display = isOtpMode
            ? "block"
            : "none";
          document.getElementById("loginPassword").required = !isOtpMode;
          document.getElementById("loginOtp").required = isOtpMode;
          document.getElementById("toggleOtp").textContent = isOtpMode
            ? "Login with Password"
            : "Login with OTP";
          if (!isOtpMode) {
            document.getElementById("sellerLoginForm").reset();
            document
              .getElementById("loginIdentifier")
              .classList.remove("is-invalid");
            document
              .getElementById("loginPassword")
              .classList.remove("is-invalid");
            document.getElementById("loginOtp").classList.remove("is-invalid");
          }
        });

        function showAlert(elementId, message, type) {
          const alert = document.getElementById(elementId);
          alert.className = `alert alert-${type}`;
          alert.textContent = message;
          alert.style.display = "block";
          setTimeout(() => (alert.style.display = "none"), 5000);
        }

        function clearAlerts() {
          document.getElementById("loginAlert").style.display = "none";
          document.getElementById("registerAlert").style.display = "none";
        }

        function resetLoginForm() {
          isOtpMode = false;
          document.getElementById("passwordFields").style.display = "block";
          document.getElementById("otpFields").style.display = "none";
          document.getElementById("otpRequestFields").style.display = "none";
          document.getElementById("loginPassword").required = true;
          document.getElementById("loginOtp").required = false;
          document.getElementById("toggleOtp").textContent = "Login with OTP";
          document.getElementById("sellerLoginForm").reset();
          document
            .getElementById("loginIdentifier")
            .classList.remove("is-invalid");
          document
            .getElementById("loginPassword")
            .classList.remove("is-invalid");
          document.getElementById("loginOtp").classList.remove("is-invalid");
        }

        function normalizePhone(phone) {
          if (!phone) return phone;
          let cleaned = phone.trim().replace(/^\+\d+/, "");
          return "+91" + cleaned;
        }

        async function requestOtp() {
          let identifier = document
            .getElementById("loginIdentifier")
            .value.trim();
          if (!identifier) {
            showAlert(
              "loginAlert",
              "Please enter an email or phone number.",
              "danger"
            );
            return;
          }

          if (!identifier.includes("@")) {
            identifier = normalizePhone(identifier);
          }

          try {
            const response = await fetch(
              "http://localhost:8082/api/auth/request-otp?identifier=" +
                encodeURIComponent(identifier),
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              }
            );
            const data = await response.json();

            if (response.ok) {
              showAlert(
                "loginAlert",
                "OTP sent successfully! Check your email or phone.",
                "success"
              );
              isOtpMode = true;
              document.getElementById("passwordFields").style.display = "none";
              document.getElementById("otpFields").style.display = "block";
              document.getElementById("requestOtpBtn").textContent =
                "Resend OTP";
              document.getElementById("loginPassword").required = false;
              document.getElementById("loginOtp").required = true;
            } else {
              showAlert(
                "loginAlert",
                data.message || "Failed to send OTP.",
                "danger"
              );
            }
          } catch (error) {
            showAlert(
              "loginAlert",
              "An error occurred while requesting OTP.",
              "danger"
            );
          }
        }

        // Attach event listener for requestOtpBtn
        document
          .getElementById("requestOtpBtn")
          .addEventListener("click", requestOtp);

        // Handle Login Form Submission
        document
          .getElementById("sellerLoginForm")
          .addEventListener("submit", async (e) => {
            e.preventDefault();
            let identifier = document
              .getElementById("loginIdentifier")
              .value.trim();
            const password = document.getElementById("loginPassword").value;
            const otp = document.getElementById("loginOtp").value;

            if (!isOtpMode && !password) {
              showAlert("loginAlert", "Please enter a password.", "danger");
              return;
            }
            if (isOtpMode && !otp) {
              showAlert("loginAlert", "Please enter the OTP.", "danger");
              return;
            }

            if (!identifier.includes("@")) {
              identifier = normalizePhone(identifier);
            }

            const loginRequest = isOtpMode
              ? { identifier, otp }
              : { identifier, password };

            try {
              console.log("Attempting login with:", identifier);
              const response = await fetch(
                "http://localhost:8082/api/auth/login",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(loginRequest),
                }
              );
              const data = await response.json();

              if (response.ok) {
                console.log("Login successful, storing tokens and sellerId");
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("refreshToken", data.refreshToken);
                if (data.sellerId) {
                  console.log("Storing sellerId:", data.sellerId);
                  localStorage.setItem("sellerId", data.sellerId);
                } else {
                  console.warn("No sellerId in login response");
                }

                showAlert("loginAlert", "Login successful!", "success");
                setTimeout(() => {
                  console.log("Redirecting to sellerdashboard.html");
                  window.location.href = "/seller/dashboard";
                }, 1000);
              } else {
                console.warn("Login failed:", data.message);
                showAlert(
                  "loginAlert",
                  data.message || "Login failed.",
                  "danger"
                );
              }
            } catch (error) {
              console.error("Login error:", error.message);
              showAlert(
                "loginAlert",
                "An error occurred. Please try again.",
                "danger"
              );
            }
          });

        // State and City Data
        const stateCityData = {
          "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur"],
          "Arunachal Pradesh": ["Itanagar", "Naharlagun"],
          Assam: ["Guwahati", "Silchar", "Dibrugarh"],
          Bihar: ["Patna", "Gaya", "Bhagalpur"],
          Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur"],
          Goa: ["Panaji", "Margao"],
          Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
          Haryana: ["Gurgaon", "Faridabad", "Panipat"],
          "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala"],
          Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad"],
          Karnataka: ["Bangalore", "Mysore", "Mangalore"],
          Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode"],
          "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior"],
          Maharashtra: ["Mumbai", "Pune", "Nagpur"],
          Manipur: ["Imphal"],
          Meghalaya: ["Shillong"],
          Mizoram: ["Aizawl"],
          Nagaland: ["Kohima", "Dimapur"],
          Odisha: ["Bhubaneswar", "Cuttack", "Rourkela"],
          Punjab: ["Chandigarh", "Ludhiana", "Amritsar"],
          Rajasthan: ["Jaipur", "Jodhpur", "Udaipur"],
          Sikkim: ["Gangtok"],
          "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
          Telangana: ["Hyderabad", "Warangal"],
          Tripura: ["Agartala"],
          "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida"],
          Uttarakhand: ["Dehradun", "Haridwar"],
          "West Bengal": ["Kolkata", "Howrah", "Durgapur"],
        };

        const stateSelect = document.getElementById("state");
        const citySelect = document.getElementById("city");

        stateSelect.addEventListener("change", function () {
          const selectedState = this.value;
          citySelect.innerHTML =
            '<option value="" disabled selected>Select City</option>';
          if (selectedState && stateCityData[selectedState]) {
            stateCityData[selectedState].forEach((city) => {
              const option = document.createElement("option");
              option.value = city;
              option.textContent = city;
              citySelect.appendChild(option);
            });
          }
          citySelect.disabled = !selectedState;
        });

        // Validation Functions
        function validateNameInput(input) {
          const value = input.value.trim();
          const isValid =
            input.id === "lastName"
              ? /^[A-Za-z\s]+$/.test(value)
              : /^[A-Za-z]+$/.test(value);
          input.classList.toggle("is-invalid", !isValid);
          return isValid;
        }

        function validateEmailInput(input) {
          const email = input.value.trim();
          const isValid = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
          input.classList.toggle("is-invalid", !isValid);
          return isValid;
        }

        function validatePhoneInput(input) {
          const phone = input.value.trim();
          const isValid = /^[0-9]{10}$/.test(phone);
          input.classList.toggle("is-invalid", !isValid);
          return isValid;
        }

        function validatePasswordInput(input) {
          const password = input.value;
          const isValid =
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/.test(
              password
            );
          input.classList.toggle("is-invalid", !isValid);
          return isValid;
        }

        function validateConfirmPasswordInput(input) {
          const password = document.getElementById("password").value;
          const isValid = input.value === password;
          input.classList.toggle("is-invalid", !isValid);
          return isValid;
        }

        function validateGstInput(input) {
          const gst = input.value.trim();
          const isValid =
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
              gst
            );
          input.classList.toggle("is-invalid", !isValid);
          return isValid;
        }

        function validateUpiInput(input) {
          const upi = input.value.trim();
          const isValid = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi);
          input.classList.toggle("is-invalid", !isValid);
          return isValid;
        }

        function validatePostalCodeInput(input) {
          const postalCode = input.value.trim();
          const isValid = /^[0-9]{6}$/.test(postalCode);
          input.classList.toggle("is-invalid", !isValid);
          return isValid;
        }

        function updatePasswordStrength(password) {
          const strengthText = document.getElementById("strengthText");
          const strengthBar = document.getElementById("strengthBar");
          let strength = "weak";

          if (!password) {
            strengthText.textContent = "";
            strengthBar.className = "strength-bar";
            return;
          }

          const hasLetter = /[A-Za-z]/.test(password);
          const hasNumber = /\d/.test(password);
          const hasSpecial = /[@$!%*#?&]/.test(password);
          const length = password.length;

          if (length >= 8 && hasLetter && hasNumber && hasSpecial) {
            strength = "strong";
          } else if (
            length >= 6 &&
            ((hasLetter && hasNumber) ||
              (hasLetter && hasSpecial) ||
              (hasNumber && hasSpecial))
          ) {
            strength = "medium";
          } else {
            strength = "weak";
          }

          strengthText.textContent = strength;
          strengthText.className = strength;
          strengthBar.className = `strength-bar ${strength}`;
        }

        document
          .getElementById("password")
          .addEventListener("input", function () {
            updatePasswordStrength(this.value);
          });

        // Multi-step form functionality
        const formSteps = document.querySelectorAll(".form-step");
        const nextBtn = document.getElementById("nextBtn");
        const prevBtn = document.getElementById("prevBtn");
        const submitBtn = document.getElementById("submitBtn");
        const stepIndicators = document.querySelectorAll(".step");
        let currentStep = 1;

        function showStep(stepNumber) {
          formSteps.forEach((step) => step.classList.remove("active"));
          document.getElementById("step" + stepNumber).classList.add("active");

          stepIndicators.forEach((indicator, index) => {
            if (index < stepNumber - 1) {
              indicator.classList.remove("active");
              indicator.classList.add("completed");
            } else if (index === stepNumber - 1) {
              indicator.classList.add("active");
              indicator.classList.remove("completed");
            } else {
              indicator.classList.remove("active", "completed");
            }
          });

          if (stepNumber === 1) {
            prevBtn.style.display = "none";
            nextBtn.style.display = "block";
            submitBtn.style.display = "none";
          } else if (stepNumber === formSteps.length) {
            prevBtn.style.display = "block";
            nextBtn.style.display = "none";
            submitBtn.style.display = "block";
          } else {
            prevBtn.style.display = "block";
            nextBtn.style.display = "block";
            submitBtn.style.display = "none";
          }

          currentStep = stepNumber;
        }

        nextBtn.addEventListener("click", () => {
          const currentStepInputs = document.querySelectorAll(
            `#step${currentStep} [required]`
          );
          let isValid = true;

          currentStepInputs.forEach((input) => {
            if (!input.value.trim()) {
              input.classList.add("is-invalid");
              isValid = false;
            } else if (input.id === "firstName" || input.id === "lastName") {
              if (!validateNameInput(input)) isValid = false;
            } else if (input.id === "email") {
              if (!validateEmailInput(input)) isValid = false;
            } else if (input.id === "phone") {
              if (!validatePhoneInput(input)) isValid = false;
            } else if (input.id === "password") {
              if (!validatePasswordInput(input)) isValid = false;
            } else if (input.id === "confirmPassword") {
              if (!validateConfirmPasswordInput(input)) isValid = false;
            } else if (input.id === "storeName") {
              if (!input.value.trim()) {
                input.classList.add("is-invalid");
                isValid = false;
              } else {
                input.classList.remove("is-invalid");
              }
            } else if (input.id === "businessDetails") {
              if (input.value.trim().length < 10) {
                input.classList.add("is-invalid");
                isValid = false;
              } else {
                input.classList.remove("is-invalid");
              }
            } else if (input.id === "gstNumber") {
              if (!validateGstInput(input)) isValid = false;
            } else if (input.id === "bankName") {
              if (!input.value.trim()) {
                input.classList.add("is-invalid");
                isValid = false;
              } else {
                input.classList.remove("is-invalid");
              }
            } else if (input.id === "upiCode") {
              if (!validateUpiInput(input)) isValid = false;
            } else if (input.id === "addressLine1") {
              if (!input.value.trim()) {
                input.classList.add("is-invalid");
                isValid = false;
              } else {
                input.classList.remove("is-invalid");
              }
            } else if (input.id === "state") {
              if (!input.value) {
                input.classList.add("is-invalid");
                isValid = false;
              } else {
                input.classList.remove("is-invalid");
              }
            } else if (input.id === "city") {
              if (!input.value) {
                input.classList.add("is-invalid");
                isValid = false;
              } else {
                input.classList.remove("is-invalid");
              }
            } else if (input.id === "postalCode") {
              if (!validatePostalCodeInput(input)) isValid = false;
            } else {
              input.classList.remove("is-invalid");
            }
          });

          if (isValid) {
            showStep(currentStep + 1);
            document.querySelector(".signup-content").scrollTop = 0;
          } else {
            showAlert(
              "registerAlert",
              "Please fill in all required fields correctly.",
              "danger"
            );
          }
        });

        prevBtn.addEventListener("click", () => {
          showStep(currentStep - 1);
          document.querySelector(".signup-content").scrollTop = 0;
        });

        // Handle Registration Form Submission
        document
          .getElementById("sellerRegisterForm")
          .addEventListener("submit", async (e) => {
            e.preventDefault();
            const password = document.getElementById("password").value;
            const confirmPassword =
              document.getElementById("confirmPassword").value;
            const phoneInput = document.getElementById("phone");
            const emailInput = document.getElementById("email");
            const gstInput = document.getElementById("gstNumber");
            const upiInput = document.getElementById("upiCode");
            const stateInput = document.getElementById("state");
            const cityInput = document.getElementById("city");
            const postalCodeInput = document.getElementById("postalCode");

            if (password !== confirmPassword) {
              document
                .getElementById("confirmPassword")
                .classList.add("is-invalid");
              showAlert("registerAlert", "Passwords do not match!", "danger");
              return;
            }

            if (!validatePhoneInput(phoneInput)) {
              showAlert(
                "registerAlert",
                "Please enter a valid 10-digit phone number.",
                "danger"
              );
              return;
            }

            if (!validateEmailInput(emailInput)) {
              showAlert(
                "registerAlert",
                "Please enter a valid email address.",
                "danger"
              );
              return;
            }

            if (!validateGstInput(gstInput)) {
              showAlert(
                "registerAlert",
                "Please enter a valid GST number.",
                "danger"
              );
              return;
            }

            if (!validateUpiInput(upiInput)) {
              showAlert(
                "registerAlert",
                "Please enter a valid UPI ID.",
                "danger"
              );
              return;
            }

            if (!stateInput.value) {
              stateInput.classList.add("is-invalid");
              showAlert("registerAlert", "Please select a state.", "danger");
              return;
            }

            if (!cityInput.value) {
              cityInput.classList.add("is-invalid");
              showAlert("registerAlert", "Please select a city.", "danger");
              return;
            }

            if (!validatePostalCodeInput(postalCodeInput)) {
              showAlert(
                "registerAlert",
                "Please enter a valid 6-digit postal code.",
                "danger"
              );
              return;
            }

            let phone = phoneInput.value.trim();
            phone = normalizePhone(phone);

            const upiCode = upiInput.value.trim();
            const bankName = document.getElementById("bankName").value;
            const bankDetails = `UPI: ${upiCode}, Bank: ${bankName}`;

            const signupRequest = {
              firstName: document.getElementById("firstName").value,
              lastName: document.getElementById("lastName").value,
              email: document.getElementById("email").value,
              password: password,
              phone: phone,
              storeName: document.getElementById("storeName").value,
              businessDetails: document.getElementById("businessDetails").value,
              addressLine1: document.getElementById("addressLine1").value,
              addressLine2: document.getElementById("addressLine2").value,
              city: document.getElementById("city").value,
              state: document.getElementById("state").value,
              postalCode: document.getElementById("postalCode").value,
              country: document.getElementById("country").value,
              gstNumber: document.getElementById("gstNumber").value,
              bankDetails: bankDetails,
            };

            try {
              const response = await fetch(
                "http://localhost:8082/api/auth/sellerRegister",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(signupRequest),
                }
              );
              const data = await response.json();

              if (response.ok) {
                showAlert(
                  "registerAlert",
                  "Registration successful! Please login.",
                  "success"
                );
                setTimeout(() => {
                  signupForm.style.display = "none";
                  loginForm.style.display = "block";
                  resetLoginForm();
                }, 1000);
              } else {
                showAlert(
                  "registerAlert",
                  data.message || "Registration failed.",
                  "danger"
                );
              }
            } catch (error) {
              showAlert(
                "registerAlert",
                "An error occurred. Please try again.",
                "danger"
              );
            }
          });
      });