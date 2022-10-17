/*jshint esversion: 6 */
const userImage = document.getElementById('userImage');
const originalImage = document.getElementById('originalImage');
const allowMultipleFilterOn = document.getElementById('allowMultipleFilterOn');
const fileReader = new FileReader(),
    original2D = originalImage.getContext('2d', {
        willReadFrequently: !0
    });
const range = document.querySelectorAll('.inputRange');
const field = document.querySelectorAll('.inputNumber');
const dmatrix = [[0, 128, 32, 160], [192, 64, 224, 96], [48, 176, 16, 144], [240, 112, 208, 80]];
let filterResult = document.getElementById('filterResult');
const coll = document.getElementsByClassName("collapse");
const filter2D = filterResult.getContext('2d', {
    willReadFrequently: !0
});
let backupImage = filterResult;
let stepCount = 0;
let loaded = false;

function goFullScreen() {
    const canvas = document.getElementById("filterResult");
    if (canvas.requestFullScreen)
        canvas.requestFullScreen();
    else if (canvas.webkitRequestFullScreen)
        canvas.webkitRequestFullScreen();
    else if (canvas.mozRequestFullScreen)
        canvas.mozRequestFullScreen();
}

function download() {
    let link = document.createElement('a');
    link.download = 'download.png';
    link.href = document.getElementById('filterResult').toDataURL()
    link.click();
}

function valueSync(value) {
    for (let i = 0; i < range.length; i++) {
        if (value === true) {
            range[i].addEventListener('input', function (e) {
                field[i].value = e.target.value;
            });
            field[i].addEventListener('input', function (e) {
                range[i].value = e.target.value;
            });
        } else {
            field[i].value = 0;
            range[i].value = 0;
        }
    }
    if (!loaded) {
        for (const i of coll) {
            i.addEventListener("click", function () {
                i.classList.toggle("active");
                const content = i.nextElementSibling;
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = `${content.scrollHeight}px`;
                }
            });
        }
        loaded = true;
    }
}

function backupImageLoop() {
    backupImage = filterResult;
    setTimeout(backupImageLoop, 3500);
}

function readImage() {
    if (userImage.files[0]) {
        fileReader.readAsDataURL(userImage.files[0]);
        backupImageLoop();
        stepCount = 0;
        valueSync(false);
    }
}

function loadImage() {
    let cResult = document.getElementById('filterResult');
    const c2D = cResult.getContext('2d', {
        willReadFrequently: !0
    });
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
    let red, green, blue, Hue, Saturation, Intensity = 0;
    if (command === 'r2h') {
        if (x + y + z > 0) {
            red = x / (x + y + z);
            green = y / (x + y + z);
            blue = z / (x + y + z);
        } else {
            red = green = blue = 0;
        }
        if (x === y && y === z) {
            Hue = Saturation = 0;
        } else if (blue <= green)
            Hue = Math.acos(
                (red - green / 2 - blue / 2) /
                Math.sqrt(red ** 2 + green ** 2 + blue ** 2 - red * green - red * blue - green * blue)
            );
        else
            Hue =
                2 * Math.PI -
                Math.acos(
                    (red - green / 2 - blue / 2) /
                    Math.sqrt(red ** 2 + green ** 2 + blue ** 2 - red * green - red * blue - green * blue)
                );
        if (Number.isNaN(Hue)) Hue = 0;
        Hue = (Hue * 180) / Math.PI;
        Saturation = (1 - 3 * Math.min(red, green, blue)) * 100;
        Intensity = (x + y + z) / (3 * 255);
        return [Hue, Saturation, Intensity];
    } else if (command === 'h2r') {
        Hue = (x * Math.PI) / 180;
        Saturation = y / 100;
        if (x === 0) {
            red = z + 2 * z * Saturation;
            green = z - z * Saturation;
            blue = z - z * Saturation;
        } else if (x < 120) {
            blue = z - z * Saturation;
            red = z + (z * Saturation * Math.cos(Hue)) / Math.cos(Math.PI / 3 - Hue);
            green = 3 * z - (blue + red);
        } else if (x === 120) {
            red = z - z * Saturation;
            green = z + 2 * z * Saturation;
            blue = z - z * Saturation;
        } else if (x < 240) {
            red = z * (1 - Saturation);
            green = z * (1 + (Saturation * Math.cos(Hue - (2 * Math.PI) / 3)) / Math.cos(Math.PI - Hue));
            blue = 3 * z - (red + green);
        } else if (x === 240) {
            green = z - z * Saturation;
            blue = z + 2 * z * Saturation;
            red = z - z * Saturation;
        } else if (x < 360) {
            green = z * (1 - Saturation);
            blue = z * (1 + (Saturation * Math.cos(Hue - (4 * Math.PI) / 3)) / Math.cos((5 * Math.PI) / 3 - Hue));
            red = 3 * z - (green + blue);
        } else {
            red = green = blue = 0;
        }
        red *= 255;
        green *= 255;
        blue *= 255;
        return [red, green, blue];
    }
    return false;
}

