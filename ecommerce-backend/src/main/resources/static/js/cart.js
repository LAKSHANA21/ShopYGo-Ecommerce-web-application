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
          window.location.href = "/";
        };
      } else {
        authText.textContent = "Login";
        authLink.href = "/";
      }
      return !!accessToken;
    }

    async function fetchCartItems() {
      const accessToken = localStorage.getItem("accessToken");
      const cartId = localStorage.getItem("cartId");
      const userId = localStorage.getItem("userId");
      const loading = document.getElementById("loading");
      const cartTable = document.querySelector(".cart-table");

      if (!accessToken || !cartId || !userId) {
        showAlert("Please log in to view your cart.", "danger");
        setTimeout(() => (window.location.href = "/"), 1000);
        return;
      }

      loading.style.display = "block";
      cartTable.style.display = "none";

      try {
        const items = await fetchCartItemsData(cartId);
        await fetchVariants();
        await displayCartItems(items);
      } catch (error) {
        console.error("Fetch cart items error:", error.message);
        showAlert("Error fetching cart items: " + error.message, "danger");
      } finally {
        loading.style.display = "none";
        cartTable.style.display = "block";
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

    function restrictQuantityInput(input, max) {
      input.addEventListener("input", () => {
        const cleanedValue = input.value.replace(/[^0-9]/g, "");
        input.value = cleanedValue;
      });
    }

    async function handleQuantityChange(input, cartId, itemId, stockQuantity) {
      let quantity = parseInt(input.value);
      const previousQuantity = parseInt(input.dataset.previous || "1");

      if (isNaN(quantity) || input.value.trim() === "") {
        quantity = previousQuantity;
        input.value = quantity;
        showAlert("Please enter a valid number.", "danger");
      } else if (quantity < 1) {
        quantity = 1;
        input.value = quantity;
        showAlert("Quantity must be at least 1.", "danger");
      } else if (quantity > stockQuantity) {
        quantity = stockQuantity;
        input.value = quantity;
        showAlert(`Only ${stockQuantity} units available in stock.`, "warning");
      }

      input.dataset.previous = quantity;

      if (quantity !== previousQuantity) {
        await updateQuantity(cartId, itemId, quantity, input);
      }
    }

    async function displayCartItems(items) {
      const tbody = document.getElementById("cartItems");
      const checkoutBtn = document.getElementById("checkoutBtn");
      const cartTotal = document.getElementById("cartTotal");

      tbody.innerHTML = "";

      if (items.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="text-center">Your cart is empty.</td></tr>';
        checkoutBtn.disabled = true;
        cartTotal.textContent = "Total: ₹0";
        showAlert("Your cart is empty.", "info");
        return;
      }

      let total = 0;
      let allItemsValid = true;

      for (const item of items) {
        if (!item.productId) {
          console.error(`Cart item ${item.id} missing productId`);
          allItemsValid = false;
          continue;
        }

        const product = await fetchProduct(item.productId);
        if (!product) {
          showAlert(
            `Product ID ${item.productId} not found. Please remove it from cart.`,
            "danger"
          );
          allItemsValid = false;
          tbody.innerHTML += `
            <tr>
              <td colspan="5">Product ID: ${item.productId} (Not Found)</td>
              <td>
                <button class="btn btn-remove" data-item-id="${
                  item.id
                }" data-cart-id="${item.cartId}"><i class="fas fa-trash"></i> Remove</button>
              </td>
            </tr>
          `;
          
          continue;
        }

        const stockQuantity =
          product.inventory && product.inventory.quantity !== undefined
            ? product.inventory.quantity
            : Infinity;

        if (stockQuantity < item.quantity) {
          showAlert(
            `Insufficient stock for ${product.name}. Only ${stockQuantity} available.`,
            "warning"
          );
          allItemsValid = false;
        }

          console.log("variet0",item.selectedVariants[0].variantId);
        const variantDetail =
          item.selectedVariants[0].variantId && item.selectedVariants[0].variantValueId
            ? await fetchVariantValue(item.selectedVariants[0].variantId, item.selectedVariants[0].variantValueId)
            : "None";

        const itemPrice = product.sellingPrice || 0;
        const quantity = Math.min(item.quantity || 1, stockQuantity);
        const subtotal = itemPrice * quantity;
        total += subtotal;

        const row = `
          <tr data-item-id="${item.id}">
            <td>
              <div class="d-flex align-items-center">
                <img
                  src="${
                    product.thumbnailUrl || "https://via.placeholder.com/80"
                  }"
                  class="product-img me-3"
                  alt="${product.name || "Product"}"
                >
                <div>
                  <strong>${product.name}</strong>
                  <br>
                  <small>SKU: ${product.sku || "N/A"}</small>
                </div>
              </div>
            </td>
            <td>${variantDetail}</td>
            <td>
              <div class="quantity-control">
                <button
                  class="btn btn-quantity"
                  data-item-id="${item.id}"
                  data-cart-id="${item.cartId}"
                  data-action="decrease"
                ><i class="fas fa-minus"></i></button>
                <input
                  type="number"
                  class="form-control quantity-input"
                  value="${quantity}"
                  min="1"
                  max="${stockQuantity}"
                  data-item-id="${item.id}"
                  data-cart-id="${item.cartId}"
                  data-stock="${stockQuantity}"
                  data-previous="${quantity}"
                >
                <button
                  class="btn btn-quantity"
                  data-item-id="${item.id}"
                  data-cart-id="${item.cartId}"
                  data-action="increase"
                ><i class="fas fa-plus"></i></button>
              </div>
            </td>
            <td>₹${itemPrice.toFixed(2)}</td>
            <td class="subtotal">₹${subtotal.toFixed(2)}</td>
            <td>
              <button
                class="btn btn-remove"
                data-item-id="${item.id}"
                data-cart-id="${item.cartId}"
              ><i class="fas fa-trash"></i> Remove</button>
            </td>
          </tr>
        `;
        tbody.innerHTML += row;
        console.log("lk",item.id);
      }

      cartTotal.textContent = `Total: ₹${total.toFixed(2)}`;
      checkoutBtn.disabled = !allItemsValid || items.length === 0;
      checkoutBtn.addEventListener("click", checkout);

      // Add event listeners
      document.querySelectorAll(".btn-remove").forEach((btn) => {
        btn.addEventListener("click", () =>
          removeFromCart(btn.dataset.cartId, btn.dataset.itemId)
        );
      });

      let debounceTimeout;
      document.querySelectorAll(".btn-quantity").forEach((btn) => {
        btn.addEventListener("click", () => {
          const input = btn.parentElement.querySelector(".quantity-input");
          const stockQuantity = parseInt(input.dataset.stock);
          let quantity = parseInt(input.value);
          const previousQuantity = quantity;

          if (btn.dataset.action === "increase") {
            if (quantity < stockQuantity) {
              quantity += 1;
            } else {
              showAlert(
                `Only ${stockQuantity} units available in stock.`,
                "warning"
              );
              return;
            }
          } else if (btn.dataset.action === "decrease" && quantity > 1) {
            quantity -= 1;
          }

          input.value = quantity;
          input.dataset.previous = quantity;

          if (quantity !== previousQuantity) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
              updateQuantity(
                btn.dataset.cartId,
                btn.dataset.itemId,
                quantity,
                input
              );
            }, 500);
          }
        });
      });

      document.querySelectorAll(".quantity-input").forEach((input) => {
        const stockQuantity = parseInt(input.dataset.stock);
        restrictQuantityInput(input, stockQuantity);
        input.addEventListener("blur", () => {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            handleQuantityChange(
              input,
              input.dataset.cartId,
              input.dataset.itemId,
              stockQuantity
            );
          }, 500);
        });
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
              handleQuantityChange(
                input,
                input.dataset.cartId,
                input.dataset.itemId,
                stockQuantity
              );
            }, 500);
          }
        });
      });
    }

    async function updateQuantity(cartId, itemId, quantity, inputElement = null) {
      const accessToken = localStorage.getItem("accessToken");
      const loading = document.getElementById("loading");
      const cartTable = document.querySelector(".cart-table");
      console.log("sdfcgvbhnm:",cartId, itemId, quantity);
      const button = inputElement
        ? inputElement.parentElement.querySelector(
            `.btn-quantity[data-item-id="${itemId}"]`
          )
        : document.querySelector(
            `.btn-quantity[data-item-id="${itemId}"]`
          );

      if (!accessToken) {
        showAlert("Please log in to update cart.", "danger");
        setTimeout(() => (window.location.href = "/"), 1000);
        return;
      }

      if (quantity < 1) {
        showAlert("Quantity must be at least 1.", "danger");
        return;
      }

      // Re-fetch product to ensure latest stock
      const rawData = await fetchCartItemsData(cartId);
const cartItems = Object.values(rawData); // convert object to array
const item = cartItems.find((i) => i.id === Number(itemId)); // find the item

console.log(item); // should no longer be undefined

      if (!item) {
        showAlert("Cart item not found.", "danger");
        return;
      }

      const product = await fetchProduct(item.productId);
      if (!product) {
        showAlert(`Product ID ${item.productId} not found.`, "danger");
        return;
      }

      const stockQuantity = product.inventory?.quantity ?? Infinity;
      if (quantity > stockQuantity) {
        showAlert(
          `Only ${stockQuantity} units available in stock.`,
          "warning"
        );
        return;
      }

      loading.style.display = "block";
      cartTable.style.display = "none";

      if (button) {
        button.classList.add("btn-loading");
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      }

      try {
        let response = await fetch(
          `${API_BASE_URL}/cart/${cartId}/items/${itemId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ quantity: parseInt(quantity) }),
          }
        );

        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = {};
        }

        if (response.status === 403) {
          const newToken = await refreshToken();
          if (!newToken) {
            showAlert("Session expired. Please log in again.", "danger");
            setTimeout(() => (window.location.href = "/"), 1000);
            return;
          }

          response = await fetch(
            `${API_BASE_URL}/cart/${cartId}/items/${itemId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({ quantity: parseInt(quantity) }),
            }
          );

          try {
            data = await response.json();
          } catch (e) {
            data = {};
          }
        }

        if (response.ok) {
          showAlert("Quantity updated!", "success");
          // Update UI immediately
          if (inputElement) {
            const row = inputElement.closest(`tr[data-item-id="${itemId}"]`);
            const priceCell = row.querySelector("td:nth-child(4)");
            const subtotalCell = row.querySelector(".subtotal");
            const itemPrice = parseFloat(priceCell.textContent.replace("₹", ""));
            const newSubtotal = itemPrice * quantity;
            subtotalCell.textContent = `₹${newSubtotal.toFixed(2)}`;

            // Update total
            let total = 0;
            document.querySelectorAll(".subtotal").forEach((cell) => {
              total += parseFloat(cell.textContent.replace("₹", ""));
            });
            document.getElementById(
              "cartTotal"
            ).textContent = `Total: ₹${total.toFixed(2)}`;
          } else {
            await fetchCartItems();
          }
        } else {
          showAlert(
            data.message ||
              `Failed to update quantity (Status: ${response.status}).`,
            "danger"
          );
          await fetchCartItems(); // Fallback to refresh
        }
      } catch (error) {
        console.error("Update quantity error:", error.message);
        showAlert("Error updating quantity: " + error.message, "danger");
        await fetchCartItems(); // Fallback to refresh
      } finally {
        loading.style.display = "none";
        cartTable.style.display = "block";
        if (button) {
          button.classList.remove("btn-loading");
          button.innerHTML =
            button.dataset.action === "increase"
              ? '<i class="fas fa-plus"></i>'
              : '<i class="fas fa-minus"></i>';
        }
      }
    }

    async function removeFromCart(cartId, itemId) {
      const accessToken = localStorage.getItem("accessToken");
      const loading = document.getElementById("loading");
      const cartTable = document.querySelector(".cart-table");
      const button = document.querySelector(
        `.btn-remove[data-item-id="${itemId}"]`
      );

      if (!accessToken) {
        showAlert("Please log in to remove items.", "danger");
        setTimeout(() => (window.location.href = "/"), 1000);
        return;
      }

      loading.style.display = "block";
      cartTable.style.display = "none";
      button.classList.add("btn-loading");
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';

      try {
        let response = await fetch(
          `${API_BASE_URL}/cart/${cartId}/items/${itemId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = {};
        }

        if (response.status === 403) {
          const newToken = await refreshToken();
          if (!newToken) {
            showAlert("Session expired. Please log in again.", "danger");
            setTimeout(() => (window.location.href = "/"), 1000);
            return;
          }

          response = await fetch(
            `${API_BASE_URL}/cart/${cartId}/items/${itemId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
            }
          );

          try {
            data = await response.json();
          } catch (e) {
            data = {};
          }
        }

        if (response.ok) {
          showAlert("Item removed from cart!", "success");
          await fetchCartItems();
        } else {
          showAlert(
            data.message ||
              `Failed to remove item (Status: ${response.status}).`,
            "danger"
          );
        }
      } catch (error) {
        console.error("Remove item error:", error.message);
        showAlert("Error removing item: " + error.message, "danger");
      } finally {
        loading.style.display = "none";
        cartTable.style.display = "block";
        button.classList.remove("btn-loading");
        button.innerHTML = '<i class="fas fa-trash"></i> Remove';
      }
    }

    async function fetchCartItemsData(cartId) {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken || !cartId) {
        console.error("Missing accessToken or cartId");
        return [];
      }

      try {
        let response = await fetch(`${API_BASE_URL}/cart/${cartId}/items`, {
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
            setTimeout(() => (window.location.href = "/"), 1000);
            return [];
          }

          response = await fetch(`${API_BASE_URL}/cart/${cartId}/items`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newToken}`,
            },
          });
        }

        let data = [];
        if (response.ok) {
          try {
            data = await response.json();
            console.log(data);
          } catch (e) {
            console.error("Failed to parse JSON response:", e.message);
            console.error(
              "Response status:",
              response.status,
              "Response text:",
              await response.text()
            );
            showAlert("Invalid server response. Please try again.", "danger");
            return [];
          }
        } else {
          console.error("API error:", response.status, await response.text());
          showAlert(
            `Failed to fetch cart items (Status: ${response.status}).`,
            "danger"
          );
          return [];
        }

        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Fetch cart items error:", error.message);
        showAlert("Error fetching cart items: " + error.message, "danger");
        return [];
      }
    }

    async function checkout() {
      const accessToken = localStorage.getItem("accessToken");
      const cartId = localStorage.getItem("cartId");
      const userId = localStorage.getItem("userId");
      const loading = document.getElementById("loading");
      const cartTable = document.querySelector(".cart-table");
      const checkoutBtn = document.getElementById("checkoutBtn");

      if (!accessToken || !cartId || !userId) {
        showAlert("Please log in to proceed with checkout.", "danger");
        setTimeout(() => (window.location.href = "/"), 1000);
        return;
      }

      loading.style.display = "block";
      cartTable.style.display = "none";
      checkoutBtn.classList.add("btn-loading");
      checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

      try {
        const cartItems = await fetchCartItemsData(cartId);
        if (!Array.isArray(cartItems) || cartItems.length === 0) {
          showAlert("Your cart is empty or could not be loaded.", "danger");
          return;
        }

        const validItems = [];
        for (const item of cartItems) {
          if (!item.productId) {
            showAlert(
              `Invalid item in cart (ID: ${item.id}). Please remove it.`,
              "danger"
            );
            return;
          }

          const product = await fetchProduct(item.productId);
          if (!product) {
            showAlert(
              `Product ID ${item.productId} not found. Please remove it from cart.`,
              "danger"
            );
            return;
          }

          const stockQuantity = product.inventory?.quantity ?? Infinity;
          if (stockQuantity < item.quantity) {
            showAlert(
              `Insufficient stock for ${product.name}. Only ${stockQuantity} available.`,
              "danger"
            );
            return;
          }

          validItems.push(item);
        }

        if (validItems.length > 0) {
          localStorage.setItem(
            "checkoutCartItems",
            JSON.stringify(validItems)
          );
          window.location.href = "/checkout";
        } else {
          showAlert("No valid items to checkout.", "danger");
        }
      } catch (error) {
        console.error("Checkout error:", error.message);
        showAlert("Error during checkout: " + error.message, "danger");
      } finally {
        loading.style.display = "none";
        cartTable.style.display = "block";
        checkoutBtn.classList.remove("btn-loading");
        checkoutBtn.innerHTML = '<i class="fas fa-check me-1"></i> Proceed to Checkout';
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
    window.onload = () => {
      if (checkAuth()) {
        fetchCartItems();
      } else {
        showAlert("Please log in to view your cart.", "danger");
        setTimeout(() => (window.location.href = "/"), 1000);
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