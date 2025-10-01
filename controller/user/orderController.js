import PDFDocument from "pdfkit";
import orderModel from "../../models/orderSchema.js";
import usermodel from "../../models/userModel.js";
import dotenv from "dotenv";
dotenv.config();
import Razorpay from "razorpay";
import walletModel from "../../models/walletModel.js";
import productModel from "../../models/productSchema.js";
import cartModel from "../../models/cartSchema.js";
import couponModel from "../../models/couponSchema.js";
import offerModel from "../../models/offerSchema.js";

import mongoose from "mongoose";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const orderUpdate = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { addressID, orderType } = req.body;
    const jwtUser = req.userData;

    // Fetch user + address
    const addressDoc = await usermodel
      .findOne(
        { email: jwtUser.email, "address._id": addressID },
        { "address.$": 1 }
      )
      .session(session);

    const user = await usermodel
      .findOne({ email: jwtUser.email })
      .session(session);
    const userID = user._id;
    const addressDatas = addressDoc.address[0];

    // Fetch cart
    const cart = await cartModel
      .findOne({ userId: userID })
      .populate({ path: "products.productId", model: productModel })
      .session(session);

    if (!cart || !cart.products.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Cart is empty" });
    }

    let productArray = [];
    let totalOrderPrice = 0;
    let productIds = [];
    let productCoupon = (cart.couponDiscount || 0) / cart.products.length;

    // Loop products
    for (const product of cart.products) {
      let discountedPrice =
        product.productId.price -
        product.productId.price * (product.productId.discount / 100);

      productIds.push(product.productId._id);

      // OFFER handling
      let offerDiscount = 0;
      const offerData = await offerModel
        .find({ "offerFor.offerGive": product.productId._id })
        .session(session);

      for (const offer of offerData) {
        if (offer.offerType === "price") {
          offerDiscount += offer.discountValue;
        } else {
          let productPrice =
            product.productId.price -
            product.productId.price * (product.productId.discount / 100);
          offerDiscount += productPrice * (offer.discountValue / 100);
        }
      }

      offerDiscount = Math.round(offerDiscount);

      const data = {
        product: product.productId._id,
        quantity: product.quantity,
        price: product.productId.price,
        discountedPrice,
        paymentMode: orderType,
        orderStatus: "pending", // initially pending
        color: product.productId.color,
        size: product.size,
        offerAdded: offerDiscount,
        couponAdded: productCoupon,
        totalPay:
          discountedPrice * product.quantity - productCoupon - offerDiscount,
      };

      productArray.push(data);

      // Update stock
      const newStock = product.productId.stock - product.quantity;
      await productModel
        .findOneAndUpdate({ _id: product.productId._id }, { stock: newStock })
        .session(session);

      // Coupon usage update
      if (cart.couponCode) {
        const couponStatus = await couponModel
          .findOne({
            couponCode: cart.couponCode,
            "usedBy.userId": userID,
          })
          .session(session);

        if (!couponStatus) {
          await couponModel
            .findOneAndUpdate(
              { couponCode: cart.couponCode },
              { $push: { usedBy: { userId: userID, usedCount: 1 } } },
              { new: true }
            )
            .session(session);
        } else {
          await couponModel
            .findOneAndUpdate(
              { couponCode: cart.couponCode, "usedBy.userId": userID },
              { $inc: { "usedBy.$.usedCount": 1 } }
            )
            .session(session);
        }
      }
    }

    // Shipping fee
    totalOrderPrice = productArray.reduce((sum, p) => sum + p.totalPay, 0);
    let shippingFee = totalOrderPrice < 500 ? 40 : 0;
    totalOrderPrice += shippingFee;

    // Create Order
    const order = new orderModel({
      user: userID,
      shippingAddress: addressDatas,
      products: productArray,
      shippingFee,
    });

    const orderId = order._id;

    // ----- Handle payment types -----

    if (orderType === "cod") {
      if (totalOrderPrice < 1000) {
        await order.save({ session });
        await cartModel.deleteOne({ userId: userID }).session(session);

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
          orderId,
          message: "Order created (COD)",
          orderType,
          user,
          totalOrderPrice,
        });
      } else {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          status: "codNotAllowed",
          message: "Order above 1000 not allowed for COD",
        });
      }
    }

    if (orderType === "wallet") {
      const wallet = await walletModel
        .findOne({ userId: userID })
        .session(session);

      if (wallet && wallet.balance >= totalOrderPrice) {
        await walletModel
          .findOneAndUpdate(
            { userId: userID },
            {
              $inc: { balance: -totalOrderPrice },
              $push: {
                transactions: {
                  wallectAmount: totalOrderPrice,
                  orderId,
                  trasactionType: "debited",
                  trasactionsDate: new Date(),
                },
              },
            },
            { new: true }
          )
          .session(session);

        await order.save({ session });
        await cartModel.deleteOne({ userId: userID }).session(session);

        await orderModel
          .findOneAndUpdate(
            { _id: orderId },
            { $set: { "products.$[].paymentStatus": "paid" } }
          )
          .session(session);

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
          orderId,
          message: "Order created (Wallet)",
          orderType,
          user,
        });
      } else {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: "Insufficient wallet balance",
          status: "noBalance",
        });
      }
    }

    if (orderType === "razorpay") {
      await order.save({ session });
      await cartModel.deleteOne({ userId: userID }).session(session);

      await session.commitTransaction();
      session.endSession();

      const orderOptions = {
        amount: totalOrderPrice * 100, // paise
        currency: "INR",
        receipt: `order_rcptid_${orderId}`,
        payment_capture: "1",
      };

      razorpayInstance.orders.create(orderOptions, (err, razorpayOrder) => {
        if (err) {
          console.error("Error in creating Razorpay order:", err);
          return res.status(500).send("Something went wrong with Razorpay");
        }
        res.json({
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          orderType,
          orderId,
          totalOrderPrice,
          user,
          RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
        });
      });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};






