// app.js (MODULE VERSION)

// ===== Firebase feature APIs =====
import {
  listenReviews,
  addReview,
  listenComplaints,
  addComplaint,
  markComplaintResolved,
  listenMenuLikes,
  toggleLikeCount
} from "./engagement-firebase.js";

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
   Data (update this to match your team if needed)
============================= */
const STALLS = [
  { id:"S001", name:"Ah Hock Chicken Rice", cuisine:["Chinese"], unit:"#01-12", ratingHint:"Fast & popular" },
  { id:"S002", name:"Mdm Tan Noodles", cuisine:["Chinese"], unit:"#01-15", ratingHint:"Noodles" },
  { id:"S003", name:"Spice Corner", cuisine:["Indian"], unit:"#01-20", ratingHint:"Spicy" },
  { id:"S004", name:"Vegemania", cuisine:["Vegetarian"], unit:"#01-23", ratingHint:"Healthy" },
  { id:"S005", name:"Nasi Pandang", cuisine:["Indonesian"], unit:"#01-27", ratingHint:"Nasi" }
];

// ⚠️ Keep your own menu mapping; item.id must be stable for likes
const MENU_BY_STALL = {
  S001: [
    { id:"chicken_rice", name:"Chicken Rice", price:5.00, cuisine:"Chinese" },
    { id:"roast_pork", name:"Roasted Pork Rice", price:5.50, cuisine:"Chinese" }
  ],
  S002: [
    { id:"banmian", name:"Ban Mian", price:4.80, cuisine:"Chinese" },
    { id:"fishball_noodles", name:"Fishball Noodles", price:4.50, cuisine:"Chinese" }
  ],
  S003: [
    { id:"briyani", name:"Chicken Briyani", price:6.50, cuisine:"Indian" },
    { id:"prata_set", name:"Prata Set", price:4.20, cuisine:"Indian" }
  ],
  S004: [
    { id:"veggie_bowl", name:"Veggie Bowl", price:6.00, cuisine:"Vegetarian" },
    { id:"tofu_salad", name:"Tofu Salad", price:5.50, cuisine:"Vegetarian" }
  ],
  S005: [
    { id:"nasi_padang", name:"Nasi Padang", price:6.80, cuisine:"Indonesian" },
    { id:"rendang", name:"Beef Rendang Rice", price:7.50, cuisine:"Indonesian" }
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
    reward:"Any reward earned",

    backStall: "Stall",
    reportPageTitle: "Report Page",
    reportPageSubtitle: "Submit a complaint linked to the selected stall.",
    clearBtn: "Clear",
    selectIssue: "Select issue",
    priority: "Priority",
    priorityLow: "Low",
    priorityMed: "Medium",
    priorityHigh: "High",
    contactOptional: "Contact (Optional)",
    contactPH: "e.g. email / phone",
    detailsPH: "Describe your issue...",
    totalReports: "Total Reports",
    openReports: "Open",
    resolvedReports: "Resolved",
    myReportHistory: "My Report History",
    historySubtitle: "View your past reports for this stall.",
    filterAll: "Filter: All",
    filterSubmitted: "Submitted",
    filterResolved: "Resolved",
    markResolved: "Mark Latest as Resolved",
    historyNote: "(For demo) This button marks your most recent complaint as “Resolved”."
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
    reward:"获得的奖励",

    backStall: "摊位",
    reportPageTitle: "投诉页面",
    reportPageSubtitle: "提交与当前摊位关联的投诉。",
    clearBtn: "清空",
    selectIssue: "选择问题",
    priority: "优先级",
    priorityLow: "低",
    priorityMed: "中",
    priorityHigh: "高",
    contactOptional: "联系方式（可选）",
    contactPH: "例如：邮箱/电话",
    detailsPH: "请描述问题…",
    totalReports: "投诉总数",
    openReports: "未解决",
    resolvedReports: "已解决",
    myReportHistory: "我的投诉记录",
    historySubtitle: "查看该摊位的历史投诉。",
    filterAll: "筛选：全部",
    filterSubmitted: "已提交",
    filterResolved: "已解决",
    markResolved: "将最新投诉设为已解决",
    historyNote: "（演示用）此按钮会把最新一条投诉设为“已解决”。"
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
    // refresh home "View" buttons
    document.querySelectorAll("[data-view]").forEach(b=> b.textContent = I18N[lang].view);
  });
}

/* =============================
   Shared State
============================= */
let currentStallId = localStorage.getItem("currentStallId") || STALLS[0].id;

// Likes: Firestore gives counts; localStorage stores likedByMe
let likesCountByItem = {}; // { itemId: {count: number} }

// Reviews/Complaints now come from Firestore live
let reviewsLive = [];
let complaintsLive = [];

