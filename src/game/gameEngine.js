export function createObstacle(x, state) {
  const width = state.obstacleWidth;
  const obstacleGap = state.gap * randomBetween(0.72, 1.36);
  const margin = clamp(state.height * 0.09, 34, 72);
  const minCenter = margin + obstacleGap / 2;
  const maxCenter = state.height - margin - obstacleGap / 2;
  const centerBias = Math.random();
  const center = minCenter + Math.pow(centerBias, randomBetween(0.72, 1.45)) * Math.max(1, maxCenter - minCenter);
  return { x, width, gapTop: center - obstacleGap / 2, gapBottom: center + obstacleGap / 2, scored: false };
}

export function createCoinSequence(x, state, obstacle) {
  const count = Math.floor(randomBetween(4, 7));
  const spacing = clamp(state.width * 0.068, 36, 62);
  const coinSize = clamp(state.width * 0.043, 24, 38);
  const gapCenter = obstacle ? (obstacle.gapTop + obstacle.gapBottom) / 2 : state.height * randomBetween(0.34, 0.64);
  const wave = randomBetween(-12, 12);

  return Array.from({ length: count }, (_, index) => ({
    x: x + index * spacing,
    y: clamp(gapCenter + Math.sin(index * 0.75) * wave - coinSize / 2, obstacle ? obstacle.gapTop + coinSize * 0.45 : coinSize * 1.8, obstacle ? obstacle.gapBottom - coinSize * 1.45 : state.height - coinSize * 2.2),
    size: coinSize,
    collected: false
  }));
}

export function updateCoins(state) {
  for (const coin of state.coins) {
    coin.x -= state.speed;
  }

  state.coins = state.coins.filter((coin) => coin.x + coin.size > -20 && !coin.collected);
}

export function collectCoins(state) {
  let collected = 0;
  const fishHitRadius = state.fishRadius * 1.05;

  for (const coin of state.coins) {
    const coinCenterX = coin.x + coin.size / 2;
    const coinCenterY = coin.y + coin.size / 2;
    const dx = coinCenterX - state.fishX;
    const dy = coinCenterY - state.fishY;
    const distance = Math.hypot(dx, dy);

    if (distance < fishHitRadius + coin.size * 0.55) {
      state.collectedEffects?.push({
        id: `${Date.now()}-${Math.random()}`,
        x: coinCenterX,
        y: coinCenterY
      });
      coin.collected = true;
      collected += 1;
    }
  }

  state.coins = state.coins.filter((coin) => !coin.collected);
  return collected;
}

export function hasCollision(state) {
  if (state.fishY - state.fishRadius < 0 || state.fishY + state.fishRadius > state.height) return true;

  return state.obstacles.some((obstacle) => {
    const fishRight = state.fishX + state.fishRadius;
    const fishLeft = state.fishX - state.fishRadius;
    const obstacleRight = obstacle.x + obstacle.width;
    const overlapsX = fishRight > obstacle.x && fishLeft < obstacleRight;
    const outsideGap = state.fishY - state.fishRadius < obstacle.gapTop || state.fishY + state.fishRadius > obstacle.gapBottom;
    return overlapsX && outsideGap;
  });
}

export function drawScene(context, state, lang) {
  context.clearRect(0, 0, state.width, state.height);
  drawBackground(context, state);


  for (const obstacle of state.obstacles) {
    drawObstacle(context, obstacle, state);
  }

  drawCoins(context, state);
  if (!state.ended) {
    drawFish(context, state, lang);
  }
}

function drawBackground(context, state) {
  const gradient = context.createLinearGradient(0, 0, 0, state.height);
  gradient.addColorStop(0, '#7dd3fc');
  gradient.addColorStop(0.55, '#1295c4');
  gradient.addColorStop(1, '#07516f');
  context.fillStyle = gradient;
  context.fillRect(0, 0, state.width, state.height);

  if (!state.backgroundImage) return;

  const image = state.backgroundImage;
  const scale = state.height / image.height;
  const drawWidth = image.width * scale;
  const drawHeight = state.height;
  const offset = state.backgroundOffset % drawWidth;

  for (let x = -offset; x < state.width + drawWidth; x += drawWidth) {
    context.drawImage(image, x, 0, drawWidth, drawHeight);
  }
}
function drawCoins(context, state) {
  if (!state.coinImage) return;

  for (const coin of state.coins) {
    context.save();
    context.translate(coin.x + coin.size / 2, coin.y + coin.size / 2);
    context.rotate((state.frame * 0.045) % (Math.PI * 2));
    context.drawImage(state.coinImage, -coin.size / 2, -coin.size / 2, coin.size, coin.size);
    context.restore();
  }
}

