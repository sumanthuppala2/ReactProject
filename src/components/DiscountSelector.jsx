const DiscountSelector = ({ discount, onChange }) => {
  return (
    <div className="discount-selector">
      <select
        value={discount?.type || ""}
        onChange={(e) =>
          onChange({ type: e.target.value, value: discount?.value || 0 })
        }
      >
        <option value="">No Discount</option>
        <option value="flat">Flat</option>
        <option value="percentage">Percentage</option>
      </select>

      {discount?.type && (
        <input
          type="number"
          value={discount.value}
          onChange={(e) =>
            onChange({ ...discount, value: Number(e.target.value) })
          }
          placeholder={discount.type === "percentage" ? "0%" : "$0"}
        />
      )}
    </div>
  );
};

export default DiscountSelector;
