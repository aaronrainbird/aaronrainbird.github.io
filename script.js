// --- Configuration ---
const USE_SIMULATED_API = true; // Set to true for testing
const API_ENDPOINT = 'YOUR_APPS_SCRIPT_WEB_APP_URL'; // Placeholder
const LOCAL_STORAGE_KEY = 'stockCheckScanLog'; // Key for local storage

// --- Simulated Data ---
const SIMULATED_PRODUCT_MASTER_LIST = [
    { ProductNumber: "123456789012", ProductName: "Stylish Blue T-Shirt", Colour: "Blue", Category: "Apparel", Subcategory: "Tops", Detail: "Cotton Crew Neck", ImageUrl: "https://www.net-a-porter.com/variants/images/45666037504864263/in/w200_a3-4_q60.jpg" },
    { ProductNumber: "987654321098", ProductName: "Classic Black Jeans", Colour: "Black", Category: "Apparel", Subcategory: "Bottoms", Detail: "Slim Fit Denim", ImageUrl: "https://via.placeholder.com/150x200/000000/FFFFFF?text=Jeans" },
    { ProductNumber: "112233445566", ProductName: "Running Sneakers", Colour: "White/Red", Category: "Footwear", Subcategory: "Sports", Detail: "Lightweight Mesh", ImageUrl: "https://via.placeholder.com/150x200/FFFFFF/FF0000?text=Sneaker" },
    { ProductNumber: "123456789012", ProductName: "Alternate Blue T-Shirt", Colour: "Sky Blue", Category: "Apparel", Subcategory: "Tops", Detail: "V-Neck Variant", ImageUrl: "https://via.placeholder.com/150x200/ADD8E6/000000?text=T-Shirt+V2" }
];
let SIMULATED_SCAN_LOG = [];

// --- Globals ---
let productMasterList = [];
let html5QrCode = null;
let isScanning = false;
let currentMode = 'manual'; // 'manual' or 'scan'
let isMobile = false;
let lastScanData = null;

// --- DOM Elements ---
const readerElement = document.getElementById('reader');
const scannerView = document.getElementById('scanner-view');
const inputView = document.getElementById('input-view');
const barcodeInputElement = document.getElementById('barcode-input');
const submitManualBtn = document.getElementById('submit-manual-btn');
const stopScanBtn = document.getElementById('stop-scan-btn');
const scanAgainBtn = document.getElementById('scan-again-btn');
const switchModeBtn = document.getElementById('switch-mode-btn');
const undoScanBtn = document.getElementById('undo-scan-btn');
const resultArea = document.querySelector('.result-area');
const resultStatusElement = document.getElementById('result-status');
const statusTextElement = document.getElementById('status-text');
const statusIconElement = document.getElementById('status-icon');
const productInfoElement = document.getElementById('product-info');
const productImageElement = document.getElementById('product-image');
const productImageContainer = document.getElementById('product-image-container');
const foundListElement = document.getElementById('found-list');
const nonSampleListElement = document.getElementById('non-sample-list');
const foundCountElement = document.getElementById('found-count');
const nonSampleCountElement = document.getElementById('non-sample-count');
const clearStorageBtn = document.getElementById('clear-storage-btn');


// --- Utility Functions ---

// *** Focus Input Field if applicable ***
function focusInputField() {
    // Only focus if in manual mode OR if on desktop (where manual is the only mode)
    if (currentMode === 'manual' || !isMobile) {
        // Small delay helps ensure element is ready and visible, especially after mode switches
        setTimeout(() => {
            barcodeInputElement.focus();
            // Optional: Select existing text for easy overwrite
            // barcodeInputElement.select();
        }, 50); // 50ms delay, adjust if needed
    }
}

// Save Log to Local Storage (remains the same)
function saveLogToLocalStorage() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SIMULATED_SCAN_LOG));
        console.log("Scan log saved to localStorage.");
    } catch (error) {
        console.error("Error saving log to localStorage:", error);
    }
}

