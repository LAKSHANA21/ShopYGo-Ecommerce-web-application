const API_BASE_URL = "http://localhost:8082/api";
      const productCache = {};
      let variantsCache = null;

      function showAlert(message, type) {
        const alert = document.getElementById("ordersAlert");
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

      function toggleLoading(show) {
        const spinner = document.querySelector(".loading-spinner");
        const table = document.querySelector(".table-responsive");
        spinner.style.display = show ? "block" : "none";
        table.style.opacity = show ? "0.5" : "1";
      }

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

      function logout() {
        if (confirm("Are you sure you want to logout?")) {
          localStorage.clear();
          window.location.href = "/seller/login";
        }
      }

      async function checkAuth() {
        const token = localStorage.getItem("accessToken");
        const sellerId = localStorage.getItem("sellerId");
        if (!token || !sellerId) {
          showAlert("Please login first.", "danger");
          setTimeout(() => (window.location.href = "seller/login"), 1000);
          return false;
        }
        return true;
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

      async function fetchProductDetails(productId) {
        if (productCache[productId]) return productCache[productId];
        try {
          const token = localStorage.getItem("accessToken");
          const response = await fetch(
            `${API_BASE_URL}/products/${productId}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!response.ok) {
            console.error(
              `Product ${productId} not found (Status: ${response.status})`
            );
            return null;
          }
          const product = await response.json();
          productCache[productId] = product;
          return product;
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error.message);
          return null;
        }
      }

      async function fetchVariants() {
        if (variantsCache) {
          return variantsCache;
        }
        try {
          const response = await fetch(`${API_BASE_URL}/public/variants`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (!response.ok) {
            console.warn("Failed to fetch variants");
            variantsCache = [];
            return variantsCache;
          }
          variantsCache = await response.json();
          return variantsCache;
        } catch (error) {
          console.error("Error fetching variants:", error.message);
          variantsCache = [];
          return variantsCache;
        }
      }

      async function fetchVariantValue(variantId, valueId) {
        if (!variantId || !valueId) return "N/A";
        try {
          const variants = variantsCache || (await fetchVariants());
          const variant = variants.find((v) => v.id === variantId);
          if (!variant) {
            console.error(`Variant ${variantId} not found`);
            return "N/A";
          }
          const value = variant.values.find((v) => v.id === valueId);
          if (!value) {
            console.error(
              `Value ${valueId} not found for variant ${variantId}`
            );
            return "N/A";
          }
          return `${variant.variantType}: ${value.value}`;
        } catch (error) {
          console.error("Error fetching variant value:", error.message);
          return "N/A";
        }
      }

      async function fetchOrders(status = "") {
        if (!(await checkAuth())) return;
        const token = localStorage.getItem("accessToken");
        const sellerId = localStorage.getItem("sellerId");
        toggleLoading(true);
        try {
          const url = status
            ? `${API_BASE_URL}/order/seller/${sellerId}/status?status=${status}`
            : `${API_BASE_URL}/order/seller/${sellerId}`;
          let response = await fetch(url, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              showAlert("Session expired. Please login again.", "danger");
              setTimeout(
                () => (window.location.href = "/seller/login"),
                1000
              );
              return;
            }
            response = await fetch(url, {
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
                `Failed to fetch orders (Status: ${response.status})`
            );
          }

          const orders = await response.json();
          await fetchVariants();
          await displayOrders(orders);
        } catch (error) {
          console.error("Fetch orders error:", error.message);
          showAlert("Failed to load orders: " + error.message, "danger");
        } finally {
          toggleLoading(false);
        }
      }

      async function updateOrderStatus(orderId, status, button) {
        if (!(await checkAuth())) return;
        if (
          !status ||
          !["NEW", "PROCESSING", "SHIPPED", "DELIVERED"].includes(status)
        ) {
          showAlert("Invalid order status selected.", "danger");
          return;
        }
        const token = localStorage.getItem("accessToken");
        button.classList.add("disabled");
        button.textContent = "Updating...";
        try {
          let response = await fetch(
            `${API_BASE_URL}/order/${orderId}/status?status=${status}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              showAlert("Session expired. Please login again.", "danger");
              setTimeout(
                () => (window.location.href = "/seller/login"),
                1000
              );
              return;
            }
            response = await fetch(
              `${API_BASE_URL}/order/${orderId}/status?status=${status}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${newToken}`,
                },
              }
            );
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message ||
                `Failed to update order status (Status: ${response.status})`
            );
          }

          showAlert("Order status updated successfully!", "success");
          const statusFilter = document.getElementById("statusFilter").value;
          await fetchOrders(statusFilter);
        } catch (error) {
          console.error("Update order status error:", error.message);
          showAlert(
            "Failed to update order status: " + error.message,
            "danger"
          );
        } finally {
          button.classList.remove("disabled");
          button.textContent = "Update Status";
        }
      }

      async function displayOrders(orders) {
        const ordersTable = document.getElementById("ordersTable");
        ordersTable.innerHTML = "";

        if (!Array.isArray(orders) || orders.length === 0) {
          ordersTable.innerHTML =
            '<tr><td colspan="7" class="text-center">No orders found.</td></tr>';
          showAlert("No orders found.", "info");
          return;
        }

        for (const order of orders) {
          let productDisplay = "";
          if (order.productId) {
            const product = await fetchProductDetails(order.productId);
            if (product) {
              let variantsDisplay = "N/A";
              if (order.variantId && order.variantValueId) {
                variantsDisplay = await fetchVariantValue(
                  order.variantId,
                  order.variantValueId
                );
              }
              productDisplay = `
                <div class="d-flex align-items-center">
                  <img src="${
                    product.thumbnailUrl || "https://via.placeholder.com/50"
                  }" class="product-img" alt="${product.name || "Product"}">
                  <div>
                    ${product.name} (Qty: ${
                order.quantity
              }, Variants: ${variantsDisplay})
                  </div>
                </div>`;
            } else {
              productDisplay = `Product ID: ${order.productId} (Not Found)`;
            }
          } else {
            productDisplay = "No product";
          }

          const customerName = order.userId
            ? `User ID: ${order.userId}` // Placeholder; actual user details require user endpoint
            : "N/A";
          const canUpdateStatus = ["NEW", "PROCESSING", "SHIPPED"].includes(
            order.orderStatus
          );
          const row = `
            <tr>
              <td>${order.id}</td>
              <td>${customerName}</td>
              <td>${productDisplay}</td>
              <td>₹${(order.totalAmount || 0).toFixed(2)}</td>
              <td>${order.orderStatus || "N/A"}</td>
              <td>${new Date(order.createdAt).toLocaleDateString()}</td>
              <td>
                ${
                  canUpdateStatus
                    ? `<button class="btn btn-warning btn-sm update-status-btn" data-order-id="${order.id}" data-current-status="${order.orderStatus}">Update Status</button>`
                    : ""
                }
              </td>
            </tr>`;
          ordersTable.innerHTML += row;
        }

        document.querySelectorAll(".update-status-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const orderId = btn.dataset.orderId;
            const currentStatus = btn.dataset.currentStatus;
            openStatusModal(orderId, currentStatus);
          });
        });
      }

      function openStatusModal(orderId, currentStatus) {
        document.getElementById("orderId").value = orderId;
        document.getElementById("orderStatus").value = currentStatus;
        new bootstrap.Modal(
          document.getElementById("updateStatusModal")
        ).show();
      }

      document
        .getElementById("statusForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const form = document.getElementById("statusForm");
          const orderId = document.getElementById("orderId").value;
          const status = document.getElementById("orderStatus").value;
          const button = document.querySelector(
            "#statusForm button[type='submit']"
          );

          if (!form.checkValidity() || !status) {
            form.classList.add("was-validated");
            showAlert("Please select a valid status.", "danger");
            return;
          }

          await updateOrderStatus(orderId, status, button);
          bootstrap.Modal.getInstance(
            document.getElementById("updateStatusModal")
          ).hide();
        });

      document
        .getElementById("statusFilter")
        .addEventListener("change", (e) => {
          const status = e.target.value;
          fetchOrders(status);
        });

      window.onload = async () => {
        loadTheme();
        if (await checkAuth()) {
          const urlParams = new URLSearchParams(window.location.search);
          const status = urlParams.get("status")?.toUpperCase() || "";
          if (status) {
            document.getElementById("statusFilter").value = status;
          }
          await fetchOrders(status);
        }
      };