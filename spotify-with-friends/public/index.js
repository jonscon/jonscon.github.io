// client-side js, loaded by index.html
// run by the browser each time the page is loaded

console.log("hello world :o");

// Creating a new playlist
function createPlaylist() {
  let xmlhttp = new XMLHttpRequest();   
  xmlhttp.open("POST", '/createPlaylist');
  xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  
  let playlistData = {
    name: "Spotify with Friends",
    collab: true,
  };
  
  console.log(playlistData);
  
  xmlhttp.onloadend = function(e) {
    console.log(xmlhttp.responseText);
    window.location.href = 'playroom.html';
  }
  
  xmlhttp.send(JSON.stringify(playlistData));
}

/*
// Search for tracks
let searchButton = document.getElementById('searchButton');
searchButton.addEventListener('click', search);

function search() {
  let song = document.getElementById('searchSong').value;  
  let artist = document.getElementById('searchArtist').value;
  
  song = song.split(' ').join('%20');
  artist = artist.split(' ').join('%20');

  let url = '/search?song='+song+'&artist='+artist;
  // console.log(url);

  // send get request
  let xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", url);
  xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  
  xmlhttp.onloadend = function() {
    console.log("response text:", JSON.parse(xmlhttp.responseText));
    const responseObj = JSON.parse(xmlhttp.responseText)
  }
  xmlhttp.send();
}

// Invite button
document.getElementById("invite-button").addEventListener("click", function () {
  let url = document.getElementById("url")
  url.innerHTML="https://lake-harvest-gray.glitch.me/";
  url.setAttribute('href', url.innerHTML);
  showPopup();
});
document.getElementById("x").addEventListener("click", function () {
  overlayOff();
})

function showPopup() {
  let overlay = document.getElementById("overlay");
  overlay.style.display = "block";
  console.log(getComputedStyle(overlay, null).display);
}

function overlayOff() {
  let overlay = document.getElementById("overlay");
  overlay.style.display = "none";
}

function onLoad(){
  console.log('onload');
}
*/