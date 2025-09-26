import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  { 
    productName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    quantity: {
      type: String,
    },
    discount: {
      type: String,
      default: "0",
    },
    variants: [{ color: { type: String }, size: { type: String }, stock: { type: Number, min: 0 } }],
    category: {
      type: String,
    },
    block: {
      type: Boolean,
      default: false,
    },
    images: [{ type: String }], // Array to store image URLs
  },
  { timestamps: true }
);

const productModel = mongoose.model("product", productSchema);
export default productModel;
