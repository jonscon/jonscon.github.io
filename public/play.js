const baseAddr = "https://lake-harvest-gray.glitch.me/";

let tempSongs = [];   // array of song objects in queue
let currentSong;     // song object for current song playing
let volume;

async function getPlaylist(){
  var songObj;
  await fetch('/showSongs', {
    method:'GET',
    headers:{'Content-Type': 'application/json'}
  })
  .then(res => res.json())
  .then(data => songObj = data);
  // send GET req for list of songs in the playlist 
  var playlist = document.getElementById('playlist');
  const temp = document.createElement('div');
  await songObj.forEach( song => {
    temp.innerHTML += `
          <div id="song-obj" songId=${song.id}>
            <div id="name-artist">
              <p id="song">
                ${song.name}
              </p>
              <p id="artist">
                ${song.artist} - ${song.album}
              </p>
            </div>
            <div id="duration">
              <p id="duration-song">
                ${song.duration}
              </p>
              <p id="delete-song-btn" style="cursor:pointer" onclick="deleteSong(this)" title="remove song">X</p>
            </div>
            
          </div>`;
    });
  playlist.innerHTML = temp.innerHTML;
};

// repeated calls to refresh playlist 
setInterval(getPlaylist, 1000);

function deleteSong(e){
  const songId = e.parentElement.parentElement.getAttribute('songId');
  
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({"song":[{"uri":`spotify:track:${songId}`}], "songId":songId});

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  // Delete from Spotify
  fetch("https://lake-harvest-gray.glitch.me/deleteSongs", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error)); 
}

function Init(){
  //bunch o stuff the browser needs to do when it first loads
  activeCheck(); 
}

function openChat(){
  document.getElementById('chat-box').style.display = 'block';
}

function closeChat(){
  document.getElementById('chat-box').style.display = 'none';
}

function openSearch() {
  let popup = document.getElementById('searchPopup');
  let overlay = document.getElementById('searchPopup');
  
  popup.classList.add('active');
  overlay.classList.add('active');
}

function closeSearch() {
  let popup = document.getElementById('searchPopup');
  let overlay = document.getElementById('searchPopup');
  
  overlay.classList.remove('active');
  popup.classList.remove('active');
}

function messageOff() {
  let noResultsMessage = document.getElementById('noResultsMessage');
  noResultsMessage.style.display = "none";
}

// Search for tracks
let searchButton = document.getElementById('searchButton');
searchButton.addEventListener('click', function() {
  messageOff();
  search();
});

function search() {
  console.log('test');
  document.getElementById("searchResults").innerHTML = '';
  let search = document.getElementById('searchSong').value;  
  
  search = search.split(' ').join('%20');

  let url = '/search?query='+search;
  console.log(url);

  // send get request
  let xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", url);
  xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  
  xmlhttp.onloadend = function() {
    const responseObj = JSON.parse(xmlhttp.responseText)
    displayTracks(responseObj);
  }
  xmlhttp.send();
}

function displayTracks(searchResults) {
  
  let songContainer = document.getElementById("searchResults");
    songContainer.innerHTML += `
      <div id="song-container">
          <strong>Title</strong>
          <strong>Artist</strong>
          <strong>Album</strong>
      </div>
      <hr>
    `;
  
  for (var i = 0; i <= 5; i++) {
    if (searchResults[i] === undefined) {
      break;
    }
    let songName = searchResults[i].name;
    let songId = searchResults[i].id;
    let artistName = searchResults[i].artists[0].name;
    let albumName = searchResults[i].album.name;
    let length = msToMinSec(searchResults[i].duration_ms);
    
    
    let songContainer = document.getElementById("searchResults");
    let songRes = document.createElement("DIV");
    songRes.innerHTML = `<strong>${songName}</strong><strong>${artistName}</strong><strong>${albumName}</strong><button onclick="addSong(this)">Add</button>`;
    songRes.className = "song-container";
    songRes.setAttribute("id",songId);
    songRes.album = albumName;
    songRes.name = songName;
    songRes.artist = artistName;
    songRes.length = length;
    songContainer.appendChild(songRes);
    songContainer.appendChild(document.createElement('HR'));
  }
}

function currentPlayback() {
  
  let xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', '/currentPlayback');
  
  xmlhttp.onloadend = function () {
    let responseObj = xmlhttp.responseText;
    responseObj = JSON.parse(responseObj);
    currentSong = responseObj.id;
    volume = responseObj.volume;
    displayCurSong(responseObj);
    
  }
  xmlhttp.send();
}

