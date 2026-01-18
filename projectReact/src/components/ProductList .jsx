import { useState } from "react";
import { initialProducts } from "../data/products";
import ProductItem from "./ProductItem ";
import ProductPickerDialog from "./ProductPickerDialog";

const ProductList = () => {
  const [products, setProducts] = useState(initialProducts);
  const [draggedProduct, setDraggedProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const removeProduct = (id) => {
    if (products.length === 1) return;
    setProducts(products.filter((p) => p.id !== id));
  };

  const updateProductDiscount = (productId, discount) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, discount } : p
      )
    );
  };

  const updateVariantDiscount = (productId, variantId, discount) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              variants: p.variants.map((v) =>
                v.id === variantId ? { ...v, discount } : v
              )
            }
          : p
      )
    );
  };

  const handleEditProduct = (productId) => {
    setEditingProductId(productId);
    setIsDialogOpen(true);
  };

  const handleConfirmSelection = (selectedItems) => {
    const editingIndex = products.findIndex((p) => p.id === editingProductId);
    if (editingIndex === -1) return;

    // Convert selected items to new products
    const newProducts = selectedItems.map((item, index) => ({
      id: `p${Date.now()}-${index}`,
      name: item.name,
      discount: null,
      variants: item.variantId
        ? [{ id: item.variantId, name: item.variantName, discount: null }]
        : [{ id: `v${Date.now()}-${index}`, name: "Default", discount: null }]
    }));

    // Replace the edited product with new products
    const updatedProducts = [
      ...products.slice(0, editingIndex),
      ...newProducts,
      ...products.slice(editingIndex + 1)
    ];

    setProducts(updatedProducts);
    setEditingProductId(null);
  };

  const handleDragStart = (e, index) => {
    setDraggedProduct(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedProduct === null || draggedProduct === index) {
      setDraggedProduct(null);
      return;
    }

    const newProducts = [...products];
    const draggedItem = newProducts[draggedProduct];
    newProducts.splice(draggedProduct, 1);
    newProducts.splice(index, 0, draggedItem);
    setProducts(newProducts);
    setDraggedProduct(null);
  };

  const handleDragEnd = () => {
    setDraggedProduct(null);
  };

  const addEmptyProduct = () => {
    const newProduct = {
      id: `p${Date.now()}`,
      name: "New Product",
      discount: null,
      variants: [{ id: `v${Date.now()}`, name: "Default", discount: null }]
    };
    setProducts([...products, newProduct]);
  };

  return (
    <>
      <div className="product-list-wrapper">
        <div className="product-list">
          {products.map((product, index) => (
            <div
              key={product.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`product-container ${draggedProduct === index ? "dragging" : ""}`}
            >
              <ProductItem
                product={product}
                showRemove={products.length > 1}
                onRemove={removeProduct}
                onProductDiscountChange={updateProductDiscount}
                onVariantDiscountChange={updateVariantDiscount}
                onEdit={handleEditProduct}
              />
            </div>
          ))}
        </div>

        <button className="add-product-btn" onClick={addEmptyProduct} title="Add new product">
          + Add Product
        </button>
      </div>

      <ProductPickerDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmSelection}
        currentProducts={products}
      />
    </>
  );
};

export default ProductList;
