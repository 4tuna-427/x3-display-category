'use strict';

// クリックイベント時の処理
function onClicked() {
    // 楽曲データを取得する関数
    const fetchSongs = () => {
        const songs = [];
        const songListRecords = document.querySelectorAll('.tr-score');

        // 各楽曲レコードを処理
        for (const songListRecord of songListRecords) {
            let style, difficulty;
            const difficultyElem = songListRecord.querySelector('.td-level .sp-difficulty');

            // 難易度を取得
            for (const className of difficultyElem.classList) {
                if (className.startsWith('diff-color-')) {
                    difficulty = parseInt(className.split('-')[2], 10);
                    // SP: 0(習), 1(楽), 2(踊), 3(激), 4(鬼)
                    // DP:        5(楽), 6(踊), 7(激), 8(鬼)
                    // ※DPはbeginnerが存在しない
                    if (difficulty >= 5) {
                        style = 2; // DP
                        difficulty -= 4; // DPの難易度調整
                    } else {
                        style = 1; // SP
                    }
                }
            }

            const level = parseInt(songListRecord.querySelector('.td-level').innerText, 10);
            const title = songListRecord.querySelector('.td-title').innerText;

            // 楽曲情報を追加
            songs.push({
                style: Number(style),
                level: Number(level),
                difficulty: Number(difficulty),
                title: title,
            });
        }

        // タイトル順でグループ化し、レベルを昇順にソートする
        const sortedSongs = songs.reduce((acc, current) => {
            const group = acc.find(item => item.title === current.title);

            if (group) {
                group.items.push(current); // 同じタイトルのグループに追加
            } else {
                acc.push({ title: current.title, items: [current] }); // 新しいグループを作成
            }

            return acc;
        }, []);

        // 各グループのレベルを昇順にソートして新しい配列を作成
        return sortedSongs.flatMap(item => {
            return item.items.sort((a, b) => a.level - b.level);
        });
    }

    // Blobを使用してファイルをダウンロードする関数
    const download = (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'x3-songs.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // メモリを解放
    }

    // 楽曲データを取得
    const songs = fetchSongs();

    // JSON形式に変換
    const content = JSON.stringify(songs, null, 4);
    const blob = new Blob([content], { type: 'application/json' });

    // ダウンロード処理
    download(blob);
}
