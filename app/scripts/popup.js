'use strict';

const baseURL = 'https://multisozluk.herokuapp.com';

if (document.location.hash.length > 0) {
    tureng(document.location.hash.substr(1));
} else {
    chrome.storage.sync.get({
        autoSelect: true
    }, function (items) {
        if (items.autoSelect == true) {
            chrome.tabs.executeScript({
                code: 'var selection = window.getSelection();if (selection.toString().length > 0){window.getSelection().toString();}else {selection.modify("move", "backward", "word");selection.modify("extend", "forward", "word");window.getSelection().toString();}'
            }, function (selection) {
                let selected = selection[0].trim();
                document.getElementById('search-input').value = selected;
                if (selected.length > 0) tureng(selected);
            });
        }
    });
}

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
  `);

  document.getElementById('loading').style.display = 'none';
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
                            const word = ($(el.target).parent().parent().find(':nth-child(2) a')).text();

                            const definition = ($(el.target).parent().parent().find(':nth-child(3) a')).text();

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

                                    if (response.error == 'token_expired') {
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

                                    if (response.status == 'already_in_list') {
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

function putDifficultyIndex(str) {
    chrome.storage.sync.get({
        difficultyIndex: false
    }, function (items) {
        if (items.difficultyIndex) {
            $.ajax({
                url: 'http://www.dictionary.com/browse/' + str,
                type: 'GET',
                success: function (data) {
                    const difficulty = $(data).find('#difficulty-box');

                    if (difficulty.length > 0) {
                        $('#content .difficulty').prepend(`<p class="text-right"><span class="badge badge-pill badge-info" id="difficultyIndex" title="dictionary.com'daki zorluk indeksi: ${safeResponse.cleanDomString(difficulty.data('difficulty'))}">${safeResponse.cleanDomString(difficulty.find('.subtext')[0].innerText)}</a></span></p>`);
                    }

                    $('#difficultyIndex').click(function () {
                        window.open('http://dictionary.com/browse/' + str, '_blank');
                    });
                }
            });
        }
    })
}

function sanitize(str) {
  document.getElementById('content').innerHTML = '';

  document.getElementById('search-input').value = str;

  //str = encodeURIComponent(str);

  document.getElementById('loading').style.display = 'block';

  document.getElementsByClassName('inner-shadow')[0].style.backgroundColor = '#'+((1<<24)*Math.random()|0).toString(16);
  $('.pie, .dot span').css('background-color', '#'+((1<<24)*Math.random()|0).toString(16) );

  return str;
}

function wordnikAudio (str) {
  $.ajax({
    url: 'http://api.wordnik.com:80/v4/word.json/' + str + '/audio?useCanonical=true&limit=50&api_key=7e21be24f37babb012408010cec0c5a212312f653348938f5',
    type: 'GET',
    success: function (data) {
      if (data.length > 0) {
        for (var i = 0; i < data.length; i++) {
          $('.audio').append('<span class="fa fa-volume-up fa-2x" data-url="' + safeResponse.cleanDomString(data[i].fileUrl) + '" aria-hidden="true" title="Kelimenin telaffuzunu dinlemek için tıklayın"></span> ');

          $('.audio span')
            .on('click', function () {
              new Audio($(this).attr('data-url')).play();
              $(this).css('color', 'blue');
            });
        }
      }
    }
  });
}

function tureng(str) {
  str = sanitize(str);

  $('#content').append(`<div class="row">
              <div class="col">
                    <div class="audio"></div>
              </div>
              <div class="col">
                <div class="difficulty"></div>
              </div>
            </div>`);

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
            <a href="#" class="list-group-item list-group-item-action">${safeResponse.cleanDomString(el.textContent.trim())}</a>
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
                  <th>${safeResponse.cleanDomString($(eachRow[0]).find('.c2').text())}</th>
                  <th>${safeResponse.cleanDomString($(eachRow[0]).find('.c3').text())}</th>
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
            <th scope="row" class="align-middle"">${safeResponse.cleanDomString(e.usage)}</th>
            <td><a data-href="${safeResponse.cleanDomString(e.word)}">${safeResponse.cleanDomString(e.word)}</a> ${safeResponse.cleanDomString(e.type) != '' ? '<small>(' + safeResponse.cleanDomString(e.type) + ')</small>' : '' }</td>
            <td><a data-href="${safeResponse.cleanDomString(e.definition)}">${safeResponse.cleanDomString(e.definition)}</a> ${safeResponse.cleanDomString(e.definitionType) != '' ? '<small>(' + safeResponse.cleanDomString(e.definitionType) + ')</small>' : '' }</td>
          </tr>
          `);
          })
        });
        $('table thead').click(function (e) {
          const getParentTable = $(e.target).parent().parent().parent()[0];
          $(getParentTable).find('tbody').first().fadeToggle('fast')
        });

        $('table tbody a').click(function (e) {
          tureng($(this).data('href'));
        });

        injectMSW('tureng');

        putDifficultyIndex(str);

        wordnikAudio(str);

      }
    }
  }).done(()=>document.getElementById('loading').style.display = 'none');
}


