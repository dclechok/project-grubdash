const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//*** VALIDATION MIDDLE WARE START ***//
function bodyHasResultProperty(req, res, next) {
  //body have any result at all?
  const result = { data: req.body };
  if (result) {
    return next();
  }
  next({
    status: 400,
    message: "A 'result' property is required.",
  });
}

function isQuantityValid(req, res, next) {
  const { dishes } = req.body.data;
  for (let index = 0; index < dishes.length; index++) {
    if (
      !dishes[index] ||
      !dishes[index].quantity || //quantity prop for dishes does not exist
      dishes[index].quantity <= 0 || //dishes quantity is invalid
      typeof dishes[index].quantity !== "number" //dishes is not an integer
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  return next();
}

function validateOrder(req, res, next) {
  const { deliverTo, mobileNumber, dishes } = req.body.data;
  let invalidOrderMessage = "";
  //cycle through dishes to make sure quantity prop is not missing, 0 or less, or !integer
  // set invalidOrderMessage to correct string
  if (!deliverTo) {
    invalidOrderMessage = " deliverTo";
  } else if (!mobileNumber) {
    invalidOrderMessage = " mobileNumber";
  } else if (!dishes) {
    invalidOrderMessage = " dish";
  } else if (!Array.isArray(dishes) || dishes.length === 0) {
    invalidOrderMessage = "t least one dish";
  }
  //if everything else, move to next validation middleware - validating quantity
  if (!invalidOrderMessage && deliverTo && mobileNumber && dishes)
    return next();
  else
    return next({
      status: 400,
      message: `Order must include a${invalidOrderMessage}`,
    });
}

function validateOrderId(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find(
    (order) => Number(order.id) === Number(orderId)
  );
  if (!foundOrder)
    return next({
      status: 404,
      message: "Order id not found",
    });
  res.locals.foundOrder = foundOrder;
  return next();
}

function validateUpdateId(req, res, next) {
  const { orderId } = req.params;
  const { id } = req.body.data;
  const foundOrder = orders.find(
    (order) => Number(orderId) === Number(order.id)
  );
  if (!foundOrder) {
    return next({
      //no order is found
      status: 404,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  } else if (id && Number(orderId) !== Number(id)) {
    return next({
      //no order is found
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  res.locals.foundOrder = foundOrder;
  return next();
}

function validateUpdateStatus(req, res, next) {
  const { status } = req.body.data;
  if (!status || status === "invalid") {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  if (status === "delivered") {
    console.log("delivered");
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  return next();
}

function validatePending(req, res, next) {
  const { status } = res.locals.foundOrder;
  if (status && status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  } else return next();
}

function validateOrderIdForDelete(req, res, next) {
  const { orderId } = req.params;
  console.log(orderId);
  const foundOrder = orders.find(
    (order) => Number(order.id) === Number(orderId)
  );
  if (!foundOrder)
    return next({
      status: 404,
      message: `Order ${orderId} not found`,
    });
  res.locals.foundOrder = foundOrder;
  return next();
}

//*** VALIDATION MIDDLE WARE END***//

function list(req, res, next) {
  res.status(200).json({ data: orders });
}

function create(req, res, next) {
  const id = nextId();
  //add validated request data, with new id to new order
  const newOrder = {
    ...req.body.data,
    id,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.status(200).json({ data: res.locals.foundOrder });
}

function update(req, res, next) {
  const order = res.locals.foundOrder;
  const {
    data: { deliverTo, mobileNumber, dishes, status },
  } = req.body;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.dishes = dishes;
  order.status = status;
  res.status(200).json({ data: order });
}

function deleteOrder(req, res, next) {
  let orderToDelete = res.locals.foundOrder;

  // orders = orders.filter((order) => order !== orderToDelete);
  orders.splice(orders.indexOf(orderToDelete), 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [bodyHasResultProperty, validateOrder, isQuantityValid, create],
  read: [validateOrderId, read],
  update: [
    bodyHasResultProperty,
    validateOrder,
    isQuantityValid,
    validateUpdateId,
    validateUpdateStatus,
    update,
  ],
  deleteOrder: [validateOrderIdForDelete, validatePending, deleteOrder],
};
// TODO: Implement the /orders handlers needed to make the tests pass