function drawObstacle(context, obstacle, state) {
  const topHeight = obstacle.gapTop + 18;
  const bottomHeight = state.height - obstacle.gapBottom + 18;

  if (state.obstacleTopImage && state.obstacleBottomImage) {
    drawStackImage(context, state.obstacleTopImage, obstacle.x, -18, obstacle.width, topHeight, 'bottom');
    drawStackImage(context, state.obstacleBottomImage, obstacle.x, obstacle.gapBottom, obstacle.width, bottomHeight, 'top');
    return;
  }

  drawCoinStack(context, obstacle.x, -18, obstacle.width, topHeight, true);
  drawCoinStack(context, obstacle.x, obstacle.gapBottom, obstacle.width, bottomHeight, false);
}

function drawStackImage(context, image, x, y, width, height, anchor) {
  if (!image || height <= 0) return;

  const scale = width / image.width;
  const drawHeight = image.height * scale;
  const bleed = Math.max(8, drawHeight * 0.08);

  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();

  if (anchor === 'bottom') {
    for (let drawY = y + height - drawHeight; drawY > y - drawHeight; drawY -= drawHeight - bleed) {
      context.drawImage(image, x, drawY, width, drawHeight);
    }
  } else {
    for (let drawY = y; drawY < y + height; drawY += drawHeight - bleed) {
      context.drawImage(image, x, drawY, width, drawHeight);
    }
  }

  context.restore();
}

function drawCoinStack(context, x, y, width, height, isTop) {
  if (height <= 0) return;

  const coinHeight = Math.max(12, width * 0.34);
  const step = coinHeight * 0.58;
  const count = Math.ceil(height / step) + 4;
  const startY = isTop ? y + height - coinHeight : y - coinHeight * 0.18;
  const direction = isTop ? -1 : 1;

  context.save();
  context.beginPath();
  context.rect(x - 8, y, width + 16, height);
  context.clip();

  for (let index = 0; index < count; index += 1) {
    const coinY = startY + direction * index * step;
    drawStackCoin(context, x, coinY, width, coinHeight);
  }

  context.restore();
}

function drawStackCoin(context, x, y, width, height) {
  const centerX = x + width / 2;
  const topY = y + height * 0.36;
  const sideY = topY;
  const sideHeight = height * 0.5;
  const outline = Math.max(1.5, width * 0.03);

  const sideGradient = context.createLinearGradient(x, 0, x + width, 0);
  sideGradient.addColorStop(0, '#c97a00');
  sideGradient.addColorStop(0.18, '#ffd45a');
  sideGradient.addColorStop(0.42, '#fff08a');
  sideGradient.addColorStop(0.62, '#eaa318');
  sideGradient.addColorStop(0.84, '#ffd96a');
  sideGradient.addColorStop(1, '#a76500');

  context.save();
  context.fillStyle = sideGradient;
  context.strokeStyle = '#7a4a00';
  context.lineWidth = outline;

  context.beginPath();
  context.moveTo(x + width * 0.05, sideY);
  context.lineTo(x + width * 0.95, sideY);
  context.lineTo(x + width * 0.95, sideY + sideHeight);
  context.quadraticCurveTo(centerX, sideY + sideHeight + height * 0.22, x + width * 0.05, sideY + sideHeight);
  context.closePath();
  context.fill();
  context.stroke();

  const topGradient = context.createRadialGradient(centerX - width * 0.14, topY - height * 0.1, width * 0.06, centerX, topY, width * 0.55);
  topGradient.addColorStop(0, '#fff8b0');
  topGradient.addColorStop(0.42, '#ffe15c');
  topGradient.addColorStop(0.76, '#d98c00');
  topGradient.addColorStop(1, '#8d5600');

  context.beginPath();
  context.ellipse(centerX, topY, width * 0.5, height * 0.34, 0, 0, Math.PI * 2);
  context.fillStyle = topGradient;
  context.fill();
  context.stroke();

  context.beginPath();
  context.ellipse(centerX, topY, width * 0.17, height * 0.1, 0, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(110, 68, 0, 0.36)';
  context.lineWidth = Math.max(1, width * 0.018);
  context.stroke();

  context.beginPath();
  context.ellipse(centerX - width * 0.18, topY - height * 0.09, width * 0.13, height * 0.045, -0.24, 0, Math.PI * 2);
  context.fillStyle = 'rgba(255, 255, 255, 0.45)';
  context.fill();

  context.restore();
}

function drawFish(context, state, lang) {
  const { fishImage, fishRadius: radius, fishX: x, fishY: y, velocity } = state;

  if (!fishImage) return;

  context.save();
  context.translate(x, y);
  context.rotate(clamp(velocity * 0.045, -0.45, 0.65));
  context.scale(1, 1);
  const width = radius * 4.25;
  const height = radius * 2.4;
  context.drawImage(fishImage, -width * 0.48, -height * 0.5, width, height);
  context.restore();
}

export function drawOverlay(context, state, label) {
  context.fillStyle = 'rgba(4, 28, 44, 0.52)';
  context.fillRect(0, 0, state.width, state.height);
  context.fillStyle = '#ffffff';
  context.font = '700 32px system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText(label, state.width / 2, state.height / 2);
}

function roundRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}














