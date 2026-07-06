/**
 * Compresses an image Base64 string to a highly optimized, safe, and space-saving JPEG format.
 * Caps maximum dimensions to 1000px and sets quality to 0.75.
 */
export function compressImage(base64Str: string, maxDimension = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    // If it's not a standard image data URL, resolve immediately
    if (!base64Str || !base64Str.startsWith("data:image/")) {
      return resolve(base64Str);
    }

    const img = window.Image ? new window.Image() : document.createElement("img");
    img.crossOrigin = "anonymous";
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions to keep aspect ratio
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(base64Str); // Fallback to raw if canvas context is not available
      }

      // Fill with white background for JPEG conversion
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Export as a lightweight compressed JPEG
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedBase64);
    };
    img.onerror = (err) => {
      console.warn("Failed to compress image, falling back to original", err);
      resolve(base64Str);
    };
  });
}
