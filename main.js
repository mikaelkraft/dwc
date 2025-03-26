function currentTime() {
  var date = new Date(); /* creating object of Date class */
  var hour = date.getHours();
  var min = date.getMinutes();
  var sec = date.getSeconds();
  var midday = "AM";
  midday = (hour >= 12) ? "PM" : "AM"; /* assigning AM/PM */
  hour = (hour == 0) ? 24 : ((hour > 24) ? (hour - 24): hour); /* assigning hour in 24-hour format */
  hour = updateTime(hour);
  min = updateTime(min);
  sec = updateTime(sec);
  document.getElementById("clock").innerText = hour + " : " + min + " : " + sec + " " + midday; /* adding time to the div */
    var t = setTimeout(currentTime, 1000); /* setting timer */
}

function updateTime(m) { /* appending 0 before time elements if less than 10 */
  if (m < 10) {
    return "0" + m;
  }
  else {
    return m;
  }
}

currentTime();

let fillData = () => {
         
        let mk = document.getElementById('container');
        mk.innerHTML = 'SAY NO TO DRUGS: You might not be a fan of Juice Wrld, the young American rapper who died of Drug Overdose at the age of 21, yet you need to listen to one of his tracks "RIGHTEOUS", if not all to learn the dangerous impact of hard drugs. He deliberately predicted his own death. He gave his words religiously. The music is off Legends Never Die PostHumous album.' + '<br />' + '\n';
          
        mk.innerHTML += '<br />' + '<span style="background-color: red; padding: 0 10px 0 10px; font-size: 16px; border-radius: 3px; font-family: times-new-roman; font-decoration: bold;">ENJOY THE MUSIC BELOW</span>';
   // Display an Alert before the message
        document.getElementById('button');
        swal({
  icon: "success",      
  title: "Awesome!",
  text: "You juiced it, now get the message!",
  className: "alert2",
  button: {
    text: "Rock!",
    className: "alertj",
  },
});
   
        //lyrics corner
        let lyc = document.getElementById('lyrics');
        lyc.innerHTML = "<span style='color: red; text-shadow: 4px 4px 5px black; font-family: righteous;'><h2><u>RIGHTEOUS: the lyrics</h2></u></span>" + "<br />\n";
        lyc.innerHTML += "<br />" + "\nI will\n" + "<br />" + "I will\n" + "<br />" + "I will\n\n" + "<br />" + "<br />" + "Oh, uh All white Gucci suit, I'm feeling righteous, yeah I know that the truth is hard to digest, yeah Five or six pills in my right hand, yeah Codeine runneth over on my nightstand Taking medicine to fix all of the damage \nMy anxiety the size of a planet (yeah), oh, Holes in my skull overtime, \nMy heart's over ice (whoa)\n" + "<br />";
        lyc.innerHTML += "<br />" + "\nOver ice, I'm freezing \nBeautiful eyes, deceiving \nWe may die this evening \nCoughing, wheezing, bleeding \nHigh, I'm an anxious soul \nBlood moons are my eyes, stay low \nRed and black, they glow \nUnder attack, in my soul \nWhen it's my time, I'll know \nNever seen a hell so cold \nYeah, we'll make it out, I know \nWe'll run right through the flames, let's go\n" + "<br />";
        lyc.innerHTML += "<br />" + "\nAll white Gucci suit, I'm feeling righteous, yeah \nI know that the truth is hard to digest, yeah \nFive or six pills in my right hand, yeah \nCodeine runneth over on my nightstand \nTaking medicine to fix all of the damage \nMy anxiety the size of a planet (yeah), oh \nHoles in my skull, over time \nMy heart's over ice (whoa), uh\n" + "<br />";
        lyc.innerHTML += "<br />" + "\nI'm in too deep \nCan't swim like me \nWe're drowning, so I will see \nMy demons ten feet under me \nInhale, exhale, but I can't breathe \nToo busy drinking codeine doing high speeds \nCrash, pour a four, sip it slow, make the time pass \nTake a pill for the thrill, have a relapse \nDevil in my head tryna run gym laps \nI ain't tryna race, he don't even know me like that\n" + "<br />";
        lyc.innerHTML += "<br />" + "\n\nAll white Gucci suit, I'm feeling righteous\nI know that the truth is hard to digest\nFive or six pills in my right hand\nCodeine runneth over on my nightstand \nTaking medicine to fix all of the damage\nMy anxiety the size of a planet (yeah), oh \nHoles in my skull, over time \nMy heart's over ice (whoa) \nI will sing\n" + "<br />";
        lyc.innerHTML += "<br />" + "<span style='text-align: right; color: beige; font-family: courgette;'>Source: " + "<a href='https://lyrics.lyricfind.com/'>LyricFind</a>" + "<br />" + "Songwriters: Jarad Higgins / Nicholas Mira / Ryan Vojtesak \nRighteous lyrics © BMG Rights Management, Kobalt Music Publishing Ltd., Sony/ATV Music Publishing LLC, Universal Music Publishing Group</span>\n" + "<br />";
        return false;
}