function displayCurSong (songObj) {
  document.getElementById("song-display").innerHTML = songObj.name;
  document.getElementById("artist-display").innerHTML = songObj.artist + '&nbsp' + "•";
  document.getElementById("album-display").innerHTML = songObj.album;
  document.getElementById("duration-start-display").innerHTML = msToMinSec(songObj.progress_ms);
  document.getElementById("duration-end-display").innerHTML = msToMinSec(songObj.duration_ms);
 
  let progress = songObj.progress_ms;
  let duration = songObj.duration_ms;
  move(progress, duration);
}

function move(progress, duration) {
  let bar = document.getElementById('myBar');
  let percentage = duration / 1000;
  let pxIncrement = 600 / percentage;
  let progressToBarWidth = pxIncrement * (progress/1000);
  let barWidth = progressToBarWidth + 'px'
  bar.style.width = barWidth;
}

function msToMinSec(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

setInterval(currentPlayback, 1000);

function volUp() {
  let xmlhttp = new XMLHttpRequest();
  let vol = volume + 10;
  if (vol > 100) {
    vol = 100;
  };
  console.log(vol);
  
  let url = '/setVolume?volume_percent='+vol;
  
  xmlhttp.open("GET", url);
  
  xmlhttp.onloadend = function(e) {
    //console.log(xmlhttp.responseText);
  }
  xmlhttp.send();
}

function volDown() {
  let xmlhttp = new XMLHttpRequest();
  let vol = volume - 10;
  if (vol < 0) {
    vol = 0;
  };
  
  let url = '/setVolume?volume_percent='+vol;
  
  xmlhttp.open("GET", url);
  
  xmlhttp.onloadend = function(e) {
    //console.log(xmlhttp.responseText);
  }
  xmlhttp.send();
}


let firstSongAdded=false;

function addSong(e){
  let target = (e.parentElement);
  console.log(target);
  let songId = target.id;
  console.log("id obj", target.id);
  console.log("custom field Id" ,target.getAttribute('song-id'))
  
  let songObj = {
    'id': target.id,
    'name': target.name,
    'album': target.album,
    'artist': target.artist,
    'duration': target.length
  };
  // console.log(songObj);
  getPlaylist(songObj);
    
  let xmlhttp = new XMLHttpRequest();
  xmlhttp.open("POST", '/addSong');
  xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  
  let data = {
    songObj: songObj
  };
  
  xmlhttp.onloadend = function(e) {
    console.log(xmlhttp.responseText);
    if(firstSongAdded === false){
      startPlayback();
      firstSongAdded = true;
    }
  };
  
  xmlhttp.send(JSON.stringify(data));
  document.getElementById("searchResults").innerHTML = `
    <div id="noResultsMessage">
      <i class="fa fa-search" aria-hidden="true"></i>
      <p id="initialMessage">No results to show...yet</p>
    </div>`;
};

// called on init
function startPlayback(){
  currentSong = tempSongs.shift(); // set currentSong to first song in playlist
  
  let xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', '/startPlayback');
  
  xmlhttp.onloadend = function() {
    const responseObj = xmlhttp.responseText;
  };
  
  xmlhttp.send();
};

function invite(){
  console.log('invitin');
  let url = document.getElementById("url")
  url.innerHTML="https://lake-harvest-gray.glitch.me/";
  url.setAttribute('href', url.innerHTML);
  showPopup();
}

// Invite button
document.getElementById("invite-button").addEventListener("click", function () {
  console.log('inviting');
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
  // console.log(getComputedStyle(overlay, null).display);
}

function overlayOff() {
  let overlay = document.getElementById("overlay");
  overlay.style.display = "none";
}

window.onbeforeunload = function(event){
  let xmlhttp = new XMLHttpRequest();
  let xmlhttp2 = new XMLHttpRequest();
  xmlhttp.open("GET", "/logout");
  xmlhttp2.open("GET", "/clear");
  xmlhttp.send();
  xmlhttp2.send();
  return 'sorry to see you go!'
}

// window.addEventListener('beforeunload', function(event) {
//   // send get request
//   let xmlhttp = new XMLHttpRequest();
//   let xmlhttp2 = new XMLHttpRequest();
//   xmlhttp.open("GET", "/logout");
//   xmlhttp2.open("GET", "/clear");
//   xmlhttp.send();
//   xmlhttp2.send();
//   return 'sorry to see you go!'
// });

function unload(){
  return 'hello'
}

function activeCheck() {
  let xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", "/activeCheck");
  
  xmlhttp.onloadend = function(e) {
    console.log(JSON.parse(xmlhttp.responseText));
    
    let res = JSON.parse(xmlhttp.responseText);
    if (!res.is_active) {
      alert("Spotify device not active!");
    }
  };

  xmlhttp.send();
}
