import { useEffect, useState } from "react";
import { initialProducts } from "../data/products";
import ProductItem from "./ProductItem ";
import ProductPickerDialog from "./ProductPickerDialog";
import DiscountSelector from "./DiscountSelector";
import axios from "axios"

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [draggedProduct, setDraggedProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [applyDiscountOnComparePrice, setApplyDiscountOnComparePrice] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [enableTimer, setEnableTimer] = useState(false);
  const [expandedVariants, setExpandedVariants] = useState({});
  const [draggedVariant, setDraggedVariant] = useState({ productId: null, index: null });

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

  const handleAddProduct = () => {
    setEditingProductId(null); 
    setIsDialogOpen(true);
  };

  const handleConfirmSelection = (selectedItems) => {
    if (selectedItems.length === 0) return;

    if (editingProductId) {
      const editingIndex = products.findIndex((p) => p.id === editingProductId);
      if (editingIndex === -1) return;

      const selectedItem = selectedItems[0];
      const editingProduct = products[editingIndex];

      const updatedProduct = {
        ...editingProduct,
        name: selectedItem.name,
        variants: selectedItem.variantId
          ? [{ id: selectedItem.variantId, name: selectedItem.variantName, discount: null }]
          : editingProduct.variants
      };

      const updatedProducts = [
        ...products.slice(0, editingIndex),
        updatedProduct,
        ...products.slice(editingIndex + 1)
      ];

      setProducts(updatedProducts);
    } else {
      const newProducts = selectedItems.map((item) => ({
        id: `p${Date.now()}-${Math.random()}`,
        name: item.name,
        discount: null,
        variants: item.variantId
          ? [{ id: item.variantId, name: item.variantName, discount: null }]
          : [{ id: `v${Date.now()}-${Math.random()}`, name: "Default", discount: null }]
      }));

      const remainingSlots = maxProducts - products.length;
      const productsToAdd = newProducts.slice(0, remainingSlots);
      setProducts([...products, ...productsToAdd]);
    }

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

  const toggleVariants = (productId) => {
    setExpandedVariants((prev) => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const removeVariant = (productId, variantId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const filteredVariants = p.variants.filter((v) => v.id !== variantId);
          if (filteredVariants.length === 0) {
            return {
              ...p,
              variants: [{ id: `v${Date.now()}-${Math.random()}`, name: "Default", discount: null }]
            };
          }
          return {
            ...p,
            variants: filteredVariants
          };
        }
        return p;
      })
    );
  };

  const addVariant = (productId) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
            ...p,
            variants: [
              ...p.variants,
              { id: `v${Date.now()}-${Math.random()}`, name: "New Variant", discount: null }
            ]
          }
          : p
      )
    );
    setExpandedVariants((prev) => ({
      ...prev,
      [productId]: true
    }));
  };

  const handleVariantDragStart = (e, productId, index) => {
    setDraggedVariant({ productId, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleVariantDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleVariantDrop = (e, productId, index) => {
    e.preventDefault();
    if (
      draggedVariant.productId !== productId ||
      draggedVariant.index === null ||
      draggedVariant.index === index
    ) {
      setDraggedVariant({ productId: null, index: null });
      return;
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const reorderedVariants = [...p.variants];
          const draggedItem = reorderedVariants[draggedVariant.index];
          reorderedVariants.splice(draggedVariant.index, 1);
          reorderedVariants.splice(index, 0, draggedItem);
          return { ...p, variants: reorderedVariants };
        }
        return p;
      })
    );
    setDraggedVariant({ productId: null, index: null });
  };

  const handleVariantDragEnd = () => {
    setDraggedVariant({ productId: null, index: null });
  };

  const maxProducts = 4;
  const canAddProduct = products.length < maxProducts;


  const getProductsList = async () => {

    const apiKey=import.meta.env.VITE_API_KEY;
    const baseUrl=import.meta.env.VITE_BASE_URL


    try {

      const response = await axios.get(`${baseUrl}?search=Hat&page=2&limit=1`, {

        headers: {
          "x-api-key": apiKey
        }
      })

      setProducts(response.data?.map((product) => ({ ...product, name: product.title })))


    }
    catch (error) {
      console.log(error)

    }

  }


  useEffect(() => {
    getProductsList()
  }, [])





  return (
    <>
      <div className="bundle-products-wrapper">
        <div className="bundle-header">
          <h1 className="bundle-title">Add Bundle Products (Max. {maxProducts} Products)</h1>
          <div className="bundle-info">
            <span className="info-icon">⚠️</span>
            <span className="info-text">
              Offer Bundle will be shown to the customer whenever any of the bundle products are added to the cart.
            </span>
          </div>
        </div>

        <div className="products-section">
          {products.map((product, index) => (
            <div key={product.id} className="product-item-wrapper">
              <div
                className={`product-row ${draggedProduct === index ? "dragging" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="drag-handle" title="Drag to reorder">
                  <div className="drag-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>

                <span className="product-number">{index + 1}.</span>

                <input
                  type="text"
                  className="product-select-input"
                  placeholder="Select Product"
                  value={product.name === "Select Product" || product.name === "New Product" ? "" : product.name}
                  readOnly
                  onClick={() => handleEditProduct(product.id)}
                />

                <button
                  className="edit-icon-btn"
                  onClick={() => handleEditProduct(product.id)}
                  title="Edit product"
                >
                  ✎
                </button>

                {!product.discount ? (
                  <button
                    className="add-discount-btn"
                    onClick={() => {
                      updateProductDiscount(product.id, { type: "percentage", value: 0 });
                    }}
                    title="Add discount"
                  >
                    Add Discount
                  </button>
                ) : (
                  <div className="discount-display">
                    <DiscountSelector
                      discount={product.discount}
                      onChange={(d) => updateProductDiscount(product.id, d)}
                    />
                  </div>
                )}
              </div>

              {/* Variants Section - Always shown for all products */}
              <div className="variants-section">
                <button
                  className="toggle-variants-link"
                  onClick={() => toggleVariants(product.id)}
                >
                  {expandedVariants[product.id] ? (
                    <>
                      <span className="toggle-icon">▲</span> Hide Variants
                    </>
                  ) : (
                    <>
                      <span className="toggle-icon">▼</span> Show Variants
                    </>
                  )}
                </button>

                {expandedVariants[product.id] && (
                  <div className="variants-list-container">
                    {product.variants.map((variant, variantIndex) => (
                      <div
                        key={variant.id}
                        className={`variant-row ${draggedVariant.productId === product.id &&
                            draggedVariant.index === variantIndex
                            ? "dragging"
                            : ""
                          }`}
                        draggable={product.variants.length > 1}
                        onDragStart={(e) => handleVariantDragStart(e, product.id, variantIndex)}
                        onDragOver={handleVariantDragOver}
                        onDrop={(e) => handleVariantDrop(e, product.id, variantIndex)}
                        onDragEnd={handleVariantDragEnd}
                      >
                        <div className="drag-handle" title={product.variants.length > 1 ? "Drag to reorder" : ""}>
                          <div className="drag-dots">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                          </div>
                        </div>

                        <input
                          type="text"
                          className="variant-input"
                          value={variant.title}
                          readOnly
                          placeholder="Variant name"
                        />

                        <button
                          className="remove-variant-btn"
                          onClick={() => removeVariant(product.id, variant.id)}
                          title="Remove variant"
                          disabled={product.variants.length === 1}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <button
                      className="add-variant-btn"
                      onClick={() => addVariant(product.id)}
                      title="Add variant"
                    >
                      + Add Variant
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {canAddProduct && (
            <button className="add-product-btn-outlined" onClick={handleAddProduct}>
              + Add Product
            </button>
          )}
        </div>

        <div className="discount-options-section">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              id="apply-discount-compare"
              checked={applyDiscountOnComparePrice}
              onChange={(e) => setApplyDiscountOnComparePrice(e.target.checked)}
              className="custom-checkbox"
            />
            <label htmlFor="apply-discount-compare" className="checkbox-label">
              Apply discount on compare price.
            </label>
            <span className="info-tooltip" title="Discount will be applied on compare price of the product">
              ?
            </span>
          </div>
          <p className="discount-explanation">
            Discount will be applied on compare price of the product. Discount set inside the upsell offer should be more than or equal to the discount set on a product in your store.
          </p>
        </div>

        <div className="advanced-options-section">
          <div
            className="advanced-header"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            <h3 className="advanced-title">Advanced offer customizations</h3>
            <span className="collapse-icon">{showAdvancedOptions ? "▲" : "▼"}</span>
          </div>

          {showAdvancedOptions && (
            <div className="advanced-content">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="enable-timer"
                  checked={enableTimer}
                  onChange={(e) => setEnableTimer(e.target.checked)}
                  className="custom-checkbox"
                />
                <label htmlFor="enable-timer" className="checkbox-label">
                  Enable timer for this offer.
                </label>
              </div>

              {enableTimer && (
                <div className="timer-section">
                  <h4 className="timer-title">Offer Timer</h4>
                  {/* Timer configuration can be added here */}
                </div>
              )}
            </div>
          )}
        </div>
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
