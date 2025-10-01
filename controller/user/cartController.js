import cartModel from "../../models/cartSchema.js";
import usermodel from "../../models/userModel.js";
import couponModel from "../../models/couponSchema.js";
import productModel from "../../models/productSchema.js";
import e from "express";
import offerModel from "../../models/offerSchema.js";

export const addToCart = async (req, res) => {
  try {
    const jwtUser = req.userData;
    const userData = await usermodel.findOne({ email: jwtUser.email });
    const { productId, selectSize, selectColor } = req.body;
    console.log(productId);
    console.log(selectColor);
    console.log(selectSize);
    const userCart = await cartModel.findOne({ userId: userData._id });

    if (!userCart) {
      console.log("thre is no user cart");

      const model = new cartModel({
        userId: userData._id,
        products: [
          { productId, quantity: 1, size: selectSize, color: selectColor },
        ],
      });
      await model.save();
      console.log("Cart created");

      return res.status(201).json({ message: "new cart created" });
    } else {
      console.log("user cart is exit");
      console.log(userData._id);

      const model = await cartModel.findOne({ userId: userData._id });
      const productIndex = model.products.findIndex(
        (item) => item.productId == productId
      );
      console.log(productIndex);

      if (productIndex == -1) {
        console.log("product creating");
        const product = await cartModel.findOneAndUpdate(
          { userId: userData._id },
          {
            $addToSet: {
              products: {
                productId,
                quantity: 1,
                size: selectSize,
                color: selectColor,
              },
            },
          },
          { new: true }
        );
        return res
          .status(201)
          .json({ message: "new product added to the cart" });
      } else {
        return res.status(409).json({ message: "already added" });
      }
    }
  } catch (err) {
    console.log(err);

    return res
      .status(409)
      .json({ message: "Something went wrong please try again " });
  }
};
export const showCart = async (req, res) => {
  try {
    const user = req.userData;
    const userData = await usermodel.findOne({ email: user.email });
    const cart = await cartModel
      .findOne({ userId: userData._id })
      .populate({ path: "products.productId", model: "product" });
    let totalPrice = 0;
    let shippingFee = 0;
    let discountPrice = 0;
    let couponDiscount = 0;
    let total = 0;
    if (cart) {
      console.log("cart ");
      if (cart.products.length == 0) {
        await cartModel.findOneAndUpdate(
          { userId: userData._id },
          { couponDiscount: 0 }
        );
      }
      const products = cart.products.forEach((product) => {
        totalPrice += product.productId.price * product.quantity;
      });
      let productIds = [];
      cart.products.forEach((product) => {
        discountPrice +=
          product.productId.price *
          product.quantity *
          (product.productId.discount / 100);
        productIds.push(product.productId._id);
      });

      shippingFee = totalPrice == 0 ? 0 : shippingFee;
      couponDiscount = cart.couponDiscount.toFixed(2);
      total = (totalPrice - discountPrice).toFixed(2);
      total = total - couponDiscount;
      shippingFee = total < 500 ? 40 : 0;
      total = total + shippingFee;
      discountPrice.toFixed(2);
      const coupon = await couponModel.find({ block: false });

      ////OFFER
      let offerDiscount = 0;
      for (const productId of productIds) {
        const offerData = await offerModel.find({
          "offerFor.offerGive": productId,
        });
        if (offerData.length > 0) {
          for (const offer of offerData) {
            if (offer.offerType == "price") {
              offerDiscount += offer.discountValue;
            } else {
              let productPrice = await productModel.find({ _id: productId });
              let discountPrice =
                productPrice[0].price * (productPrice[0].discount / 100);
              discountPrice = productPrice[0].price - discountPrice;
              offerDiscount += discountPrice * (offer.discountValue / 100);
            }
          }
        }
      }

      offerDiscount = Math.round(offerDiscount);
      total = total - offerDiscount;

      res.render("user/showCart", {
        user,
        cart,
        totalPrice,
        total,
        discountPrice,
        shippingFee,
        couponDiscount,
        coupon,
        offerDiscount,
      });
    } else {
      console.log("ShowCart");
      const coupon = await couponModel.find({ block: false });
      let offerDiscount = 0;
      res.render("user/showCart", {
        user,
        cart,
        totalPrice,
        total,
        discountPrice,
        shippingFee,
        couponDiscount,
        coupon,
        offerDiscount,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

export const updateQuantity = async (req, res) => {
  try {
    console.log("update quantity");
    console.log(req.body);

    const jwtUser = req.userData;
    const userData = await usermodel.findOne({ email: jwtUser.email });
    const { productId, action, value } = req.body;

    let totalPrice = 0;
    let shippingFee = 0;
    let discountPrice = 0;
    let couponDiscount = 0;
    let total = 0;
    async function newCart() {
      const cart = await cartModel
        .findOne({ userId: userData._id })
        .populate({ path: "products.productId", model: "product" });
      let productIds = [];
      if (cart) {
        const products = cart.products.forEach((product) => {
          totalPrice += product.productId.price * product.quantity;
        });
        cart.products.forEach((product) => {
          discountPrice +=
            product.productId.price *
            product.quantity *
            (product.productId.discount / 100);
          productIds.push(product.productId._id);
        });
     
        // shippingFee = totalPrice == 0 ? 0 : shippingFee;
        couponDiscount = cart.couponDiscount.toFixed(2);
        total = (totalPrice - discountPrice).toFixed(2);
        total = total - couponDiscount;

        shippingFee = total < 500 ? 40 : 0;
        total = total+shippingFee;
        discountPrice.toFixed(2);
        const coupon = await couponModel.find({ block: false });

        ////OFFER
        let offerDiscount = 0;
        for (const productId of productIds) {
          const offerData = await offerModel.find({
            "offerFor.offerGive": productId,
          });
          if (offerData.length > 0) {
            for (const offer of offerData) {
              if (offer.offerType == "price") {
                offerDiscount += offer.discountValue;
              } else {
                let productPrice = await productModel.find({ _id: productId });
                let discountPrice =
                  productPrice[0].price * (productPrice[0].discount / 100);
                discountPrice = productPrice[0].price - discountPrice;
                offerDiscount += discountPrice * (offer.discountValue / 100);
              }
            }
          }
        }

        offerDiscount = Math.round(offerDiscount);
        total = total - offerDiscount;
      }
    }

    if (action === "quantityAdding") {
      console.log(value);
      const productDetails = await productModel.findOne({ _id: productId });
      if (Number(value + 1) >= 5) {
        return res
          .status(409)
          .json({ message: "Only 4 quantites allowed to buy" });
      } else if (productDetails.stock <= value) {
        console.log("err");
        res
          .status(409)
          .json({
            message:
              "The product is currently out of stock! You can't add any more to the quantity",
          });
      } else {
        const cart = await cartModel.findOneAndUpdate(
          {
            userId: userData._id,
            "products.productId": productId,
          },
          { $inc: { "products.$.quantity": 1 } },
          { new: true }
        );
        const productDetails = await productModel.findOne({ _id: productId });
        const productPrice = productDetails.price;
        const productDiscountPrice =
          productPrice - productPrice * (productDetails.discount / 100);

        await newCart();

        console.log(total);

        res.json({
          totalPrice,
          total,
          shippingFee,
          discountPrice,
          productPrice,
          productDiscountPrice,
        });
      }
    } else if (action === "quantityDecreasing") {
      await cartModel.findOneAndUpdate(
        {
          userId: userData._id,
          "products.productId": productId,
        },
        { $inc: { "products.$.quantity": -1 } }
      );
      const productDetails = await productModel.findOne({ _id: productId });
      console.log(productDetails);
      const productPrice = productDetails.price;
      const productDiscountPrice =
        productPrice - productPrice * (productDetails.discount / 100);
      console.log(productPrice, productDiscountPrice);

      await newCart();
      res.json({
        totalPrice,
        total,
        shippingFee,
        discountPrice,
        productPrice,
        productDiscountPrice,
      });
    } else if (action === "selectSize") {
      await cartModel.findOneAndUpdate(
        {
          userId: userData._id,
          "products.productId": productId,
        },
        { $set: { "products.$.size": value } }
      );
      res.json({
        message: "size changed",
      });
    } else if (action === "delete") {
      await cartModel.findOneAndUpdate(
        {
          userId: userData._id,
        },
        { $pull: { products: { productId: productId } } }
      );
      res.json({
        message: "product deleted",
      });
    }
  } catch (err) {
    console.log(err);

    res.status(500).json({ message: "server error" });
  }
};
