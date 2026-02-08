document.addEventListener("DOMContentLoaded", async () => {
  const mount = document.getElementById("navbar");
  if (!mount) return;

  // Pages that should use the restricted navbar
  const restrictedPages = ["vendor.html", "officer.html"];

  const isRestricted = restrictedPages.some(page =>
    window.location.pathname.endsWith(page)
  );

  const navbarFile = isRestricted
    ? "/shared/navbar-auth.html"
    : "/shared/navbar-public.html";

  const res = await fetch(navbarFile);
  mount.innerHTML = await res.text();
});