// loyalty (still local demo)
let loyalty = load("loyalty", { points: 0 });

// promo state per stall (still local demo)
let promoByStall = load("promoByStall", {}); // {stallId:{subscribed, activePromo}}

// listeners
let unsubReviews = null;
let unsubComplaints = null;
let unsubLikes = null;

function ensurePromo(stallId){
  if (!promoByStall[stallId]) promoByStall[stallId] = { subscribed:false, activePromo:"" };
}

/* ===== liked-by-me per browser ===== */
function getLikedKey(stallId, itemId){ return `liked_${stallId}_${itemId}`; }
function isLikedByMe(stallId, itemId){ return localStorage.getItem(getLikedKey(stallId,itemId)) === "1"; }
function setLikedByMe(stallId, itemId, liked){ localStorage.setItem(getLikedKey(stallId,itemId), liked ? "1" : "0"); }

/* =============================
   Firestore binding for selected stall
============================= */
function bindStallRealtime(stallId){
  // stop previous listeners
  if (unsubReviews) { unsubReviews(); unsubReviews = null; }
  if (unsubComplaints) { unsubComplaints(); unsubComplaints = null; }
  if (unsubLikes) { unsubLikes(); unsubLikes = null; }

  // likes
  unsubLikes = listenMenuLikes(stallId, (map)=>{
    likesCountByItem = map || {};
    renderMenu();
  });

  // reviews
  unsubReviews = listenReviews(stallId, (list)=>{
    reviewsLive = Array.isArray(list) ? list : [];
    renderReviews();
    // home rating chips (if on home page)
    refreshHomeCards();
  });

  // complaints
  unsubComplaints = listenComplaints(stallId, (list)=>{
    complaintsLive = Array.isArray(list) ? list : [];
    renderComplaints();
  });
}

/* =============================
   HOME page
============================= */
function calcAvgRatingFromLive(stallId){
  // We only live-listen current stall; home page will show 0 unless user visited a stall.
  // Simple demo: store last known avg in localStorage cache.
  const cache = load("avgCache", {});
  return Number(cache[stallId] || 0);
}

function updateAvgCacheForCurrentStall(){
  const cache = load("avgCache", {});
  const rs = reviewsLive.filter(r => r.stallId === currentStallId);
  const avg = rs.length ? rs.reduce((s,r)=>s+(Number(r.rating)||0),0)/rs.length : 0;
  cache[currentStallId] = avg;
  save("avgCache", cache);
}

function refreshHomeCards(){
  // if on home page, rerender ratings
  const list = qs("stallCards");
  if (!list) return;
  // update cache for current stall
  updateAvgCacheForCurrentStall();
  initHome(true);
}

function initHome(force=false){
  const list = qs("stallCards");
  if (!list) return;

  const search = qs("searchInput");

  const render = () => {
    const q = (search?.value || "").toLowerCase().trim();
    list.innerHTML = "";

    const filtered = STALLS.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.unit && s.unit.toLowerCase().includes(q))
    );

    filtered.forEach(s=>{
      const avg = calcAvgRatingFromLive(s.id);
      const div = document.createElement("div");
      div.className = "stall-card";

      div.innerHTML = `
        <div class="stall-img"></div>
        <div>
          <h3 class="stall-name">${escapeHtml(s.name)}</h3>
          <div class="tags">
            ${(s.cuisine||[]).map(c=>`<span class="tag">${escapeHtml(c)}</span>`).join("")}
            <span class="tag">⭐ ${Number(avg).toFixed(1)}</span>
          </div>
          <div class="muted small">
            ${escapeHtml((s.cuisine||[]).join(", "))}${s.unit ? ` • ${escapeHtml(s.unit)}` : ""}
          </div>
        </div>
        <button class="btn btn-primary" data-view="${s.id}">${I18N[lang].view}</button>
      `;
      list.appendChild(div);
    });
  };

  if (!force && search) search.addEventListener("input", render);

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
    opt.textContent = `${s.name} (${s.id})`;
    if (s.id === currentStallId) opt.selected = true;
    select.appendChild(opt);
  });

  const updateName = () => {
    const found = STALLS.find(s=>s.id===currentStallId);
    nameEl.textContent = found ? `${found.name} • ${found.id}` : "Selected Stall";
  };
  updateName();

  // Bind listeners for current stall
  bindStallRealtime(currentStallId);

  select.addEventListener("change", ()=>{
    currentStallId = select.value;
    localStorage.setItem("currentStallId", currentStallId);
    updateName();
    bindStallRealtime(currentStallId);
    renderAllStallSections();
  });
}

/* =============================
   Menu + Likes (Firestore count + local likedByMe)
============================= */
function getLikeCount(itemId){
  const v = likesCountByItem?.[itemId]?.count;
  return Number.isFinite(v) ? v : 0;
}