export const orderSuccess = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const user = req.userData;
    const orderDetails = await orderModel.find({ _id: orderId });
    const products = orderDetails[0].products;

    const order = orderDetails[0];
    console.log(order);

    res.render("user/orderSuccess", { user, orderId, products, order });
  } catch {}
};







export const showOrders = async (req, res) => {
  try {
    // Get page and limit from query parameters, set default values if not provided
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const limit = parseInt(req.query.limit) || 10; // Number of items per page, default is 10

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;
    const user = req.userData;
    const userData = await usermodel.find({ email: user.email });
    const userId = userData[0]._id;
    const orderData2 = await orderModel.find({ user: userId });
    let totalPages = 0;
    orderData2.forEach((userOrders) => {
      totalPages += userOrders.products.length;
    });
    console.log(totalPages);

    const orderData = await orderModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({ path: "products.product", model: productModel })
      .skip(skip)
      .limit(limit);
    console.log(orderData[0]);
    res.render("user/showOrders", {
      user,
      orderData,
      totalPages: totalPages / limit,
      currentPage: page,
      limit: limit,
    });
  } catch (err) {
    console.log(err);
  }
};







export const orderCancel = async (req, res) => {
  try {
    const user = req.userData;
    const userData = await usermodel.find({ email: user.email });
    const userId = userData[0]._id;
    console.log(userId);
    const { product_id } = req.body;
    console.log(product_id);
    const order = await orderModel.findOne(
      { user: userId, "products._id": product_id },
      { "products.$": 1 }
    );

    const ship = await orderModel.findOne({
      user: userId,
      "products._id": product_id,
    });
    console.log(order.products[0].paymentStatus);
    console.log(order.products[0].paymentStatus);

//shipping fee not included in refund
    const RefundRupee = order.products[0].totalPay 
    console.log("refund rupee", RefundRupee);

    //if paid refund
    if (order.products[0].paymentStatus == "paid") {
      await walletModel.findOneAndUpdate(
        { userId: userId },
        {
          $inc: { balance: RefundRupee },
          $push: {
            transactions: {
              wallectAmount: RefundRupee,
              orderId: order._id,
              trasactionType: "creditd",
              trasactionsDate: new Date(),
            },
          },
        }
      );
      await orderModel.findOneAndUpdate(
        { "products._id": product_id },
        { "products.$.paymentStatus": "refunded" }
      );
    }
    const update = await orderModel.findOneAndUpdate(
      { user: userId, "products._id": product_id },
      { "products.$.orderStatus": "cancelled" }
    );
    res.json({ message: "updated" });
  } catch (err) {
    console.log(err);

    res.status(409).json({ message: "err" });
  }
};

