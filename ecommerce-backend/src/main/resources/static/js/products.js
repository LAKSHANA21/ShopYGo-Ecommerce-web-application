const API_BASE_URL = "http://localhost:8082/api";

// State to track current filter and category for Suggested Items
let currentFilter = null;
let currentCategory = 'all';

// Alert function from backend
function showAlert(message, type) {
    const alert = document.getElementById("alert");
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.display = "block";
    setTimeout(() => (alert.style.display = "none"), 5000);
}

// Refresh token function from backend
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

// Check authentication status from backend
function checkAuth() {
    const accessToken = localStorage.getItem("accessToken");
    const authLink = document.getElementById("authLink");
    const authText = document.getElementById("authText");
    const logoutLink = document.getElementById("logoutLink");

    if (authLink && authText) {
        if (accessToken) {
            authText.textContent = "Logout";
            authLink.href = "#";
            authLink.onclick = null;
        } else {
            authText.textContent = "Login";
            authLink.href = "userIndex.html";
            authLink.onclick = null;
        }
    } else {
        console.warn("Authentication elements (authLink or authText) not found in the DOM.");
    }

    if (logoutLink) {
        logoutLink.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userId");
            localStorage.removeItem("cartId");
            window.location.href = "userIndex.html";
        };
    }

    return !!accessToken;
}

// Fetch products from backend
async function fetchProducts() {
    const loading = document.getElementById("loading");
    loading.style.display = "block";

    try {
        console.log("Fetching products from:", `${API_BASE_URL}/products`);
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });

        console.log("Response status:", response.status);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }

        const products = await response.json();
        console.log("Fetched products:", products);
        if (!Array.isArray(products)) {
            throw new Error("Expected an array of products");
        }

        if (products.length === 0) {
            showAlert("No products available at the moment.", "info");
        }

        return products;
    } catch (error) {
        console.error("Fetch products error:", error);
        showAlert(
            `Error fetching products: ${error.message}. Please check if the backend is running at ${API_BASE_URL}.`,
            "danger"
        );
        return [];
    } finally {
        loading.style.display = "none";
    }
}

