const WPLACE_FREE = [
    [0, 0, 0],
    [60, 60, 60],
    [120, 120, 120],
    [210, 210, 210],
    [255, 255, 255],
    [96, 0, 24],
    [237, 28, 36],
    [255, 127, 39],
    [246, 170, 9],
    [249, 221, 59],
    [255, 250, 188],
    [14, 185, 104],
    [19, 230, 123],
    [135, 255, 94],
    [12, 129, 110],
    [16, 174, 166],
    [19, 225, 190],
    [96, 247, 242],
    [40, 80, 158],
    [64, 147, 228],
    [107, 80, 246],
    [153, 177, 251],
    [120, 12, 153],
    [170, 56, 185],
    [224, 159, 249],
    [203, 0, 122],
    [236, 31, 128],
    [243, 141, 169],
    [104, 70, 52],
    [149, 104, 42],
    [248, 178, 119],
];
const WPLACE_PAID = [
    [170, 170, 170],
    [165, 14, 30],
    [250, 128, 114],
    [228, 92, 26],
    [156, 132, 49],
    [197, 173, 49],
    [232, 212, 95],
    [74, 107, 58],
    [90, 148, 74],
    [132, 197, 115],
    [15, 121, 159],
    [187, 250, 242],
    [125, 199, 255],
    [77, 49, 184],
    [74, 66, 132],
    [122, 113, 196],
    [181, 174, 241],
    [155, 82, 73],
    [209, 128, 120],
    [250, 182, 164],
    [219, 164, 99],
    [123, 99, 82],
    [156, 132, 107],
    [214, 181, 148],
    [209, 128, 81],
    [255, 197, 165],
    [109, 100, 63],
    [148, 140, 107],
    [205, 197, 158],
    [51, 57, 65],
    [109, 117, 141],
    [179, 185, 209],
];
const WPLACE_NAMES = {
    "0,0,0": "Black",
    "60,60,60": "Dark Gray",
    "120,120,120": "Gray",
    "210,210,210": "Light Gray",
    "255,255,255": "White",
    "96,0,24": "Deep Red",
    "237,28,36": "Red",
    "255,127,39": "Orange",
    "246,170,9": "Gold",
    "249,221,59": "Yellow",
    "255,250,188": "Light Yellow",
    "14,185,104": "Dark Green",
    "19,230,123": "Green",
    "135,255,94": "Light Green",
    "12,129,110": "Dark Teal",
    "16,174,166": "Teal",
    "19,225,190": "Light Teal",
    "96,247,242": "Cyan",
    "40,80,158": "Dark Blue",
    "64,147,228": "Blue",
    "107,80,246": "Indigo",
    "153,177,251": "Light Indigo",
    "120,12,153": "Dark Purple",
    "170,56,185": "Purple",
    "224,159,249": "Light Purple",
    "203,0,122": "Dark Pink",
    "236,31,128": "Pink",
    "243,141,169": "Light Pink",
    "104,70,52": "Dark Brown",
    "149,104,42": "Brown",
    "248,178,119": "Beige",
    "170,170,170": "Medium Gray",
    "165,14,30": "Dark Red",
    "250,128,114": "Light Red",
    "228,92,26": "Dark Orange",
    "156,132,49": "Dark Goldenrod",
    "197,173,49": "Goldenrod",
    "232,212,95": "Light Goldenrod",
    "74,107,58": "Dark Olive",
    "90,148,74": "Olive",
    "132,197,115": "Light Olive",
    "15,121,159": "Dark Cyan",
    "187,250,242": "Light Cyan",
    "125,199,255": "Light Blue",
    "77,49,184": "Dark Indigo",
    "74,66,132": "Dark Slate Blue",
    "122,113,196": "Slate Blue",
    "181,174,241": "Light Slate Blue",
    "155,82,73": "Dark Peach",
    "209,128,120": "Peach",
    "250,182,164": "Light Peach",
    "219,164,99": "Light Brown",
    "123,99,82": "Dark Tan",
    "156,132,107": "Tan",
    "214,181,148": "Light Tan",
    "209,128,81": "Dark Beige",
    "255,197,165": "Light Beige",
    "109,100,63": "Dark Stone",
    "148,140,107": "Stone",
    "205,197,158": "Light Stone",
    "51,57,65": "Dark Slate",
    "109,117,141": "Slate",
    "179,185,209": "Light Slate",
};
let originalImageData = null;
let currentImageData = null;
let removedColors = [];
let history = [];
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
let zoom = 1;
let replacedColorsMap = new Map();
let activeReplaceColor = null;

const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const mainCanvas = document.getElementById("mainCanvas");
const ctx = mainCanvas.getContext("2d");

