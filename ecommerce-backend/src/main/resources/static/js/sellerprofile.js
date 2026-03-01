const API_BASE_URL = "http://localhost:8082/api";

      // Theme Toggle
      function toggleTheme() {
        const body = document.body;
        const themeIcon = document.querySelector("#themeToggle i");
        const currentTheme = body.getAttribute("data-theme") || "dark";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        body.setAttribute("data-theme", newTheme);
        themeIcon.classList.replace(
          newTheme === "dark" ? "fa-sun" : "fa-moon",
          newTheme === "dark" ? "fa-moon" : "fa-sun"
        );
        localStorage.setItem("darkMode", newTheme === "dark");
      }

      function loadTheme() {
        const darkMode = localStorage.getItem("darkMode") === "true";
        document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
        const themeIcon = document.querySelector("#themeToggle i");
        themeIcon.classList.replace(
          darkMode ? "fa-sun" : "fa-moon",
          darkMode ? "fa-moon" : "fa-sun"
        );
      }

      document
        .getElementById("themeToggle")
        .addEventListener("click", toggleTheme);

      // Show Alert
      function showAlert(message, type) {
        const alert = document.getElementById("profileAlert");
        const icon =
          type === "success"
            ? '<i class="fas fa-check-circle"></i>'
            : '<i class="fas fa-exclamation-triangle"></i>';
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `${icon} ${message}`;
        alert.style.display = "block";
        alert.style.animation = "fadeIn 0.8s ease";
        setTimeout(() => (alert.style.display = "none"), 5000);
      }

      // Toggle Loading
      function toggleLoading(show) {
        const spinner = document.querySelector(".loading-spinner");
        const content = document.querySelector(".card-body");
        spinner.style.display = show ? "block" : "none";
        content.style.opacity = show ? "0.5" : "1";
      }

      // Logout
      function logout() {
        if (confirm("Are you sure you want to logout?")) {
          localStorage.clear();
          window.location.href = "/seller/login";
        }
      }

      // Refresh Token
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

      function showEditForm() {
        document.getElementById("viewProfileSection").style.display = "none";
        document.getElementById("editProfileSection").style.display = "block";
      }

      function cancelEdit() {
        document.getElementById("editProfileSection").style.display = "none";
        document.getElementById("viewProfileSection").style.display = "block";
        document.getElementById("profileForm").reset();
        fetchSellerData();
      }

      function normalizePhone(phone) {
        if (!phone) return null;
        let cleaned = phone.trim().replace(/[^0-9]/g, "");
        if (cleaned.length !== 10) return null;
        return "+91" + cleaned;
      }

      async function fetchSellerData() {
        const token = localStorage.getItem("accessToken");
        const sellerId = localStorage.getItem("sellerId");
        const storedPhone = localStorage.getItem("sellerPhone");
        if (!token || !sellerId) {
          showAlert("Please login first.", "danger");
          setTimeout(() => (window.location.href = "sellerIndex.html"), 1000);
          return;
        }

        toggleLoading(true);
        try {
          let response = await fetch(`${API_BASE_URL}/sellers/${sellerId}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              throw new Error("Session expired. Please login again.");
            }
            response = await fetch(`${API_BASE_URL}/sellers/${sellerId}`, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
            });
          }

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch seller data");
          }
          const seller = await response.json();
          console.log("Seller data:", seller);
          // Update view section
          document.getElementById("viewFirstName").textContent =
            seller.firstName || "N/A";
          document.getElementById("viewLastName").textContent =
            seller.lastName || "";
          document.getElementById("viewStoreName").textContent =
            seller.storeName || "N/A";
          document.getElementById("viewEmail").textContent =
            seller.email || "N/A";
          document.getElementById("viewPhone").textContent =
            seller.phone || storedPhone || "N/A";
          document.getElementById("viewAddressLine1").textContent =
            seller.addressLine1 || "";
          document.getElementById("viewAddressLine2").textContent =
            seller.addressLine2 || "";
          document.getElementById("viewCity").textContent = seller.city || "";
          document.getElementById("viewState").textContent =
            seller.state || "";
          document.getElementById("viewPostalCode").textContent =
            seller.postalCode || "";
          document.getElementById("viewCountry").textContent =
            seller.country || "";
          document.getElementById("viewGstNumber").textContent =
            seller.gstNumber || "N/A";
          document.getElementById("viewBankDetails").textContent =
            seller.bankDetails || "N/A";
          document.getElementById("viewBusinessDetails").textContent =
            seller.businessDetails || "N/A";
          // Populate edit form
          document.getElementById("firstName").value = seller.firstName || "";
          document.getElementById("lastName").value = seller.lastName || "";
          document.getElementById("storeName").value = seller.storeName || "";
          document.getElementById("email").value = seller.email || "";
          document.getElementById("phone").value =
            (seller.phone || storedPhone || "").replace(/^\+91/, "") || "";
          document.getElementById("businessDetails").value =
            seller.businessDetails || "";
          document.getElementById("addressLine1").value =
            seller.addressLine1 || "";
          document.getElementById("addressLine2").value =
            seller.addressLine2 || "";
          document.getElementById("city").value = seller.city || "";
          document.getElementById("state").value = seller.state || "";
          document.getElementById("postalCode").value = seller.postalCode || "";
          document.getElementById("country").value = seller.country || "";
          document.getElementById("gstNumber").value = seller.gstNumber || "";
          document.getElementById("bankDetails").value =
            seller.bankDetails || "";
        } catch (error) {
          console.error("Fetch error:", error);
          showAlert(`Error fetching profile: ${error.message}`, "danger");
          if (error.message.includes("Session expired")) {
            setTimeout(() => (window.location.href = "sellerIndex.html"), 1000);
          }
        } finally {
          toggleLoading(false);
        }
      }

      document
        .getElementById("profileForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const token = localStorage.getItem("accessToken");
          const sellerId = localStorage.getItem("sellerId");
          if (!token || !sellerId) {
            showAlert("Please login first.", "danger");
            setTimeout(() => (window.location.href = "sellerIndex.html"), 1000);
            return;
          }

          const firstName = document.getElementById("firstName");
          const lastName = document.getElementById("lastName");
          const storeName = document.getElementById("storeName");
          const email = document.getElementById("email");
          const phoneInput = document.getElementById("phone");

          let isValid = true;
          if (!firstName.value.trim()) {
            firstName.classList.add("is-invalid");
            isValid = false;
          } else {
            firstName.classList.remove("is-invalid");
          }
          if (!lastName.value.trim()) {
            lastName.classList.add("is-invalid");
            isValid = false;
          } else {
            lastName.classList.remove("is-invalid");
          }
          if (!storeName.value.trim()) {
            storeName.classList.add("is-invalid");
            isValid = false;
          } else {
            storeName.classList.remove("is-invalid");
          }
          if (!email.value.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
            email.classList.add("is-invalid");
            isValid = false;
          } else {
            email.classList.remove("is-invalid");
          }
          const phone = phoneInput.value.trim();
          if (!phone.match(/^[0-9]{10}$/)) {
            phoneInput.classList.add("is-invalid");
            isValid = false;
          } else {
            phoneInput.classList.remove("is-invalid");
          }

          if (!isValid) {
            showAlert("Please fill all required fields correctly.", "danger");
            return;
          }

          if (!confirm("Are you sure you want to update your profile?")) return;

          const normalizedPhone = normalizePhone(phone);
          if (!normalizedPhone) {
            phoneInput.classList.add("is-invalid");
            showAlert("Invalid phone number format.", "danger");
            return;
          }

          const seller = {
            firstName: firstName.value.trim(),
            lastName: lastName.value.trim(),
            storeName: storeName.value.trim(),
            email: email.value.trim(),
            phone: normalizedPhone,
            businessDetails:
              document.getElementById("businessDetails").value.trim() || null,
            addressLine1:
              document.getElementById("addressLine1").value.trim() || null,
            addressLine2:
              document.getElementById("addressLine2").value.trim() || null,
            city: document.getElementById("city").value.trim() || null,
            state: document.getElementById("state").value.trim() || null,
            postalCode:
              document.getElementById("postalCode").value.trim() || null,
            country: document.getElementById("country").value.trim() || null,
            gstNumber: document.getElementById("gstNumber").value.trim() || null,
            bankDetails:
              document.getElementById("bankDetails").value.trim() || null,
          };

          toggleLoading(true);
          try {
            let response = await fetch(
              `${API_BASE_URL}/sellers/${sellerId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(seller),
              }
            );

            if (response.status === 403) {
              const newToken = await refreshToken();
              if (!newToken) {
                showAlert("Session expired. Please login again.", "danger");
                setTimeout(
                  () => (window.location.href = "sellerIndex.html"),
                  1000
                );
                return;
              }
              response = await fetch(
                `${API_BASE_URL}/sellers/${sellerId}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${newToken}`,
                  },
                  body: JSON.stringify(seller),
                }
              );
            }

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Failed to update profile");
            }

            localStorage.setItem("sellerPhone", normalizedPhone);
            showAlert("Profile updated successfully!", "success");
            document.getElementById("editProfileSection").style.display = "none";
            document.getElementById("viewProfileSection").style.display = "block";
            await fetchSellerData();
          } catch (error) {
            console.error("Update error:", error);
            showAlert(`Error updating profile: ${error.message}`, "danger");
            if (error.message.includes("Session expired")) {
              setTimeout(
                () => (window.location.href = "sellerIndex.html"),
                1000
              );
            }
          } finally {
            toggleLoading(false);
          }
        });

      // Set Active Navigation
      function setActiveNav() {
        const navLinks = document.querySelectorAll(".nav-link");
        navLinks.forEach((link) => {
          if (link.href.includes("sellerprofile.html")) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
      }

      // Initialize
      window.onload = () => {
        loadTheme();
        setActiveNav();
        fetchSellerData();
      };