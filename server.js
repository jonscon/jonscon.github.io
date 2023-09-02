const express = require("express");
const app = express();

const passport = require('passport');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const request = require("request");
const bodyParser = require('body-parser');
const fetch = require("node-fetch");
const socket = require('socket.io')
const sqlite3 = require("sqlite3").verbose();

let userDB = new sqlite3.Database('users.db');

let PlayList = [];

/* GLOBAL VARIABLES */
let access_token = [];
let user_id = [];
let playlist_id = "";
let user_full_name = "";

// table creation: check if the "users.db" exists; 
// if not, create table
// let cmd = " SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Users' ";
userDB.get(" SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Users' ", function (err, val) {
  console.log(err, val);
  if (val == undefined) {
    console.log("No database file");
    createUsersDB();
  }
  else {
    console.log("Found database file!");
  }
});

function createUsersDB() {
  const cmd = 'CREATE TABLE Users (rowId INTEGER PRIMARY KEY, userID TEXT, hostOrGuest TEXT)';
  userDB.run(cmd, function(err, val) {
    if (err) {
      console.log("Database creation failed", err.message);
    }
    else {
      console.log("Created database");
    }
  });
}

app.use(expressSession(
  { 
    secret:'bananaBread',  // a random string used for encryption of cookies
    maxAge: 6 * 60 * 60 * 1000, // Cookie time out - six hours in milliseconds
    // setting these to default values to prevent warning messages
    resave: true,
    saveUninitialized: false,
    // make a named session cookie; makes one called "connect.sid" as well
    name: "ecs162-session-cookie"
  }));

app.use(passport.initialize());
app.use(passport.session());

// There are other strategies, including Facebook and Spotify
const SpotifyStrategy = require('passport-spotify').Strategy;

// global object that stores all users' access tokens, indexed by their Spotify profile id
// kind of taking the place of a user table in a database
// since we're only handling one room, this should be sufficient
var tokens = {}

passport.use(
  new SpotifyStrategy(
    {
      clientID: "01461b358ba544a59e6a189e4edeac3d",
      clientSecret: "06e00ef88f66427889515b259feacdde",
      callbackURL: 'https://lake-harvest-gray.glitch.me/auth/spotify/callback',
      scope: ["user-read-playback-state", "user-modify-playback-state", "playlist-modify-private", "user-read-private"]
    },
  // function to call once Passport gets the user's profile and accessToken from Spotify
  gotProfile
  )
);

// The first call to Passport, which redirects the login to Spotify to show the login menu
app.get('/auth/spotify', 
  function (req, res, next) {
    console.log("At first auth");
    next();
  },   
  passport.authenticate('spotify'), function(req, res) {
  // The request will be redirected to spotify for authentication, so this
  // function will not be called and we don't have to return the HTTP response.
});

// After the user logs in, Spotify redirects here. 
// Passport will proceed to request the user's profile information and access key
app.get(
  '/auth/spotify/callback',
  function (req, res, next) {
    console.log("At second auth");
    next();
  },   
  passport.authenticate('spotify', { failureRedirect: '/login' }),
  function(req, res) {
    // put new item into database
    
    let countCMD = "SELECT * FROM Users";
    userDB.all(countCMD, getNumRows);
  
    function getNumRows(err,rows) {
      if (err) {
        console.log(err.message);
      }
      else {
        let cmd = "INSERT INTO Users (userID, hostOrGuest) VALUES (?,?) ";

        if(rows.length > 0) {
          console.log("Table not empty - you are a guest");
          userDB.run(cmd,req.user,"guest", function (err) {
            if (err) {
              console.log("DB insert error",err.message);
            }
          })
          // Redirect to playroom
          res.redirect('/playroom.html');
        }

        else {
          console.log("Table empty - you are the host");
          userDB.run(cmd,req.user,"host", function(err) {
            if (err) {
              console.log("DB insert error",err.message);
            }
          })
        // Successful authentication, redirect home.
        // res.send(user_full_name);
        res.redirect('/home');
        }
      }
    }
  }
);


