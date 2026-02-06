/* =============================
   Helpers
============================= */
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function nowText() {
  return new Date().toLocaleString();
}
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function qs(id){ return document.getElementById(id); }

/* =============================
   Data
============================= */
const STALLS = [
  { id:"stall_ah_hock", name:"Ah Hock Chicken Rice", cuisine:["Chinese"], ratingHint:"Fast & popular" },
  { id:"stall_mala", name:"Xiao La Mala", cuisine:["Chinese","Spicy"], ratingHint:"Mala bowl" },
  { id:"stall_prata", name:"Ravi Prata House", cuisine:["Indian"], ratingHint:"Crispy prata" }
];

const MENU_BY_STALL = {
  stall_ah_hock: [
    { id:"chicken_rice", name:"Chicken Rice", price:5.00, cuisine:"Chinese" },
    { id:"roast_pork", name:"Roasted Pork Rice", price:5.50, cuisine:"Chinese" },
    { id:"wanton_noodles", name:"Wanton Noodles", price:4.50, cuisine:"Noodles" }
  ],
  stall_mala: [
    { id:"mala_bowl", name:"Mala Bowl", price:6.50, cuisine:"Spicy" },
    { id:"mala_noodles", name:"Mala Noodles", price:5.80, cuisine:"Spicy" },
    { id:"ice_lemon_tea", name:"Ice Lemon Tea", price:2.00, cuisine:"Drink" }
  ],
  stall_prata: [
    { id:"plain_prata", name:"Plain Prata", price:1.50, cuisine:"Indian" },
    { id:"egg_prata", name:"Egg Prata", price:2.20, cuisine:"Indian" },
    { id:"teh_tarikk", name:"Teh Tarik", price:1.80, cuisine:"Drink" }
  ]
};

/* =============================
   Language (simple)
============================= */
let lang = load("lang", "en");
const I18N = {
  en: {
    appTitle:"Hawker Hub",
    homeTitle:"Home / Stall List",
    searchPH:"Search stalls...",
    view:"View",
    stallDetail:"Stall Detail",
    selectStall:"Select Stall",
    menu:"Menu Items",
    topLiked:"Top Liked Items",
    feedback:"Feedback (Ratings + Comments)",
    submitReview:"Submit Review",
    rating:"Rating (1–5)",
    comment:"Comment",
    reviews:"Customer Reviews",
    complaints:"Report an Issue (Complaint)",
    submitComplaint:"Submit Complaint",
    issueType:"Issue Type",
    details:"Complaint Details",
    complaintHistory:"Complaint History",
    loyalty:"Rewards / Points",
    earn10:"+ Earn 10 pts",
    redeem50:"Redeem 50 pts",
    promo:"Promo Notification",
    subscribe:"Subscribe to promotions",
    addPromo:"Add Promo",
    reportPage:"Report Page",
    goReport:"Go to Report Page",
    tracking:"Order Tracking",
    goTracking:"Go to Tracking Page",
    newOrder:"Create New Order",
    advance:"Advance Status",
    reset:"Reset Order",
    payment:"Payment info & amount",
    reward:"Any reward earned"
  },
  zh: {
    appTitle:"小贩中心",
    homeTitle:"首页 / 摊位列表",
    searchPH:"搜索摊位...",
    view:"查看",
    stallDetail:"摊位详情",
    selectStall:"选择摊位",
    menu:"菜单",
    topLiked:"最受欢迎",
    feedback:"反馈（评分+评论）",
    submitReview:"提交评论",
    rating:"评分（1–5）",
    comment:"评论",
    reviews:"顾客评论",
    complaints:"提交投诉",
    submitComplaint:"提交投诉",
    issueType:"问题类型",
    details:"投诉内容",
    complaintHistory:"投诉记录",
    loyalty:"积分/奖励",
    earn10:"+ 获得10积分",
    redeem50:"兑换50积分",
    promo:"促销通知",
    subscribe:"订阅促销",
    addPromo:"添加促销",
    reportPage:"投诉页面",
    goReport:"前往投诉页面",
    tracking:"订单追踪",
    goTracking:"前往追踪页面",
    newOrder:"创建新订单",
    advance:"推进状态",
    reset:"重置订单",
    payment:"付款信息和金额",
    reward:"获得的奖励"
  }
};

