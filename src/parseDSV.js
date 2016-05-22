/**
 * Created: 2016-01-23
 * Author: Bierema Boyz Programming
 * Copyright (c) 2016 Bierema Boyz Programming. All rights reserved.
 * @license MIT
 */

var bieremaBoyz = bieremaBoyz || {};
bieremaBoyz.chessRatings = bieremaBoyz.chessRatings || {};

bieremaBoyz.chessRatings.parseDSV =
  function() {
    var CENTER_RATING = 1200;

    function asciiDecoder(buffer) {
      return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }
    function ucs2Decoder(buffer) {
      return (
        String.fromCharCode
          .apply(
            null,
            buffer.byteLength >= 2
                && 0xFEFF === (new Uint16Array(buffer, 0, 2))[0]
              ? new Uint16Array(buffer, 2)
              : new Uint16Array(buffer)
          )
      );
    }

    var file, tournament, games = {}, players = {};

    function provisionalWinningExpectancy(rating, opponentRating) {
      return (
        rating >= opponentRating + 400
          ? 1
          : (rating <= opponentRating - 400
              ? -1
              : (rating - opponentRating) / 400));
    }

    onmessage = function(event) {
      var i;

      if (event.data.documentLocation) {
        importScripts(event.data.documentLocation + 'd3.min.js');
      }
      else if (event.data.file) {
         file = event.data.file;
         tournament = event.data.tournament;
      }
      else {
        var uInt8Array =
          new Uint8Array(event.data, 0, Math.min(3, event.data.byteLength));
        var decoders = [];
        if (
          event.data.byteLength < 2
            || 0xFEFF
                !== (
                  new Uint16Array(
                    event.data,
                    0,
                    Math.min(2, event.data.byteLength))
                  )[0]
        ) {
          decoders.push(asciiDecoder);
        }
        if (
          !(
            event.data.byteLength % 2
              || [0xEF, 0xBB, 0xBF]
                  .every(function(b, i) { return b === uInt8Array[i]; })
          )
        ) {
          decoders.push(ucs2Decoder);
        }
        var parsers =
          file.type === 'text/csv' || /\.csv$/i.test(file.name)
            ? [d3.tsv, d3.csv]
            : [d3.csv, d3.tsv];
        var parserDecoders = [];
        parsers.forEach(
          function(parser) {
            decoders.forEach(
              function(decoder) {
                parserDecoders.push({ parser: parser, decoder: decoder });
              }
            )
          }
        );
        var errors = [];
        while (parserDecoders.length) {
          var parserDecoder = parserDecoders.pop();
          var rows =
            parserDecoder.parser.parse(
              parserDecoder.decoder(event.data),
              function(d) {
                var key, result = {};
                for (key in d) {
                  if (Object.prototype.hasOwnProperty.call(d, key)) {
                    result[key.toLowerCase()] = d[key];
                  }
                }
                return result;
              }
            );
          if (!rows.length) {
            errors.push('No data rows were found.');
            continue;
          }
          var error = null;
          if (tournament) {
            games = {};
            if (!rows[0].hasOwnProperty('winner')) {
              errors.push('No "winner" column could be found.');
              continue;
            }
            rows.forEach(
              function(row) {
                if (row.winner && row.white && row.black) {
                  if (!games[row.white]) {
                    games[row.white] = [];
                    games[row.white].duplicates = 0;
                  }
                  if (!games[row.black]) {
                    games[row.black] = [];
                    games[row.black].duplicates = 0;
                  }
                  var score, winner = row.winner.toLowerCase();
                  if (winner === 'w' || winner === 'white') {
                    score = 1;
                  }
                  else if (winner === 'b' || winner === 'black') {
                    score = -1;
                  }
                  else if (
                    winner === 't'
                      || winner === 'tie'
                      || winner === 'd'
                      || winner === 'draw')
                  {
                    score = 0;
                  }
                  else {
                    error = 'Winner "' + winner + '" is not recognized.';
                    return;
                  }
                  games[row.white].push({ opponent: row.black, score: score });
                  games[row.black].push({ opponent: row.white, score: -score });
                }
              }
            );
            if (error) {
              errors.push(error);
              continue;
            }
          }
          else {
            players = {};
            if (!rows[0].hasOwnProperty('name')) {
              errors.push('No "name" column could be found.');
              continue;
            }
            rows.forEach(
              function(row) {
                if (row.name) {
                  players[row.name] =
                    {
                      name: row.name,
                      rating: +row.rating,
                      games: +row.games,
                      consistent: +row.consistent
                    };
                }
              }
            );
          }
          var name;
          var averageRating = 0;
          var ratedPlayersCount = 0;
          var ratingOffset;

          for (name in games) {
            if (
              Object.prototype.hasOwnProperty.call(games, name)
                && Object.prototype.hasOwnProperty.call(players, name))
            {
                averageRating += players[name].rating;
                ratedPlayersCount++;
            }
          }
          if (ratedPlayersCount) {
            averageRating /= ratedPlayersCount;
            ratingOffset = CENTER_RATING - averageRating;
          }

          for (name in games) {
            if (Object.prototype.hasOwnProperty.call(games, name)) {
              if (Object.prototype.hasOwnProperty.call(players, name)) {
                games[name].initialRating = players[name].rating + ratingOffset;
                games[name].gameCount = players[name].games;
              }
              else {
                games[name].initialRating = CENTER_RATING;
                games[name].gameCount = 0;
              }
              games[name].currentRating = games[name].initialRating;
              games[name].nextRating = games[name].initialRating;
              games[name].effectiveGames = games[name].gameCount / 2;

              var score = 0;
              games[name].forEach(
                function(game) {
                  games[name].noBonus = games[game.opponent].duplicates++ > 1;
                  score += game.score;
                }
              );
              games[name].forEach(
                function(game) { games[game.opponent].duplicates = 0; });
              games[name].consistent = score / games[name].length;
              if (
                Math.abs(games[name].consistent) < 1
                  || Object.prototype.hasOwnProperty.call(players, name)
                      && players[name].consistent !== games[name].consistent
                      && games[name].gameCount > 0)
              {
                games[name].consistent = 0;
              }
            }
          }

          var specialRating = function(name, effectiveGames) {
            var knots = [];
            var score = 0;

            games[name].forEach(
              function(game) {
                var opponentRating = games[game.opponent].currentRating;
                knots.push(opponentRating + 400, opponentRating - 400);
                score += game.score;
              }
            );

            var rating = games[name].initialRating;
            var adjustedInitialRating, adjustedScore;
            if (
              games[name].gameCount <= 0
                || !Object.prototype.hasOwnProperty.call(players, name)
                || players[name].consistent === 0)
            {
              adjustedInitialRating = rating;
              adjustedScore = score;
            }
            else if (players[name].consistent > 0) {
              adjustedInitialRating = rating - 400;
              adjustedScore = score + games[name].effectiveGames;
            }
            else {
              adjustedInitialRating = rating + 400;
              adjustedScore = score - games[name].effectiveGames;
            }

            if (effectiveGames > 0) {
              knots.push(
                adjustedInitialRating + 400,
                adjustedInitialRating - 400);
            }

            var objectiveFunction = function(newRating) {
              var total = -adjustedScore;
              games[name].forEach(
                function(game) {
                  total +=
                    provisionalWinningExpectancy(
                      newRating,
                      games[game.opponent].currentRating);
                }
              );
              total +=
                provisionalWinningExpectancy(newRating, adjustedInitialRating)
                  * effectiveGames;
              return total;
            };

            knots.sort(function(a, b) { return a - b; });

            var objective = objectiveFunction(rating);
            for (i = knots.length - 1; i >= 0; i--) {
              if (knots[i] <= rating) {
                break;
              }
            }

            var newObjective;
            var lastRating;
            if (objective < 0) {
              newObjective = objective;
              while (newObjective < 0) {
                lastRating = rating;
                rating = knots[++i];
                objective = newObjective;
                newObjective = objectiveFunction(rating);
              }
              if (newObjective > 0) {
                rating =
                  (-objective)
                      / (newObjective - objective) * (rating - lastRating)
                    + lastRating;
              }
            }
            else if (objective > 0) {
              newObjective = objective;
              while (newObjective > 0) {
                lastRating = rating;
                rating = knots[i--];
                objective = newObjective;
                newObjective = objectiveFunction(rating);
              }
              if (newObjective < 0) {
                rating =
                  (-objective)
                      / (newObjective - objective) * (rating - lastRating)
                    + lastRating;
              }
            }

            return rating;
          };

          for (name in games) {
            if (
              Object.prototype.hasOwnProperty.call(games, name)
                && !players[name])
            {
              games[name].nextRating = specialRating(name, 1);
            }
          }

          var iterateScores = function() {
            for (name in games) {
              if (Object.prototype.hasOwnProperty.call(games, name)) {
                games[name].currentRating = games[name].nextRating;
              }
            }

            for (name in games) {
              if (Object.prototype.hasOwnProperty.call(games, name)) {
                games[name].nextRating =
                  specialRating(name, games[name].effectiveGames);
              }
            }
          };

          iterateScores();
          iterateScores();

          var newPlayers = [];
          var result = [];
          for (name in games) {
            if (Object.prototype.hasOwnProperty.call(games, name)) {
              result.push(
                {
                  name: name,
                  rating: Math.round(games[name].nextRating)
                }
              );
              newPlayers.push(
                {
                  name: name,
                  rating: games[name].nextRating.toFixed(20),
                  games: games[name].gameCount + games[name].length,
                  consistent: games[name].consistent
                }
              );
            }
          }
          for (name in players) {
            if (
              Object.prototype.hasOwnProperty.call(players, name)
                && !Object.prototype.hasOwnProperty.call(games, name))
            {
              newPlayers.push(players[name]);
            }
          }
          var blob =
            new Blob(
              [d3.csv.format(newPlayers)],
              { type: 'text/csv' });

          result.sort(function(a, b) { return b.rating - a.rating; });

          postMessage(
            { games: result, oldPlayers: players, newPlayers: blob });
          return;
        }
        errors.unshift(
          ': The following error messages resulted while attempting to use '
            + 'various encodings and delimiters:');
        postMessage(
          {
            error: 'Error parsing file ' + file.name + errors.join('<br>'),
            file: file.name
          }
        );
      }
    };
  };

if (typeof window === 'undefined') {
  bieremaBoyz.chessRatings.parseDSV();
}