function tdk(str) {
  str = sanitize(str);

  $.ajax({
    url: 'http://www.tdk.gov.tr/index.php?option=com_gts&arama=gts&kelime=' + str,
    type: 'GET',
    complete: function(xhr) {
      if (xhr.status != 200) {
        notFound(str);
      }
    },
    success: function (data) {
      if ($(data).find('table[id=hor-minimalist-a]').length < 1 && $(data).find('table[id=hor-minimalist-c]').length < 1) { // suggestion ya da kelimenin anlamı bulunamadıysa
        notFound(str);
      }
      else {
        if ($(data).find('table[id=hor-minimalist-c]').length > 0) {
          $('#content')
            .append(safeResponse.cleanDomString($(data).find('table[id=hor-minimalist-c]').html()))
            .append('<hr />');
          $("table[id=hor-minimalist-c]").each(function () {
            $(this).removeAttr('width');
          });
        }
        for (var i = 0; i < $(data).find('table[id=hor-minimalist-a]').length; i++) {
          $('#content').append(safeResponse.cleanDomString($(data).find('table[id=hor-minimalist-a]')[i].outerHTML)).append('<hr />');
        }
        $("table[id=hor-minimalist-a]").each(function () {
          $(this).removeAttr('width')
        });
      }

      $('#content').find('a[target!="_blank"]')
        .on('click', function (e) {
          e.preventDefault();
          document.getElementById('search-input').value = $(this).text();
          tdk($(this).text());
        })
        .prepend('<br />');
    }
  }).done(()=>document.getElementById('loading').style.display = 'none');
}