const colorInfo = document.getElementById("colorInfo");
const colorPreview = document.getElementById("colorPreview");
const colorText = document.getElementById("colorText");
const colorChips = document.getElementById("colorChips");
const colorBreakdown = document.getElementById("colorBreakdown");
const replacedColors = document.getElementById("replacedColors");

const tolerance = document.getElementById("tolerance");
const toleranceValue = document.getElementById("toleranceValue");
const expand = document.getElementById("expand");
const expandValue = document.getElementById("expandValue");
const gapSize = document.getElementById("gapSize");
const gapSizeValue = document.getElementById("gapSizeValue");
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
        const point = getCanvasPoint(e.clientX, e.clientY);
        const x = Math.floor(point.x);
        const y = Math.floor(point.y);

        const currentTab = document.querySelector('.tab-link.active').getAttribute('onclick').includes('replace');
        if (currentTab) {
            openReplaceModalAt(x, y);
        } else {
            removeColorAt(x, y);
        }
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
gapSize.addEventListener("input", (e) => {
    gapSizeValue.textContent = e.target.value + "px";
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
    updateColorBreakdown();
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
        const rgb = `${pixel[0]},${pixel[1]},${pixel[2]}`;
        const name = WPLACE_NAMES[rgb] || `RGB(${rgb})`;
        const isPaid = WPLACE_PAID.some(c => c[0] === pixel[0] && c[1] === pixel[1] && c[2] === pixel[2]);
        
        colorPreview.style.backgroundColor = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;
        colorText.innerHTML = `<span style="${isPaid ? 'color: yellow;' : ''}">${name}</span>`;
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
    
    applyReplacements(currentImageData.data);

    const { width, height, data } = currentImageData;
    const mask = new Uint8Array(width * height);
    const toleranceVal = parseInt(tolerance.value);
    const expandVal = parseInt(expand.value);
    const gapSizeVal = parseInt(gapSize.value);

    removedColors.forEach((color) => {
        if (
            floodFill.checked &&
            color.x !== undefined &&
            color.y !== undefined
        ) {
            floodFillFromPoint(data, mask, width, height, color, toleranceVal, gapSizeVal);
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

function floodFillFromPoint(data, mask, width, height, color, tolerance, gapSize) {
    const queue = [{ x: color.x, y: color.y }];
    const visited = new Set([`${color.x},${color.y}`]);

    while (queue.length > 0) {
        const { x, y } = queue.shift();
        const index = y * width + x;

        if (mask[index] === 1) continue;

        if (isColorSimilar(data, index * 4, color, tolerance)) {
            mask[index] = 1;
            
            for (let dy = -1 - gapSize; dy <= 1 + gapSize; dy++) {
                for (let dx = -1 - gapSize; dx <= 1 + gapSize; dx++) {
                    if (dx === 0 && dy === 0) continue;

                    const nx = x + dx;
                    const ny = y + dy;
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
    replacedColorsMap.clear();
    history = [];
    requestAnimationFrame(drawCanvas);
    updateColorChips();
    updateReplacedColorChips();
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

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

function updateColorBreakdown() {
    if (!originalImageData) return;

    const colorCounts = {};
    const { data, width, height } = originalImageData;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
            const rgb = `${data[i]},${data[i + 1]},${data[i + 2]}`;
            colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
        }
    }

    const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
    
    colorBreakdown.innerHTML = '';
    sortedColors.forEach(([rgb, count]) => {
        const [r, g, b] = rgb.split(',');
        const name = WPLACE_NAMES[rgb] || `RGB(${rgb})`;
        const isPaid = WPLACE_PAID.some(c => c[0] == r && c[1] == g && c[2] == b);
        const percentage = ((count / (width * height)) * 100).toFixed(2);

        const item = document.createElement('div');
        item.className = 'breakdown-item';
        item.innerHTML = `
            <div class="color-chip-preview" style="background: rgb(${rgb})"></div>
            <span class="breakdown-name" style="${isPaid ? 'color: yellow;' : ''}">${name}</span>
            <span class="breakdown-bar" style="width: ${percentage}%"></span>
            <span class="breakdown-percent">${percentage}%</span>
        `;
        colorBreakdown.appendChild(item);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".tab-link.active").click();
});

function openReplaceModalAt(x, y) {
    if (!originalImageData) return;
    const index = (y * originalImageData.width + x) * 4;
    const pixel = originalImageData.data.slice(index, index + 4);
    if (pixel[3] === 0) return;

    activeReplaceColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
    const rgb = `${pixel[0]},${pixel[1]},${pixel[2]}`;
    const name = WPLACE_NAMES[rgb] || `RGB(${rgb})`;

    document.getElementById('replaceFromPreview').style.backgroundColor = `rgb(${rgb})`;
    document.getElementById('replaceFromName').textContent = name;

    populateColorPalette();
    document.getElementById('replaceModal').style.display = 'block';
}

function openReplaceModalForEdit(fromRgb) {
    if (!originalImageData) return;
    const [r, g, b] = fromRgb.split(',').map(Number);
    
    activeReplaceColor = { r, g, b };
    const name = WPLACE_NAMES[fromRgb] || `RGB(${fromRgb})`;

    document.getElementById('replaceFromPreview').style.backgroundColor = `rgb(${fromRgb})`;
    document.getElementById('replaceFromName').textContent = name;

    populateColorPalette();
    document.getElementById('replaceModal').style.display = 'block';
}

function closeReplaceModal() {
    document.getElementById('replaceModal').style.display = 'none';
    activeReplaceColor = null;
}

function populateColorPalette() {
    const palette = document.getElementById('colorPalette');
    palette.innerHTML = '';
    const allColors = [...WPLACE_FREE, ...WPLACE_PAID];

    allColors.forEach(color => {
        const [r, g, b] = color;
        const rgb = `${r},${g},${b}`;
        const name = WPLACE_NAMES[rgb] || `RGB(${rgb})`;
        const isPaid = WPLACE_PAID.some(c => c[0] === r && c[1] === g && c[2] === b);

        const chip = document.createElement('div');
        chip.className = 'color-chip-palette';
        chip.innerHTML = `
            <div class="color-chip-preview" style="background: rgb(${rgb})"></div>
            <span class="palette-name" style="${isPaid ? 'color: yellow;' : ''}">${name}</span>
        `;
        chip.onclick = () => selectReplacementColor({ r, g, b });
        palette.appendChild(chip);
    });
}

function selectReplacementColor(newColor) {
    if (!activeReplaceColor) return;
    const fromKey = `${activeReplaceColor.r},${activeReplaceColor.g},${activeReplaceColor.b}`;
    replacedColorsMap.set(fromKey, newColor);
    
    history.push({
        imageData: new ImageData(
            new Uint8ClampedArray(currentImageData.data),
            currentImageData.width,
            currentImageData.height
        ),
        removedColors: [...removedColors],
        replacedColors: new Map(replacedColorsMap),
    });

    applyReplacements();
    updateReplacedColorChips();
    closeReplaceModal();
}

function applyReplacements(data = null) {
    const targetData = data || currentImageData.data;
    const originalData = originalImageData.data;

    for (let i = 0; i < originalData.length; i += 4) {
        const r = originalData[i];
        const g = originalData[i + 1];
        const b = originalData[i + 2];
        const key = `${r},${g},${b}`;

        if (replacedColorsMap.has(key)) {
            const newColor = replacedColorsMap.get(key);
            targetData[i] = newColor.r;
            targetData[i + 1] = newColor.g;
            targetData[i + 2] = newColor.b;
        }
    }
    if (!data) {
        applyRemovals();
    }
}

function updateReplacedColorChips() {
    replacedColors.innerHTML = '';
    for (const [from, to] of replacedColorsMap.entries()) {
        const fromRgb = from;
        const toRgb = `${to.r},${to.g},${to.b}`;
        const fromName = WPLACE_NAMES[fromRgb] || `RGB(${fromRgb})`;
        const toName = WPLACE_NAMES[toRgb] || `RGB(${toRgb})`;

        const chip = document.createElement('div');
        chip.className = 'color-chip replaced';
        chip.innerHTML = `
            <div class="color-chip-preview" style="background: rgb(${fromRgb})"></div>
            <span>${fromName} →</span>
            <div class="color-chip-preview" style="background: rgb(${toRgb})"></div>
            <span>${toName}</span>
            <span class="color-chip-remove" onclick="revertReplacement('${fromRgb}', event)">×</span>
        `;
        chip.onclick = () => openReplaceModalForEdit(fromRgb);
        replacedColors.appendChild(chip);
    }
}

function revertReplacement(fromRgb, event) {
    event.stopPropagation();
    replacedColorsMap.delete(fromRgb);
    
    history.push({
        imageData: new ImageData(
            new Uint8ClampedArray(currentImageData.data),
            currentImageData.width,
            currentImageData.height
        ),
        removedColors: [...removedColors],
        replacedColors: new Map(replacedColorsMap),
    });

    applyReplacements();
    updateReplacedColorChips();
}

function undoLast() {
    if (history.length === 0) return;
    const state = history.pop();
    currentImageData = state.imageData;
    removedColors = state.removedColors;
    replacedColorsMap = state.replacedColors || new Map();
    requestAnimationFrame(drawCanvas);
    updateColorChips();
    updateReplacedColorChips();
}
