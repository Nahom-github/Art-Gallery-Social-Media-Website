let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
var fs = require('fs');
let db;
let art;
let artists = [];
fs.readFile('gallery.json', function(err, content) {
    if (err) {
      return;
    }
    art = JSON.parse(content);
    console.log(art);
    for(const artpiece in art){
        let singleArtist = {};
        art[artpiece].likes = 0;
        art[artpiece].reviews = [];
        console.log(artpiece);
        singleArtist["username"] = art[artpiece]["artist"];
        singleArtist["password"] = "123";
        singleArtist["type"] = "artist";
        singleArtist["likes"] = [];
        singleArtist["reviews"] = [];
        singleArtist["workshop"] = [];
        singleArtist["art"] = [];
        singleArtist["art"].push(art[artpiece]);
        singleArtist["notifications"] = [];
        singleArtist["following"] = [];
        console.log(singleArtist);
        artists.push(singleArtist);

    }
    console.log(artists);

  });
MongoClient.connect("mongodb://127.0.0.1:27017/", { useNewUrlParser: true }, function(err, client) {
  if(err) throw err;

  db = client.db('gallery');
  db.dropCollection("artwork", function(err, result){
	  if(err){
			console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)")
		}

		db.collection("artwork").insertMany(art, function(err, result){
			if(err) throw err;
			console.log("Successfuly inserted " + result.insertedCount + " artwork.")
			process.exit();
		})
  });
  db.dropCollection("users", function(err, result){
    console.log("check");
    if(err){
          console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)")
      }
      db.collection("users").insertMany(artists, function(err, result){
          if(err) console.log("error");;
          console.log("Successfuly inserted " + result.insertedCount + " users.")
          process.exit();
      })
});
});