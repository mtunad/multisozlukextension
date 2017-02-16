'use strict';

const baseURL = 'http://multisozluk.app';

chrome.tabs.executeScript({
    code: 'var selection = window.getSelection();if (selection.toString().length > 0){window.getSelection().toString();}else {selection.modify("move", "backward", "word");selection.modify("extend", "forward", "word");window.getSelection().toString();}'
}, function (selection) {

    let selected = selection[0].trim();
    document.getElementById('search-input').value = selected;
    if (selected.length > 0) tureng(selected);

});

function refreshTooltips() {
    $('[data-toggle="tooltip"]').tooltip();
}

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

function injectMSW(dictionary = 'tureng') {

    chrome.storage.sync.get({
        jwt: '',
    }, function(items) {
        if (items.jwt.length > 3) {
            if (dictionary == 'tureng') {
                $('table').each(function (i, el) {
                    $(el).find('tr:not(:first)').append(`<td class="text-center"><i class="fa fa-bookmark-o bookmark" aria-hidden="true"></i></td>`);
                    $(el).find('thead tr').append(`<th></th>`);

                });

                $('.bookmark').click((el)=>{
                    if ($(el.target).hasClass('fa-bookmark') || $(el.target).hasClass('fa-bookmark-o')) {
                        if ($(el.target).hasClass('fa-bookmark-o')) {
                            const word = ($(el.target).parent().parent().find(':nth-child(2)'))
                                .clone().children().remove().end().text().trim();

                            const definition = $(el.target).parent().parent().find('td').eq(1)
                                .clone().children().remove().end().text().trim();

                            const direction = $(el.target).parent().parent().parent().parent().find('thead th').eq(1).text() == 'İngilizce' ? 'tr' : 'en';


                            $.ajax({
                                method: 'POST',
                                url: baseURL + '/api/tureng' + '?name=' + word + '&direction=' + direction  + '&definition='  + definition,
                                headers: {
                                    'Authorization': 'Bearer ' + items.jwt
                                },
                                beforeSend: function () {
                                    $(el.target).removeClass('fa-bookmark-o').removeClass('fa-bookmark').addClass('fa-refresh fa-spin fa-fw');
                                },
                                complete: function (data) {
                                    const response = JSON.parse(data.responseText);
                                    $(el.target).removeClass('fa-refresh fa-spin fa-fw');

                                    if (response.error == "token_expired") {
                                        console.log('Yeniden token almaniz gerekiyor');

                                        $('body').append(
                                            `<div class="modal fade bd-example-modal-sm" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true" id="myModal">
                                          <div class="modal-dialog modal-sm">
                                            <div class="modal-content">
                                              <div class="modal-header">
                                                <h5 class="modal-title" id="exampleModalLabel">token_expired</h5>
                                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                  <span aria-hidden="true">&times;</span>
                                                </button>
                                              </div>
                                              <div class="modal-body">
                                                    Yeniden token almaniz gerekiyor
                                              </div>
                                            </div>
                                          </div>
                                        </div>`);
                                        $('#myModal').modal('show');
                                    }

                                    if (response.status == "already_in_list") {
                                        console.log('Oge halihazirda listenizde mevcut');
                                        $(el.target).attr('data-toggle', 'tooltip')
                                            .attr('data-placement','left')
                                            .attr('title', 'Oge halihazirda listenizde mevcut');
                                        refreshTooltips();
                                    }
                                }
                            })
                                .done(function( msg ) {
                                    $(el.target).addClass('fa-bookmark');
                                    $(el.target).css('color', 'green');
                                });
                        }


                    }


                });

            }
        }
    });
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
            <table class="table table-striped table-hover">
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
            <td>${e.word} ${e.type != '' ? '<small>(' + e.type + ')</small>' : '' }</td>
            <td>${e.definition} ${e.definitionType != '' ? '<small>(' + e.definitionType + ')</small>' : '' }</td>
          </tr>
          `);
          })
        });
        $( "table thead" ).click(function (e) {
          const getParentTable = $(e.target).parent().parent().parent()[0];
          $(getParentTable).find('tbody').first().fadeToggle('fast')
        });

        injectMSW('tureng');

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

    $('[data-toggle="tooltip"]').tooltip();

});