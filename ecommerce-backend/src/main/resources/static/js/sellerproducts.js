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

      // Logout
      function logout() {
        if (confirm("Are you sure you want to logout?")) {
          localStorage.clear();
          window.location.href = "/seller/login";
        }
      }

      let currentProductId = null;
      let isFetchingProducts = false;

      function showAlert(message, type) {
        const alert = document.getElementById("productsAlert");
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

      async function checkAuth() {
        const token = localStorage.getItem("accessToken");
        const sellerId = localStorage.getItem("sellerId");
        if (!token || !sellerId) {
          showAlert("Please login first.", "danger");
          setTimeout(() => (window.location.href = "sellerIndex.html"), 1000);
          return false;
        }
        return true;
      }

      async function fetchCategories() {
        try {
          const response = await fetch("http://localhost:8082/api/categories");
          if (!response.ok) throw new Error("Failed to fetch categories");
          const categories = await response.json();
          const categorySelect = document.getElementById("categoryId");
          categorySelect.innerHTML =
            '<option value="" disabled selected>Select category</option>';
          categories.forEach((c) => {
            categorySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
          });
          return categories;
        } catch (error) {
          showAlert("Error loading categories.", "danger");
          return [];
        }
      }

      async function loadCategoriesForSubcategory() {
        const categories = await fetchCategories();
        const categorySelect = document.getElementById("subcategoryCategoryId");
        categorySelect.innerHTML =
          '<option value="" disabled selected>Select category</option>';
        categories.forEach((c) => {
          categorySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
      }

      async function loadSubcategories() {
        const categoryId = document.getElementById("categoryId").value;
        const subcategorySelect = document.getElementById("subcategoryId");
        subcategorySelect.disabled = !categoryId;
        subcategorySelect.innerHTML =
          '<option value="" disabled selected>Select subcategory</option>';
        if (!categoryId) return;
        try {
          const response = await fetch(
            `http://localhost:8082/api/categories/${categoryId}/subcategories`
          );
          if (!response.ok) throw new Error("Failed to fetch subcategories");
          const subcategories = await response.json();
          subcategories.forEach((s) => {
            subcategorySelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
          });
        } catch (error) {
          showAlert("Error loading subcategories.", "danger");
        }
      }

      async function fetchProducts() {
        if (isFetchingProducts) return;
        isFetchingProducts = true;
        if (!(await checkAuth())) {
          isFetchingProducts = false;
          return;
        }
        const token = localStorage.getItem("accessToken");
        const sellerId = localStorage.getItem("sellerId");
        try {
          const response = await fetch(
            `http://localhost:8082/api/sellers/${sellerId}/products`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch products: ${errorText}`);
          }
          const products = await response.json();
          if (!Array.isArray(products)) {
            throw new Error("Invalid response format: Expected an array");
          }
          const tbody = document.getElementById("productsTable");
          tbody.innerHTML = "";
          if (products.length === 0) {
            tbody.innerHTML =
              '<tr><td colspan="10">No products found.</td></tr>';
            return;
          }
          products.forEach((p) => {
            const thumbnail = p.thumbnailUrl
              ? `<img src="${p.thumbnailUrl}" class="thumbnail-preview" alt="Thumbnail" />`
              : "N/A";
            const row = `
                        <tr>
                            <td>${thumbnail}</td>
                            <td>${p.name || "N/A"}</td>
                            <td>${p.sku || "N/A"}</td>
                            <td>₹${(p.actualPrice || 0).toFixed(2)}</td>
                            <td>₹${(p.mrp || 0).toFixed(2)}</td>
                            <td>${p.inventory?.quantity ?? "N/A"}</td>
                            <td>${p.category?.name || "N/A"}</td>
                            <td>${p.subcategory?.name || "N/A"}</td>
                            <td>${p.inStock ? "In Stock" : "Out of Stock"}</td>
                            <td>
                                <button class="btn btn-warning btn-sm me-2" onclick="editProduct(${
                                  p.id
                                })">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${
                                  p.id
                                })">Delete</button>
                            </td>
                        </tr>`;
            tbody.innerHTML += row;
          });
        } catch (error) {
          console.error("Fetch products error:", error);
          showAlert(`Error loading products: ${error.message}`, "danger");
        } finally {
          isFetchingProducts = false;
        }
      }

	  async function fetchVariants(productId) {
	    const token = localStorage.getItem("accessToken");
	    try {
	      const response = await fetch(
	        `http://localhost:8082/api/products/${productId}/variants`,
	        {
	          headers: { Authorization: `Bearer ${token}` },
	        }
	      );
	      if (!response.ok) {
	        const errorText = await response.text();
	        throw new Error(`Failed to fetch variants: ${errorText}`);
	      }
	      const variants = await response.json();
	      console.log("Hey", variants);
	      const tbody = document.getElementById("variantsTable");
	      tbody.innerHTML = "";
	      variants.forEach((v) => {
	        const values =
	          v.values
	            ?.map((val) => `<span class="badge">${val.value}</span>`) // Use val.value instead of val
	            .join(" ") || "None";
	        const row = `
	          <tr>
	            <td>${v.variantType}</td>
	            <td class="variant-values">${values}</td>
	            <td>
	              <button class="btn btn-success btn-sm me-2" onclick="openVariantValueModal(null, ${v.id}, '${v.variantType}')">Add Values</button>
	              <button class="btn btn-warning btn-sm me-2" onclick='editVariant(${v.id}, "${v.variantType}")'>Edit Variant</button>
	              <button class="btn btn-warning btn-sm me-2" onclick='editVariantValues(${v.id}, "${v.variantType}")'>Edit Values</button>
	              <button class="btn btn-danger btn-sm" onclick="deleteVariant(${v.id})">Delete</button>
	            </td>
	          </tr>`;
	        tbody.innerHTML += row;
	      });
	    } catch (error) {
	      console.error("Fetch variants error:", error);
	      showAlert("Error loading variants: " + error.message, "danger");
	    }
	  }

      async function fetchImages(productId) {
        const token = localStorage.getItem("accessToken");
        try {
          const response = await fetch(
            `http://localhost:8082/api/sellers/products/${productId}/images`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch images: ${errorText}`);
          }
          const images = await response.json();
          const tbody = document.getElementById("imagesTable");
          tbody.innerHTML = "";
          images.forEach((i) => {
            const preview = i.imageUrl
              ? `<img src="${i.imageUrl}" class="thumbnail-preview" alt="Image Preview" />`
              : "N/A";
            const row = `
                        <tr>
                            <td>${preview}</td>
                            <td><a href="${i.imageUrl}" target="_blank">${
              i.imageUrl
            }</a></td>
                            <td>
                                <button class="btn btn-warning btn-sm me-2" onclick='editImage(${JSON.stringify(
                                  i
                                )})'>Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteImage(${
                                  i.id
                                })">Delete</button>
                            </td>
                        </tr>`;
            tbody.innerHTML += row;
          });
        } catch (error) {
          console.error("Fetch images error:", error);
          showAlert("Error loading images: " + error.message, "danger");
        }
      }

      function resetProductForm() {
        document.getElementById("productForm").reset();
        document.getElementById("productId").value = "";
        document.getElementById("productModalTitle").textContent =
          "Add Product";
        document.getElementById("categoryId").value = "";
        document.getElementById("subcategoryId").innerHTML =
          '<option value="" disabled selected>Select subcategory</option>';
        document.getElementById("subcategoryId").disabled = true;
        document.getElementById("isActive").value = "true";
        document.getElementById("inStock").value = "true";
        document.getElementById("lowStockThreshold").value = "10";
        document.getElementById("variantsTable").innerHTML = "";
        document.getElementById("imagesTable").innerHTML = "";
        currentProductId = null;
        document.getElementById("addVariantBtn").disabled = true;
        document.getElementById("addImageBtn").disabled = true;
        // Clear validation feedback
        document
          .querySelectorAll("#productForm .is-invalid")
          .forEach((el) => el.classList.remove("is-invalid"));
      }

      document
        .getElementById("productForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!(await checkAuth())) return;
          const token = localStorage.getItem("accessToken");
          const productId = document.getElementById("productId").value;
          const product = {
            name: document.getElementById("name").value.trim(),
            description: document.getElementById("description").value.trim(),
            actualPrice: parseFloat(
              document.getElementById("actualPrice").value
            ),
            mrp: parseFloat(document.getElementById("mrp").value),
            margin: parseFloat(document.getElementById("margin").value),
            thumbnailUrl:
              document.getElementById("thumbnailUrl").value.trim() || null,
            sku: document.getElementById("sku").value.trim(),
            isActive: document.getElementById("isActive").value === "true",
            inStock: document.getElementById("inStock").value === "true",
            categoryId: parseInt(document.getElementById("categoryId").value),
            subcategoryId: parseInt(
              document.getElementById("subcategoryId").value
            ),
            quantity: parseInt(document.getElementById("quantity").value),
            lowStockThreshold: parseInt(
              document.getElementById("lowStockThreshold").value
            ),
          };

          let isValid = true;
          const inputs = document.querySelectorAll("#productForm [required]");
          inputs.forEach((input) => {
            if (!input.value.trim()) {
              input.classList.add("is-invalid");
              isValid = false;
            } else {
              input.classList.remove("is-invalid");
            }
          });

          if (
            isNaN(product.actualPrice) ||
            isNaN(product.mrp) ||
            isNaN(product.margin)
          ) {
            showAlert(
              "Please enter valid numbers for price, MRP, and margin.",
              "danger"
            );
            document.getElementById("actualPrice").classList.add("is-invalid");
            document.getElementById("mrp").classList.add("is-invalid");
            document.getElementById("margin").classList.add("is-invalid");
            isValid = false;
          }

          if (isNaN(product.quantity) || isNaN(product.lowStockThreshold)) {
            showAlert(
              "Please enter valid numbers for stock quantity and threshold.",
              "danger"
            );
            document.getElementById("quantity").classList.add("is-invalid");
            document
              .getElementById("lowStockThreshold")
              .classList.add("is-invalid");
            isValid = false;
          }

          if (!isValid) return;

          try {
            const url = productId
              ? `http://localhost:8082/api/products/${productId}`
              : "http://localhost:8082/api/sellers/products";
            const method = productId ? "PUT" : "POST";
            const response = await fetch(url, {
              method,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(product),
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(
                data.message ||
                  `Failed to ${productId ? "update" : "add"} product`
              );
            }
            currentProductId = data.id || productId;
            document.getElementById("productId").value = currentProductId;
            document.getElementById("addVariantBtn").disabled = false;
            document.getElementById("addImageBtn").disabled = false;
            showAlert(
              `Product ${productId ? "updated" : "added"} successfully!`,
              "success"
            );
            bootstrap.Modal.getInstance(
              document.getElementById("productModal")
            ).hide();
            await fetchProducts();
          } catch (error) {
            console.error("Save product error:", error);
            showAlert(
              `Error ${productId ? "updating" : "adding"} product: ${
                error.message
              }`,
              "danger"
            );
          }
        });

      document
        .getElementById("categoryForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!(await checkAuth())) return;
          const token = localStorage.getItem("accessToken");
          const category = {
            name: document.getElementById("categoryName").value.trim(),
            description: document
              .getElementById("categoryDescription")
              .value.trim(),
          };
          if (!category.name) {
            document.getElementById("categoryName").classList.add("is-invalid");
            showAlert("Category name is required.", "danger");
            return;
          }
          document
            .getElementById("categoryName")
            .classList.remove("is-invalid");
          try {
            const response = await fetch(
              "http://localhost:8082/api/categories",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(category),
              }
            );
            if (!response.ok) throw new Error("Failed to add category");
            showAlert("Category added successfully!", "success");
            document.getElementById("categoryForm").reset();
            bootstrap.Modal.getInstance(
              document.getElementById("categoryModal")
            ).hide();
            await fetchCategories();
            await loadSubcategories();
          } catch (error) {
            showAlert(`Error adding category: ${error.message}`, "danger");
          }
        });

      document
        .getElementById("subcategoryForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!(await checkAuth())) return;
          const token = localStorage.getItem("accessToken");
          const categoryId = document.getElementById(
            "subcategoryCategoryId"
          ).value;
          const subcategory = {
            name: document.getElementById("subcategoryName").value.trim(),
            description: document
              .getElementById("subcategoryDescription")
              .value.trim(),
            categoryId: parseInt(categoryId),
          };
          let isValid = true;
          if (!subcategory.name) {
            document
              .getElementById("subcategoryName")
              .classList.add("is-invalid");
            isValid = false;
          } else {
            document
              .getElementById("subcategoryName")
              .classList.remove("is-invalid");
          }
          if (!categoryId) {
            document
              .getElementById("subcategoryCategoryId")
              .classList.add("is-invalid");
            isValid = false;
          } else {
            document
              .getElementById("subcategoryCategoryId")
              .classList.remove("is-invalid");
          }
          if (!isValid) {
            showAlert("Subcategory name and category are required.", "danger");
            return;
          }
          try {
            const response = await fetch(
              `http://localhost:8082/api/categories/${categoryId}/subcategories`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(subcategory),
              }
            );
            if (!response.ok) throw new Error("Failed to add subcategory");
            showAlert("Subcategory added successfully!", "success");
            document.getElementById("subcategoryForm").reset();
            bootstrap.Modal.getInstance(
              document.getElementById("subcategoryModal")
            ).hide();
            await fetchCategories();
            await loadSubcategories();
          } catch (error) {
            showAlert(`Error adding subcategory: ${error.message}`, "danger");
          }
        });

      document
        .getElementById("variantForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!(await checkAuth())) return;
          if (!currentProductId) {
            showAlert(
              "Please save the product before adding variants.",
              "danger"
            );
            return;
          }
          const token = localStorage.getItem("accessToken");
          const variantId = document.getElementById("variantId").value;
          const variantType = document
            .getElementById("variantType")
            .value.trim();

          if (!variantType) {
            document.getElementById("variantType").classList.add("is-invalid");
            return;
          }
          document.getElementById("variantType").classList.remove("is-invalid");

          const variant = { variantType };

          try {
            const url = variantId
              ? `http://localhost:8082/api/variants/${variantId}`
              : `http://localhost:8082/api/products/${currentProductId}/variants`;
            const method = variantId ? "PUT" : "POST";
            const response = await fetch(url, {
              method,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(variant),
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.message ||
                  `Failed to ${variantId ? "update" : "add"} variant`
              );
            }
            showAlert(
              `Variant ${variantId ? "updated" : "added"} successfully!`,
              "success"
            );
            document.getElementById("variantForm").reset();
            document.getElementById("variantId").value = "";
            bootstrap.Modal.getInstance(
              document.getElementById("variantModal")
            ).hide();
            await fetchVariants(currentProductId);
          } catch (error) {
            console.error("Save variant error:", error);
            showAlert(
              `Error ${variantId ? "updating" : "adding"} variant: ${
                error.message
              }`,
              "danger"
            );
          }
        });

      document
        .getElementById("variantValueForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!(await checkAuth())) return;
          if (!currentProductId) {
            showAlert(
              "Please save the product before adding variant values.",
              "danger"
            );
            return;
          }
          const token = localStorage.getItem("accessToken");
          const variantId = document.getElementById(
            "variantValueVariantId"
          ).value;
          const valuesInput = document
            .getElementById("variantValue")
            .value.trim();

          if (!valuesInput) {
            document.getElementById("variantValue").classList.add("is-invalid");
            return;
          }
          document
            .getElementById("variantValue")
            .classList.remove("is-invalid");

          const values = valuesInput
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v);

          if (values.length === 0) {
            document.getElementById("variantValue").classList.add("is-invalid");
            showAlert("Please enter at least one valid value.", "danger");
            return;
          }

          try {
            for (const value of values) {
              const variantValue = { value };
              const response = await fetch(
                `http://localhost:8082/api/variants/${variantId}/values`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(variantValue),
                }
              );
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                  errorData.message || `Failed to add variant value: ${value}`
                );
              }
            }
            showAlert(`Variant value(s) added successfully!`, "success");
            document.getElementById("variantValueForm").reset();
            document.getElementById("variantValueId").value = "";
            bootstrap.Modal.getInstance(
              document.getElementById("variantValueModal")
            ).hide();
            await fetchVariants(currentProductId);
          } catch (error) {
            console.error("Save variant value error:", error);
            showAlert(`Error adding variant value(s): ${error.message}`, "danger");
          }
        });

      document
        .getElementById("imageForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!(await checkAuth())) return;
          if (!currentProductId) {
            showAlert(
              "Please save the product before adding images.",
              "danger"
            );
            return;
          }
          const token = localStorage.getItem("accessToken");
          const imageId = document.getElementById("imageId").value;
          const image = {
            productId: parseInt(currentProductId),
            imageUrl: document.getElementById("imageUrl").value.trim(),
          };
          if (!image.imageUrl) {
            document.getElementById("imageUrl").classList.add("is-invalid");
            showAlert("Image URL is required.", "danger");
            return;
          }
          document.getElementById("imageUrl").classList.remove("is-invalid");
          try {
            const url = imageId
              ? `http://localhost:8082/api/sellers/products/images/${imageId}`
              : `http://localhost:8082/api/sellers/products/${currentProductId}/images`;
            const method = imageId ? "PUT" : "POST";
            const response = await fetch(url, {
              method,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(image),
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(
                data.message || `Failed to ${imageId ? "update" : "add"} image`
              );
            }
            showAlert(
              `Image ${imageId ? "updated" : "added"} successfully!`,
              "success"
            );
            document.getElementById("imageForm").reset();
            document.getElementById("imageId").value = "";
            bootstrap.Modal.getInstance(
              document.getElementById("imageModal")
            ).hide();
            await fetchImages(currentProductId);
          } catch (error) {
            console.error("Save image error:", error);
            showAlert(
              `Error ${imageId ? "updating" : "adding"} image: ${
                error.message
              }`,
              "danger"
            );
          }
        });

      async function editProduct(id) {
        if (!(await checkAuth())) return;
        const token = localStorage.getItem("accessToken");
        try {
          const response = await fetch(
            `http://localhost:8082/api/products/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok) throw new Error("Failed to fetch product");
          const product = await response.json();
          currentProductId = product.id;
          document.getElementById("productId").value = product.id;
          document.getElementById("name").value = product.name || "";
          document.getElementById("description").value =
            product.description || "";
          document.getElementById("actualPrice").value =
            product.actualPrice || 0;
          document.getElementById("mrp").value = product.mrp || 0;
          document.getElementById("margin").value = product.margin || 0;
          document.getElementById("thumbnailUrl").value =
            product.thumbnailUrl || "";
          document.getElementById("sku").value = product.sku || "";
          document.getElementById("isActive").value = product.isActive
            ? "true"
            : "false";
          document.getElementById("inStock").value = product.inStock
            ? "true"
            : "false";
          document.getElementById("quantity").value =
            product.inventory?.quantity ?? 0;
          document.getElementById("lowStockThreshold").value =
            product.inventory?.lowStockThreshold ?? 10;
          document.getElementById("categoryId").value =
            product.category?.id || "";
          await loadSubcategories();
          document.getElementById("subcategoryId").value =
            product.subcategory?.id || "";
          document.getElementById("productModalTitle").textContent =
            "Edit Product";
          document.getElementById("addVariantBtn").disabled = false;
          document.getElementById("addImageBtn").disabled = false;
          await fetchVariants(product.id);
          await fetchImages(product.id);
          new bootstrap.Modal(document.getElementById("productModal")).show();
        } catch (error) {
          showAlert("Error loading product: " + error.message, "danger");
        }
      }

      async function deleteProduct(id) {
        if (!(await checkAuth())) return;
        const token = localStorage.getItem("accessToken");
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
          const response = await fetch(
            `http://localhost:8082/api/sellers/products/${id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok) throw new Error("Failed to delete product");
          showAlert("Product deleted successfully!", "success");
          await fetchProducts();
        } catch (error) {
          showAlert(`Error deleting product: ${error.message}`, "danger");
        }
      }

      function openVariantModal(variantId, variantType) {
        if (!currentProductId) {
          showAlert(
            "Please save the product before adding variants.",
            "danger"
          );
          return;
        }
        document.getElementById("variantForm").reset();
        document.getElementById("variantId").value = variantId || "";
        document.getElementById("variantModalTitle").textContent = variantId
          ? "Edit Variant"
          : "Add Variant";
        document.getElementById("variantType").value = variantType || "";
        document
          .getElementById("variantType")
          .classList.remove("is-invalid");
        new bootstrap.Modal(document.getElementById("variantModal")).show();
      }

      function openVariantValueModal(valueId, variantId, variantType) {
        if (!currentProductId) {
          showAlert(
            "Please save the product before adding variant values.",
            "danger"
          );
          return;
        }
        // Ensure product modal is open
        const productModal = document.getElementById("productModal");
        const productModalInstance = bootstrap.Modal.getInstance(productModal) || new bootstrap.Modal(productModal);
        if (!productModal.classList.contains("show")) {
          productModalInstance.show();
        }
        document.getElementById("variantValueForm").reset();
        document.getElementById("variantValueId").value = valueId || "";
        document.getElementById("variantValueVariantId").value = variantId;
        document.getElementById(
          "variantValueModalTitle"
        ).textContent = valueId
          ? `Edit Value for ${variantType}`
          : `Add Values for ${variantType}`;
        document.getElementById("variantValue").value = "";
        document
          .getElementById("variantValue")
          .classList.remove("is-invalid");
        new bootstrap.Modal(document.getElementById("variantValueModal")).show();
      }

      async function editVariant(variantId, variantType) {
        openVariantModal(variantId, variantType);
      }

      async function editVariantValues(variantId, variantType) {
        if (!currentProductId) {
          showAlert(
            "Please save the product before editing variant values.",
            "danger"
          );
          return;
        }
        const token = localStorage.getItem("accessToken");
        try {
          const response = await fetch(
            `http://localhost:8082/api/variants/${variantId}/values`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok) throw new Error("Failed to fetch variant values");
          const values = await response.json();
          if (values.length === 0) {
            showAlert("No values found for this variant.", "danger");
            return;
          }
          const value = values[0]; // Edit the first value for simplicity
          openVariantValueModal(value.id, variantId, variantType);
          document.getElementById("variantValue").value = value.value;
        } catch (error) {
          showAlert(`Error loading variant values: ${error.message}`, "danger");
        }
      }

      async function deleteVariant(id) {
        if (!(await checkAuth())) return;
        const token = localStorage.getItem("accessToken");
        if (!confirm("Are you sure you want to delete this variant?")) return;
        try {
          const response = await fetch(
            `http://localhost:8082/api/variants/${id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok) throw new Error("Failed to delete variant");
          showAlert("Variant deleted successfully!", "success");
          await fetchVariants(currentProductId);
        } catch (error) {
          showAlert(`Error deleting variant: ${error.message}`, "danger");
        }
      }

      function openImageModal(image) {
        if (!currentProductId) {
          showAlert("Please save the product before adding images.", "danger");
          return;
        }
        document.getElementById("imageForm").reset();
        document.getElementById("imageId").value = "";
        document.getElementById("imageModalTitle").textContent = "Add Image";
        document.getElementById("imageUrl").classList.remove("is-invalid");
        if (image) {
          document.getElementById("imageId").value = image.id;
          document.getElementById("imageUrl").value = image.imageUrl;
          document.getElementById("imageModalTitle").textContent = "Edit Image";
        }
        new bootstrap.Modal(document.getElementById("imageModal")).show();
      }

      async function editImage(image) {
        openImageModal(image);
      }

      async function deleteImage(id) {
        if (!(await checkAuth())) return;
        const token = localStorage.getItem("accessToken");
        if (!confirm("Are you sure you want to delete this image?")) return;
        try {
          const response = await fetch(
            `http://localhost:8082/api/sellers/products/images/${id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok) throw new Error("Failed to delete image");
          showAlert("Image deleted successfully!", "success");
          await fetchImages(currentProductId);
        } catch (error) {
          showAlert(`Error deleting image: ${error.message}`, "danger");
        }
      }

      window.onload = async () => {
        loadTheme();
        await fetchCategories();
        await fetchProducts();
      };