const userImage = document.getElementById("userImage");
const originalImage = document.getElementById("originalImage");
const fileReader = new FileReader(),original2D = originalImage.getContext("2d");
function readImage() {
    fileReader.readAsDataURL(userImage.files[0]);
}
function loadImage() {
    const image = new Image();
    image.src = fileReader.result.toString();
    image.onload = function() {
        originalImage.width = image.width;
        originalImage.height = image.height;
        original2D.drawImage(image, 0, 0, image.width, image.height);
    };
}
userImage.addEventListener("change", readImage);
fileReader.addEventListener("load", loadImage);
function imageInverse(filter) {
    let filterResult = document.getElementById("filterResult");
    filterResult.width = originalImage.width;
    filterResult.height = originalImage.height;
    const inverse2D = filterResult.getContext("2d", {willReadFrequently:!0});
    inverse2D.drawImage(originalImage, 0, 0);
    filterResult = inverse2D.getImageData(0, 0, filterResult.width, filterResult.height);
    for (let a = 0; a < filterResult.data.length; a += 4) {
        switch (filter) {
            case "inverse": {
                filterResult.data[a] = 255 - filterResult.data[a];
                filterResult.data[a + 1] = 255 - filterResult.data[a + 1];
                filterResult.data[a + 2] = 255 - filterResult.data[a + 2];
                break;
            }
            case "grayscale": {
                const luminance = 0.2126 * filterResult.data[a] + 0.7152 * filterResult.data[a + 1] + 0.0722 * filterResult.data[a + 2];
                filterResult.data[a] = luminance;
                filterResult.data[a + 1] = luminance;
                filterResult.data[a + 2] = luminance;
                break;
            }
            case "sepia": {
                const red = filterResult.data[a];
                const green = filterResult.data[a + 1];
                const blue = filterResult.data[a + 2];
                filterResult.data[a] = red * 0.393 + green * 0.769 + blue * 0.189;
                filterResult.data[a + 1] = red * 0.349 + green * 0.686 + blue * 0.168;
                filterResult.data[a + 2] = red * 0.272 + green * 0.534 + blue * 0.131;
                break;
            }
            default: {
                throw new Error(`Unknown filter: ${filter}`);
            }
        }
    }
    
    inverse2D.putImageData(filterResult, 0, 0);
}