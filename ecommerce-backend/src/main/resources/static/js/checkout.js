/**
 * 
 */
const API_BASE_URL = "http://localhost:8082/api";
      let variantsCache = null; // Cache for variants
      let productsCache = {}; // Cache products by productId

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

          let data;
          try {
            data = await response.json();
          } catch (e) {
            console.error("No JSON response body");
            data = {};
          }

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
            try {
              data = await response.json();
            } catch (e) {
              console.error("No JSON response body after token refresh");
              data = {};
            }
          }

          return response.ok ? data : null;
        } catch (error) {
          console.error("Fetch user error:", error.message);
          showAlert("Error fetching user details: " + error.message, "danger");
          return null;
        }
      }

      async function fetchProduct(productId) {
        if (productsCache[productId]) {
          return productsCache[productId];
        }
        try {
          const response = await fetch(
            `${API_BASE_URL}/products/${productId}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );
          if (!response.ok) {
            console.error(
              `Product ${productId} not found (Status: ${response.status})`
            );
            return null;
          }
          const product = await response.json();
          productsCache[productId] = product;
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
            console.log("variantcache",variantsCache);
          return variantsCache;
        } catch (error) {
          console.error("Error fetching variants:", error.message);
          variantsCache = [];
          return variantsCache;
        }
      }

      async function fetchVariantValue(variantId, valueId) {
        try {
          if (!variantId || !valueId) return "None";
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

      function displayShippingDetails(user) {
        const shippingInfo = document.getElementById("shippingInfo");
        if (!user) {
          shippingInfo.textContent = "Unable to load shipping details.";
          return false;
        }
        const address = [
          user.addressLine1,
          user.addressLine2,
          user.city,
          user.state,
          user.postalCode,
          user.country,
        ]
          .filter(Boolean)
          .join(", ");
        shippingInfo.innerHTML = `
          <strong>Name:</strong> ${user.firstName} ${user.lastName || ""}<br>
          <strong>Email:</strong> ${user.email}<br>
          <strong>Phone:</strong> ${user.phone || "N/A"}<br>
          <strong>Address:</strong> ${address || "No address provided"}
        `;
        return (
          user.addressLine1 && user.city && user.postalCode && user.country
        );
      }

      async function displayOrderItems() {
        const tbody = document.getElementById("orderItems");
        const orderTotal = document.getElementById("orderTotal");
        const confirmBtn = document.getElementById("confirmOrderBtn");
        const cartItems =
          JSON.parse(localStorage.getItem("checkoutCartItems")) || [];
        tbody.innerHTML = "";

        if (cartItems.length === 0) {
          tbody.innerHTML =
            '<tr><td colspan="5" class="text-center">No items to order.</td></tr>';
          confirmBtn.disabled = true;
          orderTotal.textContent = "Total: ₹0";
          showAlert(
            "No items to order. Please add items to your cart.",
            "danger"
          );
          setTimeout(() => (window.location.href = "cart.html"), 1000);
          return;
        }

        let total = 0;
        let allItemsValid = true;

        await fetchVariants(); // Fetch variants before processing items

        for (const item of cartItems) {
          const product = await fetchProduct(item.productId);
          if (!product) {
            showAlert(`Product ID ${item.productId} not found.`, "danger");
            allItemsValid = false;
            tbody.innerHTML += `
              <tr>
                <td colspan="5">Product ID: ${item.productId} (Not Found)</td>
              </tr>
            `;
            continue;
          }

          const stockQuantity = product.inventory?.quantity ?? Infinity;
          if (stockQuantity < item.quantity) {
            showAlert(
              `Insufficient stock for ${product.name}. Only ${stockQuantity} available.`,
              "warning"
            );
            allItemsValid = false;
            continue;
          }

          const variantDetail =
            item.selectedVariants[0].variantId && item.selectedVariants[0].variantValueId
              ? await fetchVariantValue(item.selectedVariants[0].variantId, item.selectedVariants[0].variantValueId)
              : "None";
          const itemPrice = product.sellingPrice || 0;
          const subtotal = itemPrice * item.quantity;
          total += subtotal;

          const row = `
            <tr>
              <td>
                <div class="d-flex align-items-center">
                  <img src="${
                    product.thumbnailUrl || "https://via.placeholder.com/80"
                  }" class="product-img me-3" alt="${
            product.name || "Product"
          }">
                  <div>
                    <strong>${product.name}</strong>
                    <br>
                    <small>SKU: ${product.sku || "N/A"}</small>
                  </div>
                </div>
              </td>
              <td>${variantDetail}</td>
              <td>${item.quantity}</td>
              <td>₹${itemPrice.toFixed(2)}</td>
              <td>₹${subtotal.toFixed(2)}</td>
            </tr>
          `;
          tbody.innerHTML += row;
        }

        orderTotal.textContent = `Total: ₹${total.toFixed(2)}`;
        confirmBtn.disabled = !allItemsValid;
      }

      async function confirmOrder() {
        const accessToken = localStorage.getItem("accessToken");
        const cartId = localStorage.getItem("cartId");
        const userId = localStorage.getItem("userId");
        const paymentMode = document.getElementById("paymentMode").value;
        const loading = document.getElementById("loading");
        const orderTable = document.querySelector(".order-table");
        const confirmBtn = document.getElementById("confirmOrderBtn");
        const cartItems =
          JSON.parse(localStorage.getItem("checkoutCartItems")) || [];

        if (!accessToken || !cartId || !userId) {
          showAlert("Please log in to place order.", "danger");
          setTimeout(() => (window.location.href = "userIndex.html"), 1000);
          return;
        }

        if (cartItems.length === 0) {
          showAlert("No items to order.", "danger");
          return;
        }

        const user = await fetchUserDetails(userId);
        if (
          !user ||
          !user.addressLine1 ||
          !user.city ||
          !user.postalCode ||
          !user.country
        ) {
          showAlert(
            "Please complete your shipping address in your profile.",
            "danger"
          );
          return;
        }

        loading.style.display = "block";
        orderTable.style.display = "none";
        confirmBtn.classList.add("btn-loading");
        confirmBtn.textContent = "Processing...";

        try {
          for (const item of cartItems) {
            const product = await fetchProduct(item.productId);
            if (!product) {
              showAlert(`Product ID ${item.productId} not found.`, "danger");
              continue;
            }

            if (
              !product.inventory ||
              product.inventory.quantity < item.quantity
            ) {
              showAlert(`Insufficient stock for ${product.name}.`, "danger");
              return;
            }

            const orderData = {
              cartId: item.cartId,
              userId: parseInt(userId),
              shippingAddress:user.addressLine1,
              sellerId: product.sellerId || 1,
              productId: item.productId,
              quantity: item.quantity,
              itemPrice: product.sellingPrice,
              totalAmount: (product.sellingPrice * item.quantity).toFixed(2),
              paymentMode: paymentMode,
              orderStatus: "NEW",
              shippingStatus: "PENDING",
              transactionStatus: "SUCCESS",
              variantId: item.selectedVariants[0].variantId || null,
              variantValueId: item.selectedVariants[0].variantValueId || null
            };
            console.log("data",item);
            let response = await fetch(`${API_BASE_URL}/orders`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(orderData),
            });

            let data;
            try {
              data = await response.json();console.log("da",data);
            } catch (e) {
              console.error("No JSON response body");
              data = {};
            }

            if (response.status === 403) {
              const newToken = await refreshToken();
              if (!newToken) {
                showAlert("Session expired. Please log in again.", "danger");
                setTimeout(
                  () => (window.location.href = "userIndex.html"),
                  1000
                );
                return;
              }
              response = await fetch(`${API_BASE_URL}/orders`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${newToken}`,
                },
                body: JSON.stringify(orderData),
              });
              try {
                data = await response.json();
                
              } catch (e) {
                console.error("No JSON response body after token refresh");
                data = {};
              }
            }

            if (response.ok) {
              const deleteResponse = await fetch(
                `${API_BASE_URL}/cart/${cartId}/items/${item.id}`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              );
              if (!deleteResponse.ok) {
                console.error(`Failed to delete cart item ${item.id}`);
              }
            } else {
              showAlert(
                `Failed to place order for item ${item.id}: ${
                  data.message || "Unknown error"
                }`,
                "danger"
              );
              return;
            }
          }

          localStorage.removeItem("checkoutCartItems");
          showAlert("Order placed successfully!", "success");
          setTimeout(() => (window.location.href = "products.html"), 1000);
        } catch (error) {
          console.error("Order placement error:", error.message);
          showAlert("Error placing order: " + error.message, "danger");
        } finally {
          loading.style.display = "none";
          orderTable.style.display = "block";
          confirmBtn.classList.remove("btn-loading");
          confirmBtn.textContent = "Confirm Order";
        }
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
          showAlert("Please log in to confirm your order.", "danger");
          setTimeout(() => (window.location.href = "userIndex.html"), 1000);
          return;
        }

        const userId = localStorage.getItem("userId");
        const loading = document.getElementById("loading");
        const orderTable = document.querySelector(".order-table");
        const shippingDetails = document.querySelector(".shipping-details");

        loading.style.display = "block";
        orderTable.style.display = "none";
        shippingDetails.style.display = "none";

        try {
          const user = await fetchUserDetails(userId);
          const isAddressValid = displayShippingDetails(user);
          await displayOrderItems();
          document
            .getElementById("confirmOrderBtn")
            .addEventListener("click", confirmOrder);
          if (!isAddressValid) {
            showAlert(
              "Please complete your shipping address in your profile.",
              "danger"
            );
            document.getElementById("confirmOrderBtn").disabled = true;
          }
        } catch (error) {
          console.error("Initialization error:", error.message);
          showAlert("Error loading order details: " + error.message, "danger");
        } finally {
          loading.style.display = "none";
          orderTable.style.display = "block";
          shippingDetails.style.display = "block";
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