// Add to cart function from backend
async function addToCart(productId, selectedVariants = {}) {
    const accessToken = localStorage.getItem("accessToken");
    const cartId = localStorage.getItem("cartId");
    const userId = localStorage.getItem("userId");

    if (!accessToken || !cartId || !userId) {
        showAlert("Please log in to add items to cart.", "danger");
        setTimeout(() => (window.location.href = "userIndex.html"), 1000);
        return;
    }

    const selectedVariantsArray = Object.values(selectedVariants).map(variant => ({
        variantId: parseInt(variant.id),
        variantValueId: parseInt(variant.valueId),
        variantValue: variant.value
    }));

    const requestBody = {
        productId: parseInt(productId),
        quantity: 1,
        selectedVariants: selectedVariantsArray
    };

    console.log("Sending add to cart request:", requestBody);

    try {
        let response = await fetch(`${API_BASE_URL}/cart/${cartId}/items`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(requestBody),
        });

        console.log("Add to cart response status:", response.status);
        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.warn("No JSON response body");
            data = {};
        }

        if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
                showAlert("Session expired. Please log in again.", "danger");
                setTimeout(() => (window.location.href = "userIndex.html"), 1000);
                return;
            }
            response = await fetch(`${API_BASE_URL}/cart/${cartId}/items`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${newToken}`,
                },
                body: JSON.stringify(requestBody),
            });
            try {
                data = await response.json();
            } catch (e) {
                console.warn("No JSON response body after token refresh");
                data = {};
            }
        }

        if (response.ok) {
            showAlert("Item added to cart!", "success");
        } else {
            console.error("Add to cart failed:", data);
            showAlert(
                data.message || "Failed to add item to cart.",
                "danger"
            );
        }
    } catch (error) {
        console.error("Add to cart error:", error);
        showAlert("Error adding item to cart: " + error.message, "danger");
    }
}

// Add to wishlist function from backend
async function addToWishlist(productId) {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
        showAlert("Please log in to add items to wishlist.", "danger");
        setTimeout(() => (window.location.href = "userIndex.html"), 1000);
        return;
    }

    try {
        let response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });

        console.log("Add to wishlist response status:", response.status);
        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.warn("No JSON response body");
            data = {};
        }

        if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
                showAlert("Session expired. Please log in again.", "danger");
                setTimeout(() => (window.location.href = "userIndex.html"), 1000);
                return;
            }
            response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
                method: "POST",
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
        }

        if (response.ok) {
            showAlert("Item added to wishlist!", "success");
        } else {
            console.error("Add to wishlist failed:", data);
            showAlert(
                data.message || "Failed to add item to wishlist.",
                "danger"
            );
        }
    } catch (error) {
        console.error("Add to wishlist error:", error);
        showAlert(
            "Error adding item to wishlist: " + error.message,
            "danger"
        );
    }
}

// Fetch reviews for a product
async function fetchReviews(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const reviews = await response.json();
        console.log("reviews",reviews);
        return reviews;
    } catch (error) {
        console.error("Fetch reviews error:", error);
        showAlert("Error fetching reviews: " + error.message, "danger");
        return [];
    }
}

// Fetch user's review for a product
async function fetchUserReview(productId, userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}/user/${userId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch user review error:", error);
        return null;
    }
}

// Submit or update a review
async function submitReview(productId, rating, comment) {
    const accessToken = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");
    if (!accessToken || !userId) {
        showAlert("Please log in to submit a review.", "danger");
        setTimeout(() => (window.location.href = "userIndex.html"), 1000);
        return;
    }

    try {
        let response = await fetch(`${API_BASE_URL}/reviews`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                productId: parseInt(productId),
                userId: parseInt(userId),
                rating: parseInt(rating),
                comment: comment,
            }),
        });

        if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
                showAlert("Session expired. Please log in again.", "danger");
                setTimeout(() => (window.location.href = "userIndex.html"), 1000);
                return;
            }
            response = await fetch(`${API_BASE_URL}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${newToken}`,
                },
                body: JSON.stringify({
                    productId: parseInt(productId),
                    userId: parseInt(userId),
                    rating: parseInt(rating),
                    comment: comment,
                }),
            });
        }

        if (response.ok) {
            showAlert("Review submitted successfully!", "success");
            return await response.json();
        } else {
            const data = await response.json();
            showAlert(data.message || "Failed to submit review.", "danger");
        }
    } catch (error) {
        console.error("Submit review error:", error);
        showAlert("Error submitting review: " + error.message, "danger");
    }
}

// Delete a review
async function deleteReview(reviewId) {
    const accessToken = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");
    if (!accessToken || !userId) {
        showAlert("Please log in to delete a review.", "danger");
        setTimeout(() => (window.location.href = "userIndex.html"), 1000);
        return;
    }

    try {
        let response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/user/${userId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status === 403) {
            const newToken = await refreshToken();
            if (!newToken) {
                showAlert("Session expired. Please log in again.", "danger");
                setTimeout(() => (window.location.href = "userIndex.html"), 1000);
                return;
            }
            response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/user/${userId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${newToken}`,
                },
            });
        }

        if (response.ok) {
            showAlert("Review deleted successfully!", "success");
        } else {
            const data = await response.json();
            showAlert(data.message || "Failed to delete review.", "danger");
        }
    } catch (error) {
        console.error("Delete review error:", error);
        showAlert("Error deleting review: " + error.message, "danger");
    }
}

// Function to create star rating HTML
function createStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star text-warning"></i>';
        } else {
            stars += '<i class="far fa-star text-muted"></i>';
        }
    }
    return stars;
}

