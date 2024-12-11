'use strict';

const categoryNames = ['CLASSIC', 'WHITE', 'GOLD'];

async function updateSongs(category, songs) {
    let currentSongs = [];
    let data = await chrome.storage.local.get('songs');
    if (Object.keys(data).length > 0) {
        currentSongs = data.songs;
    }
    const filteredSongs = currentSongs.filter(song => song.category !== category);
    const updatedSongs = filteredSongs.concat(songs);
    chrome.storage.local.set({ songs: updatedSongs }, () => {
        alert(`${categoryNames[category]}の楽曲を更新しました。`);
    });
}

const updateButtons = document.querySelectorAll('.update-button');
for (const updateButton of updateButtons) {
    const category = updateButton.dataset.category;
    const confirmMessage = `${categoryNames[category]}を更新します。よろしいですか？`;

    updateButton.addEventListener('click', async () => {
        if (confirm(confirmMessage)) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeSongs', category: category }, async (response) => {
                    if (response) {
                        const songs = response.songs;
                        await updateSongs(category, songs);
                    } else {
                        alert(`更新に失敗しました。`);
                    }
                });
            });
        }
    });
}

const copySongsJsonButton = document.querySelector('.clipboard-to-json');
copySongsJsonButton.addEventListener('click', async () => {
    let data = await chrome.storage.local.get('songs');
    if (Object.keys(data).length > 0) {
        const json = JSON.stringify(data.songs, null, 4);
        navigator.clipboard.writeText(json);
    }
});