function applyLang(){
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    const txt = I18N[lang]?.[key];
    if (txt) el.textContent = txt;
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{
    const key = el.getAttribute("data-i18n-ph");
    const txt = I18N[lang]?.[key];
    if (txt) el.setAttribute("placeholder", txt);
  });
  save("lang", lang);
}
function setupLangToggle(){
  const btn = qs("langToggle");
  if (!btn) return;
  btn.addEventListener("click", ()=>{
    lang = (lang === "en") ? "zh" : "en";
    applyLang();
  });
}

/* =============================
   Shared State
============================= */
let currentStallId = localStorage.getItem("currentStallId") || STALLS[0].id;

// per-stall likes structure: likesByStall[stallId][itemId] = {count, likedByMe}
let likesByStall = load("likesByStall", {});
// reviews: [{stallId, rating, comment, date, ts}]
let reviews = load("reviews", []);
// complaints: [{stallId, issue, details, status, date, ts}]
let complaints = load("complaints", []);
// loyalty (global)
let loyalty = load("loyalty", { points: 0 });
// promo state per stall
let promoByStall = load("promoByStall", {}); // {stallId:{subscribed, activePromo}}
// order tracking (global mock)
let orderTracking = load("orderTracking", { orderId:"", statusIndex:-1 });

function ensurePromo(stallId){
  if (!promoByStall[stallId]) promoByStall[stallId] = { subscribed:false, activePromo:"" };
}
function ensureLikes(stallId){
  if (!likesByStall[stallId]) likesByStall[stallId] = {};
}
function ensureLikeEntry(stallId, itemId){
  ensureLikes(stallId);
  if (!likesByStall[stallId][itemId]) likesByStall[stallId][itemId] = { count:0, likedByMe:false };
}

/* =============================
   HOME page
============================= */
function initHome(){
  const list = qs("stallCards");
  if (!list) return;

  const search = qs("searchInput");
  const render = () => {
    const q = (search?.value || "").toLowerCase().trim();
    list.innerHTML = "";
    const filtered = STALLS.filter(s => s.name.toLowerCase().includes(q));
    filtered.forEach(s=>{
      const avg = calcAvgRating(s.id);
      const div = document.createElement("div");
      div.className = "stall-card";
      div.innerHTML = `
        <div class="stall-img"></div>
        <div>
          <h3 class="stall-name">${escapeHtml(s.name)}</h3>
          <div class="tags">
            ${s.cuisine.map(c=>`<span class="tag">${escapeHtml(c)}</span>`).join("")}
            <span class="tag">⭐ ${avg.toFixed(1)}</span>
          </div>
          <div class="muted small">${escapeHtml(s.ratingHint)}</div>
        </div>
        <button class="btn btn-primary" data-view="${s.id}">${I18N[lang].view}</button>
      `;
      list.appendChild(div);
    });
  };

  if (search) search.addEventListener("input", render);

  document.addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-view]");
    if (!btn) return;
    const stallId = btn.getAttribute("data-view");
    currentStallId = stallId;
    localStorage.setItem("currentStallId", currentStallId);
    window.location.href = "stall.html";
  });

  render();
}

/* =============================
   Stall selector + header
============================= */
function initStallSelector(){
  const select = qs("stallSelect");
  const nameEl = qs("stallName");
  if (!select || !nameEl) return;

  select.innerHTML = "";
  STALLS.forEach(s=>{
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    if (s.id === currentStallId) opt.selected = true;
    select.appendChild(opt);
  });

  const updateName = () => {
    const found = STALLS.find(s=>s.id===currentStallId);
    nameEl.textContent = found ? found.name : "Selected Stall";
  };
  updateName();

  select.addEventListener("change", ()=>{
    currentStallId = select.value;
    localStorage.setItem("currentStallId", currentStallId);
    updateName();
    renderAllStallSections();
  });
}

