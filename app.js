//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//DB connection
mongoose.connect("mongoURL", { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
  name: {
    type: String,
    require: true
  }
};

const Item = new mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = new mongoose.model('List', listSchema);


// GET methods
app.get("/", function (req, res) {

  Item.find({}, (err, items) => {
    if (err) {
      console.log(err);
    } else {

      if (items.length === 0) {
        Item.insertMany(defaultItems, (err, res) => {
          if (err) {
            console.log(err);
          } else {
            console.log(res);
          }
        });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: 'Today', listItems: items });
      }
    }
  });
});

app.get("/:listName", function (req, res) {
  let listName = _.capitalize(req.params.listName);
  let list = null;
  List.findOne({ name: listName }, (err, result) => {
    if (!result) {
      list = new List({
        name: listName,
        items: defaultItems
      });

      list.save();
    } else {
      list = result;
    }
    res.render("list", { listTitle: list.name, listItems: list.items });
  });



});


// POST methods
app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });
  if (listName === 'Today') {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, result) => {
      result.items.push(newItem);
      result.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, { useFindAndModify: false }, (err) => {
      if (err) {
        console.log('Error while deleting item');
      } else {
        console.log('Successfully deleted item');
      }
      res.redirect('/');
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, (err, result) => {
      console.log(result);
      res.redirect('/' + listName);
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