// Function to create product card
function createProductCard(product) {
    const discount = product.mrp
        ? Math.round(((product.mrp - product.actualPrice) / product.mrp) * 100)
        : 0;
    const isLoggedIn = checkAuth();
    const imageUrl = product.thumbnailUrl || 'https://plus.unsplash.com/premium_photo-1682310093719-443b6fe140e8?q=80&w=2112&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
    const categoryName = product.category && product.category.name ? product.category.name : 'General';
    const description = product.description || 'No description available';
    const rating = product.averageRating ? product.averageRating.toFixed(1) : 'N/A';

    return `
        <div class="col-md-6 col-12 product-item" data-product-id="${product.id}">
            <!-- Image Container -->
            <div class="product-image-container">
                <img src="${imageUrl}" class="product-img" alt="${product.name}">
            </div>
            <!-- Product Details -->
            <div class="product-details mt-2">
                <h5 class="product-title">${product.name}</h5>
                <p class="product-text">
                    <span class="fw-bold">₹${product.actualPrice}</span>
                    ${product.mrp ? `<span class="text-muted text-decoration-line-through">₹${product.mrp}</span>` : ''}
                    ${discount > 0 ? `<span class="discount">(${discount}% OFF)</span>` : ''}
                </p>
                <a href="#" class="show-description-link" data-bs-toggle="modal" data-bs-target="#productModal${product.id}">Show More</a>
                <div class="d-flex gap-2 product-buttons">
                    <a href="#" class="btn btn-primary btn-sm btn-cart flex-grow-1 ${!isLoggedIn ? 'btn-disabled' : ''}" data-product-id="${product.id}" ${!isLoggedIn ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus me-1"></i> Add to Cart
                    </a>
                    <a href="#" class="btn btn-outline-primary btn-sm btn-wishlist ${!isLoggedIn ? 'btn-disabled' : ''}" data-product-id="${product.id}" ${!isLoggedIn ? 'disabled' : ''}>
                        <i class="fas fa-heart"></i>
                    </a>
                </div>
            </div>
            <!-- Product Modal -->
            <div class="modal fade" id="productModal${product.id}" tabindex="-1" aria-labelledby="productModalLabel${product.id}" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="productModalLabel${product.id}">${product.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body d-flex">
                            <!-- Left Side: Product Image -->
                            <div class="col-md-6 pe-3">
    <!-- Large Image -->
    <div class="main-image-container mb-3">
        <img src="${imageUrl}" class="img-fluid main-product-image" alt="${product.name}" id="mainImage${product.id}">
    </div>
    <!-- Thumbnail Carousel -->
    <div class="image-thumbnails d-flex flex-wrap gap-2" id="thumbnails${product.id}">
        <!-- Thumbnails will be populated dynamically -->
        <div class="text-center text-muted">Loading images...</div>
    </div>
</div>
                            <!-- Right Side: Details and Reviews -->
                            <div class="col-md-6 ps-3">
                                <p class="mb-2"><strong>Price:</strong> ₹${product.actualPrice} ${discount > 0 ? `(Save ${discount}%)` : ''}</p>
                                <p class="mb-2"><strong>Category:</strong> ${categoryName}</p>
                                <p class="mb-2"><strong>Description:</strong> ${description}</p>
                                <p class="mb-3"><strong>Rating:</strong> ${createStarRating(Math.round(rating))} (${rating} / 5)</p>
                                
                                <!-- Variants Section -->
                                <div class="product-variants mb-3">
                                    <h6>Options:</h6>
                                    <div class="variants-container">
                                        <div class="variants-loading text-center py-3">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Loading...</span>
                                            </div>
                                            <p class="mt-2">Loading options...</p>
                                        </div>
                                    </div>
                                    <div class="variant-selection-feedback mt-2 text-danger small"></div>
                                </div>

                                <!-- Reviews Section -->
                                <div class="reviews-section mt-4">
                                    <h6>Customer Reviews</h6>
                                    <div class="reviews-container"></div>
                                </div>

                                <!-- User Review Form -->
                                <div class="review-form mt-4 ${!isLoggedIn ? 'd-none' : ''}">
                                    <h6>Write a Review</h6>
                                    <div class="star-rating mb-3">
                                        <span class="star" data-value="1"><i class="far fa-star"></i></span>
                                        <span class="star" data-value="2"><i class="far fa-star"></i></span>
                                        <span class="star" data-value="3"><i class="far fa-star"></i></span>
                                        <span class="star" data-value="4"><i class="far fa-star"></i></span>
                                        <span class="star" data-value="5"><i class="far fa-star"></i></span>
                                    </div>
                                    <textarea class="form-control mb-2" rows="4" placeholder="Write your review..."></textarea>
                                    <button class="btn btn-primary btn-sm btn-submit-review" data-product-id="${product.id}">Submit Review</button>
                                    <button class="btn btn-outline-secondary btn-sm btn-cancel-edit d-none">Cancel</button>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary btn-cart-modal" data-product-id="${product.id}" ${!isLoggedIn ? 'disabled' : ''}>
                                <i class="fas fa-cart-plus me-1"></i> Add to Cart
                            </button>
                            <button type="button" class="btn btn-success btn-buy-now" data-product-id="${product.id}" ${!isLoggedIn ? 'disabled' : 'disabled'} style="display:none">
                                <i class="fas fa-shopping-bag me-1"></i> Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupProductImages(productId) {
    const modal = document.querySelector(`#productModal${productId}`);
    if (!modal) {
        console.error(`Modal for product ${productId} not found`);
        return;
    }
    const mainImage = modal.querySelector(`#mainImage${productId}`);
    const thumbnailsContainer = modal.querySelector(`#thumbnails${productId}`);

    async function fetchProductImages() {
        try {
            const response = await fetch(`${API_BASE_URL}/products/productImages/${productId}`, {
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const images = await response.json();
            return images;
        } catch (error) {
            console.error(`Error fetching images for product ${productId}:`, error);
            return [];
        }
    }

    async function renderThumbnails() {
        thumbnailsContainer.innerHTML = '<div class="text-center text-muted">Loading images...</div>';
        const images = await fetchProductImages();
        console.log(images);
        if (images.length === 0) {
            thumbnailsContainer.innerHTML = '<div class="text-muted">No additional images available.</div>';
            return;
        }
        thumbnailsContainer.innerHTML = images.map(image => `
            <img src="${image.imageUrl}" class="thumbnail-image" alt="Product image" style="width: 60px; height: 60px; object-fit: cover; cursor: pointer; border: 2px solid transparent;"
                 data-image-url="${image.imageUrl}">
        `).join('');

        // Add click handlers for thumbnails
        thumbnailsContainer.querySelectorAll('.thumbnail-image').forEach(thumb => {
            thumb.addEventListener('click', () => {
                mainImage.src = thumb.dataset.imageUrl;
                // Highlight selected thumbnail
                thumbnailsContainer.querySelectorAll('.thumbnail-image').forEach(t => {
                    t.style.border = '2px solid transparent';
                });
                thumb.style.border = '2px solid #007bff';
            });
        });
    }

    // Load images when modal is shown
    modal.addEventListener('shown.bs.modal', async () => {
        console.log(`Fetching images for product ${productId}`);
        await renderThumbnails();
    });
}

// Function to setup review functionality
function setupReviews(productId) {
    const modal = document.querySelector(`#productModal${productId}`);
    const reviewsContainer = modal.querySelector('.reviews-container');
    const reviewForm = modal.querySelector('.review-form');
    const starElements = modal.querySelectorAll('.star');
    const textarea = modal.querySelector('textarea');
    const submitButton = modal.querySelector('.btn-submit-review');
    const cancelButton = modal.querySelector('.btn-cancel-edit');
    let selectedRating = 0;
    let editingReviewId = null;

    // Star rating interaction
    starElements.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
            starElements.forEach(s => {
                const value = parseInt(s.dataset.value);
                s.innerHTML = value <= selectedRating ? '<i class="fas fa-star text-warning"></i>' : '<i class="far fa-star text-muted"></i>';
            });
        });
    });

    // Load reviews and user's review
    modal.addEventListener('show.bs.modal', async () => {
        reviewsContainer.innerHTML = '<p class="text-center">Loading reviews...</p>';
        console.log("prodid",productId);
        const reviews = await fetchReviews(productId);
        const userId = localStorage.getItem('userId');
        const userReview = userId ? await fetchUserReview(productId, userId) : null;

        // Render reviews
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="text-muted">No reviews yet.</p>';
        } else {
            reviewsContainer.innerHTML = reviews.map(review => `
                <div class="review mb-3 p-3 border rounded" data-review-id="${review.id}">
                    <div class="d-flex justify-content-between">
                        <div>
                            <strong>User ${review.userId}</strong>
                            <div>${createStarRating(review.rating)}</div>
                            <p class="mb-0">${review.comment || 'No comment'}</p>
                        </div>
                        ${userId && review.userId == userId ? `
                            <div>
                                <button class="btn btn-sm btn-outline-primary btn-edit-review me-1" data-review-id="${review.id}">Edit</button>
                                <button class="btn btn-sm btn-outline-danger btn-delete-review" data-review-id="${review.id}">Delete</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        // Setup user review form
        if (userReview) {
            selectedRating = userReview.rating;
            textarea.value = userReview.comment || '';
            submitButton.textContent = 'Update Review';
            editingReviewId = userReview.id;
            starElements.forEach(s => {
                const value = parseInt(s.dataset.value);
                s.innerHTML = value <= selectedRating ? '<i class="fas fa-star text-warning"></i>' : '<i class="far fa-star text-muted"></i>';
            });
        } else {
            selectedRating = 0;
            textarea.value = '';
            submitButton.textContent = 'Submit Review';
            editingReviewId = null;
            starElements.forEach(s => s.innerHTML = '<i class="far fa-star text-muted"></i>');
        }

        // Setup edit and delete buttons
        reviewsContainer.querySelectorAll('.btn-edit-review').forEach(btn => {
            btn.addEventListener('click', () => {
                const reviewId = btn.dataset.reviewId;
                const reviewDiv = btn.closest('.review');
                const comment = reviewDiv.querySelector('p').textContent;
                const rating = Array.from(reviewDiv.querySelectorAll('.fa-star.text-warning')).length;

                selectedRating = rating;
                textarea.value = comment === 'No comment' ? '' : comment;
                submitButton.textContent = 'Update Review';
                editingReviewId = reviewId;
                starElements.forEach(s => {
                    const value = parseInt(s.dataset.value);
                    s.innerHTML = value <= selectedRating ? '<i class="fas fa-star text-warning"></i>' : '<i class="far fa-star text-muted"></i>';
                });
                cancelButton.classList.remove('d-none');
            });
        });

        reviewsContainer.querySelectorAll('.btn-delete-review').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this review?')) {
                    await deleteReview(btn.dataset.reviewId);
                    setupReviews(productId); // Refresh reviews
                }
            });
        });
    });

    // Submit review
    submitButton.addEventListener('click', async () => {
        if (selectedRating === 0) {
            showAlert('Please select a rating.', 'danger');
            return;
        }
        await submitReview(productId, selectedRating, textarea.value);
        setupReviews(productId); // Refresh reviews
    });

    // Cancel edit
    cancelButton.addEventListener('click', () => {
        selectedRating = 0;
        textarea.value = '';
        submitButton.textContent = 'Submit Review';
        editingReviewId = null;
        starElements.forEach(s => s.innerHTML = '<i class="far fa-star text-muted"></i>');
        cancelButton.classList.add('d-none');
    });
}

