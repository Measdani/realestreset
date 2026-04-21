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
    const response = await fetch("/api/create-checkout-session", {
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

  const pulse = Math.sin(time * 0.0007) * 24;
  const focusX = pointer.x * width;
  const focusY = pointer.y * height;
  const glow = context.createRadialGradient(focusX, focusY, 0, focusX, focusY, width * 0.48);
  glow.addColorStop(0, "rgba(243, 207, 124, 0.18)");
  glow.addColorStop(0.42, "rgba(214, 167, 77, 0.05)");
  glow.addColorStop(1, "rgba(214, 167, 77, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  const ribbonGradient = context.createLinearGradient(width * 0.2, 0, width, height * 0.5);
  ribbonGradient.addColorStop(0, "rgba(243, 207, 124, 0)");
  ribbonGradient.addColorStop(0.34, "rgba(243, 207, 124, 0.86)");
  ribbonGradient.addColorStop(0.62, "rgba(214, 167, 77, 0.38)");
  ribbonGradient.addColorStop(1, "rgba(243, 207, 124, 0)");

  context.save();
  context.globalCompositeOperation = "screen";
  context.shadowColor = "rgba(243, 207, 124, 0.45)";
  context.shadowBlur = 34;

  for (let index = 0; index < 7; index += 1) {
    const offset = index * 12;
    context.globalAlpha = 0.2 + index * 0.055;
    context.lineWidth = 58 - index * 6;
    context.strokeStyle = ribbonGradient;
    context.beginPath();
    context.moveTo(width * 0.24, height * 0.1 + offset);
    context.bezierCurveTo(
      width * 0.46,
      height * 0.1 + pulse + offset,
      width * 0.62,
      height * 0.28 - pulse * 0.5 + offset,
      width * 0.54,
      height * 0.43 + offset,
    );
    context.bezierCurveTo(
      width * 0.47,
      height * 0.59 + offset,
      width * 0.78,
      height * 0.54 - pulse + offset,
      width * 0.96,
      height * 0.42 + offset,
    );
    context.stroke();
  }

  context.shadowBlur = 0;
  context.globalAlpha = 0.55;
  context.lineWidth = 1;
  context.strokeStyle = "rgba(243, 207, 124, 0.34)";
  for (let index = 0; index < 5; index += 1) {
    const offset = index * 18;
    context.beginPath();
    context.moveTo(width * 0.32, height * 0.12 + offset);
    context.bezierCurveTo(
      width * 0.58,
      height * 0.08 + offset,
      width * 0.88,
      height * 0.28 + offset,
      width,
      height * 0.38 + offset,
    );
    context.stroke();
  }
  context.restore();

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