// This request is sent from the Browser when a user pushes "play" on a song.
app.get("/play/:id", function(req, res) {
  
  console.log(req.user);
  let token = tokens[req.user];  // grab the user's access token
  
  // next, do an API call to Spotify at this URL
  let url = "https://api.spotify.com/v1/me/player/play";
  
  // put some data into the body of the PUT request we will send to Spotify
  let body = {"uris": ["spotify:track:" + req.params.id]}
  console.log(body)

  const options = {
      url: url,
      json: true,
      body: body,
      headers: {
        // give them the user's token so they know we are authorized to control the user's playback
        "Authorization": `Bearer ${token}`
      }
  };

  // send the PUT request!
  request.put(options, 
    // The callback function for when Spotify responds
    (err, postres, body) => {
      if (err) {
          return console.log(err);
      }
      console.log(`Status: ${postres.statusCode}`);
      console.log(body);

      // just go back to the single homepage.  Later you might want to add a query string? 
      // or do this whole thing with an AJAX request rather than with redirects? 
      res.redirect("/home")
  });
}); // end app.get


// Usual static server stuff
app.get("/", (request, response) => {
  // console.log(request.user); // for debugging
  response.sendFile(__dirname + "/public/landing.html");
});

app.get("/home", (req, res) => {
  // console.log('go into home')
  res.sendFile(__dirname + "/public/index.html")
})

// make all the files in 'public' available
app.use(express.static("public"));

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});


// These are the three Passport "customization functions", used for getting user information into
// rec.user.  

// This function is 
// called by Passport when the user has successfully logged in, and the accessToken, refreshToken,
// and user profile have been returned to this Server from the Spotify authentication server
function gotProfile(accessToken, refreshToken, expires_in, profile, done) {
      // the access tokens of all users are stored in the global object "tokens"
      tokens[profile.id] = accessToken;
      access_token.push(accessToken);
      user_id.push(profile.id);
      user_full_name = profile.displayName;
      // console.log(profile);
      // it calls "done" to tell Passport to get on with whatever it was doing.
      // See login mini-lecture 25, the customization functions described around slide 7
      done(null, profile.id)
}

// profile.id was passed out of gotProfile and into and out of here 
passport.serializeUser(function(user, done) {
  done(null, user);
});

// profile.id was passed out of serializeUser, and into and out of here. Passport will put it into rec.user
passport.deserializeUser(function(user, done) {
  done(null, user);
});


app.use(bodyParser.json());

app.post('/createPlaylist', function (req, res) {  
  let name = req.body.name;
  //let collab = req.body.collab;
  let collab = false;
  
  var postReq = {
    url: 'https://api.spotify.com/v1/users/'+ user_id[0] +'/playlists',
    body: JSON.stringify({
      'name': name,
      'public': false
    }),
    dataType: 'json',
    headers: {
      'Authorization': 'Bearer '+access_token[0],
      'Content-Type': 'application/json'
    }
  };
  
  request.post(postReq, function(error, response, body) {
    let jsonBody = JSON.parse(body);
    // console.log(jsonBody);
    
    playlist_id = jsonBody.id;
    console.log("playlist id:", playlist_id);
  });

  res.send("received");
});

app.get('/search', async function (req, res) {
  let searchTerms = req.query.query;
  
  // encode spaces as %20
  searchTerms = searchTerms.split(' ').join('%20');
  
  let query = "q="+searchTerms+"%20&type=track&market=US&limit=10";
  let url = "https://api.spotify.com/v1/search?"+query;
  console.log(url);
  
  let obj;
  
  await fetch( url, {
    method: "GET",
    headers: { 'Authorization': 'Bearer '+access_token[0] }
  })
  .then(res => {
    return res.json();
  })
  .then(data =>{
    return data.tracks.items
  })
  .then(items => {
    function filterObj(obj, w){
      let result = {}

      for (let key in obj) {
        if ( w.indexOf(key) !== -1){
          result[key] = obj[key]
        }
      }
      return result
    }
    obj = items.map(obj => filterObj(obj, ['album','artists','id','name', 'duration_ms']));
  })

  res.status(200).send(JSON.stringify(obj));
});