// Function to setup product variants
function setupProductVariants(productId) {
    const modal = document.querySelector(`#productModal${productId}`);
    const variantsContainer = modal.querySelector('.variants-container');
    const feedbackContainer = modal.querySelector('.variant-selection-feedback');
    const addToCartBtn = modal.querySelector('.btn-cart-modal');
    const buyNowBtn = modal.querySelector('.btn-buy-now');

    modal.addEventListener('show.bs.modal', async function() {
        variantsContainer.innerHTML = `
            <div class="variants-loading text-center py-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading options...</p>
            </div>
        `;
        feedbackContainer.textContent = '';
        addToCartBtn.disabled = true;
        buyNowBtn.disabled = true;

        const maxRetries = 3;
        let retryCount = 0;

        async function fetchVariants() {
            try {
                const response = await fetch(`${API_BASE_URL}/products/${productId}/variants`, {
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const variants = await response.json();
                handleVariantsResponse(variants);
            } catch (error) {
                retryCount++;
                if (retryCount < maxRetries) {
                    setTimeout(fetchVariants, 1000 * retryCount);
                } else {
                    variantsContainer.innerHTML = `
                        <div class="alert alert-danger" role="alert">
                            Failed to load product options after ${maxRetries} attempts. Please try again later.
                        </div>
                    `;
                    addToCartBtn.disabled = false;
                    buyNowBtn.disabled = false;
                }
            }
        }

        function handleVariantsResponse(variants) {
            if (!Array.isArray(variants) || variants.length === 0) {
                variantsContainer.innerHTML = '<p class="text-muted">No options available for this product</p>';
                addToCartBtn.disabled = false;
                buyNowBtn.disabled = false;
                return;
            }

            let variantsHTML = '';
            variants.forEach(variant => {
                if (variant.values && variant.values.length > 0) {
                    variantsHTML += `
                    <div class="variant-group mb-3" role="group" aria-label="${variant.variantType} options">
                        <label class="form-label fw-bold">${variant.variantType}:</label>
                        <div class="variant-options d-flex flex-wrap gap-2 mt-2">`;
                    
                    variant.values.forEach(value => {
                        variantsHTML += `
                        <button type="button" 
                            class="btn btn-outline-primary btn-sm variant-option" 
                            data-variant-id="${variant.id}"
                            data-variant-type="${variant.variantType}" 
                            data-variant-value-id="${value.id}"
                            data-variant-value="${value.value}"
                            aria-label="Select ${variant.variantType} ${value.value}">
                            ${value.value}
                        </button>`;
                    });
                    
                    variantsHTML += `</div></div>`;
                }
            });

            variantsContainer.innerHTML = variantsHTML;
            
            const selectedVariants = {};
            
            const variantButtons = variantsContainer.querySelectorAll('.variant-option');
            variantButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const variantType = this.dataset.variantType;
                    const variantId = this.dataset.variantId;
                    const variantValue = this.dataset.variantValue;
                    const variantValueId = this.dataset.variantValueId;

                    const siblings = this.parentElement.querySelectorAll('.variant-option');
                    siblings.forEach(sib => {
                        sib.classList.remove('btn-primary');
                        sib.classList.add('btn-outline-primary');
                    });
                    this.classList.toggle('btn-primary');
                    this.classList.toggle('btn-outline-primary');

                    if (this.classList.contains('btn-primary')) {
                        selectedVariants[variantType] = {
                            id: variantId,
                            value: variantValue,
                            valueId: variantValueId
                        };
                    } else {
                        delete selectedVariants[variantType];
                    }

                    const requiredVariants = variants.map(v => v.variantType);
                    const missingVariants = requiredVariants.filter(v => !selectedVariants[v]);
                    
                    if (missingVariants.length > 0) {
                        feedbackContainer.textContent = `Please select: ${missingVariants.join(', ')}`;
                        addToCartBtn.disabled = true;
                        // buyNowBtn.disabled = true;
                    } else {
                        feedbackContainer.textContent = '';
                        addToCartBtn.disabled = false;
                        buyNowBtn.disabled = false;
                    }
                });
            });

            addToCartBtn.removeEventListener('click', handleAddToCart);
            addToCartBtn.addEventListener('click', handleAddToCart);
            function handleAddToCart() {
                if (variants.length > 0 && Object.keys(selectedVariants).length === 0) {
                    feedbackContainer.textContent = 'Please select options before adding to cart';
                    return;
                }
                addToCart(productId, selectedVariants);
                bootstrap.Modal.getInstance(modal).hide();
            }

            buyNowBtn.removeEventListener('click', handleBuyNow);
            buyNowBtn.addEventListener('click', handleBuyNow);
            function handleBuyNow() {
                if (variants.length > 0 && Object.keys(selectedVariants).length === 0) {
                    feedbackContainer.textContent = 'Please select options before proceeding to checkout';
                    return;
                }
                buyNow(productId, selectedVariants);
                bootstrap.Modal.getInstance(modal).hide();
            }
        }

        fetchVariants();
        setupReviews(productId);
    });
}

