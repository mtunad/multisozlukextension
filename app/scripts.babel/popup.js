'use strict';

document.addEventListener('DOMContentLoaded', ()=>{
  var request = new XMLHttpRequest();
  request.open('GET', 'http://tureng.com/search/word', true);
  request.onreadystatechange = () => {
    if(request.readyState === 4) {
      if(request.status === 200) {
        const data = request.responseText;
        const response = $(data).find('.searchResultsTable');

        for (let i = 0; i < response.length; i++) {
          $('#content')
            .append(response[i].outerHTML);
        }

      } else {
        // TODO: error in your conn
      }
    }
  };

  request.send();
});
