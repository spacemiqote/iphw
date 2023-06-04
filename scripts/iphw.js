/*jshint esversion: 8 */
/*jshint globalstrict: true*/
/*jslint bitwise: true */
/*global ml5, ml5*/
/*global EXIF, EXIF*/
/*global Tesseract, Tesseract*/
/*eslint no-undef: "error"*/

"use strict";
const userImage = document.getElementById("userImage");
const originalImage = document.getElementById("originalImage");
const models = document.getElementById("models");
const modelLoadStatus = document.getElementById("modelLoadStatus");
const allowMultipleFilterOn = document.getElementById("allowMultipleFilterOn");
const edgeDetectionCheck = document.getElementById("edgeDetectionCheck");
const flipDirectionHV = document.getElementById("flipDirection");
const displayOriginalImage = document.getElementById("displayOriginalImage");
const focusMode = document.getElementById("focusMode");
const specialShit = document.getElementById("specialShit");
const loadCustomModel = document.getElementById("loadCustomModel");
const filterBox = document.getElementById("filterBox");
const originalBox = document.getElementById("originalBox");
const fileReader = new FileReader(),
    original2D = originalImage.getContext("2d", {
        willReadFrequently: !0,
    });
const passFileType = /^(?:image\/bmp|image\/jpeg|image\/png)$/i;
const range = document.querySelectorAll(".inputRange");
const field = document.querySelectorAll(".inputNumber");
const coll = document.getElementsByClassName("collapsible");

const dmatrix = [
    [0, 128, 32, 160],
    [192, 64, 224, 96],
    [48, 176, 16, 144],
    [240, 112, 208, 80],
];
const laplacian = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
];
const laplacianEdge = [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
];
const robertsX = [
    [1, 0],
    [0, -1],
];
const robertsY = [
    [0, 1],
    [-1, 0],
];
const extendLaplacian = [
    [-1, -1, -1],
    [-1, 9, -1],
    [-1, -1, -1],
];
const boxBlur = [
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
];
const highBoxBlur = [
    [-(1 / 9), -(1 / 9), -(1 / 9)],
    [-(1 / 9), (17 / 9), -(1 / 9)],
    [-(1 / 9), -(1 / 9), -(1 / 9)],
];
const sharpen = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
];
const gaussianBlur = [
    [0.045, 0.122, 0.045],
    [0.122, 0.332, 0.122],
    [0.045, 0.122, 0.045],
];
const prewittFilterX = [
    [-1, -1, -1],
    [0, 0, 0],
    [1, 1, 1],
];
const prewittFilterY = [
    [-1, 0, 1],
    [-1, 0, 1],
    [-1, 0, 1],
];
const sobelFilterX = [
    [1, 0, -1],
    [2, 0, -2],
    [1, 0, -1],
];
const sobelFilterY = [
    [1, 2, 1],
    [0, 0, 0],
    [-1, -2, -1],
];
const unsharp = [
    [-1, -1, -1],
    [-1, 9, -1],
    [-1, -1, -1],
];
const relief = [
    [-2, -1, 0],
    [-1, 1, 1],
    [0, 1, 2],
];
const emboss = [
    [1, 0, 0],
    [0, 0, 0],
    [0, 0, -1],
];

let operationHistory = [];
let filterResult = document.getElementById("filterResult");
const filter2D = filterResult.getContext("2d", {
    willReadFrequently: !0,
});
let wtfBackup = filterResult;
let savepointImage = filterResult;
let stepCount = 0;
let index = 0;
let fuck = 0;
let loaded = false;
let objects = [];
let cobjectDetector = 1;
let yobjectDetector = 1;
let cmodelCheck = false;
let ymodelCheck = false;
let loadedTesseract = false;
let loadedMl5 = false;
let loadedTfjs = false;
let imageFilename = "None";
let imageType = "None";


const loadScript = (FILE_URL, type = "text/javascript") => {
    return new Promise((resolve, reject) => {
        try {
            const scriptEle = document.createElement("script");
            scriptEle.type = type;
            scriptEle.src = FILE_URL;
            scriptEle.addEventListener("load", () => {
                resolve({status: true});
            });
            scriptEle.addEventListener("error", () => {
                reject(new Error("Failed"));
            });
            document.body.appendChild(scriptEle);
        } catch (error) {
            reject(error);
        }
    });
};

function openFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    } else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
}

function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {}).catch(() => {
            // Failed to exit fullscreen
        });
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

function download() {
    const link = document.createElement("a");
    link.download = "download.png";
    link.href = document.getElementById("filterResult").toDataURL();
    link.click();
}

function focusEditing() {
    document.getElementById("extraOptions").scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "end",
    });
}

function cyrb128(str) {
    let h1 = 1779033703,
        h2 = 3144134277,
        h3 = 1013904242,
        h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

function mulberry32(a) {
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

const currentDate = new Date();
const seed = cyrb128(currentDate.getTime());
const rand = mulberry32(seed[0]);

function checkFocusMode() {
    const enableFocusMode = focusMode.checked;
    if (enableFocusMode) {
        focusEditing();
    }
    setTimeout(checkFocusMode, 1000);
}

function valueSync(value) {
    for (let i = 0; i < range.length; i++) {
        if (value === true) {
            const staticTemp1 = i;
            const functionCall = function () {
                range[staticTemp1].addEventListener("input", (e) => {
                    field[staticTemp1].value = e.target.value;
                });
                field[staticTemp1].addEventListener("input", (e) => {
                    range[staticTemp1].value = e.target.value;
                });
            };
            functionCall();
        } else if (!range[i].classList.contains("noSync")) {
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
                    content.style.maxHeight = `${content.scrollHeight + 15}px`;
                }
            });
        }
        initFunctions();
        loaded = true;
    }
}

