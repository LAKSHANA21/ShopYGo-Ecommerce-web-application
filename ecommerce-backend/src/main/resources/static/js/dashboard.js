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
        const alert = document.getElementById("dashboardAlert");
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

      // Update Inventory
      async function updateInventory(productId, quantity) {
        const token = localStorage.getItem("accessToken");
        try {
          let response = await fetch(
            `${API_BASE_URL}/products/${productId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ quantity: parseInt(quantity) }),
            }
          );

          if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              showAlert("Session expired. Please login again.", "danger");
              setTimeout(() => (window.location.href = "/seller/login"), 1000);
              return;
            }
            response = await fetch(
              `${API_BASE_URL}/products/${productId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${newToken}`,
                },
                body: JSON.stringify({ quantity: parseInt(quantity) }),
              }
            );
          }

          if (!response.ok) throw new Error("Failed to update inventory");
          showAlert("Inventory updated successfully", "success");
          fetchSellerData();
        } catch (error) {
          showAlert(`Error: ${error.message}`, "danger");
        }
      }

      // Toggle Product Status
      async function toggleProductStatus(productId, currentStatus) {
        const token = localStorage.getItem("accessToken");
        const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        try {
          let response = await fetch(
            `${API_BASE_URL}/products/${productId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: newStatus }),
            }
          );

          if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              showAlert("Session expired. Please login again.", "danger");
              setTimeout(() => (window.location.href = "/seller/login"), 1000);
              return;
            }
            response = await fetch(
              `${API_BASE_URL}/products/${productId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${newToken}`,
                },
                body: JSON.stringify({ status: newStatus }),
              }
            );
          }

          if (!response.ok) throw new Error("Failed to update product status");
          showAlert(
            `Product ${newStatus.toLowerCase()} successfully`,
            "success"
          );
          fetchSellerData();
        } catch (error) {
          showAlert(`Error: ${error.message}`, "danger");
        }
      }

      // Submit Product
      async function submitProduct() {
        const token = localStorage.getItem("accessToken");
        const product = {
          name: document.getElementById("productName").value.trim(),
          categoryId: parseInt(document.getElementById("categoryId").value),
          subcategoryId: parseInt(
            document.getElementById("subcategoryId").value
          ),
          actualPrice: parseFloat(document.getElementById("actualPrice").value),
          quantity: parseInt(document.getElementById("quantity").value),
        };

        const inputs = document.querySelectorAll("#addProductForm input");
        let isValid = true;
        inputs.forEach((input) => {
          if (!input.value.trim()) {
            input.classList.add("is-invalid");
            isValid = false;
          } else {
            input.classList.remove("is-invalid");
          }
        });

        if (!isValid) {
          showAlert("Please fill in all required fields.", "danger");
          return;
        }

        try {
          let response = await fetch(`${API_BASE_URL}/products`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(product),
          });

          if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              showAlert("Session expired. Please login again.", "danger");
              setTimeout(() => (window.location.href = "/seller/login"), 1000);
              return;
            }
            response = await fetch(`${API_BASE_URL}/products`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify(product),
            });
          }

          if (!response.ok) throw new Error("Failed to add product");
          showAlert("Product added successfully", "success");
          document.getElementById("addProductForm").reset();
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("addProductModal")
          );
          modal.hide();
          fetchSellerData();
        } catch (error) {
          showAlert(`Error: ${error.message}`, "danger");
        }
      }

      // Fetch Seller Data
      async function fetchSellerData() {
        const token = localStorage.getItem("accessToken");
        const sellerId = localStorage.getItem("sellerId");
        if (!token || !sellerId) {
          showAlert("Please login first.", "danger");
          setTimeout(() => (window.location.href = "/seller/login"), 1000);
          return;
        }

        toggleLoading(true);
        try {
          // Fetch seller details
          let sellerResponse = await fetch(
            `${API_BASE_URL}/sellers/${sellerId}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (sellerResponse.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              throw new Error("Session expired. Please login again.");
            }
            sellerResponse = await fetch(
              `${API_BASE_URL}/sellers/${sellerId}`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${newToken}`,
                },
              }
            );
          }

          if (!sellerResponse.ok) {
            throw new Error("Failed to fetch seller data");
          }
          const seller = await sellerResponse.json();
          document.getElementById(
            "sellerName"
          ).textContent = `${seller.firstName} ${seller.lastName}`;
          document.getElementById("storeName").textContent =
            seller.storeName || "N/A";
          document.getElementById("sellerEmail").textContent =
            seller.email || "N/A";
          document.getElementById("sellerPhone").textContent =
            seller.phone || "N/A";

          // Profile completion check
          if (!seller.storeName || !seller.phone || !seller.businessDetails) {
            document.getElementById("profileIncompleteAlert").style.display =
              "block";
          }

          // Fetch products
          let productsResponse = await fetch(
            `${API_BASE_URL}/sellers/${sellerId}/products`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (productsResponse.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              throw new Error("Session expired. Please login again.");
            }
            productsResponse = await fetch(
              `${API_BASE_URL}/sellers/${sellerId}/products`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${newToken}`,
                },
              }
            );
          }

          if (!productsResponse.ok) throw new Error("Failed to fetch products");
          const products = await productsResponse.json();
          document.getElementById("totalProducts").textContent =
            products.length;

          // Low stock products
          const lowStockProducts = products.filter(
            (p) =>
              p.inventory?.quantity < (p.inventory?.lowStockThreshold || 10)
          );
          document.getElementById("lowStock").textContent =
            lowStockProducts.length;
          const lowStockTable = document.getElementById("lowStockTable");
          lowStockTable.innerHTML = "";
          lowStockProducts.forEach((p) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${p.id}</td>
              <td>${p.name}</td>
              <td>${p.inventory?.quantity || 0}</td>
              <td>${p.inventory?.lowStockThreshold || 10}</td>
              <td>
                <button class="btn btn-sm ${
                  p.status === "ACTIVE" ? "btn-success" : "btn-danger"
                }" onclick="toggleProductStatus(${p.id}, '${p.status}')">
                  ${p.status === "ACTIVE" ? "Active" : "Inactive"}
                </button>
              </td>
              <td>
                <input type="number" min="0" class="form-control d-inline w-auto" value="${
                  p.inventory?.quantity || 0
                }" id="stock-${p.id}" />
                <button class="btn btn-primary btn-sm mt-1" onclick="updateInventory(${
                  p.id
                }, document.getElementById('stock-${p.id}').value)">
                  Update
                </button>
              </td>
            `;
            lowStockTable.appendChild(row);
          });

          // Fetch orders
          let orders = [];
          try {
            let ordersResponse = await fetch(
              `${API_BASE_URL}/order/seller/${sellerId}`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (ordersResponse.status === 403) {
              const newToken = await refreshToken();
              if (!newToken) {
                throw new Error("Session expired. Please login again.");
              }
              ordersResponse = await fetch(
                `${API_BASE_URL}/order/seller/${sellerId}`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${newToken}`,
                  },
                }
              );
            }

            if (ordersResponse.ok) {
              orders = await ordersResponse.json();
              document.getElementById("totalOrders").textContent =
                orders.length;
              const newOrders = orders.filter(
                (o) => o.orderStatus === "NEW"
              );
              document.getElementById("pendingOrders").textContent =
                newOrders.length;
              document.getElementById("pendingOrdersMetric").textContent =
                newOrders.length;
            } else {
              document.getElementById("totalOrders").textContent = "0";
              document.getElementById("pendingOrders").textContent = "0";
              document.getElementById("pendingOrdersMetric").textContent = "0";
            }
          } catch (error) {
            console.warn("Orders fetch failed:", error);
            document.getElementById("totalOrders").textContent = "0";
            document.getElementById("pendingOrders").textContent = "0";
            document.getElementById("pendingOrdersMetric").textContent = "0";
          }

          // Recent orders table
          const recentOrders = orders.slice(0, 5);
          const recentOrdersTable =
            document.getElementById("recentOrdersTable");
          recentOrdersTable.innerHTML = "";
          recentOrders.forEach((order) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${order.id}</td>
              <td>User ID: ${order.userId || "N/A"}</td>
              <td>${order.orderStatus}</td>
              <td>₹${(order.totalAmount || 0).toFixed(2)}</td>
              <td>${new Date(order.createdAt).toLocaleDateString()}</td>
              <td>
                <a href="/seller/sellerorders" class="btn btn-sm btn-primary">View</a>
              </td>
            `;
            recentOrdersTable.appendChild(row);
          });

          // Sales chart (mock data)
          const salesData = Array(30)
            .fill(0)
            .map((_, i) => ({
              date: new Date(
                Date.now() - (29 - i) * 24 * 60 * 60 * 1000
              ).toLocaleDateString(),
              sales: Math.floor(Math.random() * 1000),
            }));
          const ctx = document.getElementById("salesChart").getContext("2d");
          new Chart(ctx, {
            type: "line",
            data: {
              labels: salesData.map((d) => d.date),
              datasets: [
                {
                  label: "Sales (₹)",
                  data: salesData.map((d) => d.sales),
                  borderColor: "var(--primary-color)",
                  backgroundColor: "rgba(106, 90, 205, 0.2)",
                  fill: true,
                },
              ],
            },
            options: {
              responsive: true,
              scales: {
                x: { display: false },
                y: { beginAtZero: true },
              },
            },
          });
        } catch (error) {
          console.error("Error:", error);
          showAlert(`An error occurred: ${error.message}`, "danger");
          if (error.message.includes("Session expired")) {
            setTimeout(() => (window.location.href = "/seller/login"), 1000);
          }
        } finally {
          toggleLoading(false);
        }
      }

      // Set Active Navigation
      function setActiveNav() {
        const navLinks = document.querySelectorAll(".nav-link");
        navLinks.forEach((link) => {
          if (link.href.includes("/seller/sellerdashboard")) {
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