

let username;
let artwork;
//stores user and artwork in objects
function init(user,art){
    username = user;
    artwork = art;
}

//likes an artwork
function likeartWork(){
    if(username ==  "") return;
    let likes = document.getElementById("likes");
    let req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){
			likes.innerText = "Likes: "+this.responseText;
		}
	}
	req.open("PUT",window.location.href);
	req.send();
    
}

//lets user enroll to workshop
function enroll(){
    let req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){
            alert("succesfully enrolled");
            window.location.reload();
		}
	}
	req.open("POST",window.location.href);
	req.send();
}

//lets user follow an artist
function follow(){
    console.log(window.location.href);
    if(username ==  "") return;
    let req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){
		}
	}
	req.open("PUT",window.location.href);
	req.send();
    
}

//lets user add a review
function reviewArt(){
    let review = document.getElementById("review").value;
    console.log(username);
    if(username ==  "") return;
    let req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){
		}
	}
	req.open("PUT","/review/"+artwork.name);
	req.setRequestHeader("Content-Type", "application/json");
	req.send(JSON.stringify({review: review, username: username}));

    location.reload();

}
