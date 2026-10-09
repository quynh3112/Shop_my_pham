import { useState } from "react";
import { Tag } from "antd";

interface Props {
  images: string[];
  productName: string;
  inStock: boolean;
}

export default function ProductGallery({ images, productName, inStock }: Props) {
  const [selectedImage, setSelectedImage] = useState(images[0] ?? "");
  const displayedImage = images.includes(selectedImage) ? selectedImage : (images[0] ?? "");

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#fbf1ef]">
        <Tag
          color={inStock ? "success" : "default"}
          className="absolute left-5 top-5 z-10 !rounded-full !px-3 !py-1"
        >
          {inStock ? "Còn hàng" : "Hết hàng"}
        </Tag>
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={displayedImage}
          alt={productName}
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={`Xem ảnh ${index + 1} của ${productName}`}
              aria-pressed={image === displayedImage}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-[#fbf1ef] transition sm:h-24 sm:w-24 ${
                image === displayedImage
                  ? "border-[#d66c6d]"
                  : "border-transparent hover:border-[#e8caca]"
              }`}
              onClick={() => setSelectedImage(image)}
            >
              <img className="h-full w-full object-cover" src={image} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
