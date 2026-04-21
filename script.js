const statusEl = document.querySelector("#checkoutStatus");
const checkoutButtons = document.querySelectorAll("[data-checkout]");

const checkoutLabels = {
  wordpress: "WordPress Breakout",
  academy: "Independent Academy",
  audit: "Security & Logic Audit",
};

const setStatus = (message, tone = "") => {
  if (!statusEl) return;
  statusEl.textContent = message;
  if (tone) {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
};

const setButtonsDisabled = (isDisabled) => {
  checkoutButtons.forEach((button) => {
    button.disabled = isDisabled;
  });
};

const startCheckout = async (product) => {
  const label = checkoutLabels[product] || "checkout";
  setButtonsDisabled(true);
  setStatus(`Opening secure Stripe Checkout for your ${label}...`);

  try {
    const response = await fetch("/.netlify/functions/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.url) {
      throw new Error(data.error || "Stripe Checkout is not configured yet.");
    }

    window.location.assign(data.url);
  } catch (error) {
    setStatus(error.message, "error");
    setButtonsDisabled(false);
  }
};

checkoutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    startCheckout(button.dataset.checkout);
  });
});

const checkoutParams = new URLSearchParams(window.location.search);
const checkoutState = checkoutParams.get("checkout");

if (checkoutState === "success") {
  const product = checkoutParams.get("product");
  const label = checkoutLabels[product] || "service";
  setStatus(`Payment received for ${label}. I will follow up with next steps.`, "success");
}

if (checkoutState === "cancelled") {
  setStatus("Checkout was cancelled. You can restart whenever you are ready.");
}

const canvas = document.querySelector("#signalCanvas");
const context = canvas?.getContext("2d");
let width = 0;
let height = 0;
let animationFrame = 0;
const pointer = { x: 0.62, y: 0.42 };

const nodes = Array.from({ length: 42 }, (_, index) => ({
  x: (index % 7) / 6,
  y: Math.floor(index / 7) / 5,
  phase: index * 0.39,
}));

const resizeCanvas = () => {
  if (!canvas || !context) return;
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
};

const drawSignalMap = (time = 0) => {
  if (!context) return;
  context.clearRect(0, 0, width, height);

  const drift = time * 0.00014;
  const points = nodes.map((node) => {
    const pulse = Math.sin(time * 0.001 + node.phase);
    return {
      x: width * (0.2 + node.x * 0.76) + Math.sin(drift + node.phase) * 24,
      y: height * (0.13 + node.y * 0.75) + pulse * 18,
      hot: pulse > 0.32,
    };
  });

  context.lineWidth = 1;
  points.forEach((point, index) => {
    const right = points[index + 1];
    const down = points[index + 7];
    [right, down].forEach((target) => {
      if (!target) return;
      const distanceToPointer = Math.hypot(
        (point.x + target.x) / 2 - pointer.x * width,
        (point.y + target.y) / 2 - pointer.y * height,
      );
      const focus = Math.max(0, 1 - distanceToPointer / 360);
      context.strokeStyle = `rgba(114, 225, 209, ${0.08 + focus * 0.28})`;
      context.beginPath();
      context.moveTo(point.x, point.y);
      context.lineTo(target.x, target.y);
      context.stroke();
    });
  });

  points.forEach((point) => {
    context.fillStyle = point.hot ? "rgba(159, 232, 112, 0.9)" : "rgba(244, 242, 232, 0.34)";
    context.fillRect(point.x - 2, point.y - 2, 4, 4);
  });

  animationFrame = requestAnimationFrame(drawSignalMap);
};

if (canvas && context) {
  resizeCanvas();
  drawSignalMap();

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / Math.max(window.innerWidth, 1);
    pointer.y = event.clientY / Math.max(window.innerHeight, 1);
  });
  window.addEventListener("pagehide", () => cancelAnimationFrame(animationFrame));
}