function eksi(str, page) {
  str = sanitize(str);

  const xhr = new XMLHttpRequest();
  if (typeof page !== 'undefined') {
    xhr.open("GET", page, true);
  } else {
    xhr.open("GET", 'https://eksisozluk.com/?q=' + str, true); // pagination icin ?q='dan feragat.
  }
  xhr.onreadystatechange = function () {
    document.getElementById('loading').style.display = 'none';

    if (xhr.statusCode == 404) {
      notFound(str);
      return false;
    }

    if (xhr.readyState == 4) {
      const responseURL = xhr.responseURL.split('?')[0];

      const data = xhr.responseText;

      if ($(data).find('#entry-list li').length < 1) {
        $('#content').html(`<p>Aradığınız <strong>kelimeyi Ekşi Sözlük'te bulamadık!</strong> :( <br> Kelimedeki ekleri silmek belki yardımcı olabilir ya da <a target="_blank" href="https://www.google.com/search?q=${str}">Google <i class="fi-eject"></i></a> </p>`);

        if ($(data).find('a.suggested-title').length > 0) {

          $('#content').append(`<p>Aşağıdaki aradığınız şey olabilir mi?</p>`);
          $('#content').append(safeResponse.cleanDomString($(data).find('a.suggested-title').parent().html()));
        }
      }
      else {
        for (var i = 0; i < $(data).find('#entry-list li').length; i++) {
          const entry = safeResponse.cleanDomString($(data).find('#entry-list li')[i].outerHTML);
          $('#content').append($(entry).find('.content'));

          const auth_info = `<div class="text-right">
    <p class="auth_info">${$(entry).find('.info .entry-author')[0].outerHTML} ${$(entry).find('.info .entry-date')[0].outerHTML}</p>
</div>`;
          $('#content').append(auth_info).append(`<hr />`);
        }

        if ($(data).find('.pager').length > 0) {
          $('#content').append(`<select class="pager">`);

          const currPage = $(data).find('.pager')[0].getAttribute('data-currentpage');

          for (let i = 1; i <= $(data).find('.pager')[0].getAttribute('data-pagecount'); i++) {
            if (i == currPage) {
              $('#content .pager').append(`<option value="${responseURL}?p=${i}" selected>${i}</option>`);
            }
            else {
              $('#content .pager').append(`<option value="${responseURL}?p=${i}">${i}</option>`);
            }
          }

          $('#content .pager').on('change', function (e) {
            //var optionSelected = $("option:selected", this);
            const valueSelected = this.value;
            eksi(str, valueSelected);
          });
        }

        $('.auth_info a').on('click', function (e) {
          e.preventDefault();
          window.open('https://eksisozluk.com' + $(this).attr('href'))
        });

        $('.content a[class=url]').on('click', function (e) {
          e.preventDefault();
          window.open($(this).attr('href'))
        });
      }
      $('.content a[class=b], a.suggested-title').on('click', function (e) {
        e.preventDefault();
        document.getElementById('search-input').value = $(this).text();
        eksi($(this).text());
      });
    }
  };
  xhr.send();
}

function urban(str) {
  str = sanitize(str);

  $.ajax({
    url: 'http://www.urbandictionary.com/define.php?term=' + str,
    type: 'GET',
    success: function (data) {
      if ($(data).find('.no-results').length > 0) {
        notFound(str);
      }
      else {
        const meanings = $(data).find(".meaning");
        const examples = $(data).find(".example");

        for (let i = 0; i < meanings.length; i++) {
          $('#content').append(`<strong>${safeResponse.cleanDomString(meanings[i].outerHTML)}</strong><em>${ safeResponse.cleanDomString(examples[i].outerHTML) }</em><hr/>`);
        }
      }

      $('#content').find('.meaning a, .example a').on('click', function (e) {
        e.preventDefault();
        urban($(this).text());
      });
    }
  }).done(()=>document.getElementById('loading').style.display = 'none');
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('tureng').addEventListener('click', ()=>{
    tureng(document.getElementById('search-input').value);
  });

  document.getElementById('tdk').addEventListener('click', ()=>{
    tdk(document.getElementById('search-input').value);
  });

  document.getElementById('eksi').addEventListener('click', ()=>{
    eksi(document.getElementById('search-input').value);
  });

  document.getElementById('urban').addEventListener('click', ()=>{
    urban(document.getElementById('search-input').value);
  });

  document.getElementById('settings').addEventListener('click', ()=>{

    window.open('options.html');
  });

  document.getElementById('search-input').addEventListener('keydown', function (e) {
    if (e.keyCode == 13 && event.shiftKey) {
      tdk(document.getElementById('search-input').value);
      return false;
    }

    if (e.keyCode == 13 && event.ctrlKey) {
      eksi(document.getElementById('search-input').value);
      return false;
    }

    if (e.keyCode === 13) {
      tureng(document.getElementById('search-input').value);
    }
  });

    $('[data-toggle="tooltip"]').tooltip();

});