/* =============================
   Menu + Likes
============================= */
function renderMenu(){
  const list = qs("menuList");
  if (!list) return;

  const items = MENU_BY_STALL[currentStallId] || [];
  list.innerHTML = "";

  items.forEach(item=>{
    ensureLikeEntry(currentStallId, item.id);
    const entry = likesByStall[currentStallId][item.id];

    const div = document.createElement("div");
    div.className = "menu-item";
    div.innerHTML = `
      <div class="menu-left">
        <div class="menu-title">${escapeHtml(item.name)}</div>
        <div class="menu-meta">${escapeHtml(item.cuisine)} • $${item.price.toFixed(2)}</div>
      </div>

      <div class="like">
        <span class="heart ${entry.likedByMe ? "liked":""}" data-like="${item.id}">♥</span>
        <span class="like-count">${entry.count}</span>
      </div>
    `;
    list.appendChild(div);
  });

  save("likesByStall", likesByStall);
  renderTopLiked();
}

function renderTopLiked(){
  const box = qs("topLikedList");
  if (!box) return;

  const items = MENU_BY_STALL[currentStallId] || [];
  ensureLikes(currentStallId);
  const map = likesByStall[currentStallId];

  const ranked = items
    .map(i=>({name:i.name, id:i.id, count:(map[i.id]?.count||0)}))
    .sort((a,b)=>b.count-a.count)
    .slice(0,3)
    .filter(x=>x.count>0);

  box.textContent = ranked.length ? ranked.map(x=>`${x.name} (${x.count})`).join(" • ") : "—";
}

function initLikesClick(){
  document.addEventListener("click",(e)=>{
    const t = e.target.closest("[data-like]");
    if (!t) return;
    const itemId = t.getAttribute("data-like");
    ensureLikeEntry(currentStallId, itemId);

    const entry = likesByStall[currentStallId][itemId];
    // toggle like
    if (entry.likedByMe) {
      entry.likedByMe = false;
      entry.count = Math.max(0, entry.count - 1);
    } else {
      entry.likedByMe = true;
      entry.count += 1;
    }

    save("likesByStall", likesByStall);
    renderMenu();
  });

  const resetBtn = qs("resetLikesBtn");
  if (resetBtn){
    resetBtn.addEventListener("click", ()=>{
      likesByStall[currentStallId] = {};
      save("likesByStall", likesByStall);
      renderMenu();
    });
  }
}

/* =============================
   Reviews
============================= */
function calcAvgRating(stallId){
  const rs = reviews.filter(r=>r.stallId===stallId);
  if (rs.length===0) return 0;
  const total = rs.reduce((s,r)=>s+r.rating,0);
  return total/rs.length;
}

function renderReviews(){
  const list = qs("reviewsList");
  if (!list) return;

  const avgEl = qs("avgRating");
  const countEl = qs("reviewCount");
  const sort = qs("sortReviews");

  const rs = reviews.filter(r=>r.stallId===currentStallId);
  const avg = rs.length ? (rs.reduce((s,r)=>s+r.rating,0)/rs.length) : 0;

  if (avgEl) avgEl.textContent = `⭐ ${avg.toFixed(1)}`;
  if (countEl) countEl.textContent = `${rs.length} reviews`;

  const mode = sort ? sort.value : "latest";
  const sorted = [...rs].sort((a,b)=>{
    if (mode==="highest") return b.rating-a.rating;
    if (mode==="lowest") return a.rating-b.rating;
    return (b.ts||0)-(a.ts||0);
  });

  list.innerHTML = "";
  if (sorted.length===0){
    list.innerHTML = `<div class="muted small">No reviews yet.</div>`;
    return;
  }

  sorted.forEach(r=>{
    const div = document.createElement("div");
    div.className = "review-card";
    div.innerHTML = `
      <div class="review-top">
        <div class="review-stars">⭐ ${r.rating}</div>
        <div class="muted small">${escapeHtml(r.date)}</div>
      </div>
      <div class="review-text">${escapeHtml(r.comment)}</div>
    `;
    list.appendChild(div);
  });
}