// Assigning variables to all the elements in the HTML file as declared in the css//

let now_playing = document.querySelector(".now-playing");
let track_art = document.querySelector(".track-art");
let track_name = document.querySelector(".track-name");
let track_artist = document.querySelector(".track-artist");
 
let playpause_btn = document.querySelector(".playpause-track");
let next_btn = document.querySelector(".next-track");
let prev_btn = document.querySelector(".prev-track");
let buttonplay = document.querySelector(".button");
 
let seek_slider = document.querySelector(".seek_slider");
let volume_slider = document.querySelector(".volume_slider");
let play_time = document.querySelector(".current-time");
let total_duration = document.querySelector(".total-duration");
 
// Creating globally used values
let track_index = 0;
let isPlaying = false;
let updateTimer;
 
// Create the audio element for the player
let play_track = document.createElement('audio');
 
// Define the list of tracks that will be played
// You can add or remove

let track_list = [
  {
    name: "Righteous",
    artist: "Juice Wrld",
    image: "Image URL",
    path: "mikaelkraft.github.io/dwc/music/righteous.mp3"
  },
  
];

function loadTrack(track_index) {
  // Clear the previous seek timer
  clearInterval(updateTimer);
  resetValues();
 
  // Load a new track
  play_track.src = track_list[track_index].path;
  play_track.load();
 
  // Update details of the track
  track_art.style.backgroundImage =
     "url(" + track_list[track_index].image + ")";
  track_name.textContent = track_list[track_index].name;
  track_artist.textContent = track_list[track_index].artist;
  now_playing.textContent =
     "TRACK " + (track_index + 1) + " OF " + track_list.length + " - ";
  now_playing.innerHTML += ' <span style="color: orange; text-shadow: 2px 2px 4px black; font-family: Courgette"> LEGENDS NEVER DIE</span>' + ' <em>album</em>'
  
  // Set an interval of 1000 milliseconds
  // for updating the seek slider

  updateTimer = setInterval(seekUpdate, 1000);
 
  // Move to the next track if the current finishes playing
  // using the 'ended' event
  play_track.addEventListener("ended", nextTrack);
 
  // Apply a random background color
 // random_bg_color();
}
 
//function random_bg_color() {
  // Get a random number between 64 to 256
  // (for getting lighter colors)
 // let red = Math.floor(Math.random() * 256) + 64;
 // let green = Math.floor(Math.random() * 256) + 64;
 // let blue = Math.floor(Math.random() * 256) + 64;
 
  // Construct a color with the given values
  //let bgColor = "rgb(" + red + ", " + green + ", " + blue + ")";
 
  // Set the background to the new color
  //document.body.style.background = bgColor;
//}
 //
// Function to reset all values to their default
function resetValues() {
  play_time.textContent = "00:00";
  total_duration.textContent = "00:00";
  seek_slider.value = 0;
}

