'use strict';

// chrome.action.onClicked.addListener((tab) => {
//     chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         function: onClicked
//     });
// });

function onClicked() {
    const fetchSongs = () => {
        let songs = [];
        const songListRecords = document.querySelectorAll('.tr-score');

        for (const songListRecord of songListRecords) {
            let style, difficulty;
            const difficultyElem = songListRecord.querySelector('.td-level .sp-difficulty');
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

            const level = songListRecord.querySelector('.td-level').innerText;
            const title = songListRecord.querySelector('.td-title').innerText;

            songs.push({
                style: Number(style),
                level: Number(level),
                difficulty: Number(difficulty),
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

        return songs;
    }

    const download = (blob) => {
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'x3-songs.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    const songs = fetchSongs();

    const content = JSON.stringify(songs, null, 4);
    const blob = new Blob([content], { type: 'application/json' });

    download(blob);
}
