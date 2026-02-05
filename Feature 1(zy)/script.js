// =============================
// FEEDBACK & REVIEWS SYSTEM
// =============================

// Load existing reviews or start empty
let reviews = JSON.parse(localStorage.getItem("reviews")) || [];

// Get HTML elements
const reviewForm = document.getElementById("reviewForm");
const ratingInput = document.getElementById("ratingInput");
const commentInput = document.getElementById("commentInput");
const reviewsList = document.getElementById("reviewsList");
const avgRatingText = document.getElementById("avgRating");

// Save reviews to localStorage
function saveReviews() {
  localStorage.setItem("reviews", JSON.stringify(reviews));
}

// Display reviews and average rating
function renderReviews() {
  reviewsList.innerHTML = "";

  if (reviews.length === 0) {
    reviewsList.innerHTML = "<p>No reviews yet.</p>";
    avgRatingText.textContent = "⭐ Average Rating: 0";
    return;
  }

  let totalRating = 0;

  reviews.forEach((review) => {
    totalRating += review.rating;

    const reviewDiv = document.createElement("div");
    reviewDiv.innerHTML = `
      <p><strong>⭐ Rating:</strong> ${review.rating}</p>
      <p>${review.comment}</p>
      <small>${review.date}</small>
      <hr>
    `;
    reviewsList.appendChild(reviewDiv);
  });

  const avg = (totalRating / reviews.length).toFixed(1);
  avgRatingText.textContent = `⭐ Average Rating: ${avg}`;
}

// Handle form submit
reviewForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const rating = Number(ratingInput.value);
  const comment = commentInput.value.trim();

  if (rating < 1 || rating > 5 || comment === "") {
    alert("Please enter a valid rating (1–5) and comment.");
    return;
  }

  const newReview = {
    rating: rating,
    comment: comment,
    date: new Date().toLocaleString()
  };

  reviews.push(newReview);
  saveReviews();
  renderReviews();

  // Clear form
  ratingInput.value = "";
  commentInput.value = "";
});

// Run on page load
renderReviews();
