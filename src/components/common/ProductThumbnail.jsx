import { useState } from "react";

function ProductThumbnail({ alt, children, className = "", imageUrl }) {
  const [failedUrl, setFailedUrl] = useState("");
  const normalizedImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";

  return (
    <span className={`product-thumbnail ${className}`.trim()}>
      {normalizedImageUrl && failedUrl !== normalizedImageUrl
        ? <img src={normalizedImageUrl} alt={alt} onError={() => setFailedUrl(normalizedImageUrl)} />
        : children}
    </span>
  );
}

export default ProductThumbnail;