function setViewLoop() {
    const enableShowOriginalImage = displayOriginalImage.checked;
    if (enableShowOriginalImage) {
        originalBox.classList.add("card");
        originalBox.classList.add("col");
        originalBox.style.height = "auto";
        originalImage.parentElement.style.visibility = "visible";
    } else {
        filterBox.classList.remove("col");
        originalBox.classList.remove("card");
        originalBox.classList.remove("col");
        originalBox.style.height = "0px";
        originalImage.parentElement.style.visibility = "hidden";
    }
    setTimeout(setViewLoop, 1000);
}

function savepoint() {
    savepointImage = filterResult;
}

function cleanup() {
    operationHistory.length = 0;
    fuck = 0;
    index = 0;
}

function readImage() {
    if (userImage.files[0] && userImage.files.length && userImage) {
        const image = userImage.files[0];
        if (!passFileType.test(image.type)) {
            return;
        }
        imageType = image.type;
        imageFilename = image.name;
        fileReader.readAsDataURL(image);
        EXIF.getData(image, function () {
            document.getElementById("exifInfo").textContent = EXIF.pretty(this);
        }.bind(image));
        setViewLoop();
        checkFocusMode();
        stepCount = 0;
        cleanup();
        valueSync(false);
    }
}

function loadImage() {
    let cResult = document.getElementById("filterResult");
    const c2D = cResult.getContext("2d", {
        willReadFrequently: !0,
    });
    const image = new Image();
    image.src = fileReader.result.toString();
    image.onload = function () {
        originalImage.width = image.width;
        originalImage.height = image.height;
        cResult.width = image.width;
        cResult.height = image.height;
        original2D.drawImage(image, 0, 0);
        cResult = original2D.getImageData(0, 0, originalImage.width, originalImage.height);
        c2D.putImageData(cResult, 0, 0);
        document.getElementById("processed").textContent = `${imageFilename}, ${imageType}, W: ${image.width}, H: ${image.height}`;
        document.getElementById("original").textContent = `${imageFilename}, ${imageType}, W: ${image.width}, H: ${image.height}`;
        document.getElementById("transformXr").max = `${image.width}`;
        document.getElementById("transformYr").max = `${image.height}`;
        focusEditing();
    };
}

function saveSteps(canvas) {
    if (fuck > 0)
        operationHistory = operationHistory.slice(0, operationHistory.length - (fuck));
    operationHistory.push(canvas);
    index++;
    fuck = 0;
}

function revertImage(filter) {
    switch (filter) {
        case "revertImage": {
            if (index - 1 > 0) {
                index--;
                wtfBackup = operationHistory[index - 1];
                fuck++;
            } else {
                wtfBackup = operationHistory[0];
                index = 0;
            }
            break;
        }
        case "redoImage": {
            if (index < operationHistory.length - 1) {
                wtfBackup = operationHistory[index];
                index++;
                fuck = 0;
            } else {
                if (operationHistory.length > 0) {
                    wtfBackup = operationHistory[operationHistory.length - 1];
                    index = operationHistory.length;
                    fuck = 0;
                } else
                    wtfBackup = original2D.getImageData(0, 0, originalImage.width, originalImage.height);
            }
            break;
        }
        default:
            break;
    }
}


function RGBHSIConversion(command, x, y, z) {
    let red = 0;
    let green = 0;
    let blue = 0;
    const sum = x + y + z;
    let Hue;
    let Saturation;
    let Intensity = 0;
    if (command === "r2h") {
        if (sum > 0) {
            red = x / sum;
            green = y / sum;
            blue = z / sum;
        }
        let denominator = Math.sqrt(red ** 2 + green ** 2 + blue ** 2 - red * green - red * blue - green * blue);
        if (denominator === 0) denominator = 1;
        if (blue <= green) Hue = Math.acos((red - green / 2 - blue / 2) / denominator);
        else Hue = 2 * Math.PI - Math.acos((red - green / 2 - blue / 2) / denominator);
        if (Number.isNaN(Hue)) Hue = 0;
        Hue = (Hue * 180) / Math.PI;
        Saturation = (1 - 3 * Math.min(red, green, blue)) * 100;
        Intensity = sum / (3 * 255);
        return [Hue, Saturation, Intensity];
    } else {
        Hue = (x * Math.PI) / 180;
        Saturation = y / 100;
        if (x === 0) {
            red = z * (1 + 2 * Saturation);
            green = z * (1 - Saturation);
            blue = green;
        } else if (x < 120) {
            blue = z * (1 - Saturation);
            red = z + (z * Saturation * Math.cos(Hue)) / Math.cos(Math.PI / 3 - Hue);
            green = 3 * z - (blue + red);
        } else if (x === 120) {
            red = z - z * Saturation;
            green = z + 2 * z * Saturation;
            blue = red;
        } else if (x < 240) {
            red = z * (1 - Saturation);
            green = z * (1 + (Saturation * Math.cos(Hue - (2 * Math.PI) / 3)) / Math.cos(Math.PI - Hue));
            blue = 3 * z - (red + green);
        } else if (x === 240) {
            green = z * (1 - Saturation);
            blue = z * (1 + 2 * Saturation);
            red = green;
        } else if (x < 360) {
            green = z * (1 - Saturation);
            blue = z * (1 + (Saturation * Math.cos(Hue - (4 * Math.PI) / 3)) / Math.cos((5 * Math.PI) / 3 - Hue));
            red = 3 * z - (green + blue);
        }
        red *= 255;
        green *= 255;
        blue *= 255;
        return [red, green, blue];
    }
}