function initReviewForm(){
  const form = qs("reviewForm");
  if (!form) return;

  const ratingInput = qs("ratingInput");
  const commentInput = qs("commentInput");
  const sort = qs("sortReviews");
  const clearBtn = qs("clearReviewsBtn");

  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const rating = Number(ratingInput.value);
    const comment = commentInput.value.trim();

    if (!Number.isFinite(rating) || rating<1 || rating>5){
      alert("Rating must be 1 to 5.");
      return;
    }
    if (!comment){
      alert("Comment cannot be empty.");
      return;
    }

    reviews.push({ stallId:currentStallId, rating, comment, date:nowText(), ts:Date.now() });
    save("reviews", reviews);

    ratingInput.value = "";
    commentInput.value = "";
    renderReviews();
  });

  if (sort) sort.addEventListener("change", renderReviews);

  if (clearBtn){
    clearBtn.addEventListener("click", ()=>{
      reviews = reviews.filter(r=>r.stallId!==currentStallId);
      save("reviews", reviews);
      renderReviews();
    });
  }
}

/* =============================
   Promo (per stall)
============================= */
function renderPromo(){
  const banner = qs("promoBanner");
  const promoText = qs("promoText");
  const subscribe = qs("promoSubscribe");
  if (!banner || !promoText || !subscribe) return;

  ensurePromo(currentStallId);
  const st = promoByStall[currentStallId];

  subscribe.checked = !!st.subscribed;
  banner.hidden = !(st.activePromo && st.activePromo.trim());
  promoText.textContent = st.activePromo || "";
}

function initPromo(){
  const subscribe = qs("promoSubscribe");
  const input = qs("promoInput");
  const addBtn = qs("addPromoBtn");
  if (!subscribe || !input || !addBtn) return;

  subscribe.addEventListener("change", ()=>{
    ensurePromo(currentStallId);
    promoByStall[currentStallId].subscribed = subscribe.checked;
    save("promoByStall", promoByStall);
    renderPromo();
  });

  addBtn.addEventListener("click", ()=>{
    const text = input.value.trim();
    if (!text) return;

    ensurePromo(currentStallId);
    promoByStall[currentStallId].activePromo = text;
    save("promoByStall", promoByStall);

    input.value = "";
    renderPromo();
  });
}

/* =============================
   Loyalty
============================= */
function renderLoyalty(msg="", ok=true){
  const pointsEl = qs("pointsText");
  const msgEl = qs("loyaltyMsg");
  if (!pointsEl || !msgEl) return;

  pointsEl.textContent = `${loyalty.points} pts`;

  if (!msg){
    msgEl.hidden = true;
    return;
  }
  msgEl.hidden = false;
  msgEl.textContent = msg;
  msgEl.style.borderColor = ok ? "rgba(22,163,74,.35)" : "rgba(220,38,38,.35)";
}

function initLoyalty(){
  const earn = qs("earnPointsBtn");
  const redeem = qs("redeemBtn");
  if (!earn || !redeem) return;

  earn.addEventListener("click", ()=>{
    loyalty.points += 10;
    save("loyalty", loyalty);
    renderLoyalty("You earned 10 points!", true);
  });

  redeem.addEventListener("click", ()=>{
    if (loyalty.points < 50){
      renderLoyalty("Not enough points. Need 50 points.", false);
      return;
    }
    loyalty.points -= 50;
    save("loyalty", loyalty);
    renderLoyalty("Redeemed 50 points for a discount (simulated).", true);
  });
}

/* =============================
   Complaints
============================= */
function renderComplaints(){
  const list = qs("complaintsList");
  if (!list) return;

  const cs = complaints.filter(c=>c.stallId===currentStallId).slice().reverse();
  list.innerHTML = "";

  if (cs.length===0){
    list.innerHTML = `<div class="muted small">No complaints submitted.</div>`;
    return;
  }

  cs.forEach(c=>{
    const div = document.createElement("div");
    div.className = "review-card";
    const cls = c.status === "Resolved" ? "ok" : "warn";
    div.innerHTML = `
      <div class="review-top">
        <div>
          <strong>${escapeHtml(c.issue)}</strong>
          <span class="status ${cls}">${escapeHtml(c.status)}</span>
        </div>
        <div class="muted small">${escapeHtml(c.date)}</div>
      </div>
      <div class="review-text">${escapeHtml(c.details)}</div>
    `;
    list.appendChild(div);
  });
}

