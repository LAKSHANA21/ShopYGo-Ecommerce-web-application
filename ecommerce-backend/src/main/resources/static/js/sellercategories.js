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

        document.getElementById("themeToggle").addEventListener("click", toggleTheme);

        // Logout
        function logout() {
            if (confirm("Are you sure you want to logout?")) {
                localStorage.clear();
                window.location.href = "/seller/login";
            }
        }

        // Alert
        function showAlert(message, type, elementId = "categoriesAlert") {
            const alert = document.getElementById(elementId);
            const icon = type === "success" ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-triangle"></i>';
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `${icon} ${message}`;
            alert.style.display = "block";
            alert.style.animation = "fadeIn 0.8s ease";
            setTimeout(() => (alert.style.display = "none"), 5000);
        }

        // Check Authentication
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

        // Fetch Categories
        let isFetchingCategories = false;
        async function fetchCategories() {
            if (isFetchingCategories) return;
            isFetchingCategories = true;
            if (!(await checkAuth())) {
                isFetchingCategories = false;
                return;
            }
            const token = localStorage.getItem("accessToken");
            try {
                const response = await fetch("http://localhost:8082/api/categories", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to fetch categories");
                }
                const categories = await response.json();
                const tbody = document.getElementById("categoriesTable");
                const categorySelect = document.getElementById("subcategoryCategoryId");
                tbody.innerHTML = "";
                categorySelect.innerHTML = '<option value="" disabled selected>Select category</option>';
                if (categories.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3">No categories found.</td></tr>';
                    return;
                }
                categories.forEach((c) => {
                    const row = `
                        <tr>
                            <td>${c.name || "N/A"}</td>
                            <td>${c.description || "N/A"}</td>
                            <td>
                                <button class="btn btn-warning btn-sm me-2" onclick="editCategory(${c.id}, '${c.name}', '${c.description || ''}')">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteCategory(${c.id})">Delete</button>
                            </td>
                        </tr>`;
                    tbody.innerHTML += row;
                    const option = document.createElement("option");
                    option.value = c.id;
                    option.textContent = c.name;
                    categorySelect.appendChild(option);
                });
                return categories;
            } catch (error) {
                console.error("Fetch categories error:", error);
                if (error.message.includes("401")) {
                    showAlert("Session expired. Please login again.", "danger");
                    setTimeout(() => (window.location.href = "sellerIndex.html"), 1000);
                } else {
                    showAlert(`Error loading categories: ${error.message}`, "danger");
                }
            } finally {
                isFetchingCategories = false;
            }
        }

        // Fetch Subcategories
        let isFetchingSubcategories = false;
        async function fetchSubcategories() {
            if (isFetchingSubcategories) return;
            isFetchingSubcategories = true;
            if (!(await checkAuth())) {
                isFetchingSubcategories = false;
                return;
            }
            const token = localStorage.getItem("accessToken");
            try {
                const response = await fetch("http://localhost:8082/api/categories/subcategories", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to fetch subcategories");
                }
                const subcategories = await response.json();
                const tbody = document.getElementById("subcategoriesTable");
                tbody.innerHTML = "";
                if (subcategories.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4">No subcategories found.</td></tr>';
                    return;
                }
                subcategories.forEach((s) => {
                    const row = `
                        <tr>
                            <td>${s.name || "N/A"}</td>
                            <td>${s.description || "N/A"}</td>
                            <td>${s.categoryName || "N/A"}</td>
                            <td>
                                <button class="btn btn-warning btn-sm me-2" onclick="editSubcategory(${s.id}, '${s.name}', '${s.description || ''}', ${s.categoryId})">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteSubcategory(${s.id})">Delete</button>
                            </td>
                        </tr>`;
                    tbody.innerHTML += row;
                });
            } catch (error) {
                console.error("Fetch subcategories error:", error);
                if (error.message.includes("401")) {
                    showAlert("Session expired. Please login again.", "danger", "subcategoriesAlert");
                    setTimeout(() => (window.location.href = "sellerIndex.html"), 1000);
                } else {
                    showAlert(`Error loading subcategories: ${error.message}`, "danger", "subcategoriesAlert");
                }
            } finally {
                isFetchingSubcategories = false;
            }
        }

        // Reset Category Form
        function resetCategoryForm() {
            document.getElementById("categoryForm").reset();
            document.getElementById("categoryId").value = "";
            document.getElementById("categoryModalTitle").textContent = "Add Category";
            document.getElementById("categoryName").classList.remove("is-invalid");
        }

        // Reset Subcategory Form
        function resetSubcategoryForm() {
            document.getElementById("subcategoryForm").reset();
            document.getElementById("subcategoryId").value = "";
            document.getElementById("subcategoryModalTitle").textContent = "Add Subcategory";
            document.getElementById("subcategoryName").classList.remove("is-invalid");
            document.getElementById("subcategoryCategoryId").classList.remove("is-invalid");
        }

        // Save/Update Category
        document.getElementById("categoryForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!(await checkAuth())) return;
            const token = localStorage.getItem("accessToken");
            const categoryId = document.getElementById("categoryId").value;
            const category = {
                name: document.getElementById("categoryName").value.trim(),
                description: document.getElementById("categoryDescription").value.trim(),
            };
            if (!category.name) {
                document.getElementById("categoryName").classList.add("is-invalid");
                showAlert("Category name is required.", "danger");
                return;
            }
            document.getElementById("categoryName").classList.remove("is-invalid");
            try {
                const url = categoryId ? `http://localhost:8082/api/categories/${categoryId}` : "http://localhost:8082/api/categories";
                const method = categoryId ? "PUT" : "POST";
                const response = await fetch(url, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(category),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to ${categoryId ? "update" : "add"} category`);
                }
                showAlert(`Category ${categoryId ? "updated" : "added"} successfully!`, "success");
                document.getElementById("categoryForm").reset();
                bootstrap.Modal.getInstance(document.getElementById("categoryModal")).hide();
                await fetchCategories();
                await fetchSubcategories();
            } catch (error) {
                console.error("Save category error:", error);
                if (error.message.includes("401")) {
                    showAlert("Session expired. Please login again.", "danger");
                    setTimeout(() => (window.location.href = "sellerIndex.html"), 1000);
                } else {
                    showAlert(`Error ${categoryId ? "updating" : "adding"} category: ${error.message}`, "danger");
                }
            }
        });

        // Save/Update Subcategory
        document.getElementById("subcategoryForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!(await checkAuth())) return;
            const token = localStorage.getItem("accessToken");
            const subcategoryId = document.getElementById("subcategoryId").value;
            const categoryId = document.getElementById("subcategoryCategoryId").value;
            const subcategory = {
                name: document.getElementById("subcategoryName").value.trim(),
                description: document.getElementById("subcategoryDescription").value.trim(),
                categoryId: parseInt(categoryId),
            };
            let isValid = true;
            if (!subcategory.name) {
                document.getElementById("subcategoryName").classList.add("is-invalid");
                isValid = false;
            } else {
                document.getElementById("subcategoryName").classList.remove("is-invalid");
            }
            if (!categoryId) {
                document.getElementById("subcategoryCategoryId").classList.add("is-invalid");
                isValid = false;
            } else {
                document.getElementById("subcategoryCategoryId").classList.remove("is-invalid");
            }
            if (!isValid) {
                showAlert("Subcategory name and category are required.", "danger", "subcategoriesAlert");
                return;
            }
            try {
                const url = subcategoryId ? `http://localhost:8082/api/categories/subcategories/${subcategoryId}` : `http://localhost:8082/api/categories/${categoryId}/subcategories`;
                const method = subcategoryId ? "PUT" : "POST";
                const response = await fetch(url, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(subcategory),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to ${subcategoryId ? "update" : "add"} subcategory`);
                }
                showAlert(`Subcategory ${subcategoryId ? "updated" : "added"} successfully!`, "success", "subcategoriesAlert");
                document.getElementById("subcategoryForm").reset();
                bootstrap.Modal.getInstance(document.getElementById("subcategoryModal")).hide();
                await fetchSubcategories();
            } catch (error) {
                console.error("Save subcategory error:", error);
                if (error.message.includes("401")) {
                    showAlert("Session expired. Please login again.", "danger", "subcategoriesAlert");
                    setTimeout(() => (window.location.href = "sellerIndex.html"), 1000);
                } else {
                    showAlert(`Error ${subcategoryId ? "updating" : "adding"} subcategory: ${error.message}`, "danger", "subcategoriesAlert");
                }
            }
        });

        // Edit Category
        function editCategory(id, name, description) {
            document.getElementById("categoryId").value = id;
            document.getElementById("categoryName").value = name;
            document.getElementById("categoryDescription").value = description;
            document.getElementById("categoryModalTitle").textContent = "Edit Category";
            document.getElementById("categoryName").classList.remove("is-invalid");
            new bootstrap.Modal(document.getElementById("categoryModal")).show();
        }

        // Delete Category
        async function deleteCategory(id) {
            if (!(await checkAuth())) return;
            const token = localStorage.getItem("accessToken");
            if (!confirm("Are you sure you want to delete this category?")) return;
            try {
                const response = await fetch(`http://localhost:8082/api/categories/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to delete category");
                }
                showAlert("Category deleted successfully!", "success");
                await fetchCategories();
                await fetchSubcategories();
            } catch (error) {
                console.error("Delete category error:", error);
                if (error.message.includes("401")) {
                    showAlert("Session expired. Please login again.", "danger");
                    setTimeout(() => (window.location.href = "sellerIndex.html"), 1000);
                } else {
                    showAlert(`Error deleting category: ${error.message}`, "danger");
                }
            }
        }

        // Edit Subcategory
        function editSubcategory(id, name, description, categoryId) {
            document.getElementById("subcategoryId").value = id;
            document.getElementById("subcategoryName").value = name;
            document.getElementById("subcategoryDescription").value = description;
            document.getElementById("subcategoryCategoryId").value = categoryId;
            document.getElementById("subcategoryModalTitle").textContent = "Edit Subcategory";
            document.getElementById("subcategoryName").classList.remove("is-invalid");
            document.getElementById("subcategoryCategoryId").classList.remove("is-invalid");
            new bootstrap.Modal(document.getElementById("subcategoryModal")).show();
        }

        // Delete Subcategory
        async function deleteSubcategory(id) {
            if (!(await checkAuth())) return;
            const token = localStorage.getItem("accessToken");
            if (!confirm("Are you sure you want to delete this subcategory?")) return;
            try {
                const response = await fetch(`http://localhost:8082/api/categories/subcategories/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to delete subcategory");
                }
                showAlert("Subcategory deleted successfully!", "success", "subcategoriesAlert");
                await fetchSubcategories();
            } catch (error) {
                console.error("Delete subcategory error:", error);
                if (error.message.includes("401")) {
                    showAlert("Session expired. Please login again.", "danger", "subcategoriesAlert");
                    setTimeout(() => (window.location.href = "sellerIndex.html"), 1000);
                } else {
                    showAlert(`Error deleting subcategory: ${error.message}`, "danger", "subcategoriesAlert");
                }
            }
        }

        // Initial Load
        window.onload = async () => {
            loadTheme();
            await fetchCategories();
            await fetchSubcategories();
        };