// Function to apply filters and sort products
function applyFilter(products, filterType) {
    let filteredProducts = [...products];
    switch (filterType) {
        case 'price-low-high':
            filteredProducts.sort((a, b) => a.actualPrice - b.actualPrice);
            break;
        case 'price-high-low':
            filteredProducts.sort((a, b) => b.actualPrice - a.actualPrice);
            break;
        case 'rating-high':
            filteredProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
            break;
        case 'discount':
            filteredProducts = filteredProducts.filter(p => p.mrp && p.mrp > p.actualPrice)
                                             .sort((a, b) => {
                                                 const discountA = ((a.mrp - a.actualPrice) / a.mrp) * 100;
                                                 const discountB = ((b.mrp - b.actualPrice) / b.mrp) * 100;
                                                 return discountB - discountA;
                                             });
            break;
        default:
            break;
    }
    return filteredProducts;
}

// Function to filter by category
function filterByCategory(products, category) {
    if (category === 'all') {
        return products;
    }
    return products.filter(p => p.category && p.category.name && p.category.name.toLowerCase() === category.toLowerCase());
}

// Function to render product section
function renderProductSection(containerId, products, category) {
    const container = document.getElementById(containerId);
    let html = products.map(createProductCard).join("");

    if (containerId !== "suggestedItems") {
        const initialProducts = products.slice(0, 2);
        const additionalProducts = products.slice(2);
        let isExpanded = false;

        function renderContent() {
            if (isExpanded) {
                html = products.map(createProductCard).join("") +
                       `<div class="col-12 text-center mt-3">
                            <button class="btn btn-outline-primary show-more-btn" data-container="${containerId}" data-category="${category}">
                                Show Less
                            </button>
                        </div>`;
            } else {
                html = initialProducts.map(createProductCard).join("") +
                       (additionalProducts.length > 0 ?
                           `<div class="col-12 text-center mt-3">
                                <button class="btn btn-outline-primary show-more-btn" data-container="${containerId}" data-category="${category}">
                                    Show More
                                </button>
                            </div>` : '');
            }

            container.innerHTML = html;

            container.querySelectorAll(".btn-cart").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    addToCart(btn.dataset.productId);
                });
            });
            container.querySelectorAll(".btn-wishlist").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    addToWishlist(btn.dataset.productId);
                });
            });

            const showMoreBtn = container.querySelector(".show-more-btn");
            if (showMoreBtn) {
                showMoreBtn.addEventListener("click", () => {
                    isExpanded = !isExpanded;
                    renderContent();
                });
            }

            products.forEach(product => {
    setupReviews(product.id);
    setupProductVariants(product.id);
    setupProductImages(product.id);
});
        }

        renderContent();
    } else {
        container.innerHTML = html;

        container.querySelectorAll(".btn-cart").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                addToCart(btn.dataset.productId);
            });
        });
        container.querySelectorAll(".btn-wishlist").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                addToWishlist(btn.dataset.productId);
            });
        });

        products.forEach(product => {
    setupReviews(product.id);
    setupProductVariants(product.id);
    setupProductImages(product.id);
});
    }
}

