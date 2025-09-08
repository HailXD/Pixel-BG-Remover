let originalImageData = null;
let currentImageData = null;
let removedColors = [];
let history = [];
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
let zoom = 1;

const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const mainCanvas = document.getElementById("mainCanvas");
const ctx = mainCanvas.getContext("2d");

const colorInfo = document.getElementById("colorInfo");
const colorPreview = document.getElementById("colorPreview");
const colorText = document.getElementById("colorText");
const removedColorsSection = document.getElementById("removedColors");
const colorChips = document.getElementById("colorChips");

const tolerance = document.getElementById("tolerance");
const toleranceValue = document.getElementById("toleranceValue");
const expand = document.getElementById("expand");
const expandValue = document.getElementById("expandValue");
const floodFill = document.getElementById("floodFill");
const smoothEdges = document.getElementById("smoothEdges");

// Upload handlers
uploadArea.addEventListener("click", () => fileInput.click());
uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
});
uploadArea.addEventListener("dragleave", () =>
    uploadArea.classList.remove("dragover")
);
uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

// Canvas Interaction
mainCanvas.addEventListener("mousedown", (e) => {
    if (e.button === 0 && !isPanning) {
        // Left click
        const point = getCanvasPoint(e.clientX, e.clientY);
        removeColorAt(Math.floor(point.x), Math.floor(point.y));
    }
});

mainCanvas.addEventListener("mousemove", (e) => {
    if (isPanning) {
        panOffset.x += e.clientX - panStart.x;
        panOffset.y += e.clientY - panStart.y;
        panStart = { x: e.clientX, y: e.clientY };
        requestAnimationFrame(drawCanvas);
    } else {
        const point = getCanvasPoint(e.clientX, e.clientY);
        updateColorInfo(Math.floor(point.x), Math.floor(point.y));
    }
});

mainCanvas.addEventListener("mouseleave", () =>
    colorInfo.classList.remove("active")
);

// Panning
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !isPanning && originalImageData) {
        e.preventDefault();
        isPanning = true;
        mainCanvas.classList.add("panning");
    }
});
window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
        isPanning = false;
        mainCanvas.classList.remove("panning");
    }
});
mainCanvas.addEventListener("mousedown", (e) => {
    if (isPanning) panStart = { x: e.clientX, y: e.clientY };
});

// Zooming
mainCanvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = mainCanvas.getBoundingClientRect();
    const zoomAmount = e.deltaY < 0 ? 1.1 : 0.9;

    const pointX = (e.clientX - rect.left - panOffset.x) / zoom;
    const pointY = (e.clientY - rect.top - panOffset.y) / zoom;

    zoom *= zoomAmount;

    panOffset.x = e.clientX - rect.left - pointX * zoom;
    panOffset.y = e.clientY - rect.top - pointY * zoom;

    requestAnimationFrame(drawCanvas);
});
document.getElementById("zoomResetBtn").onclick = resetZoom;

window.addEventListener("resize", () => {
    if (originalImageData) {
        const parentRect = mainCanvas.parentElement.getBoundingClientRect();
        mainCanvas.width = parentRect.width;
        mainCanvas.height = parentRect.height;
        resetZoom();
    }
});


function resetZoom() {
    if (!originalImageData) return;
    const imageWidth = originalImageData.width;
    const imageHeight = originalImageData.height;

    const pad = 0.95;
    const widthRatio = mainCanvas.width / imageWidth;
    const heightRatio = mainCanvas.height / imageHeight;
    zoom = Math.min(widthRatio, heightRatio) * pad;

    panOffset.x = (mainCanvas.width - imageWidth * zoom) / 2;
    panOffset.y = (mainCanvas.height - imageHeight * zoom) / 2;

    requestAnimationFrame(drawCanvas);
}

