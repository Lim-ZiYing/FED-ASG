document.addEventListener("DOMContentLoaded", async () => {
  const mount = document.getElementById("navbar");
  if (!mount) return;

  try {
    const res = await fetch("/shared/navbar.html");
    mount.innerHTML = await res.text();
  } catch (e) {
    // Fallback message if fetch fails (usually file:// problem)
    mount.innerHTML = `<div style="padding:10px;background:#fee;">
      Navbar failed to load. Use Live Server / local server.
    </div>`;
  }
});
