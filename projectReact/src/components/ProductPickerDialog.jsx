import { useState, useEffect, useRef } from "react";
import { storeProducts } from "../data/storeProducts";

const ProductPickerDialog = ({ isOpen, onClose, onConfirm, currentProducts = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [loadedCount, setLoadedCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const productsListRef = useRef(null);
  const ITEMS_PER_PAGE = 10;

  // Get product IDs that are already in the current list
  const currentProductIds = new Set(currentProducts.map((p) => p.id));

  // Get store product IDs for each current product to detect duplicates
  const getStoreProductIdForCurrentProduct = (storeProductId) => {
    // Check if this store product is already used in current products
    return currentProducts.some((p) => {
      // For products selected from store, we store store product info in the name
      // We need a better way to track this - let's check if product name matches any store product
      const matchingStoreProduct = storeProducts.find((sp) => sp.id === storeProductId);
      if (!matchingStoreProduct) return false;
      return p.name === matchingStoreProduct.name;
    });
  };

  const filteredProducts = storeProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedProducts = filteredProducts.slice(0, loadedCount);
  const hasMore = loadedCount < filteredProducts.length;

  const loadMore = () => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setLoadedCount((prev) => prev + ITEMS_PER_PAGE);
      setIsLoading(false);
    }, 300);
  };

  const handleScroll = () => {
    if (!productsListRef.current || isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = productsListRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      loadMore();
    }
  };

  useEffect(() => {
    setLoadedCount(10);
  }, [searchTerm]);

  useEffect(() => {
    if (!isOpen) {
      setLoadedCount(10);
      setIsLoading(false);
      setDuplicateWarning("");
    }
  }, [isOpen]);

  const isProductAlreadyAdded = (storeProductId) => {
    return getStoreProductIdForCurrentProduct(storeProductId);
  };

  const handleProductSelect = (product) => {
    // Check if product is already in current list
    if (isProductAlreadyAdded(product.id)) {
      setDuplicateWarning(`"${product.name}" is already in your product list.`);
      setTimeout(() => setDuplicateWarning(""), 3000);
      return;
    }

    const isProductSelected = selectedItems.some((item) => item.id === product.id && !item.variantId);
    
    if (isProductSelected) {
      setSelectedItems(selectedItems.filter((item) => !(item.id === product.id && !item.variantId)));
    } else {
      setSelectedItems([...selectedItems, { id: product.id, name: product.name, variantId: null }]);
    }
    setDuplicateWarning("");
  };

  const handleVariantSelect = (product, variant) => {
    // Check if product is already in current list
    if (isProductAlreadyAdded(product.id)) {
      setDuplicateWarning(`"${product.name}" is already in your product list.`);
      setTimeout(() => setDuplicateWarning(""), 3000);
      return;
    }

    const isVariantSelected = selectedItems.some((item) => item.id === product.id && item.variantId === variant.id);
    
    if (isVariantSelected) {
      setSelectedItems(selectedItems.filter((item) => !(item.id === product.id && item.variantId === variant.id)));
    } else {
      setSelectedItems([
        ...selectedItems,
        { id: product.id, name: `${product.name} - ${variant.name}`, variantId: variant.id, productName: product.name, variantName: variant.name }
      ]);
    }
    setDuplicateWarning("");
  };

  const handleConfirm = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one product or variant");
      return;
    }
    onConfirm(selectedItems);
    setSelectedItems([]);
    setSearchTerm("");
    setLoadedCount(10);
    setDuplicateWarning("");
    onClose();
  };

  const handleClose = () => {
    setSelectedItems([]);
    setSearchTerm("");
    setLoadedCount(10);
    setDuplicateWarning("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div className="dialog-container" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Select Products</h2>
          <button className="dialog-close-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="dialog-search">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-results-count">
            {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {duplicateWarning && (
          <div className="duplicate-warning">
            ⚠️ {duplicateWarning}
          </div>
        )}

        <div className="dialog-content">
          <div
            className="products-list"
            ref={productsListRef}
            onScroll={handleScroll}
          >
            {filteredProducts.length === 0 ? (
              <div className="no-results">No products found</div>
            ) : (
              <>
                {displayedProducts.map((product) => {
                  const isAlreadyAdded = isProductAlreadyAdded(product.id);
                  return (
                    <div 
                      key={product.id} 
                      className={`product-picker-item ${isAlreadyAdded ? "disabled" : ""}`}
                    >
                      <div className="product-picker-header">
                        <input
                          type="checkbox"
                          id={`product-${product.id}`}
                          checked={selectedItems.some((item) => item.id === product.id && !item.variantId)}
                          onChange={() => handleProductSelect(product)}
                          className="product-checkbox"
                          disabled={isAlreadyAdded}
                        />
                        <label 
                          htmlFor={`product-${product.id}`} 
                          className="product-label"
                          title={isAlreadyAdded ? "This product is already in your list" : ""}
                        >
                          {product.name}
                          {isAlreadyAdded && <span className="already-added-badge"> (Already added)</span>}
                        </label>
                      </div>

                      {product.variants.length > 0 && (
                        <div className="variants-list">
                          {product.variants.map((variant) => (
                            <div key={variant.id} className="variant-picker-item">
                              <input
                                type="checkbox"
                                id={`variant-${variant.id}`}
                                checked={selectedItems.some(
                                  (item) => item.id === product.id && item.variantId === variant.id
                                )}
                                onChange={() => handleVariantSelect(product, variant)}
                                className="variant-checkbox"
                                disabled={isAlreadyAdded}
                              />
                              <label 
                                htmlFor={`variant-${variant.id}`} 
                                className="variant-label"
                                title={isAlreadyAdded ? "This product is already in your list" : ""}
                              >
                                {variant.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {hasMore && isLoading && (
                  <div className="loading-indicator">
                    <div className="loader"></div>
                    <span>Loading more products...</span>
                  </div>
                )}
              </>
            )}
          </div>

          {selectedItems.length > 0 && (
            <div className="selected-items">
              <h3>Selected Items ({selectedItems.length})</h3>
              <div className="selected-items-list">
                {selectedItems.map((item, index) => (
                  <div key={index} className="selected-item">
                    <span>{item.name}</span>
                    <button
                      className="remove-selected-btn"
                      onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== index))}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn cancel-btn" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="dialog-btn confirm-btn"
            onClick={handleConfirm}
            disabled={selectedItems.length === 0}
          >
            Confirm ({selectedItems.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPickerDialog;