// Controls
tolerance.addEventListener("input", (e) => {
    toleranceValue.textContent = e.target.value + "%";
    if (removedColors.length > 0) applyRemovals();
});
expand.addEventListener("input", (e) => {
    expandValue.textContent = e.target.value + "px";
    if (removedColors.length > 0) applyRemovals();
});
floodFill.addEventListener("change", () => {
    if (removedColors.length > 0) applyRemovals();
});
smoothEdges.addEventListener("change", () => {
    if (removedColors.length > 0) applyRemovals();
});

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            setupCanvas(img);
            uploadArea.style.display = "none";
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function setupCanvas(img) {
    const parentRect = mainCanvas.parentElement.getBoundingClientRect();
    mainCanvas.width = parentRect.width;
    mainCanvas.height = parentRect.height;
    ctx.imageSmoothingEnabled = false;

    const originalCanvas = document.createElement("canvas");
    originalCanvas.width = img.width;
    originalCanvas.height = img.height;
    const originalCtx = originalCanvas.getContext("2d");
    originalCtx.drawImage(img, 0, 0);
    originalImageData = originalCtx.getImageData(0, 0, img.width, img.height);

    currentImageData = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        originalImageData.width,
        originalImageData.height
    );

    removedColors = [];
    history = [];
    updateColorChips();
    resetZoom();
}

function drawCanvas() {
    if (!currentImageData) return;
    const parentRect = mainCanvas.parentElement.getBoundingClientRect();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // This is a hack to get pixelated rendering on zoom
    ctx.imageSmoothingEnabled = false;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = currentImageData.width;
    tempCanvas.height = currentImageData.height;
    tempCanvas.getContext("2d").putImageData(currentImageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0);

    ctx.restore();
}

function getCanvasPoint(screenX, screenY) {
    const rect = mainCanvas.getBoundingClientRect();
    const x = (screenX - rect.left - panOffset.x) / zoom;
    const y = (screenY - rect.top - panOffset.y) / zoom;
    return { x, y };
}

