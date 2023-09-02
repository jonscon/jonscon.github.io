# Songs with Friends
This is a communal Spotify listening room for all users to listen to the same music at the same time!

## Features: 
1. Database reset endpoint - should reset upon host exit.
2. Synchronized playback - once host seeks position, it changes guest position. 
3. Keep clients in sync when host skips a track.
4. Able to skip to different position in track.
5. Every user is able to remove songs.
6. Displays a warning if no active device is open for the user.
7. Progress bar display is at the current position of song.
8. Displays current song being played.
9. Volume buttons.

## Reflection
This project was the final project for my Web Development course at UC Davis. Although it was difficult, it was rewarding to complete at the end, as this was the first time I successfully implemented an API. Spotify's website provided clear, easy-to-follow instructions to follow for the implementation of their API. In addition, there were some potential bugs that we encountered during runtime: 
1. Playback might get choppy and jump locations when toggling volume with the volume button 
2. The database does not reset on host exit at times (not common) -> pls manually reset in users.db table Users if occur 

## Authors
Jonathan Cheng, Stephen Chung, Christopher Bried
