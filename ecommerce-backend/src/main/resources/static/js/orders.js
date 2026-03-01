/**
 * 
 */
const API_BASE_URL = "http://localhost:8082/api";
const productCache = {};
let variantsCache = null; // Cache for variants

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
  const token = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId");
  const cartId = localStorage.getItem("cartId");
  const authLink = document.getElementById("auth-link");
  const authText = document.getElementById("auth-text");
  if (token && userId && cartId) {
    authText.textContent = "Logout";
    authLink.href = "#";
    authLink.onclick = logout;
  } else {
    authText.textContent = "Login";
    authLink.href = "userindex.html";
    authLink.onclick = null;
  }
  return !!(token && userId && cartId);
}

function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("cartId");
  localStorage.removeItem("checkoutCartItems");
  window.location.href = "userindex.html";
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

async function fetchOrders() {
  const token = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId");
  const cartId = localStorage.getItem("cartId");
  const spinner = document.getElementById("spinner");
  const orderItems = document.getElementById("order-items");

  if (!token || !userId || !cartId) {
    showAlert("Please log in to view your orders.", "warning");
    setTimeout(() => (window.location.href = "userindex.html"), 1000);
    return;
  }

  spinner.style.display = "block";
  orderItems.style.display = "none";

  try {
    let response = await fetch(`${API_BASE_URL}/orders`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 403) {
      const newToken = await refreshToken();
      if (!newToken) {
        showAlert("Session expired. Please log in again.", "danger");
        setTimeout(() => (window.location.href = "userindex.html"), 1000);
        return;
      }
      response = await fetch(`${API_BASE_URL}/orders`, {
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
    console.log("Orders from API:", orders); // Debug API response
    await fetchVariants();
    await displayOrders(orders);
  } catch (error) {
    console.error("Fetch orders error:", error.message);
    showAlert("Failed to load orders: " + error.message, "danger");
  } finally {
    spinner.style.display = "none";
    orderItems.style.display = "grid";
  }
}

async function cancelOrderItem(orderId, orderItemId, button) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    showAlert("Please log in to cancel the order item.", "warning");
    setTimeout(() => (window.location.href = "userindex.html"), 1000);
    return;
  }

  button.classList.add("btn-loading");
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';

  try {
    let response = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${orderItemId}/cancel`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 403) {
      const newToken = await refreshToken();
      if (!newToken) {
        showAlert("Session expired. Please log in again.", "danger");
        setTimeout(() => (window.location.href = "userindex.html"), 1000);
        return;
      }
      response = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${orderItemId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
        },
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to cancel order item (Status: ${response.status})`
      );
    }

    showAlert("Order item cancelled successfully!", "success");
    await fetchOrders(); // Refresh orders after cancellation
  } catch (error) {
    console.error("Cancel order item error:", error.message);
    showAlert("Failed to cancel order item: " + error.message, "danger");
  } finally {
    button.classList.remove("btn-loading");
    button.innerHTML = '<i class="fas fa-times me-1"></i> Cancel Item';
  }
}

async function displayOrders(orders) {
  const orderItemsContainer = document.getElementById("order-items");
  orderItemsContainer.innerHTML = "";

  if (!Array.isArray(orders) || orders.length === 0) {
    orderItemsContainer.innerHTML = '<p class="text-center">You have no orders.</p>';
    showAlert("You have no orders.", "info");
    return;
  }

  for (const order of orders) {
    let productsDisplay = "";
    if (order.orderItems && Array.isArray(order.orderItems)) {
      for (const item of order.orderItems) {
        const product = await fetchProductDetails(item.productId);
        let variantsDisplay = "N/A";
        if (item.variantId && item.variantValueId) {
          variantsDisplay = await fetchVariantValue(item.variantId, item.variantValueId);
        }
        productsDisplay += `
          <div class="order-product" style="cursor: pointer;" data-bs-toggle="modal" data-bs-target="#orderItemModal" 
               data-order-id="${order.id}" 
               data-order-item-id="${item.id}" 
               data-product-name="${product ? product.name : 'Product Not Found'}"
               data-quantity="${item.quantity}"
               data-variants="${variantsDisplay}"
               data-status="${item.status ? item.status.toUpperCase() : 'N/A'}">
            <img src="${
              product ? product.thumbnailUrl : "https://images.unsplash.com/photo-1748185858196-4224f0ab215c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            }" class="product-img" alt="${product ? product.name : 'Product'}">
            <div>
              ${product ? product.name : 'Product Not Found'} (Qty: ${item.quantity}, Variants: ${variantsDisplay})
            </div>
          </div>`;
      }
    } else {
      productsDisplay = `<div class="order-product">No products in this order</div>`;
    }

    const card = `
      <div class="order-card animate-order-card">
        <div class="order-details">
          ${productsDisplay}
          <p class="order-id"><strong>Order ID:</strong> ${order.id}</p>
          <p class="order-date"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p class="order-total"><strong>Total:</strong> ₹${(order.totalAmount || 0).toFixed(2)}</p>
        </div>
      </div>`;
    orderItemsContainer.innerHTML += card;
  }

  // Add click event listeners to order items to populate modal
  document.querySelectorAll(".order-product").forEach((item) => {
    item.addEventListener("click", () => {
      const orderId = item.dataset.orderId;
      const orderItemId = item.dataset.orderItemId;
      const productName = item.dataset.productName;
      const quantity = item.dataset.quantity;
      const variants = item.dataset.variants;
      const status = item.dataset.status;

      console.log("Order Item Status:", status); // Debug the status

      // Populate modal
      document.getElementById("modal-product-name").textContent = productName;
      document.getElementById("modal-quantity").textContent = quantity;
      document.getElementById("modal-variants").textContent = variants;
      document.getElementById("modal-status").textContent = status;

      // Set cancel button attributes
      const cancelBtn = document.getElementById("modal-cancel-btn");
      cancelBtn.dataset.orderId = orderId;
      cancelBtn.dataset.orderItemId = orderItemId;

      // Show/hide cancel button based on status
      if (["NEW", "PROCESSING","PLACED"].includes(status.toUpperCase())) {
        cancelBtn.style.display = "block";
        cancelBtn.disabled = false;
      } else {
        cancelBtn.style.display = "none";
        cancelBtn.disabled = true;
      }
    });
  });

  // Ensure cancel button event listener is only added once
  const cancelBtn = document.getElementById("modal-cancel-btn");
  const newCancelBtn = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  newCancelBtn.addEventListener("click", async () => {
    const orderId = newCancelBtn.dataset.orderId;
    const orderItemId = newCancelBtn.dataset.orderItemId;
    console.log("Cancelling order:", orderId, "item:", orderItemId); // Debug
    await cancelOrderItem(orderId, orderItemId, newCancelBtn);
    const modal = bootstrap.Modal.getInstance(document.getElementById("orderItemModal"));
    modal.hide();
  });

  // Observe order cards for animation
  const cards = document.querySelectorAll(".animate-order-card");
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-order-card");
      }
    });
  }, { threshold: 0.1 });

  cards.forEach((card) => cardObserver.observe(card));
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

window.onload = () => {
  if (checkAuth()) {
    fetchOrders();
  } else {
    showAlert("Please log in to view your orders.", "warning");
    setTimeout(() => (window.location.href = "userindex.html"), 1000);
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