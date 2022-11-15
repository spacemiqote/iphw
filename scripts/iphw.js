/*jshint esversion: 6 */
const userImage = document.getElementById("userImage");
const originalImage = document.getElementById("originalImage");
const allowMultipleFilterOn = document.getElementById("allowMultipleFilterOn");
const fileReader = new FileReader(),
    original2D = originalImage.getContext("2d", {
        willReadFrequently: !0,
    });
const range = document.querySelectorAll(".inputRange");
const field = document.querySelectorAll(".inputNumber");
const dmatrix = [
    [0, 128, 32, 160],
    [192, 64, 224, 96],
    [48, 176, 16, 144],
    [240, 112, 208, 80],
];
const identity = [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
];
const boxBlur = [
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
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
const sobelFilterX = [
    [1,0,-1],
    [2,0,-2],
    [1,0,-1],
];
const sobelFilterY = [
    [1,2,1],
    [0,0,0],
    [-1,-2,-1],
];

//https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-image-processing-continued.html
const unsharp = [
    [-1, -1, -1],
    [-1, 9, -1],
    [-1, -1, -1],
];

const emboss = [
    [-2, -1, 0],
    [-1, 1, 1],
    [0, 1, 2],
];

let filterResult = document.getElementById("filterResult");
const coll = document.getElementsByClassName("collapse");
const filter2D = filterResult.getContext("2d", {
    willReadFrequently: !0,
});
let backupImage = filterResult;
let stepCount = 0;
let loaded = false;

function goFullScreen() {
    const canvas = document.getElementById("filterResult");
    if (canvas.requestFullScreen) canvas.requestFullScreen();
    else if (canvas.webkitRequestFullScreen) canvas.webkitRequestFullScreen();
    else if (canvas.mozRequestFullScreen) canvas.mozRequestFullScreen();
}

function download() {
    const link = document.createElement("a");
    link.download = "download.png";
    link.href = document.getElementById("filterResult").toDataURL();
    link.click();
}

function valueSync(value) {
    for (let i = 0; i < range.length; i++) {
        if (value === true) {
            range[i].addEventListener("input", function(e) {
                field[i].value = e.target.value;
            });
            field[i].addEventListener("input", function(e) {
                range[i].value = e.target.value;
            });
        } else if (!range[i].classList.contains("noSync")) {
            field[i].value = 0;
            range[i].value = 0;
        }
    }
    if (!loaded) {
        for (const i of coll) {
            i.addEventListener("click", function() {
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
    let cResult = document.getElementById("filterResult");
    const c2D = cResult.getContext("2d", {
        willReadFrequently: !0,
    });
    const image = new Image();
    image.src = fileReader.result.toString();
    image.onload = function() {
        originalImage.width = image.width;
        originalImage.height = image.height;
        cResult.width = image.width;
        cResult.height = image.height;
        original2D.drawImage(image, 0, 0);
        cResult = original2D.getImageData(0, 0, originalImage.width, originalImage.height);
        c2D.putImageData(cResult, 0, 0);
    };
}

function RGBHSIConversion(command, x, y, z) {
    let red = 0;
    let green = 0;
    let blue = 0;
    let Hue = 0;
    let Saturation = 0;
    let Intensity = 0;
    if (command === "r2h") {
        if (x + y + z > 0) {
            red = x / (x + y + z);
            green = y / (x + y + z);
            blue = z / (x + y + z);
        } else {
            red = green = blue = 0;
        }
        if (x === y && y === z) {
            Hue = Saturation = 0;
        } else if (blue <= green) Hue = Math.acos((red - green / 2 - blue / 2) / Math.sqrt(red ** 2 + green ** 2 + blue ** 2 - red * green - red * blue - green * blue));
        else Hue = 2 * Math.PI - Math.acos((red - green / 2 - blue / 2) / Math.sqrt(red ** 2 + green ** 2 + blue ** 2 - red * green - red * blue - green * blue));
        if (Number.isNaN(Hue)) Hue = 0;
        Hue = (Hue * 180) / Math.PI;
        Saturation = (1 - 3 * Math.min(red, green, blue)) * 100;
        Intensity = (x + y + z) / (3 * 255);
        return [Hue, Saturation, Intensity];
    } else if (command === "h2r") {
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
    const graph = Array.from(Array(filterResult.height), () => new Array(filterResult.width));

    let customH = 0;
    let customS = 0;
    let customI = 0;
    let customR = 0;
    let customG = 0;
    let customB = 0;
    let customP = 0;
    let customScale = 0;
    let customWhitening = 0;
    filterResult.width = originalImage.width;
    filterResult.height = originalImage.height;
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
    } else if (filter === "colorbalance") {
        customR = parseFloat(document.getElementById("customR").value);
        customG = parseFloat(document.getElementById("customG").value);
        customB = parseFloat(document.getElementById("customB").value);
    } else if (filter === "uniformNoise" || filter === "gaussianNoise" || filter === "exponentialNoise") {
        customScale = parseFloat(document.getElementById("customScale").value);
    } else if (filter === "impulseNoise") {
        customP = parseFloat(document.getElementById("Pps").value);
    } else if (filter === "skinWhitening") {
        customWhitening = parseFloat(document.getElementById("customWhitening").value);
    } else if (filter === "medianBlurFilter" || filter === "floyd") {
        for (let y = 0; y < filterResult.height; y++) {
            for (let x = 0; x < filterResult.width; x++) {
                const currentPixel = y * 4 * filterResult.width + 4 * x;
                graph[y][x] = 0.299 * filterResult.data[currentPixel] + 0.587 * filterResult.data[currentPixel + 1] + 0.114 * filterResult.data[currentPixel + 2];
                if (filter === "medianBlurFilter")
                    graph[y][x] = 3 * filterResult.data[currentPixel] + 6 * filterResult.data[currentPixel + 1] + filterResult.data[currentPixel + 2];
            }
        }
    }
    let exitOperation = false;
    for (let a = 0; a < filterResult.data.length; a += 4) {
        let red = filterResult.data[a];
        let green = filterResult.data[a + 1];
        let blue = filterResult.data[a + 2];
        const height = filterResult.height;
        const width = filterResult.width;
        const pixel = filterResult.data;

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
            case "hsi": {
                const hsi = RGBHSIConversion("r2h", red, green, blue);
                hsi[0] = (hsi[0] + customH + 360) % 360;
                if (customS >= 0) hsi[1] = hsi[1] - (1 - hsi[1]) * (customS / 100);
                else hsi[1] = hsi[1] + hsi[1] * (customS / 100);
                if (customI >= 0) hsi[2] = hsi[2] + hsi[2] * (customI / 100);
                else hsi[2] = hsi[2] + (1 - hsi[2]) * (customI / 100);
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
            case "uniformNoise": {
                const noise = Math.floor(Math.random() * customScale);
                pixel[a] += noise;
                pixel[a + 1] += noise;
                pixel[a + 2] += noise;
                break;
            }
            case "gaussianNoise": {
                const gaussianNoise = customScale * ((Math.random() + Math.random() + Math.random()) / 3);
                pixel[a] += gaussianNoise;
                pixel[a + 1] += gaussianNoise;
                pixel[a + 2] += gaussianNoise;
                break;
            }
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
                    for (let x = 0; x < width; ++x) {
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
                            let medianMask = new Int32Array([graph[up][left], graph[up][x], graph[up][right], graph[y][left], graph[y][x], graph[y][right], graph[down][left], graph[down][x], graph[down][right]]);
                            medianMask = medianMask.sort();
                            let ypos = 0;
                            let xpos = 0;
                            const mMask = medianMask[4];
                            if (mMask === graph[up][left]) {
                                ypos = up;
                                xpos = left;
                            } else if (mMask === graph[up][x]) {
                                ypos = up;
                                xpos = x;
                            } else if (mMask === graph[up][right]) {
                                ypos = up;
                                xpos = right;
                            } else if (mMask === graph[y][left]) {
                                ypos = y;
                                xpos = left;
                            } else if (mMask === graph[y][x]) {
                                ypos = y;
                                xpos = x;
                            } else if (mMask === graph[y][right]) {
                                ypos = y;
                                xpos = right;
                            } else if (mMask === graph[down][left]) {
                                ypos = down;
                                xpos = left;
                            } else if (mMask === graph[down][x]) {
                                ypos = down;
                                xpos = x;
                            } else if (mMask === graph[down][right]) {
                                ypos = down;
                                xpos = right;
                            }
                            pixel[currentPixel] = Red[ypos][xpos];
                            pixel[currentPixel + 1] = Green[ypos][xpos];
                            pixel[currentPixel + 2] = Blue[ypos][xpos];
                        }
                        else if(filter === "sobelFilter"){
                            let R_Gx = (sobelFilterX[0][0]*Red[up][left]+Red[up][x] * sobelFilterX[0][1] + Red[up][right] * sobelFilterX[0][2] +
                                Red[y][left] * sobelFilterX[1][0] + Red[y][x] * sobelFilterX[1][1] + Red[y][right] * sobelFilterX[1][2] +
                                Red[down][left] * sobelFilterX[2][0] + Red[down][x] * sobelFilterX[2][1] + Red[down][right] * sobelFilterX[2][2]);
                            let R_Gy = (sobelFilterY[0][0]*Red[up][left]+Red[up][x] * sobelFilterY[0][1] + Red[up][right] * sobelFilterY[0][2] +
                                Red[y][left] * sobelFilterY[1][0] + Red[y][x] * sobelFilterY[1][1] + Red[y][right] * sobelFilterY[1][2] +
                                Red[down][left] * sobelFilterY[2][0] + Red[down][x] * sobelFilterY[2][1] + Red[down][right] * sobelFilterY[2][2]);
                            let sobelR = Math.sqrt(R_Gx**2+R_Gy**2);
                            if (sobelR<0)
                                sobelR = 0;
                            if (sobelR>255)
                                sobelR = 255;
                            let G_Gx = (sobelFilterX[0][0]*Green[up][left]+Green[up][x] * sobelFilterX[0][1] + Green[up][right] * sobelFilterX[0][2] +
                                Green[y][left] * sobelFilterX[1][0] + Green[y][x] * sobelFilterX[1][1] + Green[y][right] * sobelFilterX[1][2] +
                                Green[down][left] * sobelFilterX[2][0] + Green[down][x] * sobelFilterX[2][1] + Green[down][right] * sobelFilterX[2][2]);
                            let G_Gy = (sobelFilterY[0][0]*Green[up][left]+Green[up][x] * sobelFilterY[0][1] + Green[up][right] * sobelFilterY[0][2] +
                                Green[y][left] * sobelFilterY[1][0] + Green[y][x] * sobelFilterY[1][1] + Green[y][right] * sobelFilterY[1][2] +
                                Green[down][left] * sobelFilterY[2][0] + Green[down][x] * sobelFilterY[2][1] + Green[down][right] * sobelFilterY[2][2]);
                            let sobelG = Math.sqrt(G_Gx**2+G_Gy**2);
                            if (sobelG<0)
                                sobelG = 0;
                            if (sobelG>255)
                                sobelG = 255;
                            let B_Gx = (sobelFilterX[0][0]*Blue[up][left]+Blue[up][x] * sobelFilterX[0][1] + Blue[up][right] * sobelFilterX[0][2] +
                                Blue[y][left] * sobelFilterX[1][0] + Blue[y][x] * sobelFilterX[1][1] + Blue[y][right] * sobelFilterX[1][2] +
                                Blue[down][left] * sobelFilterX[2][0] + Blue[down][x] * sobelFilterX[2][1] + Blue[down][right] * sobelFilterX[2][2]);
                            let B_Gy = (sobelFilterY[0][0]*Blue[up][left]+Blue[up][x] * sobelFilterY[0][1] + Blue[up][right] * sobelFilterY[0][2] +
                                Blue[y][left] * sobelFilterY[1][0] + Blue[y][x] * sobelFilterY[1][1] + Blue[y][right] * sobelFilterY[1][2] +
                                Blue[down][left] * sobelFilterY[2][0] + Blue[down][x] * sobelFilterY[2][1] + Blue[down][right] * sobelFilterY[2][2]);
                            let sobelB = Math.sqrt(B_Gx**2+B_Gy**2);
                            if (sobelB<0)
                                sobelB = 0;
                            if (sobelB>255)
                                sobelB = 255;
                            pixel[currentPixel] = sobelR;
                            pixel[currentPixel+1] = sobelG;
                            pixel[currentPixel+2] = sobelB;
                        }
                        else {
                            let filterKernel = boxBlur;
                            if (filter === "gaussianBlurFilter")
                                filterKernel = gaussianBlur;
                            else if (filter === "sharpenFilter")
                                filterKernel = sharpen;
                            else if (filter === "embossFilter")
                                filterKernel = emboss;
                            else if (filter === "unsharpFilter")
                                filterKernel = unsharp;
                            pixel[currentPixel] = Red[up][left] * filterKernel[0][0] + Red[up][x] * filterKernel[0][1] + Red[up][right] * filterKernel[0][2] +
                                Red[y][left] * filterKernel[1][0] + Red[y][x] * filterKernel[1][1] + Red[y][right] * filterKernel[1][2] +
                                Red[down][left] * filterKernel[2][0] + Red[down][x] * filterKernel[2][1] + Red[down][right] * filterKernel[2][2];
                            pixel[currentPixel + 1] = Green[up][left] * filterKernel[0][0] + Green[up][x] * filterKernel[0][1] + Green[up][right] * filterKernel[0][2] +
                                Green[y][left] * filterKernel[1][0] + Green[y][x] * filterKernel[1][1] + Green[y][right] * filterKernel[1][2] +
                                Green[down][left] * filterKernel[2][0] + Green[down][x] * filterKernel[2][1] + Green[down][right] * filterKernel[2][2];
                            pixel[currentPixel + 2] = Blue[up][left] * filterKernel[0][0] + Blue[up][x] * filterKernel[0][1] + Blue[up][right] * filterKernel[0][2] +
                                Blue[y][left] * filterKernel[1][0] + Blue[y][x] * filterKernel[1][1] + Blue[y][right] * filterKernel[1][2] +
                                Blue[down][left] * filterKernel[2][0] + Blue[down][x] * filterKernel[2][1] + Blue[down][right] * filterKernel[2][2];
                        }
                    }
                }
                exitOperation = true;
                break;
            }
            case "exponentialNoise": {
                const exponentialNoise = customScale * ((-1 * Math.log(1 - Math.random())) / 2);
                pixel[a] += exponentialNoise;
                pixel[a + 1] += exponentialNoise;
                pixel[a + 2] += exponentialNoise;
                break;
            }
            case "impulseNoise": {
                const impulseNoise = Math.random();
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
                if (Yvar > 80 && cB > 85 && cB < 135 && cR > 135 && cR < 180) {
                    pixel[a] = 255;
                    pixel[a + 1] = 255;
                    pixel[a + 2] = 255;
                } else {
                    pixel[a] = 0;
                    pixel[a + 1] = 0;
                    pixel[a + 2] = 0;
                }
                break;
            }
            case "cancelFilter": {
                filter2D.drawImage(originalImage, 0, 0);
                exitOperation = true;
                break;
            }
            case "revertImage": {
                if (backupImage.constructor === filterResult.constructor) filterResult = backupImage;
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
    if (stepCount >= 0 && filter !== "cancelFilter") filter2D.putImageData(filterResult, 0, 0);
    stepCount++;
}

valueSync(true);
userImage.addEventListener("change", readImage);
fileReader.addEventListener("load", loadImage);