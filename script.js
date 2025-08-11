document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('calendarGrid');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const calendarTabs = document.getElementById('calendarTabs');
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
 
    let allCalendarsData = [];
    let activeCalendarIndex = 0;
 
    const themeColors = [
        '#f06292', // ピンク
        '#ffab91', // ピーチ
        '#81c784', // グリーン
        '#64b5f6', // ブルー
        '#4fc3f7', // スカイブルー
        '#4db6ac', // ターコイズ
        '#ba68c8', // パープル
        '#aed581', // ライムグリーン
        '#ffd54f', // アンバー
        '#7986cb'  // インディゴ
    ];
 
    // カラーパレットの生成とイベント設定
    themeColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        swatch.addEventListener('click', () => {
            const selectedColor = swatch.dataset.color;
            allCalendarsData[activeCalendarIndex].themeColor = selectedColor;
            saveData();
 
            // UIを即時更新
            document.documentElement.style.setProperty('--theme-color', selectedColor);
            currentColorPreview.style.backgroundColor = selectedColor;
            updateColorPaletteActiveState();
            createTabs(); // アクティブタブの色を更新
 
            // パレットを閉じる
            themeColorPaletteWrapper.classList.remove('show');
        });
        themeColorPalette.appendChild(swatch);
    });
 
    function loadAndInitialize() {
        const savedData = localStorage.getItem('allCalendarsData');
        const savedIndex = localStorage.getItem('activeCalendarIndex');
 
        if (savedData) {
            // 新しいデータ形式があれば読み込む
            allCalendarsData = JSON.parse(savedData);
            activeCalendarIndex = savedIndex ? parseInt(savedIndex, 10) : 0;
        } else {
            // 古いデータ形式からの移行処理
            const oldRecords = localStorage.getItem('calendarRecords');
            const oldTitle = localStorage.getItem('calendarUserTitle') || localStorage.getItem('calendarTitle');
            const oldColor = localStorage.getItem('calendarThemeColor');
 
            if (oldRecords || oldTitle || oldColor) {
                // 既存のデータを1番目のカレンダーとして設定
                const migratedCalendar = {
                    title: oldTitle || "カレンダー1",
                    records: oldRecords ? JSON.parse(oldRecords) : {},
                    themeColor: oldColor || themeColors[4] // デフォルトカラーを新しいリストから選択
                };
                allCalendarsData.push(migratedCalendar);
 
                // 古いキーを削除
                localStorage.removeItem('calendarRecords');
                localStorage.removeItem('calendarUserTitle');
                localStorage.removeItem('calendarTitle');
                localStorage.removeItem('calendarThemeColor');
            }
 
            // カレンダーが3つになるまでデフォルト設定で追加
            while (allCalendarsData.length < 3) {
                const newIndex = allCalendarsData.length;
                allCalendarsData.push({
                    title: `カレンダー${newIndex + 1}`,
                    records: {},
                    themeColor: themeColors[(4 + newIndex) % themeColors.length]
                });
            }
            saveData();
        }
 
        createTabs();
        switchCalendar(activeCalendarIndex);
    }
 
    function saveData() {
        localStorage.setItem('allCalendarsData', JSON.stringify(allCalendarsData));
        localStorage.setItem('activeCalendarIndex', activeCalendarIndex);
    }
 
    function createTabs() {
        calendarTabs.innerHTML = '';
        allCalendarsData.forEach((calendar, index) => {
            const tab = document.createElement('button');
            tab.classList.add('tab-btn');
            tab.textContent = calendar.title;
            tab.dataset.index = index;
            if (index === activeCalendarIndex) {
                tab.classList.add('active');
            }
            tab.addEventListener('click', () => switchCalendar(index));
            calendarTabs.appendChild(tab);
        });
    }
 
    function switchCalendar(index) {
        activeCalendarIndex = index;
        updateUIForActiveCalendar();
        renderCalendar();
        createTabs(); // タブのアクティブ状態を更新
        saveData();
    }
 
    function updateUIForActiveCalendar() {
        const currentData = allCalendarsData[activeCalendarIndex];
        calendarUserTitleElement.textContent = currentData.title;
        document.documentElement.style.setProperty('--theme-color', currentData.themeColor);
        currentColorPreview.style.backgroundColor = currentData.themeColor;
        updateColorPaletteActiveState();
    }
 
    function updateColorPaletteActiveState() {
        const currentThemeColor = allCalendarsData[activeCalendarIndex].themeColor;
        themeColorPalette.querySelector('.active')?.classList.remove('active');
        const newActiveSwatch = themeColorPalette.querySelector(`.color-swatch[data-color="${currentThemeColor}"]`);
        if (newActiveSwatch) {
            newActiveSwatch.classList.add('active');
        }
    }
 
    function renderCalendar() {
        const currentRecords = allCalendarsData[activeCalendarIndex].records;
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
 
            if (currentRecords[dayCell.dataset.date]) {
                const recordData = currentRecords[dayCell.dataset.date];
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
        const currentRecords = allCalendarsData[activeCalendarIndex].records;
        if (currentRecords[date]) {
            delete currentRecords[date];
            const mark = cell.querySelector('.record-mark');
            if (mark) {
                mark.remove();
            }
        } else {
            const newTotalRecords = Object.keys(currentRecords).length + 1;
            let recordType = 'goodjob';
 
            // 10個単位でスタンプを切り替える
            if (newTotalRecords > 0 && newTotalRecords % 10 === 0) {
                const milestone = newTotalRecords / 10;
                // 10, 30, 50... -> great | 20, 40, 60... -> god
                recordType = (milestone % 2 === 1) ? 'great' : 'god';
            }
 
            currentRecords[date] = { type: recordType }; // スタンプの種類を保存
 
            const img = document.createElement('img');
            img.src = `png/${recordType}.png`;
            img.alt = '記録あり';
            img.classList.add('record-mark');
            cell.appendChild(img);
        }
 
        saveData();
    }
 
    function exportCsv() {
        const currentData = allCalendarsData[activeCalendarIndex];
        const sortedDates = Object.keys(currentData.records).sort();
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
        const fileName = `${currentData.title}_記録一覧.csv`;
 
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
 
    function clearAllRecords() {
        const currentRecords = allCalendarsData[activeCalendarIndex].records;
        if (Object.keys(currentRecords).length === 0) {
            alert('削除する記録はありません。');
            return;
        }
 
        const confirmation = confirm("本当にすべての記録をリセットしますか？この操作は取り消せません。");
        if (confirmation) {
            allCalendarsData[activeCalendarIndex].records = {}; // 記録オブジェクトを空にする
            saveData();
            renderCalendar(); // カレンダーを再描画して「〇」を消す
            alert("すべての記録をリセットしました。");
        }
    }
 
    calendarUserTitleElement.addEventListener('blur', (event) => {
        const newTitle = event.target.textContent.trim();
        if (newTitle) {
            allCalendarsData[activeCalendarIndex].title = newTitle;
            saveData();
            createTabs(); // タブのテキストも更新
        } else {
            // 空の場合は元のタイトルに戻す
            event.target.textContent = allCalendarsData[activeCalendarIndex].title;
        }
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
 
    // --- ハンバーガーメニューの処理 ---
    const hamburgerIcon = document.getElementById('hamburgerIcon');
    const sideNav = document.getElementById('sideNav');
    const overlay = document.getElementById('overlay');
 
    function toggleMenu() {
        hamburgerIcon.classList.toggle('active');
        sideNav.classList.toggle('open');
        overlay.classList.toggle('show');
    }
 
    // ハンバーガーアイコンとオーバーレイをクリックしたときにメニューを開閉
    hamburgerIcon.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
 
    loadAndInitialize();
});