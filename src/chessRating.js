/**
 * Created: 2016-01-23
 * Author: Bierema Boyz Programming
 * Copyright (c) 2016 Bierema Boyz Programming. All rights reserved.
 * @license MIT
 */

window.onerror =
  function(type, file, lineNumber) {
    alert('Fatal error: ' + file + ':' + lineNumber + ': ' + type);
  };

!function() {
  if (!window.d3) {
    alert(
      'The d3 library did not successfully load. Is the d3.min.js file located '
        + 'in the lib folder that is in the same folder as gradeSheets.js?'
    );
  }

  var files = { games: {}, players: {} };
  var scores;

  var fileParserURL;
  function createFileParserWorker() {
    var result;
    try {
      result = new Worker("lib/parseDSV.js");
    }
    catch (exception) {
      fileParserURL =
        fileParserURL
          || URL.createObjectURL(
              new Blob(
                ['(' + bieremaBoyz.chessRatings.parseDSV + ').call(self);'])
            )
      result = new Worker(fileParserURL);
    }
    result.postMessage(
      {
        documentLocation:
          document.location
              .href
              .substring(0, document.location.href.lastIndexOf('/'))
            + '/lib/'
      }
    );
    result.onmessage =
      function(event) {
        if (event.data.error) {
          if (files.games.file && event.data.file === files.games.file.name) {
            files.games.error = event.data.error;
          }
          else if (
            files.players.file && event.data.file === files.players.file.name)
          {
            files.players.error = event.data.error;
          }
        }
        else {
          scores = event.data;
        }
        scheduleUpdateOutput();
      };
    result.onerror =
      function(event) {
        alert(
          'Unexpected error: ' + event.filename + ':' + event.lineno + ': '
            + event.message);
        event.preventDefault();
      };
    return result;
  }
  var fileParserWorker = createFileParserWorker();

  var updateIsScheduled = false;

  function scheduleUpdateOutput() {
    if (!updateIsScheduled) {
      updateIsScheduled = true;
      setTimeout(updateOutput, 0);
    }
  }

  function updateOutput() {
    updateIsScheduled = false;

    var output = d3.selectAll('#output');
    var errorsDiv = d3.select('#errors');
    var errorsArray = [];
    if (files.games.error) {
      errorsArray.push(files.games.error);
    }
    if (files.players.error) {
      errorsArray.push(files.players.error);
    }
    var errors =
      errorsDiv.selectAll('.error')
        .data(errorsArray);
    errors.enter().append('p').classed('error', true);
    errors.text(function(d) { return d; });
    errors.exit().remove();

    if (scores) {
      var updatedScores =
        output.select('#results')
          .select('table')
          .selectAll('tr')
          .data(scores.games);
      var newRows = updatedScores.enter().append('tr');
      newRows.append('td').classed('scoreName', true);
      newRows.append('td').classed('score', true);
      updatedScores.select('.scoreName').text(function(d) { return d.name; });
      updatedScores.select('.score').text(function(d) { return d.rating; });
      updatedScores.exit().remove();
      d3.select('#save').attr('disabled', null);
    }
    else {
      d3.select('#save').attr('disabled', 'true');
    }
  }

  function setUp() {
    var input = d3.select('#input');
    var readFile = function(fileType) {
      if (files[fileType].reader) {
        files[fileType].reader.abort();
      }
      files[fileType].reader = new FileReader();
      files[fileType].reader.onerror =
        function() {
          files[fileType].error =
            'Error reading file '
              + files[fileType].file.name
              + ': '
              + d.data.reader.error;
          delete files[fileType].reader;
          scheduleUpdateOutput();
        };
      files[fileType].reader.onload =
        function(event) {
          fileParserWorker.postMessage(
            { file: files[fileType].file, tournament: fileType === 'games' });
          fileParserWorker.postMessage(event.target.result);
        };
      files[fileType].reader.readAsArrayBuffer(files[fileType].file);
    };
    var onFileChange = function(fileType) {
      return function() {
        delete files[fileType].error;
        files[fileType].file = d3.event.target.files[0];
        readFile(fileType);
        scheduleUpdateOutput();
      };
    };
    var onGamesFileChange = onFileChange('games');
    files.games.file =
      input.select('#gamesInput')
          .on('input', onGamesFileChange)
          .on('change', onGamesFileChange)
        .property('files')[0];
    var onPlayersFileChange = onFileChange('players');
    files.players.file =
      input.select('#playersInput')
          .on('input', onPlayersFileChange)
          .on('change', onPlayersFileChange)
        .property('files')[0];
    d3.select('#save')
        .on('click', function() { saveAs(scores.newPlayers, "ratings.csv"); });

    input.style('display', null);

    if (files.games.file) {
      readFile('games');
    }
    if (files.players.file) {
      readFile('players');
    }

    scheduleUpdateOutput();
  }

  setUp();
}();