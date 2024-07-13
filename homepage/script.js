let isMusicPlaying = false;
const music = document.getElementById('background-music');
const musicIcon = document.getElementById('music-icon');

// Play music automatically on page load
window.addEventListener('load', function() {
    music.play().then(() => {
        isMusicPlaying = true;
    }).catch((error) => {
        console.log('Autoplay failed:', error);
    });
});

document.getElementById('music-toggle').onclick = function() {
    if (isMusicPlaying) {
        music.pause();
        musicIcon.textContent = 'volume_off'; // Change icon to mute
    } else {
        music.play();
        musicIcon.textContent = 'volume_up'; // Change icon to unmute
    }
    isMusicPlaying = !isMusicPlaying;
};