// Load Log from Local Storage (remains the same)
function loadLogFromLocalStorage() {
    try {
        const storedLog = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedLog) {
            const parsedLog = JSON.parse(storedLog);
            if (Array.isArray(parsedLog)) {
                SIMULATED_SCAN_LOG = parsedLog;
                console.log(`Loaded ${SIMULATED_SCAN_LOG.length} scans from localStorage.`);
                const latestValidScan = [...SIMULATED_SCAN_LOG].reverse().find(item => item.status !== 'Undone');
                if (latestValidScan) {
                    lastScanData = latestValidScan;
                    undoScanBtn.disabled = false;
                } else {
                    lastScanData = null;
                    undoScanBtn.disabled = true;
                }
                return true;
            } else {
                console.warn("Invalid data found in localStorage for scan log. Starting fresh.");
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
        }
    } catch (error) {
        console.error("Error loading log from localStorage:", error);
         localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    SIMULATED_SCAN_LOG = [];
    lastScanData = null;
    undoScanBtn.disabled = true;
    return false;
}

// Detect Mobile & Set Initial Mode
function detectDevice() {
     isMobile = window.innerWidth < 768;
     console.log("Is Mobile:", isMobile);
     // Set initial mode AND focus if applicable
     setMode(isMobile ? 'scan' : 'manual');
}

// Set Interaction Mode (Scan vs Manual)
function setMode(mode) {
    currentMode = mode;
    if (mode === 'scan' && isMobile) {
        stopScanning(); // Ensure camera off if switching from manual
        scannerView.style.display = 'block';
        inputView.style.display = 'none';
        scanAgainBtn.style.display = 'none';
        switchModeBtn.textContent = 'Switch to Type';
        // Don't focus input field in scan mode
        startScanning(); // Start scan immediately when switching TO scan mode
    } else { // Manual mode or Desktop
        stopScanning(); // Ensure camera is off
        scannerView.style.display = 'none';
        inputView.style.display = 'block';
        scanAgainBtn.style.display = 'none';
        if (isMobile) {
            switchModeBtn.textContent = 'Switch to Scan';
        } else {
            document.querySelector('.mobile-controls').style.display = 'none';
        }
        // *** FOCUS INPUT IN MANUAL MODE ***
        focusInputField();
    }
}

// Toggle Mode (Mobile only)
function toggleMode() {
    if (!isMobile) return;
    setMode(currentMode === 'scan' ? 'manual' : 'scan');
}

// Load Initial Data (Simulated or Real)
async function loadInitialData() {
    updateStatus('Processing', '🔄', 'Loading product data...');
    productInfoElement.textContent = '';
    productImageElement.style.display = 'none';
    loadLogFromLocalStorage();

    if (USE_SIMULATED_API) {
        console.log("Using simulated product data.");
        productMasterList = SIMULATED_PRODUCT_MASTER_LIST;
        await new Promise(resolve => setTimeout(resolve, 50));
        updateStatus('Info', 'ℹ️', `Ready (Simulated). ${productMasterList.length} products loaded. ${SIMULATED_SCAN_LOG.length} scans restored.`);
    } else {
        updateStatus('Error', '❌', 'Real API fetch not implemented.');
    }
    renderScanLists();
    // *** Initial focus check on load ***
    focusInputField();
}

// Start Camera Scanning
function startScanning() {
    if (!isMobile || currentMode !== 'scan' || isScanning) return;

    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }
    const config = { fps: 10, qrbox: { width: 250, height: 150 } };

    scannerView.style.display = 'block';
    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
        .then(() => {
            console.log("Scanner started.");
            isScanning = true;
            stopScanBtn.style.display = 'inline-block';
            scanAgainBtn.style.display = 'none';
            updateStatus('Info', '📷', 'Scanning...');
            productInfoElement.textContent = 'Point camera at barcode.';
            productImageElement.style.display = 'none';
            resultArea.classList.remove('alert-highlight-red');
        })
        .catch((err) => {
            console.error("Error starting scanner:", err);
            updateStatus('Error', '❌', 'Error starting camera.');
            isScanning = false;
            stopScanBtn.style.display = 'none';
        });
}

// Stop Camera Scanning (remains the same)
function stopScanning() {
    if (html5QrCode && isScanning) {
        html5QrCode.stop()
            .then(() => {
                console.log("Scanner stopped.");
                isScanning = false;
                stopScanBtn.style.display = 'none';
            })
            .catch((err) => {
                console.warn("Scanner stop error (may be ok if already stopped):", err);
                isScanning = false;
                stopScanBtn.style.display = 'none';
            });
    } else {
         isScanning = false;
         stopScanBtn.style.display = 'none';
    }
}


// Scan Success Callback
function onScanSuccess(decodedText, decodedResult) {
    if (!isScanning) return;
    console.log(`Code matched = ${decodedText}`);
    stopScanning();
    processBarcode(decodedText);
    if (navigator.vibrate) navigator.vibrate(100);
     if (isMobile) {
         scanAgainBtn.style.display = 'inline-block';
         scannerView.style.display = 'none';
     }
}

