//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//create connection to database
mongoose.connect(process.env.URL,
  {useNewUrlParser: true,
   useUnifiedTopology: true});


//create a schema for original list
const itemsSchema = {
  name: String
};

//create Mongoose model from schema, keep model name capital
const Item = mongoose.model("Item", itemsSchema);

//create an item from model
const item1 = new Item({
  name: "Welcome to your todolist!"
});

//adding items created to an array
const defaultItems = [item1];

//schema for custom lists, will take default schema 
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//home route
app.get("/", function(req, res) {
  //find the items in the model, and pass it as foundItems
  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0) { 
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});


//creates a custom list using express route params
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){ //from list model, find one item with custom name
    if (!err){
      if (!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });



});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  //user creates item by giving input on web
  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const clickedId = req.body.del; 
  const listName = req.body.listName;

  //check if list is default or custom
  if (listName === "Today") {
    Item.findByIdAndRemove(clickedId, function(err){ 
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: clickedId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}


app.listen(port, function() {
  console.log("Server has started on port successfully");
});
