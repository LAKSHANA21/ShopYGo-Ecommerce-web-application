let isOtpMode = false;

      // Initialize particles.js
      particlesJS("particles-js", {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: "#6a5acd" },
          shape: { type: "circle" },
          opacity: { value: 0.5, random: true },
          size: { value: 3, random: true },
          line_linked: {
            enable: true,
            distance: 150,
            color: "#5849b1",
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 2,
            direction: "none",
            random: true,
            straight: false,
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: { enable: true, mode: "repulse" },
            onclick: { enable: true, mode: "push" },
          },
        },
      });

      // Toggle between sign-in and sign-up
      const container = document.getElementById("container");
      function toggle() {
        container.classList.toggle("sign-in");
        container.classList.toggle("sign-up");
        resetLoginForm();
        document.getElementById("userRegisterForm").reset();
        document.querySelector(".form-step.active").classList.remove("active");
        document.getElementById("step-1").classList.add("active");
        document.querySelector(".step.active").classList.remove("active");
        document.querySelector(".step[data-step='1']").classList.add("active");
        document.querySelector(".form.sign-up").scrollTop = 0;
      }

      // Initialize with sign-in form
      setTimeout(() => {
        container.classList.add("sign-in");
      }, 200);

      // Theme switcher
      const themeSwitcher = document.querySelector(".theme-switcher");
      themeSwitcher.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        themeSwitcher.innerHTML = document.body.classList.contains("light-mode")
          ? '<i class="bx bx-sun"></i>'
          : '<i class="bx bx-moon"></i>';
      });

      // Password strength meter
      document
        .getElementById("password")
        .addEventListener("input", function (e) {
          const strengthBar = document.querySelector(".strength-bar");
          const strengthText = document.querySelector(".strength-text span");
          const password = e.target.value;
          const meter = document.querySelector(".password-strength");
          meter.style.display = password ? "block" : "none";
          let strength = 0;
          if (password.length > 0) strength += 1;
          if (password.length >= 8) strength += 1;
          if (/[A-Z]/.test(password)) strength += 1;
          if (/[0-9]/.test(password)) strength += 1;
          if (/[^A-Za-z0-9]/.test(password)) strength += 1;
          const colors = ["red", "orange", "yellow", "#9acd32", "green"];
          const texts = [
            "Very Weak",
            "Weak",
            "Medium",
            "Strong",
            "Very Strong",
          ];
          strengthBar.style.width = strength * 20 + "%";
          strengthBar.style.backgroundColor = colors[strength - 1];
          strengthText.textContent = texts[strength - 1];
          strengthText.style.color = colors[strength - 1];
        });

      // Toast notification function
      function showToast(message, type = "success") {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.className = "toast " + type;
        toast.style.transform = "translateX(0)";
        setTimeout(() => {
          toast.style.transform = "translateX(150%)";
        }, 3000);
      }

      // Reset login form
      function resetLoginForm() {
        isOtpMode = false;
        document.getElementById("passwordFields").style.display = "block";
        document.getElementById("otpFields").style.display = "none";
        document.getElementById("requestOtpBtn").style.display = "none";
        document.getElementById("requestOtpBtn").textContent = "Request OTP";
        document.getElementById("loginPassword").required = true;
        document.getElementById("loginOtp").required = false;
        document.getElementById("toggleOtp").textContent = "Login with OTP";
        document.getElementById("userLoginForm").reset();
      }

      // Normalize phone number
      function normalizePhone(phone) {
        if (!phone) return phone;
        let cleaned = phone.trim().replace(/^\+\d+/, "");
        return "+91" + cleaned;
      }

      // Validation functions
      function validateNameInput(input) {
        const value = input.value.trim();
        const isValid =
          input.id === "lastName"
            ? /^[A-Za-z\s]+$/.test(value)
            : /^[A-Za-z]+$/.test(value);
        if (!isValid) input.style.borderBottomColor = "red";
        return isValid;
      }

      function validateEmailInput(input) {
        const email = input.value.trim();
        const isValid = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
        if (!isValid) input.style.borderBottomColor = "red";
        return isValid;
      }

      function validatePhoneInput(input) {
        const phone = input.value.trim();
        const isValid = /^[0-9]{10}$/.test(phone);
        if (!isValid) input.style.borderBottomColor = "red";
        return isValid;
      }

      function validatePasswordInput(input) {
        const password = input.value;
        const isValid =
          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(
            password
          );
        if (!isValid) input.style.borderBottomColor = "red";
        return isValid;
      }

      function validateConfirmPasswordInput(input) {
        const password = document.getElementById("password").value;
        const isValid = input.value === password;
        if (!isValid) input.style.borderBottomColor = "red";
        return isValid;
      }

      function validatePostalCodeInput(input) {
        const postalCode = input.value.trim();
        const isValid = /^[0-9]{6}$/.test(postalCode);
        if (!isValid) input.style.borderBottomColor = "red";
        return isValid;
      }

      function validateDobInput(input) {
        const dob = input.value;
        const isValid = dob && new Date(dob) < new Date();
        if (!isValid) input.style.borderBottomColor = "red";
        return isValid;
      }

      // OTP toggle
      document.getElementById("toggleOtp").addEventListener("click", () => {
        isOtpMode = !isOtpMode;
        document.getElementById("passwordFields").style.display = isOtpMode
          ? "none"
          : "block";
        document.getElementById("otpFields").style.display = isOtpMode
          ? "block"
          : "none";
        document.getElementById("requestOtpBtn").style.display = isOtpMode
          ? "block"
          : "none";
        document.getElementById("loginPassword").required = !isOtpMode;
        document.getElementById("loginOtp").required = isOtpMode;
        document.getElementById("toggleOtp").textContent = isOtpMode
          ? "Login with Password"
          : "Login with OTP";
        if (!isOtpMode) {
          document.getElementById("userLoginForm").reset();
        }
      });

      // Request OTP
      document
        .getElementById("requestOtpBtn")
        .addEventListener("click", async () => {
          let identifier = document
            .getElementById("loginIdentifier")
            .value.trim();
          const requestOtpBtn = document.getElementById("requestOtpBtn");
          if (!identifier) {
            showToast("Please enter an email or phone number.", "error");
            document.getElementById("loginIdentifier").style.borderBottomColor =
              "red";
            return;
          }
          if (
            !identifier.includes("@") &&
            !validatePhoneInput(document.getElementById("loginIdentifier"))
          ) {
            showToast("Please enter a valid 10-digit phone number.", "error");
            document.getElementById("loginIdentifier").style.borderBottomColor =
              "red";
            return;
          }
          if (
            identifier.includes("@") &&
            !validateEmailInput(document.getElementById("loginIdentifier"))
          ) {
            showToast("Please enter a valid email address.", "error");
            document.getElementById("loginIdentifier").style.borderBottomColor =
              "red";
            return;
          }
          document.getElementById("loginIdentifier").style.borderBottomColor =
            "";
          requestOtpBtn.disabled = true;
          if (!identifier.includes("@")) {
            identifier = normalizePhone(identifier);
          }
          try {
            const response = await fetch(
              `http://localhost:8082/api/auth/request-otp?identifier=${encodeURIComponent(
                identifier
              )}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              }
            );
            const data = await response.json();
            if (response.ok) {
              showToast(
                "OTP sent successfully! Check your email or phone.",
                "success"
              );
              document.getElementById("requestOtpBtn").textContent =
                "Resend OTP";
            } else {
              showToast(data.message || "Failed to send OTP.", "error");
            }
          } catch (error) {
            showToast("An error occurred while requesting OTP.", "error");
          } finally {
            requestOtpBtn.disabled = false;
          }
        });

      // Handle Login Form Submission
      document
        .getElementById("userLoginForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          let identifier = document
            .getElementById("loginIdentifier")
            .value.trim();
          const password = document.getElementById("loginPassword").value;
          const otp = document.getElementById("loginOtp").value;
          if (!isOtpMode && !password) {
            showToast("Please enter a password.", "error");
            document.getElementById("loginPassword").style.borderBottomColor =
              "red";
            return;
          }
          if (isOtpMode && !otp) {
            showToast("Please enter the OTP.", "error");
            document.getElementById("loginOtp").style.borderBottomColor = "red";
            return;
          }
          if (
            !identifier.includes("@") &&
            !validatePhoneInput(document.getElementById("loginIdentifier"))
          ) {
            showToast("Please enter a valid 10-digit phone number.", "error");
            document.getElementById("loginIdentifier").style.borderBottomColor =
              "red";
            return;
          }
          if (
            identifier.includes("@") &&
            !validateEmailInput(document.getElementById("loginIdentifier"))
          ) {
            showToast("Please enter a valid email address.", "error");
            document.getElementById("loginIdentifier").style.borderBottomColor =
              "red";
            return;
          }
          document.getElementById("loginIdentifier").style.borderBottomColor =
            "";
          document.getElementById("loginPassword").style.borderBottomColor = "";
          document.getElementById("loginOtp").style.borderBottomColor = "";
          if (!identifier.includes("@")) {
            identifier = normalizePhone(identifier);
          }
          const loginRequest = isOtpMode
            ? { identifier, otp }
            : { identifier, password };
          try {
            const loginResponse = await fetch(
              "http://localhost:8082/api/auth/login",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginRequest),
              }
            );
            const loginData = await loginResponse.json();
            if (loginResponse.ok) {
              localStorage.setItem("accessToken", loginData.accessToken);
              localStorage.setItem("refreshToken", loginData.refreshToken);
              if (loginData.userId) {
                localStorage.setItem("userId", loginData.userId);

                // Check or create cart for the user
                try {
                  const cartResponse = await fetch(
                    `http://localhost:8082/api/cart/user/${loginData.userId}`,
                    {
                      method: "GET",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${loginData.accessToken}`,
                      },
                    }
                  );
                  const cartData = await cartResponse.json();
                  if (cartResponse.ok) {
                    localStorage.setItem("cartId", cartData.id);
                    showToast(
                      `Login successful! Cart ${cartData.id} is ready.`,
                      "success"
                    );
                  } else {
                    showToast(
                      "Login successful, but failed to retrieve or create cart.",
                      "error"
                    );
                  }
                } catch (cartError) {
                  showToast(
                    "Login successful, but an error occurred while checking cart.",
                    "error"
                  );
                  console.error("Cart fetch error:", cartError);
                }
              } else {
                showToast("Login successful, but user ID missing.", "error");
              }
              setTimeout(() => {
                window.location.href = "/products";
              }, 1000);
            } else {
              showToast(loginData.message || "Login failed.", "error");
            }
          } catch (error) {
            showToast("An error occurred. Please try again.", "error");
            console.error("Login error:", error);
          }
        });

      // City population based on state
      const cityOptions = {
        "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore"],
        Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubli"],
        Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
        "Tamil Nadu": [
          "Chennai",
          "Coimbatore",
          "Madurai",
          "Tiruchirappalli",
          "Salem",
          "Tirunelveli",
          "Erode",
          "Vellore",
          "Thoothukudi",
          "Dindigul",
          "Thanjavur",
          "Ranipet",
          "Sivakasi",
          "Karur",
          "Udhagamandalam (Ooty)",
          "Hosur",
          "Nagercoil",
          "Kanchipuram",
          "Kumbakonam",
          "Tiruvannamalai",
          "Pollachi",
          "Rajapalayam",
          "Cuddalore",
          "Tiruppur",
          "Nagapattinam",
          "Pudukkottai",
          "Vaniyambadi",
          "Ambur",
          "Namakkal",
          "Chengalpattu",
          "Arakkonam",
          "Perambalur",
          "Tenkasi",
          "Villupuram",
          "Karaikudi",
          "Pattukkottai",
          "Arani",
          "Tiruchengode",
          "Gudiyatham",
          "Thiruvarur",
          "Virudhunagar",
          "Ramanathapuram",
          "Dharmapuri",
          "Krishnagiri",
          "Sivaganga",
          "Theni",
          "Mayiladuthurai",
        ],
        Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
      };

      function populateCities(state) {
        const citySelect = document.getElementById("city");
        citySelect.innerHTML =
          '<option value="" disabled selected>Select City</option>';
        if (state && cityOptions[state]) {
          cityOptions[state].forEach((city) => {
            const option = document.createElement("option");
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
          });
        }
      }

      function populateCities(state) {
        const citySelect = document.getElementById("city");
        citySelect.innerHTML =
          '<option value="" disabled selected>Select City</option>';
        if (state && cityOptions[state]) {
          cityOptions[state].forEach((city) => {
            const option = document.createElement("option");
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
          });
        }
      }

      // State change handler
      document.getElementById("state").addEventListener("change", (e) => {
        populateCities(e.target.value);
        const citySelect = document.getElementById("city");
        citySelect.value = "";
        const cityLabel = citySelect.nextElementSibling;
        cityLabel.style.top = "1rem";
        cityLabel.style.fontSize = "1rem";
        cityLabel.style.color = "var(--gray-2)";
      });

      // Form steps functionality for signup
      document.addEventListener("DOMContentLoaded", function () {
        const formSteps = document.querySelectorAll(".form-step");
        const steps = document.querySelectorAll(".step");
        const nextBtn = document.querySelector(".next-btn");
        const backBtn = document.querySelector(".back-btn");

        if (nextBtn) {
          nextBtn.addEventListener("click", function () {
            const currentStep = document.querySelector(".form-step.active");
            const inputs = currentStep.querySelectorAll(
              "input[required], select[required]"
            );
            let isValid = true;
            inputs.forEach((input) => {
              if (!input.value.trim()) {
                input.style.borderBottomColor = "red";
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
              } else if (input.id === "dob") {
                if (!validateDobInput(input)) isValid = false;
              } else if (input.name === "gender") {
                if (!document.querySelector('input[name="gender"]:checked')) {
                  input.style.borderBottomColor = "red";
                  isValid = false;
                }
              } else {
                input.style.borderBottomColor = "";
              }
            });
            if (isValid) {
              document
                .querySelector(".form-step.active")
                .classList.remove("active");
              document.getElementById("step-2").classList.add("active");
              steps[0].classList.remove("active");
              steps[1].classList.add("active");
              document.querySelector(".form.sign-up").scrollTop = 0;
              populateCities(document.getElementById("state").value);
            } else {
              showToast(
                "Please fill in all required fields correctly.",
                "error"
              );
            }
          });
        }

        if (backBtn) {
          backBtn.addEventListener("click", function () {
            document
              .querySelector(".form-step.active")
              .classList.remove("active");
            document.getElementById("step-1").classList.add("active");
            steps[1].classList.remove("active");
            steps[0].classList.add("active");
            document.querySelector(".form.sign-up").scrollTop = 0;
          });
        }
      });

      // Handle Registration Form Submission
      document
        .getElementById("userRegisterForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const password = document.getElementById("password").value;
          const confirmPassword =
            document.getElementById("confirmPassword").value;
          const phoneInput = document.getElementById("phone");
          const emailInput = document.getElementById("email");
          const dobInput = document.getElementById("dob");
          const stateInput = document.getElementById("state");
          const cityInput = document.getElementById("city");
          const postalCodeInput = document.getElementById("postalCode");
          const genderInput = document.querySelector(
            'input[name="gender"]:checked'
          );

          if (password !== confirmPassword) {
            showToast("Passwords do not match!", "error");
            document.getElementById("confirmPassword").style.borderBottomColor =
              "red";
            return;
          }
          if (!validatePhoneInput(phoneInput)) {
            showToast("Please enter a valid 10-digit phone number.", "error");
            return;
          }
          if (!validateEmailInput(emailInput)) {
            showToast("Please enter a valid email address.", "error");
            return;
          }
          if (!validateDobInput(dobInput)) {
            showToast("Date of birth cannot be in the future.", "error");
            return;
          }
          if (!genderInput) {
            showToast("Please select a gender.", "error");
            return;
          }
          if (!stateInput.value) {
            showToast("Please select a state.", "error");
            stateInput.style.borderBottomColor = "red";
            return;
          }
          if (!cityInput.value) {
            showToast("Please select a city.", "error");
            cityInput.style.borderBottomColor = "red";
            return;
          }
          if (!validatePostalCodeInput(postalCodeInput)) {
            showToast("Please enter a valid 6-digit postal code.", "error");
            return;
          }

          let phone = phoneInput.value.trim();
          phone = normalizePhone(phone);
          const signupRequest = {
            firstName: document.getElementById("firstName").value,
            lastName: document.getElementById("lastName").value,
            email: document.getElementById("email").value,
            password: password,
            phone: phone,
            addressLine1: document.getElementById("addressLine1").value,
            addressLine2: document.getElementById("addressLine2").value,
            city: document.getElementById("city").value,
            state: document.getElementById("state").value,
            postalCode: document.getElementById("postalCode").value,
            country: "IN",
            dob: document.getElementById("dob").value,
            gender: genderInput.value,
          };

          try {
            const response = await fetch(
              "http://localhost:8082/api/auth/userRegister",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signupRequest),
              }
            );
            const data = await response.json();
            if (response.ok) {
              showToast("Registration successful! Please login.", "success");
              setTimeout(toggle, 1000);
            } else {
              showToast(data.message || "Registration failed.", "error");
            }
          } catch (error) {
            showToast("An error occurred. Please try again.", "error");
          }
        });