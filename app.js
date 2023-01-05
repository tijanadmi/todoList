//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require("lodash");

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema=  {
    name: String,
    status: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!",
    status: "A"
});

//item1.save();

const item2 = new Item({
    name: "Hit the + button to add a new item.",
    status: "A"
});

const item3 = new Item({
    name: "<-- Hit this to delete an item.",
    status: "A"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



/*Item.insertMany(defaultItems, function(err){
    if (err){
        console.log(err);
    } else {
        console.log("Succesfully saved all default items to DB.")
    }
});*/

//console.log(date());
const app = express();

//var items = ["Buy Food","Cook Food","Eat Food"];
var items = [];
var workItems = [];

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res){
    let day = date.getDate();

    Item.find({},function(err, foundItems){
        if (err){
            console.log(err);
        } else {
            /*mongoose.connection.close();
            foundItems.forEach(function(item){
                console.log(item.name);
            });*/
            if (foundItems.length === 0){
                Item.insertMany(defaultItems, function(err){
                    if (err){
                        console.log(err);
                    } else {
                        console.log("Succesfully saved all default items to DB.")
                    }
                });
                res.redirect("/");
            } else {
                res.render("list", {listTitle: /*day*/"Today", newListItems: foundItems});
            }
            
        }
    });
    
    //res.render("list", {listTitle: day, newListItems: items});
});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}, function(err,foundList){
        if (err){
            console.log(err);
        } else {
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

    /*console.log(defaultItems);
    const list = new List({
        name: customListName,
        itema: defaultItems
    });

    list.save();*/
})

app.post("/", function(req, res){

    
    var itemName = req.body.newItem;
    var listName = req.body.list;
//console.log(itemName);
//console.log(listName);
    const item = new Item({
        name: itemName,
        status:"A"
    });
    //console.log(item);
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

    //item.save();
    //req.body.list === "Today"
    //res.redirect("/");
   /* if (req.body.list === "Work") {
        workItems.push(item);
        res.redirect("/work");
    } else {
        items.push(item);
        res.redirect("/");
    }*/

});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    /*Item.deleteOne({_id: checkedItemId}, function(err){
        if (err){
            console.log(err);
        } else {
            console.log("Succesfully deleted the document.")
        }
    });*/

    if (listName === "Today"){
        Item.findByIdAndRemove(checkedItemId,function(err){
            if (err){
                console.log(err);
            } else {
                console.log("Succesfully deleted the document.")
            }
        });
        res.redirect("/");
    } else{
        List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}},function(err, foundList){
            if (!err){
                res.redirect("/" + listName);
            }
        });
            
    }
    
});

app.get("/work", function(req, res){
    res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.post("/work", function(req, res){
    var item = req.body.newItem;
    workItems.push(item);
    res.redirect("/work");
});

app.get("/about", function(req, res){
    
    res.render("about");
});
app.listen(3000, function(){
  console.log("Server started on port 3000.");
});