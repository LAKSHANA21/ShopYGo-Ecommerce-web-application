/**
 * 
 */
const API_BASE_URL = "http://localhost:8082/api";
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
          console.log("Attempting token refresh");
          const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              refreshToken: localStorage.getItem("refreshToken"),
            }),
          });
          console.log(`Token refresh response status: ${response.status}`);
          const data = await response.json();
          if (response.ok) {
            localStorage.setItem("accessToken", data.accessToken);
            console.log("Token refreshed successfully");
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
            window.location.href = "/";
          };
        } else {
          authText.textContent = "Login";
          authLink.href = "userIndex.html";
        }
        return !!accessToken;
      }

      async function fetchWishlist() {
        const accessToken = localStorage.getItem("accessToken");
        const loading = document.getElementById("loading");
        const wishlistTable = document.querySelector(".wishlist-table");

        if (!accessToken) {
          showAlert("Please log in to view your wishlist.", "danger");
          setTimeout(() => (window.location.href = "/"), 1000);
          return;
        }

        loading.style.display = "block";
        

        try {
          console.log("Fetching wishlist");
          let response = await fetch(`${API_BASE_URL}/wishlist`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          });

          console.log(`Wishlist response status: ${response.status}`);
          let data;
          try {
            data = await response.json();
          } catch (e) {
            console.warn("No JSON response body from wishlist");
            data = [];
          }
          console.log("Wishlist data:", data);

          if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              showAlert("Session expired. Please log in again.", "danger");
              setTimeout(() => (window.location.href = "/"), 1000);
              return;
            }
            response = await fetch(`${API_BASE_URL}/wishlist`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
            });
            try {
              data = await response.json();
            } catch (e) {
              console.warn("No JSON response body after token refresh");
              data = [];
            }
            console.log("Wishlist data after refresh:", data);
          }

          if (response.ok) {
            await fetchVariants();
            await displayWishlistItems(data);
          } else {
            showAlert(
              data.message ||
                `Failed to fetch wishlist items (Status: ${response.status}).`,
              "danger"
            );
          }
        } catch (error) {
          console.error("Fetch wishlist error:", error);
          showAlert("Error fetching wishlist: " + error.message, "danger");
        } finally {
          loading.style.display = "none";
          wishlistTable.style.display = "block";
        }
      }

      async function fetchProduct(productId) {
        try {
          console.log(`Fetching product: ${productId}`);
          const response = await fetch(
            `${API_BASE_URL}/products/${productId}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );
          console.log(
            `Product ${productId} response status: ${response.status}`
          );
          if (!response.ok) {
            console.warn(
              `Product ${productId} not found (Status: ${response.status})`
            );
            return null;
          }
          const product = await response.json();
          console.log(`Product ${productId} data:`, product);
          return product;
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error.message);
          return null;
        }
      }

      async function fetchVariants() {
        if (variantsCache) {
          console.log("Using cached variants:", variantsCache);
          return variantsCache;
        }
        try {
          console.log(
            "Fetching variants from:",
            `${API_BASE_URL}/public/variants`
          );
          const response = await fetch(`${API_BASE_URL}/public/variants`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          console.log(`Variants response status: ${response.status}`);
          if (!response.ok) {
            console.warn("Failed to fetch variants");
            variantsCache = [];
            return variantsCache;
          }
          variantsCache = await response.json();
          console.log("Fetched variants:", variantsCache);
          return variantsCache;
        } catch (error) {
          console.error("Error fetching variants:", error.message);
          variantsCache = [];
          return variantsCache;
        }
      }

      async function getProductVariants(productId) {
        const variants = variantsCache || (await fetchVariants());
        console.log(`Filtering variants for productId: ${productId}`);
        const productVariants = variants.filter(
          (v) => v.productId === productId
        );
        console.log(`Product ${productId} variants:`, productVariants);
        return productVariants;
      }

      async function displayWishlistItems(items) {
        const tbody = document.getElementById("wishlistItems");
        tbody.innerHTML = "";

        if (items.length === 0) {
          tbody.innerHTML =
            '<tr><td colspan="4" class="text-center">Your wishlist is empty.</td></tr>';
          showAlert("Your wishlist is empty.", "info");
          return;
        }

        for (const item of items) {
          console.log(`Processing wishlist item:`, item);
          if (!item.productId) {
            console.warn(`Wishlist item missing productId`);
            continue;
          }

          const product = await fetchProduct(item.productId);
          const productVariants = await getProductVariants(item.productId);
          const hasVariants = productVariants.length > 0;
          const variantOptions = hasVariants
            ? productVariants[0].values
                .map(
                  (value) =>
                    `<option value="${value.id}" data-variant-id="${productVariants[0].id}">${value.value}</option>`
                )
                .join("")
            : "";

          const row = `
            <tr>
              <td>
                <div class="d-flex align-items-center">
                  <img src="${
                    product?.thumbnailUrl || "https://via.placeholder.com/80"
                  }" class="product-img me-3" alt="${
            product?.name || "Product"
          }">
                  <div>
                    <strong>${
                      product?.name ||
                      `Product ID: ${item.productId} (Not Found)`
                    }</strong>
                    <br>
                    <small>SKU: ${product?.sku || "N/A"}</small>
                  </div>
                </div>
              </td>
              <td>
                ${
                  hasVariants
                    ? `<select class="form-control variant-select" data-product-id="${item.productId}">
                        <option value="">Select ${productVariants[0].variantType}</option>
                        ${variantOptions}
                      </select>`
                    : "No variants available"
                }
              </td>
              <td>₹${product ? product.sellingPrice.toFixed(2) : "N/A"}</td>
              <td>
                <button class="btn btn-add-to-cart" data-product-id="${
                  item.productId
                }" ${hasVariants ? "disabled" : ""}>
                  <i class="fas fa-cart-plus me-1"></i> Add to Cart
                </button>
                <button class="btn btn-remove" data-product-id="${
                  item.productId
                }">
                  <i class="fas fa-trash me-1"></i> Remove
                </button>
              </td>
            </tr>
          `;
          tbody.innerHTML += row;
        }

        // Add event listeners
        document.querySelectorAll(".btn-remove").forEach((btn) => {
          btn.addEventListener("click", () => {
            btn.classList.add("btn-loading");
            btn.innerHTML =
              '<i class="fas fa-spinner fa-spin"></i> Removing...';
            removeFromWishlist(btn.dataset.productId).finally(() => {
              btn.classList.remove("btn-loading");
              btn.innerHTML = '<i class="fas fa-trash me-1"></i> Remove';
            });
          });
        });
        document.querySelectorAll(".btn-add-to-cart").forEach((btn) => {
          btn.addEventListener("click", () => {
            btn.classList.add("btn-loading");
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            addToCartFromWishlist(btn.dataset.productId).finally(() => {
              btn.classList.remove("btn-loading");
              btn.innerHTML =
                '<i class="fas fa-cart-plus me-1"></i> Add to Cart';
            });
          });
        });
        document.querySelectorAll(".variant-select").forEach((select) => {
          select.addEventListener("change", (e) => {
            const productId = e.target.dataset.productId;
            const addToCartBtn = e.target
              .closest("tr")
              .querySelector(".btn-add-to-cart");
            addToCartBtn.disabled = !e.target.value;
          });
        });
      }

      async function removeFromWishlist(productId) {
        const accessToken = localStorage.getItem("accessToken");
        const loading = document.getElementById("loading");
        const wishlistTable = document.querySelector(".wishlist-table");

        if (!accessToken) {
          showAlert("Please log in to remove items.", "danger");
          setTimeout(() => (window.location.href = "/"), 1000);
          return;
        }

        loading.style.display = "block";
        wishlistTable.style.display = "none";

        try {
          console.log(`Removing product ${productId} from wishlist`);
          let response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          });

          console.log(
            `Remove wishlist item response status: ${response.status}`
          );
          let data;
          try {
            data = await response.json();
          } catch (e) {
            console.warn("No JSON response body");
            data = {};
          }
          console.log("Remove wishlist item response data:", data);

          if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              showAlert("Session expired. Please log in again.", "danger");
              setTimeout(() => (window.location.href = "/"), 1000);
              return;
            }
            response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
            });
            try {
              data = await response.json();
            } catch (e) {
              console.warn("No JSON response body after token refresh");
              data = {};
            }
            console.log(
              "Remove wishlist item response data after refresh:",
              data
            );
          }

          if (response.ok) {
            showAlert("Item removed from wishlist!", "success");
            await fetchWishlist();
          } else {
            showAlert(
              data.message ||
                `Failed to remove item (Status: ${response.status}).`,
              "danger"
            );
          }
        } catch (error) {
          console.error("Remove wishlist item error:", error);
          showAlert("Error removing item: " + error.message, "danger");
        } finally {
          loading.style.display = "none";
          wishlistTable.style.display = "block";
        }
      }

      async function addToCartFromWishlist(productId) {
        const accessToken = localStorage.getItem("accessToken");
        const cartId = localStorage.getItem("cartId");
        const loading = document.getElementById("loading");
        const wishlistTable = document.querySelector(".wishlist-table");

        if (!accessToken || !cartId) {
          showAlert("Please log in to add items to cart.", "danger");
          setTimeout(() => (window.location.href = "/"), 1000);
          return;
        }

        const row = document
          .querySelector(`tr .btn-add-to-cart[data-product-id="${productId}"]`)
          .closest("tr");
        const variantSelect = row.querySelector(".variant-select");
        let variantId = null;
        let variantValueId = null;

        if (variantSelect && variantSelect.value) {
          variantValueId = parseInt(variantSelect.value);
          variantId = parseInt(
            variantSelect.options[variantSelect.selectedIndex].dataset.variantId
          );
        }

        loading.style.display = "block";
        wishlistTable.style.display = "none";

        try {
          console.log(`Adding product ${productId} to cart ${cartId}`, {
            variantId,
            variantValueId,
          });
          let response = await fetch(`${API_BASE_URL}/cart/${cartId}/items`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              productId: parseInt(productId),
              quantity: 1,
              variantId,
              variantValueId,
            }),
          });

          console.log(`Add to cart response status: ${response.status}`);
          let data;
          try {
            data = await response.json();
          } catch (e) {
            console.warn("No JSON response body");
            data = {};
          }
          console.log("Add to cart response data:", data);

          if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
              showAlert("Session expired. Please log in again.", "danger");
              setTimeout(() => (window.location.href = "/"), 1000);
              return;
            }
            response = await fetch(`${API_BASE_URL}/cart/${cartId}/items`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({
                productId: parseInt(productId),
                quantity: 1,
                variantId,
                variantValueId,
              }),
            });
            try {
              data = await response.json();
            } catch (e) {
              console.warn("No JSON response body after token refresh");
              data = {};
            }
            console.log("Add to cart response data after refresh:", data);
          }

          if (response.ok) {
            showAlert("Item added to cart!", "success");
            await fetchWishlist();
          } else {
            showAlert(
              data.message ||
                `Failed to add item to cart (Status: ${response.status}).`,
              "danger"
            );
          }
        } catch (error) {
          console.error("Add to cart error:", error);
          showAlert("Error adding item to cart: " + error.message, "danger");
        } finally {
          loading.style.display = "none";
          wishlistTable.style.display = "block";
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
          fetchWishlist();
        } else {
          showAlert("Please log in to view your wishlist.", "danger");
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