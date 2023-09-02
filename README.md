# Songs with Friends - Stephen Chung, Christopher Bried, Jonathan Cheng
( ᵔ ᴥ ᵔ )

## Reflection
For this project, we ran into some minor details.

## Features: 
1. Database reset endpoint - should reset upon host exit.
2. Synchronized playback - once host seeks position, it changes guest position. 
3. Keep clients in sync when host skips a track.
4. Able to skip to different position in track.
5. Every user is able to remove songs.
6. Displays a warning if no active device is open for the user.
7. Progress bar display is at current position of song.
8. Displays current song being played.
9. Volume buttons.



## Potenial bugs in runtime
1. Playback might get choppy and jump locations when toggling vloume with the volume button 
2. database does not reset on host exit at times (not common) -> pls manually reset in users.db table Users if occur 
3. Encountered on June 7, receive warning for too many request and kicked out of app