function playpauseTrack() {
  // Switch between playing and pausing
  // depending on the current state
  if (!isPlaying) playTrack();
  else pauseTrack();
      
}
 
function reEnable() { // function to allow the music play when the Big button is clicked
  //play the loaded tracks after confirmation 
      play_track.play()
      isPlaying = true; //play button is enabled
      //playpause_btn.disabled = false;
      playpause_btn.innerHTML = '<i class="fa fa-pause-circle fa-3x"></i>';
}
 
function playTrack() { // checks first to see the state of the Big Button
  if (document.querySelector(".button").click = "false") {
      //play_track.play();
      isPlaying = false; //Play button remains disabled
      //playpause_btn.disabled = true;
      swal("Juice It!", "'CLICK FOR JUICE WRLD' Call to Action Button above first before the Music plays", "info");
  } else {
  // Play the loaded track according to the condition below
 
  //calculates button state and triggers, reenabling the play button
  buttonplay.addEventListener("click", reEnable);
  
  }
  
  //While playing, icon to show in indication of playing
  playpause_btn.innerHTML = '<i class="fa fa-play-circle fa-3x"></i>';
}
 
function pauseTrack() {
  // Pause the current track
  play_track.pause();
  isPlaying = false;
 
  //While paused, play icon replaces pause icon
  playpause_btn.innerHTML = '<i class="fa fa-play-circle fa-3x"></i>';
}
 
function nextTrack() {
  // Go back to the first track if the
  // current one is the last in the track list
  if (track_index < track_list.length - 1)
    track_index += 1;
  else track_index = 0;
 
  // Load and play the new track
  loadTrack(track_index);
  playTrack();
}
 
function prevTrack() {
  // Go back to the last track if the
  // current one is the first in the track list
  if (track_index > 0)
    track_index -= 1;
  else track_index = track_list.length - 1;
   
  // Load and play the new track
  loadTrack(track_index);
  playTrack();
}

function seekTo() {
  // Calculate the seek position by the
  // percentage of the seek slider
  // and get the relative duration to the track
  seekto = play_track.duration * (seek_slider.value / 100);
 
  // Set the current track position to the calculated seek position
  play_track.currentTime = seekto;
}
 
function setVolume() {
  // Set the volume according to the
  // percentage of the volume slider set
  play_track.volume = volume_slider.value / 100;
}
 
function seekUpdate() {
  let seekPosition = 0;
 
  // Check if the current track duration is a legible number
  if (!isNaN(play_track.duration)) {
    seekPosition = play_track.currentTime * (100 / play_track.duration);
    seek_slider.value = seekPosition;
 
    // Calculate the time left and the total duration
    let currentMinutes = Math.floor(play_track.currentTime / 60);
    let currentSeconds = Math.floor(play_track.currentTime - currentMinutes * 60);
    let durationMinutes = Math.floor(play_track.duration / 60);
    let durationSeconds = Math.floor(play_track.duration - durationMinutes * 60);
 
    // Add a zero to the single digit time values
    if (currentSeconds < 10) { currentSeconds = "0" + currentSeconds; }
    if (durationSeconds < 10) { durationSeconds = "0" + durationSeconds; }
    if (currentMinutes < 10) { currentMinutes = "0" + currentMinutes; }
    if (durationMinutes < 10) { durationMinutes = "0" + durationMinutes; }
 
    // Display the updated duration
    play_time.textContent = currentMinutes + ":" + currentSeconds;
    total_duration.textContent = durationMinutes + ":" + durationSeconds;
  }
}

// Load the first track in the tracklist
loadTrack(track_index);


//sticky Navigational menu
//window.onscroll = function() {myStickynav()};

//var navbar = document.getElementById("topnav");
//var sticky = navbar.offsetTop;

//function myStickynav() {
//  if (window.pageYOffset >= sticky) {
//    navbar.classList.add("sticky")
 // } else {
//    navbar.classList.remove("sticky");
 // }
//}