function initComplaintForm(){
  const form = qs("complaintForm");
  if (!form) return;

  const issue = qs("issueSelect");
  const details = qs("complaintInput");

  form.addEventListener("submit",(e)=>{
    e.preventDefault();

    const i = issue.value;
    const d = details.value.trim();
    if (!i) { alert("Please select issue type."); return; }
    if (!d) { alert("Please enter complaint details."); return; }

    complaints.push({
      stallId: currentStallId,
      issue: i,
      details: d,
      status: "Submitted",
      date: nowText(),
      ts: Date.now()
    });
    save("complaints", complaints);

    issue.value = "";
    details.value = "";
    renderComplaints();
  });

  const clearBtn = qs("clearComplaintsBtn");
  if (clearBtn){
    clearBtn.addEventListener("click", ()=>{
      complaints = complaints.filter(c=>c.stallId!==currentStallId);
      save("complaints", complaints);
      renderComplaints();
    });
  }
}

/* =============================
   Order Tracking (separate page)
============================= */
function renderTracking(){
  const idEl = qs("orderId");
  const statusEl = qs("orderStatus");
  if (!idEl || !statusEl) return;

  idEl.textContent = orderTracking.orderId || "—";
  statusEl.textContent = statusName(orderTracking.statusIndex);

  ["step0","step1","step2"].forEach((id,idx)=>{
    const el = qs(id);
    if (!el) return;
    el.classList.toggle("active", orderTracking.statusIndex >= idx && orderTracking.statusIndex !== -1);
  });
}

function statusName(idx){
  if (idx===0) return "Preparing";
  if (idx===1) return "Ready";
  if (idx===2) return "Completed";
  return "—";
}

function initTracking(){
  const newBtn = qs("newOrderBtn");
  const advBtn = qs("advanceStatusBtn");
  const resetBtn = qs("resetOrderBtn");
  if (!newBtn || !advBtn || !resetBtn) return;

  newBtn.addEventListener("click", ()=>{
    orderTracking.orderId = "ORD-" + Math.floor(1000 + Math.random()*9000);
    orderTracking.statusIndex = 0;
    save("orderTracking", orderTracking);
    renderTracking();
  });

  advBtn.addEventListener("click", ()=>{
    if (!orderTracking.orderId){ alert("Create a new order first."); return; }
    orderTracking.statusIndex = Math.min(2, orderTracking.statusIndex + 1);
    save("orderTracking", orderTracking);
    renderTracking();
  });

  resetBtn.addEventListener("click", ()=>{
    orderTracking = { orderId:"", statusIndex:-1 };
    save("orderTracking", orderTracking);
    renderTracking();
  });
}

/* =============================
   Re-render all stall sections
============================= */
function renderAllStallSections(){
  renderMenu();
  renderReviews();
  renderComplaints();
  renderPromo();
}

/* =============================
   Init per page
============================= */
document.addEventListener("DOMContentLoaded", ()=>{
  // topbar
  applyLang();
  setupLangToggle();

  // home
  initHome();

  // stall page
  initStallSelector();
  initLikesClick();
  initReviewForm();
  initPromo();
  initLoyalty();
  renderMenu();
  renderReviews();
  renderPromo();
  renderLoyalty();
  
  // report page
  initComplaintForm();
  renderComplaints();

  // tracking page
  initTracking();
  renderTracking();

  // update home view labels after language toggle (simple refresh)
  const langBtn = qs("langToggle");
  if (langBtn){
    langBtn.addEventListener("click", ()=>{
      // quick refresh for view buttons text
      const viewBtns = document.querySelectorAll("[data-view]");
      viewBtns.forEach(b=>b.textContent = I18N[lang].view);
      const homeTitle = qs("homeTitle");
      if (homeTitle) homeTitle.textContent = I18N[lang].homeTitle;
    });
  }
});
