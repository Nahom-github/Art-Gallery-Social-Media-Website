//Create express app
const express = require('express');
let app = express();
const session = require('express-session');
const bodyParser = require("body-parser");
app.use(express.json());

//Database variables
let mongo = require('mongodb');
const e = require('express');
let MongoClient = mongo.MongoClient;
let db;
app.locals.session = {};



app.set("view engine", "pug");
app.use(session({ 
	secret: 'some secret here', 
	cookie: {maxAge:5000000, hello: 1}, 
	resave: true,
	saveUninitialized: true,
    hello: true
  }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(expose)
app.get("/loginPage", loginPage);
app.get("/login", login)
app.get("/signUp", signUp);
app.post("/signUp", verifyAccount);
app.post("/homePage", homePage);
app.get("/homePage", homePageView);
app.post("/logOut",logOut);
app.get("/", loginPage);
app.get("/artwork/:ID",singularArt)
app.get("/category/:ID",categoryArt)
app.get("/medium/:ID",mediumArt)
app.get("/artist/:ID",loadArtist)
app.put("/artwork/:ID",auth,updateArt)
app.get("/following", auth,loadFollowing)
app.put("/artist/:ID",auth,addFollowing)
app.get("/search", search)
app.get("/startSearch", loadSearch)
app.put("/review/:ID",auth, submitReview)
app.get("/change", auth,checkAccountType, changeAccount)
app.post("/change", auth,changeToArtist)
app.get("/uploadArt",auth,uploadArt)
app.post("/uploadArt",auth,addArt)
app.get("/reviews",auth,loadReviews)
app.get("/workshops",auth, loadWorkshops)
app.post("/workshops", auth,addWorkshop)
app.get("/workshop/:ID",loadSingleWorkshop)
app.post("/workshop/:ID",auth,joinWorkshop)
app.get("/myWorkshops",auth, enrolledWorkshops)
app.get("/notifications",auth, loadNotifications)

// loads users notifications
async function loadNotifications(req,res){
    let user = await getUser(req);
    arr = user.notifications;
    res.status(200).render('noti',{gallery: arr});
}


// loads users enrolled workshops
async function enrolledWorkshops(req,res){
    let user = await getUser(req);
    res.status(200).render("myWorkshop", {artist: user});
}
// lets user join a workshop
async function joinWorkshop(req,res){
    let user = await getUser(req);
    let workshop = req.params.ID;
    let answer = await db.collection("users").findOne({ workshop: {$elemMatch:{type: "owner",name: workshop}} })
    await db.collection("users").updateOne({ username: answer.username}, { $push: {notifications: user.username+" enrolled to your workshop named "+ workshop}}, function (err, result) {
		if (err) throw err;
	});
    const query = { username: answer.username };
    const updateDocument = {
      $push: { "workshop.$[property].enrolled": user.username}
    };
    const options = {
      arrayFilters: [{
        "property.name": workshop,
      }]
    };
    await db.collection("users").updateOne(query, updateDocument, options, function (err, result) {
		if (err) throw err;        
	});
    answer = await db.collection("users").findOne({ workshop: {$elemMatch:{type: "owner",name: workshop}} });
    let wanted = answer.workshop.find(i => i.name == workshop);
    await db.collection("users").updateOne({username: user.username}, {$push:{"workshop": wanted}}, function (err, result) {
		if (err) throw err;        
	});
    res.redirect('/workshop/'+workshop);
}

//loads in a single workshop
async function loadSingleWorkshop(req,res){
    let workshop = req.params.ID;
    let answer = await db.collection("users").findOne({ workshop: {$elemMatch:{type: "owner",name: workshop}} })
   let wanted = answer.workshop.find(i => i.name == workshop)
   res.status(200).render('loadWorkshop', {workshop: wanted});

}

//lets artist create a workshop
async function addWorkshop(req,res){
    let user = await getUser(req);
    let workshop = {
        type: "owner",
        name: req.body.title,
        description: req.body.description,
        enrolled: [] 
    };
    await db.collection("users").updateOne({ username: user.username }, {$push: {"workshop": workshop} }, function (err, result) {
		if (err) throw err;        
	});
    await db.collection("users").updateMany({following: {$in: [user.username]}},{$push:{notifications: user.username + " is hosting a workshop called "+ workshop.name}})

    res.redirect("/homePage");
}
//loads all available workshops
async function loadWorkshops(req,res){
    let user = await getUser(req);
    let artists = []
    artists = await db.collection("users").find({type: "artist"}).toArray();
    
    if(user.type == "artist"){
        res.status(200).render('artistWorkshop.pug',{gallery: artists});
    }else{
        res.status(200).render('userWorkshop.pug',{gallery: artists});
    }
}

//loads users reviews
async function loadReviews(req,res){
    let user = await getUser(req);
    arr = user.reviews;
    res.status(200).render('reviews',{gallery: arr});
    
}
// gets user object from server
async function getUser(req){
    let user = req.session.user;
    let answer = await db.collection("users").findOne({ username: user.username })
    return answer;
}
// loads in all the art
async function addArt(req,res){
    let user = await getUser(req);
    let art = {
        "name":req.body.name,
        "artist":user.username, 
        "year": req.body.year ,
        "category":req.body.category ,
        "medium":req.body.medium ,
        "description": req.body.description ,
        "image":req.body.link, 
        "likes": 0, 
        "reviews": []
    }
    await db.collection("users").updateOne({ username: user.username }, {$push: {"art": art} }, function (err, result) {
		if (err) throw err;        
	});
   await db.collection("artwork").insertOne(art, function(err, result){
        if(err){
            res.status(500).send("Error reading database.");
            return;
        }
    });
    sendNoti = []
    await db.collection("users").updateMany({following: {$in: [user.username]}},{$push:{notifications: user.username + " uploaded new art named "+ art.name}})  
    res.redirect("/homePage");
}

//lets artist uplpoad art
async function uploadArt(req,res){
    let user = await getUser(req);
    if(user.type == "patron"){
        res.status(200).render('changeAccount');
    }else{
        res.status(200).render('uploadArt');
    }
}

//lets patron switch to artist
async function changeToArtist(req,res){
    let user = await getUser(req);
    let artArr = []
    let art = {
        "name":req.body.name,
        "artist":user.username, 
        "year": req.body.year ,
        "category":req.body.category ,
        "medium":req.body.medium ,
        "description": req.body.description ,
        "image":req.body.link, 
        "likes": 0, 
        "reviews": []
    }
    artArr.push(art);
    await db.collection("users").updateOne({ username: user.username }, { $set: {"type":"artist"}, $push: {"art": art, "workshop": []} }, function (err, result) {
		if (err) throw err;        
	});
   await db.collection("artwork").insertOne(art, function(err, result){
        if(err){
            res.status(500).send("Error reading database.");
            return;
        }
    });
    user.type = "artist"
    res.redirect("/homePage");
}

//checks user account type
async function checkAccountType(req,res,next){
    let user = await getUser(req);
    if(user.type == "patron"){
        next();
    }else{
        await db.collection("users").updateOne({ username: user.username }, { $set: {type: "patron"}}, function (err, result) {
            if (err) throw err;
            res.redirect("/homePage");
        });
    }
}

//loads page that allows user to change account
async function changeAccount(req,res){
    res.status(200).render('changeAccount');
}

//lets user submit a review
async function submitReview(req,res){
    artwork = req.params.ID;
    let inforev = {};
    inforev[artwork] = req.body.review;
    let rev = {reviews: inforev}
    let user = await getUser(req);

    artwork = await db.collection("artwork").findOne({name: artwork})
    
    if(user.username == artwork.artist){
        res.send()
        return;
    }

    let reviewForArt = {};
    reviewForArt[user.username] = req.body.review;
    let artReview = {reviews: reviewForArt}
   await db.collection("users").updateOne({ username: req.body.username }, { $push: rev }, function (err, result) {
		if (err) throw err;
        res.send();
	});
    await db.collection("artwork").updateOne({ name: req.params.ID }, { $push: artReview }, function (err, result) {
		if (err) throw err;
        res.send();
	});
}


// loads search page 
async function loadSearch(req,res){
    res.status(200).render('search');
}

//requests databse based on search results
async function search(req,res){

    let query = {};
	if(req.query.year){
		query["year"] = req.query.year;
	}

	if(req.query.name){
		query.name = {"$regex" : ".*" + req.query.name + ".*", "$options": "ix"};
	}
	if(req.query.artist){
		query.artist = {"$regex" : ".*" + req.query.artist + ".*", "$options": "ix"};
	}
    if(req.query.category){
		query.category = {"$regex" : ".*" + req.query.category + ".*", "$options": "ix"};
	}
	if(req.query.medium){
		query.medium = {"$regex" : ".*" + req.query.medium + ".*", "$options": "ix"};
	}

	db.collection("artwork").find(query).toArray(function(err, result){
		if(err){
			res.status(500).send("Error reading database.");
			return;
		}
		
		res.status(200).render('categoryMedium', {gallery: result, artist: "Search results"});
	});

}

//loads in the users following
async function loadFollowing(req,res){
    user = await getUser(req);
    db.collection("artwork").find({artist: {$in: user.following}}).toArray(function (err, result) {
        res.status(200).render('loadFollowing', {gallery: result});
    });
}

//adds a user to artists following
async function addFollowing(req,res){
    user = await getUser(req)
    user = user.following;
    const art = req.params.ID;
    currentUser = await getUser(req)
    if(!user.includes(art)){
      var newLike =  {following: art}  
      var user = {"_id": currentUser._id}
      db.collection("users").updateOne({ username: currentUser.username }, { $push: newLike }, function (err, result) {
		if (err) throw err;
        res.send();
	});
    }else{
        db.collection("users").updateOne({ username: currentUser.username }, { $pull: {following:art} }, function (err, result) {
            if (err) throw err;
            res.send();
        });        
    }
}

//loads art based on the category
async function categoryArt(req,res){
    const art = req.params.ID;
    db.collection("artwork").find({category: art}).toArray(function (err, result) {
        res.status(200).render('categoryMedium', {gallery: result, artist: art});
    });
}
//loads art based on the medium
async function mediumArt(req,res){
    const art = req.params.ID;
    db.collection("artwork").find({medium: art}).toArray(function (err, result) {
        res.status(200).render('categoryMedium', {gallery: result, artist: art});
    });
}

//loads an artists page
async function loadArtist(req,res){
    const art = req.params.ID;
    artwork = await db.collection("artwork").find({artist: art}).toArray()
    db.collection("users").findOne({"username":art}, function(err, result){
		if(err){
			res.status(500).send("Error reading database.");
			return;
		}
        res.status(200).render('artist', {gallery: artwork, artist: result});
	});
}

//loads in the users likes
app.get("/likes", auth,async (req, res,next) => {
    let user = await getUser(req);
    db.collection("artwork").find({name: {$in: user.likes}}).toArray(function (err, result) {
        res.status(200).render('home', {gallery: result});
    }); 
});



//adds a revew for a user
async function updateArt(req,res,next){
    const art = req.params.ID;
    artwork = await db.collection("artwork").findOne({name: art})
    currentUser = await getUser(req);

    if(currentUser.username == artwork.artist){
    res.send(JSON.stringify(req.session.art.likes));
    return;
    }


    if(!currentUser.likes.includes(art)){
      var newLike =  {likes: art}  
      db.collection("users").updateOne({ username: currentUser.username }, { $push: newLike }, function (err, result) {
		if (err) throw err;
	});
    let newLiked = req.session.art.likes + 1;
    db.collection("artwork").updateOne({ "name":art }, { $set: {"likes":newLiked} }, function (err, result) {
		if (err) throw err;
        let art = req.session.art.likes
        art += 1;
        req.session.art.likes = art
        res.send(JSON.stringify(req.session.art.likes));
	});
    let artist = await db.collection("users").find({"art.name": art}).toArray();
    var newNoti = {notifications:  currentUser.username+ " Liked your post named: " + art}

    db.collection("users").updateOne({ username: artist[0].username }, { $push: newNoti}, function (err, result) {
		if (err) throw err;
	});

    }else{
        db.collection("users").updateOne({ username: currentUser.username }, { $pull: {likes:art} }, function (err, result) {
            if (err) throw err;
        });

        let newLiked = req.session.art.likes + -1;
    db.collection("artwork").updateOne({ "name":art }, { $set: {"likes":newLiked} }, function (err, result) {
		if (err) throw err;
        
        let art = req.session.art.likes
        art -= 1;
        req.session.art.likes = art
        res.send(JSON.stringify(req.session.art.likes));

	});
        

    }
}

//loads a singular artwork
function singularArt(req,res,next){
    const art = req.params.ID;
    db.collection("artwork").findOne({"name":art}, function(err, result){
		if(err){
			res.status(500).send("Error reading database.");
			return;
		}
        req.session.art = result;
        res.status(200).render('artwork', {art: result, username: req.session.username});
	});
}

//loads in the homepage
function homePageView(req,res,next){
   allArt(res);
}
//adds a session to locals
function expose(req,res,next){
    if(req.session) res.locals.session = req.session;
    next()
}


//lets a user logout
function logOut(req,res,next){
    if (req.session.loggedin) {
		req.session.loggedin = false;
		req.session.username = undefined;
		res.redirect("/");
	} else {
		res.status(200).send("You cannot log out because you aren't logged in.");
	}

}

//adds a new user to database after they sign up
function newUser(username, password){
    db.collection("users").insertOne({"username":username, "password":password, "type": "patron",likes:[],reviews:[],notifications:[],workshop:[], following:[]}, function(err, result){
        if(err){
            res.status(500).send("Error reading database.");
            return;
        }
    });
}

//gets all the art from database
function allArt(res){
    db.collection("artwork").find({}).toArray(function(err, result){
		if(err){
			res.status(500).send("Error reading database.");
			return;
		}
		res.status(200).render('home', {gallery: result});
	});
}
//checks to see if user entered correct username and password when logging in
function verifyAccount(req,res,next){
    db.collection("users").findOne({"username":req.body.username}, function(err, result){
		if(err){
			res.status(500).send("Error reading database.");
			return;
		}
		if(!result){
			if(req.body.password != ""){
                newUser(req.body.username, req.body.password);
                res.redirect("/");
            }else{
                res.status(404).send("please input a passowrd");
            }
		}else{
            res.status(404).send("Username already exists");
        }
	});
}

//loads up sign up page
function signUp(req,res,next){
    res.status(200).render("signUp");
    
}

//loads in the login page
function loginPage(req, res, next){
	res.status(200).render("login");
}

//loads in the login page
function login(req, res, next){
	res.status(200).render("login");
}
//checks to see if the user is logged in
function auth(req,res,next){
    if(!req.session.loggedin){
        //they are already logged in 
        res.redirect("/"); 
        return;
    }
    next();
}

//checks if the user entered the correct detaiils
function homePage(req,res,next){

    if(req.session.loggedin){
        //they are already logged in 
        res.status(404).send("User already logged in"); 
        return;
    }
    let username = req.body.username;
    db.collection("users").findOne({"username":username}, function(err, result){
		if(err){
			res.status(500).send("Error reading database.");
			return;
		}
		if(!result){
			res.status(404).send("Unknown Username");
			return;
		}else{
            if(req.body.password == result["password"]){
                req.session.loggedin = true;
                req.session.username = req.body.username;
                req.session.user = result;
                allArt(res);
            }else{
                res.status(404).send("Incorrect Password"); 
            }
        }
	});
}


//loads a 404 page when the user requests a url that does not exist
app.use((req, res, next) => {
    res.status(404).send()
  })

// Initialize database connection
MongoClient.connect("mongodb://127.0.0.1:27017/", { useNewUrlParser: true }, function(err, client) {
  if(err) throw err;

  //Get the t8 database
  db = client.db('gallery');

  // Start server once Mongo is initialized
  app.listen(3000);
  console.log("Listening on port 3000");
});
