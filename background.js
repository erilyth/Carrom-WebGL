
function playBackgroundMusic(){
	var backgroundSound = new Audio('sounds/background.mp3');
	backgroundSound.volume = 0.6;
	backgroundSound.play();
}
playBackgroundMusic();
setInterval(playBackgroundMusic, 94000);