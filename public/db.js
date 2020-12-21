const indexedDb =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDb;

let db;

const request = indexedDb.open("budget", 1);

request.onsuccess = ({ target }) => {
    db = target.result
    if (navigator.onLine) {
        checkDataBase();
    }
};

//es6 syntax 
//request.onupgradeneeded = ({target}) => {
// let db = target.result;
// ...
//}
request.onupgradeneeded = function (event) {
    // create object store called "pending" and set autoIncrement to true
    let db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};


request.onerror = function (event) {
    console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction(["pending"], "readwrite");

    const store = transaction.objectStore("pending");

    store.add(record);
};

function checkDataBase() {
    const transaction = db.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content - Type": "application/json"
                }
                    .then(response => {
                        return response.JSON
                    })
                    .then(() => {
                        const transaction = db.transaction(["pending"], "readwrite");
                        const store = transaction.objectStore("pending");

                        store.clear();
                    })
            })
        }
    }
};

window.addEventListener("online", checkDataBase());