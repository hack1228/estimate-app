document.addEventListener('DOMContentLoaded', () => {
    const issueDate = document.getElementById('issue-date');
    const itemsBody = document.getElementById('items-body');
    const addRowBtn = document.getElementById('add-row-btn');
    const totalAmountEl = document.getElementById('total-amount');
    const savePdfBtn = document.getElementById('save-pdf-btn');
    const resetBtn = document.getElementById('reset-btn');
    const docTypeSelect = document.getElementById('doc-type');
    const docTitle = document.getElementById('doc-title');

    // --- 初期設定 ---
    // 今日の日付をデフォルト設定
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    issueDate.value = `${year}-${month}-${day}`;

    // --- イベントリスナー ---
    addRowBtn.addEventListener('click', addRow);
    itemsBody.addEventListener('input', handleInput);
    itemsBody.addEventListener('click', handleDeleteRow);
    resetBtn.addEventListener('click', resetForm);
    savePdfBtn.addEventListener('click', saveAsPdf);
    docTypeSelect.addEventListener('change', () => {
        docTitle.textContent = docTypeSelect.value;
    });

    // --- 関数 ---

    /**
     * 新しい行をテーブルに追加する
     */
    function addRow() {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="item-name" placeholder="例: 杉"></td>
            <td><input type="text" class="item-spec" value="H"></td>
            <td><input type="number" class="item-quantity" placeholder="0" min="0"></td>
            <td><input type="number" class="item-price" placeholder="0" min="0"></td>
            <td class="item-subtotal">¥0</td>
            <td><button class="btn-remove">×</button></td>
        `;
        itemsBody.appendChild(row);
    }

    /**
     * 入力イベントを処理し、小計と合計を更新する
     * @param {Event} e - イベントオブジェクト
     */
    function handleInput(e) {
        if (e.target.classList.contains('item-price') || e.target.classList.contains('item-quantity')) {
            const row = e.target.closest('tr');
            updateSubtotal(row);
        }
        updateTotal();
    }

    /**
     * 行の削除ボタンが押された時の処理
     * @param {Event} e - イベントオブジェクト
     */
    function handleDeleteRow(e) {
        if (e.target.classList.contains('btn-remove')) {
            const row = e.target.closest('tr');
            itemsBody.removeChild(row);
            updateTotal();
        }
    }

    /**
     * 指定された行の小計を計算して更新する
     * @param {HTMLTableRowElement} row - 対象の行要素
     */
    function updateSubtotal(row) {
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const subtotal = price * quantity;
        row.querySelector('.item-subtotal').textContent = formatCurrency(subtotal);
    }

    /**
     * 全ての行の小計を合計して、合計金額を更新する
     */
    function updateTotal() {
        let total = 0;
        const rows = itemsBody.querySelectorAll('tr');
        rows.forEach(row => {
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            total += price * quantity;
        });
        totalAmountEl.textContent = formatCurrency(total);
    }

    /**
     * フォーム全体をリセットする
     */
    function resetForm() {
        if (confirm('内容をすべてリセットしますか？')) {
            document.getElementById('doc-number').value = '';
            document.getElementById('customer-name').value = '';
            document.getElementById('company-name').value = '';
            document.getElementById('ship-to').value = '';
            document.getElementById('ship-from').value = '';
            itemsBody.innerHTML = '';
            updateTotal();
            // 日付はリセットしないでおく
        }
    }

    /**
     * 現在の表示内容をPDFとして保存する
     */
    async function saveAsPdf() {
        const { jsPDF } = window.jspdf;
        const appContainer = document.getElementById('app-container');

        // ボタンを一時的に非表示にする
        const actions = appContainer.querySelector('.actions');
        const addBtn = document.getElementById('add-row-btn');
        actions.style.display = 'none';
        addBtn.style.display = 'none';

        try {
            const canvas = await html2canvas(appContainer, {
                scale: 2, // 高解像度化
                useCORS: true, // 外部リソース（フォントなど）を使用する場合
                windowWidth: appContainer.scrollWidth,
                windowHeight: appContainer.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            const docType = document.getElementById('doc-type').value;
            const customerName = document.getElementById('customer-name').value || 'customer';
            const issueDate = document.getElementById('issue-date').value;
            pdf.save(`${docType}_${customerName}_${issueDate}.pdf`);

        } catch (error) {
            console.error('PDFの生成に失敗しました:', error);
            alert('PDFの生成に失敗しました。');
        } finally {
            // ボタンとフォームを再表示
            actions.style.display = 'flex';
            addBtn.style.display = 'block';
        }
    }

    /**
     * 数値を円通貨形式の文字列にフォーマットする
     * @param {number} amount - 金額
     * @returns {string} - フォーマットされた文字列
     */
    function formatCurrency(amount) {
        return `¥${amount.toLocaleString()}`;
    }

    // --- 初期化処理 ---
    // 最初に1行追加しておく
});
