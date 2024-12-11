const zoom = 0.75;
const currentUrl = window.location.href;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeSongs') {
        let songs = [];

        const songElems = document.querySelectorAll('.tr-score');
        for (const songElem of songElems) {
            let style, difficulty;
            const difficultyElem = songElem.querySelector('.td-level .sp-difficulty');
            for (const className of difficultyElem.classList) {
                if (className.startsWith('diff-color-')) {
                    difficulty = className.split('-')[2];
                    // difficulty が5以上ならDP
                    // SP: 0(習), 1(楽), 2(踊), 3(激), 4(鬼)
                    // DP:        5(楽), 6(踊), 7(激), 8(鬼) ※DPにはbeginnerがないため、1つずれる
                    if (difficulty >= 5) {
                        style = 1;
                        difficulty = difficulty - 4;
                    } else {
                        style = 0;
                    }
                }
            }

            const level = songElem.querySelector('.td-level').innerText;
            let title = songElem.querySelector('.td-title').innerText;
            title = title.replace(/[\u200B\u200C\u200D]/g, '');

            songs.push({
                style: Number(style),
                level: Number(level),
                difficulty: Number(difficulty),
                category: request.category,
                title: title,
            });
        }

        // レベルの逆順を修正するため、配列を再生成
        // タイトル順でグループ化し、レベルを昇順にソートする
        const sortedSongs = songs.reduce((acc, current) => {
            // 既に存在するタイトルの配列を取得
            const group = acc.find(item => item.title === current.title);

            if (group) {
                // 同じタイトルのグループにプロパティを追加
                group.items.push(current);
            } else {
                // 新しいタイトルのグループを作成
                acc.push({ title: current.title, items: [current] });
            }

            return acc;
        }, []);

        // 各グループのレベルを昇順にソートした新しい配列を作成
        songs = sortedSongs.flatMap(item => {
            return item.items.sort((a, b) => a.level - b.level);
        });

        sendResponse({ songs });
    }
});

// 難易度表ページの場合に実行する
if (currentUrl.includes('/difficulty_list/')) {
    //
    document.body.style.zoom = zoom;

    const difficultyListContainer = document.querySelector('#difficulty-list-container');
    difficultyListContainer.style.height = '100%';

    function adjustLayout() {
        const mainFlexbox = document.querySelector('#main-flexbox');
        mainFlexbox.style.height = (window.innerHeight / zoom) + 'px';
    }

    window.addEventListener('resize', adjustLayout);
    adjustLayout();

    //
    const checkboxGroupHtml = `
        <div class="checkbox-group">
            <label><input type="checkbox" name="category" value="0" checked>CLASSIC</label>
            <label><input type="checkbox" name="category" value="1" checked>WHITE</label>
            <label><input type="checkbox" name="category" value="2" checked>GOLD</label>
        </div>
    `;
    const checkboxGroup = (new DOMParser().parseFromString(checkboxGroupHtml, 'text/html')).body.firstElementChild;

    const categoryCheckboxes = checkboxGroup.querySelectorAll('[name="category"]');
    for (const categoryCheckbox of categoryCheckboxes) {
        categoryCheckbox.addEventListener('change', (e) => {
            const category = categoryCheckbox.value;
            const jackets = document.querySelectorAll(`.category-${category}`);
            if (e.target.checked) {
                for (const jacket of jackets) {
                    jacket.style.display = '';
                }
            } else {
                for (const jacket of jackets) {
                    jacket.style.display = 'none';
                }
            }
        });
    }

    const listHeader = document.querySelector('#difficulty-list-header');
    listHeader.appendChild(checkboxGroup);

    //
    ; (async () => {
        // 楽曲データを取得
        let songs = [];
        const data = await chrome.storage.local.get('songs');
        if (Object.keys(data).length > 0) {
            songs = data.songs;
        }

        const jackets = document.querySelectorAll('.div-jacket');
        for (const jacket of jackets) {
            // ジャケット要素からパラメータを取得
            const img = jacket.querySelector('img');
            const title = img.getAttribute('title').trim();

            // 全楽曲配列から、一致する楽曲のデータを取得
            const findSong = songs.find(song => song.title === title);
            if (findSong) {
                jacket.classList.add(`category-${findSong.category}`);
            } else {
                console.log(`no song: ${title}`);
            }
        }
    })();
}
