import { useState, useEffect, useRef } from "react";
import { storeProducts } from "../data/storeProducts";

const ProductPickerDialog = ({ isOpen, onClose, onConfirm, currentProducts = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [loadedCount, setLoadedCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [expandedProducts, setExpandedProducts] = useState({});
  const productsListRef = useRef(null);
  const ITEMS_PER_PAGE = 10;

  const currentProductIds = new Set(currentProducts.map((p) => p.id));

  const getStoreProductIdForCurrentProduct = (storeProductId) => {
    return currentProducts.some((p) => {
      const matchingStoreProduct = storeProducts.find((sp) => sp.id === storeProductId);
      if (!matchingStoreProduct) return false;
      const storeProductName = matchingStoreProduct.title || matchingStoreProduct.name;
      return p.name === storeProductName;
    });
  };

  const getProductName = (product) => {
    return product.title || product.name || "Untitled Product";
  };

  const filteredProducts = storeProducts.filter((product) => {
    const productName = getProductName(product);
    return productName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const displayedProducts = filteredProducts.slice(0, loadedCount);
  const hasMore = loadedCount < filteredProducts.length;

  const loadMore = () => {
    setIsLoading(true);
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
      setExpandedProducts({});
    }
  }, [isOpen]);

  const toggleProductVariants = (productId) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const isProductAlreadyAdded = (storeProductId) => {
    return getStoreProductIdForCurrentProduct(storeProductId);
  };

  const handleProductSelect = (product) => {
    const productName = getProductName(product);
    if (isProductAlreadyAdded(product.id)) {
      setDuplicateWarning(`"${productName}" is already in your product list.`);
      setTimeout(() => setDuplicateWarning(""), 3000);
      return;
    }

    const isProductSelected = selectedItems.some((item) => item.id === product.id && !item.variantId);
    
    if (isProductSelected) {
      setSelectedItems(selectedItems.filter((item) => !(item.id === product.id && !item.variantId)));
    } else {
      const filteredItems = selectedItems.filter((item) => !(item.id === product.id && item.variantId));
      setSelectedItems([...filteredItems, { id: product.id, name: productName, variantId: null }]);
    }
    setDuplicateWarning("");
  };

  const handleVariantSelect = (product, variant) => {
    const productName = getProductName(product);
    const variantName = getVariantName(variant);
    if (isProductAlreadyAdded(product.id)) {
      setDuplicateWarning(`"${productName}" is already in your product list.`);
      setTimeout(() => setDuplicateWarning(""), 3000);
      return;
    }

    const isVariantSelected = selectedItems.some((item) => item.id === product.id && item.variantId === variant.id);
    
    if (isVariantSelected) {
      setSelectedItems(selectedItems.filter((item) => !(item.id === product.id && item.variantId === variant.id)));
    } else {
      const filteredItems = selectedItems.filter(
        (item) => !(item.id === product.id)
      );
      setSelectedItems([
        ...filteredItems,
        { id: product.id, name: `${productName} - ${variantName}`, variantId: variant.id, productName: productName, variantName: variantName }
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

 

  const getProductImageSrc = (product) => {
    if (typeof product.image === "string") {
      return product.image;
    }
    if (product.image && product.image.src) {
      return product.image.src;
    }
    return null;
  };

  const getProductPrice = (product) => {
    if (product.price) {
      return typeof product.price === "string" ? parseFloat(product.price) : product.price;
    }
    if (product.variants && product.variants.length > 0 && product.variants[0].price) {
      return typeof product.variants[0].price === "string" 
        ? parseFloat(product.variants[0].price) 
        : product.variants[0].price;
    }
    return null;
  };

  const getProductAvailability = (product) => {
    if (product.availability !== undefined && product.availability !== null) {
      return product.availability;
    }
    if (product.variants && product.variants.length > 0) {
      const totalInventory = product.variants.reduce((sum, variant) => {
        const qty = variant.inventory_quantity !== undefined ? variant.inventory_quantity : 0;
        return sum + (qty > 0 ? qty : 0);
      }, 0);
      return totalInventory > 0 ? totalInventory : null;
    }
    return null;
  };

  const getVariantName = (variant) => {
    return variant.title || variant.name || "Default";
  };

  const formatPrice = (price) => {
    if (!price) return null;
    const priceValue = typeof price === "string" ? parseFloat(price) : price;
    return `₹${priceValue.toFixed(2)}`;
  };

  const formatAvailability = (availability) => {
    if (availability === null || availability === undefined) return null;
    const qty = availability > 0 ? availability : 0;
    return `${qty.toLocaleString()} available`;
  };

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div className="add-products-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="add-products-header">
          <h2 className="add-products-title">Add products</h2>
          <button className="dialog-close-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="add-products-search">
          <div className="search-icon-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 14L11.1 11.1" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="add-products-search-input"
          />
        </div>

        {duplicateWarning && (
          <div className="duplicate-warning">
            ⚠️ {duplicateWarning}
          </div>
        )}

        <div
          className="add-products-list"
          ref={productsListRef}
          onScroll={handleScroll}
        >
          {filteredProducts.length === 0 ? (
            <div className="no-results">No products found</div>
          ) : (
            <>
              {displayedProducts.map((product) => {
                const isAlreadyAdded = isProductAlreadyAdded(product.id);
                const isSelected = selectedItems.some((item) => item.id === product.id && !item.variantId);
                const isExpanded = expandedProducts[product.id];
                const hasVariants = product.variants && product.variants.length > 0;
                
                return (
                  <div key={product.id} className="add-product-item-wrapper">
                    <div 
                      className={`add-product-item ${isAlreadyAdded ? "disabled" : ""} ${isSelected ? "selected" : ""}`}
                      onClick={() => !isAlreadyAdded && handleProductSelect(product)}
                    >
                      <input
                        type="checkbox"
                        id={`product-${product.id}`}
                        checked={isSelected}
                        onChange={() => handleProductSelect(product)}
                        className="product-checkbox"
                        disabled={isAlreadyAdded}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <div className="product-image-placeholder">
                        {getProductImageSrc(product) ? (
                          <img src={getProductImageSrc(product)} alt={getProductName(product)} className="product-thumbnail" />
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      
                      <div className="product-info">
                        <span className="product-name-text">{getProductName(product)}</span>
                        {getProductAvailability(product) !== null && (
                          <span className="product-availability">{formatAvailability(getProductAvailability(product))}</span>
                        )}
                      </div>
                      
                      {getProductPrice(product) && (
                        <div className="product-price">{formatPrice(getProductPrice(product))}</div>
                      )}

                      {hasVariants && (
                        <button
                          className="expand-variants-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProductVariants(product.id);
                          }}
                          title={isExpanded ? "Hide variants" : "Show variants"}
                        >
                          {isExpanded ? "▼" : "▶"}
                        </button>
                      )}
                    </div>

                    {/* Variants List */}
                    {hasVariants && isExpanded && (
                      <div className="product-variants-list">
                        {product.variants.map((variant) => {
                          const isVariantSelected = selectedItems.some(
                            (item) => item.id === product.id && item.variantId === variant.id
                          );
                          
                          return (
                            <div
                              key={variant.id}
                              className={`add-variant-item ${isVariantSelected ? "selected" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isAlreadyAdded) {
                                  handleVariantSelect(product, variant);
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                id={`variant-${product.id}-${variant.id}`}
                                checked={isVariantSelected}
                                onChange={() => handleVariantSelect(product, variant)}
                                className="variant-checkbox"
                                disabled={isAlreadyAdded}
                                onClick={(e) => e.stopPropagation()}
                              />
                              
                              <div className="variant-info">
                                <span className="variant-name-text">{getVariantName(variant)}</span>
                                {variant.price && (
                                  <span className="variant-price">{formatPrice(variant.price)}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
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

        <div className="add-products-footer">
          <span className="selected-count">
            {selectedItems.length} product{selectedItems.length !== 1 ? "s" : ""} selected
          </span>
          <div className="footer-buttons">
            <button className="dialog-btn cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button
              className="dialog-btn confirm-btn"
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPickerDialog;