// Scan Failure Callback (Optional) (remains the same)
function onScanFailure(error) { }

// Visual Alert Flash (remains the same)
function triggerVisualAlert(type = 'red') {
     const className = 'alert-highlight-red';
     resultArea.classList.add(className);
     const timerId = setTimeout(() => {
         resultArea.classList.remove(className);
     }, 1500);
 }

// Update Status Display Area (remains the same)
function updateStatus(statusType, icon, text) {
    resultStatusElement.className = 'status-box';
    statusTextElement.textContent = text;
    statusIconElement.textContent = icon;
    switch (statusType) {
        case 'Found': resultStatusElement.classList.add('status-found'); break;
        case 'Extra': resultStatusElement.classList.add('status-extra'); break;
        case 'NotFound': resultStatusElement.classList.add('status-notfound'); break;
        case 'Processing': resultStatusElement.classList.add('status-processing'); break;
        case 'Info': resultStatusElement.classList.add('status-info'); break;
        case 'Error': resultStatusElement.classList.add('status-notfound'); break;
    }
    if (statusType !== 'Extra' && statusType !== 'NotFound' && statusType !== 'Error') {
       resultArea.classList.remove('alert-highlight-red');
    }
}


// Display Product Details (remains the same)
function displayProductDetails(product) {
    if (!product) {
        productInfoElement.textContent = 'No details available.';
        productImageElement.style.display = 'none';
        return;
    }
    let detailsText = `Prod No: ${product.ProductNumber}\n`;
    if (product.ProductName) detailsText += `Name:    ${product.ProductName}\n`;
    if (product.Colour) detailsText += `Colour:  ${product.Colour}\n`;
    if (product.Category) detailsText += `Category:${product.Category}\n`;
    if (product.Subcategory) detailsText += `Sub Cat: ${product.Subcategory}\n`;
    if (product.Detail) detailsText += `Detail:  ${product.Detail}\n`;
    productInfoElement.textContent = detailsText.trim();
    if (product.ImageUrl) {
        productImageElement.src = product.ImageUrl;
        productImageElement.alt = product.ProductName || 'Product Image';
        productImageElement.style.display = 'block';
    } else {
        productImageElement.style.display = 'none';
    }
}


// Render Scan Lists (remains the same)
function renderScanLists() {
    let foundHTML = '';
    let nonSampleHTML = '';
    let currentFoundCount = 0;
    let currentNonSampleCount = 0;
    SIMULATED_SCAN_LOG.filter(item => item.status !== 'Undone').forEach(item => {
        const name = item.product?.ProductName || 'N/A';
        const text = `${item.barcode} - ${name} (${item.status})`;
        if (item.status === 'Found') {
            foundHTML += `<li>${text}</li>`;
            currentFoundCount++;
        } else if (item.status === 'Extra Found' || item.status === 'NotFound') {
            nonSampleHTML += `<li>${text}</li>`;
            currentNonSampleCount++;
        }
    });
    foundListElement.innerHTML = foundHTML || '<li>(No matching items scanned yet)</li>';
    nonSampleListElement.innerHTML = nonSampleHTML || '<li>(No non-sample items scanned yet)</li>';
    foundCountElement.textContent = currentFoundCount;
    nonSampleCountElement.textContent = currentNonSampleCount;
}