function renderMenu(){
  const list = qs("menuList");
  if (!list) return;

  const items = MENU_BY_STALL[currentStallId] || [];
  list.innerHTML = "";

  items.forEach(item=>{
    const liked = isLikedByMe(currentStallId, item.id);
    const count = getLikeCount(item.id);

    const div = document.createElement("div");
    div.className = "menu-item";
    div.innerHTML = `
      <div class="menu-left">
        <div class="menu-title">${escapeHtml(item.name)}</div>
        <div class="menu-meta">${escapeHtml(item.cuisine)} • $${Number(item.price).toFixed(2)}</div>
      </div>

      <div class="like">
        <span class="heart ${liked ? "liked":""}" data-like="${item.id}">♥</span>
        <span class="like-count">${count}</span>
      </div>
    `;
    list.appendChild(div);
  });

  renderTopLiked();
}

function renderTopLiked(){
  const box = qs("topLikedList");
  if (!box) return;

  const items = MENU_BY_STALL[currentStallId] || [];
  const ranked = items
    .map(i=>({name:i.name, id:i.id, count:getLikeCount(i.id)}))
    .sort((a,b)=>b.count-a.count)
    .slice(0,3)
    .filter(x=>x.count>0);

  box.textContent = ranked.length ? ranked.map(x=>`${x.name} (${x.count})`).join(" • ") : "—";
}

function initLikesClick(){
  document.addEventListener("click", async (e)=>{
    const t = e.target.closest("[data-like]");
    if (!t) return;

    const itemId = t.getAttribute("data-like");

    const currentlyLiked = isLikedByMe(currentStallId, itemId);
    const nextLiked = !currentlyLiked;

    // Update local "liked by me" first (fast UI)
    setLikedByMe(currentStallId, itemId, nextLiked);

    // Update Firestore count
    try{
      await toggleLikeCount(currentStallId, itemId, nextLiked);
    }catch(err){
      console.warn("Like update failed:", err);
      // rollback if fails
      setLikedByMe(currentStallId, itemId, currentlyLiked);
      alert("Like failed (Firestore rules/network).");
    }

    renderMenu();
  });

  const resetBtn = qs("resetLikesBtn");
  if (resetBtn){
    resetBtn.addEventListener("click", ()=>{
      // Only reset likedByMe flags locally (counts stay in Firestore)
      const items = MENU_BY_STALL[currentStallId] || [];
      items.forEach(i=> localStorage.removeItem(getLikedKey(currentStallId, i.id)));
      renderMenu();
    });
  }
}

/* =============================
   Reviews (Firestore)
============================= */
function calcAvgRating(stallId){
  // On stall page, use live reviews
  const rs = reviewsLive.filter(r=>r.stallId===stallId);
  if (rs.length===0) return 0;
  const total = rs.reduce((s,r)=>s+(Number(r.rating)||0),0);
  return total/rs.length;
}