function updateColorInfo(x, y) {
    if (
        !currentImageData ||
        x < 0 ||
        x >= currentImageData.width ||
        y < 0 ||
        y >= currentImageData.height
    ) {
        colorInfo.classList.remove("active");
        return;
    }
    const index = (Math.floor(y) * currentImageData.width + Math.floor(x)) * 4;
    const pixel = currentImageData.data.slice(index, index + 4);

    if (pixel[3] > 0) {
        colorPreview.style.backgroundColor = `rgba(${pixel[0]}, ${pixel[1]}, ${
            pixel[2]
        }, ${pixel[3] / 255})`;
        colorText.textContent = `RGB(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        colorInfo.classList.add("active");
    } else {
        colorInfo.classList.remove("active");
    }
}

function removeColorAt(x, y) {
    if (
        !currentImageData ||
        x < 0 ||
        x >= currentImageData.width ||
        y < 0 ||
        y >= currentImageData.height
    )
        return;

    const index = (y * currentImageData.width + x) * 4;
    const pixel = originalImageData.data.slice(index, index + 4);

    if (pixel[3] === 0) return;

    const color = { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3], x, y };

    history.push({
        imageData: new ImageData(
            new Uint8ClampedArray(currentImageData.data),
            currentImageData.width,
            currentImageData.height
        ),
        removedColors: [...removedColors],
    });

    const exists = removedColors.some(
        (c) =>
            c.r === color.r &&
            c.g === color.g &&
            c.b === color.b &&
            c.a === color.a
    );
    if (!exists || floodFill.checked) {
        removedColors.push(color);
    }

    applyRemovals();
    updateColorChips();
}

function applyRemovals() {
    currentImageData = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        originalImageData.width,
        originalImageData.height
    );

    const { width, height, data } = currentImageData;
    const mask = new Uint8Array(width * height);
    const toleranceVal = parseInt(tolerance.value);
    const expandVal = parseInt(expand.value);

    removedColors.forEach((color) => {
        if (
            floodFill.checked &&
            color.x !== undefined &&
            color.y !== undefined
        ) {
            floodFillFromPoint(data, mask, width, height, color, toleranceVal);
        } else {
            removeAllMatchingPixels(
                data,
                mask,
                width,
                height,
                color,
                toleranceVal
            );
        }
    });

    if (expandVal > 0) expandMask(mask, width, height, expandVal);
    if (smoothEdges.checked) smoothMaskEdges(mask, width, height);

    for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1) data[i * 4 + 3] = 0;
    }

    requestAnimationFrame(drawCanvas);
}

function isColorSimilar(data, index, targetColor, tolerance) {
    const dr = Math.abs(data[index] - targetColor.r);
    const dg = Math.abs(data[index + 1] - targetColor.g);
    const db = Math.abs(data[index + 2] - targetColor.b);
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);
    const maxDistance = Math.sqrt(3 * 255 * 255);
    return (distance / maxDistance) * 100 <= tolerance;
}

function floodFillFromPoint(data, mask, width, height, color, tolerance) {
    const queue = [{ x: color.x, y: color.y }];
    const visited = new Set([`${color.x},${color.y}`]);

    while (queue.length > 0) {
        const { x, y } = queue.shift();
        const index = y * width + x;

        if (mask[index] === 1) continue;

        if (isColorSimilar(data, index * 4, color, tolerance)) {
            mask[index] = 1;
            const neighbors = [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: -1 },
            ];
            for (const { dx, dy } of neighbors) {
                const nx = x + dx,
                    ny = y + dy;
                const key = `${nx},${ny}`;
                if (
                    nx >= 0 &&
                    nx < width &&
                    ny >= 0 &&
                    ny < height &&
                    !visited.has(key)
                ) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny });
                }
            }
        }
    }
}

function removeAllMatchingPixels(data, mask, width, height, color, tolerance) {
    for (let i = 0; i < width * height; i++) {
        if (mask[i] !== 1 && isColorSimilar(data, i * 4, color, tolerance)) {
            mask[i] = 1;
        }
    }
}

function expandMask(mask, width, height, pixels) {
    for (let i = 0; i < pixels; i++) {
        const tempMask = new Uint8Array(mask);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (tempMask[y * width + x] === 1) {
                    if (x > 0) mask[y * width + x - 1] = 1;
                    if (x < width - 1) mask[y * width + x + 1] = 1;
                    if (y > 0) mask[(y - 1) * width + x] = 1;
                    if (y < height - 1) mask[(y + 1) * width + x] = 1;
                }
            }
        }
    }
}

function smoothMaskEdges(mask, width, height) {
    /* Smoothing logic can be complex, simplified for now */
}

function updateColorChips() {
    removedColorsSection.style.display =
        removedColors.length > 0 ? "block" : "none";
    colorChips.innerHTML = "";
    const uniqueColors = removedColors.filter(
        (color, index, self) =>
            index ===
            self.findIndex(
                (c) =>
                    c.r === color.r &&
                    c.g === color.g &&
                    c.b === color.b &&
                    c.a === color.a
            )
    );
    uniqueColors.forEach((color) => {
        const chip = document.createElement("div");
        chip.className = "color-chip";
        chip.innerHTML = `<div class="color-chip-preview" style="background: rgba(${
            color.r
        },${color.g},${color.b},${color.a / 255})"></div><span>RGB(${color.r},${
            color.g
        },${color.b})</span><span class="color-chip-remove">×</span>`;
        chip.onclick = () => restoreColor(color);
        colorChips.appendChild(chip);
    });
}

function restoreColor(color) {
    history.push({
        imageData: new ImageData(
            new Uint8ClampedArray(currentImageData.data),
            currentImageData.width,
            currentImageData.height
        ),
        removedColors: [...removedColors],
    });
    removedColors = removedColors.filter(
        (c) =>
            !(
                c.r === color.r &&
                c.g === color.g &&
                c.b === color.b &&
                c.a === color.a
            )
    );
    applyRemovals();
    updateColorChips();
}

function undoLast() {
    if (history.length === 0) return;
    const state = history.pop();
    currentImageData = state.imageData;
    removedColors = state.removedColors;
    requestAnimationFrame(drawCanvas);
    updateColorChips();
}

function resetImage() {
    if (!originalImageData) return;
    currentImageData = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        originalImageData.width,
        originalImageData.height
    );
    removedColors = [];
    history = [];
    requestAnimationFrame(drawCanvas);
    updateColorChips();
}

function uploadNew() {
    uploadArea.style.display = "flex";
    fileInput.value = "";
    originalImageData = null;
    currentImageData = null;
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
}

function downloadImage() {
    if (!currentImageData) return;
    const link = document.createElement("a");
    link.download = "result.png";

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = currentImageData.width;
    tempCanvas.height = currentImageData.height;
    tempCanvas.getContext("2d").putImageData(currentImageData, 0, 0);

    link.href = tempCanvas.toDataURL();
    link.click();
}
