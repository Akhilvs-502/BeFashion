import orderModel from "../../models/orderSchema.js";
import userModel from "../../models/userModel.js"


export const ViewDashboard = async (req, res) => {

  const specificDate = new Date('2024-10-28'); // Change to your desired date
  const orders = await orderModel.find({
    createdAt: {
      $gte: new Date(specificDate.setHours(0, 0, 0, 0)), // Start of the day
      $lt: new Date(specificDate.setHours(23, 59, 59, 999)) // End of the day
    }
  });
  let totalSales = 0
  let orderTotal = 0
  let orderCount=0
  orders.forEach(order => {

    orderTotal = order.products.reduce((acc, product) => {
      return acc + product.totalPay
    }, 0)
    totalSales += orderTotal
    orderCount++
  })
console.log(totalSales);

  let dailyProfit=totalSales*(20/100)
    dailyProfit=dailyProfit.toFixed(2)
  console.log("out total", totalSales,dailyProfit,orderCount,);
  let usersCount=await userModel.find({}).countDocuments()
  console.log(usersCount);
  


  res.render("admin/dashBoard",{totalSales,dailyProfit,orderCount,usersCount})
}



export const getChartData = async (req, res) => {
  let { filter } = req.body
  console.log(filter);

  const orders = (await orderModel.find({}).populate("products.product"))


  let salesData = {}
  let categoryData = {}
  let productData = {}
  orders.forEach(order => {
    let date = order.createdAt
    // let category=order.products.forEach(product=>{})


    let total = order.products.reduce((acc, product) => {
      return acc += product.totalPay
    }, 0)

    let label;
    if (filter === 'day') {
      label = `Day ${date.getDate()}`;
    } else if (filter === 'month') {
      label = date.toLocaleString('default', { month: 'short' });
    } else if (filter === 'year') {
      label = date.getFullYear();
    }

    if (salesData[label]) {
      salesData[label] += total;
    } else {
      salesData[label] = total;
    }
    order.products.forEach(item => {
      const product = item.product;  // Access the populated product document
      const category = product.category;  // Assume category is a field on the product

      // Initialize the category if it doesn’t exist for the label
      if (!categoryData[category]) {
        categoryData[category] = 0;
      }
      // Add the totalPay to the category for this label
      categoryData[category] += item.totalPay;
      if (!productData[product._id]) {
        productData[product._id] = {
          name: product.productName,
          category: product.category, // Assuming product has a name field
          totalSales: 0
        };
      }
      // Accumulate totalPay by product
      productData[product._id].totalSales += (item.totalPay)

    });

  })

  let label = Object.keys(salesData)
  let data = Object.values(salesData)
  let categoryLabel = Object.keys(categoryData)
  let category = Object.values(categoryData)

  //  Step to get the top categories
  const topCategories = Object.entries(categoryData)
    .sort((a, b) => b[1] - a[1])  // Sort by sales in descending order
    .slice(0, 10);  // Get top 10 categories

  // Step to get the top products
  const topProducts = Object.entries(productData)
    .sort((a, b) => b[1].totalSales - a[1].totalSales)  // Sort by sales in descending order
    .slice(0, 10);  // Get top 10 products


  let profit = data.map(num => num * (20 / 100))

  let newData = { label, data, profit, categoryLabel, category, categoryData, topCategories, topProducts }

  res.json({ newData, message: "chart value fectched" })
}