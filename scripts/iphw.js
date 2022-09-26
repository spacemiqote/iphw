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
function imageInverse() {
    let inverseResult = document.getElementById("invertResult");
    inverseResult.width = originalImage.width;
    inverseResult.height = originalImage.height;
    const inverse2D = inverseResult.getContext("2d", {willReadFrequently:!0});
    inverse2D.drawImage(originalImage, 0, 0);
    inverseResult = inverse2D.getImageData(0, 0, inverseResult.width, inverseResult.height);
    for (let a = 0; a < inverseResult.data.length; a += 4) {
        inverseResult.data[a] = 255 - inverseResult.data[a];
        inverseResult.data[a + 1] = 255 - inverseResult.data[a + 1];
        inverseResult.data[a + 2] = 255 - inverseResult.data[a + 2];
    }
    inverse2D.putImageData(inverseResult, 0, 0);
}
document.getElementById("change").addEventListener("click", imageInverse);