function draw() {
    filter2D.fillStyle = "#000000";
    filter2D.fillRect(0, 0, filterResult.width, filterResult.height);
    filter2D.putImageData(filterResult, 0, 0);
    for (const element of objects) {
        filter2D.font = "bold 25px consolas";
        filter2D.fillStyle = "green";
        filter2D.fillText(element.label, element.x + 6, element.y + 24);
        filter2D.beginPath();
        filter2D.rect(element.x, element.y, element.width, element.height);
        filter2D.strokeStyle = "green";
        filter2D.lineWidth = 8;
        filter2D.stroke();
        filter2D.closePath();
    }
}

async function detect() {
    modelLoadStatus.textContent = `${models.value} Model Loaded!`;
    loadedMl5 = true;
    if (models.value === "CocoSsd") {
        await cobjectDetector.detect(filter2D, function (err, results) {
            if (results) {
                objects = results;
                draw();
            }
        });
    } else {
        await yobjectDetector.detect(filter2D, function (err, results) {
            if (results) {
                objects = results;
                draw();
            }
        });
    }
}

async function imageFilter(filter) {
    const enableMultipleFilter = allowMultipleFilterOn.checked;
    const edgeDetection = edgeDetectionCheck.value;
    const flipDirection = flipDirectionHV.value;
    const checkGray = (edgeDetection === "grayFilterValue");
    const checkEdge = (edgeDetection !== "edgeValue");
    const graph = Array.from(Array(filterResult.height), () => new Array(filterResult.width));
    let customH = 0;
    let customS = 0;
    let customI = 0;
    let preCalcS = 0;
    let preCalcI = 0;
    let customR = 0;
    let customG = 0;
    let customB = 0;
    let customGamma = 0;
    let customP = 0;
    let customScale = 0;
    let customWhitening = 0;
    let preCalc = 0;
    let transformX = 0;
    let transformY = 0;
    let fishR = 0;
    let sheerAngle = 0;
    let tanTheta = 0;
    let tempW = 0;
    let tempH = 0;

    filterResult = filter2D.getImageData(0, 0, originalImage.width, originalImage.height);

    if (enableMultipleFilter && stepCount > 0 && filter !== "cancelFilter") {
        filter2D.putImageData(filterResult, 0, 0);
    } else if (!enableMultipleFilter || stepCount === 0) {
        filter2D.drawImage(originalImage, 0, 0);
        filterResult = filter2D.getImageData(0, 0, originalImage.width, originalImage.height);
    }
    if (filter === "hsi") {
        customH = parseFloat(document.getElementById("customH").value);
        customS = parseFloat(document.getElementById("customS").value);
        customI = parseFloat(document.getElementById("customI").value);
        preCalcS = customS / 100;
        preCalcI = customI / 100;
    } else if (filter === "colorbalance") {
        customR = parseFloat(document.getElementById("customR").value);
        customG = parseFloat(document.getElementById("customG").value);
        customB = parseFloat(document.getElementById("customB").value);
    } else if (filter === "adjustGamma") {
        customGamma = parseFloat(document.getElementById("customGamma").value);
    } else if (filter === "flip" || filter === "panning" || filter === "fish" || filter === "sheer") {
        for (let y = 0; y < filterResult.height; y++) {
            for (let x = 0; x < filterResult.width; x++) {
                const currentPixel = y * 4 * filterResult.width + 4 * x;
                graph[currentPixel] = filterResult.data[currentPixel];
                graph[currentPixel + 1] = filterResult.data[currentPixel + 1];
                graph[currentPixel + 2] = filterResult.data[currentPixel + 2];
            }
        }
        if (filter === "panning") {
            transformX = parseInt(document.getElementById("transformXt").value, 10);
            transformY = parseInt(document.getElementById("transformYt").value, 10);
        } else if (filter === "fish")
            fishR = Math.round(Math.min(filterResult.height, filterResult.width) / 2);
        else if (filter === "sheer") {
            sheerAngle = parseInt(document.getElementById("sheerAnglet").value, 10);
            tanTheta = Math.tan(sheerAngle * Math.PI / 180);
            tempW = Math.floor(filterResult.width / 2);
            tempH = Math.floor(filterResult.height / 2);
        }
    } else if (filter === "uniformNoise" || filter === "gaussianNoise" || filter === "exponentialNoise") {
        customScale = parseFloat(document.getElementById("customScale").value);
    } else if (filter === "impulseNoise") {
        customP = parseFloat(document.getElementById("Pps").value);
    } else if (filter === "skinWhitening") {
        customWhitening = parseFloat(document.getElementById("customWhitening").value);
    } else if (filter === "medianBlurFilter" || filter === "floyd" || filter === "histogramEq" || filter === "robertFilter") {
        for (let y = 0; y < filterResult.height; y++) {
            for (let x = 0; x < filterResult.width; x++) {
                const currentPixel = y * 4 * filterResult.width + 4 * x;
                if (filter === "medianBlurFilter" || filter === "histogramEq")
                    graph[y][x] = 3 * filterResult.data[currentPixel] + 6 * filterResult.data[currentPixel + 1] + filterResult.data[currentPixel + 2];
                else
                    graph[y][x] = 0.299 * filterResult.data[currentPixel] + 0.587 * filterResult.data[currentPixel + 1] + 0.114 * filterResult.data[currentPixel + 2];
            }
        }
    } else if (filter === "objectDetection") {
        if (loadedTfjs)
            location.reload();
        if (!loadedMl5)
            await loadScript("scripts/ml5.min.js").then().catch();
    }
    let exitOperation = false;
    for (let a = 0; a < filterResult.data.length; a += 4) {
        let red = filterResult.data[a];
        let green = filterResult.data[a + 1];
        let blue = filterResult.data[a + 2];
        const height = filterResult.height;
        const width = filterResult.width;
        const pixel = filterResult.data;
        let lum = 0;
        let preCalcX = 0;
        let preCalcY = 0;
        switch (filter) {
            case "inverse": {
                pixel[a] = 255 - red;
                pixel[a + 1] = 255 - green;
                pixel[a + 2] = 255 - blue;
                break;
            }
            case "grayscale": {
                const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
                pixel[a] = luminance;
                pixel[a + 1] = luminance;
                pixel[a + 2] = luminance;
                break;
            }
            case "sepia": {
                pixel[a] = red * 0.393 + green * 0.769 + blue * 0.189;
                pixel[a + 1] = red * 0.349 + green * 0.686 + blue * 0.168;
                pixel[a + 2] = red * 0.272 + green * 0.534 + blue * 0.131;
                break;
            }
            case "binary": {
                let gray = 0.299 * red + 0.587 * green + 0.114 * blue;
                if (gray >= 128) gray = 255;
                else gray = 0;
                pixel[a] = gray;
                pixel[a + 1] = gray;
                pixel[a + 2] = gray;
                break;
            }
            case "floyd": {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const currentPixel = y * 4 * width + 4 * x;
                        let gray = 0;
                        if (graph[y][x] >= 128) gray = 255;
                        pixel[currentPixel] = gray;
                        pixel[currentPixel + 1] = gray;
                        pixel[currentPixel + 2] = gray;
                        const error = graph[y][x] - gray;
                        let left = x - 1;
                        if (left < 0) left = 0;
                        let right = x + 1;
                        if (right > width - 1) right = width - 1;
                        let down = y + 1;
                        if (down > height - 1) down = height - 1;
                        graph[y][right] = graph[y][right] + (7 / 16) * error;
                        graph[down][left] = graph[down][left] + (3 / 16) * error;
                        graph[down][x] = graph[down][x] + (5 / 16) * error;
                        graph[down][right] = graph[down][right] + (1 / 16) * error;
                    }
                }
                exitOperation = true;
                break;
            }
            case "dither": {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const currentPixel = y * 4 * width + 4 * x;
                        let gray = pixel[currentPixel] * 0.299 + pixel[currentPixel + 1] * 0.587 + pixel[currentPixel + 2] * 0.114;
                        if (gray >= dmatrix[y % 4][x % 4]) gray = 255;
                        else gray = 0;
                        pixel[currentPixel] = gray;
                        pixel[currentPixel + 1] = gray;
                        pixel[currentPixel + 2] = gray;
                    }
                }
                exitOperation = true;
                break;
            }
            case "histogramEq" : {
                const freq = new Array(256).fill(0);
                const cdf = new Array(256).fill(0);
                const he = new Array(256).fill(0);
                for (let len = 0; len < pixel.length; len += 4) {
                    freq[pixel[len]]++;
                    freq[pixel[len + 1]]++;
                    freq[pixel[len + 2]]++;
                }
                cdf[0] = freq[0];
                for (let i = 1; i < 256; i++) {
                    cdf[i] = cdf[i - 1] + freq[i];
                }
                for (let i = 0; i < 256; i++) {
                    he[i] = Math.round(((cdf[i] - cdf[0]) * 255) / ((width * height * 3) - cdf[0]));
                }
                for (let len = 0; len < pixel.length; len += 4) {
                    pixel[len] = he[pixel[len]];
                    pixel[len + 1] = he[pixel[len + 1]];
                    pixel[len + 2] = he[pixel[len + 2]];
                }
                exitOperation = true;
                break;
            }
            case "fish":
            case "panning":
            case "sheer":
            case "flip": {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const currentPixel = y * 4 * width + 4 * x;
                        let r = 0;
                        let transformPixel = 0;
                        let checkBound = false;
                        const checkDirection = (flipDirection === "horizontal");
                        if (filter === "flip") {
                            const preCalcTemp1 = (4 * (width - x - 1));
                            preCalcY = y * width * 4 + preCalcTemp1;
                            preCalcX = (height - y - 1) * 4 * width + preCalcTemp1;
                            transformPixel = checkDirection ? preCalcY : preCalcX;
                        } else if (filter === "fish") {
                            const preCalcTemp1 = (height / 2);
                            const preCalcTemp2 = (width / 2);
                            const preCalcTemp3 = (y - preCalcTemp1);
                            const preCalcTemp4 = (x - preCalcTemp2);
                            r = Math.sqrt(preCalcTemp3 ** 2 + preCalcTemp4 ** 2);
                            const preCalcTemp5 = (r / fishR);
                            preCalcY = Math.round(preCalcTemp3 * preCalcTemp5 + preCalcTemp1);
                            preCalcX = Math.round(preCalcTemp4 * preCalcTemp5 + preCalcTemp2);
                        } else if (filter === "panning") {
                            preCalcY = (y - transformY);
                            preCalcX = (x - transformX);
                        } else {
                            const preCalcTemp1 = x - tempW;
                            const preCalcTemp2 = y - tempH;
                            preCalcY = checkDirection ? Math.round(preCalcTemp1 * tanTheta + preCalcTemp2) : preCalcTemp2;
                            preCalcX = checkDirection ? preCalcTemp1 : Math.round(preCalcTemp2 * tanTheta + preCalcTemp1);
                            preCalcX += tempW;
                            preCalcY += tempH;
                        }
                        if (filter !== "flip") {
                            transformPixel = preCalcY * 4 * width + preCalcX * 4;
                            checkBound = preCalcX < width && preCalcY < height && preCalcX >= 0 && preCalcY >= 0;
                        } else
                            checkBound = true;
                        pixel[currentPixel] = checkBound ? graph[transformPixel] : 0;
                        pixel[currentPixel + 1] = checkBound ? graph[transformPixel + 1] : 0;
                        pixel[currentPixel + 2] = checkBound ? graph[transformPixel + 2] : 0;
                    }
                }
                exitOperation = true;
                break;
            }
            case "hsi": {
                const hsi = RGBHSIConversion("r2h", red, green, blue);
                hsi[0] = (hsi[0] + customH + 360) % 360;
                if (customS >= 0) hsi[1] = hsi[1] - (1 - hsi[1]) * preCalcS;
                else hsi[1] = hsi[1] + hsi[1] * preCalcS;
                if (customI >= 0) hsi[2] = hsi[2] + hsi[2] * preCalcI;
                else hsi[2] = hsi[2] + (1 - hsi[2]) * preCalcI;
                const rgb = RGBHSIConversion("h2r", hsi[0], hsi[1], hsi[2]);
                pixel[a] = rgb[0];
                pixel[a + 1] = rgb[1];
                pixel[a + 2] = rgb[2];
                break;
            }
            case "colorbalance": {
                if (red < 128) red = red * (customR / 300);
                else red = (255 - red) * (customR / 300);
                if (green < 128) green = green * (customG / 300);
                else green = (255 - green) * (customG / 300);
                if (blue < 128) blue = blue * (customB / 300);
                else blue = (255 - blue) * (customB / 300);
                pixel[a] += red - green / 2 - blue / 2;
                pixel[a + 1] += green - red / 2 - blue / 2;
                pixel[a + 2] += blue - red / 2 - green / 2;
                break;
            }
            case "adjustGamma" : {
                preCalc = 255 * Math.pow(1 / 255, customGamma);
                pixel[a] = preCalc * (red ** customGamma);
                pixel[a + 1] = preCalc * (green ** customGamma);
                pixel[a + 2] = preCalc * (blue ** customGamma);
                break;
            }
            case "uniformNoise": {
                const noise = rand() * customScale;
                pixel[a] += noise;
                pixel[a + 1] += noise;
                pixel[a + 2] += noise;
                break;
            }
            case "gaussianNoise": {
                const gaussianNoise = customScale * (rand() + rand() + rand());
                pixel[a] += gaussianNoise;
                pixel[a + 1] += gaussianNoise;
                pixel[a + 2] += gaussianNoise;
                break;
            }
            case "laplacianEdgeFilter":
            case "robertFilter":
            case "prewittFilter":
            case "reliefFilter":
            case "highBoxBlurFilter":
            case "extendLaplacianFilter":
            case "laplacianFilter":
            case "sobelFilter":
            case "unsharpFilter":
            case "embossFilter":
            case "sharpenFilter":
            case "gaussianBlurFilter":
            case "medianBlurFilter":
            case "boxBlurFilter": {
                const Red = [];
                const Green = [];
                const Blue = [];
                for (let y = 0; y < height; y++) {
                    Red[y] = [];
                    Green[y] = [];
                    Blue[y] = [];
                    for (let x = 0; x < width; x++) {
                        const currentPixel = y * 4 * width + 4 * x;
                        Red[y][x] = pixel[currentPixel];
                        Green[y][x] = pixel[currentPixel + 1];
                        Blue[y][x] = pixel[currentPixel + 2];
                    }
                }
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        let left = x - 1;
                        if (left < 0) left = 0;
                        let right = x + 1;
                        if (right > width - 1) right = width - 1;
                        let up = y - 1;
                        if (up < 0) up = 0;
                        let down = y + 1;
                        if (down > height - 1) down = height - 1;
                        const currentPixel = y * 4 * width + 4 * x;
                        if (filter === "medianBlurFilter") {
                            const positions = [[up, left], [up, x], [up, right], [y, left], [y, x], [y, right], [down, left], [down, x], [down, right]];
                            let medianMask = new Int32Array(9);
                            for (let i = 0; i < positions.length; i++) {
                                medianMask[i] = graph[positions[i][0]][positions[i][1]];
                            }
                            medianMask.sort((a, b) => a - b);
                            let ypos = 0;
                            let xpos = 0;
                            const mMask = medianMask[4];
                            for (const element of positions) {
                                if (graph[element[0]][element[1]] === mMask) {
                                    [ypos, xpos] = element;
                                    break;
                                }
                            }
                            pixel[currentPixel] = Red[ypos][xpos];
                            pixel[currentPixel + 1] = Green[ypos][xpos];
                            pixel[currentPixel + 2] = Blue[ypos][xpos];
                        } else if (filter === "sobelFilter" || filter === "prewittFilter" || filter === "robertFilter") {
                            let filterX, filterY, Gx, Gy;
                            if (filter === "robertFilter") {
                                filterX = robertsX;
                                filterY = robertsY;
                            } else {
                                filterX = (filter === "sobelFilter") ? sobelFilterX : prewittFilterX;
                                filterY = (filter === "sobelFilter") ? sobelFilterY : prewittFilterY;
                            }
                            const channels = [Red, Green, Blue];
                            const results = [];
                            for (const element of channels) {
                                let channel = element;
                                if (filter === "robertFilter") {
                                    Gx = channel[y][x] * filterX[0][0] + channel[y][left] * filterX[0][1] + channel[down][x] * filterX[1][0] + channel[down][left] * filterX[1][1];
                                    Gy = channel[y][x] * filterY[0][0] + channel[y][left] * filterY[0][1] + channel[down][x] * filterY[1][0] + channel[down][left] * filterY[1][1];
                                } else {
                                    const positions = [[up, left], [up, x], [up, right], [y, left], [y, x], [y, right], [down, left], [down, x], [down, right]];
                                    Gx = Gy = 0;
                                    for (let j = 0; j < positions.length; j++) {
                                        Gx += channel[positions[j][0]][positions[j][1]] * filterX[Math.floor(j / 3)][j % 3];
                                        Gy += channel[positions[j][0]][positions[j][1]] * filterY[Math.floor(j / 3)][j % 3];
                                    }
                                }
                                let result = Math.sqrt(Gx ** 2 + Gy ** 2);
                                if (result < 0) {
                                    results.push(result > 255 ? 255 : 0);
                                } else {
                                    results.push(result > 255 ? 255 : result);
                                }
                            }
                            let [convR, convG, convB] = results;
                            let lum = 0.2126 * convR + 0.7152 * convG + 0.0722 * convB;
                            switch (edgeDetection) {
                                case "filterValue":
                                case "grayFilterValue":
                                    const preCalcLum = 255 - lum;
                                    pixel[currentPixel] = pixel[currentPixel + 1] = pixel[currentPixel + 2] = checkGray ? preCalcLum : convR;
                                    pixel[currentPixel + 1] = checkGray ? preCalcLum : convG;
                                    pixel[currentPixel + 2] = checkGray ? preCalcLum : convB;
                                    break;
                                default:
                                    const preCalcAbs = Math.abs(255 - Math.abs(lum)) > 127 ? 255 : 0;
                                    pixel[currentPixel] = pixel[currentPixel + 1] = pixel[currentPixel + 2] = preCalcAbs;
                                    break;
                            }
                        } else {
                            const filterKernelMap = {
                                "gaussianBlurFilter": {kernel: gaussianBlur, extraValue: 0},
                                "sharpenFilter": {kernel: sharpen, extraValue: 0},
                                "embossFilter": {kernel: emboss, extraValue: 128},
                                "unsharpFilter": {kernel: unsharp, extraValue: 0},
                                "laplacianFilter": {kernel: laplacian, extraValue: 0},
                                "laplacianEdgeFilter": {kernel: laplacianEdge, extraValue: 0},
                                "extendLaplacianFilter": {kernel: extendLaplacian, extraValue: 0},
                                "highBoxBlurFilter": {kernel: highBoxBlur, extraValue: 0},
                                "reliefFilter": {kernel: relief, extraValue: 0},
                                "default": {kernel: boxBlur, extraValue: 0}
                            };
                            let filterKernel = filterKernelMap[filter]?.kernel || filterKernelMap["default"].kernel;
                            let extraValue = filterKernelMap[filter]?.extraValue || filterKernelMap["default"].extraValue;
                            for (let i = 0; i < 3; i++) {
                                let color = [Red, Green, Blue][i];
                                pixel[currentPixel + i] = color[up][left] * filterKernel[0][0] + color[up][x] * filterKernel[0][1] + color[up][right] * filterKernel[0][2] +
                                    color[y][left] * filterKernel[1][0] + color[y][x] * filterKernel[1][1] + color[y][right] * filterKernel[1][2] +
                                    color[down][left] * filterKernel[2][0] + color[down][x] * filterKernel[2][1] + color[down][right] * filterKernel[2][2] + extraValue;
                            }
                            if (filter === "laplacianEdgeFilter") {
                                lum = 0.2126 * pixel[currentPixel] + 0.7152 * pixel[currentPixel + 1] + 0.0722 * pixel[currentPixel + 2];
                                if (!checkEdge && !checkGray) {
                                    preCalc = Math.abs(255 - Math.abs(lum)) > 127 ? 255 : 0;
                                    pixel[currentPixel] = preCalc;
                                    pixel[currentPixel + 1] = preCalc;
                                    pixel[currentPixel + 2] = preCalc;
                                } else {
                                    preCalc = 255 - (0.2126 * pixel[currentPixel] + 0.7152 * pixel[currentPixel + 1] + 0.0722 * pixel[currentPixel + 2]);
                                    pixel[currentPixel] = checkGray ? preCalc : pixel[currentPixel];
                                    pixel[currentPixel + 1] = checkGray ? preCalc : pixel[currentPixel + 1];
                                    pixel[currentPixel + 2] = checkGray ? preCalc : pixel[currentPixel + 2];
                                }
                            }
                        }
                    }
                }
                exitOperation = true;
                break;
            }
            case "exponentialNoise": {
                const exponentialNoise = customScale * ((-1 * Math.log(1 - rand())) / 2);
                pixel[a] += exponentialNoise;
                pixel[a + 1] += exponentialNoise;
                pixel[a + 2] += exponentialNoise;
                break;
            }
            case "impulseNoise": {
                const impulseNoise = rand();
                if (impulseNoise >= 0 && impulseNoise <= customP / 2) {
                    pixel[a] = 0;
                    pixel[a + 1] = 0;
                    pixel[a + 2] = 0;
                } else if (customP / 2 < impulseNoise && impulseNoise <= customP) {
                    pixel[a] = 255;
                    pixel[a + 1] = 255;
                    pixel[a + 2] = 255;
                }
                break;
            }
            case "validateYCbCr":
            case "skinWhitening": {
                let Yvar = 0.299 * red + 0.587 * green + 0.114 * blue;
                const cB = -0.168736 * red - 0.331264 * green + 0.5 * blue + 128;
                const cR = 0.499813 * red - 0.418531 * green - 0.081282 * blue + 128;
                if (filter === "skinWhitening" && Yvar > 80 && cB > 85 && cB < 135 && cR > 135 && cR < 180) Yvar *= customWhitening;
                pixel[a] = Yvar + 1.402 * (cR - 128);
                pixel[a + 1] = Yvar - 0.34414 * (cB - 128) - 0.71414 * (cR - 128);
                pixel[a + 2] = Yvar + 1.772 * (cB - 128);
                break;
            }
            case "showSkinArea": {
                const Yvar = 0.299 * red + 0.587 * green + 0.114 * blue;
                const cB = -0.168736 * red - 0.331264 * green + 0.5 * blue + 128;
                const cR = 0.499813 * red - 0.418531 * green - 0.081282 * blue + 128;
                pixel[a] = 0;
                pixel[a + 1] = 0;
                pixel[a + 2] = 0;
                if (Yvar > 80 && cB > 85 && cB < 135 && cR > 135 && cR < 180) {
                    pixel[a] = 255;
                    pixel[a + 1] = 255;
                    pixel[a + 2] = 255;
                }
                break;
            }
            case "objectDetection": {
                if (models.value === "CocoSsd") {
                    if (!cmodelCheck) {
                        cobjectDetector = ml5.objectDetector('cocossd', detect);
                        cmodelCheck = true;
                    } else
                        await detect();
                } else if (models.value === "YOLO") {
                    if (!ymodelCheck) {
                        yobjectDetector = ml5.objectDetector('yolo', detect);
                        ymodelCheck = true;
                    } else
                        await detect();
                }
                exitOperation = true;
                break;
            }
            case "cancelFilter": {
                filter2D.drawImage(originalImage, 0, 0);
                cleanup();
                exitOperation = true;
                break;
            }
            case "redoImage":
            case "revertImage": {
                if (operationHistory.length > 0) {
                    revertImage(filter);
                    filterResult = wtfBackup;
                } else
                    filterResult = original2D.getImageData(0, 0, originalImage.width, originalImage.height);
                exitOperation = true;
                break;
            }
            case "loadSave": {
                filterResult = savepointImage;
                cleanup();
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

    if (stepCount >= 0 && (filter !== "cancelFilter" && filter !== "objectDetection")) {
        filter2D.putImageData(filterResult, 0, 0);
        if (filter !== "revertImage" && filter !== "redoImage" && enableMultipleFilter)
            saveSteps(filterResult);
    }
    stepCount++;
}

