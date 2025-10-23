import db from "../db.server";

interface ProductStats {
  quantity: number;
  revenue: number;
}

interface LocationStats {
  orders: number;
  revenue: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface TopLocation {
  location: string;
  orders: number;
  revenue: number;
}

interface CustomerSegments {
  new: number;
  returning: number;
  vip: number;
}

export async function generateDailyAnalytics(shop: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  console.log(`📊 Generating analytics for ${shop} on ${date.toDateString()}...`);

  // Fetch orders for the day
  const orders = await db.order.findMany({
    where: {
      shop,
      processedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      lineItems: true,
    },
  });

  console.log(`📦 Found ${orders.length} orders for ${date.toDateString()}`);

  // Calculate basic metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const fulfilledOrders = orders.filter(o => o.fulfillmentStatus === "FULFILLED").length;
  const paidOrders = orders.filter(o => o.financialStatus === "PAID").length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Product statistics
  const productStats = new Map<string, ProductStats>();
  orders.forEach(order => {
    order.lineItems.forEach(item => {
      const key = item.productTitle;
      const stats = productStats.get(key) || { quantity: 0, revenue: 0 };
      stats.quantity += item.quantity;
      stats.revenue += item.quantity * item.price;
      productStats.set(key, stats);
    });
  });

  const topProducts: TopProduct[] = Array.from(productStats, ([name, stats]) => ({
    name,
    quantity: stats.quantity,
    revenue: stats.revenue,
  }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Location statistics
  const locationStats = new Map<string, LocationStats>();
  orders.forEach(order => {
    const location = order.shippingCity || order.shippingProvince || order.shippingCountry || "Unknown";
    const stats = locationStats.get(location) || { orders: 0, revenue: 0 };
    stats.orders += 1;
    stats.revenue += order.totalPrice;
    locationStats.set(location, stats);
  });

  const topLocations: TopLocation[] = Array.from(locationStats, ([location, stats]) => ({
    location,
    orders: stats.orders,
    revenue: stats.revenue,
  }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);

  // Customer segmentation (based on order count per customer)
  const customerMap = new Map<string, number>();
  orders.forEach(order => {
    if (order.customerId) {
      customerMap.set(order.customerId, (customerMap.get(order.customerId) || 0) + 1);
    }
  });

  let newCustomers = 0;
  let returningCustomers = 0;
  let vipCustomers = 0;

  customerMap.forEach(orderCount => {
    if (orderCount === 1) {
      newCustomers++;
    } else if (orderCount >= 5) {
      vipCustomers++;
    } else {
      returningCustomers++;
    }
  });

  const customerSegments = {
    new: newCustomers,
    returning: returningCustomers,
    vip: vipCustomers,
  };

  // Save snapshot to database
  await db.analyticsSnapshot.upsert({
    where: {
      shop_date_period: {
        shop,
        date: startOfDay,
        period: "daily",
      },
    },
    create: {
      shop,
      date: startOfDay,
      period: "daily",
      totalOrders,
      totalRevenue,
      avgOrderValue,
      fulfilledOrders,
      paidOrders,
      topProducts: JSON.stringify(topProducts),
      topLocations: JSON.stringify(topLocations),
      customerSegments: JSON.stringify(customerSegments)
    },
    update: {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      fulfilledOrders,
      paidOrders,
      topProducts: JSON.stringify(topProducts),
      topLocations: JSON.stringify(topLocations),
      customerSegments: JSON.stringify(customerSegments),
    },
  });

  console.log(`✅ Analytics snapshot saved for ${date.toDateString()}`);
  console.log(`   Total Orders: ${totalOrders}, Revenue: $${totalRevenue.toFixed(2)}`);

  return {
    totalOrders,
    totalRevenue,
    avgOrderValue,
    fulfilledOrders,
    paidOrders,
    topProducts,
    topLocations,
  };
}

export async function generateMonthlyAnalytics(shop: string, year: number, month: number) {
  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  console.log(`📊 Generating monthly analytics for ${shop} (${year}-${month})...`);

  // Fetch orders for the month
  const orders = await db.order.findMany({
    where: {
      shop,
      processedAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      lineItems: true,
    },
  });

  console.log(`📦 Found ${orders.length} orders for ${year}-${month}`);

  // Calculate metrics (same logic as daily)
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const fulfilledOrders = orders.filter(o => o.fulfillmentStatus === "FULFILLED").length;
  const paidOrders = orders.filter(o => o.financialStatus === "PAID").length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Product stats
  const productStats = new Map<string, ProductStats>();
  orders.forEach(order => {
    order.lineItems.forEach(item => {
      const key = item.productTitle;
      const stats = productStats.get(key) || { quantity: 0, revenue: 0 };
      stats.quantity += item.quantity;
      stats.revenue += item.quantity * item.price;
      productStats.set(key, stats);
    });
  });

  const topProducts: TopProduct[] = Array.from(productStats, ([name, stats]) => ({
    name,
    quantity: stats.quantity,
    revenue: stats.revenue,
  }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Location stats
  const locationStats = new Map<string, LocationStats>();
  orders.forEach(order => {
    const location = order.shippingCity || order.shippingProvince || order.shippingCountry || "Unknown";
    const stats = locationStats.get(location) || { orders: 0, revenue: 0 };
    stats.orders += 1;
    stats.revenue += order.totalPrice;
    locationStats.set(location, stats);
  });

  const topLocations: TopLocation[] = Array.from(locationStats, ([location, stats]) => ({
    location,
    orders: stats.orders,
    revenue: stats.revenue,
  }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);

  // Daily trend within the month
  const dailyTrend: { [day: string]: { orders: number; revenue: number } } = {};
  orders.forEach(order => {
    if (order.processedAt) {
      const day = new Date(order.processedAt).getDate().toString();
      if (!dailyTrend[day]) {
        dailyTrend[day] = { orders: 0, revenue: 0 };
      }
      dailyTrend[day].orders += 1;
      dailyTrend[day].revenue += order.totalPrice;
    }
  });

  // Save snapshot
  await db.analyticsSnapshot.upsert({
    where: {
      shop_date_period: {
        shop,
        date: startOfMonth,
        period: "monthly",
      },
    },
    create: {
      shop,
      date: startOfMonth,
      period: "monthly",
      totalOrders,
      totalRevenue,
      avgOrderValue,
      fulfilledOrders,
      paidOrders,
      topProducts: JSON.stringify(topProducts),
      topLocations: JSON.stringify(topLocations),
      monthlyTrend: JSON.stringify(dailyTrend),
    },
    update: {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      fulfilledOrders,
      paidOrders,
      topProducts: JSON.stringify(topProducts),
      topLocations: JSON.stringify(topLocations),
      monthlyTrend: JSON.stringify(dailyTrend),
    },
  });

  console.log(`✅ Monthly analytics snapshot saved for ${year}-${month}`);

  return {
    totalOrders,
    totalRevenue,
    avgOrderValue,
    fulfilledOrders,
    paidOrders,
  };
}

export async function generateAnalyticsForDateRange(
  shop: string,
  startDate: Date,
  endDate: Date
) {
  console.log(`📊 Generating analytics for date range: ${startDate.toDateString()} to ${endDate.toDateString()}`);

  const results = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    try {
      const result = await generateDailyAnalytics(shop, new Date(currentDate));
      results.push({
        date: new Date(currentDate),
        ...result,
      });
    } catch (error: any) {
      console.error(`❌ Error generating analytics for ${currentDate.toDateString()}:`, error.message);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`✅ Generated analytics for ${results.length} days`);

  return results;
}

export async function getLatestSnapshot(shop: string, period: "daily" | "monthly" = "daily") {
  const snapshot = await db.analyticsSnapshot.findFirst({
    where: { shop, period },
    orderBy: { date: "desc" },
  });

  if (!snapshot) {
    return null;
  }

  return {
    ...snapshot,
    topProducts: snapshot.topProducts ? JSON.parse(snapshot.topProducts) : [],
    topLocations: snapshot.topLocations ? JSON.parse(snapshot.topLocations) : [],
    monthlyTrend: snapshot.monthlyTrend ? JSON.parse(snapshot.monthlyTrend) : {},
    customerSegments: snapshot.customerSegments ? JSON.parse(snapshot.customerSegments) : {},
  };
}

export async function getAllSnapshots(
  shop: string,
  period: "daily" | "monthly" = "daily",
  limit: number = 30
) {
  const snapshots = await db.analyticsSnapshot.findMany({
    where: { shop, period },
    orderBy: { date: "desc" },
    take: limit,
  });

  return snapshots.map(snapshot => ({
    ...snapshot,
    topProducts: snapshot.topProducts ? JSON.parse(snapshot.topProducts) : [],
    topLocations: snapshot.topLocations ? JSON.parse(snapshot.topLocations) : [],
    monthlyTrend: snapshot.monthlyTrend ? JSON.parse(snapshot.monthlyTrend) : {},
    customerSegments: snapshot.customerSegments ? JSON.parse(snapshot.customerSegments) : {},
  }));
}
