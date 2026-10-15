import { GIFEncoder, applyPalette, quantize } from "gifenc";

// Output size of each GIF frame (matches the 4:3 strip photos)
const PHOTO_W = 480;
const PHOTO_H = 360;
const PAD = 20;
const FOOTER_H = 56;

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Draw an image so it fills the box (like CSS object-fit: cover)
function drawCover(ctx, img, x, y, w, h) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const boxRatio = w / h;

    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    let sx = 0;
    let sy = 0;

    if (imgRatio > boxRatio) {
        sw = img.naturalHeight * boxRatio;
        sx = (img.naturalWidth - sw) / 2;
    } else {
        sh = img.naturalWidth / boxRatio;
        sy = (img.naturalHeight - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Create an animated GIF from the photo-strip shots.
 *
 * @param {string[]} photos      data URLs of the shots
 * @param {object}   options
 * @param {number}   options.delay       ms each frame is shown
 * @param {boolean}  options.boomerang   play forwards then backwards
 * @param {string}   options.background  frame colour (matches the strip)
 * @param {string}   options.footerText  caption under the photo
 * @param {boolean}  options.dark        use light text on a dark frame
 * @param {(p:number)=>void} options.onProgress  0..1
 * @returns {Promise<Blob>}
 */
export async function createGif(
    photos,
    {
        delay = 700,
        boomerang = false,
        background = "#ffffff",
        footerText = "",
        dark = false,
        onProgress,
    } = {}
) {
    const images = await Promise.all(photos.map(loadImage));

    const width = PHOTO_W + PAD * 2;
    const height = PHOTO_H + PAD * 2 + (footerText ? FOOTER_H : 0);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // 1,2,3,4  or  1,2,3,4,3,2 for a boomerang loop
    const order = images.map((_, i) => i);

    if (boomerang && images.length > 2) {
        for (let i = images.length - 2; i > 0; i--) order.push(i);
    }

    const gif = GIFEncoder();

    for (let i = 0; i < order.length; i++) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);

        drawCover(ctx, images[order[i]], PAD, PAD, PHOTO_W, PHOTO_H);

        if (footerText) {
            ctx.fillStyle = dark ? "#ffffff" : "#444444";
            ctx.font = "600 22px Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(footerText, width / 2, PAD + PHOTO_H + FOOTER_H / 2 + 2);
        }

        const { data } = ctx.getImageData(0, 0, width, height);
        const palette = quantize(data, 256);
        const indexed = applyPalette(data, palette);

        gif.writeFrame(indexed, width, height, { palette, delay });

        onProgress?.((i + 1) / order.length);

        // Let the browser repaint (progress bar) between frames
        await nextTick();
    }

    gif.finish();

    return new Blob([gif.bytes()], { type: "image/gif" });
}
