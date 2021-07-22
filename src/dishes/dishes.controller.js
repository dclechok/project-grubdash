const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function bodyHasResultProperty(req, res, next) {
  const result = { data: req.body };
  if (result) {
    return next();
  }
  next({
    status: 400,
    message: "A 'result' property is required.",
  });
}

function validateDish(req, res, next) {
  const { name, description, price, image_url } = req.body.data;
  let missingValidation = ""; // changes keyword for whatever key value we're missing in body data
  if (
    name &&
    description &&
    price &&
    price > 0 &&
    typeof price == "number" &&
    image_url
  ) {
    return next(); //if all is well
  }
  if (price < 0 || typeof price != "number") {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  if (!name) {
    missingValidation = "name";
  } //validate all keys are present
  else if (!description) {
    missingValidation = "description";
  }
  else if (!image_url) {
    missingValidation = "image_url";
  }
  else if (!price) {
    missingValidation = "price";
  }
  next({
    status: 400,
    message: `Dish must include a ${missingValidation}`,
  });
}

function validateId(req, res, next) {
  const { dishId } = req.params;
  let readDish = dishes.find((dish) => Number(dishId) == Number(dish.id));
  if (readDish) {
    res.locals.dish = readDish;
    return next();
  }
  return next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function validateDataId(req, res, next) {
  const { dishId } = req.params;
  const id = req.body.data.id;
  if (id != dishId && id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function create(req, res) {
  const result = req.body.data;
  const newId = nextId();
  const newDish = {
    id: newId,
    ...result,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function list(req, res) {
  res.status(200).json({ data: dishes });
}

function read(req, res, next) {
  res.status(200).json({ data: res.locals.dish });
}

function update(req, res, next) {
  const result = req.body.data;
  const dish = res.locals.dish;
  dish.image_url = result.image_url;
  dish.description = result.description;
  dish.name = result.name;
  dish.price = result.price;
  res.status(200).json({ data: dish });
}

module.exports = {
  create: [bodyHasResultProperty, validateDish, create],
  list,
  read: [validateId, read],
  update: [validateId, validateDataId, validateDish, update],
};
// TODO: Implement the /dishes handlers needed to make the tests pass
