// Make connection (2/2)
const base = "https://lake-harvest-gray.glitch.me/";
const socket = io.connect(base);

// Query DOM
const message = document.getElementById('message');
const handle = document.getElementById('handle');
const btn = document.getElementById('send');
const output = document.getElementById('output');
const feedback = document.getElementById('feedback');

// emit events -> emits to the server
btn.addEventListener('click', () => {
  console.log("send clicked ")
    socket.emit('chat', {
        message: message.value,
        handle: handle.value
    });
});

// Broadcating events
// sends the handle value of this client back to the server
message.addEventListener('keypress', () => {
    socket.emit('typing', handle.value)
})

// Listen for events 
// output to the DOM
socket.on('chat', (data)=>{
    feedback.innerHTML=""; // reset the feedback string so the typing message will go away once message is sent 
    output.innerHTML += '<p id="chat-message"><strong id="chat-name-handler">' + data.handle.trim() +": "+ '</strong>'+ data.message.trim() + '</p>';
    scroll();
    message.value='';
})

socket.on('typing', (data) => {
    feedback.innerHTML = '<p id="typing-msg"><em>' + data + 'is typing a message... </p></em>';
})

const scroll = () => {
  let chatbox = document.getElementById('output');
  let lastchild = chatbox.children[chatbox.children.length-1];
  console.log(lastchild);
  lastchild.scrollIntoView();
}


// when text input is focused -> listen for 'enter' key down 
// const textInput = document.getElementById('message');
const enterKeyDown = function(e){
    const key = e.keyCode;
    if(key === 13 && message.value !== ''){
      // send message 
      socket.emit('chat', {
        message: message.value,
        handle: handle.value
      });
    }
}

message.addEventListener('focus', function(){
  message.addEventListener('keydown', enterKeyDown);
})

message.addEventListener('blur', function(){
  message.removeEventListener('keydown', enterKeyDown);
})