function specialCheck(detectText) {
    let shit = detectText.text;
    shit = shit.replace(/[^a-zA-Z0-9]+/g, '');
    shit = shit.replace(/0/i, 'o');
    shit = (shit.length > 5) ? shit.slice(0, 5) : shit;
    shit = shit.toLowerCase();
    if (shit.length < 5)
        shit = "No Result";
    return shit;
}

async function getCaptcha(canv) {
    loadedTesseract = true;
    const corePath = window.navigator.userAgent.indexOf("Edge") > -1 ?
        'scripts/tesseract-core.asm.js' :
        'scripts/tesseract-core.wasm.js';
    const workerPath = 'scripts/worker.min.js';
    const langPath = '.';
    const worker = await new Tesseract.TesseractWorker({
        corePath, workerPath, langPath,
    });
    await worker.recognize(canv, "eng").progress(function (packet) {
        /*packet checking*/
    }).then(function (data) {
        document.getElementById("captcha").textContent = `${specialCheck(data)}`;
    });
    await worker.terminate();
}

async function fuckCAPTCHA() {
    const special = specialShit.checked;
    const customModel = loadCustomModel.checked;
    if (!loadedTesseract || !loadedTfjs) {
        await loadScript("scripts/tesseract.min.js");
        await loadScript("scripts/tf.min.js");
    }
    loadedTesseract=true;
    loadedTfjs=true;
    if (special) {
        document.getElementById("allowMultipleFilterOn").checked = true;
        await imageFilter("grayscale");
        await imageFilter("medianBlurFilter");
        await imageFilter("gaussianBlurFilter");
        await imageFilter("sharpenFilter");
        document.getElementById("customH").value = 0;
        document.getElementById("customS").value = 0;
        document.getElementById("customI").value = -81;
        await imageFilter("hsi");
        document.getElementById("customI").value = 82;
        await imageFilter("hsi");
        document.getElementById("customI").value = 18;
        await imageFilter("hsi");
        await getCaptcha(document.getElementById("filterResult").toDataURL());
    }
    if (customModel) {
        if (loadedMl5)
            location.reload();
        const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
        const tfmodel = await tf.loadLayersModel('models/school_captcha/model.json');
        const captchaImageElement = document.getElementById("originalImage");
        const img = new Image();
        img.onload = async () => {
            const tensor = tf.browser.fromPixels(img, 1)
                .resizeNearestNeighbor([30, 90])
                .expandDims()
                .toFloat()
                .div(255.0);
            const prediction = tfmodel.predict(tensor);
            const output = [];
            const promises = prediction.map(p =>
                p.data().then(array => {
                    output.push(Array.from(array));
                })
            );
            await Promise.all(promises);
            const captcha = output.map(array => characters[array.indexOf(Math.max(...array))]).join('');
            document.getElementById("captchaCustom").textContent = `${captcha}`;
        };
        img.src = captchaImageElement.toDataURL();
    }
}

