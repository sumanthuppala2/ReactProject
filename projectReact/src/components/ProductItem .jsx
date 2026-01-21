import { useState } from "react";
import VariantItem from "./VariantItem";
import DiscountSelector from "./DiscountSelector";

const ProductItem = ({
  product,
  onRemove,
  showRemove,
  onProductDiscountChange,
  onVariantDiscountChange,
  onEdit
}) => {
  const [showVariants, setShowVariants] = useState(false);
  const [draggedVariant, setDraggedVariant] = useState(null);
  const hasMultipleVariants = product.variants.length > 1;

  const handleVariantDragStart = (e, index) => {
    setDraggedVariant(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleVariantDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleVariantDrop = (e, index) => {
    e.preventDefault();
    if (draggedVariant === null || draggedVariant === index) {
      setDraggedVariant(null);
      return;
    }

    const reorderedVariants = [...product.variants];
    const draggedItem = reorderedVariants[draggedVariant];
    reorderedVariants.splice(draggedVariant, 1);
    reorderedVariants.splice(index, 0, draggedItem);
    
    onProductDiscountChange(product.id, {
      ...product,
      variants: reorderedVariants
    });
    setDraggedVariant(null);
  };

  const handleVariantDragEnd = () => {
    setDraggedVariant(null);
  };

  return (
    <div className="product">
      <div className="product-header">
        <span className="product-name">{product.name}</span>

        <DiscountSelector
          discount={product.discount}
          onChange={(d) => onProductDiscountChange(product.id, d)}
        />

        {onEdit && (
          <button className="edit-btn" onClick={() => onEdit(product.id)} title="Edit product">
            ✎
          </button>
        )}

        {showRemove && (
          <button className="remove-btn" onClick={() => onRemove(product.id)}>✕</button>
        )}
      </div>

      {hasMultipleVariants && (
        <button className="toggle-variants-btn" onClick={() => setShowVariants(!showVariants)}>
          {showVariants ? "Hide Variants" : "Show Variants"}
        </button>
      )}

      {showVariants && (
        <div className="variants-container">
          {product.variants.map((variant, index) => (
            <div
              key={variant.id}
              draggable
              onDragStart={(e) => handleVariantDragStart(e, index)}
              onDragOver={handleVariantDragOver}
              onDrop={(e) => handleVariantDrop(e, index)}
              onDragEnd={handleVariantDragEnd}
              className={`variant-container ${draggedVariant === index ? "dragging" : ""}`}
            >
              <VariantItem
                variant={variant}
                onDiscountChange={(d) =>
                  onVariantDiscountChange(product.id, variant.id, d)
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductItem;
