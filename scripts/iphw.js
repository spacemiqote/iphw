/*jshint esversion: 6 */
const userImage = document.getElementById('userImage');
const originalImage = document.getElementById('originalImage');
const allowMultipleFilterOn = document.getElementById('allowMultipleFilterOn');
const fileReader = new FileReader(),
    original2D = originalImage.getContext('2d', {willReadFrequently: !0});
let filterResult = document.getElementById('filterResult');
const filter2D = filterResult.getContext('2d', {willReadFrequently: !0});
let backupImage = filterResult;
let stepCount = 0;

function backupImageLoop() {
    backupImage = filterResult;
    setTimeout(backupImageLoop, 3500);
}

function readImage() {
    if (userImage.files[0]) {
        fileReader.readAsDataURL(userImage.files[0]);
        backupImageLoop();
        stepCount = 0;
    }
}

function loadImage() {
    let cResult = document.getElementById('filterResult');
    const c2D = cResult.getContext('2d', {willReadFrequently: !0});
    const image = new Image();
    image.src = fileReader.result.toString();
    image.onload = function () {
        originalImage.width = image.width;
        originalImage.height = image.height;
        cResult.width = image.width;
        cResult.height = image.height;
        original2D.drawImage(image, 0, 0);
        cResult = original2D.getImageData(
            0,
            0,
            originalImage.width,
            originalImage.height
        );
        c2D.putImageData(cResult, 0, 0);
    };
}

function RGBHSIConversion(command, x, y, z) {
    let r, g, b, H, h, S, I = 0;
    if (command === 'r2h') {
        if (x + y + z > 0) {
            r = x / (x + y + z);
            g = y / (x + y + z);
            b = z / (x + y + z);
        } else {
            r = g = b = 0;
        }
        if (x === y && y === z) {
            H = S = 0;
        } else if (b <= g)
            H = Math.acos(
                (r - g / 2 - b / 2) /
                Math.sqrt(r ** 2 + g ** 2 + b ** 2 - r * g - r * b - g * b)
            );
        else
            H =
                2 * Math.PI -
                Math.acos(
                    (r - g / 2 - b / 2) /
                    Math.sqrt(r ** 2 + g ** 2 + b ** 2 - r * g - r * b - g * b)
                );
        if (Number.isNaN(H)) H = 0;
        H = (H * 180) / Math.PI;
        S = (1 - 3 * Math.min(r, g, b)) * 100;
        I = (x + y + z) / (3 * 255);
        return [H, S, I];
    } else if (command === 'h2r') {
        h = (x * Math.PI) / 180;
        S = y / 100;
        if (x === 0) {
            r = z + 2 * z * S;
            g = z - z * S;
            b = z - z * S;
        } else if (x < 120) {
            b = z - z * S;
            r = z + (z * S * Math.cos(h)) / Math.cos(Math.PI / 3 - h);
            g = 3 * z - (b + r);
        } else if (x === 120) {
            r = z - z * S;
            g = z + 2 * z * S;
            b = z - z * S;
        } else if (x < 240) {
            r = z * (1 - S);
            g = z * (1 + (S * Math.cos(h - (2 * Math.PI) / 3)) / Math.cos(Math.PI - h));
            b = 3 * z - (r + g);
        } else if (x === 240) {
            g = z - z * S;
            b = z + 2 * z * S;
            r = z - z * S;
        } else if (x < 360) {
            g = z * (1 - S);
            b = z * (1 + (S * Math.cos(h - (4 * Math.PI) / 3)) / Math.cos((5 * Math.PI) / 3 - h));
            r = 3 * z - (g + b);
        } else {
            r = g = b = 0;
        }
        r *= 255;
        g *= 255;
        b *= 255;
        return [r, g, b];
    }
    return false;
}

function imageFilter(filter) {
    const enableMultipleFilter = allowMultipleFilterOn.checked;
    let customH, customS, customI = 0;
    filterResult.width = originalImage.width;
    filterResult.height = originalImage.height;
    filterResult = filter2D.getImageData(
        0,
        0,
        originalImage.width,
        originalImage.height
    );
    if (enableMultipleFilter && stepCount > 0 && filter !== "cancelFilter") {
        filter2D.putImageData(filterResult, 0, 0);
    } else if (!enableMultipleFilter || stepCount === 0) {
        filter2D.drawImage(originalImage, 0, 0);
        filterResult = filter2D.getImageData(
            0,
            0,
            originalImage.width,
            originalImage.height
        );
    }

    if (filter === 'hsi') {
        customH = parseFloat(document.getElementById('customH').value);
        customS = parseFloat(document.getElementById('customS').value);
        customI = parseFloat(document.getElementById('customI').value);
    }
    let exitOperation = false;

    for (let a = 0; a < filterResult.data.length; a += 4) {
        const red = filterResult.data[a];
        const green = filterResult.data[a + 1];
        const blue = filterResult.data[a + 2];
        switch (filter) {
            case 'inverse': {
                filterResult.data[a] = 255 - red;
                filterResult.data[a + 1] = 255 - green;
                filterResult.data[a + 2] = 255 - blue;
                break;
            }
            case 'grayscale': {
                const luminance =
                    0.2126 * red +
                    0.7152 * green +
                    0.0722 * blue;
                filterResult.data[a] = luminance;
                filterResult.data[a + 1] = luminance;
                filterResult.data[a + 2] = luminance;
                break;
            }
            case 'sepia': {
                filterResult.data[a] = red * 0.393 + green * 0.769 + blue * 0.189;
                filterResult.data[a + 1] = red * 0.349 + green * 0.686 + blue * 0.168;
                filterResult.data[a + 2] = red * 0.272 + green * 0.534 + blue * 0.131;
                break;
            }
            case 'hsi': {
                const hsi = RGBHSIConversion('r2h', red, green, blue);
                hsi[0] = (hsi[0] + parseFloat(customH) + 360) % 360;
                if (customS >= 0) hsi[1] = hsi[1] - (1 - hsi[1]) * (customS / 100);
                else hsi[1] = hsi[1] + hsi[1] * (customS / 100);
                if (customI >= 0) hsi[2] = hsi[2] + hsi[2] * (customI / 100);
                else hsi[2] = hsi[2] - (1 - hsi[2]) * (customI / 100);
                const rgb = RGBHSIConversion('h2r', hsi[0], hsi[1], hsi[2]);
                filterResult.data[a] = rgb[0];
                filterResult.data[a + 1] = rgb[1];
                filterResult.data[a + 2] = rgb[2];
                break;
            }
            case 'cancelFilter': {
                filter2D.drawImage(originalImage, 0, 0);
                exitOperation = true;
                break;
            }
            case 'revertImage': {
                if (backupImage.constructor === filterResult.constructor)
                    filterResult = backupImage;
                exitOperation = true;
                break;
            }
            default: {
                throw new Error(`Unknown filter: ${filter}`);
            }
        }
        if (exitOperation) break;
    }
    if (stepCount >= 0 && filter !== "cancelFilter")
        filter2D.putImageData(filterResult, 0, 0);
    stepCount++;
}

const range = document.querySelectorAll('.inputRange');
const field = document.querySelectorAll('.inputNumber');
for (let i = 0; i < range.length; i++) {
    range[i].addEventListener('input', function (e) {
        field[i].value = e.target.value;
    });
    field[i].addEventListener('input', function (e) {
        range[i].value = e.target.value;
    });
}
userImage.addEventListener('change', readImage);
fileReader.addEventListener('load', loadImage);