valueSync(true);

userImage.addEventListener("change", readImage);
fileReader.addEventListener("load", loadImage);

function initFunctions() {
    const filterFunction = ['inverse', 'grayscale', 'sepia', 'binary', 'dither', 'floyd', 'histogramEq', 'adjustGamma',
        'uniformNoise', 'gaussianNoise', 'exponentialNoise', 'impulseNoise', 'laplacianFilter', 'extendLaplacianFilter', 'boxBlurFilter', 'highBoxBlurFilter',
        'gaussianBlurFilter', 'medianBlurFilter', 'sharpenFilter', 'unsharpFilter', 'embossFilter', 'reliefFilter', 'sobelFilter', 'prewittFilter',
        'robertFilter', 'laplacianEdgeFilter', 'revertImage', 'redoImage', 'cancelFilter', 'loadSave', 'flip', 'fish', 'panning', 'sheer', 'showSkinArea', 'skinWhitening',
        'validateYCbCr', 'objectDetection'];
    const uiFunction = ['savepoint', 'download', 'fullscreenCanvas', 'fullscreen', 'closeFullscreen', 'fuckCAPTCHA', 'focusEditing'];
    const dynamicFunction = {
        'hue': 'hsi',
        'customH': 'hsi',
        'saturation': "hsi",
        'customS': 'hsi',
        'intensity': 'hsi',
        'customI': 'hsi',
        'Red': 'colorbalance',
        'customR': 'colorbalance',
        'Green': 'colorbalance',
        'customG': 'colorbalance',
        'Blue': 'colorbalance',
        'customB': 'colorbalance'
    };
    const webpage = document;
    const init_savepoint = () => savepoint;
    const init_imageFilter = (filter) => imageFilter(filter);
    const init_openFullscreen = (elem) => openFullscreen(elem);
    const init_fuckCAPTCHA = async () => {
        await fuckCAPTCHA();
    };
    const init_focusEditing = () => focusEditing;
    const init_closeFullscreen = () => closeFullscreen();
    const init_download = () => download();
    for (const element of filterFunction) {
        const el = webpage.getElementById(element);
        const staticTemp1 = element;
        const functionCall = () => {
            el.addEventListener("click", () => {
                init_imageFilter(staticTemp1).then(() => {}).catch(() => {
                    // intentionally empty.
                });
            });
        };
        functionCall();
    }
    const uiFunctionMap = {
        "fullscreenCanvas": () => init_openFullscreen(webpage.getElementById("filterResult")),
        "fullscreen": () => init_openFullscreen(webpage.documentElement),
        "savepoint": init_savepoint,
        "fuckCAPTCHA": init_fuckCAPTCHA,
        "focusEditing": init_focusEditing,
        "closeFullscreen": () => init_closeFullscreen(),
        "download": () => init_download()
    };
    for (const element of uiFunction) {
        const el = webpage.getElementById(element);
        const functionCall = uiFunctionMap[element];
        if (functionCall && el) {
            el.addEventListener("click", functionCall);
        }
    }
    for (const [key, value] of Object.entries(dynamicFunction)) {
        const functionCall = () => {
            const el = webpage.getElementById(key);
            el.addEventListener("click", () => {
                init_imageFilter(value).then(() => {}).catch(() => {
                    // intentionally empty.
                });
            });
        };
        functionCall();
    }
}
