import DiscountSelector from "./DiscountSelector";

const VariantItem = ({ variant, onDiscountChange }) => {
  return (
    <div className="variant">
      <span className="variant-name">{variant.name}</span>
      <DiscountSelector
        discount={variant.discount}
        onChange={onDiscountChange}
      />
    </div>
  );
};

export default VariantItem;
