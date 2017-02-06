'use strict';

$('.navbar-brand small').first().html(chrome.runtime.getManifest().version);

function save_options() {
    const webToken = document.getElementById('webToken').value;
    chrome.storage.sync.set({
        jwt: webToken,
    }, function() {
        const status = document.querySelector('#webTokenOption button');
        status.textContent = 'Kaydedildi!';
        setTimeout(function() {
            status.textContent = 'Kaydet';
        }, 750);
    });
}

function restore_options() {
    chrome.storage.sync.get({
        jwt: '',
    }, function(items) {
        document.getElementById('webToken').value = items.jwt;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#webTokenOption button').addEventListener('click',
    save_options);

document.querySelector('#webTokenOption input').addEventListener('click',function () {
    this.select();
});