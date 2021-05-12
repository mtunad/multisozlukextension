'use strict';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

// chrome.browserAction.setBadgeText({text: '\'Allo'});

chrome.storage.sync.get({
  rightClickMenu: false
}, function(items) {
  if (items.rightClickMenu) createContextMenu();
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


