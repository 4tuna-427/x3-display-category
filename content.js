'use strict';

const zoom = 0.75; // ズーム倍率
const currentUrl = window.location.href; // 現在のURL

// メッセージリスナーの設定
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeSongs') {
        const songs = fetchSongs();
        sendResponse({ songs });
    }
});

// 楽曲データを取得する関数
function fetchSongs() {
    const songs = [];
    const songElems = document.querySelectorAll('.tr-score');

    for (const songElem of songElems) {
        const difficultyElem = songElem.querySelector('.td-level .sp-difficulty');

        const title = songElem.querySelector('.td-title').innerText.replace(/[\u200B\u200C\u200D]/g, '');
        const id = getStringUntilHyphen(songElem.id);
        const playStyle = getSongPlayStyle(difficultyElem);
        const difficulty = parseInt(songElem.querySelector('.td-level').innerText, 10);
        const chartType = getSongChartType(difficultyElem);

        songs.push({
            title: title,
            id: id,
            play_style: Number(playStyle),
            difficulty: Number(difficulty),
            chart_type: Number(chartType),
        });
    }

    // タイトル順でグループ化し、レベルを昇順にソートする
    return sortSongsByTitleAndLevel(songs);
}

function getStringUntilHyphen(str) {
    const hyphenIndex = str.indexOf('-');
    if (hyphenIndex === -1) {
        return str;
    }
    return str.substring(0, hyphenIndex);
}

// プレイスタイルを取得する関数
function getSongPlayStyle(difficultyElem) {
    for (const className of difficultyElem.classList) {
        if (className.startsWith('diff-color-')) {
            const difficulty = parseInt(className.split('-')[2], 10);
            return (difficulty >= 5) ? 2 : 1;
        }
    }
}

// 難易度タイプを取得する関数
function getSongChartType(difficultyElem) {
    for (const className of difficultyElem.classList) {
        if (className.startsWith('diff-color-')) {
            const difficulty = parseInt(className.split('-')[2], 10);
            return (difficulty >= 5) ? difficulty - 4 : difficulty;
        }
    }
}

// 楽曲をタイトル順にグループ化し、レベルを昇順にソートする関数
function sortSongsByTitleAndLevel(songs) {
    const sortedSongs = songs.reduce((acc, current) => {
        const group = acc.find(item => item.title === current.title);

        if (group) {
            group.items.push(current); // 同じタイトルのグループに追加
        } else {
            acc.push({ title: current.title, items: [current] }); // 新しいグループを作成
        }

        return acc;
    }, []);

    // 各グループのレベルを昇順にソート
    return sortedSongs.flatMap(item => item.items.sort((a, b) => a.level - b.level));
}

// ページのレイアウト調整
if (currentUrl.includes('/difficulty_list/')) {
    // ページのズームを更新
    document.body.style.zoom = zoom;
    const difficultyListContainer = document.querySelector('#difficulty-list-container');
    difficultyListContainer.style.height = '100%';

    // ブラウザリサイズ時、ズームを更新
    function adjustLayout() {
        const mainFlexbox = document.querySelector('#main-flexbox');
        mainFlexbox.style.height = (window.innerHeight / zoom) + 'px';
    }
    window.addEventListener('resize', adjustLayout);
    adjustLayout();

    // 表示するカテゴリを変更するUIを追加
    createCategoryCheckboxes();

    // ジャケット要素にカテゴリアイコンを追加
    (async () => {
        const difficulty = parseInt(document.getElementById('select-level').value, 10);
        const playStyle = parseInt(document.getElementById('select-spdp').value, 10);

        const songs = await fetchSongsFromStorage();
        const filteredSongs = songs.filter(song => song.difficulty === difficulty && song.play_style === playStyle + 1);

        updateJacketCategories(filteredSongs);
    })();
}

// カテゴリのチェックボックスを作成する関数
function createCategoryCheckboxes() {
    const checkboxGroupHtml = `
        <div class="checkbox-group">
            <label><input type="checkbox" name="category" value="1" checked>CLASSIC</label>
            <label><input type="checkbox" name="category" value="2" checked>WHITE</label>
            <label><input type="checkbox" name="category" value="3" checked>GOLD</label>
        </div>
    `;
    const checkboxGroup = (new DOMParser().parseFromString(checkboxGroupHtml, 'text/html')).body.firstElementChild;

    const categoryCheckboxes = checkboxGroup.querySelectorAll('[name="category"]');
    for (const categoryCheckbox of categoryCheckboxes) {
        categoryCheckbox.addEventListener('change', (e) => {
            const category = categoryCheckbox.value;
            const jackets = document.querySelectorAll(`.category-${category}`);
            for (const jacket of jackets) {
                jacket.style.display = e.target.checked ? '' : 'none';
            }
        });
    }

    const listHeader = document.querySelector('#difficulty-list-header');
    listHeader.appendChild(checkboxGroup);
}

// ストレージから楽曲データを取得する関数
async function fetchSongsFromStorage() {
    const data = await chrome.storage.local.get('songs');
    return data.songs || []; // データが存在しない場合は空の配列を返す
}

// ジャケットにカテゴリを設定する関数
function updateJacketCategories(songs) {
    const jackets = document.querySelectorAll('.div-jacket');
    for (const jacket of jackets) {
        const img = jacket.querySelector('img');
        const title = img.getAttribute('title').trim();

        const findSong = songs.find(song => song.title === title);
        if (findSong) {
            jacket.classList.add(`category-${findSong.category}`);
        } else {
            console.log(`no song: ${title}`);
        }
    }
}