// Function to buy now (placeholder)
function buyNow(productId, selectedVariants) {
    showAlert("Proceeding to checkout...", "info");
    // Implement checkout logic here
}

// Function to render all content
async function renderContent(filterType = null, category = 'all') {
    if (filterType !== null) {
        currentFilter = filterType;
    }
    if (category !== null) {
        currentCategory = category;
    }

    let products = await fetchProducts();
    let suggestedProducts = [...products];
    suggestedProducts = filterByCategory(suggestedProducts, currentCategory);
    if (currentFilter) {
        suggestedProducts = applyFilter(suggestedProducts, currentFilter);
    }

    if (suggestedProducts.length === 0) {
        showAlert("No products match the selected filter or category in Suggested Items.", "info");
    }

    const recommended = products.filter(p => p.averageRating && p.averageRating >= 4);
    const discount = products.filter(p => p.mrp && p.mrp > p.actualPrice);

    const allProducts = [...products];
    if (recommended.length < 2 || discount.length < 2) {
        const shuffled = allProducts.sort(() => 0.5 - Math.random());
        const third = Math.floor(shuffled.length / 3);
        recommended.push(...shuffled.slice(0, third));
        discount.push(...shuffled.slice(third, 2 * third));
    }

    renderProductSection("suggestedItems", suggestedProducts, "suggested");
    renderProductSection("recommendedItems", recommended, "recommended");
    renderProductSection("discountItems", discount, "discount");
}