export const returnOrder = async (req, res) => {
  try {
    console.log("return");

    const user = req.userData;
    const userData = await usermodel.find({ email: user.email });
    const userId = userData[0]._id;

    const { text, product_id } = req.body;
    const update = await orderModel.findOneAndUpdate(
      { user: userId, "products._id": product_id },
      {
        "products.$.returnStatus": "requested",
        "products.$.returnReason": text,
      },
      { new: true }
    );
    console.log(update);
    res.json({ message: "order retured" });
  } catch (error) {
    console.log("catch");
  }
};

export const downloadInvoice = async (req, res) => {
  const { orderId } = req.query;
  const order = await orderModel
    .find({ _id: orderId })
    .populate("products.product");
  let user = order[0].user;
  user = await usermodel.find({ _id: user });
  let userName = user[0].name;
  let shippingAddress = order[0].shippingAddress;
  console.log(order[0].products);
  let orderItems = [];
  const shippingFee = order[0].shippingFee;
  order[0].products.forEach((product) => {
    console.log(product.orderStatus == "delivered");
    if (product.orderStatus == "delivered") {
      orderItems.push({
        name: product.product.productName,
        description: product.product.description.substring(0, 15),
        price: product.discountedPrice,
        couponDiscount: product.couponAdded,
        quantity: product.quantity,
      });
    }
  });

  const doc = new PDFDocument();

  // Set the response headers to trigger a download
  res.setHeader("Content-disposition", "attachment; filename=invoice.pdf");
  res.setHeader("Content-type", "application/pdf");

  // Pipe the PDF into the response
  doc.pipe(res);

  // Header
  doc.fontSize(20).text("BeFashion ptd", 20, 20);
  doc.fontSize(10).text("beFashion  560002 india", 20, 50);
  doc.text("Bangalore, KARNATAKA, 560002", 20, 65);
  doc.text("Phone: (123) 456-7890", 20, 80);
  doc.text("Email: info@beFashion.com", 20, 95);

  doc.fontSize(14).text("Invoice", 360, 20); // Moved slightly to the left
  doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 360, 40);
  doc.text(`Invoice #: 001`, 360, 60);

  // Customer Information
  doc.fontSize(12).text("Bill To:", 20, 120);
  doc.fontSize(10).text(`Customer Name:${userName}`, 20, 140);
  doc.text(
    `Shipping Address: ${shippingAddress.address},${shippingAddress.city},${shippingAddress.locality},${shippingAddress.state},${shippingAddress.pincode}`,
    20,
    155
  );

  // Table Header
  const startY = 200;
  const rowHeight = 25;

  doc
    .fontSize(12)
    .text("Item", 20, startY)
    .text("Description", 180, startY)
    .text("Unit Cost", 350, startY)
    .text("Quantity", 420, startY)
    .text("Line Total", 480, startY);

  // Add order items to the PDF

  orderItems.forEach((item, index) => {
    const y = startY + (index + 1) * rowHeight;
    doc.text(item.name, 20, y);
    doc.text(item.description, 180, y);
    doc.text(`Rs ${item.price.toFixed(2)}`, 350, y);
    doc.text(item.quantity.toString(), 420, y);
    doc.text(`Rs ${(item.price * item.quantity).toFixed(2)}`, 480, y);
  });

  // Totals
  const subtotal = orderItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const couponDiscount = orderItems.reduce(
    (acc, item) => acc + item.couponDiscount,
    0
  );
  const total = subtotal - couponDiscount + shippingFee;
  doc.text(
    "Subtotal:Rs " + subtotal.toFixed(2),
    350,
    startY + (orderItems.length + 1) * rowHeight
  );
  doc.text(
    "Coupon Discount:Rs " + couponDiscount.toFixed(2),
    350,
    startY + (orderItems.length + 2) * rowHeight
  );
  doc.text(
    "Shipping charge:Rs " + shippingFee.toFixed(2),
    350,
    startY + (orderItems.length + 3) * rowHeight
  );
  doc.text(
    "Total:Rs " + total.toFixed(2),
    350,
    startY + (orderItems.length + 4) * rowHeight
  );

  // Footer
  doc
    .fontSize(8)
    .text(
      "Thank you for your business!",
      20,
      startY + (orderItems.length + 5) * rowHeight
    );
  doc.text(
    "This is a computer-generated invoice and does not require a signature.",
    20,
    startY + (orderItems.length + 6) * rowHeight
  );

  // Finalize the PDF and end the stream
  doc.end();
};