function renderReviews(){
  const list = qs("reviewsList");
  if (!list) return;

  const avgEl = qs("avgRating");
  const countEl = qs("reviewCount");
  const sort = qs("sortReviews");

  const rs = reviewsLive.filter(r=>r.stallId===currentStallId);
  const avg = rs.length ? (rs.reduce((s,r)=>s+(Number(r.rating)||0),0)/rs.length) : 0;

  if (avgEl) avgEl.textContent = `⭐ ${avg.toFixed(1)}`;
  if (countEl) countEl.textContent = `${rs.length} reviews`;

  const mode = sort ? sort.value : "latest";
  const sorted = [...rs].sort((a,b)=>{
    if (mode==="highest") return (Number(b.rating)||0)-(Number(a.rating)||0);
    if (mode==="lowest") return (Number(a.rating)||0)-(Number(b.rating)||0);
    return (Number(b.tsMs)||0)-(Number(a.tsMs)||0);
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
        <div class="review-stars">⭐ ${escapeHtml(r.rating)}</div>
        <div class="muted small">${escapeHtml(r.date || nowText())}</div>
      </div>
      <div class="review-text">${escapeHtml(r.comment || "")}</div>
    `;
    list.appendChild(div);
  });

  updateAvgCacheForCurrentStall();
}

function initReviewForm(){
  const form = qs("reviewForm");
  if (!form) return;

  const ratingInput = qs("ratingInput");
  const commentInput = qs("commentInput");
  const sort = qs("sortReviews");
  const clearBtn = qs("clearReviewsBtn");

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const rating = Number(ratingInput.value);
    const comment = (commentInput.value || "").trim();

    if (!Number.isFinite(rating) || rating<1 || rating>5){
      alert("Rating must be 1 to 5.");
      return;
    }
    if (!comment){
      alert("Comment cannot be empty.");
      return;
    }

    try{
      await addReview(currentStallId, { rating, comment });
      ratingInput.value = "";
      commentInput.value = "";
    }catch(err){
      console.warn("Review add failed:", err);
      alert("Review failed (Firestore rules/network).");
    }
  });

  if (sort) sort.addEventListener("change", renderReviews);

  // NOTE: clearing reviews in Firestore is not implemented (dangerous for group demo).
  // Keep button but show message.
  if (clearBtn){
    clearBtn.addEventListener("click", ()=>{
      alert("Demo note: Clearing reviews is disabled for Firestore safety.");
    });
  }
}

/* =============================
   Promo (still local demo)
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
   Loyalty (still local demo)
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
   Complaints (Firestore)
============================= */
function renderComplaints(){
  const listEl = qs("complaintsList");
  if (!listEl) return;

  const filterValue = qs("filterStatus")?.value || "all";

  let list = complaintsLive
    .filter(c => c.stallId === currentStallId)
    .slice()
    .sort((a, b) => (Number(b.tsMs)||0) - (Number(a.tsMs)||0));

  // Stats (report page)
  const totalEl = qs("totalReports");
  const openEl = qs("openReports");
  const resolvedEl = qs("resolvedReports");

  if (totalEl && openEl && resolvedEl) {
    const total = list.length;
    const open = list.filter(x => x.status !== "Resolved").length;
    const resolved = list.filter(x => x.status === "Resolved").length;

    totalEl.textContent = String(total);
    openEl.textContent = String(open);
    resolvedEl.textContent = String(resolved);
  }

  if (filterValue !== "all") {
    list = list.filter(x => x.status === filterValue);
  }

  listEl.innerHTML = "";

  if (list.length === 0) {
    listEl.innerHTML = `<div class="muted small">No reports found.</div>`;
    return;
  }

  list.forEach(c => {
    const div = document.createElement("div");
    div.className = "review-card";

    const cls = c.status === "Resolved" ? "ok" : "warn";

    div.innerHTML = `
      <div class="review-top">
        <div>
          <strong>${escapeHtml(c.issue || "")}</strong>
          <span class="status ${cls}">${escapeHtml(c.status || "Submitted")}</span>
          <span class="tag">Priority: ${escapeHtml(c.priority || "Low")}</span>
        </div>
        <div class="muted small">${escapeHtml(c.date || nowText())}</div>
      </div>
      <div class="review-text">${escapeHtml(c.details || "")}</div>
      ${c.contact ? `<div class="muted small">Contact: ${escapeHtml(c.contact)}</div>` : ""}
    `;
    listEl.appendChild(div);
  });
}

function initComplaintForm(){
  const form = qs("complaintForm");
  if (!form) return;

  const issue = qs("issueSelect");
  const details = qs("complaintInput");
  const prioritySelect = qs("prioritySelect");
  const contactInput = qs("contactInput");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const i = issue.value;
    const d = (details.value || "").trim();

    const priority = prioritySelect ? prioritySelect.value : "Low";
    const contact = contactInput ? contactInput.value.trim() : "";

    if (!i) { alert("Please select issue type."); return; }
    if (!d) { alert("Please enter complaint details."); return; }

    try{
      await addComplaint(currentStallId, {
        issue: i,
        details: d,
        priority,
        contact,
        status: "Submitted"
      });

      issue.value = "";
      details.value = "";
      if (prioritySelect) prioritySelect.value = "Low";
      if (contactInput) contactInput.value = "";
    }catch(err){
      console.warn("Complaint add failed:", err);
      alert("Complaint failed (Firestore rules/network).");
    }
  });

  const clearBtn = qs("clearComplaintsBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      alert("Demo note: Clearing complaints is disabled for Firestore safety.");
    });
  }

  const filter = qs("filterStatus");
  if (filter) {
    filter.addEventListener("change", renderComplaints);
  }

  const markBtn = qs("markResolvedBtn");
  if (markBtn) {
    markBtn.addEventListener("click", async () => {
      const list = complaintsLive
        .filter(c => c.stallId === currentStallId)
        .slice()
        .sort((a, b) => (Number(b.tsMs)||0) - (Number(a.tsMs)||0));

      if (list.length === 0) {
        alert("No complaints to update.");
        return;
      }

      const latest = list[0];
      if (!latest.id) {
        alert("Cannot resolve (missing doc id).");
        return;
      }

      try{
        await markComplaintResolved(currentStallId, latest.id);
      }catch(err){
        console.warn("Resolve failed:", err);
        alert("Resolve failed (Firestore rules/network).");
      }
    });
  }
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
});