app.post('/addSong', function(req, res) {
  let data = req.body.songObj;
  console.log("ADD SONG DATA",data);
  PlayList.push(data);
  
  var postReq = {
    url: 'https://api.spotify.com/v1/playlists/'+ playlist_id +'/tracks',
    body: JSON.stringify({
      'uris': ['spotify:track:'+data.id],
    }),
    headers: {
      'Authorization': 'Bearer '+access_token[0],
      'Content-Type': 'application/json'
  }};
  
  request.post(postReq, function(error, response, body) {
    if (error) {
      console.log(response);
    }
    let jsonBody = JSON.parse(body);
  });
    
  res.send('success');
});

app.get('/showSongs', function(req, res){
  res.json(PlayList);
})

// chat 
// takes server obj as input 
const io = socket(listener);
// Make connection (1/2)
// socket as the socket object when a connection happens
// require socket set up on the front end 
io.on('connection', (socket) => {
    // console.log("made socket connection", socket.id);
    // handle emit 
    socket.on('chat', (data) => {
        // sockets -> all sockets that are live (all chat users)
        // sends the data back to all live sockets
        io.sockets.emit('chat', data);
    });

    // handle broadcast
    socket.on('typing', (data) => {
        // the specific socket that is sending us the information 
        // broadcast allowd emitting to every other socket but the one sending 
        socket.broadcast.emit('typing', data);
    })
});

var startedPlaying = false;
app.get('/startPlayback', function(req, res) {
  
  let url = "https://api.spotify.com/v1/me/player/play";
  let body = {context_uri: "spotify:playlist:"+playlist_id, "offset": {"position": 0} };
  
  access_token.forEach( token => {
    const options = {
      url: url,
      json: true,
      body: body,
      headers: { 'Authorization': 'Bearer '+ token }
    };
  
    request.put(options, 
      // The callback function for when Spotify responds
      (err, postres) => {
        if (err) {
            return console.log(err);
        }
        console.log(`Status: ${postres.statusCode}`);
    });
  });
  // just go back to the single homepage.  Later you might want to add a query string? 
  // or do this whole thing with an AJAX request rather than with redirects? 
  
  // set started playing to true
  startedPlaying = true;
  res.redirect("/home")
  
});

app.get('/currentPlayback', async function(req, res) {
  let url = 'https://api.spotify.com/v1/me/player';
  let resObj;
  
  await fetch(url, {
    method: "GET",
    headers: { 'Authorization': 'Bearer '+access_token[0] }
  })
  .then(res => {
    return res.json();
  })
  .then(data =>{
    // console.log("CURRENT PLAYBACK", data);
    resObj = {
      'id':data.item.id,
      'name': data.item.name,
      'artist': data.item.artists[0].name,
      'album': data.item.album.name,
      'progress_ms': data.progress_ms,
      'duration_ms': data.item.duration_ms,
      'volume': data.device.volume_percent,
      'is_active': data.device.is_active
    }
  })
  .catch(err => {
    // error 
    console.log(err)
    resObj = {
      'is_active': false
    }
  });
  
  // call to syncPlay function 
  if(startedPlaying && resObj.is_active){
    syncPlay(resObj.id, resObj.progress_ms);    
  }
  res.send(JSON.stringify(resObj));
});

