'use strict';

const categoryNames = [null, 'CLASSIC', 'WHITE', 'GOLD'];
const updateButtons = document.querySelectorAll('.update-button');
const copySongsJsonButton = document.querySelector('.clipboard-to-json');
const clearSongsButton = document.querySelector('.clear-songs');

// 楽曲データを更新する関数
async function updateSongs(songs, playStyle, category) {
    try {
        // songsにパラメータを追加
        const newSongs = songs.map(song => ({
            ...song,
            category: category,
        }));

        // 現在の楽曲データを取得
        const storedSongs = await chrome.storage.local.get('songs');
        let currentSongs = storedSongs.songs || []; // 未定義の場合は空の配列を使用

        // 指定したカテゴリに該当する楽曲を除外
        const filteredStoredSongs = currentSongs.filter(song => {
            return !(song.playStyle === playStyle && song.category === category);
        });

        // 新しい楽曲を追加
        const updatedSongs = [...filteredStoredSongs, ...newSongs];

        // 更新された楽曲データを保存
        await chrome.storage.local.set({ songs: updatedSongs });

        // 更新完了メッセージを表示
        alert(`${categoryNames[category]}の楽曲を更新しました。`);
    } catch (error) {
        alert('楽曲の更新に失敗しました。');
    }
}

// 楽曲データの取得を行う関数
async function fetchSongsFromActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(activeTab.id, {
            action: 'scrapeSongs',
        }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

// 更新ボタンに対するクリックイベントリスナーを設定
for (const updateButton of updateButtons) {
    const playStyle = parseInt(updateButton.dataset['play-style'], 10);
    const category = parseInt(updateButton.dataset.category, 10);
    const confirmMessage = `${categoryNames[category]}を更新します。よろしいですか？`;

    // 更新ボタンのクリック時処理
    updateButton.addEventListener('click', async () => {
        if (confirm(confirmMessage)) {
            try {
                const response = await fetchSongsFromActiveTab();

                // レスポンスが存在する場合、楽曲データを更新
                if (response && response.songs) {
                    await updateSongs(response.songs, playStyle, category);
                } else {
                    alert('更新に失敗しました。');
                }
            } catch (error) {
                alert('楽曲の更新中にエラーが発生しました。');
            }
        }
    });
}

// 楽曲データをJSON形式でクリップボードにコピーするボタンのクリックイベントリスナー
copySongsJsonButton.addEventListener('click', async () => {
    try {
        const data = await chrome.storage.local.get('songs');

        // データが存在するか確認
        if (data.songs && data.songs.length > 0) {
            const json = JSON.stringify(data.songs, null, 4);
            await navigator.clipboard.writeText(json);
            alert('楽曲データをクリップボードにコピーしました。');
        } else {
            alert('コピーする楽曲データが存在しません。');
        }
    } catch (error) {
        alert('クリップボードへのコピーに失敗しました。');
    }
});

// 楽曲データをクリアするボタンのクリックイベントリスナー
clearSongsButton.addEventListener('click', async () => {
    chrome.storage.local.remove('songs', () => {
        if (chrome.runtime.lastError) {
            console.error("エラー:", chrome.runtime.lastError);
            alert('楽曲データの削除に失敗しました。');
        } else {
            alert('楽曲データが削除されました。');
        }
    });
});