// Function to setup container animations
function setupContainerAnimations() {
    const containers = document.querySelectorAll(".product-section");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, { threshold: 0.2 });

    containers.forEach(container => observer.observe(container));
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

// Function to setup offcanvas behavior
function setupOffcanvas() {
    const offcanvasElement = document.getElementById('filterOffcanvas');
    const offcanvas = new bootstrap.Offcanvas(offcanvasElement);

    document.querySelectorAll('.filter-option').forEach(function(element) {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            const filterType = this.dataset.filter;
            renderContent(filterType, currentCategory);
            showAlert(`Filtered by ${this.textContent}`, 'info');
            offcanvas.hide();
        });
    });

    document.querySelectorAll('.category-option').forEach(function(element) {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.dataset.category;
            renderContent(currentFilter, category);
            showAlert(`Showing ${this.textContent} products`, 'info');
            offcanvas.hide();
        });
    });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    renderContent();
    setupContainerAnimations();
    setupNavbarSticky();
    initParticleAnimation();
    setupOffcanvas();

    const rippleButtons = document.querySelectorAll(".ripple-btn");
    rippleButtons.forEach(button => {
        button.addEventListener("click", createRipple);
    });

    const footer = document.getElementById("footer");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("animate-footer");
            }
        });
    }, { threshold: 0.2 });
    observer.observe(footer);
});