function syncPlay(hostSongId, hostCurrPosition){
  if (access_token.length < 2){
    return;
  }
  //1. grab guest tokens
  const guest_tokens = access_token.slice(1);
  //2. check each users status 
  guest_tokens.forEach( async (guest_token) => {
    let guest_song = {};
    await fetch( 'https://api.spotify.com/v1/me/player', {
      method: "GET",
      headers: { 'Authorization': 'Bearer '+guest_token }
    })
    .then(res => {
      return res.json();
    })
    .then(data => {
      // assign to guest song obj 
      guest_song = {
        'id': data.item.id,
        'progress_ms': data.progress_ms,
        'is_active': data.device.is_active
      };
    })
    .catch(err => {
      // debug -> will show error if a user does not have their device turned on 
      // console.log(err, "ERROR on line 449");
    })
    
    //3. check if each song is 
    // if no device -> don't do nothing 
    if(!guest_song.is_active){
      console.log('line 455 -> NO DEVICE ON');
      return;
    }
    //A. playing the same song as host     
    if(guest_song.id !== hostSongId){
      //play new song for guest
      var myHeaders = {
        'Authorization': "Bearer "+ guest_token,
        'Content-Type': 'application/json'
      }

      var raw = JSON.stringify({"uris":["spotify:track:"+hostSongId],"position_ms":hostCurrPosition});

      var requestOptions = {
        method: 'PUT',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
      };

      fetch("https://api.spotify.com/v1/me/player/play", requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error with track check ', new Error().lineNumber, error));
    }
    //B. within ten seconds of the host's current progress
    if(!(Number(guest_song.progress_ms) < Number(hostCurrPosition)+15000) || !(Number(guest_song.progress_ms) > Number(hostCurrPosition)-15000)){
      //switch to correct position 
      var requestOptions = {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer "+guest_token
        },
        redirect: 'follow'
      };

      fetch("https://api.spotify.com/v1/me/player/seek?position_ms="+hostCurrPosition, requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error at ', new Error().lineNumber, error));
    }
  })
}

app.get('/setVolume', async function(req, res) {
  let volume_percent = req.query.volume_percent;
  let url = 'https://api.spotify.com/v1/me/player/volume?volume_percent=' + volume_percent;
  let status;
  let response = 'success';
  
    access_token.forEach(token =>{
      let options = {
        url: url,
        headers: { 'Authorization': 'Bearer '+token }  
      }
      
      request.put(options,
        (err, postres) => {
          if (err) {
            console.log(err)
          }
          status = postres.statusCode;
        } 
      )
      if (status == 401) {
        response = 'failure';
      }
      else {
        response = "success 2";
      }
    });
  
  res.send(response);
});

app.get('/logout', function (req, res, next) {
  let cmd = "SELECT * FROM Users WHERE userID=?";
  console.log(req.user)
  
  userDB.get(cmd, req.user, function(err, row) {
    if (err) {
      console.log("DB insert error",err.message);
    }
    
    if (row.hostOrGuest == "host") {
      console.log("deleting whole table");
      let delCmd = "DELETE FROM Users";
      userDB.run(delCmd, function(err) {
        if (err) {
          console.log("DB insert error",err.message);
        }
      })
    }
    else {
      console.log("deleting just guest's row" + req.user);
      let delCmd = "DELETE FROM Users WHERE userID=?";
      userDB.run(delCmd, row.userID, function(err) {
        if (err) {
          console.log("DB insert error",err.message);
        }
      });
    }
  })
 
  req.logout();
  res.redirect('/');
});

app.get('/clear', function(){
  console.log('Clearning PlayList obj in server')
  PlayList = [];
})

app.post('/deleteSongs', function(req, res){
  const songList = req.body.song; // array
  const song_id = req.body.songId;
  const url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`;
  fetch(url, {
    'method':"DELETE",
    'headers':{
      'Authorization': 'Bearer '+access_token[0]
    },
    'body': JSON.stringify({
      "tracks":songList
    })
  })
  .then(res => res.json())
  .then(data => res.json(data));
  
  // remove from UI - update PlayList 
  PlayList = PlayList.filter(songObj => songObj.id !== song_id);
});

app.get('/activeCheck', async function(req, res) {
  let resObj;
  
  await fetch( 'https://api.spotify.com/v1/me/player/devices', {
    method: "GET",
    headers: { 'Authorization': 'Bearer '+access_token[access_token.length-1] }
  })
  .then(res => {
    return res.json();
  })
  .then(data =>{
    if(data.devices.length > 0){
      resObj = {
        'is_active': data.devices[0].is_active
      }
    }
    else {
      resObj = {
        'is_active': false
      }
    }
  });
  
  res.send(JSON.stringify(resObj));
});