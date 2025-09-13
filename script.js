document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素 ---
    const calendarGrid = document.getElementById('calendarGrid');
    const prevBtn = document.getElementById('prevBtn');
    const calendarView = document.getElementById('calendar-view');
    const memoListView = document.getElementById('memo-list-view');
    const nextBtn = document.getElementById('nextBtn');
    const tabsContainer = document.getElementById('tabsContainer');
    const calendarTabs = document.getElementById('calendarTabs');
    const calendarMonthTitleElement = document.getElementById('calendarMonthTitle');
    const calendarUserTitleElement = document.getElementById('calendarUserTitle');
    const hamburgerIcon = document.getElementById('hamburgerIcon');
    const sideNav = document.getElementById('sideNav');
    const sideNavMenu = document.getElementById('sideNavMenu');
    const overlay = document.getElementById('overlay');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const clearAllRecordsBtn = document.getElementById('clearAllRecordsBtn');
    const themeColorLabel = document.getElementById('themeColorLabel');
    const themeColorPaletteWrapper = document.getElementById('themeColorPaletteWrapper');
    const themeColorPalette = document.getElementById('themeColorPalette');
    const currentColorPreview = document.getElementById('currentColorPreview');
    const memoSearchInput = document.getElementById('memoSearchInput');
    const exportAllCsvBtn = document.getElementById('exportAllCsvBtn');
    const memoListItemsContainer = document.getElementById('memoListItemsContainer');
    const dayMemoListModal = document.getElementById('dayMemoListModal');
    const dayListModalDate = document.getElementById('dayListModalDate');
    const dayMemoListContainer = document.getElementById('dayMemoListContainer');
    const addNewMemoBtn = document.getElementById('addNewMemoBtn');
    const closeDayListModalBtn = document.getElementById('closeDayListModalBtn');
    const memoModal = document.getElementById('memoModal');
    const modalDateElement = document.getElementById('modalDate');
    const memoTextarea = document.getElementById('memoTextarea');
    const saveMemoBtn = document.getElementById('saveMemoBtn');
    const deleteMemoBtn = document.getElementById('deleteMemoBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const currentStampPreview = document.getElementById('currentStampPreview');
    const stampPalette = document.getElementById('stampPalette');

    // --- 状態管理 ---
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    let currentEditingDate = null; // 現在操作中の日付
    let currentEditingMemoId = null; // 現在編集中のメモのID
 
    let allCalendarsData = [];
    let activeCalendarIndex = null; // 初期状態ではどのカレンダーも選択されていない
    let activeView = 'calendar'; // 'calendar' or 'memo-list'

    const stampTypes = ['none', 'goodjob', 'great', 'god'];
    let selectedStamp = 'none'; // モーダル内で選択中のスタンプ
 
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
        '#7986cb',  // インディゴ
        '#e57373', // ライトレッド
        '#ffb74d', // ライトオレンジ
        '#4dd0e1', // シアン
        '#90a4ae',  // ブルーグレー
        '#7e57c2', // ディープパープル
        '#00897b', // ダークティール
        '#d32f2f', // ダークレッド
        '#6d4c41', // ブラウン
        '#546e7a'  // ダークグレー
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
            createTabs(); // アクティブタブの色も更新
 
            // パレットを閉じる
            themeColorPaletteWrapper.classList.remove('show');
        });
        themeColorPalette.appendChild(swatch);
    });
 
    // スタンプパレットの生成
    stampPalette.innerHTML = ''; // 念のためクリア
    stampTypes.forEach(type => {
        const item = document.createElement('div');
        item.classList.add('stamp-palette-item');
        item.dataset.stamp = type;

        if (type === 'none') {
            item.textContent = 'なし';
            item.classList.add('stamp-none-btn');
        } else {
            const img = document.createElement('img');
            img.src = `png/${type}.png`;
            img.alt = type;
            item.appendChild(img);
        }

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedStamp = type;
            updateStampPreview();
            updateStampPaletteActiveState();
            stampPalette.classList.remove('show');
        });
        stampPalette.appendChild(item);
    });

    function updateStampPreview() {
        currentStampPreview.innerHTML = ''; // 中身をクリア
        if (selectedStamp === 'none' || !selectedStamp) {
            currentStampPreview.textContent = 'なし';
        } else {
            const img = document.createElement('img');
            img.src = `png/${selectedStamp}.png`;
            img.style.width = '100%'; // コンテナに合わせる
            currentStampPreview.appendChild(img);
        }
    }

    function updateStampPaletteActiveState() {
        stampPalette.querySelector('.active')?.classList.remove('active');
        const activeItem = stampPalette.querySelector(`.stamp-palette-item[data-stamp="${selectedStamp || 'none'}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    // 古いデータ構造（オブジェクト）を新しいデータ構造（オブジェクトの配列）に変換する
    function migrateDataStructure(calendars) {
        calendars.forEach(calendar => {
            for (const date in calendar.records) {
                const record = calendar.records[date];
                // recordが配列でなければ、古い形式と判断
                if (record && !Array.isArray(record)) {
                    // 1件のメモオブジェクトを配列でラップする
                    calendar.records[date] = [{
                        id: Date.now() + Math.random(), // 簡易的なユニークID
                        stamp: record.stamp || 'none',
                        memo: record.memo || ''
                    }];
                }
            }
        });
    }

    function loadAndInitialize() {
        const savedData = localStorage.getItem('allCalendarsData');
        const savedIndex = localStorage.getItem('activeCalendarIndex');
        const savedView = localStorage.getItem('activeView');
 
        if (savedData) {
            // 新しいデータ形式があれば読み込む
            allCalendarsData = JSON.parse(savedData);
            // データ構造の移行処理
            migrateDataStructure(allCalendarsData);
            activeCalendarIndex = savedIndex !== null ? parseInt(savedIndex, 10) : null;
        } else {
            // --- ここから下は初回起動時または旧データからの移行処理 ---
            // 古いデータ形式からの移行処理
            const oldRecords = localStorage.getItem('calendarRecords');
            const oldTitle = localStorage.getItem('calendarUserTitle') || localStorage.getItem('calendarTitle');
            const oldColor = localStorage.getItem('calendarThemeColor');
 
            if (oldRecords || oldTitle || oldColor) {
                const parsedOldRecords = oldRecords ? JSON.parse(oldRecords) : {};
                const migratedRecords = {};
                // 古いデータ形式（true）を新しい形式に変換
                for (const date in parsedOldRecords) {
                    migratedRecords[date] = { stamp: 'goodjob', memo: '' };
                }
                // 既存のデータを1番目のカレンダーとして設定
                const migratedCalendar = {
                    title: oldTitle || "カレンダー1",
                    records: migratedRecords,
                    themeColor: oldColor || themeColors[4]
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

        createSideNavMenu();

        // 前回開いていたカレンダーがあれば復元する
        if (activeCalendarIndex !== null) {
            activeView = savedView || 'calendar';
            switchView(activeView, activeCalendarIndex);
        }
    }
 
    // 検索イベントリスナー
    memoSearchInput.addEventListener('input', () => {
        if (activeView === 'global-memo-list') {
            renderGlobalMemoList();
        }
    });

    function saveData() {
        localStorage.setItem('allCalendarsData', JSON.stringify(allCalendarsData));
        localStorage.setItem('activeCalendarIndex', activeCalendarIndex);
        localStorage.setItem('activeView', activeView);
    }
 
    function createTabs() {
        if (activeCalendarIndex === null) return; // カレンダーが選択されていなければ何もしない

        calendarTabs.innerHTML = '';

        // 選択中のカレンダーのタブ
        const calendarTab = document.createElement('button');
        calendarTab.classList.add('tab-btn');
        calendarTab.textContent = allCalendarsData[activeCalendarIndex].title;
        if (activeView === 'calendar') {
            calendarTab.classList.add('active');
        }
        calendarTab.addEventListener('click', () => switchView('calendar', activeCalendarIndex));
        calendarTabs.appendChild(calendarTab);

        // メモ一覧タブ
        const memoListTab = document.createElement('button');
        memoListTab.classList.add('tab-btn');
        memoListTab.textContent = 'メモ一覧';
        if (activeView === 'memo-list') {
            memoListTab.classList.add('active');
        }
        memoListTab.addEventListener('click', () => switchView('memo-list', activeCalendarIndex));
        calendarTabs.appendChild(memoListTab);
    }

    function createSideNavMenu() {
        sideNavMenu.innerHTML = ''; // メニューをクリア

        // カレンダーリスト
        allCalendarsData.forEach((calendar, index) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = calendar.title;
            if (activeView !== 'global-memo-list' && index === activeCalendarIndex) {
                a.classList.add('active');
            }
            a.addEventListener('click', (e) => {
                e.preventDefault();
                switchView('calendar', index);
                toggleMenu(); // メニューを閉じる
            });
            li.appendChild(a);
            sideNavMenu.appendChild(li);
        });

        // 区切り線
        const hr = document.createElement('hr');
        sideNavMenu.appendChild(hr);

        // 全メモ一覧へのリンク
        const liGlobalMemo = document.createElement('li');
        const aGlobalMemo = document.createElement('a');
        aGlobalMemo.href = '#';
        aGlobalMemo.textContent = 'すべてのメモ';
        if (activeView === 'global-memo-list') {
            aGlobalMemo.classList.add('active');
        }
        aGlobalMemo.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('global-memo-list');
            toggleMenu(); // メニューを閉じる
        });
        liGlobalMemo.appendChild(aGlobalMemo);
        sideNavMenu.appendChild(liGlobalMemo);

        // Aboutページへのリンク
        const liAbout = document.createElement('li');
        const aAbout = document.createElement('a');
        aAbout.href = 'about.html';
        aAbout.textContent = '使い方ガイド';
        liAbout.appendChild(aAbout);
        sideNavMenu.appendChild(liAbout);
    }
 
    function switchView(type, calendarIndex = activeCalendarIndex) {
        activeView = type;

        if (type === 'global-memo-list') {
            activeCalendarIndex = null;
            tabsContainer.style.display = 'none';
            calendarView.style.display = 'none';
            memoListView.style.display = 'block';
            exportAllCsvBtn.style.display = 'inline-block'; // ボタンを表示
            document.documentElement.style.setProperty('--theme-color', allCalendarsData[0].themeColor); // カレンダー1のカラーに設定
            renderGlobalMemoList();
        } else {
            activeCalendarIndex = calendarIndex;
            tabsContainer.style.display = 'flex';
            exportAllCsvBtn.style.display = 'none'; // ボタンを非表示
            if (type === 'calendar') {
                calendarView.style.display = 'block';
                memoListView.style.display = 'none';
                updateUIForActiveCalendar();
                renderCalendar();
            } else { // 'memo-list' for a specific calendar
                calendarView.style.display = 'none';
                memoListView.style.display = 'block';
                updateUIForActiveCalendar();
                renderMemoList();
            }
            createTabs();
        }

        saveData();
        createSideNavMenu();
    }

    function renderMemoList() {
        memoSearchInput.parentElement.style.display = 'none'; // 検索バーを非表示
        memoListItemsContainer.innerHTML = '';
        const currentRecords = allCalendarsData[activeCalendarIndex].records;
        
        const allMemos = [];
        for (const date in currentRecords) {
            currentRecords[date].forEach(memo => {
                allMemos.push({ date, ...memo });
            });
        }

        // 新しい順にソート
        allMemos.sort((a, b) => {
            if (b.date > a.date) return 1;
            if (b.date < a.date) return -1;
            return b.id > a.id ? 1 : -1;
        });

        if (allMemos.length === 0) {
            memoListItemsContainer.innerHTML = '<p>記録されたメモはありません。</p>';
            return;
        }

        allMemos.forEach(memo => {
            const item = createMemoListItem(memo);
            memoListItemsContainer.appendChild(item);
        });
    }

    function renderGlobalMemoList() {
        memoSearchInput.parentElement.style.display = 'block'; // 検索バーを表示
        const searchTerm = memoSearchInput.value.toLowerCase();
        memoListItemsContainer.innerHTML = '';

        const allMemos = [];
        allCalendarsData.forEach((calendar, calIndex) => {
            for (const date in calendar.records) {
                calendar.records[date].forEach(memo => {
                    allMemos.push({ date, ...memo, calendarTitle: calendar.title, calendarIndex: calIndex });
                });
            }
        });

        const filteredMemos = allMemos.filter(memo => 
            (memo.memo && memo.memo.toLowerCase().includes(searchTerm)) ||
            (memo.date && memo.date.includes(searchTerm))
        );

        filteredMemos.sort((a, b) => {
            if (b.date > a.date) return 1;
            if (b.date < a.date) return -1;
            return b.id > a.id ? 1 : -1;
        });

        if (filteredMemos.length === 0) {
            memoListItemsContainer.innerHTML = '<p>該当するメモはありません。</p>';
            return;
        }

        filteredMemos.forEach(memo => {
            const item = createGlobalMemoListItem(memo);
            memoListItemsContainer.appendChild(item);
        });
    }
 
    function updateUIForActiveCalendar() {
        if (activeCalendarIndex === null) return;
        const currentData = allCalendarsData[activeCalendarIndex];
        calendarUserTitleElement.textContent = currentData.title;
        document.documentElement.style.setProperty('--theme-color', currentData.themeColor);
        currentColorPreview.style.backgroundColor = currentData.themeColor;
        updateColorPaletteActiveState();
    }
 
    function updateColorPaletteActiveState() {
        if (activeCalendarIndex === null) return;
        const currentThemeColor = allCalendarsData[activeCalendarIndex].themeColor;
        themeColorPalette.querySelector('.active')?.classList.remove('active');
        const newActiveSwatch = themeColorPalette.querySelector(`.color-swatch[data-color="${currentThemeColor}"]`);
        if (newActiveSwatch) {
            newActiveSwatch.classList.add('active');
        }
    }
 
    function createMemoListItem(memo) {
        const item = document.createElement('div');
        item.classList.add('memo-list-item');
        item.addEventListener('click', () => handleDayClick(memo.date));

        const stampHTML = (memo.stamp && memo.stamp !== 'none')
            ? `<img src="png/${memo.stamp}.png" alt="${memo.stamp}" class="memo-list-stamp">`
            : '';

        item.innerHTML = `
            <div class="memo-list-date">${memo.date}</div>
            <div class="memo-list-content">
                ${stampHTML}
                <span class="memo-list-text">${memo.memo || '(メモなし)'}</span>
            </div>
        `;

        return item;
    }

    function createGlobalMemoListItem(memo) {
        const item = document.createElement('div');
        item.classList.add('memo-list-item');
        item.addEventListener('click', () => {
            // 対応するカレンダーに切り替えてから、日付別一覧モーダルを開く
            switchView('calendar', memo.calendarIndex);
            handleDayClick(memo.date);
        });

        const stampHTML = (memo.stamp && memo.stamp !== 'none')
            ? `<img src="png/${memo.stamp}.png" alt="${memo.stamp}" class="memo-list-stamp">`
            : '';

        item.innerHTML = `
            <div class="memo-list-date">${memo.date}<br><small>(${memo.calendarTitle})</small></div>
            <div class="memo-list-content">
                ${stampHTML}
                <span class="memo-list-text">${memo.memo || '(メモなし)'}</span>
            </div>
        `;
        return item;
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
            const dayNumber = document.createElement('span');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = i;
            dayCell.appendChild(dayNumber);
            dayCell.dataset.date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
 
            if (i === currentDate.getDate() && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear()) {
                dayCell.classList.add('today');
            }
 
            const recordData = currentRecords[dayCell.dataset.date];
            if (recordData && recordData.length > 0) {
                // スタンプ表示
                // その日の中で最初に見つかったスタンプを表示する
                const firstStampedMemo = recordData.find(memo => memo.stamp && memo.stamp !== 'none');
                if (firstStampedMemo) {
                    const recordType = firstStampedMemo.stamp;
                    const img = document.createElement('img');
                    img.src = `png/${recordType}.png`;
                    img.alt = '記録あり';
                    img.classList.add('record-mark');
                    dayCell.appendChild(img);
                }

                // メモありインジケーター表示
                if (recordData.some(r => r.memo && r.memo.trim() !== '')) {
                    const memoIndicator = document.createElement('span');
                    memoIndicator.classList.add('memo-indicator');
                    memoIndicator.textContent = '📝';
                    dayCell.appendChild(memoIndicator);
                }
            }
 
            dayCell.addEventListener('click', () => handleDayClick(dayCell.dataset.date));
 
            calendarGrid.appendChild(dayCell);
        }
    }

    function handleDayClick(date) {
        const recordsOnDate = allCalendarsData[activeCalendarIndex].records[date];
        if (recordsOnDate && recordsOnDate.length > 0) {
            showDayMemoListModal(date);
        } else {
            showMemoModal(date, null); // 新規メモ作成
        }
    }

    function showDayMemoListModal(date) {
        currentEditingDate = date;
        dayListModalDate.textContent = date;
        dayMemoListContainer.innerHTML = '';

        const recordsOnDate = allCalendarsData[activeCalendarIndex].records[date] || [];
        recordsOnDate.forEach(memo => {
            const item = document.createElement('div');
            item.classList.add('day-memo-list-item');
            item.dataset.memoId = memo.id;

            const stampImg = (memo.stamp && memo.stamp !== 'none')
                ? `<img src="png/${memo.stamp}.png" alt="${memo.stamp}" class="day-memo-list-item-stamp">`
                : '<div class="day-memo-list-item-stamp"></div>'; // 空のdivでレイアウトを維持

            const memoText = memo.memo ? memo.memo.split('\n')[0] : '(メモなし)'; // 1行目のみ表示

            item.innerHTML = `
                ${stampImg}
                <span class="day-memo-list-item-text">${memoText}</span>
            `;
            item.addEventListener('click', () => {
                showMemoModal(date, memo.id);
            });
            dayMemoListContainer.appendChild(item);
        });

        dayMemoListModal.style.display = 'flex';
    }

    function hideDayMemoListModal() {
        dayMemoListModal.style.display = 'none';
    }
 
    function showMemoModal(date, memoId) {
        hideDayMemoListModal(); // 日付別一覧モーダルが開いていれば閉じる
        currentEditingDate = date;
        currentEditingMemoId = memoId;

        modalDateElement.textContent = date;

        if (memoId) { // 編集モード
            const recordsOnDate = allCalendarsData[activeCalendarIndex].records[date] || [];
            const memo = recordsOnDate.find(m => m.id === memoId);
            if (memo) {
                memoTextarea.value = memo.memo || '';
                selectedStamp = memo.stamp || 'goodjob';
            }
        } else { // 新規作成モード
            memoTextarea.value = '';
            selectedStamp = 'goodjob';
        }

        updateStampPreview();
        updateStampPaletteActiveState();

        memoModal.style.display = 'flex';
        memoTextarea.focus();
    }

    function hideMemoModal() {
        stampPalette.classList.remove('show'); // パレットも確実に閉じる
        memoModal.style.display = 'none';
        currentEditingMemoId = null;
        currentEditingDate = null;
    }

    function saveMemo() {
        if (!currentEditingDate) return;

        const memoText = memoTextarea.value.trim();
        const currentRecords = allCalendarsData[activeCalendarIndex].records;

        if (currentEditingMemoId) { // 編集モード
            const recordsOnDate = currentRecords[currentEditingDate] || [];
            const memoToUpdate = recordsOnDate.find(m => m.id === currentEditingMemoId);
            if (memoToUpdate) {
                if (!memoText && selectedStamp === 'none') {
                    // メモもスタンプもなければ、このメモを削除
                    currentRecords[currentEditingDate] = recordsOnDate.filter(m => m.id !== currentEditingMemoId);
                } else {
                    memoToUpdate.memo = memoText;
                    memoToUpdate.stamp = selectedStamp;
                }
            }
        } else { // 新規作成モード
            if (!memoText && selectedStamp === 'none') {
                // 何も入力・選択されていなければ何もしない
                hideMemoModal();
                return;
            }
            if (!currentRecords[currentEditingDate]) {
                currentRecords[currentEditingDate] = [];
            }
            const newMemo = { id: Date.now(), memo: memoText, stamp: selectedStamp };
            currentRecords[currentEditingDate].push(newMemo);
        }

        // 日付にメモが1件もなくなったら、その日付のキー自体を削除
        if (currentRecords[currentEditingDate] && currentRecords[currentEditingDate].length === 0) {
            delete currentRecords[currentEditingDate];
        }

        saveData();
        // 現在のビューに応じて再描画
        if (activeView === 'calendar') {
            renderCalendar();
        } else {
            renderMemoList();
        }
        hideMemoModal();
    }

    function deleteMemo() {
        if (!currentEditingDate) return;

        const currentRecords = allCalendarsData[activeCalendarIndex].records;
        if (currentEditingMemoId && currentRecords[currentEditingDate]) {
            // 編集中のメモを配列から削除
            currentRecords[currentEditingDate] = currentRecords[currentEditingDate].filter(m => m.id !== currentEditingMemoId);
            // 日付にメモが1件もなくなったら、その日付のキー自体を削除
            if (currentRecords[currentEditingDate].length === 0) {
                delete currentRecords[currentEditingDate];
            }
        }

        saveData();
        // 現在のビューに応じて再描画
        if (activeView === 'calendar') {
            renderCalendar();
        } else {
            renderMemoList();
        }
        hideMemoModal();
    }

    function exportAllCsv() {
        const dataRows = [];
        allCalendarsData.forEach(calendar => {
            const records = calendar.records;
            const sortedDates = Object.keys(records).sort();
            sortedDates.forEach(date => {
                records[date].forEach(record => {
                    const calendarTitle = `"${calendar.title.replace(/"/g, '""')}"`;
                    const memo = record.memo ? `"${record.memo.replace(/"/g, '""')}"` : '';
                    const stamp = record.stamp || 'none';
                    dataRows.push(`${calendarTitle},${date},${stamp},${memo}`);
                });
            });
        });
    
        if (dataRows.length === 0) {
            alert('出力する記録がありません。');
            return;
        }
    
        // CSVのヘッダーと内容を作成
        const csvContent = "カレンダー,日付,スタンプ,メモ\n" + dataRows.join("\n");
    
        // Excelでの文字化け防止のためBOMを付与
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    
        const fileName = `すべてのメモ一覧.csv`;
    
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportCsv() {
        const currentData = allCalendarsData[activeCalendarIndex];
        const records = currentData.records;
        const sortedDates = Object.keys(records).sort();

        const dataRows = [];
        sortedDates.forEach(date => {
            records[date].forEach(record => {
                const memo = record.memo ? `"${record.memo.replace(/"/g, '""')}"` : '';
                const stamp = record.stamp || 'none';
                dataRows.push(`${date},${stamp},${memo}`);
            });
        });

        if (dataRows.length === 0) {
            alert('出力する記録がありません。');
            return;
        }
 
        // CSVのヘッダーと内容を作成
        const csvContent = "日付,スタンプ,メモ\n" + dataRows.join("\n");
 
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
            // 現在のビューに応じて再描画
            if (activeView === 'calendar') {
                renderCalendar();
            } else {
                renderMemoList();
            }
            alert("すべての記録をリセットしました。");
        }
    }
 
    calendarUserTitleElement.addEventListener('blur', (event) => {
        const newTitle = event.target.textContent.trim();
        if (newTitle) {
            allCalendarsData[activeCalendarIndex].title = newTitle;
            saveData();
            createSideNavMenu(); // メニューのテキストも更新
            createTabs(); // タブのテキストを更新
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
        switchView('calendar', activeCalendarIndex); // ビューを再描画
    });
 
    nextBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        switchView('calendar', activeCalendarIndex); // ビューを再描画
    });
 
    exportCsvBtn.addEventListener('click', exportCsv);
    clearAllRecordsBtn.addEventListener('click', clearAllRecords);
 
    // --- ハンバーガーメニューの処理 ---
    function toggleMenu() {
        hamburgerIcon.classList.toggle('active');
        sideNav.classList.toggle('open');
        overlay.classList.toggle('show');
    }
    hamburgerIcon.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    // 検索イベントリスナー
    memoSearchInput.addEventListener('input', () => {
        if (activeView === 'global-memo-list') {
            renderGlobalMemoList();
        }
    });

    exportAllCsvBtn.addEventListener('click', exportAllCsv);

    // モーダルのイベントリスナー
    saveMemoBtn.addEventListener('click', saveMemo);
    deleteMemoBtn.addEventListener('click', deleteMemo);
    closeModalBtn.addEventListener('click', hideMemoModal);
    addNewMemoBtn.addEventListener('click', () => {
        // currentEditingDateはdayMemoListModalを開いたときに設定されている
        showMemoModal(currentEditingDate, null);
    });
    closeDayListModalBtn.addEventListener('click', hideDayMemoListModal);


    memoModal.addEventListener('click', (e) => {
        // 背景クリックでモーダルを閉じる
        if (e.target === memoModal) {
            hideMemoModal();
        }
    });

    // スタンププレビュークリックでパレットの表示/非表示を切り替え
    currentStampPreview.addEventListener('click', (e) => {
        e.stopPropagation();
        stampPalette.classList.toggle('show');
    });

    // ドキュメントのどこかをクリックしたときにパレットを閉じる
    document.addEventListener('click', () => {
        if (stampPalette.classList.contains('show')) {
            stampPalette.classList.remove('show');
        }
    });

    // 初期化処理の呼び出し
    loadAndInitialize();
});