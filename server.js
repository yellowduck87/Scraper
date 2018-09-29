// var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// // mongoose.Promise = Promise;
// mongoose.connect(MONGODB_URI);


var express = require("express");
var bodyParser = require("body-parser");
// var logger = require("morgan");
var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");
var axios = require("axios")

var db = require("./models")

var PORT = 3000;

var app = express();

// app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
    extended: true
}));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/scraper", {
    useNewUrlParser: true
});

app.get("/scrape", function (req, res) {
    axios.get("http://www.developerdrive.com/").then(function (response) {
        var $ = cheerio.load(response.data);
        $("article div").each(function (i, element) {
            var result = {};


            result.title = $(this).find('.hp-post-title').text().trim();
            result.link = $(this).find('.hp-post-title').children().attr('href');
            result.summary = $(this).find('div.hppp-text').text().trim();
            result.category = $(this).find('.hppp-category').text().trim();

            // // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, send it to the client
                    return res.json(err);
                });
        });

        // If we were able to successfully scrape and save an Article, send a message to the client
        res.redirect("/articles");
    });
})

app.get("/articles", function (req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            res.json(dbArticle)
        })
        .catch(function (err) {
            res.json(err)
        })

});

app.get("/articles/:id", function (req, res) {

    db.Article.findById({
            _id: req.params.id
        })
        .populate("note")
        .then(function (dbArticle) {
            res.json(dbArticle)
        })
    // ====
    // Finish the route so it finds one article using the req.params.id,
    // and run the populate method with "note",
    // then responds with the article with the note included
});

app.post("/articles/:id", function (req, res) {
    // TODO
    // ====
    var note = new db.Note(req.body)

    db.Note.create(note)
        .then(function (createdNote) {
            // res.json(dbArticle)

            db.Article.findByIdAndUpdate(req.params.id, {
                    $set: {
                        note: createdNote._id
                    }
                }, {
                    new: true
                })
                .populate("note")
                .then(function (updatedArticle) {
                    console.log(updatedArticle);
                    res.json(updatedArticle);
                })
                .catch(function (error) {
                    console.error(error);
                })
        })

    // save the new note that gets posted to the Notes collection
    // then find an article from the req.params.id
    // and update it's "note" property with the _id of the new note
});


app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});