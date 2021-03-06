Chess Rating Calculator
=======================

The Chess Rating Calculator is a JavaScript application to compute ratings for
tournament chess games, using a modified version of the USCF ranking system. The
changes are designed to better model the strengths of young players competing
infrequently, at an annual tournament.

Compatibility
-------------

The application has been tested on Google Chrome 47, Mozilla Firefox 43, and
Internet Explorer 11. Other browsers and earlier versions of these browsers
might behave unexpectedly and are not recommended.

CSVs and TSVs are both supported. The encoding should be either US-ASCII or
UTF-16. BOMs are permitted, but the only supported byte order is the platform
byte order where the generator application is run. If you are on a Windows
computer and using Microsoft Excel to create your DSVs, you should be able to
choose either "CSV (Comma delimited)" (although this is not recommended since it
only supports ASCII characters) or "Unicode text" as the file type. However, the
application saves the ratings file using UTF-8 encoding but cannot read this
encoding when loading it, so if the ratings file will be imported, the user must
either manually convert it to UTF-16 or restrict use to ASCII characters.

Setup
-----

The application's home page is
https://github.com/BieremaBoyzProgramming/chessRating/ . The current version of
the application can be downloaded directly using the URL
https://github.com/BieremaBoyzProgramming/chessRating/blob/master/chessRating.zip?raw=true
. Once the ZIP file has been saved, extract it; on Windows, this can be done by
right-clicking on the ZIP file and choosing "Extract All."

* If you are updating the application from a previous version, we recommend that
  you delete the previous version first rather than extracting the new version
  over top of the old version; this will ensure that you do not retain files
  that are no longer needed. However, if you do this, be sure that you do not
  simultaneously delete files you want to keep, such as any CSVs that you have
  saved in the folder you are deleting.

Creating the DSVs
-----------------

An example DSV has been provided in the "examples" folder. This indicates the
required components of the DSV, including columns labeled "White," "Winner,"
and "Black." Any row with a missing field will be ignored. Be sure to save the
DSV using one of the formats listed under "Compatibility" above.

Calculating the ratings
-----------------------

To run the application, open chessRating.html using one of the supported web
browsers. If you see a warning about JavaScript being disabled, make sure it is
enabled. You should see options to browse to choose the DSVs; if not, make sure
you are using an extracted version of the application rather than using the file
directly out of the ZIP file.

If you modify a file after loading it with the application, the application can
retrieve the updated file, but the method varies across browsers. One option is
to refresh the page and then re-select the files to be loaded. Alternatively,
Internet Explorer and Firefox update the files if the user reselects them from
the file browser field; Chrome and Edge do not do this unless the user deselects
the modified file and then reselects it. Firefox makes it the easiest; simply
refresh the page, and the same files will be re-loaded automatically.

Since Firefox does not automatically deselect files when you refresh the page,
if you want to deselect the rating file, you have to close the tab and open the
page again.