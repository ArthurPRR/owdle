
export { applyWin, scrollToBottom, scrollToTop };

function launchConfetti() {
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  const colors = ["#f2a43c", "#3a7f5c", "#ef4444", "#4f46e5", "#f59e0b", "#06b6d4"];
  const pieces = 90;

  for (let index = 0; index < pieces; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";

    const left = Math.random() * 100;
    const duration = 1200 + Math.random() * 1200;
    const delay = Math.random() * 220;
    const drift = -40 + Math.random() * 80;
    const size = 6 + Math.random() * 7;
    const rotation = Math.random() * 360;

    piece.style.left = `${left}%`;
    piece.style.setProperty("--confetti-color", colors[index % colors.length]);
    piece.style.setProperty("--confetti-duration", `${duration}ms`);
    piece.style.setProperty("--confetti-delay", `${delay}ms`);
    piece.style.setProperty("--confetti-drift", `${drift}px`);
    piece.style.width = `${size}px`;
    piece.style.height = `${Math.max(4, size * 0.6)}px`;
    piece.style.transform = `translateY(-12vh) rotate(${rotation}deg)`;

    container.appendChild(piece);
  }

  setTimeout(() => {
    container.remove();
  }, 3200);
}

function applyWin() {
    launchConfetti();
    scrollToBottom();
}

function scrollToBottom(){
    window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: "smooth",
    });
}


function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}