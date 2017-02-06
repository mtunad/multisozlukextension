'use strict';

chrome.tabs.executeScript({
  code: 'var selection = window.getSelection();if (selection.toString().length > 0){window.getSelection().toString();}else {selection.modify("move", "backward", "word");selection.modify("extend", "forward", "word");window.getSelection().toString();}'
}, function (selection) {
  let selected = selection[0].trim();
  document.getElementById('search-input').value = selected;
  if (selected.length > 0) tureng(selected);
});

function Word(id, usage, word, type, definition, definitionType) {
  this.id = id;
  this.usage = usage;
  this.word = word;
  this.type = type;
  this.definition = definition;
  this.definitionType = definitionType;
}

function notFound(str) {
  $('#content').html(`
    <div class="alert alert-warning" role="alert">
      <strong>Maalesef,</strong> bir sonuç bulamadık, kelimeyi basitleştirmeyi deneyin ya da <a href="https://www.google.com/search?q=${str}" target="_blank" ><i class="fa fa-google" aria-hidden="true"></i>oogle</a>
    </div>
  `)
}

function tureng(str) {
  document.getElementById('search-input').value = str;

  str = encodeURIComponent(str);

  $('#content').html();


  document.getElementById('content').innerHTML = '';
  document.getElementById('loading').style.display = 'block';

  document.getElementsByClassName('inner-shadow')[0].style.backgroundColor = '#'+((1<<24)*Math.random()|0).toString(16);
  $('.pie, .dot span').css('background-color', '#'+((1<<24)*Math.random()|0).toString(16) );

  $.get({
    url: 'http://tureng.com/tr/turkce-ingilizce/' + str,
    complete: function(xhr) {
      if (xhr.status != 200) {
        notFound(str);
      }
    },
    success: (data) => {
      const checkSearchResults = $(data).find('.searchResultsTable');

      if ($(data).find('ul.suggestion-list li').length > 0 && checkSearchResults.length === 0) {
        $('#content').html(`
            <div class="list-group">
              <a href="https://www.google.com/search?q=${str}" target="_blank" class="list-group-item active">
                Bunlardan biri değilse,  <i class="fa fa-google" aria-hidden="true"></i>oogle'layın!
              </a>
            </div>
          `);

        $(data).find('ul.suggestion-list li').each((i, el) => {
          $('#content .list-group').append(`
            <a href="#" class="list-group-item list-group-item-action">${el.textContent.trim()}</a>
          `);
        });

        $('.list-group-item-action').click(function () {
          tureng($(this).text());
        });
      }

      if (checkSearchResults.length > 0) {
        $.each(checkSearchResults, function () {
          let translations = [];
          let eachRow = $(this).find('tr');

          $('#content').append(`
            <table class="table table-striped">
              <thead class="thead-default">
                <tr>
                  <th>#</th>
                  <th>${$(eachRow[0]).find('.c2').text()}</th>
                  <th>${$(eachRow[0]).find('.c3').text()}</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
            </table>
          `);

          let array = $.map(eachRow, function(value, index) {
            return [value];
          });
          console.log(array[array.length-1]);
          array.shift();
          array.forEach((el)=>{
            if ($(el).find('td').eq(0).attr('colspan') == 2 && $(el).find('td b').length > 0) {
              // subject of the word
            }

            if ($(el).find('td.rc0') != null && $(el).className == null && $(el).attr('style') == null && $(el).find('td b').length == 0) {
              const $id = $(el).children('td')[0].textContent;
              const $usage = $(el).children('td').eq(1).text().trim();
              const $word = $(el).children('td').eq(2).find('a').text().trim();
              const $type = $(el).children('td').eq(2).find('i').text().trim() != '' ? $(el).children('td').eq(2).find('i').text().trim() : '';
              const $definition = $(el).children('td').eq(3).find('a').eq(0).text().trim();
              const $definitionType = $(el).children('td').eq(3).find('i').text().trim() ? $(el).children('td').eq(3).find('i').eq(0).text().trim() : '';
              const translation = new Word($id, $usage, $word, $type, $definition, $definitionType);
              translations.push(translation);
            }
          });
          translations.forEach((e)=>{
            $('#content table tbody:last').append(`
          <tr>
            <th scope="row" class="align-middle"">${e.usage}</th>
            <td>${e.word} ${e.type != '' ? '(' + e.type + ')' : '' }</td>
            <td>${e.definition} ${e.definitionType != '' ? '(' + e.definitionType + ')' : '' }</td>
          </tr>
          `);
          })
        });
        $( "table thead" ).click(function (e) {
          const getParentTable = $(e.target).parent().parent().parent()[0];
          $(getParentTable).find('tbody').first().fadeToggle('fast')
          console.log();
        });
      }
    }
  }).done(()=>document.getElementById('loading').style.display = 'none');
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('tureng').addEventListener('click', ()=>{
    tureng(document.getElementById('search-input').value);
  });

  document.getElementById('settings').addEventListener('click', ()=>{

    window.open('options.html');
  });

  document.getElementById('search-input').addEventListener('keydown', function (e) {
    if (e.keyCode === 13) {
      tureng(document.getElementById('search-input').value);
    }
  });


});