// Process Barcode (Core Logic - Added focus call)
async function processBarcode(barcode) {
    if (!barcode) return;
    const trimmedBarcode = barcode.trim();
    barcodeInputElement.value = '';

    updateStatus('Processing', '🔄', `Checking: ${trimmedBarcode}...`);
    productInfoElement.textContent = '';
    productImageElement.style.display = 'none';
    undoScanBtn.disabled = true;

    let resultStatus = 'Error';
    let resultIcon = '❓';
    let resultText = `Failed to process ${trimmedBarcode}`;
    let productData = null;
    let finalLogStatus = '';
    const currentTimestamp = Date.now();

    if (USE_SIMULATED_API) {
        await new Promise(resolve => setTimeout(resolve, 250));
        productData = productMasterList.find(p => p.ProductNumber === trimmedBarcode);

        if (!productData) {
            resultStatus = 'NotFound'; resultIcon = '❌';
            resultText = `NOT FOUND: ${trimmedBarcode}. Set aside.`;
            finalLogStatus = 'NotFound'; triggerVisualAlert('red');
        } else {
            const alreadyFound = SIMULATED_SCAN_LOG.some( log => log.barcode === trimmedBarcode && log.status === 'Found' );
            if (alreadyFound) {
                resultStatus = 'Extra'; resultIcon = '⚠️';
                resultText = `EXTRA: ${trimmedBarcode}. Already scanned. Set aside.`;
                finalLogStatus = 'Extra Found'; triggerVisualAlert('red');
            } else {
                resultStatus = 'Found'; resultIcon = '✅';
                resultText = `FOUND: ${trimmedBarcode}`;
                finalLogStatus = 'Found'; resultArea.classList.remove('alert-highlight-red');
            }
        }
        if (finalLogStatus) {
             const logEntry = { barcode: trimmedBarcode, status: finalLogStatus, timestamp: currentTimestamp, product: productData };
            SIMULATED_SCAN_LOG.push(logEntry);
            lastScanData = logEntry; undoScanBtn.disabled = false;
            saveLogToLocalStorage();
        }
    } else {
        // --- REAL API Call Logic ---
         resultStatus = 'Error'; resultIcon = '❌'; resultText = 'API connection not implemented.';
        // --- End Real API Call ---
    }

    // --- Update UI ---
    updateStatus(resultStatus, resultIcon, resultText);
    displayProductDetails(productData);
    renderScanLists();

    // *** Refocus after processing ***
    focusInputField();
}


// Undo Last Scan (Added focus call)
async function undoLastScan() {
    if (!lastScanData) { console.warn("No last scan data to undo."); return; }
    console.log("Attempting to undo:", lastScanData);
    const barcodeToUndo = lastScanData.barcode;
    const timestampToUndo = lastScanData.timestamp;

    undoScanBtn.disabled = true;
    updateStatus('Processing', '🔄', `Undoing scan for ${barcodeToUndo}...`);

    if (USE_SIMULATED_API) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const indexToUndo = SIMULATED_SCAN_LOG.findIndex( log => log.barcode === barcodeToUndo && log.timestamp === timestampToUndo && log.status !== 'Undone' );

        if (indexToUndo !== -1) {
            SIMULATED_SCAN_LOG[indexToUndo].status = 'Undone';
            console.log("Simulated Undo Successful for:", barcodeToUndo);
            updateStatus('Info', '↩️', `Undo successful for ${barcodeToUndo}.`);
            lastScanData = null; saveLogToLocalStorage();
            const latestValidScan = [...SIMULATED_SCAN_LOG].reverse().find(item => item.status !== 'Undone');
             if (latestValidScan) { lastScanData = latestValidScan; undoScanBtn.disabled = false; }
        } else {
            console.warn("Could not find matching scan in simulated log to undo:", lastScanData);
            updateStatus('Error', '❌', `Failed to undo ${barcodeToUndo} (not found?).`);
            undoScanBtn.disabled = false;
        }
        renderScanLists();
    } else {
        // --- REAL API Call for Undo ---
        updateStatus('Error', '❌', 'API Undo not implemented.');
        // --- End Real API Undo ---
    }

    // *** Refocus after undo attempt ***
    focusInputField();
}

// Reset simulation state AND clear storage (remains the same)
function resetSimulationState() {
    SIMULATED_SCAN_LOG = [];
    lastScanData = null;
    undoScanBtn.disabled = true;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    console.log("Simulated scan log and localStorage cleared.");
    renderScanLists();
    updateStatus('Info', 'ℹ️', 'Saved scan data cleared.');
    productInfoElement.textContent = '';
    productImageElement.style.display = 'none';
    focusInputField(); // Focus after clearing
}


// --- Event Listeners ---
submitManualBtn.addEventListener('click', () => processBarcode(barcodeInputElement.value));
barcodeInputElement.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        processBarcode(barcodeInputElement.value);
    }
});

// Mobile specific listeners
stopScanBtn.addEventListener('click', stopScanning);
scanAgainBtn.addEventListener('click', startScanning);
switchModeBtn.addEventListener('click', toggleMode);

// Undo listener
undoScanBtn.addEventListener('click', undoLastScan);

// Clear Storage listener
clearStorageBtn.addEventListener('click', resetSimulationState);

// *** AUTOFOCUS Listener ***
window.addEventListener('focus', focusInputField);


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    detectDevice(); // Detect mobile/desktop and set initial mode
    loadInitialData(); // Load data, render lists, and set initial focus
});