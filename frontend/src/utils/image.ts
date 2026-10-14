export interface PreparedImage {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

/**
 * Xoay đúng chiều theo EXIF, thu nhỏ cạnh dài tối đa maxSide và nén JPEG.
 * Vẽ lại qua canvas nên mọi metadata (vị trí GPS, thiết bị...) bị loại bỏ.
 */
export async function prepareImage(source: Blob, maxSide = 1280, quality = 0.9): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Không xử lý được ảnh"))), "image/jpeg", quality),
  );
  return { blob, url: URL.createObjectURL(blob), width, height };
}
