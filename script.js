document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('calendarGrid');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const calendarMonthTitleElement = document.getElementById('calendarMonthTitle');
    const calendarUserTitleElement = document.getElementById('calendarUserTitle');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const clearAllRecordsBtn = document.getElementById('clearAllRecordsBtn');
    const themeColorLabel = document.getElementById('themeColorLabel');
    const themeColorPaletteWrapper = document.getElementById('themeColorPaletteWrapper');
    const themeColorPalette = document.getElementById('themeColorPalette');
    const currentColorPreview = document.getElementById('currentColorPreview');

    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();

    const pastelColors = [
        '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff',
        '#e0b4ff', '#fdeff2', '#d4eefd', '#c8e0b4', '#e4dcf1'
    ];

    let records = JSON.parse(localStorage.getItem('calendarRecords')) || {};
    
    // ユーザー設定タイトルの読み込み（旧キーからの移行処理も含む）
    let userTitle = localStorage.getItem('calendarUserTitle') || localStorage.getItem('calendarTitle') || "マイカレンダー";
    calendarUserTitleElement.textContent = userTitle;
    if (localStorage.getItem('calendarTitle')) {
        localStorage.setItem('calendarUserTitle', userTitle);
        localStorage.removeItem('calendarTitle');
    }

    // テーマカラーの読み込みと適用
    const savedColor = localStorage.getItem('calendarThemeColor') || pastelColors[4]; // デフォルトはベビーブルー
    document.documentElement.style.setProperty('--theme-color', savedColor);
    currentColorPreview.style.backgroundColor = savedColor;

    // カラーパレットの生成とイベント設定
    pastelColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        if (color === savedColor) {
            swatch.classList.add('active');
        }
        swatch.addEventListener('click', () => {
            // 現在のactiveクラスを削除
            themeColorPalette.querySelector('.active')?.classList.remove('active');
            // クリックされた要素にactiveクラスを追加
            swatch.classList.add('active');
            // 色を適用・保存
            const selectedColor = swatch.dataset.color;
            document.documentElement.style.setProperty('--theme-color', selectedColor);
            localStorage.setItem('calendarThemeColor', selectedColor);
            currentColorPreview.style.backgroundColor = selectedColor;
            // パレットを閉じる
            themeColorPaletteWrapper.classList.remove('show');
        });
        themeColorPalette.appendChild(swatch);
    });

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        calendarMonthTitleElement.textContent = `${currentYear}年 ${currentMonth + 1}月`;
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const firstDayIndex = firstDay.getDay();
        const totalDays = lastDay.getDate();
        
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day', 'empty');
            calendarGrid.appendChild(emptyCell);
        }

        for (let i = 1; i <= totalDays; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');
            dayCell.textContent = i;
            dayCell.dataset.date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            if (i === currentDate.getDate() && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear()) {
                dayCell.classList.add('today');
            }

            if (records[dayCell.dataset.date]) {
                const recordData = records[dayCell.dataset.date];
                // 古いデータ形式（true）との互換性を保ちつつ、スタンプの種類を判別
                const recordType = (typeof recordData === 'object' && recordData.type) ? recordData.type : 'goodjob';
                const img = document.createElement('img');
                img.src = `png/${recordType}.png`;
                img.alt = '記録あり';
                img.classList.add('record-mark');
                dayCell.appendChild(img);
            }

            dayCell.addEventListener('click', () => {
                toggleRecord(dayCell.dataset.date, dayCell);
            });
            
            calendarGrid.appendChild(dayCell);
        }
    }

    function toggleRecord(date, cell) {
        if (records[date]) {
            delete records[date];
            const mark = cell.querySelector('.record-mark');
            if (mark) {
                mark.remove();
            }
        } else {
            const newTotalRecords = Object.keys(records).length + 1;
            let recordType = 'goodjob';

            // 10個単位でスタンプを切り替える
            if (newTotalRecords > 0 && newTotalRecords % 10 === 0) {
                const milestone = newTotalRecords / 10;
                // 10, 30, 50... -> great | 20, 40, 60... -> god
                recordType = (milestone % 2 === 1) ? 'great' : 'god';
            }

            records[date] = { type: recordType }; // スタンプの種類を保存

            const img = document.createElement('img');
            img.src = `png/${recordType}.png`;
            img.alt = '記録あり';
            img.classList.add('record-mark');
            cell.appendChild(img);
        }
        
        localStorage.setItem('calendarRecords', JSON.stringify(records));
    }
    
    function exportCsv() {
        const sortedDates = Object.keys(records).sort();
        if (sortedDates.length === 0) {
            alert('出力する記録がありません。');
            return;
        }

        // CSVのヘッダーと内容を作成
        const csvContent = "日付\n" + sortedDates.join("\n");

        // Excelでの文字化け防止のためBOMを付与
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

        // ユーザーが設定したタイトルをファイル名に使用（なければデフォルト名）
        const userTitle = localStorage.getItem('calendarUserTitle') || 'カレンダー';
        const fileName = `${userTitle}_記録一覧.csv`;

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    function clearAllRecords() {
        if (Object.keys(records).length === 0) {
            alert('削除する記録はありません。');
            return;
        }

        const confirmation = confirm("すべての記録を削除してもよろしいですか？この操作は元に戻せません。");
        if (confirmation) {
            records = {}; // 記録オブジェクトを空にする
            localStorage.removeItem('calendarRecords'); // ローカルストレージからも削除
            renderCalendar(); // カレンダーを再描画して「〇」を消す
            alert("すべての記録が削除されました。");
        }
    }

    calendarUserTitleElement.addEventListener('blur', (event) => {
        localStorage.setItem('calendarUserTitle', event.target.textContent);
    });

    // カラーパレットの表示/非表示トグル
    themeColorLabel.addEventListener('click', (event) => {
        event.stopPropagation(); // ドキュメントへのクリックイベント伝播を停止
        themeColorPaletteWrapper.classList.toggle('show');
    });

    currentColorPreview.addEventListener('click', (event) => {
        event.stopPropagation(); // ドキュメントへのクリックイベント伝播を停止
        themeColorPaletteWrapper.classList.toggle('show');
    });

    // パレットの外側をクリックしたら閉じる
    document.addEventListener('click', () => {
        if (themeColorPaletteWrapper.classList.contains('show')) {
            themeColorPaletteWrapper.classList.remove('show');
        }
    });

    prevBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });
    
    exportCsvBtn.addEventListener('click', exportCsv);
    clearAllRecordsBtn.addEventListener('click', clearAllRecords);

    renderCalendar();
});