function imageFilter(filter) {
    const enableMultipleFilter = allowMultipleFilterOn.checked;
    let customH = 0;
    let customS = 0;
    let customI = 0;
    let customR = 0;
    let customG = 0;
    let customB = 0;
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
    } else if (filter === 'colorbalance') {
        customR = parseFloat(document.getElementById('customR').value);
        customG = parseFloat(document.getElementById('customG').value);
        customB = parseFloat(document.getElementById('customB').value);
    }
    let exitOperation = false;
    for (let a = 0; a < filterResult.data.length; a += 4) {
        const height = filterResult.height;
        const width = filterResult.width;
        let red = filterResult.data[a];
        let green = filterResult.data[a + 1];
        let blue = filterResult.data[a + 2];
        let pixel = filterResult.data;
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
            case 'binary': {
                let gray = 0.299 * red + 0.587 * green + 0.114 * blue;
                if (gray >= 128) gray = 255;
                else gray = 0;
                filterResult.data[a] = gray;
                filterResult.data[a + 1] = gray;
                filterResult.data[a + 2] = gray;
                break;
            }
            case 'floyd': {
                let graph = Array.from(Array(filterResult.height), () => new Array(filterResult.width));
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const currentPixel = (y * 4 * width + 4 * x);
                        const red = filterResult.data[currentPixel];
                        const green = filterResult.data[currentPixel + 1];
                        const blue = filterResult.data[currentPixel + 2];
                        graph[y][x] = 0.299 * red + 0.587 * green + 0.114 * blue;
                    }
                }
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const currentPixel = y * 4 * width + 4 * x;
                        let gray = 0;
                        if (graph[y][x] >= 128)
                            gray = 255;
                        pixel [currentPixel] = gray;
                        pixel [currentPixel + 1] = gray;
                        pixel [currentPixel + 2] = gray;
                        let error = graph[y][x] - gray;
                        let left = x - 1;
                        if (left < 0)
                            left = 0;
                        let right = x + 1;
                        if (right > width - 1)
                            right = width - 1;
                        let down = y + 1;
                        if (down > height - 1)
                            down = height - 1;
                        graph[y][right] = graph[y][right] + 7 / 16 * error;
                        graph[down][left] = graph[down][left] + 3 / 16 * error;
                        graph[down][x] = graph[down][x] + 5 / 16 * error;
                        graph[down][right] = graph[down][right] + 1 / 16 * error;
                    }
                }
                exitOperation = true;
                break;
            }
            case 'dither': {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        let i = y * 4 * width + 4 * x;
                        let gray = pixel[i] * 0.299 + pixel[i + 1] * 0.587 + pixel[i + 2] * 0.114;
                        if (gray >= dmatrix[y % 4][x % 4]) gray = 255;
                        else gray = 0;
                        pixel[i + 0] = gray;
                        pixel[i + 1] = gray;
                        pixel[i + 2] = gray;
                    }
                }
                exitOperation = true;
                break;
            }
            case 'hsi': {
                const hsi = RGBHSIConversion('r2h', red, green, blue);
                hsi[0] = (hsi[0] + customH + 360) % 360;
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
            case 'colorbalance': {
                if (red < 128)
                    red = red * (customR / 300);
                else
                    red = (255 - red) * (customR / 300);
                if (green < 128)
                    green = green * (customG / 300);
                else
                    green = (255 - green) * (customG / 300);
                if (blue < 128)
                    blue = blue * (customB / 300);
                else
                    blue = (255 - blue) * (customB / 300);
                filterResult.data[a] += red - (green / 2) - (blue / 2);
                filterResult.data[a + 1] += green - (red / 2) - (blue / 2);
                filterResult.data[a + 2] += blue - (red / 2) - (green / 2);
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
        if (exitOperation) {
            valueSync(false);
            break;
        }
    }
    if (stepCount >= 0 && filter !== "cancelFilter")
        filter2D.putImageData(filterResult, 0, 0);
    stepCount++;
}

valueSync(true);
userImage.addEventListener('change', readImage);
fileReader.addEventListener('load', loadImage);
