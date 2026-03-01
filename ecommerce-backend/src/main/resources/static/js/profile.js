/**
 * 
 */
const API_BASE_URL = "http://localhost:8082/api";

      function showAlert(message, type) {
        const alert = document.getElementById("alert");
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.display = "block";
        setTimeout(() => (alert.style.display = "none"), 5000);
      }

      async function refreshToken() {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              refreshToken: localStorage.getItem("refreshToken"),
            }),
          });
          const data = await response.json();
          if (response.ok) {
            localStorage.setItem("accessToken", data.accessToken);
            return data.accessToken;
          }
          throw new Error(data.message || "Token refresh failed");
        } catch (error) {
          console.error("Token refresh error:", error.message);
          return null;
        }
      }

      function checkAuth() {
        const accessToken = localStorage.getItem("accessToken");
        const authLink = document.getElementById("authLink");
        const authText = document.getElementById("authText");
        if (accessToken) {
          authText.textContent = "Logout";
          authLink.onclick = () => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userId");
            localStorage.removeItem("cartId");
            localStorage.removeItem("checkoutCartItems");
            window.location.href = "userIndex.html";
          };
        } else {
          authText.textContent = "Login";
          authLink.href = "userIndex.html";
        }
        return !!accessToken;
      }

      async function fetchUserDetails(userId) {
        try {
          const accessToken = localStorage.getItem("accessToken");
          let response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              showAlert("Session expired. Please log in again.", "danger");
              setTimeout(() => (window.location.href = "userIndex.html"), 1000);
              return null;
            }
            response = await fetch(`${API_BASE_URL}/users/${userId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
            });
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message ||
                `Failed to fetch user (Status: ${response.status})`
            );
          }

          return await response.json();
        } catch (error) {
          console.error("Fetch user error:", error.message);
          showAlert("Error fetching profile: " + error.message, "danger");
          return null;
        }
      }

      function populateForm(user) {
        if (!user) return;
        document.getElementById("firstName").value = user.firstName || "";
        document.getElementById("lastName").value = user.lastName || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("phone").value = user.phone || "";
        document.getElementById("addressLine1").value = user.addressLine1 || "";
        document.getElementById("addressLine2").value = user.addressLine2 || "";
        document.getElementById("city").value = user.city || "";
        document.getElementById("state").value = user.state || "";
        document.getElementById("postalCode").value = user.postalCode || "";
        document.getElementById("country").value = user.country || "";
        document.getElementById("dob").value = user.dob
          ? user.dob.split("T")[0]
          : "";
        document.getElementById("gender").value = user.gender || "";
      }

      function validateProfileForm() {
        const email = document.getElementById("email").value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showAlert("Please enter a valid email address.", "danger");
          return false;
        }
        const requiredFields = [
          "firstName",
          "email",
          "addressLine1",
          "city",
          "state",
          "postalCode",
          "country",
        ];
        for (const field of requiredFields) {
          if (!document.getElementById(field).value.trim()) {
            showAlert(`Please fill in the ${field} field.`, "danger");
            return false;
          }
        }
        return true;
      }

      function validatePasswordForm() {
        const currentPassword =
          document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword =
          document.getElementById("confirmPassword").value;

        if (!currentPassword || !newPassword || !confirmPassword) {
          showAlert("Please fill in all password fields.", "danger");
          return false;
        }
        if (newPassword !== confirmPassword) {
          showAlert(
            "New password and confirm password do not match.",
            "danger"
          );
          return false;
        }
        if (newPassword.length < 8) {
          showAlert(
            "New password must be at least 8 characters long.",
            "danger"
          );
          return false;
        }
        return true;
      }

      async function updateProfile(event) {
        event.preventDefault();
        if (!validateProfileForm()) return;

        const userId = localStorage.getItem("userId");
        const accessToken = localStorage.getItem("accessToken");
        const loading = document.getElementById("loading");
        const profileFormCard = document.querySelector(".profile-form-card");
        const saveBtn = document.getElementById("saveProfileBtn");

        if (!accessToken || !userId) {
          showAlert("Please log in to update your profile.", "danger");
          setTimeout(() => (window.location.href = "userIndex.html"), 1000);
          return;
        }

        const updatedUser = {
          firstName: document.getElementById("firstName").value.trim(),
          lastName: document.getElementById("lastName").value.trim() || null,
          email: document.getElementById("email").value.trim(),
          phone: document.getElementById("phone").value.trim() || null,
          addressLine1: document.getElementById("addressLine1").value.trim(),
          addressLine2:
            document.getElementById("addressLine2").value.trim() || null,
          city: document.getElementById("city").value.trim(),
          state: document.getElementById("state").value.trim(),
          postalCode: document.getElementById("postalCode").value.trim(),
          country: document.getElementById("country").value.trim(),
          dob: document.getElementById("dob").value || null,
          gender: document.getElementById("gender").value || null,
        };

        loading.style.display = "block";
        profileFormCard.style.display = "none";
        saveBtn.classList.add("btn-loading");
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
          let response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updatedUser),
          });

          if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              showAlert("Session expired. Please log in again.", "danger");
              setTimeout(() => (window.location.href = "userIndex.html"), 1000);
              return;
            }
            response = await fetch(`${API_BASE_URL}/users/${userId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify(updatedUser),
            });
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message ||
                `Failed to update profile (Status: ${response.status})`
            );
          }

          showAlert("Profile updated successfully!", "success");
          const updatedUserData = await response.json();
          populateForm(updatedUserData);
        } catch (error) {
          console.error("Update profile error:", error.message);
          showAlert("Error updating profile: " + error.message, "danger");
        } finally {
          loading.style.display = "none";
          profileFormCard.style.display = "block";
          saveBtn.classList.remove("btn-loading");
          saveBtn.innerHTML = '<i class="fas fa-save me-1"></i> Save Changes';
        }
      }

      async function changePassword(event) {
        event.preventDefault();
        if (!validatePasswordForm()) return;

        const userId = localStorage.getItem("userId");
        const accessToken = localStorage.getItem("accessToken");
        const loading = document.getElementById("loading");
        const profileFormCard = document.querySelector(".profile-form-card");
        const saveBtn = document.getElementById("savePasswordBtn");

        if (!accessToken || !userId) {
          showAlert("Please log in to change your password.", "danger");
          setTimeout(() => (window.location.href = "userIndex.html"), 1000);
          return;
        }

        const passwordData = {
          currentPassword: document.getElementById("currentPassword").value,
          newPassword: document.getElementById("newPassword").value,
        };

        loading.style.display = "block";
        profileFormCard.style.display = "none";
        saveBtn.classList.add("btn-loading");
        saveBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Changing...';

        try {
          let response = await fetch(
            `${API_BASE_URL}/users/${userId}/password`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(passwordData),
            }
          );

          if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              showAlert("Session expired. Please log in again.", "danger");
              setTimeout(() => (window.location.href = "userIndex.html"), 1000);
              return;
            }
            response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify(passwordData),
            });
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message ||
                `Failed to change password (Status: ${response.status})`
            );
          }

          showAlert("Password changed successfully!", "success");
          document.getElementById("passwordForm").reset();
        } catch (error) {
          console.error("Change password error:", error.message);
          showAlert("Error changing password: " + error.message, "danger");
        } finally {
          loading.style.display = "none";
          profileFormCard.style.display = "block";
          saveBtn.classList.remove("btn-loading");
          saveBtn.innerHTML =
            '<i class="fas fa-lock me-1"></i> Change Password';
        }
      }

      function showSection(sectionId) {
        document.querySelectorAll(".section-content").forEach((section) => {
          section.style.display = section.id === sectionId ? "block" : "none";
        });
        document.querySelectorAll(".sidebar-card").forEach((card) => {
          card.classList.toggle("active", card.dataset.section === sectionId);
        });
      }

      // Function to handle navbar sticky effect
      function setupNavbarSticky() {
        const navbar = document.getElementById("mainNav");
        window.addEventListener("scroll", () => {
          if (window.scrollY > 50) {
            navbar.classList.add("sticky");
          } else {
            navbar.classList.remove("sticky");
          }
        });
      }

      // Function to initialize particle animation
      function initParticleAnimation() {
        const canvas = document.getElementById("particle-canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight * 0.8;
        const particlesArray = [];
        const numberOfParticles = 100;

        class Particle {
          constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
          }
          update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
            if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;
          }
          draw() {
            ctx.fillStyle = `rgba(0, 212, 255, 0.7)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        function init() {
          for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
          }
        }

        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
          }
          requestAnimationFrame(animate);
        }

        init();
        animate();

        window.addEventListener("resize", () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight * 0.8;
        });
      }

      // Function to handle ripple effect
      function createRipple(event) {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement("span");
        const x = event.clientX - rect.left - ripple.offsetWidth / 2;
        const y = event.clientY - rect.top - ripple.offsetHeight / 2;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.add("ripple");
        button.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove());
      }

      // Initialize page
      window.onload = async () => {
        if (!checkAuth()) {
          showAlert("Please log in to view your profile.", "danger");
          setTimeout(() => (window.location.href = "userIndex.html"), 1000);
          return;
        }

        const userId = localStorage.getItem("userId");
        const loading = document.getElementById("loading");
        const profileFormCard = document.querySelector(".profile-form-card");

        loading.style.display = "block";
        profileFormCard.style.display = "none";

        try {
          const user = await fetchUserDetails(userId);
          if (user) {
            populateForm(user);
            document
              .getElementById("profileForm")
              .addEventListener("submit", updateProfile);
            document
              .getElementById("passwordForm")
              .addEventListener("submit", changePassword);
          } else {
            showAlert("Unable to load profile.", "danger");
          }
        } catch (error) {
          console.error("Initialization error:", error.message);
          showAlert("Error loading profile: " + error.message, "danger");
        } finally {
          loading.style.display = "none";
          profileFormCard.style.display = "block";
        }

        setupNavbarSticky();
        initParticleAnimation();

        // Animate footer on scroll
        const footer = document.getElementById("footer");
        const footerObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              footer.classList.add("animate-footer");
            }
          });
        }, { threshold: 0.2 });
        footerObserver.observe(footer);

        // Animate spinner on scroll
        const spinner = document.querySelector(".spinner");
        const spinnerObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const spinnerElement = entry.target.querySelector(".animate-spinner");
              if (spinnerElement) {
                spinnerElement.classList.add("animate-spinner");
              }
            }
          });
        }, { threshold: 0.2 });
        if (spinner) spinnerObserver.observe(spinner);

        // Add ripple effect to buttons
        const rippleButtons = document.querySelectorAll(".ripple-btn");
        rippleButtons.forEach(button => {
          button.addEventListener("click", createRipple);
        });
      };