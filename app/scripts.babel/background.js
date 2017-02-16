'use strict';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

// chrome.browserAction.setBadgeText({text: '\'Allo'});

console.log('\'Allo \'Allo! Event Page for Browser Action');

chrome.storage.sync.get({
  rightClickMenu: false
}, function(items) {
  if (items.rightClickMenu) createContextMenu();
    console.log(items.rightClickMenu);
    
});

function createContextMenu() {
  chrome.contextMenus.create({
      title: 'Sözlükte %s',
      contexts: ['selection'],
      onclick: function(info, tab){
          chrome.tabs.create(
              {'url' : 'chrome-extension://' + chrome.runtime.id + '/popup.html#' + info.selectionText }
          );
      }
  });
}


